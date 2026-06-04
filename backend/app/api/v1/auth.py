import base64
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.crypto_service import crypto_service
from app.services.settings_service import settings_service

router = APIRouter(prefix="/auth", tags=["Authentication"])

class PasswordRequest(BaseModel):
    password: str

class StatusResponse(BaseModel):
    is_setup: bool
    is_unlocked: bool

@router.get("/status", response_model=StatusResponse)
async def get_auth_status(db: AsyncSession = Depends(get_db)):
    """Check if the master password has been set up and if the app is currently unlocked."""
    settings = await settings_service.get_settings(db)
    is_setup = settings.password_verifier is not None
    is_unlocked = crypto_service.is_unlocked()
    return StatusResponse(is_setup=is_setup, is_unlocked=is_unlocked)

@router.post("/setup")
async def setup_master_password(req: PasswordRequest, db: AsyncSession = Depends(get_db)):
    """Set up the master password for the first time."""
    settings = await settings_service.get_settings(db)
    if settings.password_verifier is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Master password has already been set up."
        )
    
    if len(req.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long."
        )
    
    # Generate salt and derive transient key
    salt = crypto_service.generate_salt()
    crypto_service.unlock(req.password, salt)
    
    # Encrypt the verifier text
    verifier_plaintext = "777c8_career_os_verified"
    verifier_ciphertext = crypto_service.encrypt_string(verifier_plaintext)
    
    # Save salt and verifier to database
    settings.password_salt = base64.b64encode(salt).decode("utf-8")
    settings.password_verifier = verifier_ciphertext
    await db.commit()
    
    return {"message": "Master password configured successfully."}

@router.post("/unlock")
async def unlock_app(req: PasswordRequest, db: AsyncSession = Depends(get_db)):
    """Unlock the application using the master password."""
    settings = await settings_service.get_settings(db)
    if settings.password_verifier is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Master password has not been set up yet."
        )
    
    try:
        salt = base64.b64decode(settings.password_salt.encode("utf-8"))
        # Temporarily derive key to verify
        crypto_service.unlock(req.password, salt)
        
        # Verify decryption of the verifier
        decrypted = crypto_service.decrypt_string(settings.password_verifier)
        if decrypted != "777c8_career_os_verified":
            crypto_service.lock()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect master password."
            )
            
        return {"message": "Application unlocked."}
    except Exception as e:
        crypto_service.lock()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect master password."
        ) from e

@router.post("/lock")
async def lock_app():
    """Lock the application, clearing the session key from memory."""
    crypto_service.lock()
    return {"message": "Application locked."}
