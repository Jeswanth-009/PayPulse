"""
PayPulse Database — async SQLite via aiosqlite
"""

import aiosqlite
import os
from pathlib import Path
from backend.config import settings

# Global connection reference
_db: aiosqlite.Connection | None = None


SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_id TEXT UNIQUE,
    order_id TEXT NOT NULL,
    batch_id TEXT,
    amount_paise INTEGER NOT NULL,
    currency TEXT DEFAULT 'INR',
    method TEXT,
    status TEXT NOT NULL DEFAULT 'created',
    error_code TEXT,
    error_description TEXT,
    error_source TEXT,
    attempts INTEGER DEFAULT 0,
    recovery_attempts INTEGER DEFAULT 0,
    failure_type TEXT,
    customer_email TEXT,
    customer_contact TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_id TEXT NOT NULL,
    order_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    failure_type TEXT,
    confidence REAL,
    llm_reasoning TEXT,
    action_taken TEXT,
    action_payload TEXT,
    razorpay_response TEXT,
    recovery_attempt_number INTEGER,
    outcome TEXT,
    amount_paise INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id TEXT UNIQUE NOT NULL,
    total_payments INTEGER NOT NULL DEFAULT 0,
    total_failures INTEGER NOT NULL DEFAULT 0,
    failure_rate REAL NOT NULL DEFAULT 0.0,
    status TEXT NOT NULL DEFAULT 'running',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_batch_id ON payments(batch_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_audit_payment_id ON audit_log(payment_id);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_outcome ON audit_log(outcome);
"""


async def init_db() -> aiosqlite.Connection:
    """Initialize the database connection and create tables."""
    global _db

    db_path = settings.db_path
    # Ensure the directory exists
    os.makedirs(os.path.dirname(db_path) if os.path.dirname(db_path) else "data", exist_ok=True)

    _db = await aiosqlite.connect(db_path)
    _db.row_factory = aiosqlite.Row

    # Enable WAL mode for better concurrent read performance
    await _db.execute("PRAGMA journal_mode=WAL")
    await _db.execute("PRAGMA foreign_keys=ON")

    # Create tables
    await _db.executescript(SCHEMA_SQL)
    await _db.commit()

    return _db


async def get_db() -> aiosqlite.Connection:
    """Get the current database connection."""
    global _db
    if _db is None:
        _db = await init_db()
    return _db


async def close_db():
    """Close the database connection."""
    global _db
    if _db is not None:
        await _db.close()
        _db = None
