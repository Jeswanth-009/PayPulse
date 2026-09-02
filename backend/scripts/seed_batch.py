"""
seed_batch.py
Creates N orders via Razorpay test-mode Orders API.
For each order, simulates a payment attempt with a specified failure pattern.
Writes all orders to the database so PayPulse can track them.

Usage:
    python -m backend.scripts.seed_batch --count 10 --failure-rate 0.25 [--run-agent]
"""

import argparse
import asyncio
import json
import random
import uuid
import sys
import os
from pathlib import Path

# Force UTF-8 on Windows consoles to prevent UnicodeEncodeError with ₹ or symbols
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.config import settings
from backend.database import init_db, get_db, close_db
from backend.services.razorpay_client import razorpay_client
from backend.services.monitor import payment_monitor

# Same failure scenarios as batch router
FAILURE_SCENARIOS = [
    {"error_code": "GATEWAY_ERROR", "error_description": "Payment processing failed due to bank server error", "error_source": "gateway", "method": "card"},
    {"error_code": "GATEWAY_ERROR", "error_description": "Bank gateway timeout — transaction could not be completed", "error_source": "gateway", "method": "card"},
    {"error_code": "BAD_REQUEST_ERROR", "error_description": "Card number is invalid or does not exist", "error_source": "customer", "method": "card"},
    {"error_code": "BAD_REQUEST_ERROR", "error_description": "Insufficient funds in the account", "error_source": "customer", "method": "card"},
    {"error_code": "BAD_REQUEST_ERROR", "error_description": "Card has been blocked by the issuing bank", "error_source": "customer", "method": "card"},
    {"error_code": "GATEWAY_ERROR", "error_description": "UPI transaction failed — callback not received from PSP", "error_source": "gateway", "method": "upi"},
    {"error_code": "BAD_REQUEST_ERROR", "error_description": "UPI VPA is invalid or not registered", "error_source": "customer", "method": "upi"},
    {"error_code": "GATEWAY_ERROR", "error_description": "UPI collect request expired — customer did not respond", "error_source": "gateway", "method": "upi"},
    {"error_code": "SERVER_ERROR", "error_description": "OTP session expired before customer could complete verification", "error_source": "gateway", "method": "netbanking"},
    {"error_code": "GATEWAY_ERROR", "error_description": "Netbanking session timeout — customer took too long", "error_source": "gateway", "method": "netbanking"},
]

DEMO_CUSTOMERS = [
    {"name": "Priya Sharma", "email": "priya.sharma@example.com", "contact": "+919876543210", "lang": "hi"},
    {"name": "Rahul Verma", "email": "rahul.verma@example.com", "contact": "+919876543211", "lang": "hi"},
    {"name": "Ananya Singh", "email": "ananya.singh@example.com", "contact": "+919876543212", "lang": "hi"},
    {"name": "Karan Mehta", "email": "karan.mehta@example.com", "contact": "+919876543213", "lang": "en"},
    {"name": "Divya Nair", "email": "divya.nair@example.com", "contact": "+919876543214", "lang": "hi"},
    {"name": "Arjun Patel", "email": "arjun.patel@example.com", "contact": "+919876543215", "lang": "en"},
    {"name": "Sneha Reddy", "email": "sneha.reddy@example.com", "contact": "+919876543216", "lang": "hi"},
    {"name": "Vikram Joshi", "email": "vikram.joshi@example.com", "contact": "+919876543217", "lang": "en"},
]

AMOUNT_RANGES = [
    (9900, 49900), (49900, 199900), (199900, 499900),
    (499900, 999900), (999900, 2500000),
]


async def seed_batch(count: int, failure_rate: float, run_agent: bool = False):
    """Create a batch of orders with simulated failures."""
    await init_db()
    db = await get_db()

    batch_id = f"batch_{uuid.uuid4().hex[:12]}"
    num_failures = int(count * failure_rate)
    failure_indices = set(random.sample(range(count), min(num_failures, count)))

    print(f"\n{'='*60}")
    print(f"  PayPulse Batch Seeder")
    print(f"  Batch ID: {batch_id}")
    print(f"  Total orders: {count}")
    print(f"  Expected failures: {num_failures} ({failure_rate*100:.0f}%)")
    print(f"{'='*60}\n")

    # Create batch record
    await db.execute(
        "INSERT INTO batches (batch_id, total_payments, total_failures, failure_rate, status) VALUES (?, ?, ?, ?, 'seeded')",
        (batch_id, count, num_failures, failure_rate),
    )
    await db.commit()

    created = 0
    failures = 0
    errors = 0

    for i in range(count):
        amount_range = random.choice(AMOUNT_RANGES)
        amount_paise = (random.randint(amount_range[0], amount_range[1]) // 100) * 100
        customer = random.choice(DEMO_CUSTOMERS)
        receipt = f"batch_{batch_id}_order_{i}"

        # Create real Razorpay order
        order_result = razorpay_client.create_order(
            amount_paise=amount_paise,
            receipt=receipt,
            notes={"batch_id": batch_id, "index": str(i), "customer_name": customer["name"], "language_hint": customer["lang"]},
        )

        if order_result["success"]:
            order_id = order_result["data"]["id"]
        else:
            order_id = f"order_sim_{batch_id}_{i}"
            errors += 1

        is_failure = i in failure_indices
        payment_id = f"pay_sim_{batch_id}_{i}"

        if is_failure:
            scenario = random.choice(FAILURE_SCENARIOS)
            status = "failed"
            failures += 1
            print(f"  [{i+1:3d}/{count}] [FAIL] {payment_id}  Rs.{amount_paise/100:>9,.2f}  {scenario['method']:>10}  {scenario['error_code']}")
        else:
            scenario = {"error_code": None, "error_description": None, "error_source": None, "method": random.choice(["card", "upi", "netbanking", "wallet"])}
            status = "captured"
            print(f"  [{i+1:3d}/{count}] [ OK ] {payment_id}  Rs.{amount_paise/100:>9,.2f}  {scenario['method']:>10}  captured")

        order_notes_str = json.dumps({"language_hint": customer["lang"]})

        await db.execute(
            """
            INSERT INTO payments
                (payment_id, order_id, batch_id, amount_paise, currency, method,
                 status, error_code, error_description, error_source,
                 attempts, recovery_attempts, customer_email, customer_contact,
                 customer_name, order_notes)
            VALUES (?, ?, ?, ?, 'INR', ?, ?, ?, ?, ?, 1, 0, ?, ?, ?, ?)
            """,
            (
                payment_id, order_id, batch_id, amount_paise, scenario["method"],
                status, scenario.get("error_code"), scenario.get("error_description"),
                scenario.get("error_source"), customer["email"], customer["contact"],
                customer["name"], order_notes_str,
            ),
        )
        created += 1

    await db.commit()

    print(f"\n{'='*60}")
    print(f"  Created {created} orders. Failures seeded: {failures}.")
    print(f"  API errors: {errors}")
    print(f"  Batch ID: {batch_id}")
    print(f"{'='*60}\n")

    if run_agent:
        print("Running AI agent recovery loop on this batch...")
        await payment_monitor.run_agent_loop(batch_id=batch_id)
        print("Agent loop completed.")

    await close_db()
    return batch_id


def main():
    parser = argparse.ArgumentParser(description="PayPulse Batch Seeder")
    parser.add_argument("--count", type=int, default=100, help="Number of orders to create")
    parser.add_argument("--failure-rate", type=float, default=0.25, help="Fraction of orders that fail (0–0.5)")
    parser.add_argument("--run-agent", action="store_true", help="Immediately run the agent loop after seeding")
    args = parser.parse_args()

    if not 0 <= args.failure_rate <= 0.5:
        print("Error: failure-rate must be between 0 and 0.5")
        sys.exit(1)
    if not 1 <= args.count <= 200:
        print("Error: count must be between 1 and 200")
        sys.exit(1)

    asyncio.run(seed_batch(args.count, args.failure_rate, args.run_agent))


if __name__ == "__main__":
    main()
