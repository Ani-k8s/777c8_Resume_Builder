"""
777c8 Career OS — Cover Letter, LinkedIn, Export & System API Routes
"""

import zipfile
import io
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.core.config import settings
from app.core.database import get_db
from app.models import MasterResume, CoverLetter, GeneratedResume
from app.schemas import (
    CoverLetterGenerateRequest, CoverLetterResponse,
    LinkedInMessageRequest, LinkedInMessageResponse,
    ExportRequest,
)
from app.services.ai_generator import ai_generator
from app.services.latex_engine import latex_engine

router = APIRouter(tags=["Tools"])


# ── Cover Letter ─────────────────────────────────────────────────────────────

@router.post("/cover-letters/generate", response_model=CoverLetterResponse, status_code=201)
async def generate_cover_letter(
    request: CoverLetterGenerateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Generate an AI-powered cover letter."""
    result = await db.execute(
        select(MasterResume).where(MasterResume.id == request.master_resume_id)
    )
    master = result.scalars().first()
    if not master:
        raise HTTPException(status_code=404, detail="Master resume not found")

    try:
        content = await ai_generator.generate_cover_letter(
            master.extracted_data,
            request.job_description_text,
            request.company,
            request.role,
            request.letter_type,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cover letter generation failed: {str(e)}")

    cl = CoverLetter(
        company=request.company,
        role=request.role,
        content=content,
        letter_type=request.letter_type,
    )
    db.add(cl)
    await db.flush()
    return cl


@router.get("/cover-letters/", response_model=list[CoverLetterResponse])
async def list_cover_letters(db: AsyncSession = Depends(get_db)):
    """List all cover letters."""
    result = await db.execute(
        select(CoverLetter).order_by(CoverLetter.created_at.desc())
    )
    return result.scalars().all()


@router.get("/cover-letters/{cl_id}", response_model=CoverLetterResponse)
async def get_cover_letter(cl_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific cover letter."""
    result = await db.execute(select(CoverLetter).where(CoverLetter.id == cl_id))
    cl = result.scalars().first()
    if not cl:
        raise HTTPException(status_code=404, detail="Cover letter not found")
    return cl


@router.delete("/cover-letters/{cl_id}", status_code=204)
async def delete_cover_letter(cl_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a cover letter."""
    result = await db.execute(select(CoverLetter).where(CoverLetter.id == cl_id))
    cl = result.scalars().first()
    if not cl:
        raise HTTPException(status_code=404, detail="Cover letter not found")
    await db.delete(cl)


# ── LinkedIn Toolkit ─────────────────────────────────────────────────────────

@router.post("/linkedin/generate", response_model=LinkedInMessageResponse)
async def generate_linkedin_message(request: LinkedInMessageRequest):
    """Generate a LinkedIn message."""
    try:
        message = await ai_generator.generate_linkedin_message(
            request.message_type,
            request.company,
            request.role,
            request.recipient_name,
            request.context,
        )
        return LinkedInMessageResponse(
            message_type=request.message_type,
            message=message,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Message generation failed: {str(e)}")


# ── PDF Generation ───────────────────────────────────────────────────────────

@router.post("/pdf/generate/{resume_id}")
async def generate_pdf(
    resume_id: int,
    template_id: str = "modern_ats",
    db: AsyncSession = Depends(get_db),
):
    """Generate PDF from a generated resume."""
    result = await db.execute(
        select(GeneratedResume).where(GeneratedResume.id == resume_id)
    )
    resume = result.scalars().first()
    if not resume:
        raise HTTPException(status_code=404, detail="Generated resume not found")

    # Build output filename
    personal = resume.content.get("personal_details", {})
    name_part = personal.get("full_name", "Resume").replace(" ", "_")
    output_filename = f"{name_part}_Resume.pdf"

    result = await latex_engine.generate_resume_pdf(
        template_id, resume.content, output_filename
    )

    if result["success"]:
        resume.pdf_path = result["pdf_path"]
        resume.tex_path = result["tex_path"]
        await db.flush()
        return result
    else:
        if "installation_guide" in result:
            raise HTTPException(status_code=503, detail=result)
        raise HTTPException(status_code=500, detail=result["error"])


@router.get("/pdf/download/{resume_id}")
async def download_pdf(resume_id: int, db: AsyncSession = Depends(get_db)):
    """Download a generated PDF."""
    result = await db.execute(
        select(GeneratedResume).where(GeneratedResume.id == resume_id)
    )
    resume = result.scalars().first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if not resume.pdf_path or not Path(resume.pdf_path).exists():
        raise HTTPException(status_code=404, detail="PDF not generated yet")

    from app.services.crypto_service import crypto_service
    try:
        pdf_data = crypto_service.secure_read_bytes(resume.pdf_path)
        return StreamingResponse(
            io.BytesIO(pdf_data),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={Path(resume.pdf_path).name}"},
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to access file: {str(e)}")


# ── System / Health ──────────────────────────────────────────────────────────

@router.get("/system/health")
async def health_check():
    """System health check."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


@router.get("/system/latex-status")
async def latex_status():
    """Check LaTeX/pdflatex installation status."""
    return latex_engine.check_pdflatex()


@router.get("/system/config")
async def get_system_config():
    """Get non-sensitive system configuration."""
    return {
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "openai_configured": bool(settings.OPENAI_API_KEY),
        "openai_model": settings.OPENAI_MODEL,
        "latex_available": latex_engine.check_pdflatex()["available"],
        "prompt_cache_enabled": settings.ENABLE_PROMPT_CACHE,
    }


@router.post("/system/config/openai")
async def update_openai_config(api_key: str, model: str = "gpt-4o-mini"):
    """Update OpenAI configuration at runtime."""
    settings.OPENAI_API_KEY = api_key
    settings.OPENAI_MODEL = model
    # Reset client to pick up new key
    ai_generator._client = None
    return {"status": "updated", "model": model}


# ── Export Center ────────────────────────────────────────────────────────────

@router.post("/export/zip")
async def export_zip(request: ExportRequest, db: AsyncSession = Depends(get_db)):
    """Generate a ZIP package with selected exports."""
    buffer = io.BytesIO()
    from app.services.crypto_service import crypto_service

    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        if request.resume_id:
            result = await db.execute(
                select(GeneratedResume).where(GeneratedResume.id == request.resume_id)
            )
            resume = result.scalars().first()
            if resume:
                try:
                    if request.include_resume_pdf and resume.pdf_path and Path(resume.pdf_path).exists():
                        pdf_data = crypto_service.secure_read_bytes(resume.pdf_path)
                        zf.writestr(Path(resume.pdf_path).name, pdf_data)
                    if request.include_resume_tex and resume.tex_path and Path(resume.tex_path).exists():
                        tex_data = crypto_service.secure_read_bytes(resume.tex_path)
                        zf.writestr(Path(resume.tex_path).name, tex_data)
                except Exception as e:
                    logger.error(f"Error packing resume files: {e}")

        if request.cover_letter_id:
            result = await db.execute(
                select(CoverLetter).where(CoverLetter.id == request.cover_letter_id)
            )
            cl = result.scalars().first()
            if cl:
                try:
                    if request.include_cover_letter_pdf and cl.pdf_path and Path(cl.pdf_path).exists():
                        cl_data = crypto_service.secure_read_bytes(cl.pdf_path)
                        zf.writestr(Path(cl.pdf_path).name, cl_data)
                except Exception as e:
                    logger.error(f"Error packing cover letter files: {e}")

    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=777c8_career_export.zip"},
    )


# ── Backup & Restore ─────────────────────────────────────────────────────────

from fastapi import UploadFile, File
from app.services.crypto_service import crypto_service
from app.core.database import engine

@router.get("/system/backup")
async def system_backup():
    """Export the database file as an encrypted backup."""
    db_url = settings.DATABASE_URL
    if not db_url.startswith("sqlite"):
        raise HTTPException(status_code=400, detail="Backup only supported for SQLite databases.")
        
    db_path = db_url.replace("sqlite+aiosqlite:///", "").replace("sqlite:///", "")
    db_file = Path(db_path)
    if not db_file.exists():
        raise HTTPException(status_code=404, detail="Database file not found.")

    if not crypto_service.is_unlocked():
        raise HTTPException(status_code=400, detail="Application is locked. Master password required to encrypt backup.")

    try:
        raw_data = db_file.read_bytes()
        encrypted_data = crypto_service.encrypt_bytes(raw_data)
        backup_content = b"777C8_BAK_ENC" + encrypted_data
        
        return StreamingResponse(
            io.BytesIO(backup_content),
            media_type="application/octet-stream",
            headers={"Content-Disposition": "attachment; filename=777c8_backup.enc"},
        )
    except Exception as e:
        logger.error(f"Backup failed: {e}")
        raise HTTPException(status_code=500, detail=f"Backup failed: {str(e)}")


@router.post("/system/restore")
async def system_restore(file: UploadFile = File(...)):
    """Import and recover the database from an encrypted backup."""
    db_url = settings.DATABASE_URL
    if not db_url.startswith("sqlite"):
        raise HTTPException(status_code=400, detail="Restore only supported for SQLite databases.")
        
    db_path = db_url.replace("sqlite+aiosqlite:///", "").replace("sqlite:///", "")
    db_file = Path(db_path)

    if not crypto_service.is_unlocked():
        raise HTTPException(status_code=400, detail="Application is locked. Master password required to decrypt backup.")

    try:
        file_content = await file.read()
        magic = b"777C8_BAK_ENC"
        if not file_content.startswith(magic):
            raise HTTPException(status_code=400, detail="Invalid backup file header. Must be an encrypted 777c8 backup.")
            
        encrypted_data = file_content[len(magic):]
        decrypted_data = crypto_service.decrypt_bytes(encrypted_data)
        
        # Dispose the active engine connections
        await engine.dispose()
        
        # Overwrite the database file
        db_file.parent.mkdir(parents=True, exist_ok=True)
        db_file.write_bytes(decrypted_data)
        
        # Re-initialize/verify DB
        from app.core.database import init_db
        await init_db()
        
        return {"status": "success", "message": "Database restored successfully."}
    except Exception as e:
        logger.error(f"Restore failed: {e}")
        raise HTTPException(status_code=500, detail=f"Restore failed: {str(e)}")
