"""
777c8 Career OS — Pydantic Schemas
Request/response validation for all API endpoints.
"""

from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field


# ── Master Resume Schemas ────────────────────────────────────────────────────

class PersonalDetails(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    website: Optional[str] = None

class ExperienceEntry(BaseModel):
    company: str
    title: str
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: bool = False
    bullets: list[str] = []

class ProjectEntry(BaseModel):
    name: str
    description: Optional[str] = None
    technologies: list[str] = []
    bullets: list[str] = []

class EducationEntry(BaseModel):
    institution: str
    degree: str
    field: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    gpa: Optional[str] = None

class CertificationEntry(BaseModel):
    name: str
    issuer: Optional[str] = None
    date: Optional[str] = None
    credential_id: Optional[str] = None

class ExtractedResumeData(BaseModel):
    personal_details: Optional[PersonalDetails] = None
    summary: Optional[str] = None
    experience: list[ExperienceEntry] = []
    skills: list[str] = []
    skill_categories: Optional[dict[str, list[str]]] = None
    projects: list[ProjectEntry] = []
    certifications: list[CertificationEntry] = []
    education: list[EducationEntry] = []
    awards: list[str] = []

class MasterResumeCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)

class MasterResumeUpdate(BaseModel):
    name: Optional[str] = None
    extracted_data: Optional[ExtractedResumeData] = None
    source_of_truth: Optional[bool] = None

class MasterResumeResponse(BaseModel):
    id: int
    name: str
    file_type: Optional[str] = None
    is_active: bool
    extracted_data: Optional[dict] = None
    version: int
    source_of_truth: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MasterResumeListResponse(BaseModel):
    resumes: list[MasterResumeResponse]
    total: int


# ── Job Description Schemas ──────────────────────────────────────────────────

class JDAnalysisRequest(BaseModel):
    raw_text: str = Field(..., min_length=50)
    company: Optional[str] = None
    role: Optional[str] = None

class JDKeyword(BaseModel):
    keyword: str
    category: str  # skill, tool, technology, certification, responsibility
    priority: str  # high, medium, low

class JDAnalysisResponse(BaseModel):
    id: int
    company: Optional[str] = None
    role: Optional[str] = None
    skills: list[str] = []
    responsibilities: list[str] = []
    requirements: list[str] = []
    preferred_qualifications: list[str] = []
    keywords: list[JDKeyword] = []
    tools: list[str] = []
    technologies: list[str] = []
    certifications: list[str] = []
    created_at: datetime

    class Config:
        from_attributes = True


# ── ATS Score Schemas ────────────────────────────────────────────────────────

class ATSScoreResponse(BaseModel):
    overall_score: float
    keyword_coverage: float
    skill_match: float
    experience_match: float
    matched_keywords: list[str] = []
    missing_keywords: list[str] = []
    priority_keywords: list[str] = []
    suggestions: list[str] = []


# ── Resume Generation Schemas ────────────────────────────────────────────────

class ResumeGenerateRequest(BaseModel):
    master_resume_id: int
    job_description_id: Optional[int] = None
    job_description_text: Optional[str] = None
    template_id: str = "modern_ats"

class ResumeContentUpdate(BaseModel):
    content: ExtractedResumeData

class GeneratedResumeResponse(BaseModel):
    id: int
    master_resume_id: int
    job_description_id: Optional[int] = None
    template_id: Optional[str] = None
    content: dict
    ats_score: Optional[float] = None
    ats_details: Optional[dict] = None
    ai_suggestions: Optional[list[dict]] = None
    pdf_path: Optional[str] = None
    tex_path: Optional[str] = None
    version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Application Schemas ──────────────────────────────────────────────────────

class ApplicationCreate(BaseModel):
    company: str = Field(..., min_length=1)
    role: str = Field(..., min_length=1)
    generated_resume_id: Optional[int] = None
    job_description_text: Optional[str] = None
    resume_used: Optional[str] = None
    ats_score: Optional[float] = None
    status: str = "Draft"
    application_url: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    applied_date: Optional[datetime] = None

class ApplicationUpdate(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    application_url: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    location: Optional[str] = None
    applied_date: Optional[datetime] = None

class ApplicationResponse(BaseModel):
    id: int
    company: str
    role: str
    generated_resume_id: Optional[int] = None
    company_id: Optional[int] = None
    resume_used: Optional[str] = None
    ats_score: Optional[float] = None
    status: str
    application_url: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    cover_letter_content: Optional[str] = None
    linkedin_messages: Optional[dict] = None
    skill_gap_analysis: Optional[dict] = None
    recruiter_id: Optional[int] = None
    applied_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Interview Schemas ────────────────────────────────────────────────────────

class InterviewCreate(BaseModel):
    application_id: int
    interview_type: Optional[str] = None
    interviewer_name: Optional[str] = None
    questions: Optional[str] = None
    feedback: Optional[str] = None
    result: str = "Pending"
    notes: Optional[str] = None
    interview_date: Optional[datetime] = None

class InterviewUpdate(BaseModel):
    interview_type: Optional[str] = None
    interviewer_name: Optional[str] = None
    questions: Optional[str] = None
    feedback: Optional[str] = None
    result: Optional[str] = None
    notes: Optional[str] = None
    interview_date: Optional[datetime] = None

class InterviewResponse(BaseModel):
    id: int
    application_id: int
    interview_type: Optional[str] = None
    interviewer_name: Optional[str] = None
    questions: Optional[str] = None
    feedback: Optional[str] = None
    result: str
    notes: Optional[str] = None
    questions_asked: Optional[str] = None
    answers_given: Optional[str] = None
    lessons_learned: Optional[str] = None
    performance_metrics: Optional[dict] = None
    interview_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Recruiter Schemas ────────────────────────────────────────────────────────

class RecruiterCreate(BaseModel):
    name: str = Field(..., min_length=1)
    company: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    notes: Optional[str] = None

class RecruiterUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    last_contact_date: Optional[datetime] = None
    follow_up_date: Optional[datetime] = None
    notes: Optional[str] = None

class RecruiterResponse(BaseModel):
    id: int
    name: str
    company: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    last_contact_date: Optional[datetime] = None
    follow_up_date: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Cover Letter Schemas ─────────────────────────────────────────────────────

class CoverLetterGenerateRequest(BaseModel):
    master_resume_id: int
    job_description_text: str
    company: str
    role: str
    letter_type: str = "ats_friendly"  # ats_friendly, company_specific, recruiter_friendly

class CoverLetterResponse(BaseModel):
    id: int
    company: str
    role: str
    content: str
    letter_type: Optional[str] = None
    pdf_path: Optional[str] = None
    tex_path: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── LinkedIn Toolkit Schemas ─────────────────────────────────────────────────

class LinkedInMessageRequest(BaseModel):
    message_type: str  # recruiter, hiring_manager, referral, follow_up, thank_you
    company: str
    role: str
    recipient_name: Optional[str] = None
    context: Optional[str] = None

class LinkedInMessageResponse(BaseModel):
    message_type: str
    message: str


# ── Analytics Schemas ────────────────────────────────────────────────────────

class AnalyticsSummary(BaseModel):
    total_applications: int = 0
    total_interviews: int = 0
    total_offers: int = 0
    total_rejections: int = 0
    interview_rate: float = 0.0
    offer_rate: float = 0.0
    success_rate: float = 0.0
    applications_by_month: list[dict] = []
    applications_by_status: list[dict] = []
    top_companies: list[dict] = []


# ── Skill Gap Schemas ────────────────────────────────────────────────────────

class SkillGapAnalysis(BaseModel):
    jd_skills: list[str] = []
    resume_skills: list[str] = []
    matched_skills: list[str] = []
    missing_skills: list[str] = []
    learning_priority: list[dict] = []


# ── Export Schemas ───────────────────────────────────────────────────────────

class ExportRequest(BaseModel):
    include_resume_pdf: bool = True
    include_resume_tex: bool = True
    include_cover_letter_pdf: bool = False
    include_cover_letter_tex: bool = False
    include_ats_report: bool = False
    include_keyword_report: bool = False
    include_application_report: bool = False
    resume_id: Optional[int] = None
    cover_letter_id: Optional[int] = None


# ── System Settings Schemas ──────────────────────────────────────────────────

class SystemSettingsResponse(BaseModel):
    encrypt_files: bool
    master_resume_locked: bool
    ollama_url: str
    active_provider: str
    active_model: str
    backup_interval_days: int
    failover_enabled: bool
    failover_provider: str
    api_keys_status: dict[str, bool] = {}
    benchmark_enabled: bool

    class Config:
        from_attributes = True

class SystemSettingsUpdate(BaseModel):
    encrypt_files: Optional[bool] = None
    ollama_url: Optional[str] = None
    active_provider: Optional[str] = None
    active_model: Optional[str] = None
    backup_interval_days: Optional[int] = None
    failover_enabled: Optional[bool] = None
    failover_provider: Optional[str] = None
    benchmark_enabled: Optional[bool] = None

class APIKeyUpdate(BaseModel):
    provider: str
    key: str

class AICostLogResponse(BaseModel):
    id: int
    provider_name: str
    model_name: str
    feature: str
    tokens_prompt: int
    tokens_completion: int
    estimated_cost_usd: float
    created_at: datetime

    class Config:
        from_attributes = True


# ── Supporting Document Schemas ──────────────────────────────────────────────

class SupportingDocumentResponse(BaseModel):
    id: int
    name: str
    doc_type: str
    content: str
    file_path: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Resume Memory Engine Schemas ─────────────────────────────────────────────

class ResumeMemoryCreate(BaseModel):
    key: str = Field(..., min_length=1, max_length=255)
    value: str = Field(..., min_length=1)

class ResumeMemoryResponse(BaseModel):
    id: int
    key: str
    value: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Company Profile Schemas ──────────────────────────────────────────────────

class CompanyProfileResponse(BaseModel):
    id: int
    name: str
    website: Optional[str] = None
    tech_stack: Optional[str] = None
    interview_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Career Timeline Schemas ──────────────────────────────────────────────────

class CareerTimelineResponse(BaseModel):
    id: int
    event_type: str
    title: str
    description: Optional[str] = None
    application_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Interview Prep Package Schemas ───────────────────────────────────────────

class InterviewPrepPackageResponse(BaseModel):
    id: int
    job_description_id: Optional[int] = None
    company: str
    role: str
    prep_guide: Optional[dict] = None
    question_bank: Optional[list] = None
    scenario_questions: Optional[list] = None
    star_answers: Optional[list] = None
    cheat_sheets: Optional[dict] = None
    flashcards: Optional[list] = None
    mock_interviews: Optional[list] = None
    created_at: datetime

    class Config:
        from_attributes = True


