from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.api import deps
from app.db import models
from app.db.session import get_db
from app.core.security import check_feature_access
import os

router = APIRouter()

SOP_SYSTEM_PROMPT = """Write a Statement of Purpose for:
Student: {name}, {nationality}
Degree: {target_degree} in {major}
University: {uni_name}
Scholarship: {scholarship_name}
CGPA: {cgpa}/4.0
Experience: {work_experience}
Goals: Study in {target_country}

Requirements:
- {word_count} words
- Tone: {tone}
- Highlight academic strengths
- Address CGPA if below 3.5 (explain positively)
- Show genuine interest in university
- Professional, scholarship-winning quality
"""

REFINE_SYSTEM_PROMPT = """You are an expert SOP editor. 
Refine the following Statement of Purpose according to the instruction.
Return ONLY the refined SOP text, no preamble.

Instruction: {instruction}

SOP to refine:
{sop_text}
"""


class SopGenerateRequest(BaseModel):
    scholarship_id: int
    tone: str = "formal"      # "formal" / "friendly"
    word_count: int = 500


class SopRefineRequest(BaseModel):
    sop_text: str
    instruction: str


def _call_openai_sop(prompt: str, system: str) -> tuple[str, int]:
    """Call OpenAI for SOP generation. Falls back to mock if no key."""
    openai_key = os.getenv("OPENAI_API_KEY", "")
    if not openai_key or len(openai_key) < 10:
        word_count = 500
        mock_sop = (
            f"I am writing to express my strong interest in the scholarship opportunity at your esteemed institution. "
            f"My academic journey has been marked by consistent dedication and a passion for excellence in my field of study. "
            f"Throughout my undergraduate studies, I have developed a strong foundation in theoretical concepts while also "
            f"gaining practical experience through various projects and research initiatives.\n\n"
            f"My CGPA reflects my commitment to academic excellence, demonstrating my ability to grasp complex concepts "
            f"and apply them effectively. Beyond academics, I have engaged in extracurricular activities that have shaped "
            f"my leadership skills and broadened my perspective.\n\n"
            f"I am particularly drawn to your institution because of its world-class faculty, cutting-edge research "
            f"facilities, and vibrant academic community. This scholarship would not only support my studies financially "
            f"but also provide me with the opportunity to contribute to and benefit from your institution's academic excellence.\n\n"
            f"Upon completion of my studies, I plan to return to my home country and apply the knowledge and skills "
            f"gained to contribute meaningfully to my field and society. I am confident that this scholarship will be "
            f"a transformative experience that will shape my professional journey.\n\n"
            f"*(Note: AI API not configured. This is a sample SOP. Contact admin to enable full AI generation.)*"
        )
        return mock_sop, 300

    try:
        import openai
        client = openai.OpenAI(api_key=openai_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000,
            temperature=0.7
        )
        text = response.choices[0].message.content.strip()
        tokens = response.usage.total_tokens if response.usage else 500
        return text, tokens
    except Exception as e:
        return f"AI service temporarily unavailable: {str(e)[:100]}", 0


@router.post("/generate")
def generate_sop(
    body: SopGenerateRequest,
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a Statement of Purpose – Premium/Pro only."""
    # Feature gate
    check_feature_access("sop_writer", current_user)

    # Fetch scholarship
    scholarship = db.query(models.Scholarship).filter(
        models.Scholarship.id == body.scholarship_id
    ).first()
    if not scholarship:
        raise HTTPException(status_code=404, detail="Scholarship not found")

    uni_name = "Unknown University"
    if scholarship.university:
        uni_name = scholarship.university.name

    # Work experience helper
    work_exp = "None"
    if current_user.work_experience_years and current_user.work_experience_years not in ("0", ""):
        wtype = current_user.work_experience_type or "general"
        work_exp = f"{current_user.work_experience_years} years of {wtype} experience"

    word_count = max(200, min(body.word_count, 1000))

    system_prompt = SOP_SYSTEM_PROMPT.format(
        name=current_user.full_name or "Student",
        nationality=current_user.nationality or "Pakistani",
        target_degree=current_user.target_degree or "Masters",
        major=current_user.major or "the chosen field",
        uni_name=uni_name,
        scholarship_name=scholarship.title,
        cgpa=current_user.cgpa or "N/A",
        work_experience=work_exp,
        target_country=current_user.target_country or scholarship.country or "the target country",
        word_count=word_count,
        tone=body.tone
    )

    sop_text, tokens_used = _call_openai_sop(
        f"Generate a {word_count}-word SOP as described.",
        system_prompt
    )

    actual_word_count = len(sop_text.split())

    return {
        "sop_text": sop_text,
        "word_count": actual_word_count,
        "scholarship_name": scholarship.title,
        "university_name": uni_name,
        "tokens_used": tokens_used
    }


@router.post("/refine")
def refine_sop(
    body: SopRefineRequest,
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """Refine an existing SOP – Premium/Pro only."""
    check_feature_access("sop_writer", current_user)

    if not body.sop_text.strip():
        raise HTTPException(status_code=400, detail="SOP text cannot be empty")
    if not body.instruction.strip():
        raise HTTPException(status_code=400, detail="Refinement instruction cannot be empty")

    system_prompt = REFINE_SYSTEM_PROMPT.format(
        instruction=body.instruction,
        sop_text=body.sop_text
    )

    refined_text, tokens_used = _call_openai_sop("Please refine the SOP as instructed.", system_prompt)

    return {
        "sop_text": refined_text,
        "word_count": len(refined_text.split()),
        "tokens_used": tokens_used
    }
