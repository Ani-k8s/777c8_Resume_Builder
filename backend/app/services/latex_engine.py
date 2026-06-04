"""
777c8 Career OS — LaTeX Engine Service
Jinja2 + LaTeX template rendering and pdflatex compilation.
Detects pdflatex availability and provides installation guidance.
"""

import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Optional
from loguru import logger

from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.core.config import settings


class LaTeXEngineService:
    """Renders LaTeX templates and compiles PDFs."""

    def __init__(self):
        self._pdflatex_available: Optional[bool] = None
        self._env: Optional[Environment] = None

    @property
    def jinja_env(self) -> Environment:
        """Jinja2 environment with LaTeX-safe delimiters."""
        if self._env is None:
            self._env = Environment(
                loader=FileSystemLoader(str(settings.TEMPLATES_DIR)),
                block_start_string="((*",
                block_end_string="*))",
                variable_start_string="((",
                variable_end_string="))",
                comment_start_string="((#",
                comment_end_string="#))",
                autoescape=False,
            )
            self._env.filters["tex_escape"] = self.tex_escape
        return self._env

    @staticmethod
    def tex_escape(text: str) -> str:
        """Escape LaTeX special characters."""
        if not isinstance(text, str):
            text = str(text)
        conv = {
            "&": r"\&",
            "%": r"\%",
            "$": r"\$",
            "#": r"\#",
            "_": r"\_",
            "{": r"\{",
            "}": r"\}",
            "~": r"\textasciitilde{}",
            "^": r"\textasciicircum{}",
        }
        return "".join(conv.get(c, c) for c in text)

    def check_pdflatex(self) -> dict:
        """
        Check if pdflatex is available.
        Returns status and installation guide if missing.
        """
        if self._pdflatex_available is None:
            self._pdflatex_available = shutil.which(settings.PDFLATEX_PATH) is not None

        if self._pdflatex_available:
            # Get version info
            try:
                result = subprocess.run(
                    [settings.PDFLATEX_PATH, "--version"],
                    capture_output=True, text=True, timeout=10
                )
                version_line = result.stdout.split("\n")[0] if result.stdout else "Unknown version"
            except Exception:
                version_line = "Installed (version unknown)"

            return {
                "available": True,
                "version": version_line,
                "path": shutil.which(settings.PDFLATEX_PATH),
                "message": "pdflatex is installed and ready.",
            }

        return {
            "available": False,
            "version": None,
            "path": None,
            "message": "pdflatex is not installed.",
            "installation_guide": {
                "windows": {
                    "option_1": {
                        "name": "MiKTeX (Recommended for Windows)",
                        "steps": [
                            "1. Download MiKTeX from https://miktex.org/download",
                            "2. Run the installer and select 'Install for all users'",
                            "3. Choose 'Yes' for automatic package installation",
                            "4. After installation, open a new terminal and verify: pdflatex --version",
                            "5. Restart the 777c8 Career OS backend server",
                        ],
                    },
                    "option_2": {
                        "name": "TeX Live",
                        "steps": [
                            "1. Download TeX Live from https://tug.org/texlive/",
                            "2. Run install-tl-windows.bat",
                            "3. Select 'Full installation' for all packages",
                            "4. Add TeX Live bin to your PATH",
                            "5. Verify: pdflatex --version",
                        ],
                    },
                },
                "linux": {
                    "ubuntu_debian": "sudo apt-get install texlive-latex-base texlive-fonts-recommended texlive-latex-extra",
                    "centos_rhel": "sudo yum install texlive-latex",
                    "arch": "sudo pacman -S texlive-core",
                },
                "macos": {
                    "homebrew": "brew install --cask mactex-no-gui",
                    "manual": "Download MacTeX from https://tug.org/mactex/",
                },
                "docker": {
                    "note": "If using Docker, pdflatex is included in the Docker image automatically.",
                    "dockerfile_snippet": 'RUN apt-get update && apt-get install -y texlive-latex-base texlive-fonts-recommended texlive-latex-extra',
                },
            },
        }

    async def render_template(self, template_id: str, data: dict) -> str:
        """Render a LaTeX template with resume data."""
        template_file = f"{template_id}/template.tex.j2"

        try:
            template = self.jinja_env.get_template(template_file)
        except Exception:
            logger.warning(f"Template {template_file} not found, using default")
            template = self.jinja_env.get_template("modern_ats/template.tex.j2")

        rendered = template.render(**data)
        return rendered

    async def compile_pdf(self, tex_content: str, output_filename: str) -> dict:
        """Compile LaTeX content to PDF using pdflatex."""
        status = self.check_pdflatex()
        if not status["available"]:
            return {
                "success": False,
                "error": "pdflatex is not installed",
                "installation_guide": status["installation_guide"],
                "pdf_path": None,
                "tex_path": None,
            }

        # Create output directory
        output_dir = settings.GENERATED_DIR
        output_dir.mkdir(parents=True, exist_ok=True)

        # Write .tex file
        tex_filename = output_filename.replace(".pdf", ".tex")
        tex_path = output_dir / tex_filename

        # Look up settings
        from app.services.settings_service import settings_service
        from app.services.crypto_service import crypto_service
        from app.core.database import async_session_factory
        
        encrypt = False
        async with async_session_factory() as session:
            try:
                system_settings = await settings_service.get_settings(session)
                encrypt = system_settings.encrypt_files
            except Exception:
                pass

        try:
            crypto_service.secure_write_bytes(tex_path, tex_content.encode("utf-8"), encrypt=encrypt)
        except Exception as e:
            logger.error(f"Failed to write secure tex source: {e}")
            return {
                "success": False,
                "error": f"Failed to save tex file: {str(e)}",
                "pdf_path": None,
                "tex_path": None,
            }

        # Compile in a temp directory to avoid clutter
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp_tex = Path(tmpdir) / "resume.tex"
            tmp_tex.write_text(tex_content, encoding="utf-8")

            try:
                # Run pdflatex twice for proper references
                for pass_num in range(2):
                    result = subprocess.run(
                        [settings.PDFLATEX_PATH, "-interaction=nonstopmode", "-output-directory", tmpdir, str(tmp_tex)],
                        capture_output=True, text=True, timeout=60, cwd=tmpdir,
                    )

                    if result.returncode != 0 and pass_num == 1:
                        logger.error(f"pdflatex compilation failed:\n{result.stderr}\n{result.stdout}")
                        return {
                            "success": False,
                            "error": f"LaTeX compilation failed: {result.stderr[:500]}",
                            "pdf_path": None,
                            "tex_path": str(tex_path),
                        }

                # Copy PDF to output directory
                tmp_pdf = Path(tmpdir) / "resume.pdf"
                if tmp_pdf.exists():
                    pdf_path = output_dir / output_filename
                    try:
                        pdf_data = tmp_pdf.read_bytes()
                        crypto_service.secure_write_bytes(pdf_path, pdf_data, encrypt=encrypt)
                    except Exception as e:
                        logger.error(f"Failed to save secure PDF: {e}")
                        return {
                            "success": False,
                            "error": f"Failed to save PDF: {str(e)}",
                            "pdf_path": None,
                            "tex_path": str(tex_path),
                        }

                    logger.info(f"PDF generated securely: {pdf_path}")
                    return {
                        "success": True,
                        "pdf_path": str(pdf_path),
                        "tex_path": str(tex_path),
                        "error": None,
                    }
                else:
                    return {
                        "success": False,
                        "error": "PDF file was not generated",
                        "pdf_path": None,
                        "tex_path": str(tex_path),
                    }

            except subprocess.TimeoutExpired:
                return {
                    "success": False,
                    "error": "pdflatex compilation timed out (60s limit)",
                    "pdf_path": None,
                    "tex_path": str(tex_path),
                }
            except Exception as e:
                logger.error(f"PDF compilation error: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "pdf_path": None,
                    "tex_path": str(tex_path),
                }

    async def generate_resume_pdf(self, template_id: str, resume_data: dict, output_filename: str) -> dict:
        """Full pipeline: render template + compile PDF."""
        tex_content = await self.render_template(template_id, resume_data)
        return await self.compile_pdf(tex_content, output_filename)


latex_engine = LaTeXEngineService()
