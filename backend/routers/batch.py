"""
Batch Router — seed payment batches and retrieve reports.
"""

import uuid
import random
import asyncio
import logging
from fastapi import APIRouter, BackgroundTasks, HTTPException
from backend.database import get_db
from backend.models.batch import BatchRunRequest, BatchReport, BatchListResponse
from backend.services.razorpay_client import razorpay_client
from backend.services.audit_logger import audit_logger
from backend.services.monitor import payment_monitor

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/batch", tags=["batch"])

# Simulated failure scenarios for realistic demo data
FAILURE_SCENARIOS = [
    {
        "error_code": "GATEWAY_ERROR",
        "error_description": "Payment processing failed due to bank server error",
        "error_source": "gateway",
        "method": "card",
    },
    {
        "error_code": "GATEWAY_ERROR",
        "error_description": "Bank gateway timeout — transaction could not be completed",
        "error_source": "gateway",
        "method": "card",
    },
    {
        "error_code": "BAD_REQUEST_ERROR",
        "error_description": "Card number is invalid or does not exist",
        "error_source": "customer",
        "method": "card",
    },
    {
        "error_code": "BAD_REQUEST_ERROR",
        "error_description": "Insufficient funds in the account",
        "error_source": "customer",
        "method": "card",
    },
    {
        "error_code": "BAD_REQUEST_ERROR",
        "error_description": "Card has been blocked by the issuing bank",
        "error_source": "customer",
        "method": "card",
    },
    {
        "error_code": "GATEWAY_ERROR",
        "error_description": "UPI transaction failed — callback not received from PSP",
        "error_source": "gateway",
        "method": "upi",
    },
    {
        "error_code": "BAD_REQUEST_ERROR",
        "error_description": "UPI VPA is invalid or not registered",
        "error_source": "customer",
        "method": "upi",
    },
    {
        "error_code": "GATEWAY_ERROR",
        "error_description": "UPI collect request expired — customer did not respond",
        "error_source": "gateway",
        "method": "upi",
    },
    {
        "error_code": "SERVER_ERROR",
        "error_description": "OTP session expired before customer could complete verification",
        "error_source": "gateway",
        "method": "netbanking",
    },
    {
        "error_code": "GATEWAY_ERROR",
        "error_description": "Netbanking session timeout — customer took too long",
        "error_source": "gateway",
        "method": "netbanking",
    },
    {
        "error_code": "GATEWAY_ERROR",
        "error_description": "Wallet payment failed — insufficient wallet balance",
        "error_source": "customer",
        "method": "wallet",
    },
    {
        "error_code": "SERVER_ERROR",
        "error_description": "Internal server error during payment processing",
        "error_source": "razorpay",
        "method": "card",
    },
]

# Realistic Indian names and contacts for demo
DEMO_CUSTOMERS = [
    {"name": "Aarav Sharma", "email": "aarav.sharma@example.com", "contact": "+919876543210"},
    {"name": "Priya Patel", "email": "priya.patel@example.com", "contact": "+919876543211"},
    {"name": "Vikram Singh", "email": "vikram.singh@example.com", "contact": "+919876543212"},
    {"name": "Ananya Gupta", "email": "ananya.gupta@example.com", "contact": "+919876543213"},
    {"name": "Rohan Mehta", "email": "rohan.mehta@example.com", "contact": "+919876543214"},
    {"name": "Sneha Reddy", "email": "sneha.reddy@example.com", "contact": "+919876543215"},
    {"name": "Arjun Kumar", "email": "arjun.kumar@example.com", "contact": "+919876543216"},
    {"name": "Kavya Nair", "email": "kavya.nair@example.com", "contact": "+919876543217"},
    {"name": "Rahul Joshi", "email": "rahul.joshi@example.com", "contact": "+919876543218"},
    {"name": "Deepika Iyer", "email": "deepika.iyer@example.com", "contact": "+919876543219"},
]

# Realistic Indian e-commerce amounts (in paise)
AMOUNT_RANGES = [
    (9900, 49900),       # ₹99 – ₹499 (small purchases)
    (49900, 199900),     # ₹499 – ₹1,999 (mid-range)
    (199900, 499900),    # ₹1,999 – ₹4,999 (electronics, fashion)
    (499900, 999900),    # ₹4,999 – ₹9,999 (appliances)
    (999900, 2500000),   # ₹9,999 – ₹25,000 (high-value, phones, laptops)
]


async def _seed_and_run_batch(batch_id: str, count: int, failure_rate: float):
    """Background task: create orders, simulate failures, run agent."""
    db = await get_db()
    num_failures = int(count * failure_rate)

    logger.info("Batch %s: creating %d orders (%d failures)", batch_id, count, num_failures)

    # Decide which indices will be failures
    failure_indices = set(random.sample(range(count), min(num_failures, count)))

    for i in range(count):
        # Pick random amount
        amount_range = random.choice(AMOUNT_RANGES)
        amount_paise = random.randint(amount_range[0], amount_range[1])
        # Round to nearest 100 paise (₹1)
        amount_paise = (amount_paise // 100) * 100

        customer = random.choice(DEMO_CUSTOMERS)
        receipt = f"batch_{batch_id}_order_{i}"

        # Create real order via Razorpay
        order_result = razorpay_client.create_order(
            amount_paise=amount_paise,
            receipt=receipt,
            notes={"batch_id": batch_id, "index": str(i)},
        )

        if not order_result["success"]:
            logger.warning("Failed to create order %d: %s", i, order_result.get("error"))
            # Create a synthetic order ID for the demo
            order_id = f"order_sim_{batch_id}_{i}"
        else:
            order_id = order_result["data"]["id"]

        # Determine if this payment is a failure
        is_failure = i in failure_indices
        payment_id = f"pay_sim_{batch_id}_{i}"

        if is_failure:
            scenario = random.choice(FAILURE_SCENARIOS)
            status = "failed"
            error_code = scenario["error_code"]
            error_description = scenario["error_description"]
            error_source = scenario["error_source"]
            method = scenario["method"]
        else:
            status = "captured"
            error_code = None
            error_description = None
            error_source = None
            method = random.choice(["card", "upi", "netbanking", "wallet"])

        # Insert into local DB
        await db.execute(
            """
            INSERT INTO payments
                (payment_id, order_id, batch_id, amount_paise, currency, method,
                 status, error_code, error_description, error_source,
                 attempts, recovery_attempts, customer_email, customer_contact)
            VALUES (?, ?, ?, ?, 'INR', ?, ?, ?, ?, ?, 1, 0, ?, ?)
            """,
            (
                payment_id, order_id, batch_id, amount_paise, method,
                status, error_code, error_description, error_source,
                customer["email"], customer["contact"],
            ),
        )

    await db.commit()
    logger.info("Batch %s: %d orders seeded, %d failures", batch_id, count, num_failures)

    # Now run the agent on this batch
    await payment_monitor.run_agent_loop(batch_id=batch_id)

    logger.info("Batch %s: agent loop completed", batch_id)


@router.post("/run")
async def run_batch(request: BatchRunRequest, background_tasks: BackgroundTasks):
    """Seeds a batch via Razorpay test mode, begins monitoring."""
    batch_id = f"batch_{uuid.uuid4().hex[:12]}"
    db = await get_db()

    # Create batch record
    await db.execute(
        """
        INSERT INTO batches (batch_id, total_payments, total_failures, failure_rate, status)
        VALUES (?, ?, ?, ?, 'running')
        """,
        (batch_id, request.count, int(request.count * request.failure_rate), request.failure_rate),
    )
    await db.commit()

    # Run in background
    background_tasks.add_task(_seed_and_run_batch, batch_id, request.count, request.failure_rate)

    return {
        "batch_id": batch_id,
        "status": "running",
        "total_payments": request.count,
        "expected_failures": int(request.count * request.failure_rate),
        "message": f"Batch {batch_id} started — seeding {request.count} payments with {request.failure_rate*100:.0f}% failure rate",
    }


@router.get("/{batch_id}/report")
async def get_batch_report(batch_id: str):
    """Returns the full batch report JSON."""
    db = await get_db()

    # Check batch exists
    cursor = await db.execute(
        "SELECT * FROM batches WHERE batch_id = ?", (batch_id,)
    )
    batch = await cursor.fetchone()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    # Generate report from audit data
    report = await audit_logger.get_batch_stats(batch_id)
    report["status"] = dict(batch)["status"]
    report["created_at"] = dict(batch)["created_at"]
    report["completed_at"] = dict(batch).get("completed_at")

    return report


@router.get("")
async def list_batches():
    """List all batches."""
    db = await get_db()
    cursor = await db.execute(
        "SELECT * FROM batches ORDER BY created_at DESC"
    )
    rows = await cursor.fetchall()

    return {
        "batches": [dict(row) for row in rows],
        "total": len(rows),
    }
