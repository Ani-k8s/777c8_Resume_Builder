"""
777c8 Career OS — API Router
Aggregates all v1 API routes.
"""

from fastapi import APIRouter
from app.api.v1 import (
    master_resume, resume_engine, career_tracking, tools, auth, 
    settings, supporting_documents, resume_memory, interview_intelligence
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(master_resume.router)
api_router.include_router(resume_engine.router)
api_router.include_router(career_tracking.router)
api_router.include_router(tools.router)
api_router.include_router(settings.router)
api_router.include_router(supporting_documents.router)
api_router.include_router(resume_memory.router)
api_router.include_router(interview_intelligence.router)
