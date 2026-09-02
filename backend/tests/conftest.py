"""
Test Configuration & Fixtures
"""

import pytest
import pytest_asyncio
import os
import tempfile
from httpx import AsyncClient, ASGITransport

from backend.config import settings
from backend.main import app
from backend.database import init_db, close_db


@pytest_asyncio.fixture(autouse=True)
async def setup_test_db(monkeypatch):
    """Use a temporary database for each test run."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    monkeypatch.setattr(settings, "DATABASE_URL", f"sqlite+aiosqlite:///{db_path}")

    # Initialize DB schema
    await init_db()

    yield

    await close_db()
    try:
        if os.path.exists(db_path):
            os.remove(db_path)
    except Exception:
        pass


@pytest_asyncio.fixture
async def client():
    """Async test client for FastAPI."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
