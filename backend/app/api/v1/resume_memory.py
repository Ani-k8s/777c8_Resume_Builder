"""
777c8 Career OS — Resume Memory Engine API Routes
Handles listing, upserting, and deleting formatting guidelines/preferences.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models import ResumeMemory
from app.schemas import ResumeMemoryCreate, ResumeMemoryResponse

router = APIRouter(prefix="/resume-memory", tags=["Resume Memory"])

@router.get("/", response_model=List[ResumeMemoryResponse])
async def list_resume_memory(db: AsyncSession = Depends(get_db)):
    """List all resume memory guidelines."""
    result = await db.execute(select(ResumeMemory).order_by(ResumeMemory.key.asc()))
    return result.scalars().all()

@router.post("/", response_model=ResumeMemoryResponse)
async def upsert_resume_memory(data: ResumeMemoryCreate, db: AsyncSession = Depends(get_db)):
    """Add or update a formatting guideline preference in the memory engine."""
    stmt = select(ResumeMemory).where(ResumeMemory.key == data.key)
    result = await db.execute(stmt)
    item = result.scalar_one_or_none()

    if item:
        item.value = data.value
    else:
        item = ResumeMemory(key=data.key, value=data.value)
        db.add(item)

    await db.commit()
    await db.refresh(item)
    return item

@router.delete("/{memory_id}", status_code=204)
async def delete_resume_memory(memory_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a memory guideline by ID."""
    item = await db.get(ResumeMemory, memory_id)
    if not item:
        raise HTTPException(status_code=404, detail="Memory guideline not found")

    await db.delete(item)
    await db.commit()
    return None
