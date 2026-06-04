"""
777c8 Career OS — Database Engine & Session Management
SQLAlchemy async engine with SQLite default, PostgreSQL-ready.
"""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


async def get_db() -> AsyncSession:
    """Dependency: yields an async database session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Create all tables. Used for initial setup (dev/local mode)."""
    import app.models # noqa
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
        # Add new columns to existing tables if they do not exist
        try:
            await conn.execute(text("ALTER TABLE master_resumes ADD COLUMN is_locked BOOLEAN DEFAULT 1"))
        except Exception:
            pass
        
        try:
            await conn.execute(text("ALTER TABLE generated_resumes ADD COLUMN recruiter_readability_score FLOAT DEFAULT 0.0"))
        except Exception:
            pass
            
        try:
            await conn.execute(text("ALTER TABLE generated_resumes ADD COLUMN grammar_score FLOAT DEFAULT 0.0"))
        except Exception:
            pass
            
        try:
            await conn.execute(text("ALTER TABLE generated_resumes ADD COLUMN readability_metrics JSON"))
        except Exception:
            pass

        try:
            await conn.execute(text("ALTER TABLE applications ADD COLUMN company_id INTEGER"))
        except Exception:
            pass

        try:
            await conn.execute(text("ALTER TABLE applications ADD COLUMN recruiter_id INTEGER"))
        except Exception:
            pass

        try:
            await conn.execute(text("ALTER TABLE applications ADD COLUMN cover_letter_content TEXT"))
        except Exception:
            pass

        try:
            await conn.execute(text("ALTER TABLE applications ADD COLUMN linkedin_messages JSON"))
        except Exception:
            pass

        try:
            await conn.execute(text("ALTER TABLE applications ADD COLUMN skill_gap_analysis JSON"))
        except Exception:
            pass

        try:
            await conn.execute(text("ALTER TABLE interviews ADD COLUMN questions_asked TEXT"))
        except Exception:
            pass

        try:
            await conn.execute(text("ALTER TABLE interviews ADD COLUMN answers_given TEXT"))
        except Exception:
            pass

        try:
            await conn.execute(text("ALTER TABLE interviews ADD COLUMN lessons_learned TEXT"))
        except Exception:
            pass

        try:
            await conn.execute(text("ALTER TABLE interviews ADD COLUMN performance_metrics JSON"))
        except Exception:
            pass

        try:
            await conn.execute(text("ALTER TABLE system_settings ADD COLUMN benchmark_enabled BOOLEAN DEFAULT 0"))
        except Exception:
            pass
