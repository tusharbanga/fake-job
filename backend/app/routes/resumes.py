from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from ..config import settings
from ..db import database
from ..dependencies import current_user
from ..schemas import ResumeResponse, UserResponse
from ..services.resume_service import extract_text

router = APIRouter(prefix="/resumes", tags=["resumes"])


@router.post("", response_model=ResumeResponse)
async def upload_resume(file: UploadFile = File(...), user: UserResponse = Depends(current_user)):
    content = await file.read()
    if len(content) > settings.max_resume_bytes:
        raise HTTPException(413, "Resume is too large")
    try:
        text = extract_text(file.filename or "resume.txt", content)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    resume_id = str(uuid4())
    uploaded_at = datetime.now(timezone.utc)
    await database.resumes.insert_one({"_id": resume_id, "user_id": user.id, "filename": file.filename, "text": text, "uploaded_at": uploaded_at})
    return ResumeResponse(id=resume_id, filename=file.filename or "resume", text_length=len(text), uploaded_at=uploaded_at)
