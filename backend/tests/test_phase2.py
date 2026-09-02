"""
Phase 2 Automated Test Suite — Policy Studio, Failure Studio, Recovery Messages
"""

import pytest
import httpx
from backend.services.message_generator import generate_recovery_message


@pytest.mark.asyncio
async def test_get_merchant_config(client: httpx.AsyncClient):
    """Verify GET /api/v1/config returns all 5 default keys."""
    res = await client.get("/api/v1/config")
    assert res.status_code == 200
    data = res.json()
    keys = {item["key"] for item in data}
    expected_keys = {
        "merchant_name",
        "max_retry_attempts",
        "escalation_threshold",
        "llm_provider",
        "agent_poll_interval",
    }
    assert expected_keys.issubset(keys)


@pytest.mark.asyncio
async def test_update_config_validation(client: httpx.AsyncClient):
    """Verify out-of-range value returns 400 and valid value returns 200."""
    # Invalid: max_retry_attempts > 3
    res_bad = await client.put("/api/v1/config/max_retry_attempts", json={"value": "5"})
    assert res_bad.status_code == 400

    # Valid: max_retry_attempts = 1
    res_good = await client.put("/api/v1/config/max_retry_attempts", json={"value": "1"})
    assert res_good.status_code == 200
    assert res_good.json()["value"] == "1"

    # Reset back to 2
    await client.put("/api/v1/config/max_retry_attempts", json={"value": "2"})


@pytest.mark.asyncio
async def test_studio_presets_endpoint(client: httpx.AsyncClient):
    """Verify GET /api/v1/studio/presets returns 4 presets."""
    res = await client.get("/api/v1/studio/presets")
    assert res.status_code == 200
    presets = res.json()
    assert len(presets) == 4
    preset_keys = {p["key"] for p in presets}
    assert "bank_timeout" in preset_keys
    assert "upi_dropped" in preset_keys
    assert "hard_decline" in preset_keys
    assert "otp_timeout_highvalue" in preset_keys


@pytest.mark.asyncio
async def test_studio_fire_bank_timeout(client: httpx.AsyncClient):
    """Verify POST /api/v1/studio/fire runs synchronous pipeline."""
    res = await client.post("/api/v1/studio/fire", json={"preset": "bank_timeout"})
    assert res.status_code == 200
    data = res.json()
    assert "payment_id" in data
    assert "order_id" in data
    assert "classification" in data
    assert "action_taken" in data
    assert "outcome" in data
    assert len(data["audit_entries"]) >= 1


@pytest.mark.asyncio
async def test_recovery_message_character_limits():
    """Verify recovery message generator respects hard character limits (WA <= 300, SMS <= 160)."""
    res = await generate_recovery_message(
        payment_id="test_pay_123",
        order_id="test_ord_123",
        customer_name="Aarav Sharma",
        amount_rupees=2499.0,
        failure_type="SOFT",
        action_taken="IMMEDIATE_RETRY",
        payment_link_url="https://rzp.io/rzp/testlink123",
        merchant_name="PayPulse Demo Store",
        order_notes='{"language_hint": "hi"}',
    )
    assert len(res["whatsapp"]) <= 300, f"WhatsApp message exceeded 300 chars: {len(res['whatsapp'])}"
    assert len(res["sms"]) <= 160, f"SMS message exceeded 160 chars: {len(res['sms'])}"
    assert res["tone"] in ["hinglish", "english"]


@pytest.mark.asyncio
async def test_get_recovery_message_endpoint(client: httpx.AsyncClient):
    """Verify GET /api/v1/payments/{id}/message returns 404 for unknown payments."""
    res = await client.get("/api/v1/payments/non_existent_payment_id/message")
    assert res.status_code == 404
