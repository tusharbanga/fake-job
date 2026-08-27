import re


MATCHABLE_TERMS = (
    "python", "java", "javascript", "typescript", "react", "node.js", "aws", "sql", "c++", "kafka",
    "spring boot", "machine learning", "data science", "artificial intelligence", "crm", "erp",
    "enterprise sales", "account planning", "financial services", "consultative sales", "pipeline",
    "forecasting", "customer success", "return on investment", "cloud", "docker", "kubernetes",
)


def match_resume(job_text: str, resume_text: str, job_skills: list[str] | None = None) -> dict:
    normalized_resume = resume_text.lower()
    if job_skills:
        # Match against the skills actually extracted for this job posting (by the AI),
        # so the score is consistent with what's shown in the Skills section.
        job_terms = {skill.strip().lower() for skill in job_skills if skill and skill.strip()}
    else:
        # Fallback for callers that don't have AI-extracted skills available.
        normalized_job = job_text.lower()
        job_terms = {term for term in MATCHABLE_TERMS if term in normalized_job}
    matched = sorted(term for term in job_terms if term in normalized_resume)
    missing = sorted(job_terms - set(matched), key=len, reverse=True)
    score = round((len(matched) / max(len(job_terms), 1)) * 100) if job_terms else 0
    return {"score": min(score, 100), "matched_keywords": matched[:50], "matched_count": len(matched), "missing_keywords": missing}
