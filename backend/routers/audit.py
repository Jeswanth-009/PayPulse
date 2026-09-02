"""
Audit Router — read and export audit trail entries.
"""

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from typing import Optional
from backend.services.audit_logger import audit_logger
from backend.models.audit import AuditListResponse

router = APIRouter(prefix="/api/v1/audit", tags=["audit"])


@router.get("", response_model=AuditListResponse)
async def list_audit_entries(
    payment_id: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    outcome: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
):
    """Full audit log, filterable by payment_id, event_type, outcome."""
    entries, total = await audit_logger.get_audit_trail(
        payment_id=payment_id,
        event_type=event_type,
        outcome=outcome,
        page=page,
        limit=limit,
    )

    return AuditListResponse(
        entries=entries,
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/export")
async def export_audit_csv():
    """Returns audit log as downloadable CSV."""
    csv_content = await audit_logger.export_csv()

    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=paypulse_audit_log.csv"},
    )
