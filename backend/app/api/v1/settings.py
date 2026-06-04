from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional

from app.core.database import get_db
from app.models import SystemSettings, AICostLog
from app.schemas import (
    SystemSettingsResponse,
    SystemSettingsUpdate,
    APIKeyUpdate,
    AICostLogResponse,
)
from app.services.settings_service import settings_service

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("", response_model=SystemSettingsResponse)
async def get_settings(db: AsyncSession = Depends(get_db)):
    """Retrieve the current system configuration and API key status."""
    settings = await settings_service.get_settings(db)
    
    # Get decrypted keys map to construct keys status (True if key is present)
    keys = await settings_service.get_api_keys(db)
    api_keys_status = {k: bool(v) for k, v in keys.items()}
    
    # Pre-populate common keys with False if not present
    providers = ["openai", "anthropic", "gemini", "openrouter", "groq", "deepseek"]
    for p in providers:
        if p not in api_keys_status:
            api_keys_status[p] = False

    return SystemSettingsResponse(
        encrypt_files=settings.encrypt_files,
        master_resume_locked=settings.master_resume_locked,
        ollama_url=settings.ollama_url,
        active_provider=settings.active_provider,
        active_model=settings.active_model,
        backup_interval_days=settings.backup_interval_days,
        failover_enabled=settings.failover_enabled,
        failover_provider=settings.failover_provider,
        api_keys_status=api_keys_status,
    )

@router.put("", response_model=SystemSettingsResponse)
async def update_settings(update_data: SystemSettingsUpdate, db: AsyncSession = Depends(get_db)):
    """Update global system configurations."""
    settings = await settings_service.get_settings(db)
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)
        
    await db.commit()
    await db.refresh(settings)
    
    # Retrieve key status
    keys = await settings_service.get_api_keys(db)
    api_keys_status = {k: bool(v) for k, v in keys.items()}
    providers = ["openai", "anthropic", "gemini", "openrouter", "groq", "deepseek"]
    for p in providers:
        if p not in api_keys_status:
            api_keys_status[p] = False

    return SystemSettingsResponse(
        encrypt_files=settings.encrypt_files,
        master_resume_locked=settings.master_resume_locked,
        ollama_url=settings.ollama_url,
        active_provider=settings.active_provider,
        active_model=settings.active_model,
        backup_interval_days=settings.backup_interval_days,
        failover_enabled=settings.failover_enabled,
        failover_provider=settings.failover_provider,
        api_keys_status=api_keys_status,
    )

@router.post("/keys", status_code=204)
async def update_api_key(payload: APIKeyUpdate, db: AsyncSession = Depends(get_db)):
    """Update or save an API key for a targeted provider. Requires application to be unlocked."""
    try:
        await settings_service.update_api_key(db, payload.provider.lower(), payload.key)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update API key: {str(e)}")

@router.delete("/keys/{provider}", status_code=204)
async def delete_api_key(provider: str, db: AsyncSession = Depends(get_db)):
    """Delete the API key for a targeted provider. Requires application to be unlocked."""
    try:
        await settings_service.delete_api_key(db, provider.lower())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete API key: {str(e)}")

@router.get("/costs", response_model=list[AICostLogResponse])
async def get_cost_logs(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    feature: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve paginated cost logs, optionally filtered by feature/endpoint type."""
    query = select(AICostLog).order_by(AICostLog.created_at.desc())
    if feature:
        query = query.where(AICostLog.feature == feature)
    
    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/costs/summary")
async def get_cost_summary(db: AsyncSession = Depends(get_db)):
    """Retrieve summarized statistics for total token usage and cumulative cost."""
    query = select(
        func.sum(AICostLog.tokens_prompt).label("prompt"),
        func.sum(AICostLog.tokens_completion).label("completion"),
        func.sum(AICostLog.estimated_cost_usd).label("cost")
    )
    result = await db.execute(query)
    stats = result.first()
    
    return {
        "total_tokens_prompt": stats.prompt or 0,
        "total_tokens_completion": stats.completion or 0,
        "total_tokens_used": (stats.prompt or 0) + (stats.completion or 0),
        "total_cost_usd": stats.cost or 0.0,
    }
