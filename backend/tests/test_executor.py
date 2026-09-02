"""
Unit tests for RecoveryExecutor, stopping rule gate, and action payloads.
"""

import pytest
from backend.services.executor import recovery_executor
from backend.services.audit_logger import audit_logger
from backend.models.agent import Classification
from backend.models.payment import Payment


@pytest.mark.asyncio
async def test_executor_stopping_rule_enforcement():
    """Verify executor refuses to retry when prior recovery attempts >= 2."""
    payment = Payment(
        payment_id="pay_stop_test",
        order_id="order_stop_test",
        amount_paise=50000,
        status="failed",
    )

    # Log 2 prior recovery attempts
    await audit_logger.log(
        payment_id="pay_stop_test",
        order_id="order_stop_test",
        event_type="action_taken",
        action_taken="IMMEDIATE_RETRY",
        outcome="dispatched",
        recovery_attempt_number=1,
    )
    await audit_logger.log(
        payment_id="pay_stop_test",
        order_id="order_stop_test",
        event_type="action_taken",
        action_taken="IMMEDIATE_RETRY",
        outcome="dispatched",
        recovery_attempt_number=2,
    )

    classification = Classification(
        failure_type="SOFT",
        confidence=0.9,
        reasoning="Test retry",
        recommended_action="IMMEDIATE_RETRY",
    )

    result = await recovery_executor.execute_recovery(payment, classification)

    assert result.action == "STOP"
    assert result.outcome == "exhausted"


@pytest.mark.asyncio
async def test_executor_escalate_action():
    """Verify ESCALATE creates an escalated audit log without calling Payment Links API."""
    payment = Payment(
        payment_id="pay_esc_test",
        order_id="order_esc_test",
        amount_paise=1500000,
        status="failed",
    )

    classification = Classification(
        failure_type="HARD",
        confidence=0.8,
        reasoning="High value payment failure",
        recommended_action="ESCALATE",
    )

    result = await recovery_executor.execute_recovery(payment, classification)

    assert result.action == "ESCALATE"
    assert result.outcome == "escalated"
