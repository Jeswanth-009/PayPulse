"""
policy_engine.py
Runtime config store. Every service reads live merchant settings from here.
Never read MAX_RECOVERY_ATTEMPTS or ESCALATION_THRESHOLD from .env after this exists.
"""

from typing import Any
import aiosqlite

VALID_LLM_PROVIDERS = ["openrouter/minimax", "claude-sonnet-4-6", "gemini-pro"]
CONFIG_RANGES = {
    "max_retry_attempts": (1, 3),
    "escalation_threshold": (1000, 100000),
    "agent_poll_interval": (10, 120),
}


class PolicyEngine:

    async def get_all(self, db: aiosqlite.Connection) -> list[dict]:
        cursor = await db.execute("SELECT * FROM merchant_config ORDER BY key")
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]

    async def get(self, key: str, db: aiosqlite.Connection) -> Any:
        cursor = await db.execute(
            "SELECT value, value_type FROM merchant_config WHERE key = ?", (key,)
        )
        row = await cursor.fetchone()
        if not row:
            raise KeyError(f"Config key '{key}' not found")
        return self._cast(row["value"], row["value_type"])

    async def update(self, key: str, value: str, db: aiosqlite.Connection) -> dict:
        cursor = await db.execute(
            "SELECT value_type FROM merchant_config WHERE key = ?", (key,)
        )
        row = await cursor.fetchone()
        if not row:
            raise KeyError(f"Config key '{key}' not found")

        value_type = row["value_type"]
        self._validate(key, value, value_type)

        await db.execute(
            "UPDATE merchant_config SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?",
            (value, key),
        )
        await db.commit()
        cursor = await db.execute(
            "SELECT * FROM merchant_config WHERE key = ?", (key,)
        )
        updated = await cursor.fetchone()
        return dict(updated)

    def _cast(self, value: str, value_type: str) -> Any:
        if value_type == "integer":
            return int(value)
        if value_type == "float":
            return float(value)
        return value  # string and select

    def _validate(self, key: str, value: str, value_type: str):
        if value_type == "integer":
            try:
                v = int(value)
            except ValueError:
                raise ValueError(f"'{key}' must be an integer, got: {value}")
            if key in CONFIG_RANGES:
                lo, hi = CONFIG_RANGES[key]
                if not (lo <= v <= hi):
                    raise ValueError(f"'{key}' must be between {lo} and {hi}, got: {v}")
        elif value_type == "select":
            if key == "llm_provider" and value not in VALID_LLM_PROVIDERS:
                raise ValueError(f"'{key}' must be one of {VALID_LLM_PROVIDERS}")


policy_engine = PolicyEngine()
