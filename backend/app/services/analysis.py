from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from ..db import database
from ..dependencies import current_user
from ..schemas import AnalysisRequest, AnalysisResponse, UserResponse
from ..services.aggregator import analyze
from ..services.matching import match_resume
from ..services.resume_service import extract_text

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.post("/demo")
async def analyze_demo(request: AnalysisRequest):
    try:
        result = await analyze(request.text)
    except Exception as exc:
        raise HTTPException(502, f"AI provider error: {exc}") from exc
    return {"classification": result["classification"], "score": result["score"], "groq": result["groq"], "reasons": result["reasons"]}


@router.post("/demo-match")
async def analyze_demo_match(text: str = Form(...), file: UploadFile = File(...), job_skills: str = Form(default="")):
    try:
        resume_text = extract_text(file.filename or "resume", await file.read())
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    skills_list = [s for s in job_skills.split("||") if s.strip()] if job_skills else None
    return match_resume(text, resume_text, skills_list)


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_job(request: AnalysisRequest, user: UserResponse = Depends(current_user)):
    resume_text = None
    if request.resume_id:
        resume = await database.resumes.find_one({"_id": request.resume_id, "user_id": user.id})
        if not resume:
            raise HTTPException(404, "Resume not found")
        resume_text = resume["text"]
    result = await analyze(request.text, resume_text)
    result["user_id"] = user.id
    await database.analyses.insert_one(result)
    return AnalysisResponse(id=result["_id"], **{key: value for key, value in result.items() if key not in {"_id", "user_id"}})


@router.get("/history", response_model=list[AnalysisResponse])
async def history(user: UserResponse = Depends(current_user)):
    cursor = database.analyses.find({"user_id": user.id}).sort("created_at", -1).limit(50)
    results = []
    async for item in cursor:
        results.append(AnalysisResponse(id=item["_id"], **{key: value for key, value in item.items() if key not in {"_id", "_user_id", "user_id"}}))
    return results
