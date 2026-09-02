"""
Payments Router — GET endpoints for payment data and customer recovery messages.
"""

from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Optional
from backend.database import get_db
from backend.models.payment import Payment, PaymentListResponse, PaymentDetailResponse
from backend.services.audit_logger import audit_logger

router = APIRouter(prefix="/api/v1/payments", tags=["payments"])


@router.get("", response_model=PaymentListResponse)
async def list_payments(
    status: Optional[str] = Query(None, description="Filter by payment status"),
    failure_type: Optional[str] = Query(None, description="Filter by failure type"),
    batch_id: Optional[str] = Query(None, description="Filter by batch ID"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
):
    """Get paginated list of all tracked payments."""
    db = await get_db()

    conditions = []
    params = []

    if status:
        conditions.append("status = ?")
        params.append(status)
    if failure_type:
        conditions.append("failure_type = ?")
        params.append(failure_type)
    if batch_id:
        conditions.append("batch_id = ?")
        params.append(batch_id)

    where_clause = " AND ".join(conditions) if conditions else "1=1"

    # Count total
    cursor = await db.execute(
        f"SELECT COUNT(*) FROM payments WHERE {where_clause}", params
    )
    total = (await cursor.fetchone())[0]

    # Fetch page
    offset = (page - 1) * limit
    cursor = await db.execute(
        f"""
        SELECT * FROM payments
        WHERE {where_clause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
        """,
        params + [limit, offset],
    )
    rows = await cursor.fetchall()

    payments = [Payment(**dict(row)) for row in rows]

    return PaymentListResponse(
        payments=payments,
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/{payment_id}", response_model=PaymentDetailResponse)
async def get_payment(payment_id: str):
    """Get full payment detail with all audit log entries."""
    db = await get_db()

    cursor = await db.execute(
        "SELECT * FROM payments WHERE payment_id = ?", (payment_id,)
    )
    row = await cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Payment not found")

    payment = Payment(**dict(row))
    audit_entries = await audit_logger.get_entries_for_payment(payment_id)

    return PaymentDetailResponse(
        payment=payment,
        audit_entries=audit_entries,
    )


@router.get("/{payment_id}/message")
async def get_recovery_message(payment_id: str, db=Depends(get_db)):
    """Get the customer-facing WhatsApp & SMS recovery message generated for this payment."""
    cursor = await db.execute(
        "SELECT * FROM recovery_messages WHERE payment_id = ?", (payment_id,)
    )
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(
            status_code=404,
            detail="No message for this payment. STOP and ESCALATE actions do not generate messages."
        )
    return dict(row)


@router.post("/{payment_id}/simulate-pay")
async def simulate_payment_completion(payment_id: str, db=Depends(get_db)):
    """Simulate customer clicking and paying the recovery link, transitioning payment to 'captured' and 'recovered'."""
    cursor = await db.execute("SELECT * FROM payments WHERE payment_id = ?", (payment_id,))
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Payment not found")

    payment = dict(row)
    amount_paise = payment.get("amount_paise", 0)
    order_id = payment.get("order_id", "")
    customer_name = payment.get("customer_name") or "Customer"

    # Update payment status
    await db.execute(
        "UPDATE payments SET status = 'captured', updated_at = CURRENT_TIMESTAMP WHERE payment_id = ?",
        (payment_id,),
    )
    await db.commit()

    # Log outcome in audit log
    await audit_logger.log(
        payment_id=payment_id,
        event_type="outcome",
        order_id=order_id,
        amount_paise=amount_paise,
        action_taken="RECOVERED",
        outcome="recovered",
        llm_reasoning=f"Customer {customer_name} completed payment via recovery link. Autonomous recovery succeeded.",
    )

    return {
        "success": True,
        "payment_id": payment_id,
        "order_id": order_id,
        "amount_paise": amount_paise,
        "customer_name": customer_name,
        "status": "captured",
        "outcome": "recovered",
        "message": f"Payment {payment_id} successfully recovered! ₹{amount_paise/100:,.2f} captured.",
    }
