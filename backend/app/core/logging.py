"""
777c8 Career OS — Structured Logging Configuration
Uses loguru for structured, production-grade logging.
"""

import sys
from loguru import logger

from app.core.config import settings


def setup_logging() -> None:
    """Configure application logging."""
    logger.remove()

    log_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
        "<level>{message}</level>"
    )

    logger.add(
        sys.stdout,
        format=log_format,
        level="DEBUG" if settings.DEBUG else "INFO",
        colorize=True,
    )

    logger.add(
        settings.LOGS_DIR / "career_os.log",
        format=log_format,
        level="INFO",
        rotation="10 MB",
        retention="30 days",
        compression="zip",
    )

    logger.info(f"Logging initialized — {settings.APP_NAME} v{settings.APP_VERSION}")
