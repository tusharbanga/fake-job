from fastapi import APIRouter, Depends, HTTPException
import logging
from pymongo import ReturnDocument

from ..db import database
from ..dependencies import current_user
from ..schemas import AnalysisRequest, AnalysisResponse, UserResponse
from ..services.aggregator import analyze
from ..services.groq_service import analyze_with_groq
from ..config import settings

router = APIRouter(prefix="/analysis", tags=["analysis"])
logger = logging.getLogger("joblens.analysis")


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_job(request: AnalysisRequest, user: UserResponse = Depends(current_user)):
    # Ensure user currently has credits before doing work
    user_doc = await database.users.find_one({"_id": user.id}, {"credits": 1})
    if not user_doc or user_doc.get("credits", 0) < 1:
        raise HTTPException(402, "No credits left. Recharge to continue.")

    # Validate resume ownership before performing analysis
    resume_text = None
    if request.resume_id:
        resume = await database.resumes.find_one({"_id": request.resume_id, "user_id": user.id})
        if not resume:
            raise HTTPException(404, "Resume not found")
        resume_text = resume["text"]

    # Perform analysis first, then charge atomically to avoid double-restores
    try:
        result = await analyze(request.text, resume_text, request.resume_id)
    except Exception as e:
        logger.exception("Analysis failed for user %s", user.id)
        raise

    # Atomically decrement one credit; if this fails someone consumed the credit concurrently
    charged = await database.users.find_one_and_update(
        {"_id": user.id, "credits": {"$gte": 1}},
        {"$inc": {"credits": -1}},
        return_document=ReturnDocument.AFTER,
    )
    if not charged:
        # No credits available at charge time — do not persist analysis
        logger.warning("Failed to charge user %s after successful analysis: no credits", user.id)
        raise HTTPException(402, "No credits left. Recharge to continue.")

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


@router.post("/dev-analyze", response_model=AnalysisResponse)
async def dev_analyze(request: AnalysisRequest):
    """Temporary dev-only endpoint to test analysis without authentication.
    Enabled only when running with default settings (no GROQ key will return fallback response).
    Remove this endpoint before deploying."""
    # Run analysis without auth; pass through resume_id if supplied
    result = await analyze(request.text, None, request.resume_id)
    # Persist result to DB for local debugging
    result["user_id"] = "dev"
    await database.analyses.insert_one(result)
    return AnalysisResponse(id=result["_id"], **{key: value for key, value in result.items() if key not in {"_id", "user_id"}})
