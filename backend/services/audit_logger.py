"""
Audit Logger — all writes and reads to the audit_log table.
"""

import json
import csv
import io
import logging
from typing import Optional
from backend.database import get_db

logger = logging.getLogger(__name__)


class AuditLogger:
    """Handles all audit log operations."""

    async def log(
        self,
        payment_id: str,
        order_id: str,
        event_type: str,
        failure_type: Optional[str] = None,
        confidence: Optional[float] = None,
        llm_reasoning: Optional[str] = None,
        action_taken: Optional[str] = None,
        action_payload: Optional[dict | str] = None,
        razorpay_response: Optional[dict | str] = None,
        recovery_attempt_number: Optional[int] = None,
        outcome: Optional[str] = None,
        amount_paise: Optional[int] = None,
    ) -> int:
        """Write an audit log entry. Returns the row ID."""
        db = await get_db()

        # Serialize dicts to JSON strings
        payload_str = json.dumps(action_payload) if isinstance(action_payload, dict) else action_payload
        response_str = json.dumps(razorpay_response) if isinstance(razorpay_response, dict) else razorpay_response

        cursor = await db.execute(
            """
            INSERT INTO audit_log
                (payment_id, order_id, event_type, failure_type, confidence,
                 llm_reasoning, action_taken, action_payload, razorpay_response,
                 recovery_attempt_number, outcome, amount_paise)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payment_id, order_id, event_type, failure_type, confidence,
                llm_reasoning, action_taken, payload_str, response_str,
                recovery_attempt_number, outcome, amount_paise,
            ),
        )
        await db.commit()

        logger.info(
            "Audit [%s] %s → %s | %s | %s",
            event_type, payment_id, action_taken or "-", outcome or "-", llm_reasoning or "-"
        )
        return cursor.lastrowid

    async def count_recovery_attempts(self, payment_id: str) -> int:
        """Count how many recovery actions have been taken for a payment."""
        db = await get_db()
        cursor = await db.execute(
            """
            SELECT COUNT(*) FROM audit_log
            WHERE payment_id = ? AND event_type = 'action_taken'
            AND action_taken NOT IN ('STOP', 'ESCALATE')
            """,
            (payment_id,),
        )
        row = await cursor.fetchone()
        return row[0] if row else 0

    async def get_audit_trail(
        self,
        payment_id: Optional[str] = None,
        event_type: Optional[str] = None,
        outcome: Optional[str] = None,
        page: int = 1,
        limit: int = 50,
    ) -> tuple[list[dict], int]:
        """Get paginated audit log entries with optional filters."""
        db = await get_db()

        conditions = []
        params = []

        if payment_id:
            conditions.append("payment_id = ?")
            params.append(payment_id)
        if event_type:
            conditions.append("event_type = ?")
            params.append(event_type)
        if outcome:
            conditions.append("outcome = ?")
            params.append(outcome)

        where_clause = " AND ".join(conditions) if conditions else "1=1"

        # Count total
        cursor = await db.execute(
            f"SELECT COUNT(*) FROM audit_log WHERE {where_clause}", params
        )
        total_row = await cursor.fetchone()
        total = total_row[0]

        # Fetch page
        offset = (page - 1) * limit
        cursor = await db.execute(
            f"""
            SELECT * FROM audit_log
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
            """,
            params + [limit, offset],
        )
        rows = await cursor.fetchall()

        entries = []
        for row in rows:
            entry = dict(row)
            # Parse JSON fields
            if entry.get("action_payload"):
                try:
                    entry["action_payload"] = json.loads(entry["action_payload"])
                except (json.JSONDecodeError, TypeError):
                    pass
            if entry.get("razorpay_response"):
                try:
                    entry["razorpay_response"] = json.loads(entry["razorpay_response"])
                except (json.JSONDecodeError, TypeError):
                    pass
            entries.append(entry)

        return entries, total

    async def get_entries_for_payment(self, payment_id: str) -> list[dict]:
        """Get all audit entries for a specific payment."""
        entries, _ = await self.get_audit_trail(payment_id=payment_id, limit=1000)
        return entries

    async def export_csv(self) -> str:
        """Export entire audit log as CSV string."""
        db = await get_db()
        cursor = await db.execute("SELECT * FROM audit_log ORDER BY created_at DESC")
        rows = await cursor.fetchall()

        output = io.StringIO()
        if rows:
            writer = csv.DictWriter(output, fieldnames=dict(rows[0]).keys())
            writer.writeheader()
            for row in rows:
                writer.writerow(dict(row))

        return output.getvalue()

    async def get_batch_stats(self, batch_id: str) -> dict:
        """Get aggregated stats for a batch from the audit log."""
        db = await get_db()

        # Get all payments in the batch
        cursor = await db.execute(
            "SELECT DISTINCT payment_id, amount_paise FROM payments WHERE batch_id = ?",
            (batch_id,),
        )
        all_payments = await cursor.fetchall()
        total_payments = len(all_payments)

        # Get failed payments
        cursor = await db.execute(
            "SELECT DISTINCT payment_id, amount_paise FROM payments WHERE batch_id = ? AND status = 'failed'",
            (batch_id,),
        )
        failed_payments = await cursor.fetchall()
        total_failures = len(failed_payments)

        # Money at risk
        money_at_risk = sum(p["amount_paise"] for p in failed_payments)

        # Count outcomes from audit log
        cursor = await db.execute(
            """
            SELECT outcome, COUNT(DISTINCT payment_id) as cnt,
                   SUM(amount_paise) as total_amount
            FROM audit_log
            WHERE payment_id IN (
                SELECT payment_id FROM payments WHERE batch_id = ?
            )
            AND event_type = 'action_taken'
            GROUP BY outcome
            """,
            (batch_id,),
        )
        outcome_rows = await cursor.fetchall()

        recovered = 0
        escalated = 0
        exhausted = 0
        money_recovered = 0

        for row in outcome_rows:
            if row["outcome"] == "dispatched" or row["outcome"] == "recovered":
                recovered += row["cnt"]
                money_recovered += row["total_amount"] or 0
            elif row["outcome"] == "escalated":
                escalated += row["cnt"]
            elif row["outcome"] == "exhausted":
                exhausted += row["cnt"]

        # Failure type breakdown
        cursor = await db.execute(
            """
            SELECT failure_type, COUNT(DISTINCT payment_id) as cnt
            FROM audit_log
            WHERE payment_id IN (
                SELECT payment_id FROM payments WHERE batch_id = ?
            )
            AND event_type = 'classified'
            AND failure_type IS NOT NULL
            GROUP BY failure_type
            """,
            (batch_id,),
        )
        breakdown_rows = await cursor.fetchall()
        breakdown = {"SOFT": 0, "HARD": 0, "UPI_HANDOFF": 0, "SESSION_TIMEOUT": 0}
        for row in breakdown_rows:
            if row["failure_type"] in breakdown:
                breakdown[row["failure_type"]] = row["cnt"]

        recovery_rate = (recovered / total_failures * 100) if total_failures > 0 else 0

        return {
            "batch_id": batch_id,
            "total_payments": total_payments,
            "total_failures": total_failures,
            "recovery_attempted": total_failures,
            "recovered": recovered,
            "escalated": escalated,
            "exhausted": exhausted,
            "recovery_rate": f"{recovery_rate:.2f}%",
            "money_at_risk_paise": money_at_risk,
            "money_recovered_paise": money_recovered,
            "failure_breakdown": breakdown,
            "false_positive_count": 0,
            "exceptions": [],
        }


# Singleton instance
audit_logger = AuditLogger()
