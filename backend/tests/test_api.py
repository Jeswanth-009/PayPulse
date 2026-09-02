"""
Integration tests for FastAPI endpoints.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """Verify /health endpoint returns 200 with agent status."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "PayPulse"
    assert "agent" in data


@pytest.mark.asyncio
async def test_payments_list_empty(client: AsyncClient):
    """Verify /api/v1/payments returns empty list initially."""
    response = await client.get("/api/v1/payments")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["payments"] == []


@pytest.mark.asyncio
async def test_agent_status(client: AsyncClient):
    """Verify /api/v1/agent/status returns health and uptime metrics."""
    response = await client.get("/api/v1/agent/status")
    assert response.status_code == 200
    data = response.json()
    assert "is_running" in data
    assert "queue_size" in data
    assert "uptime_seconds" in data


@pytest.mark.asyncio
async def test_webhook_invalid_signature_rejected(client: AsyncClient):
    """Verify webhook endpoint rejects payloads with missing/invalid HMAC signature."""
    response = await client.post(
        "/webhook/razorpay",
        headers={"X-Razorpay-Signature": "invalid_signature"},
        content=b'{"event": "payment.failed"}',
    )
    assert response.status_code == 400
