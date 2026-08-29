import re

# Fallback ONLY — used when the AI has not supplied job_skills at all (e.g. an
# older stored analysis, or an upstream failure). Whenever job_skills are
# available, they are the sole source of truth for what counts as a job skill;
# this list is never used to filter or restrict AI-extracted skills.
MATCHABLE_TERMS = (
    "python", "java", "javascript", "typescript", "react", "node.js", "aws", "sql", "c++", "kafka",
    "spring boot", "machine learning", "data science", "artificial intelligence", "crm", "erp",
    "enterprise sales", "account planning", "financial services", "consultative sales", "pipeline",
    "forecasting", "customer success", "return on investment", "cloud", "docker", "kubernetes",
)


def _normalize(text: str) -> str:
    """Case/whitespace/punctuation-insensitive key for comparing two skill
    strings, so 'Node.js', 'node js' and 'NODE-JS' are treated as the same
    skill. Keeps '+' and '#' so 'C++' and 'C#' stay distinguishable."""
    text = (text or "").strip().lower()
    text = re.sub(r"[\s./_-]+", " ", text)
    text = re.sub(r"[^\w\s+#]", "", text)
    return re.sub(r"\s+", " ", text).strip()


def _dedupe_preserve_order(skills) -> list[tuple[str, str]]:
    """Returns [(normalized_key, readable_label), ...] with duplicates
    (by normalized key) removed, keeping the first readable spelling seen."""
    seen = set()
    result = []
    for skill in skills or []:
        readable = str(skill).strip()
        key = _normalize(readable)
        if not key or key in seen:
            continue
        seen.add(key)
        result.append((key, readable))
    return result


def match_resume(job_text: str, resume_text: str, job_skills: list[str] | None = None) -> dict:
    normalized_resume = _normalize(resume_text)

    if job_skills:
        # Primary path: compare the resume only against the skills the AI
        # actually extracted from this specific job posting. This scales to
        # any domain (networking, mobile, data, sales, ...) without needing
        # every possible skill hardcoded ahead of time.
        job_terms = _dedupe_preserve_order(job_skills)
    else:
        # No AI-extracted skills available for this posting — fall back to a
        # small known-terms list rather than treating every word in the job
        # description as a skill.
        normalized_job = _normalize(job_text)
        job_terms = [
            (term, term) for term in MATCHABLE_TERMS if term in normalized_job
        ]

    matched = [readable for key, readable in job_terms if key and key in normalized_resume]
    missing = [readable for key, readable in job_terms if not (key and key in normalized_resume)]

    total = len(job_terms)
    score = round((len(matched) / total) * 100) if total else 0
    return {
        "score": min(score, 100),
        "matched_keywords": matched[:50],
        "matched_count": len(matched),
        "missing_keywords": missing,
    }
