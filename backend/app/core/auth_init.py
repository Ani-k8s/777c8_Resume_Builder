import base64
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.services.settings_service import settings_service
from app.services.crypto_service import crypto_service
from app.models import SystemSettings

async def auto_configure_auth(db: AsyncSession) -> None:
    """
    On application startup, read MASTER_PASSWORD from environment.
    If no master password is set up, set it up.
    If it is set up, unlock the application in-memory.
    Also sync default provider and model.
    """
    if not settings.MASTER_PASSWORD:
        logger.info("No MASTER_PASSWORD configured in environment. Skipping auto-unlock.")
        return

    try:
        system_settings = await settings_service.get_settings(db)
        
        # Check if master password is configured
        if system_settings.password_verifier is None:
            logger.info("Auto-configuring master password from environment...")
            if len(settings.MASTER_PASSWORD) < 8:
                logger.warning("MASTER_PASSWORD from environment is too short (min 8 characters).")
                return
            
            # Setup
            salt = crypto_service.generate_salt()
            crypto_service.unlock(settings.MASTER_PASSWORD, salt)
            
            verifier_plaintext = "777c8_career_os_verified"
            verifier_ciphertext = crypto_service.encrypt_string(verifier_plaintext)
            
            system_settings.password_salt = base64.b64encode(salt).decode("utf-8")
            system_settings.password_verifier = verifier_ciphertext
            system_settings.master_resume_locked = False
            
            # If DEFAULT_PROVIDER and DEFAULT_MODEL are set in env, configure them
            if settings.DEFAULT_PROVIDER:
                system_settings.active_provider = settings.DEFAULT_PROVIDER
            if settings.DEFAULT_MODEL:
                system_settings.active_model = settings.DEFAULT_MODEL

            await db.commit()
            logger.info("Master password auto-configured and vault unlocked.")
        else:
            logger.info("Attempting to auto-unlock vault with MASTER_PASSWORD from environment...")
            try:
                salt = base64.b64decode(system_settings.password_salt.encode("utf-8"))
                crypto_service.unlock(settings.MASTER_PASSWORD, salt)
                
                # Verify password
                decrypted = crypto_service.decrypt_string(system_settings.password_verifier)
                if decrypted == "777c8_career_os_verified":
                    system_settings.master_resume_locked = False
                    
                    # Update provider/model if set in environment
                    if settings.DEFAULT_PROVIDER:
                        system_settings.active_provider = settings.DEFAULT_PROVIDER
                    if settings.DEFAULT_MODEL:
                        system_settings.active_model = settings.DEFAULT_MODEL
                        
                    await db.commit()
                    logger.info("Vault auto-unlocked successfully.")
                else:
                    crypto_service.lock()
                    logger.error("Auto-unlock failed: incorrect MASTER_PASSWORD verifier mismatch.")
            except Exception as e:
                crypto_service.lock()
                logger.error(f"Auto-unlock failed: {e}")
    except Exception as e:
        logger.error(f"Failed to auto-configure/unlock vault on startup: {e}")
