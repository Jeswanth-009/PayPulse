"""
Razorpay Client Wrapper — thin layer around the razorpay SDK.
All Razorpay API calls go through this module.
"""

import razorpay
import json
import time
import logging
from typing import Optional
from backend.config import settings

logger = logging.getLogger(__name__)


class RazorpayClient:
    """Wraps the razorpay SDK with error handling and structured returns."""

    def __init__(self):
        self.client = razorpay.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )
        logger.info("Razorpay client initialized (key: %s...)", settings.RAZORPAY_KEY_ID[:12])

    def create_order(
        self,
        amount_paise: int,
        currency: str = "INR",
        receipt: Optional[str] = None,
        notes: Optional[dict] = None,
    ) -> dict:
        """Create an order via Razorpay Orders API."""
        try:
            data = {
                "amount": amount_paise,
                "currency": currency,
            }
            if receipt:
                data["receipt"] = receipt
            if notes:
                data["notes"] = notes

            order = self.client.order.create(data=data)
            logger.info("Created order: %s (₹%s)", order["id"], amount_paise / 100)
            return {"success": True, "data": order}
        except Exception as e:
            logger.error("Failed to create order: %s", str(e))
            return {"success": False, "error": str(e)}

    def fetch_order(self, order_id: str) -> dict:
        """Fetch an order by ID."""
        try:
            order = self.client.order.fetch(order_id)
            return {"success": True, "data": order}
        except Exception as e:
            logger.error("Failed to fetch order %s: %s", order_id, str(e))
            return {"success": False, "error": str(e)}

    def fetch_payments_for_order(self, order_id: str) -> dict:
        """Fetch all payments for an order."""
        try:
            payments = self.client.order.payments(order_id)
            return {"success": True, "data": payments}
        except Exception as e:
            logger.error("Failed to fetch payments for order %s: %s", order_id, str(e))
            return {"success": False, "error": str(e)}

    def fetch_payment(self, payment_id: str) -> dict:
        """Fetch a payment by ID."""
        try:
            payment = self.client.payment.fetch(payment_id)
            return {"success": True, "data": payment}
        except Exception as e:
            logger.error("Failed to fetch payment %s: %s", payment_id, str(e))
            return {"success": False, "error": str(e)}

    def create_payment_link(
        self,
        amount_paise: int,
        description: str,
        customer_name: str = "Customer",
        customer_email: str = "customer@example.com",
        customer_contact: str = "+919876543210",
        expire_by: Optional[int] = None,
        reference_id: Optional[str] = None,
        notes: Optional[dict] = None,
        notify_sms: bool = False,
        notify_email: bool = False,
    ) -> dict:
        """Create a payment link via Razorpay Payment Links API."""
        try:
            data = {
                "amount": amount_paise,
                "currency": "INR",
                "description": description,
                "customer": {
                    "name": customer_name,
                    "email": customer_email,
                    "contact": customer_contact,
                },
                "notify": {
                    "sms": notify_sms,
                    "email": notify_email,
                },
                "reminder_enable": False,
            }

            if expire_by:
                data["expire_by"] = expire_by
            if reference_id:
                data["reference_id"] = reference_id
            if notes:
                data["notes"] = notes

            link = self.client.payment_link.create(data=data)
            logger.info(
                "Created payment link: %s (₹%s) → %s",
                link.get("id"),
                amount_paise / 100,
                link.get("short_url"),
            )
            return {"success": True, "data": link}
        except Exception as e:
            logger.error("Failed to create payment link: %s", str(e))
            return {"success": False, "error": str(e)}

    def verify_webhook_signature(self, body: bytes, signature: str) -> bool:
        """Verify Razorpay webhook HMAC-SHA256 signature."""
        try:
            self.client.utility.verify_webhook_signature(
                body.decode("utf-8"), signature, settings.RAZORPAY_WEBHOOK_SECRET
            )
            return True
        except Exception:
            return False


# Singleton instance
razorpay_client = RazorpayClient()
