"""
777c8 Career OS — Resume Parser Service
Extracts structured data from PDF, DOCX, and TXT resumes.
Uses PyMuPDF for PDFs, python-docx for DOCX, and OpenAI for intelligent section extraction.
"""

import hashlib
from pathlib import Path
from typing import Optional
from loguru import logger

from app.schemas import ExtractedResumeData, PersonalDetails, ExperienceEntry, ProjectEntry, EducationEntry, CertificationEntry


class ResumeParserService:
    """Parses uploaded resumes into structured data."""

    SUPPORTED_FORMATS = {"pdf", "docx", "txt"}

    async def parse(self, file_path: str, file_type: str) -> ExtractedResumeData:
        """Parse a resume file and return structured data."""
        file_type = file_type.lower().strip(".")

        if file_type not in self.SUPPORTED_FORMATS:
            raise ValueError(f"Unsupported file format: {file_type}. Supported: {self.SUPPORTED_FORMATS}")

        logger.info(f"Parsing resume: {file_path} (type: {file_type})")

        # Step 1: Extract raw text
        raw_text = await self._extract_text(file_path, file_type)

        if not raw_text or len(raw_text.strip()) < 50:
            raise ValueError("Could not extract sufficient text from the resume file.")

        # Step 2: Parse into structured sections
        extracted = await self._parse_sections(raw_text)

        logger.info(f"Successfully parsed resume with {len(extracted.experience)} experience entries, {len(extracted.skills)} skills")
        return extracted

    async def _extract_text(self, file_path: str, file_type: str) -> str:
        """Extract raw text from a file based on its type."""
        from app.services.crypto_service import crypto_service
        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(f"Resume file not found: {file_path}")

        # Read decrypted bytes
        data = crypto_service.secure_read_bytes(path)

        if file_type == "pdf":
            return await self._extract_from_pdf_data(data)
        elif file_type == "docx":
            return await self._extract_from_docx_data(data)
        elif file_type == "txt":
            return await self._extract_from_txt_data(data)

        raise ValueError(f"Unsupported format: {file_type}")

    async def _extract_from_pdf_data(self, data: bytes) -> str:
        """Extract text from PDF using PyMuPDF from bytes."""
        try:
            import fitz  # PyMuPDF
            import io
            doc = fitz.open(stream=io.BytesIO(data), filetype="pdf")
            text = ""
            for page in doc:
                text += page.get_text()
            doc.close()
            return text
        except ImportError:
            logger.error("PyMuPDF not installed. Install with: pip install PyMuPDF")
            raise RuntimeError("PyMuPDF is required for PDF parsing. Install with: pip install PyMuPDF")
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            raise

    async def _extract_from_docx_data(self, data: bytes) -> str:
        """Extract text from DOCX using python-docx from bytes."""
        try:
            from docx import Document
            import io
            doc = Document(io.BytesIO(data))
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            return text
        except ImportError:
            logger.error("python-docx not installed. Install with: pip install python-docx")
            raise RuntimeError("python-docx is required for DOCX parsing. Install with: pip install python-docx")
        except Exception as e:
            logger.error(f"Error extracting text from DOCX: {e}")
            raise

    async def _extract_from_txt_data(self, data: bytes) -> str:
        """Extract text from plain text bytes."""
        try:
            return data.decode("utf-8")
        except UnicodeDecodeError:
            return data.decode("latin-1")

    async def _parse_sections(self, raw_text: str) -> ExtractedResumeData:
        """
        Parse raw resume text into structured sections.
        Uses keyword-based section detection with intelligent parsing.
        """
        lines = raw_text.strip().split("\n")
        lines = [line.strip() for line in lines if line.strip()]

        sections = self._identify_sections(lines)

        personal = self._extract_personal_details(lines[:10])
        summary = sections.get("summary", "")
        experience = self._extract_experience(sections.get("experience_lines", []))
        skills = self._extract_skills(sections.get("skills_text", ""))
        projects = self._extract_projects(sections.get("projects_lines", []))
        education = self._extract_education(sections.get("education_lines", []))
        certifications = self._extract_certifications(sections.get("certifications_lines", []))
        awards = sections.get("awards", [])

        return ExtractedResumeData(
            personal_details=personal,
            summary=summary,
            experience=experience,
            skills=skills,
            projects=projects,
            education=education,
            certifications=certifications,
            awards=awards,
        )

    def _identify_sections(self, lines: list[str]) -> dict:
        """Identify resume sections by header keywords."""
        section_headers = {
            "summary": ["summary", "professional summary", "objective", "profile", "about"],
            "experience": ["experience", "work experience", "employment", "professional experience", "work history"],
            "skills": ["skills", "technical skills", "core competencies", "technologies", "tools"],
            "projects": ["projects", "key projects", "notable projects"],
            "education": ["education", "academic", "qualifications"],
            "certifications": ["certifications", "certificates", "professional certifications"],
            "awards": ["awards", "honors", "achievements", "recognition"],
        }

        sections = {}
        current_section = None
        current_lines = []

        for line in lines:
            line_lower = line.lower().strip().rstrip(":")

            matched_section = None
            for section_name, keywords in section_headers.items():
                if line_lower in keywords or any(line_lower.startswith(kw) for kw in keywords):
                    matched_section = section_name
                    break

            if matched_section:
                if current_section:
                    self._store_section(sections, current_section, current_lines)
                current_section = matched_section
                current_lines = []
            else:
                current_lines.append(line)

        if current_section:
            self._store_section(sections, current_section, current_lines)

        return sections

    def _store_section(self, sections: dict, section_name: str, lines: list[str]) -> None:
        """Store parsed section data."""
        content = "\n".join(lines).strip()
        if section_name == "summary":
            sections["summary"] = content
        elif section_name == "skills":
            sections["skills_text"] = content
        elif section_name == "awards":
            sections["awards"] = [line for line in lines if line.strip()]
        else:
            sections[f"{section_name}_lines"] = lines

    def _extract_personal_details(self, header_lines: list[str]) -> PersonalDetails:
        """Extract personal details from the top of the resume."""
        import re

        full_text = " ".join(header_lines)
        details = PersonalDetails()

        # Name: usually the first non-empty line
        if header_lines:
            details.full_name = header_lines[0]

        # Email
        email_match = re.search(r'[\w.+-]+@[\w-]+\.[\w.-]+', full_text)
        if email_match:
            details.email = email_match.group()

        # Phone
        phone_match = re.search(r'[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]{7,15}', full_text)
        if phone_match:
            details.phone = phone_match.group().strip()

        # LinkedIn
        linkedin_match = re.search(r'linkedin\.com/in/[\w-]+', full_text, re.IGNORECASE)
        if linkedin_match:
            details.linkedin = f"https://{linkedin_match.group()}"

        # GitHub
        github_match = re.search(r'github\.com/[\w-]+', full_text, re.IGNORECASE)
        if github_match:
            details.github = f"https://{github_match.group()}"

        # Location: common patterns
        location_match = re.search(r'([A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s*[A-Z]{2})', full_text)
        if location_match:
            details.location = location_match.group()

        return details

    def _extract_experience(self, lines: list[str]) -> list[ExperienceEntry]:
        """Extract work experience entries."""
        import re

        entries = []
        current_entry = None
        current_bullets = []

        date_pattern = re.compile(
            r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|'
            r'\d{1,2}/\d{4}|'
            r'\d{4})\s*[-–—to]+\s*'
            r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|'
            r'\d{1,2}/\d{4}|'
            r'\d{4}|Present|Current)',
            re.IGNORECASE
        )

        for line in lines:
            line = line.strip()
            if not line:
                continue

            date_match = date_pattern.search(line)

            # Check if this line looks like a new position header
            is_bullet = line.startswith(("•", "-", "●", "○", "▪", "◦", "*", "–"))

            if date_match and not is_bullet:
                # Save previous entry
                if current_entry:
                    current_entry.bullets = current_bullets
                    entries.append(current_entry)

                # Parse new entry
                title_part = line[:date_match.start()].strip().rstrip("|,–-")
                parts = [p.strip() for p in title_part.split("|")]
                if len(parts) < 2:
                    parts = [p.strip() for p in title_part.split(",")]

                current_entry = ExperienceEntry(
                    company=parts[0] if parts else line,
                    title=parts[1] if len(parts) > 1 else "",
                    location=parts[2] if len(parts) > 2 else None,
                    start_date=date_match.group(1),
                    end_date=date_match.group(2),
                    is_current="present" in date_match.group(2).lower() if date_match.group(2) else False,
                )
                current_bullets = []
            elif is_bullet:
                bullet_text = line.lstrip("•-●○▪◦*– ").strip()
                if bullet_text:
                    current_bullets.append(bullet_text)
            elif current_entry and line and not date_match:
                # Could be a continuation or sub-header
                if len(line) > 20:  # Likely a bullet without marker
                    current_bullets.append(line)

        # Save last entry
        if current_entry:
            current_entry.bullets = current_bullets
            entries.append(current_entry)

        return entries

    def _extract_skills(self, skills_text: str) -> list[str]:
        """Extract individual skills from skills section."""
        if not skills_text:
            return []

        # Split by common delimiters
        import re
        skills = re.split(r'[,;|•●○▪◦\n]+', skills_text)
        skills = [s.strip().strip("-*– ") for s in skills if s.strip() and len(s.strip()) > 1]

        # Remove category headers (lines ending with ":")
        skills = [s for s in skills if not s.endswith(":")]

        return skills

    def _extract_projects(self, lines: list[str]) -> list[ProjectEntry]:
        """Extract project entries."""
        entries = []
        current_project = None
        current_bullets = []

        for line in lines:
            line = line.strip()
            if not line:
                continue

            is_bullet = line.startswith(("•", "-", "●", "○", "▪", "◦", "*", "–"))

            if not is_bullet and len(line) < 100:
                if current_project:
                    current_project.bullets = current_bullets
                    entries.append(current_project)

                current_project = ProjectEntry(name=line)
                current_bullets = []
            elif is_bullet and current_project:
                bullet_text = line.lstrip("•-●○▪◦*– ").strip()
                if bullet_text:
                    current_bullets.append(bullet_text)

        if current_project:
            current_project.bullets = current_bullets
            entries.append(current_project)

        return entries

    def _extract_education(self, lines: list[str]) -> list[EducationEntry]:
        """Extract education entries."""
        entries = []
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            if not line:
                i += 1
                continue

            # Assume education entry spans 1-2 lines
            entry = EducationEntry(
                institution=line,
                degree=lines[i + 1].strip() if i + 1 < len(lines) else "",
            )
            entries.append(entry)
            i += 2

        return entries

    def _extract_certifications(self, lines: list[str]) -> list[CertificationEntry]:
        """Extract certification entries."""
        entries = []
        for line in lines:
            line = line.strip().lstrip("•-●○▪◦*– ")
            if not line:
                continue
            parts = [p.strip() for p in line.split("–")]
            if len(parts) < 2:
                parts = [p.strip() for p in line.split("-", 1)]

            entry = CertificationEntry(
                name=parts[0],
                issuer=parts[1] if len(parts) > 1 else None,
            )
            entries.append(entry)

        return entries

    @staticmethod
    def compute_hash(content: str) -> str:
        """Compute SHA-256 hash of content for cache deduplication."""
        return hashlib.sha256(content.encode()).hexdigest()


resume_parser = ResumeParserService()
