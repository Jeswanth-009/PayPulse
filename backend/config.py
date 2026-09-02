"""
PayPulse Configuration — loads all settings from .env
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Razorpay
    RAZORPAY_KEY_ID: str = "rzp_test_xxxxxxxxxxxx"
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""

    # Anthropic
    ANTHROPIC_API_KEY: str = ""

    # OpenRouter
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "minimax/minimax-m3:free"

    # App
    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:5173"

    # Agent config
    AGENT_POLL_INTERVAL_SECONDS: int = 30
    MAX_RECOVERY_ATTEMPTS: int = 2
    PAYMENT_STALE_THRESHOLD_MINUTES: int = 10

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/paypulse.db"

    @property
    def db_path(self) -> str:
        """Extract the file path from the DATABASE_URL."""
        url = self.DATABASE_URL
        if url.startswith("sqlite+aiosqlite:///"):
            return url.replace("sqlite+aiosqlite:///", "")
        if url.startswith("sqlite:///"):
            return url.replace("sqlite:///", "")
        return "./data/paypulse.db"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
