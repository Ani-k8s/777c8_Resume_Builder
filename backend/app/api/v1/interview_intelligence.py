"""
777c8 Career OS — Interview Intelligence Suite API Routes
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional, List, Dict
from loguru import logger
import json

from app.core.database import get_db
from app.models import InterviewPrepPackage, Interview, Application, JobDescription
from app.schemas import InterviewResponse
from app.services.ai_generator import ai_generator

router = APIRouter(tags=["Interview Intelligence"])


# ── Pydantic Request/Response Models ─────────────────────────────────────────

class CoachMessageRequest(BaseModel):
    message: str
    prep_package_id: Optional[int] = None
    interview_id: Optional[int] = None
    chat_history: Optional[List[Dict[str, str]]] = []

class CoachResponse(BaseModel):
    reply: str
    score: Optional[int] = None
    feedback: Optional[str] = None
    actionable_tips: Optional[List[str]] = []

class InterviewTrackUpdate(BaseModel):
    questions_asked: str
    answers_given: str
    lessons_learned: str


# ── Prep Packages ────────────────────────────────────────────────────────────

@router.get("/interviews/prep-packages/application/{app_id}")
async def get_prep_package_by_application(app_id: int, db: AsyncSession = Depends(get_db)):
    """Retrieve the prep package for a given application."""
    # Find application
    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Find prep package
    result = await db.execute(
        select(InterviewPrepPackage).where(InterviewPrepPackage.job_description_id == app.generated_resume.job_description_id)
    )
    pkg = result.scalars().first()
    if not pkg:
        # Generate on-the-fly if missing
        try:
            jd_result = await db.execute(select(JobDescription).where(JobDescription.id == app.generated_resume.job_description_id))
            jd = jd_result.scalars().first()
            if jd:
                master_resume = app.generated_resume.master_resume
                prep_data = await ai_generator.generate_interview_prep_package(
                    master_resume.extracted_data,
                    jd.raw_text,
                    jd.analysis,
                )
                pkg = InterviewPrepPackage(
                    job_description_id=jd.id,
                    company=app.company,
                    role=app.role,
                    prep_guide=prep_data.get("prep_guide"),
                    question_bank=prep_data.get("question_bank"),
                    scenario_questions=prep_data.get("scenario_questions"),
                    star_answers=prep_data.get("star_answers"),
                    cheat_sheets=prep_data.get("cheat_sheets"),
                    flashcards=prep_data.get("flashcards"),
                    mock_interviews=prep_data.get("mock_interviews"),
                )
                db.add(pkg)
                await db.commit()
            else:
                raise HTTPException(status_code=404, detail="Job description not found")
        except Exception as e:
            logger.error(f"Failed to generate prep package on-the-fly: {e}")
            raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

    return pkg


@router.get("/interviews/prep-packages/{pkg_id}")
async def get_prep_package(pkg_id: int, db: AsyncSession = Depends(get_db)):
    """Retrieve prep package by ID."""
    result = await db.execute(select(InterviewPrepPackage).where(InterviewPrepPackage.id == pkg_id))
    pkg = result.scalars().first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Prep package not found")
    return pkg


@router.get("/interviews/prep-packages/")
async def list_prep_packages(db: AsyncSession = Depends(get_db)):
    """List all available preparation packages."""
    result = await db.execute(select(InterviewPrepPackage).order_by(InterviewPrepPackage.created_at.desc()))
    return result.scalars().all()


# ── Performance Tracker ──────────────────────────────────────────────────────

@router.put("/interviews/track/{interview_id}", response_model=InterviewResponse)
async def update_interview_performance(
    interview_id: int,
    data: InterviewTrackUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Log actual interview performance, questions asked, answers given, and trigger AI study plan."""
    result = await db.execute(select(Interview).where(Interview.id == interview_id))
    interview = result.scalars().first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview record not found")

    interview.questions_asked = data.questions_asked
    interview.answers_given = data.answers_given
    interview.lessons_learned = data.lessons_learned

    # Trigger AI analysis for study plan
    try:
        system_prompt = """
You are an expert technical interviewer and career coach.
Analyze the candidate's actual interview performance (questions asked and answers given) and identify:
1. Knowledge gaps and weaknesses
2. Concrete areas for improvement
3. Recommended study plan (with resources, estimated hours, and topics).

Return a JSON object:
{
    "knowledge_gaps": ["list of concepts or skills candidate struggled with"],
    "improvement_areas": ["specific feedback points on communication, coding, SRE troubleshooting etc."],
    "study_plan": ["step-by-step topics to master before next round"]
}
"""
        user_prompt = f"""
Company: {interview.application.company}
Role: {interview.application.role}
Questions Asked: {data.questions_asked}
Answers Given: {data.answers_given}
Lessons Learned / Candidate notes: {data.lessons_learned}
"""
        res = await ai_generator._call_openai(system_prompt, user_prompt, response_format="json")
        metrics = json.loads(res)
        interview.performance_metrics = metrics
    except Exception as e:
        logger.warning(f"AI performance analysis failed: {e}")
        interview.performance_metrics = {
            "knowledge_gaps": ["N/A"],
            "improvement_areas": ["Improve core explanations"],
            "study_plan": ["Review key questions"]
        }

    await db.flush()
    return interview


# ── AI Interview Coach ───────────────────────────────────────────────────────

@router.post("/interviews/coach", response_model=CoachResponse)
async def ai_coach_session(
    request: CoachMessageRequest,
    db: AsyncSession = Depends(get_db),
):
    """AI Coach interactive endpoint to clear concepts, review/score answers, or play mock interviews."""
    context = ""
    
    # Fetch prep package data if linked
    if request.prep_package_id:
        result = await db.execute(select(InterviewPrepPackage).where(InterviewPrepPackage.id == request.prep_package_id))
        pkg = result.scalars().first()
        if pkg:
            context += f"\nRole: {pkg.role}\nCompany: {pkg.company}\nPrep Guide: {json.dumps(pkg.prep_guide)}\n"

    system_prompt = f"""
You are the "777c8 AI Interview Coach" — a supportive yet strict elite technical and behavioral coach.
Your job is to prepare the candidate for high-paying roles (Software Engineering, DevOps, SRE, Architect).

Guidelines:
1. Explain concepts deeply using clear examples, architecture notes, and CLI/shell command snippets when helpful.
2. If the user provides an answer to a question, score it (1-100) based on expectations. Provide clear, direct feedback and bulleted suggestions to improve.
3. If they want to practice, roleplay as the interviewer. Ask one question at a time and wait for their response.
4. Keep the tone motivational, authoritative, and focused on landing the offer.

Context for the current interview:
{context}

Format your response as a JSON object:
{{
    "reply": "Main message to the candidate",
    "score": null, // 0-100 integer if evaluating an answer, otherwise null
    "feedback": "constructive feedback text if evaluating, otherwise null",
    "actionable_tips": ["tip 1", "tip 2"] // empty array if not applicable
}}
"""

    history_str = ""
    for msg in request.chat_history:
        history_str += f"{msg.get('role', 'user').capitalize()}: {msg.get('content', '')}\n"
    
    user_prompt = f"{history_str}User: {request.message}\nCoach:"
    
    try:
        res = await ai_generator._call_openai(system_prompt, user_prompt, response_format="json")
        data = json.loads(res)
        return CoachResponse(**data)
    except Exception as e:
        logger.error(f"AI Coach communication failed: {e}")
        return CoachResponse(
            reply="I encountered an issue communicating with the AI. Let me try that again. How can I help you prepare?",
            actionable_tips=["Ensure your API key is correctly configured in Settings."]
        )
