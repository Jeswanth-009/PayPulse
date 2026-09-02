"""
Pydantic models for payment objects.
"""

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime


class PaymentStatus(str, Enum):
    CREATED = "created"
    AUTHORIZED = "authorized"
    CAPTURED = "captured"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentMethod(str, Enum):
    CARD = "card"
    UPI = "upi"
    NETBANKING = "netbanking"
    WALLET = "wallet"
    EMI = "emi"
    BANK_TRANSFER = "bank_transfer"


class FailureType(str, Enum):
    SOFT = "SOFT"
    HARD = "HARD"
    UPI_HANDOFF = "UPI_HANDOFF"
    SESSION_TIMEOUT = "SESSION_TIMEOUT"


class Payment(BaseModel):
    id: Optional[int] = None
    payment_id: str
    order_id: str
    batch_id: Optional[str] = None
    amount_paise: int
    currency: str = "INR"
    method: Optional[str] = None
    status: str = "created"
    error_code: Optional[str] = None
    error_description: Optional[str] = None
    error_source: Optional[str] = None
    attempts: int = 0
    recovery_attempts: int = 0
    failure_type: Optional[str] = None
    customer_email: Optional[str] = None
    customer_contact: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @property
    def amount_rupees(self) -> float:
        return self.amount_paise / 100

    @property
    def amount_display(self) -> str:
        return f"₹{self.amount_rupees:,.2f}"


class PaymentCreate(BaseModel):
    order_id: str
    amount_paise: int
    currency: str = "INR"
    method: Optional[str] = None
    status: str = "created"
    error_code: Optional[str] = None
    error_description: Optional[str] = None
    error_source: Optional[str] = None
    batch_id: Optional[str] = None
    customer_email: Optional[str] = None
    customer_contact: Optional[str] = None


class PaymentListResponse(BaseModel):
    payments: list[Payment]
    total: int
    page: int
    limit: int


class PaymentDetailResponse(BaseModel):
    payment: Payment
    audit_entries: list[dict] = []
