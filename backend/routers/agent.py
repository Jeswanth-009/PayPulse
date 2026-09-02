"""
Agent Router — trigger agent runs and check status.
"""

import asyncio
from fastapi import APIRouter, BackgroundTasks
from backend.services.monitor import payment_monitor
from backend.models.agent import AgentStatus

router = APIRouter(prefix="/api/v1/agent", tags=["agent"])


@router.post("/run")
async def trigger_agent_run(background_tasks: BackgroundTasks):
    """Trigger the agent on all failed/stale payments immediately (bypasses scheduler)."""
    if payment_monitor.is_running:
        return {
            "status": "already_running",
            "message": "Agent is already processing payments",
        }

    background_tasks.add_task(payment_monitor.run_agent_loop)

    return {
        "status": "started",
        "message": "Agent loop triggered — processing all pending failures",
    }


@router.get("/status", response_model=AgentStatus)
async def get_agent_status():
    """Returns agent health, last run time, current queue size."""
    return payment_monitor.get_status()
