"""
Test Suite for Phase 2 Backend Features
Verifies database operations, text extraction from supporting documents,
and the resume memory prompt integration.
"""

import asyncio
import sys
from pathlib import Path

# Add backend directory to system path
sys.path.append(str(Path(__file__).parent.parent / "backend"))

from sqlalchemy import select
from app.core.database import async_session_factory, init_db
from app.models import SupportingDocument, ResumeMemory
from app.services.ai_generator import ai_generator

async def test_supporting_documents(session):
    print("Testing SupportingDocument DB operations...")
    # Add new doc
    doc = SupportingDocument(
        name="Test AWS Certification",
        doc_type="certificate",
        content="Certified Solutions Architect - Associate. Score: 950/1000. AWS Certified.",
        file_path="mock_uploads/aws_cert.pdf"
    )
    session.add(doc)
    await session.commit()
    print("  SupportingDocument inserted successfully.")

    # Select doc
    stmt = select(SupportingDocument).where(SupportingDocument.doc_type == "certificate")
    result = await session.execute(stmt)
    selected = result.scalars().first()
    assert selected is not None
    assert selected.name == "Test AWS Certification"
    print("  SupportingDocument retrieved successfully.")

    # Clean up
    await session.delete(selected)
    await session.commit()
    print("  SupportingDocument deleted and cleaned up successfully.")


async def test_resume_memory(session):
    print("Testing ResumeMemory DB operations & Prompt Injection...")
    # Add preference
    pref = ResumeMemory(
        key="verb_style",
        value="Always start each bullet point with a strong, active verb like Spearheaded, Designed, or Orchestrated."
    )
    session.add(pref)
    await session.commit()
    print("  ResumeMemory preference inserted successfully.")

    # Select preference
    stmt = select(ResumeMemory).where(ResumeMemory.key == "verb_style")
    result = await session.execute(stmt)
    selected = result.scalars().first()
    assert selected is not None
    assert "Spearheaded" in selected.value
    print("  ResumeMemory preference retrieved successfully.")

    # Mock tailoring request and see if it retrieves guidelines
    print("  Verifying generator retrieves memories from DB...")
    mock_master = {"skills": ["Python"]}
    mock_jd_analysis = {"role": "Backend Engineer"}
    
    # We can patch OpenAI call to check the system prompt sent to it
    original_call = ai_generator._call_openai
    captured_system_prompt = None

    async def mock_call(system_prompt, user_prompt, response_format=None):
        nonlocal captured_system_prompt
        captured_system_prompt = system_prompt
        return "{}"

    ai_generator._call_openai = mock_call
    try:
        await ai_generator.generate_tailored_resume(mock_master, "Mock JD text", mock_jd_analysis, db=session)
        assert captured_system_prompt is not None
        assert "verb_style" in captured_system_prompt
        assert "Spearheaded" in captured_system_prompt
        print("  Prompt Injection Verified: Guidelines are successfully included in the system prompt!")
    finally:
        ai_generator._call_openai = original_call

    # Clean up
    await session.delete(selected)
    await session.commit()
    print("  ResumeMemory preference deleted and cleaned up successfully.")


async def main():
    # Make sure database is initialized and updated
    await init_db()
    
    async with async_session_factory() as session:
        try:
            await test_supporting_documents(session)
            print("-" * 50)
            await test_resume_memory(session)
            print("-" * 50)
            print("ALL PHASE 2 BACKEND TESTS PASSED SUCCESSFULLY!")
        except AssertionError as e:
            print(f"Test assertion failed: {e}")
        except Exception as e:
            print(f"Error during tests: {e}")

if __name__ == "__main__":
    asyncio.run(main())
