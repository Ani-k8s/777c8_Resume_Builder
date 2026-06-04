"""
777c8 Career OS — Application Configuration
Uses Pydantic BaseSettings for environment-driven configuration.
"""

from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────────
    APP_NAME: str = "777c8 Career OS"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    API_PREFIX: str = "/api/v1"
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # ── Database ─────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite+aiosqlite:///./storage/career_os.db"

    # ── OpenAI ───────────────────────────────────────────────────
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_MAX_TOKENS: int = 4096
    OPENAI_TEMPERATURE: float = 0.3

    # ── Storage Paths ────────────────────────────────────────────
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    STORAGE_DIR: Path = BASE_DIR / "storage"
    UPLOADS_DIR: Path = STORAGE_DIR / "uploads"
    GENERATED_DIR: Path = STORAGE_DIR / "generated"
    REPORTS_DIR: Path = STORAGE_DIR / "reports"
    TEMPLATES_DIR: Path = BASE_DIR.parent / "templates"
    PROMPTS_DIR: Path = BASE_DIR.parent / "prompts"

    # ── LaTeX ────────────────────────────────────────────────────
    PDFLATEX_PATH: str = "pdflatex"

    # ── Cache ────────────────────────────────────────────────────
    ENABLE_PROMPT_CACHE: bool = True
    CACHE_TTL_SECONDS: int = 3600

    def ensure_directories(self) -> None:
        """Create all required storage directories."""
        for directory in [
            self.STORAGE_DIR,
            self.UPLOADS_DIR,
            self.GENERATED_DIR,
            self.REPORTS_DIR,
        ]:
            directory.mkdir(parents=True, exist_ok=True)


settings = Settings()
