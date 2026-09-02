"""
Pydantic models for agent classification and recovery results.
"""

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime


class RecoveryAction(str, Enum):
    IMMEDIATE_RETRY = "IMMEDIATE_RETRY"
    DELAYED_LINK = "DELAYED_LINK"
    ALT_METHOD = "ALT_METHOD"
    ESCALATE = "ESCALATE"
    STOP = "STOP"


class Classification(BaseModel):
    failure_type: str
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str
    recommended_action: str
    recovery_message_hint: str = ""


class RecoveryResult(BaseModel):
    action: str
    outcome: str
    payment_link_id: Optional[str] = None
    payment_link_url: Optional[str] = None
    razorpay_response: Optional[dict] = None
    error: Optional[str] = None


class AgentStatus(BaseModel):
    is_running: bool = False
    last_run_at: Optional[datetime] = None
    queue_size: int = 0
    total_processed: int = 0
    current_batch_id: Optional[str] = None
    uptime_seconds: float = 0
