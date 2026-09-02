"""
Pydantic models for audit log entries.
"""

from pydantic import BaseModel, Field
from typing import Optional, Any
from enum import Enum
from datetime import datetime


class EventType(str, Enum):
    FAILURE_DETECTED = "failure_detected"
    CLASSIFIED = "classified"
    ACTION_TAKEN = "action_taken"
    OUTCOME = "outcome"


class Outcome(str, Enum):
    RECOVERED = "recovered"
    ESCALATED = "escalated"
    EXHAUSTED = "exhausted"
    PENDING = "pending"
    DISPATCHED = "dispatched"


class AuditLogEntry(BaseModel):
    id: Optional[int] = None
    payment_id: str
    order_id: str
    event_type: str
    failure_type: Optional[str] = None
    confidence: Optional[float] = None
    llm_reasoning: Optional[str] = None
    action_taken: Optional[str] = None
    action_payload: Optional[Any] = None
    razorpay_response: Optional[Any] = None
    recovery_attempt_number: Optional[int] = None
    outcome: Optional[str] = None
    amount_paise: Optional[int] = None
    created_at: Optional[datetime] = None


class AuditLogCreate(BaseModel):
    payment_id: str
    order_id: str
    event_type: str
    failure_type: Optional[str] = None
    confidence: Optional[float] = None
    llm_reasoning: Optional[str] = None
    action_taken: Optional[str] = None
    action_payload: Optional[Any] = None
    razorpay_response: Optional[Any] = None
    recovery_attempt_number: Optional[int] = None
    outcome: Optional[str] = None
    amount_paise: Optional[int] = None


class AuditListResponse(BaseModel):
    entries: list[AuditLogEntry]
    total: int
    page: int
    limit: int
