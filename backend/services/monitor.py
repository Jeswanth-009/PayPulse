"""
Payment Monitor — APScheduler-based polling loop that detects failed/stale payments
and triggers the classifier → executor → audit pipeline.
"""

import asyncio
import logging
import time
from datetime import datetime, timedelta
from typing import Optional
from backend.config import settings
from backend.database import get_db
from backend.models.payment import Payment
from backend.models.agent import AgentStatus
from backend.services.classifier import payment_classifier
from backend.services.executor import recovery_executor
from backend.services.audit_logger import audit_logger

logger = logging.getLogger(__name__)


class PaymentMonitor:
    """
    Monitors payments for failures and orchestrates the agent loop:
    detection → classification → execution → audit
    """

    def __init__(self):
        self.is_running = False
        self.last_run_at: Optional[datetime] = None
        self.queue_size = 0
        self.total_processed = 0
        self.current_batch_id: Optional[str] = None
        self._start_time = time.time()
        self._lock = asyncio.Lock()

    def get_status(self) -> AgentStatus:
        """Return current agent status."""
        return AgentStatus(
            is_running=self.is_running,
            last_run_at=self.last_run_at,
            queue_size=self.queue_size,
            total_processed=self.total_processed,
            current_batch_id=self.current_batch_id,
            uptime_seconds=time.time() - self._start_time,
        )

    async def run_agent_loop(self, batch_id: Optional[str] = None):
        """
        Run one cycle of the agent loop:
        1. Find all failed/stale payments
        2. Classify each
        3. Execute recovery
        4. Log everything
        """
        async with self._lock:
            if self.is_running:
                logger.info("Agent loop already running, skipping")
                return

            self.is_running = True
            self.current_batch_id = batch_id

        try:
            db = await get_db()

            # Find failed payments that haven't been fully processed
            query = """
                SELECT * FROM payments
                WHERE status = 'failed'
                AND payment_id NOT IN (
                    SELECT DISTINCT payment_id FROM audit_log
                    WHERE event_type = 'action_taken'
                    AND outcome IN ('exhausted', 'escalated', 'dispatched')
                )
            """
            params = []

            if batch_id:
                query += " AND batch_id = ?"
                params.append(batch_id)

            cursor = await db.execute(query, params)
            rows = await cursor.fetchall()

            failed_payments = []
            for row in rows:
                payment = Payment(**dict(row))
                failed_payments.append(payment)

            # Also find stale payments (created but no activity)
            stale_threshold = datetime.utcnow() - timedelta(
                minutes=settings.PAYMENT_STALE_THRESHOLD_MINUTES
            )
            stale_query = """
                SELECT * FROM payments
                WHERE status = 'created'
                AND created_at < ?
                AND payment_id NOT IN (
                    SELECT DISTINCT payment_id FROM audit_log
                    WHERE event_type = 'action_taken'
                )
            """
            stale_params = [stale_threshold.isoformat()]

            if batch_id:
                stale_query += " AND batch_id = ?"
                stale_params.append(batch_id)

            cursor = await db.execute(stale_query, stale_params)
            stale_rows = await cursor.fetchall()

            for row in stale_rows:
                payment = Payment(**dict(row))
                failed_payments.append(payment)

            self.queue_size = len(failed_payments)
            logger.info("Agent loop: found %d payments to process", self.queue_size)

            # Process each payment through the pipeline
            for payment in failed_payments:
                await self._process_payment(payment)
                self.total_processed += 1
                self.queue_size -= 1
                await asyncio.sleep(0.4)  # Prevent Razorpay test mode rate-limiting

            self.last_run_at = datetime.utcnow()

            # Update batch status if applicable
            if batch_id:
                await db.execute(
                    "UPDATE batches SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE batch_id = ?",
                    (batch_id,),
                )
                await db.commit()

        except Exception as e:
            logger.error("Agent loop error: %s", e, exc_info=True)
        finally:
            self.is_running = False
            self.current_batch_id = None

    async def _process_payment(self, payment: Payment):
        """Process a single payment through the agent pipeline."""
        try:
            logger.info("Processing: %s (₹%s, %s)", payment.payment_id, payment.amount_paise / 100, payment.method)

            # Calculate time since creation
            time_since_created = 0.0
            if payment.created_at:
                delta = datetime.utcnow() - payment.created_at
                time_since_created = delta.total_seconds() / 60

            # Step 1: Log failure detection
            await audit_logger.log(
                payment_id=payment.payment_id,
                order_id=payment.order_id,
                event_type="failure_detected",
                failure_type=None,
                amount_paise=payment.amount_paise,
                llm_reasoning=f"Payment {payment.status}: {payment.error_code} — {payment.error_description}",
            )

            # Step 2: Classify with LLM (or fallback)
            classification = await payment_classifier.classify(
                payment_id=payment.payment_id,
                order_id=payment.order_id,
                error_code=payment.error_code,
                error_description=payment.error_description,
                method=payment.method,
                amount_paise=payment.amount_paise,
                attempts=payment.attempts,
                time_since_created_minutes=time_since_created,
                recovery_attempts=payment.recovery_attempts,
            )

            # Log classification
            await audit_logger.log(
                payment_id=payment.payment_id,
                order_id=payment.order_id,
                event_type="classified",
                failure_type=classification.failure_type,
                confidence=classification.confidence,
                llm_reasoning=classification.reasoning,
                action_taken=classification.recommended_action,
                amount_paise=payment.amount_paise,
            )

            # Update payment's failure_type in DB
            db = await get_db()
            await db.execute(
                "UPDATE payments SET failure_type = ?, updated_at = CURRENT_TIMESTAMP WHERE payment_id = ?",
                (classification.failure_type, payment.payment_id),
            )
            await db.commit()

            # Step 3: Execute recovery action
            result = await recovery_executor.execute_recovery(payment, classification)

            # Step 4: Log outcome
            await audit_logger.log(
                payment_id=payment.payment_id,
                order_id=payment.order_id,
                event_type="outcome",
                failure_type=classification.failure_type,
                confidence=classification.confidence,
                action_taken=result.action,
                outcome=result.outcome,
                amount_paise=payment.amount_paise,
                razorpay_response=result.razorpay_response,
            )

            # Update payment recovery attempts
            await db.execute(
                "UPDATE payments SET recovery_attempts = recovery_attempts + 1, updated_at = CURRENT_TIMESTAMP WHERE payment_id = ?",
                (payment.payment_id,),
            )
            await db.commit()

            logger.info(
                "Completed: %s → %s (%s) [conf: %.2f]",
                payment.payment_id,
                result.action,
                result.outcome,
                classification.confidence,
            )

        except Exception as e:
            logger.error("Failed to process payment %s: %s", payment.payment_id, e, exc_info=True)


# Singleton instance
payment_monitor = PaymentMonitor()
