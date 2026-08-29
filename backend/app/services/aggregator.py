from datetime import datetime, timezone
from uuid import uuid4

from .groq_service import analyze_with_groq
from .matching import match_resume


async def analyze(text: str, resume_text: str | None = None, resume_id: str | None = None) -> dict:
    groq = await analyze_with_groq(text)
    # Use the skills the AI actually extracted for THIS job posting as the
    # primary skill list for resume matching, instead of a fixed keyword
    # list — this is what lets non-generic roles (networking, mobile, data,
    # sales, ...) get a meaningful match score.
    job_skills = groq.get("job", {}).get("skills", [])
    resume_match = (
        match_resume(text, resume_text, job_skills)
        if resume_text
        else None
    )
    return {
        "_id": str(uuid4()),
        "text": text,
        "groq": groq,
        "resume_id": resume_id,
        "classification": groq["classification"],
        "score": groq["score"],
        "reasons": groq["reasons"],
        "resume_match": resume_match,
        "created_at": datetime.now(timezone.utc),
    }
