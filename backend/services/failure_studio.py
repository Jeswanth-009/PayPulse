"""
failure_studio.py
Fires a synthetic payment failure directly through the full agent pipeline.
Used by the Failure Studio UI for instant judge demos.
"""

import uuid
import json
import logging
from typing import Optional
import aiosqlite

from backend.services.razorpay_client import razorpay_client
from backend.services.classifier import payment_classifier
from backend.services.executor import recovery_executor
from backend.services.audit_logger import audit_logger
from backend.models.payment import Payment

logger = logging.getLogger(__name__)

PRESETS = {
    "bank_timeout": {
        "label": "Bank Timeout",
        "amount_rupees": 2499,
        "method": "netbanking",
        "error_code": "GATEWAY_ERROR",
        "error_description": "Payment processing failed due to bank server timeout. Please try again.",
        "customer_name": "Arjun Mehta",
        "language_hint": "hi",
    },
    "upi_dropped": {
        "label": "UPI PSP Dropped",
        "amount_rupees": 799,
        "method": "upi",
        "error_code": "BAD_REQUEST_ERROR",
        "error_description": "UPI collect request expired without customer response. PSP callback was lost.",
        "customer_name": "Priya Nair",
        "language_hint": "hi",
    },
    "hard_decline": {
        "label": "Card Declined",
        "amount_rupees": 4999,
        "method": "card",
        "error_code": "BAD_REQUEST_ERROR",
        "error_description": "Your payment was declined by the card issuer. Please use a different card.",
        "customer_name": "Sneha Kapoor",
        "language_hint": "en",
    },
    "otp_timeout_highvalue": {
        "label": "OTP Timeout (High Value)",
        "amount_rupees": 15000,
        "method": "card",
        "error_code": "BAD_REQUEST_ERROR",
        "error_description": "The OTP entered has expired. The transaction session has timed out.",
        "customer_name": "Vikram Joshi",
        "language_hint": "en",
    },
}


class FailureStudio:

    async def fire(self, preset: Optional[str], custom: Optional[dict], db: aiosqlite.Connection) -> dict:
        if preset:
            config = PRESETS[preset]
        elif custom:
            config = custom
        else:
            raise ValueError("Provide either preset or custom config")

        amount_paise = int(config["amount_rupees"] * 100)
        language_hint = config.get("language_hint", "en")
        customer_name = config.get("customer_name", "Customer")

        # Create a real Razorpay test-mode order
        order_res = razorpay_client.create_order(
            amount_paise=amount_paise,
            currency="INR",
            receipt=f"fs_{uuid.uuid4().hex[:10]}",
            notes={
                "customer_name": customer_name,
                "language_hint": language_hint,
                "source": "failure_studio",
            }
        )

        payment_id = f"studio_{uuid.uuid4().hex[:12]}"
        order_id = order_res["data"]["id"] if order_res["success"] else f"order_sim_{uuid.uuid4().hex[:12]}"

        order_notes_str = json.dumps({"language_hint": language_hint})

        # Insert failed payment record into payments table
        await db.execute("""
            INSERT INTO payments
            (payment_id, order_id, amount_paise, method, error_code,
             error_description, customer_name, order_notes, status, attempts)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'failed', 1)
        """, (
            payment_id, order_id, amount_paise,
            config["method"], config["error_code"],
            config["error_description"], customer_name,
            order_notes_str,
        ))
        await db.commit()

        # Log failure_detected
        await audit_logger.log(
            payment_id=payment_id,
            order_id=order_id,
            event_type="failure_detected",
            llm_reasoning=f"Payment failed: {config['error_code']} — {config['error_description']}",
            amount_paise=amount_paise,
        )

        # Run classifier
        classification = await payment_classifier.classify(
            payment_id=payment_id,
            order_id=order_id,
            error_code=config["error_code"],
            error_description=config["error_description"],
            method=config["method"],
            amount_paise=amount_paise,
            attempts=1,
            time_since_created_minutes=2.0,
            recovery_attempts=0,
        )

        # Log classification
        await audit_logger.log(
            payment_id=payment_id,
            order_id=order_id,
            event_type="classified",
            failure_type=classification.failure_type,
            confidence=classification.confidence,
            llm_reasoning=classification.reasoning,
            action_taken=classification.recommended_action,
            amount_paise=amount_paise,
        )

        # Build payment object
        payment_dict = {
            "payment_id": payment_id,
            "order_id": order_id,
            "amount_paise": amount_paise,
            "method": config["method"],
            "error_code": config["error_code"],
            "error_description": config["error_description"],
            "customer_name": customer_name,
            "order_notes": order_notes_str,
            "attempts": 1,
        }

        # Run executor
        result = await recovery_executor.execute_recovery(payment_dict, classification, db)

        # Log outcome
        await audit_logger.log(
            payment_id=payment_id,
            order_id=order_id,
            event_type="outcome",
            failure_type=classification.failure_type,
            confidence=classification.confidence,
            action_taken=result.action,
            outcome=result.outcome,
            amount_paise=amount_paise,
        )

        # Fetch all audit entries generated for this payment
        cursor = await db.execute(
            "SELECT * FROM audit_log WHERE payment_id = ? ORDER BY created_at ASC",
            (payment_id,)
        )
        audit_entries = await cursor.fetchall()

        return {
            "payment_id": payment_id,
            "order_id": order_id,
            "preset": preset,
            "classification": {
                "failure_type": classification.failure_type,
                "confidence": classification.confidence,
                "reasoning": classification.reasoning,
                "recommended_action": classification.recommended_action,
                "recovery_message_hint": classification.recovery_message_hint,
            },
            "action_taken": result.action,
            "outcome": result.outcome,
            "payment_link_url": result.payment_link_url,
            "audit_entries": [dict(r) for r in audit_entries],
        }


failure_studio = FailureStudio()
