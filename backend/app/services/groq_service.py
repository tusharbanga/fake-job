import json

from groq import AsyncGroq

from ..config import settings


async def analyze_with_groq(text: str) -> dict:
    if not settings.groq_api_key:
        return {
            "classification": "uncertain",
            "score": 0,
            "reasons": ["Groq API is not configured"],
            "summary": "Groq analysis is unavailable until GROQ_API_KEY is configured.",
        }
    client = AsyncGroq(api_key=settings.groq_api_key)
    response = await client.chat.completions.create(
        model=settings.groq_model,
        temperature=0,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "Analyze the complete job posting for scam indicators and extract its details using only evidence in the supplied text. Return JSON only with classification (positive, negative, or uncertain), score (0-100), reasons (array of no more than 5 strings), summary (string of no more than 5 sentences), and job (object with title, company, location, work_mode, employment_type, duration, experience, salary, and skills array). Use 'Not listed' for details absent from the posting. Do not treat a low internship stipend, an unfamiliar company name, a certificate, or a company name that merely resembles another brand as proof of fraud. Prefer uncertain when verification is limited, and recognize official platform links, company details, responsibilities, requirements, and activity information as legitimacy signals."},
            {"role": "user", "content": text},
        ],
    )
    data = json.loads(response.choices[0].message.content or "{}")
    classification = data.get("classification", "uncertain")
    if classification not in {"positive", "negative", "uncertain"}:
        classification = "uncertain"
    return {
        "classification": classification,
        "score": max(0, min(100, int(data.get("score", 0)))),
        "reasons": [str(item) for item in data.get("reasons", [])],
        "summary": str(data.get("summary", "")),
        "job": {
            "title": str(data.get("job", {}).get("title", "Not listed")),
            "company": str(data.get("job", {}).get("company", "Not listed")),
            "location": str(data.get("job", {}).get("location", "Not listed")),
            "work_mode": str(data.get("job", {}).get("work_mode", "Not listed")),
            "employment_type": str(data.get("job", {}).get("employment_type", "Not listed")),
            "duration": str(data.get("job", {}).get("duration", "Not listed")),
            "experience": str(data.get("job", {}).get("experience", "Not listed")),
            "salary": str(data.get("job", {}).get("salary", "Not listed")),
            "skills": [str(item) for item in data.get("job", {}).get("skills", [])],
        },
    }
