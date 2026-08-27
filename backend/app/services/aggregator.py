from datetime import datetime, timezone
from uuid import uuid4

from .groq_service import analyze_with_groq
from .matching import match_resume
from .ml_detector import analyze_job


async def analyze(text: str, resume_text: str | None = None) -> dict:
    ml = analyze_job(text)
    groq = await analyze_with_groq(text)
    if ml["available"] and ml["classification"] and ml["score"] is not None:
        groq_direction = "positive" if groq["classification"] == "positive" else "negative" if groq["classification"] == "negative" else None
        classification = ml["classification"] if not groq_direction or groq_direction == ml["classification"] else "uncertain"
        final = {
            "classification": classification,
            "score": round((ml["score"] + groq["score"]) / 2),
            "reasons": list(dict.fromkeys(ml["reasons"] + groq["reasons"])),
        }
    else:
        # Until the adapter is configured, ML absence is not a prediction.
        final = groq
    return {
        "_id": str(uuid4()),
        "text": text,
        "ml": ml,
        "groq": groq,
        "classification": final["classification"],
        "score": final["score"],
        "reasons": final["reasons"],
        "resume_match": match_resume(text, resume_text) if resume_text else None,
        "created_at": datetime.now(timezone.utc),
    }
