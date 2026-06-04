"""
777c8 Career OS — Database Models
All SQLAlchemy ORM models for the Career OS platform.
"""

import datetime
from typing import Optional
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, JSON, ForeignKey, Enum
)
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


# ── Enums ────────────────────────────────────────────────────────────────────

class ApplicationStatus(str, enum.Enum):
    DRAFT = "Draft"
    APPLIED = "Applied"
    HR_SCREENING = "HR Screening"
    TECHNICAL_ROUND_1 = "Technical Round 1"
    TECHNICAL_ROUND_2 = "Technical Round 2"
    MANAGER_ROUND = "Manager Round"
    OFFER = "Offer"
    JOINED = "Joined"
    REJECTED = "Rejected"
    WITHDRAWN = "Withdrawn"


class InterviewResult(str, enum.Enum):
    PENDING = "Pending"
    PASSED = "Passed"
    FAILED = "Failed"
    CANCELLED = "Cancelled"


# ── Master Resume ────────────────────────────────────────────────────────────

class MasterResume(Base):
    __tablename__ = "master_resumes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=True)
    file_type = Column(String(10), nullable=True)  # pdf, docx, txt
    is_active = Column(Boolean, default=False, nullable=False)
    extracted_data = Column(JSON, nullable=True)
    version = Column(Integer, default=1, nullable=False)
    metadata_ = Column("metadata", JSON, nullable=True)
    source_of_truth = Column(Boolean, default=True, nullable=False)
    is_locked = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    # Relationships
    versions = relationship("MasterResumeVersion", back_populates="master_resume", cascade="all, delete-orphan")
    generated_resumes = relationship("GeneratedResume", back_populates="master_resume")


class MasterResumeVersion(Base):
    __tablename__ = "master_resume_versions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    master_resume_id = Column(Integer, ForeignKey("master_resumes.id", ondelete="CASCADE"), nullable=False)
    extracted_data = Column(JSON, nullable=False)
    version = Column(Integer, nullable=False)
    change_description = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Relationships
    master_resume = relationship("MasterResume", back_populates="versions")


# ── Job Description ──────────────────────────────────────────────────────────

class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company = Column(String(255), nullable=True)
    role = Column(String(255), nullable=True)
    raw_text = Column(Text, nullable=False)
    analysis = Column(JSON, nullable=True)
    keywords = Column(JSON, nullable=True)
    skills = Column(JSON, nullable=True)
    requirements = Column(JSON, nullable=True)
    ats_score = Column(Float, nullable=True)
    content_hash = Column(String(64), nullable=True)  # For cache deduplication
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Relationships
    generated_resumes = relationship("GeneratedResume", back_populates="job_description")


# ── Generated Resume ─────────────────────────────────────────────────────────

class GeneratedResume(Base):
    __tablename__ = "generated_resumes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    master_resume_id = Column(Integer, ForeignKey("master_resumes.id"), nullable=False)
    job_description_id = Column(Integer, ForeignKey("job_descriptions.id"), nullable=True)
    template_id = Column(String(100), nullable=True)
    content = Column(JSON, nullable=False)
    pdf_path = Column(String(500), nullable=True)
    tex_path = Column(String(500), nullable=True)
    ats_score = Column(Float, nullable=True)
    ats_details = Column(JSON, nullable=True)
    ai_suggestions = Column(JSON, nullable=True)
    version = Column(Integer, default=1, nullable=False)
    recruiter_readability_score = Column(Float, default=0.0, nullable=False)
    grammar_score = Column(Float, default=0.0, nullable=False)
    readability_metrics = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    # Relationships
    master_resume = relationship("MasterResume", back_populates="generated_resumes")
    job_description = relationship("JobDescription", back_populates="generated_resumes")
    application = relationship("Application", back_populates="generated_resume", uselist=False)


# ── Company Profile ──────────────────────────────────────────────────────────

class CompanyProfile(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), unique=True, nullable=False)
    website = Column(String(255), nullable=True)
    tech_stack = Column(Text, nullable=True)
    interview_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Relationships
    applications = relationship("Application", back_populates="company_profile")


# ── Application ──────────────────────────────────────────────────────────────

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    generated_resume_id = Column(Integer, ForeignKey("generated_resumes.id"), nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    company = Column(String(255), nullable=False)
    role = Column(String(255), nullable=False)
    job_description_text = Column(Text, nullable=True)
    resume_used = Column(String(500), nullable=True)
    ats_score = Column(Float, nullable=True)
    status = Column(String(50), default=ApplicationStatus.DRAFT.value, nullable=False)
    application_url = Column(String(500), nullable=True)
    salary_min = Column(Float, nullable=True)
    salary_max = Column(Float, nullable=True)
    location = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    cover_letter_content = Column(Text, nullable=True)
    linkedin_messages = Column(JSON, nullable=True)
    skill_gap_analysis = Column(JSON, nullable=True)
    recruiter_id = Column(Integer, ForeignKey("recruiters.id"), nullable=True)
    applied_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    # Relationships
    generated_resume = relationship("GeneratedResume", back_populates="application")
    company_profile = relationship("CompanyProfile", back_populates="applications")
    recruiter = relationship("Recruiter")
    interviews = relationship("Interview", back_populates="application", cascade="all, delete-orphan")


# ── Interview ────────────────────────────────────────────────────────────────

class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, autoincrement=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    interview_type = Column(String(100), nullable=True)  # Phone, Technical, Behavioral, Manager
    interviewer_name = Column(String(255), nullable=True)
    questions = Column(Text, nullable=True)
    feedback = Column(Text, nullable=True)
    result = Column(String(50), default=InterviewResult.PENDING.value, nullable=False)
    notes = Column(Text, nullable=True)
    questions_asked = Column(Text, nullable=True)
    answers_given = Column(Text, nullable=True)
    lessons_learned = Column(Text, nullable=True)
    performance_metrics = Column(JSON, nullable=True)
    interview_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    # Relationships
    application = relationship("Application", back_populates="interviews")


# ── Recruiter CRM ────────────────────────────────────────────────────────────

class Recruiter(Base):
    __tablename__ = "recruiters"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    company = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    linkedin_url = Column(String(500), nullable=True)
    last_contact_date = Column(DateTime, nullable=True)
    follow_up_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)


# ── Cover Letter ─────────────────────────────────────────────────────────────

class CoverLetter(Base):
    __tablename__ = "cover_letters"

    id = Column(Integer, primary_key=True, autoincrement=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=True)
    company = Column(String(255), nullable=False)
    role = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    pdf_path = Column(String(500), nullable=True)
    tex_path = Column(String(500), nullable=True)
    letter_type = Column(String(50), nullable=True)  # ats_friendly, company_specific, recruiter_friendly
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)


# ── Prompt Cache ─────────────────────────────────────────────────────────────

class PromptCache(Base):
    __tablename__ = "prompt_cache"

    id = Column(Integer, primary_key=True, autoincrement=True)
    cache_key = Column(String(128), unique=True, nullable=False, index=True)
    prompt_type = Column(String(50), nullable=False)  # resume, jd_analysis, cover_letter, etc.
    input_hash = Column(String(64), nullable=False)
    response = Column(JSON, nullable=False)
    tokens_used = Column(Integer, nullable=True)
    cost_usd = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=True)


# ── Goals ────────────────────────────────────────────────────────────────────

class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, autoincrement=True)
    target_applications = Column(Integer, default=10, nullable=False)
    target_interviews = Column(Integer, default=2, nullable=False)
    target_offers = Column(Integer, default=1, nullable=False)
    period = Column(String(50), default="weekly", nullable=False)  # weekly, monthly
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)


# ── AI Benchmark History ─────────────────────────────────────────────────────

class BenchmarkHistory(Base):
    __tablename__ = "benchmark_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    resume_id = Column(Integer, ForeignKey("master_resumes.id", ondelete="CASCADE"), nullable=True)
    provider_name = Column(String(100), nullable=False)
    model_name = Column(String(100), nullable=False)
    ats_score = Column(Float, nullable=True)
    recruiter_score = Column(Float, nullable=True)
    keyword_coverage = Column(Float, nullable=True)
    generation_time_ms = Column(Integer, nullable=True)
    estimated_cost_usd = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)


# ── Template Performance Analytics ───────────────────────────────────────────

class TemplatePerformance(Base):
    __tablename__ = "template_performance"

    id = Column(Integer, primary_key=True, autoincrement=True)
    template_id = Column(String(100), unique=True, nullable=False)
    applications_count = Column(Integer, default=0, nullable=False)
    interviews_count = Column(Integer, default=0, nullable=False)
    offers_count = Column(Integer, default=0, nullable=False)
    conversion_rate = Column(Float, default=0.0, nullable=False)


# ── Scheduler Reminders / Notifications ──────────────────────────────────────

class ScheduledReminder(Base):
    __tablename__ = "scheduled_reminders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    reminder_type = Column(String(50), nullable=False)  # follow_up, interview, goal, health
    trigger_date = Column(DateTime, nullable=False)
    is_sent = Column(Boolean, default=False, nullable=False)
    action_id = Column(Integer, nullable=True)  # links to application_id or interview_id
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)


# ── AI Cost Logging ──────────────────────────────────────────────────────────

class AICostLog(Base):
    __tablename__ = "ai_cost_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    provider_name = Column(String(100), nullable=False)
    model_name = Column(String(100), nullable=False)
    feature = Column(String(100), nullable=False)  # resume_gen, jd_analysis, cover_letter, linkedin
    tokens_prompt = Column(Integer, default=0, nullable=False)
    tokens_completion = Column(Integer, default=0, nullable=False)
    estimated_cost_usd = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)


# ── System Settings ──────────────────────────────────────────────────────────

class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    encrypt_files = Column(Boolean, default=False, nullable=False)
    master_resume_locked = Column(Boolean, default=True, nullable=False)
    ollama_url = Column(String(500), default="http://localhost:11434", nullable=False)
    active_provider = Column(String(100), default="openai", nullable=False)
    active_model = Column(String(255), default="gpt-4o-mini", nullable=False)
    backup_interval_days = Column(Integer, default=7, nullable=False)
    failover_enabled = Column(Boolean, default=True, nullable=False)
    failover_provider = Column(String(100), default="openrouter", nullable=False)
    encrypted_api_keys = Column(Text, nullable=True)  # Encrypted JSON string of keys
    password_salt = Column(String(255), nullable=True)  # Base64 salt
    password_verifier = Column(String(255), nullable=True)  # Encrypted verification payload
    benchmark_enabled = Column(Boolean, default=False, nullable=False)


# ── Supporting Document ──────────────────────────────────────────────────────

class SupportingDocument(Base):
    __tablename__ = "supporting_documents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    doc_type = Column(String(50), default="other", nullable=False)  # transcript, certificate, letter, other
    content = Column(Text, nullable=False)
    file_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)


# ── Resume Memory Engine ─────────────────────────────────────────────────────

class ResumeMemory(Base):
    __tablename__ = "resume_memory"

    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String(255), unique=True, nullable=False)
    value = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)


# ── Career Timeline ──────────────────────────────────────────────────────────

class CareerTimeline(Base):
    __tablename__ = "career_timeline"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_type = Column(String(100), nullable=False)  # resume_generated, application_created, interview_scheduled, etc.
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)


# ── Interview Prep Package ───────────────────────────────────────────────────

class InterviewPrepPackage(Base):
    __tablename__ = "interview_prep_packages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_description_id = Column(Integer, ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=True)
    company = Column(String(255), nullable=False)
    role = Column(String(255), nullable=False)
    prep_guide = Column(JSON, nullable=True)  # Company Prep Guide
    question_bank = Column(JSON, nullable=True)  # Question banks, Technical, Behavioral, Role-specific, FAQs
    scenario_questions = Column(JSON, nullable=True)  # Scenario troubleshooting playbooks
    star_answers = Column(JSON, nullable=True)  # STAR structure responses
    cheat_sheets = Column(JSON, nullable=True)  # 5-min, 10-min sheet keys
    flashcards = Column(JSON, nullable=True)  # Flashcard key lists
    mock_interviews = Column(JSON, nullable=True)  # Sample Mock sessions
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)


