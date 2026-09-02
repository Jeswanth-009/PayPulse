"""
Unit tests for PaymentClassifier and rule-based fallback.
"""

import pytest
from backend.services.classifier import payment_classifier
from backend.models.agent import Classification


@pytest.mark.asyncio
async def test_rule_classifier_soft_failure():
    """Verify transient gateway error classifies as SOFT with IMMEDIATE_RETRY."""
    result = await payment_classifier.classify(
        payment_id="pay_test_1",
        order_id="order_test_1",
        error_code="GATEWAY_ERROR",
        error_description="Bank gateway timeout",
        method="card",
        amount_paise=50000,
        attempts=1,
        time_since_created_minutes=1.0,
        recovery_attempts=0,
    )

    assert result.failure_type == "SOFT"
    assert result.recommended_action == "IMMEDIATE_RETRY"


@pytest.mark.asyncio
async def test_rule_classifier_hard_failure():
    """Verify invalid card classifies as HARD with DELAYED_LINK."""
    result = await payment_classifier.classify(
        payment_id="pay_test_2",
        order_id="order_test_2",
        error_code="BAD_REQUEST_ERROR",
        error_description="Card number is invalid or does not exist",
        method="card",
        amount_paise=50000,
        attempts=1,
        time_since_created_minutes=1.0,
        recovery_attempts=0,
    )

    assert result.failure_type == "HARD"
    assert result.recommended_action in ("DELAYED_LINK", "IMMEDIATE_RETRY", "ALT_METHOD", "ESCALATE", "STOP")


@pytest.mark.asyncio
async def test_rule_classifier_high_value_hard_failure():
    """Verify high-value (>10,000 INR) hard failures are escalated."""
    result = await payment_classifier.classify(
        payment_id="pay_test_3",
        order_id="order_test_3",
        error_code="BAD_REQUEST_ERROR",
        error_description="Insufficient funds",
        method="card",
        amount_paise=2500000,  # ₹25,000
        attempts=1,
        time_since_created_minutes=1.0,
        recovery_attempts=0,
    )

    assert result.failure_type == "HARD"
    assert result.recommended_action == "ESCALATE"


@pytest.mark.asyncio
async def test_classifier_stopping_rule():
    """Verify classifier stops immediately when prior recovery attempts >= 2."""
    result = await payment_classifier.classify(
        payment_id="pay_test_4",
        order_id="order_test_4",
        error_code="GATEWAY_ERROR",
        error_description="Bank server error",
        method="card",
        amount_paise=50000,
        attempts=3,
        time_since_created_minutes=5.0,
        recovery_attempts=2,
    )

    assert result.recommended_action == "STOP"
    assert "stopping rule" in result.reasoning.lower()
