"""
Recovery Executor — picks and executes recovery actions via Razorpay API.
Enforces the stopping rule and policy engine configuration.
"""

import json
import time
import uuid
import logging
from typing import Optional, Union
import aiosqlite

from backend.config import settings
from backend.database import get_db
from backend.models.agent import Classification, RecoveryResult
from backend.models.payment import Payment
from backend.services.razorpay_client import razorpay_client
from backend.services.audit_logger import audit_logger
from backend.services.policy_engine import policy_engine
from backend.services.message_generator import generate_recovery_message

logger = logging.getLogger(__name__)


class RecoveryExecutor:
    """
    Executes recovery actions based on classifier recommendations.
    Enforces the stopping rule: max recovery attempts per payment from policy engine.
    """

    async def execute_recovery(
        self,
        payment: Union[Payment, dict],
        classification: Classification,
        db: Optional[aiosqlite.Connection] = None,
    ) -> RecoveryResult:
        """
        Execute the recommended recovery action for a failed payment.
        Returns a RecoveryResult with the action taken and outcome.
        """
        if db is None:
            db = await get_db()

        # Support both Pydantic model and dict
        if isinstance(payment, dict):
            payment_id = payment["payment_id"]
            order_id = payment["order_id"]
            amount_paise = payment["amount_paise"]
            customer_email = payment.get("customer_email")
            customer_contact = payment.get("customer_contact")
            customer_name = payment.get("customer_name") or "Customer"
            order_notes = payment.get("order_notes") or payment.get("notes") or ""
        else:
            payment_id = payment.payment_id
            order_id = payment.order_id
            amount_paise = payment.amount_paise
            customer_email = payment.customer_email
            customer_contact = payment.customer_contact
            customer_name = getattr(payment, "customer_name", "Customer") or "Customer"
            order_notes = getattr(payment, "order_notes", "") or getattr(payment, "notes", "") or ""

        # ── STOPPING RULE (read dynamically from policy_engine) ──
        try:
            max_attempts = await policy_engine.get("max_retry_attempts", db)
        except Exception:
            max_attempts = settings.MAX_RECOVERY_ATTEMPTS

        prior_attempts = await audit_logger.count_recovery_attempts(payment_id)

        if prior_attempts >= max_attempts:
            await audit_logger.log(
                payment_id=payment_id,
                order_id=order_id,
                event_type="action_taken",
                action_taken="STOP",
                failure_type=classification.failure_type,
                confidence=classification.confidence,
                llm_reasoning=f"Stopping rule triggered: {prior_attempts} prior attempts (max {max_attempts}). No further recovery.",
                outcome="exhausted",
                amount_paise=amount_paise,
                recovery_attempt_number=prior_attempts,
            )
            logger.info(
                "STOP: %s — %d prior attempts, stopping rule enforced",
                payment_id, prior_attempts,
            )
            return RecoveryResult(action="STOP", outcome="exhausted")

        # ── Route to action handler ──
        action = classification.recommended_action
        attempt_number = prior_attempts + 1

        if action == "IMMEDIATE_RETRY":
            return await self._handle_immediate_retry(
                payment_id, order_id, amount_paise, customer_email, customer_contact,
                customer_name, order_notes, classification, attempt_number, db
            )
        elif action == "DELAYED_LINK":
            return await self._handle_delayed_link(
                payment_id, order_id, amount_paise, customer_email, customer_contact,
                customer_name, order_notes, classification, attempt_number, db
            )
        elif action == "ALT_METHOD":
            return await self._handle_alt_method(
                payment_id, order_id, amount_paise, customer_email, customer_contact,
                customer_name, order_notes, classification, attempt_number, db
            )
        elif action == "ESCALATE":
            return await self._handle_escalate(
                payment_id, order_id, amount_paise, classification, attempt_number
            )
        elif action == "STOP":
            return await self._handle_stop(
                payment_id, order_id, amount_paise, classification, prior_attempts
            )
        else:
            logger.warning("Unknown action: %s — escalating", action)
            return await self._handle_escalate(
                payment_id, order_id, amount_paise, classification, attempt_number
            )

    async def _handle_immediate_retry(
        self,
        payment_id: str,
        order_id: str,
        amount_paise: int,
        customer_email: Optional[str],
        customer_contact: Optional[str],
        customer_name: str,
        order_notes: str,
        classification: Classification,
        attempt_number: int,
        db: aiosqlite.Connection,
    ) -> RecoveryResult:
        """Create and dispatch a fresh payment link immediately."""
        reference_id = f"ret_{attempt_number}_{uuid.uuid4().hex[:16]}"

        payload = {
            "amount_paise": amount_paise,
            "description": f"Retry payment for order {order_id} — {classification.recovery_message_hint}",
            "customer_email": customer_email or "customer@example.com",
            "customer_contact": customer_contact or "+919876543210",
            "reference_id": reference_id,
            "notes": {
                "original_payment_id": payment_id,
                "original_order_id": order_id,
                "recovery_action": "IMMEDIATE_RETRY",
                "attempt_number": str(attempt_number),
            },
        }

        result = razorpay_client.create_payment_link(**payload)

        await audit_logger.log(
            payment_id=payment_id,
            order_id=order_id,
            event_type="action_taken",
            failure_type=classification.failure_type,
            confidence=classification.confidence,
            llm_reasoning=classification.reasoning,
            action_taken="IMMEDIATE_RETRY",
            action_payload=payload,
            razorpay_response=result.get("data") if result["success"] else {"error": result.get("error")},
            recovery_attempt_number=attempt_number,
            outcome="dispatched" if result["success"] else "error",
            amount_paise=amount_paise,
        )

        if result["success"]:
            link_data = result["data"]
            payment_link_url = link_data.get("short_url") or ""

            # Generate and store customer message
            await self._generate_and_save_message(
                payment_id, order_id, customer_name, amount_paise,
                classification.failure_type or "SOFT", "IMMEDIATE_RETRY",
                payment_link_url, order_notes, db
            )

            return RecoveryResult(
                action="IMMEDIATE_RETRY",
                outcome="dispatched",
                payment_link_id=link_data.get("id"),
                payment_link_url=payment_link_url,
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
        payment_id: str,
        order_id: str,
        amount_paise: int,
        customer_email: Optional[str],
        customer_contact: Optional[str],
        customer_name: str,
        order_notes: str,
        classification: Classification,
        attempt_number: int,
        db: aiosqlite.Connection,
    ) -> RecoveryResult:
        """Create a payment link with 24-hour expiry."""
        expire_by = int(time.time()) + 86400
        reference_id = f"del_{attempt_number}_{uuid.uuid4().hex[:16]}"

        payload = {
            "amount_paise": amount_paise,
            "description": f"Payment for order {order_id} — {classification.recovery_message_hint}",
            "customer_email": customer_email or "customer@example.com",
            "customer_contact": customer_contact or "+919876543210",
            "expire_by": expire_by,
            "reference_id": reference_id,
            "notes": {
                "original_payment_id": payment_id,
                "original_order_id": order_id,
                "recovery_action": "DELAYED_LINK",
                "attempt_number": str(attempt_number),
            },
        }

        result = razorpay_client.create_payment_link(**payload)

        await audit_logger.log(
            payment_id=payment_id,
            order_id=order_id,
            event_type="action_taken",
            failure_type=classification.failure_type,
            confidence=classification.confidence,
            llm_reasoning=classification.reasoning,
            action_taken="DELAYED_LINK",
            action_payload=payload,
            razorpay_response=result.get("data") if result["success"] else {"error": result.get("error")},
            recovery_attempt_number=attempt_number,
            outcome="dispatched" if result["success"] else "error",
            amount_paise=amount_paise,
        )

        if result["success"]:
            link_data = result["data"]
            payment_link_url = link_data.get("short_url") or ""

            # Generate and store customer message
            await self._generate_and_save_message(
                payment_id, order_id, customer_name, amount_paise,
                classification.failure_type or "HARD", "DELAYED_LINK",
                payment_link_url, order_notes, db
            )

            return RecoveryResult(
                action="DELAYED_LINK",
                outcome="dispatched",
                payment_link_id=link_data.get("id"),
                payment_link_url=payment_link_url,
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
        payment_id: str,
        order_id: str,
        amount_paise: int,
        customer_email: Optional[str],
        customer_contact: Optional[str],
        customer_name: str,
        order_notes: str,
        classification: Classification,
        attempt_number: int,
        db: aiosqlite.Connection,
    ) -> RecoveryResult:
        """Create a payment link prompting alternative payment methods."""
        reference_id = f"alt_{attempt_number}_{uuid.uuid4().hex[:16]}"

        payload = {
            "amount_paise": amount_paise,
            "description": f"Payment for order {order_id} (try card/wallet) — {classification.recovery_message_hint}",
            "customer_email": customer_email or "customer@example.com",
            "customer_contact": customer_contact or "+919876543210",
            "reference_id": reference_id,
            "notes": {
                "original_payment_id": payment_id,
                "original_order_id": order_id,
                "recovery_action": "ALT_METHOD",
                "attempt_number": str(attempt_number),
                "hint": "UPI failed — try card or wallet",
            },
        }

        result = razorpay_client.create_payment_link(**payload)

        await audit_logger.log(
            payment_id=payment_id,
            order_id=order_id,
            event_type="action_taken",
            failure_type=classification.failure_type,
            confidence=classification.confidence,
            llm_reasoning=classification.reasoning,
            action_taken="ALT_METHOD",
            action_payload=payload,
            razorpay_response=result.get("data") if result["success"] else {"error": result.get("error")},
            recovery_attempt_number=attempt_number,
            outcome="dispatched" if result["success"] else "error",
            amount_paise=amount_paise,
        )

        if result["success"]:
            link_data = result["data"]
            payment_link_url = link_data.get("short_url") or ""

            # Generate and store customer message
            await self._generate_and_save_message(
                payment_id, order_id, customer_name, amount_paise,
                classification.failure_type or "UPI_HANDOFF", "ALT_METHOD",
                payment_link_url, order_notes, db
            )

            return RecoveryResult(
                action="ALT_METHOD",
                outcome="dispatched",
                payment_link_id=link_data.get("id"),
                payment_link_url=payment_link_url,
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
        payment_id: str,
        order_id: str,
        amount_paise: int,
        classification: Classification,
        attempt_number: int,
    ) -> RecoveryResult:
        """Flag the payment for human review."""
        await audit_logger.log(
            payment_id=payment_id,
            order_id=order_id,
            event_type="action_taken",
            failure_type=classification.failure_type,
            confidence=classification.confidence,
            llm_reasoning=classification.reasoning,
            action_taken="ESCALATE",
            action_payload={"reason": "Flagged for human review", "classification": classification.model_dump()},
            recovery_attempt_number=attempt_number,
            outcome="escalated",
            amount_paise=amount_paise,
        )

        logger.info("ESCALATE: %s — flagged for human review", payment_id)
        return RecoveryResult(action="ESCALATE", outcome="escalated")

    async def _handle_stop(
        self,
        payment_id: str,
        order_id: str,
        amount_paise: int,
        classification: Classification,
        prior_attempts: int,
    ) -> RecoveryResult:
        """Mark as unrecoverable — do not retry."""
        await audit_logger.log(
            payment_id=payment_id,
            order_id=order_id,
            event_type="action_taken",
            failure_type=classification.failure_type,
            confidence=classification.confidence,
            llm_reasoning=classification.reasoning,
            action_taken="STOP",
            action_payload={"reason": "Recovery stopped by classifier recommendation"},
            recovery_attempt_number=prior_attempts,
            outcome="exhausted",
            amount_paise=amount_paise,
        )

        logger.info("STOP: %s — marked as unrecoverable", payment_id)
        return RecoveryResult(action="STOP", outcome="exhausted")

    async def _generate_and_save_message(
        self,
        payment_id: str,
        order_id: str,
        customer_name: str,
        amount_paise: int,
        failure_type: str,
        action_taken: str,
        payment_link_url: str,
        order_notes: str,
        db: aiosqlite.Connection,
    ):
        """Generate personalized recovery message and save to recovery_messages table."""
        try:
            merchant_name = await policy_engine.get("merchant_name", db)
        except Exception:
            merchant_name = "PayPulse Demo Store"

        amount_rupees = amount_paise / 100

        msg_data = await generate_recovery_message(
            payment_id=payment_id,
            order_id=order_id,
            customer_name=customer_name,
            amount_rupees=amount_rupees,
            failure_type=failure_type,
            action_taken=action_taken,
            payment_link_url=payment_link_url,
            merchant_name=merchant_name,
            order_notes=order_notes,
        )

        try:
            await db.execute("""
                INSERT OR REPLACE INTO recovery_messages
                (payment_id, order_id, whatsapp_message, sms_message, tone,
                 personalization_note, payment_link_url, source, customer_name, amount_rupees)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                payment_id, order_id,
                msg_data["whatsapp"], msg_data["sms"],
                msg_data["tone"], msg_data["personalization_note"],
                payment_link_url, msg_data["source"],
                customer_name, amount_rupees,
            ))
            await db.commit()
            logger.info("Saved recovery message for payment %s", payment_id)
        except Exception as e:
            logger.error("Failed to save recovery message for %s: %s", payment_id, e)


# Singleton instance
recovery_executor = RecoveryExecutor()
