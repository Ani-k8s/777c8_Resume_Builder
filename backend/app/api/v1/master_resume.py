"""
777c8 Career OS — Master Resume API Routes
Handles upload, parsing, CRUD, activation, and versioning of master resumes.
"""

import shutil
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.core.config import settings
from app.core.database import get_db
from app.models import MasterResume, MasterResumeVersion
from app.schemas import MasterResumeResponse, MasterResumeUpdate, MasterResumeListResponse, ExtractedResumeData
from app.services.resume_parser import resume_parser

router = APIRouter(prefix="/master-resumes", tags=["Master Resumes"])


@router.post("/upload", response_model=MasterResumeResponse, status_code=201)
async def upload_master_resume(
    file: UploadFile = File(...),
    name: str = Form(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload and parse a master resume file (PDF, DOCX, or TXT)."""
    # Validate file type
    file_ext = Path(file.filename).suffix.lower().strip(".")
    if file_ext not in resume_parser.SUPPORTED_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format: .{file_ext}. Supported: PDF, DOCX, TXT",
        )

    # Save uploaded file
    settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    file_path = settings.UPLOADS_DIR / f"{name.replace(' ', '_')}_{file.filename}"

    from app.services.settings_service import settings_service
    from app.services.crypto_service import crypto_service
    
    try:
        system_settings = await settings_service.get_settings(db)
        encrypt = system_settings.encrypt_files
        content = await file.read()
        crypto_service.secure_write_bytes(file_path, content, encrypt=encrypt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Parse resume
    try:
        extracted = await resume_parser.parse(str(file_path), file_ext)
        extracted_dict = extracted.model_dump()
    except Exception as e:
        logger.error(f"Resume parsing failed: {e}")
        extracted_dict = {}

    # Create database record
    resume = MasterResume(
        name=name,
        file_path=str(file_path),
        file_type=file_ext,
        is_active=False,
        extracted_data=extracted_dict,
        version=1,
        source_of_truth=True,
    )

    db.add(resume)
    await db.flush()

    # Create initial version
    version = MasterResumeVersion(
        master_resume_id=resume.id,
        extracted_data=extracted_dict,
        version=1,
        change_description="Initial upload",
    )
    db.add(version)
    await db.flush()

    # If no active resume exists, activate this one
    result = await db.execute(
        select(MasterResume).where(MasterResume.is_active == True, MasterResume.id != resume.id)
    )
    if not result.scalars().first():
        resume.is_active = True

    logger.info(f"Master resume uploaded: {name} (ID: {resume.id})")
    return resume


@router.get("/", response_model=MasterResumeListResponse)
async def list_master_resumes(db: AsyncSession = Depends(get_db)):
    """List all master resumes."""
    result = await db.execute(
        select(MasterResume).order_by(MasterResume.is_active.desc(), MasterResume.updated_at.desc())
    )
    resumes = result.scalars().all()
    return MasterResumeListResponse(resumes=resumes, total=len(resumes))


@router.get("/active", response_model=Optional[MasterResumeResponse])
async def get_active_resume(db: AsyncSession = Depends(get_db)):
    """Get the currently active master resume."""
    result = await db.execute(
        select(MasterResume).where(MasterResume.is_active == True)
    )
    resume = result.scalars().first()
    if not resume:
        raise HTTPException(status_code=404, detail="No active master resume found")
    return resume


@router.get("/{resume_id}", response_model=MasterResumeResponse)
async def get_master_resume(resume_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific master resume by ID."""
    result = await db.execute(select(MasterResume).where(MasterResume.id == resume_id))
    resume = result.scalars().first()
    if not resume:
        raise HTTPException(status_code=404, detail="Master resume not found")
    return resume


@router.put("/{resume_id}", response_model=MasterResumeResponse)
async def update_master_resume(
    resume_id: int,
    data: MasterResumeUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a master resume's extracted data or metadata."""
    result = await db.execute(select(MasterResume).where(MasterResume.id == resume_id))
    resume = result.scalars().first()
    if not resume:
        raise HTTPException(status_code=404, detail="Master resume not found")

    if data.name is not None:
        resume.name = data.name
    if data.source_of_truth is not None:
        resume.source_of_truth = data.source_of_truth
    if data.extracted_data is not None:
        resume.extracted_data = data.extracted_data.model_dump()
        resume.version += 1

        # Create version history entry
        version = MasterResumeVersion(
            master_resume_id=resume.id,
            extracted_data=resume.extracted_data,
            version=resume.version,
            change_description="Manual edit",
        )
        db.add(version)

    await db.flush()
    logger.info(f"Master resume updated: {resume.name} (v{resume.version})")
    return resume


@router.delete("/{resume_id}", status_code=204)
async def delete_master_resume(resume_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a master resume."""
    result = await db.execute(select(MasterResume).where(MasterResume.id == resume_id))
    resume = result.scalars().first()
    if not resume:
        raise HTTPException(status_code=404, detail="Master resume not found")

    # Delete file if exists
    if resume.file_path:
        file_path = Path(resume.file_path)
        if file_path.exists():
            file_path.unlink()

    await db.delete(resume)
    logger.info(f"Master resume deleted: {resume.name}")


@router.post("/{resume_id}/activate", response_model=MasterResumeResponse)
async def activate_master_resume(resume_id: int, db: AsyncSession = Depends(get_db)):
    """Set a master resume as the active one (deactivates all others)."""
    result = await db.execute(select(MasterResume).where(MasterResume.id == resume_id))
    resume = result.scalars().first()
    if not resume:
        raise HTTPException(status_code=404, detail="Master resume not found")

    # Deactivate all others
    await db.execute(
        update(MasterResume).where(MasterResume.id != resume_id).values(is_active=False)
    )

    resume.is_active = True
    await db.flush()
    logger.info(f"Master resume activated: {resume.name}")
    return resume


@router.post("/{resume_id}/duplicate", response_model=MasterResumeResponse, status_code=201)
async def duplicate_master_resume(resume_id: int, db: AsyncSession = Depends(get_db)):
    """Duplicate a master resume."""
    result = await db.execute(select(MasterResume).where(MasterResume.id == resume_id))
    source = result.scalars().first()
    if not source:
        raise HTTPException(status_code=404, detail="Master resume not found")

    # Copy file if exists
    new_file_path = None
    if source.file_path:
        src_path = Path(source.file_path)
        if src_path.exists():
            new_file_path = str(src_path.parent / f"copy_{src_path.name}")
            shutil.copy2(str(src_path), new_file_path)

    duplicate = MasterResume(
        name=f"{source.name} (Copy)",
        file_path=new_file_path,
        file_type=source.file_type,
        is_active=False,
        extracted_data=source.extracted_data,
        version=1,
        source_of_truth=source.source_of_truth,
    )

    db.add(duplicate)
    await db.flush()
    logger.info(f"Master resume duplicated: {source.name} → {duplicate.name}")
    return duplicate


@router.get("/{resume_id}/versions")
async def get_resume_versions(resume_id: int, db: AsyncSession = Depends(get_db)):
    """Get version history for a master resume."""
    result = await db.execute(
        select(MasterResumeVersion)
        .where(MasterResumeVersion.master_resume_id == resume_id)
        .order_by(MasterResumeVersion.version.desc())
    )
    versions = result.scalars().all()
    return [
        {
            "id": v.id,
            "version": v.version,
            "change_description": v.change_description,
            "created_at": v.created_at.isoformat(),
        }
        for v in versions
    ]
