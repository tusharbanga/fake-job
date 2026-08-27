from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from ..schemas import AnalysisRequest
from ..services.aggregator import analyze
from ..services.matching import match_resume
from ..services.resume_service import extract_text

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.post("/demo")
async def analyze_demo(request: AnalysisRequest):
    try:
        result = await analyze(request.text)
    except Exception as exc:
        raise HTTPException(502, f"Analysis error: {exc}") from exc
    return result


@router.post("/demo-match")
async def analyze_demo_match(
    text: str = Form(...),
    file: UploadFile = File(...),
    job_skills: str = Form(default=""),
):
    try:
        resume_text = extract_text(file.filename or "resume", await file.read())
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc

    skills_list = (
        [s for s in job_skills.split("||") if s.strip()]
        if job_skills
        else None
    )

    return match_resume(text, resume_text, skills_list)