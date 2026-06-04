"""
777c8 Career OS — Application Configuration
Uses Pydantic BaseSettings for environment-driven configuration.
"""

from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


from pydantic import model_validator

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

    # ── Auth & Vault ─────────────────────────────────────────────
    MASTER_PASSWORD: Optional[str] = None

    # ── Unified LLMs ─────────────────────────────────────────────
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_MAX_TOKENS: int = 4096
    OPENAI_TEMPERATURE: float = 0.3
    ANTHROPIC_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    DEFAULT_PROVIDER: Optional[str] = None
    DEFAULT_MODEL: Optional[str] = None

    # ── Storage Path Overrides ───────────────────────────────────
    STORAGE_PATH: Optional[str] = None
    UPLOAD_PATH: Optional[str] = None
    GENERATED_PATH: Optional[str] = None
    BACKUP_PATH: Optional[str] = None
    LOG_PATH: Optional[str] = None

    # ── Computed Storage Paths ───────────────────────────────────
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    STORAGE_DIR: Optional[Path] = None
    UPLOADS_DIR: Optional[Path] = None
    GENERATED_DIR: Optional[Path] = None
    BACKUPS_DIR: Optional[Path] = None
    LOGS_DIR: Optional[Path] = None
    REPORTS_DIR: Optional[Path] = None
    TEMPLATES_DIR: Optional[Path] = None
    PROMPTS_DIR: Optional[Path] = None

    # ── LaTeX ────────────────────────────────────────────────────
    PDFLATEX_PATH: str = "pdflatex"

    # ── Cache ────────────────────────────────────────────────────
    ENABLE_PROMPT_CACHE: bool = True
    CACHE_TTL_SECONDS: int = 3600

    @model_validator(mode="after")
    def compute_paths(self) -> "Settings":
        # Resolve storage directory
        if self.STORAGE_PATH:
            self.STORAGE_DIR = Path(self.STORAGE_PATH).resolve()
        else:
            self.STORAGE_DIR = (self.BASE_DIR / "storage").resolve()
            
        # Resolve uploads directory
        if self.UPLOAD_PATH:
            self.UPLOADS_DIR = Path(self.UPLOAD_PATH).resolve()
        else:
            self.UPLOADS_DIR = self.STORAGE_DIR / "uploads"
            
        # Resolve generated directory
        if self.GENERATED_PATH:
            self.GENERATED_DIR = Path(self.GENERATED_PATH).resolve()
        else:
            self.GENERATED_DIR = self.STORAGE_DIR / "generated"

        # Resolve backups directory
        if self.BACKUP_PATH:
            self.BACKUPS_DIR = Path(self.BACKUP_PATH).resolve()
        else:
            self.BACKUPS_DIR = self.STORAGE_DIR / "backups"

        # Resolve logs directory
        if self.LOG_PATH:
            self.LOGS_DIR = Path(self.LOG_PATH).resolve()
        else:
            self.LOGS_DIR = self.STORAGE_DIR / "logs"

        # Reports directory
        self.REPORTS_DIR = self.STORAGE_DIR / "reports"
        
        # Templates and Prompts directories
        self.TEMPLATES_DIR = self.BASE_DIR.parent / "templates"
        self.PROMPTS_DIR = self.BASE_DIR.parent / "prompts"

        # Database URL absolute path mapping
        # If DATABASE_URL is SQLite default relative path and STORAGE_DIR is modified
        # we should ensure it resolves properly
        if self.DATABASE_URL.startswith("sqlite+aiosqlite:///./storage/"):
            # Extract db filename
            db_name = self.DATABASE_URL.split("/")[-1]
            self.DATABASE_URL = f"sqlite+aiosqlite:///{self.STORAGE_DIR.as_posix()}/{db_name}"
        elif self.DATABASE_URL.startswith("sqlite+aiosqlite:///"):
            # Resolve relative SQLite database path against BASE_DIR
            db_path = self.DATABASE_URL.replace("sqlite+aiosqlite:///", "")
            if not Path(db_path).is_absolute():
                self.DATABASE_URL = f"sqlite+aiosqlite:///{ (self.BASE_DIR / db_path).resolve().as_posix() }"

        return self

    def ensure_directories(self) -> None:
        """Create all required storage directories."""
        for directory in [
            self.STORAGE_DIR,
            self.UPLOADS_DIR,
            self.GENERATED_DIR,
            self.BACKUPS_DIR,
            self.LOGS_DIR,
            self.REPORTS_DIR,
        ]:
            if directory:
                directory.mkdir(parents=True, exist_ok=True)


settings = Settings()

