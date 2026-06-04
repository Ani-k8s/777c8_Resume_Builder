import json
from typing import Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import SystemSettings
from app.services.crypto_service import crypto_service

class SettingsService:
    async def get_settings(self, db: AsyncSession) -> SystemSettings:
        """Get or create the global system settings."""
        result = await db.execute(select(SystemSettings).where(SystemSettings.id == 1))
        settings = result.scalar_one_or_none()
        if not settings:
            from app.core.config import settings as config_settings
            active_provider = config_settings.DEFAULT_PROVIDER or "openai"
            active_model = config_settings.DEFAULT_MODEL or "gpt-4o-mini"
            settings = SystemSettings(
                id=1,
                encrypt_files=False,
                master_resume_locked=True,
                ollama_url="http://localhost:11434",
                active_provider=active_provider,
                active_model=active_model,
                backup_interval_days=7,
                failover_enabled=True,
                failover_provider="openrouter"
            )
            db.add(settings)
            await db.commit()
            await db.refresh(settings)
        return settings

    async def get_api_keys(self, db: AsyncSession) -> Dict[str, str]:
        """Retrieve all decrypted API keys. Returns empty dict if locked or none configured."""
        settings = await self.get_settings(db)
        if not settings.encrypted_api_keys:
            return {}
        
        if not crypto_service.is_unlocked():
            return {}
            
        try:
            decrypted = crypto_service.decrypt_string(settings.encrypted_api_keys)
            return json.loads(decrypted)
        except Exception:
            return {}

    async def update_api_key(self, db: AsyncSession, provider: str, key: str) -> None:
        """Update an API key for a specific provider."""
        if not crypto_service.is_unlocked():
            raise ValueError("Application is locked. Master password required.")
            
        settings = await self.get_settings(db)
        keys = await self.get_api_keys(db)
        keys[provider] = key
        
        encrypted = crypto_service.encrypt_string(json.dumps(keys))
        settings.encrypted_api_keys = encrypted
        await db.commit()

    async def delete_api_key(self, db: AsyncSession, provider: str) -> None:
        """Remove an API key for a provider."""
        if not crypto_service.is_unlocked():
            raise ValueError("Application is locked. Master password required.")
            
        settings = await self.get_settings(db)
        keys = await self.get_api_keys(db)
        if provider in keys:
            del keys[provider]
            
        encrypted = crypto_service.encrypt_string(json.dumps(keys))
        settings.encrypted_api_keys = encrypted
        await db.commit()

settings_service = SettingsService()
