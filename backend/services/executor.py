"""
Recovery Executor — picks and executes recovery actions via Razorpay API.
Enforces the stopping rule as the primary gate.
"""

import json
import time
import uuid
import logging
from typing import Optional
from backend.config import settings
from backend.models.agent import Classification, RecoveryResult
from backend.models.payment import Payment
from backend.services.razorpay_client import razorpay_client
from backend.services.audit_logger import audit_logger

logger = logging.getLogger(__name__)


class RecoveryExecutor:
    """
    Executes recovery actions based on classifier recommendations.
    Enforces the stopping rule: max 2 recovery attempts per payment.
    """

    async def execute_recovery(
        self,
        payment: Payment,
        classification: Classification,
    ) -> RecoveryResult:
        """
        Execute the recommended recovery action for a failed payment.
        Returns a RecoveryResult with the action taken and outcome.
        """
        # ── STOPPING RULE (primary enforcement) ──
        prior_attempts = await audit_logger.count_recovery_attempts(payment.payment_id)

        if prior_attempts >= settings.MAX_RECOVERY_ATTEMPTS:
            await audit_logger.log(
                payment_id=payment.payment_id,
                order_id=payment.order_id,
                event_type="action_taken",
                action_taken="STOP",
                failure_type=classification.failure_type,
                confidence=classification.confidence,
                llm_reasoning=f"Stopping rule triggered: {prior_attempts} prior attempts. No further recovery.",
                outcome="exhausted",
                amount_paise=payment.amount_paise,
                recovery_attempt_number=prior_attempts,
            )
            logger.info(
                "STOP: %s — %d prior attempts, stopping rule enforced",
                payment.payment_id, prior_attempts,
            )
            return RecoveryResult(action="STOP", outcome="exhausted")

        # ── Route to action handler ──
        action = classification.recommended_action
        attempt_number = prior_attempts + 1

        if action == "IMMEDIATE_RETRY":
            return await self._handle_immediate_retry(
                payment, classification, attempt_number
            )
        elif action == "DELAYED_LINK":
            return await self._handle_delayed_link(
                payment, classification, attempt_number
            )
        elif action == "ALT_METHOD":
            return await self._handle_alt_method(
                payment, classification, attempt_number
            )
        elif action == "ESCALATE":
            return await self._handle_escalate(
                payment, classification, attempt_number
            )
        elif action == "STOP":
            return await self._handle_stop(
                payment, classification, prior_attempts
            )
        else:
            logger.warning("Unknown action: %s — escalating", action)
            return await self._handle_escalate(
                payment, classification, attempt_number
            )

    async def _handle_immediate_retry(
        self,
        payment: Payment,
        classification: Classification,
        attempt_number: int,
    ) -> RecoveryResult:
        """Create and dispatch a fresh payment link immediately."""
        reference_id = f"ret_{attempt_number}_{uuid.uuid4().hex[:16]}"

        payload = {
            "amount_paise": payment.amount_paise,
            "description": f"Retry payment for order {payment.order_id} — {classification.recovery_message_hint}",
            "customer_email": payment.customer_email or "customer@example.com",
            "customer_contact": payment.customer_contact or "+919876543210",
            "reference_id": reference_id,
            "notes": {
                "original_payment_id": payment.payment_id,
                "original_order_id": payment.order_id,
                "recovery_action": "IMMEDIATE_RETRY",
                "attempt_number": str(attempt_number),
            },
        }

        result = razorpay_client.create_payment_link(**payload)

        await audit_logger.log(
            payment_id=payment.payment_id,
            order_id=payment.order_id,
            event_type="action_taken",
            failure_type=classification.failure_type,
            confidence=classification.confidence,
            llm_reasoning=classification.reasoning,
            action_taken="IMMEDIATE_RETRY",
            action_payload=payload,
            razorpay_response=result.get("data") if result["success"] else {"error": result.get("error")},
            recovery_attempt_number=attempt_number,
            outcome="dispatched" if result["success"] else "error",
            amount_paise=payment.amount_paise,
        )

        if result["success"]:
            link_data = result["data"]
            return RecoveryResult(
                action="IMMEDIATE_RETRY",
                outcome="dispatched",
                payment_link_id=link_data.get("id"),
                payment_link_url=link_data.get("short_url"),
                razorpay_response=link_data,
            )
        else:
            return RecoveryResult(
                action="IMMEDIATE_RETRY",
                outcome="error",
                error=result.get("error"),
            )

    async def _handle_delayed_link(
        self,
        payment: Payment,
        classification: Classification,
        attempt_number: int,
    ) -> RecoveryResult:
        """Create a payment link with 24-hour expiry."""
        expire_by = int(time.time()) + 86400  # 24 hours from now
        reference_id = f"del_{attempt_number}_{uuid.uuid4().hex[:16]}"

        payload = {
            "amount_paise": payment.amount_paise,
            "description": f"Payment for order {payment.order_id} — {classification.recovery_message_hint}",
            "customer_email": payment.customer_email or "customer@example.com",
            "customer_contact": payment.customer_contact or "+919876543210",
            "expire_by": expire_by,
            "reference_id": reference_id,
            "notes": {
                "original_payment_id": payment.payment_id,
                "original_order_id": payment.order_id,
                "recovery_action": "DELAYED_LINK",
                "attempt_number": str(attempt_number),
            },
        }

        result = razorpay_client.create_payment_link(**payload)

        await audit_logger.log(
            payment_id=payment.payment_id,
            order_id=payment.order_id,
            event_type="action_taken",
            failure_type=classification.failure_type,
            confidence=classification.confidence,
            llm_reasoning=classification.reasoning,
            action_taken="DELAYED_LINK",
            action_payload=payload,
            razorpay_response=result.get("data") if result["success"] else {"error": result.get("error")},
            recovery_attempt_number=attempt_number,
            outcome="dispatched" if result["success"] else "error",
            amount_paise=payment.amount_paise,
        )

        if result["success"]:
            link_data = result["data"]
            return RecoveryResult(
                action="DELAYED_LINK",
                outcome="dispatched",
                payment_link_id=link_data.get("id"),
                payment_link_url=link_data.get("short_url"),
                razorpay_response=link_data,
            )
        else:
            return RecoveryResult(
                action="DELAYED_LINK",
                outcome="error",
                error=result.get("error"),
            )

    async def _handle_alt_method(
        self,
        payment: Payment,
        classification: Classification,
        attempt_number: int,
    ) -> RecoveryResult:
        """Create a payment link prompting alternative payment methods."""
        reference_id = f"alt_{attempt_number}_{uuid.uuid4().hex[:16]}"

        payload = {
            "amount_paise": payment.amount_paise,
            "description": f"Payment for order {payment.order_id} (try card/wallet) — {classification.recovery_message_hint}",
            "customer_email": payment.customer_email or "customer@example.com",
            "customer_contact": payment.customer_contact or "+919876543210",
            "reference_id": reference_id,
            "notes": {
                "original_payment_id": payment.payment_id,
                "original_order_id": payment.order_id,
                "recovery_action": "ALT_METHOD",
                "attempt_number": str(attempt_number),
                "hint": "UPI failed — try card or wallet",
            },
        }

        result = razorpay_client.create_payment_link(**payload)

        await audit_logger.log(
            payment_id=payment.payment_id,
            order_id=payment.order_id,
            event_type="action_taken",
            failure_type=classification.failure_type,
            confidence=classification.confidence,
            llm_reasoning=classification.reasoning,
            action_taken="ALT_METHOD",
            action_payload=payload,
            razorpay_response=result.get("data") if result["success"] else {"error": result.get("error")},
            recovery_attempt_number=attempt_number,
            outcome="dispatched" if result["success"] else "error",
            amount_paise=payment.amount_paise,
        )

        if result["success"]:
            link_data = result["data"]
            return RecoveryResult(
                action="ALT_METHOD",
                outcome="dispatched",
                payment_link_id=link_data.get("id"),
                payment_link_url=link_data.get("short_url"),
                razorpay_response=link_data,
            )
        else:
            return RecoveryResult(
                action="ALT_METHOD",
                outcome="error",
                error=result.get("error"),
            )

    async def _handle_escalate(
        self,
        payment: Payment,
        classification: Classification,
        attempt_number: int,
    ) -> RecoveryResult:
        """Flag the payment for human review."""
        await audit_logger.log(
            payment_id=payment.payment_id,
            order_id=payment.order_id,
            event_type="action_taken",
            failure_type=classification.failure_type,
            confidence=classification.confidence,
            llm_reasoning=classification.reasoning,
            action_taken="ESCALATE",
            action_payload={"reason": "Flagged for human review", "classification": classification.model_dump()},
            recovery_attempt_number=attempt_number,
            outcome="escalated",
            amount_paise=payment.amount_paise,
        )

        logger.info("ESCALATE: %s — flagged for human review", payment.payment_id)
        return RecoveryResult(action="ESCALATE", outcome="escalated")

    async def _handle_stop(
        self,
        payment: Payment,
        classification: Classification,
        prior_attempts: int,
    ) -> RecoveryResult:
        """Mark as unrecoverable — do not retry."""
        await audit_logger.log(
            payment_id=payment.payment_id,
            order_id=payment.order_id,
            event_type="action_taken",
            failure_type=classification.failure_type,
            confidence=classification.confidence,
            llm_reasoning=classification.reasoning,
            action_taken="STOP",
            action_payload={"reason": "Recovery stopped by classifier recommendation"},
            recovery_attempt_number=prior_attempts,
            outcome="exhausted",
            amount_paise=payment.amount_paise,
        )

        logger.info("STOP: %s — marked as unrecoverable", payment.payment_id)
        return RecoveryResult(action="STOP", outcome="exhausted")


# Singleton instance
recovery_executor = RecoveryExecutor()
