"""
777c8 Career OS — Application, Interview & Recruiter API Routes
Career tracking and management endpoints.
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, extract
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.core.database import get_db
from app.models import Application, Interview, Recruiter
from app.schemas import (
    ApplicationCreate, ApplicationUpdate, ApplicationResponse,
    InterviewCreate, InterviewUpdate, InterviewResponse,
    RecruiterCreate, RecruiterUpdate, RecruiterResponse,
    AnalyticsSummary,
)

router = APIRouter(tags=["Career Tracking"])


# ── Applications ─────────────────────────────────────────────────────────────

@router.post("/applications/", response_model=ApplicationResponse, status_code=201)
async def create_application(data: ApplicationCreate, db: AsyncSession = Depends(get_db)):
    """Create a new job application."""
    app = Application(**data.model_dump())
    db.add(app)
    await db.flush()
    logger.info(f"Application created: {app.company} - {app.role} (ID: {app.id})")
    return app


@router.get("/applications/", response_model=list[ApplicationResponse])
async def list_applications(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """List all applications with optional status filter."""
    query = select(Application).order_by(Application.updated_at.desc())
    if status:
        query = query.where(Application.status == status)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/applications/kanban")
async def get_kanban_board(db: AsyncSession = Depends(get_db)):
    """Get applications organized by status for Kanban board."""
    result = await db.execute(
        select(Application).order_by(Application.updated_at.desc())
    )
    apps = result.scalars().all()

    kanban = {
        "Applied": [],
        "HR Screening": [],
        "Technical Round 1": [],
        "Technical Round 2": [],
        "Manager Round": [],
        "Offer": [],
        "Joined": [],
        "Rejected": [],
        "Draft": [],
        "Withdrawn": [],
    }

    for app in apps:
        status = app.status
        if status in kanban:
            kanban[status].append({
                "id": app.id,
                "company": app.company,
                "role": app.role,
                "ats_score": app.ats_score,
                "applied_date": app.applied_date.isoformat() if app.applied_date else None,
                "location": app.location,
            })

    return kanban


@router.get("/applications/{app_id}", response_model=ApplicationResponse)
async def get_application(app_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific application."""
    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


@router.put("/applications/{app_id}", response_model=ApplicationResponse)
async def update_application(
    app_id: int, data: ApplicationUpdate, db: AsyncSession = Depends(get_db)
):
    """Update an application."""
    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(app, key, value)

    await db.flush()
    return app


@router.delete("/applications/{app_id}", status_code=204)
async def delete_application(app_id: int, db: AsyncSession = Depends(get_db)):
    """Delete an application."""
    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    await db.delete(app)


# ── Interviews ───────────────────────────────────────────────────────────────

@router.post("/interviews/", response_model=InterviewResponse, status_code=201)
async def create_interview(data: InterviewCreate, db: AsyncSession = Depends(get_db)):
    """Create a new interview record."""
    interview = Interview(**data.model_dump())
    db.add(interview)
    await db.flush()
    return interview


@router.get("/interviews/", response_model=list[InterviewResponse])
async def list_interviews(
    application_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
):
    """List interviews with optional application filter."""
    query = select(Interview).order_by(Interview.interview_date.desc().nullslast())
    if application_id:
        query = query.where(Interview.application_id == application_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/interviews/{interview_id}", response_model=InterviewResponse)
async def get_interview(interview_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific interview."""
    result = await db.execute(select(Interview).where(Interview.id == interview_id))
    interview = result.scalars().first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview


@router.put("/interviews/{interview_id}", response_model=InterviewResponse)
async def update_interview(
    interview_id: int, data: InterviewUpdate, db: AsyncSession = Depends(get_db)
):
    """Update an interview."""
    result = await db.execute(select(Interview).where(Interview.id == interview_id))
    interview = result.scalars().first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(interview, key, value)

    await db.flush()
    return interview


@router.delete("/interviews/{interview_id}", status_code=204)
async def delete_interview(interview_id: int, db: AsyncSession = Depends(get_db)):
    """Delete an interview."""
    result = await db.execute(select(Interview).where(Interview.id == interview_id))
    interview = result.scalars().first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    await db.delete(interview)


# ── Recruiters CRM ───────────────────────────────────────────────────────────

@router.post("/recruiters/", response_model=RecruiterResponse, status_code=201)
async def create_recruiter(data: RecruiterCreate, db: AsyncSession = Depends(get_db)):
    """Create a new recruiter contact."""
    recruiter = Recruiter(**data.model_dump())
    db.add(recruiter)
    await db.flush()
    return recruiter


@router.get("/recruiters/", response_model=list[RecruiterResponse])
async def list_recruiters(db: AsyncSession = Depends(get_db)):
    """List all recruiter contacts."""
    result = await db.execute(
        select(Recruiter).order_by(Recruiter.updated_at.desc())
    )
    return result.scalars().all()


@router.get("/recruiters/{recruiter_id}", response_model=RecruiterResponse)
async def get_recruiter(recruiter_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific recruiter."""
    result = await db.execute(select(Recruiter).where(Recruiter.id == recruiter_id))
    recruiter = result.scalars().first()
    if not recruiter:
        raise HTTPException(status_code=404, detail="Recruiter not found")
    return recruiter


@router.put("/recruiters/{recruiter_id}", response_model=RecruiterResponse)
async def update_recruiter(
    recruiter_id: int, data: RecruiterUpdate, db: AsyncSession = Depends(get_db)
):
    """Update a recruiter contact."""
    result = await db.execute(select(Recruiter).where(Recruiter.id == recruiter_id))
    recruiter = result.scalars().first()
    if not recruiter:
        raise HTTPException(status_code=404, detail="Recruiter not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(recruiter, key, value)

    await db.flush()
    return recruiter


@router.delete("/recruiters/{recruiter_id}", status_code=204)
async def delete_recruiter(recruiter_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a recruiter contact."""
    result = await db.execute(select(Recruiter).where(Recruiter.id == recruiter_id))
    recruiter = result.scalars().first()
    if not recruiter:
        raise HTTPException(status_code=404, detail="Recruiter not found")
    await db.delete(recruiter)


# ── Analytics ────────────────────────────────────────────────────────────────

@router.get("/analytics/summary", response_model=AnalyticsSummary)
async def get_analytics_summary(db: AsyncSession = Depends(get_db)):
    """Get career analytics summary."""
    # Total counts
    apps_result = await db.execute(select(func.count(Application.id)))
    total_apps = apps_result.scalar() or 0

    interviews_result = await db.execute(select(func.count(Interview.id)))
    total_interviews = interviews_result.scalar() or 0

    offers_result = await db.execute(
        select(func.count(Application.id)).where(Application.status == "Offer")
    )
    total_offers = offers_result.scalar() or 0

    rejections_result = await db.execute(
        select(func.count(Application.id)).where(Application.status == "Rejected")
    )
    total_rejections = rejections_result.scalar() or 0

    # Rates
    interview_rate = (total_interviews / total_apps * 100) if total_apps > 0 else 0
    offer_rate = (total_offers / total_apps * 100) if total_apps > 0 else 0
    success_rate = (total_offers / (total_offers + total_rejections) * 100) if (total_offers + total_rejections) > 0 else 0

    # Applications by status
    status_result = await db.execute(
        select(Application.status, func.count(Application.id))
        .group_by(Application.status)
    )
    apps_by_status = [
        {"status": row[0], "count": row[1]}
        for row in status_result.all()
    ]

    # Applications by month
    month_result = await db.execute(
        select(
            func.strftime("%Y-%m", Application.created_at),
            func.count(Application.id)
        )
        .group_by(func.strftime("%Y-%m", Application.created_at))
        .order_by(func.strftime("%Y-%m", Application.created_at))
    )
    apps_by_month = [
        {"month": row[0], "count": row[1]}
        for row in month_result.all()
    ]

    # Top companies
    company_result = await db.execute(
        select(Application.company, func.count(Application.id))
        .group_by(Application.company)
        .order_by(func.count(Application.id).desc())
        .limit(10)
    )
    top_companies = [
        {"company": row[0], "count": row[1]}
        for row in company_result.all()
    ]

    return AnalyticsSummary(
        total_applications=total_apps,
        total_interviews=total_interviews,
        total_offers=total_offers,
        total_rejections=total_rejections,
        interview_rate=round(interview_rate, 1),
        offer_rate=round(offer_rate, 1),
        success_rate=round(success_rate, 1),
        applications_by_month=apps_by_month,
        applications_by_status=apps_by_status,
        top_companies=top_companies,
    )


# ── Career Timeline ──────────────────────────────────────────────────────────

@router.get("/timeline/")
async def get_timeline(db: AsyncSession = Depends(get_db)):
    """Get all career timeline events."""
    from app.models import CareerTimeline
    result = await db.execute(
        select(CareerTimeline).order_by(CareerTimeline.created_at.desc()).limit(50)
    )
    return result.scalars().all()
