"""
Webhook Router — receives Razorpay webhook events.
"""

import json
import logging
from fastapi import APIRouter, Request, HTTPException
from backend.services.razorpay_client import razorpay_client
from backend.database import get_db

logger = logging.getLogger(__name__)
router = APIRouter(tags=["webhook"])


@router.post("/webhook/razorpay")
async def razorpay_webhook(request: Request):
    """
    Receives Razorpay webhook events.
    Validates HMAC-SHA256 signature before processing.
    Enqueues the payment for agent processing.
    """
    # Read raw body ONCE (critical — reading twice breaks signature validation)
    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")

    # Validate signature
    if not razorpay_client.verify_webhook_signature(body, signature):
        logger.warning("Invalid webhook signature")
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    # Parse payload
    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    event = payload.get("event", "")
    logger.info("Webhook received: %s", event)

    if event == "payment.failed":
        payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})

        if payment_entity:
            db = await get_db()

            payment_id = payment_entity.get("id", "")
            order_id = payment_entity.get("order_id", "")
            amount = payment_entity.get("amount", 0)
            method = payment_entity.get("method", "")
            error_code = payment_entity.get("error_code", "")
            error_description = payment_entity.get("error_description", "")
            error_source = payment_entity.get("error_source", "")

            # Upsert payment record
            await db.execute(
                """
                INSERT INTO payments
                    (payment_id, order_id, amount_paise, method, status,
                     error_code, error_description, error_source, attempts)
                VALUES (?, ?, ?, ?, 'failed', ?, ?, ?, 1)
                ON CONFLICT(payment_id) DO UPDATE SET
                    status = 'failed',
                    error_code = excluded.error_code,
                    error_description = excluded.error_description,
                    error_source = excluded.error_source,
                    attempts = payments.attempts + 1,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (payment_id, order_id, amount, method,
                 error_code, error_description, error_source),
            )
            await db.commit()

            logger.info("Payment %s queued for agent processing", payment_id)

    elif event == "payment.captured":
        payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
        if payment_entity:
            db = await get_db()
            payment_id = payment_entity.get("id", "")

            await db.execute(
                "UPDATE payments SET status = 'captured', updated_at = CURRENT_TIMESTAMP WHERE payment_id = ?",
                (payment_id,),
            )
            await db.commit()
            logger.info("Payment %s captured", payment_id)

    elif event == "order.paid":
        order_entity = payload.get("payload", {}).get("order", {}).get("entity", {})
        if order_entity:
            db = await get_db()
            order_id = order_entity.get("id", "")

            await db.execute(
                "UPDATE payments SET status = 'captured', updated_at = CURRENT_TIMESTAMP WHERE order_id = ?",
                (order_id,),
            )
            await db.commit()
            logger.info("Order %s paid", order_id)

    return {"status": "ok"}
