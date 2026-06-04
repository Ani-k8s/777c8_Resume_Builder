"""
777c8 Career OS — AI Generator Service
OpenAI-powered resume generation, JD analysis, cover letters, and LinkedIn messages.
Enforces Master Resume as Source of Truth — NEVER fabricates information.
"""

import json
import hashlib
from pathlib import Path
from typing import Optional
from loguru import logger

from app.core.config import settings


class AIGeneratorService:
    """Central AI service for all OpenAI-powered features."""

    def __init__(self):
        self._client = None

    @property
    def client(self):
        if self._client is None:
            try:
                from openai import OpenAI
                if not settings.OPENAI_API_KEY:
                    raise ValueError("OpenAI API key not configured")
                self._client = OpenAI(api_key=settings.OPENAI_API_KEY)
            except ImportError:
                raise RuntimeError("OpenAI package not installed. Install with: pip install openai")
        return self._client

    def _load_prompt(self, prompt_name: str) -> str:
        """Load a prompt template from the prompts directory."""
        prompt_path = settings.PROMPTS_DIR / f"{prompt_name}.md"
        if prompt_path.exists():
            return prompt_path.read_text(encoding="utf-8")
        logger.warning(f"Prompt file not found: {prompt_path}, using default")
        return ""

    def _compute_cache_key(self, prompt_type: str, *args: str) -> str:
        """Compute a cache key for deduplication."""
        content = f"{prompt_type}:{'|'.join(args)}"
        return hashlib.sha256(content.encode()).hexdigest()

    async def _call_openai(self, system_prompt: str, user_prompt: str, response_format: Optional[str] = None) -> str:
        """Call the unified multi-provider LLM Engine."""
        from app.services.llm_engine import llm_engine
        import inspect
        caller = inspect.stack()[1].function
        return await llm_engine.generate(system_prompt, user_prompt, caller, response_format)

    # ── Job Description Analysis ─────────────────────────────────────────

    async def analyze_job_description(self, jd_text: str) -> dict:
        """Analyze a job description and extract structured data."""
        system_prompt = self._load_prompt("jd_analysis") or """
You are an expert job description analyzer for the tech industry.
Analyze the given job description and extract structured information.

Return a JSON object with these exact keys:
{
    "company": "company name if mentioned",
    "role": "job title",
    "skills": ["list of required technical skills"],
    "responsibilities": ["list of key responsibilities"],
    "requirements": ["list of requirements"],
    "preferred_qualifications": ["list of preferred/nice-to-have qualifications"],
    "keywords": [{"keyword": "term", "category": "skill|tool|technology|certification|responsibility", "priority": "high|medium|low"}],
    "tools": ["list of tools mentioned"],
    "technologies": ["list of technologies mentioned"],
    "certifications": ["list of certifications mentioned"],
    "location": "location description (e.g. Remote, Hybrid, Onsite, or City/State if mentioned)",
    "department": "department if mentioned (e.g. Engineering, DevOps, Product)",
    "seniority": "seniority level (e.g. Junior, Mid, Senior, Lead, Staff, Principal)",
    "employment_type": "employment type (e.g. Full-time, Contract, Part-time, Internship)",
    "salary_range": "salary range text if mentioned, otherwise null",
    "application_url": "application URL if present in text, otherwise null",
    "recruiter_name": "recruiter name if mentioned, otherwise null",
    "recruiter_email": "recruiter email if mentioned, otherwise null",
    "recruiter_phone": "recruiter phone if mentioned, otherwise null",
    "recruiter_linkedin": "recruiter LinkedIn URL if mentioned, otherwise null"
}

Be thorough. Extract every technical term, tool, technology, and certification mentioned.
"""

        user_prompt = f"Analyze this job description:\n\n{jd_text}"
        result = await self._call_openai(system_prompt, user_prompt, response_format="json")
        return json.loads(result)

    # ── ATS Scoring ──────────────────────────────────────────────────────

    async def calculate_ats_score(self, resume_data: dict, jd_analysis: dict) -> dict:
        """Calculate ATS compatibility score between resume and job description."""
        system_prompt = self._load_prompt("ats") or """
You are an ATS (Applicant Tracking System) scoring expert.
Compare the resume data against the job description analysis and calculate match scores.

IMPORTANT: Be precise and thorough in matching. Consider synonyms and related terms.

Return a JSON object:
{
    "overall_score": 0-100,
    "keyword_coverage": 0-100,
    "skill_match": 0-100,
    "experience_match": 0-100,
    "matched_keywords": ["list of keywords found in resume"],
    "missing_keywords": ["list of keywords NOT found in resume"],
    "priority_keywords": ["high-priority keywords that should be added"],
    "suggestions": ["list of actionable improvement suggestions"]
}
"""

        user_prompt = f"""
Resume Data:
{json.dumps(resume_data, indent=2)}

Job Description Analysis:
{json.dumps(jd_analysis, indent=2)}
"""
        result = await self._call_openai(system_prompt, user_prompt, response_format="json")
        return json.loads(result)

    # ── Resume Generation ────────────────────────────────────────────────

    async def generate_tailored_resume(self, master_resume: dict, jd_text: str, jd_analysis: dict, db = None) -> dict:
        """
        Generate an ATS-optimized resume based on master resume and job description.
        CRITICAL: Master Resume is the SOURCE OF TRUTH. Never fabricate information.
        """
        system_prompt_base = self._load_prompt("resume_generation") or """
You are an expert resume writer specializing in ATS-optimized, recruiter-friendly resumes for tech professionals.

CRITICAL RULES - FOLLOW EXACTLY:
1. The Master Resume is the ABSOLUTE SOURCE OF TRUTH
2. NEVER invent, fabricate, or add:
   - Companies the person never worked at
   - Job titles they never held
   - Skills they don't have
   - Projects they never did
   - Certifications they don't hold
   - Technologies they haven't used
   - Achievements or metrics that aren't real
   - Dates that don't match
3. You MAY:
   - Improve wording and grammar
   - Reorder sections to prioritize relevant experience
   - Enhance bullet points with better action verbs
   - Improve formatting for ATS compatibility
   - Highlight skills that match the job description
   - Optimize keyword placement
   - Consolidate or restructure bullets for clarity
   - Improve professional summary to target the role

Return a JSON object with the same structure as the input master resume data, but optimized for the target role.
The resume MUST fit within 2 pages when rendered.

Return JSON with these keys:
{
    "personal_details": {...},
    "summary": "improved professional summary targeting the role",
    "experience": [{...}],
    "skills": ["prioritized and relevant skills"],
    "skill_categories": {"category": ["skills"]},
    "projects": [{...}],
    "certifications": [{...}],
    "education": [{...}],
    "awards": [...]
}
"""
        system_prompt = system_prompt_base

        if db is not None:
            try:
                from sqlalchemy import select
                from app.models import ResumeMemory
                result = await db.execute(select(ResumeMemory))
                memories = result.scalars().all()
                if memories:
                    style_rules = []
                    for mem in memories:
                        style_rules.append(f"- {mem.key}: {mem.value}")
                    
                    system_prompt += "\n\nADDITIONAL USER FORMATTING & STYLE PREFERENCES TO ENFORCE:\n" + "\n".join(style_rules)
            except Exception as e:
                logger.warning(f"Could not retrieve resume memory formatting guidelines: {e}")

        user_prompt = f"""
Master Resume (SOURCE OF TRUTH - do NOT fabricate anything beyond this):
{json.dumps(master_resume, indent=2)}

Target Job Description:
{jd_text}

Job Description Analysis:
{json.dumps(jd_analysis, indent=2)}

Generate an ATS-optimized resume. Remember: ONLY use information from the Master Resume.
"""
        result = await self._call_openai(system_prompt, user_prompt, response_format="json")
        return json.loads(result)

    # ── Achievement Rewriter ─────────────────────────────────────────────

    async def rewrite_achievements(self, bullets: list[str], context: str = "") -> list[str]:
        """Rewrite weak bullet points into strong, measurable achievements."""
        system_prompt = self._load_prompt("achievement_rewriter") or """
You are an expert resume bullet point writer.
Convert weak, passive bullet points into strong, measurable achievement statements.

RULES:
1. Start with a strong action verb
2. Include metrics and impact where the original implies them
3. NEVER fabricate specific numbers or metrics that aren't implied
4. Keep factual accuracy - don't change what the person actually did
5. Make bullets ATS-friendly with relevant keywords

Return a JSON array of improved bullet strings, same length as input.
"""
        user_prompt = f"""
Context: {context}

Original bullets to improve:
{json.dumps(bullets)}
"""
        result = await self._call_openai(system_prompt, user_prompt, response_format="json")
        parsed = json.loads(result)
        if isinstance(parsed, dict) and "bullets" in parsed:
            return parsed["bullets"]
        if isinstance(parsed, list):
            return parsed
        return bullets

    # ── AI Suggestions ───────────────────────────────────────────────────

    async def generate_suggestions(self, resume_data: dict, ats_details: dict) -> list[dict]:
        """Generate improvement suggestions for a resume."""
        system_prompt = """
You are a resume optimization advisor.
Based on the resume content and ATS analysis, provide specific, actionable suggestions.

Return a JSON array of suggestions:
[
    {
        "id": "unique_id",
        "type": "keyword|content|formatting|structure",
        "section": "which resume section this applies to",
        "current": "current text (if applicable)",
        "suggested": "suggested improvement",
        "reason": "why this change improves the resume",
        "impact": "high|medium|low"
    }
]

Limit to the top 10 most impactful suggestions.
"""
        user_prompt = f"""
Resume Data:
{json.dumps(resume_data, indent=2)}

ATS Analysis:
{json.dumps(ats_details, indent=2)}
"""
        result = await self._call_openai(system_prompt, user_prompt, response_format="json")
        parsed = json.loads(result)
        if isinstance(parsed, dict) and "suggestions" in parsed:
            return parsed["suggestions"]
        return parsed if isinstance(parsed, list) else []

    # ── Cover Letter Generation ──────────────────────────────────────────

    async def generate_cover_letter(self, master_resume: dict, jd_text: str, company: str, role: str, letter_type: str = "ats_friendly") -> str:
        """Generate a cover letter based on master resume and job description."""
        style_instructions = {
            "ats_friendly": "Write an ATS-friendly cover letter with clear keywords and standard formatting.",
            "company_specific": "Write a company-specific cover letter that shows deep understanding of the company.",
            "recruiter_friendly": "Write a recruiter-friendly cover letter that highlights key selling points upfront.",
        }

        system_prompt = self._load_prompt("cover_letter") or f"""
You are an expert cover letter writer for tech professionals.
{style_instructions.get(letter_type, style_instructions["ats_friendly"])}

RULES:
1. Use ONLY information from the master resume - never fabricate
2. Keep it professional and concise (under 400 words)
3. Address specific requirements from the job description
4. Highlight relevant experience and skills
5. Use a professional tone appropriate for senior tech roles

Return the cover letter as plain text (not JSON).
"""
        user_prompt = f"""
Master Resume:
{json.dumps(master_resume, indent=2)}

Company: {company}
Role: {role}

Job Description:
{jd_text}
"""
        return await self._call_openai(system_prompt, user_prompt)

    # ── LinkedIn Toolkit ─────────────────────────────────────────────────

    async def generate_linkedin_message(self, message_type: str, company: str, role: str, recipient_name: Optional[str] = None, context: Optional[str] = None) -> str:
        """Generate LinkedIn messages for networking."""
        system_prompt = self._load_prompt("linkedin") or """
You are an expert at writing professional LinkedIn messages for job seekers.
Write concise, professional messages that are warm but not pushy.
Keep messages under 150 words.
Return just the message text.
"""
        type_instructions = {
            "recruiter": f"Write a message to a recruiter at {company} about the {role} position.",
            "hiring_manager": f"Write a message to the hiring manager at {company} for the {role} role.",
            "referral": f"Write a referral request message for the {role} position at {company}.",
            "follow_up": f"Write a follow-up message after applying for {role} at {company}.",
            "thank_you": f"Write a thank you message after interviewing for {role} at {company}.",
        }

        user_prompt = type_instructions.get(message_type, type_instructions["recruiter"])
        if recipient_name:
            user_prompt += f"\nRecipient: {recipient_name}"
        if context:
            user_prompt += f"\nAdditional context: {context}"

        return await self._call_openai(system_prompt, user_prompt)

    # ── Skill Gap Analysis ───────────────────────────────────────────────

    async def analyze_skill_gap(self, resume_skills: list[str], jd_skills: list[str]) -> dict:
        """Analyze skill gaps between resume and job description."""
        system_prompt = """
You are a career advisor specializing in tech roles.
Compare the candidate's skills with the job requirements and provide a skill gap analysis.

Return a JSON object:
{
    "matched_skills": ["skills present in both resume and JD"],
    "missing_skills": ["skills in JD but not in resume"],
    "learning_priority": [
        {"skill": "skill name", "priority": "high|medium|low", "reason": "why this skill matters", "estimated_learning_time": "e.g., 2-4 weeks"}
    ]
}
"""
        user_prompt = f"""
Resume Skills: {json.dumps(resume_skills)}
Job Description Skills: {json.dumps(jd_skills)}
"""
        result = await self._call_openai(system_prompt, user_prompt, response_format="json")
        return json.loads(result)


    async def generate_interview_prep_package(self, master_resume: dict, jd_text: str, jd_analysis: dict) -> dict:
        """Generate a complete interview preparation package based on JD and Resume."""
        system_prompt = """
You are an elite interview prep coach specializing in tech, devops, site reliability engineering, and software engineering roles.
Analyze the target job description, company name, role, and candidate resume, and generate a comprehensive interview preparation package.

Return a JSON object with these exact keys:
{
    "prep_guide": {
        "company": "company name",
        "role": "role title",
        "expected_questions": ["list of 3 key topics expected to be tested"],
        "common_technologies": ["list of common technologies from the JD"],
        "interview_focus_areas": ["list of focus areas for the interview"],
        "interview_difficulty": "Medium|Hard|Expert",
        "preparation_notes": "A tactical summary paragraph on how to prepare for this role at this company."
    },
    "question_bank": [
        {
            "question": "The question text",
            "answer": "Detailed professional answer showcasing expertise",
            "category": "Technical|Scenario|Behavioral|Managerial|HR|Architecture",
            "difficulty": "Easy|Medium|Hard",
            "expected_evaluation": "What the interviewer is looking for in a strong response"
        }
    ],
    "scenario_questions": [
        {
            "problem": "e.g., Production Kubernetes Cluster Down / Pod CrashLoopBackOff / High CPU / Disk Full",
            "investigation": "How to investigate step-by-step",
            "commands": "Actual commands to run (e.g. kubectl describe, systemctl restart)",
            "solution": "Step-by-step solution to fix the issue",
            "root_cause": "The root cause explanation",
            "prevention": "How to prevent this incident from recurring"
        }
    ],
    "star_answers": [
        {
            "category": "Leadership|Conflict|Pressure|Ownership|Failures|Success Stories",
            "situation": "Situation context (based on actual experiences in the candidate's resume)",
            "task": "Task that needed to be completed",
            "action": "Actions taken by the candidate",
            "result": "Measurable business or technical outcome/impact"
        }
    ],
    "cheat_sheets": {
        "revision_5min": ["List of key architectural concepts or core definitions"],
        "revision_10min": ["List of key commands, design patterns, or troubleshooting flows"],
        "interview_day": ["Final checklist, common mistakes to avoid, and last-minute memory tricks"]
    },
    "flashcards": [
        {
            "question": "Flashcard question",
            "answer": "Short, clear answer",
            "explanation": "Detailed explanation / context",
            "category": "Category name",
            "difficulty": "Easy|Medium|Hard"
        }
    ],
    "mock_interviews": [
        {
            "question": "Mock interview question",
            "expected_answer": "Key points that must be hit in the answer",
            "evaluation_criteria": "Grading criteria for the candidate",
            "difficulty": "Easy|Medium|Hard"
        }
    ]
}

Enforce the following rules:
1. All generated STAR answers MUST base their Situation, Task, Action, and Result on actual experiences listed in the candidate's Master Resume. Do not fabricate new job experiences.
2. In scenario_questions, provide realistic, high-fidelity engineering scenarios (e.g., Kubernetes, AWS, databases, pipelines) with concrete bash commands, investigative checklists, and root cause mitigation plans. Generate at least 3 detailed scenario playbooks.
3. Generate at least 6 question_bank entries (Technical, Behavioral, HR, Managerial) and at least 6 flashcards.
"""

        user_prompt = f"""
Candidate Resume:
{json.dumps(master_resume, indent=2)}

Target Company: {jd_analysis.get("company", "the target company")}
Target Role: {jd_analysis.get("role", "the target role")}

Job Description Text:
{jd_text}

Job Description Analysis:
{json.dumps(jd_analysis, indent=2)}
"""
        result = await self._call_openai(system_prompt, user_prompt, response_format="json")
        return json.loads(result)


ai_generator = AIGeneratorService()
