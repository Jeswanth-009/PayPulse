"""
PayPulse — FastAPI Application Entrypoint

AI-Powered Payment Failure Recovery Agent
Razorpay AI Buildathon 2026
"""

import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from backend.config import settings
from backend.database import init_db, close_db
from backend.services.monitor import payment_monitor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("paypulse")

# Scheduler instance
scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    # ── Startup ──
    logger.info("=" * 60)
    logger.info("  PayPulse — Detect. Decide. Recover.")
    logger.info("  Starting up...")
    logger.info("=" * 60)

    # Initialize database
    await init_db()
    logger.info("Database initialized")

    # Start APScheduler for periodic monitoring
    scheduler.add_job(
        payment_monitor.run_agent_loop,
        "interval",
        seconds=settings.AGENT_POLL_INTERVAL_SECONDS,
        id="payment_monitor",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started (poll interval: %ds)", settings.AGENT_POLL_INTERVAL_SECONDS)

    logger.info("PayPulse is live on %s:%d", settings.APP_HOST, settings.APP_PORT)

    yield

    # ── Shutdown ──
    logger.info("Shutting down PayPulse...")
    scheduler.shutdown(wait=False)
    await close_db()
    logger.info("Shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="PayPulse",
    description="AI-Powered Payment Failure Recovery Agent — Razorpay AI Buildathon 2026",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
from backend.routers import payments, agent, batch, audit, webhook

app.include_router(payments.router)
app.include_router(agent.router)
app.include_router(batch.router)
app.include_router(audit.router)
app.include_router(webhook.router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "PayPulse",
        "version": "1.0.0",
        "agent": payment_monitor.get_status().model_dump(),
    }


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "PayPulse",
        "tagline": "Detect. Decide. Recover.",
        "version": "1.0.0",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=settings.APP_ENV == "development",
        workers=1,  # Single worker to avoid APScheduler duplication
    )
