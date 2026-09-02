"""
Pydantic models for batch reports.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class BatchRunRequest(BaseModel):
    count: int = Field(default=100, ge=10, le=200)
    failure_rate: float = Field(default=0.25, ge=0.0, le=0.5)


class FailureBreakdown(BaseModel):
    SOFT: int = 0
    HARD: int = 0
    UPI_HANDOFF: int = 0
    SESSION_TIMEOUT: int = 0


class BatchReport(BaseModel):
    batch_id: str
    total_payments: int = 0
    total_failures: int = 0
    recovery_attempted: int = 0
    recovered: int = 0
    escalated: int = 0
    exhausted: int = 0
    recovery_rate: str = "0.00%"
    money_at_risk_paise: int = 0
    money_recovered_paise: int = 0
    failure_breakdown: FailureBreakdown = FailureBreakdown()
    false_positive_count: int = 0
    exceptions: list[dict] = []
    status: str = "running"
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class BatchListResponse(BaseModel):
    batches: list[dict]
    total: int
