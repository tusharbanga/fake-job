from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ResumeResponse(BaseModel):
    id: str
    filename: str
    text_length: int
    uploaded_at: datetime


class MLResult(BaseModel):
    classification: Literal["positive", "negative"] | None = None
    score: int | None = Field(default=None, ge=0, le=100)
    reasons: list[str] = []
    available: bool = False


class GroqResult(BaseModel):
    classification: Literal["positive", "negative", "uncertain"]
    score: int = Field(ge=0, le=100)
    reasons: list[str]
    summary: str


class AnalysisResponse(BaseModel):
    id: str
    text: str
    ml: MLResult
    groq: GroqResult
    classification: Literal["positive", "negative", "uncertain"]
    score: int
    reasons: list[str]
    resume_match: dict[str, Any] | None = None
    created_at: datetime


class AnalysisRequest(BaseModel):
    text: str = Field(min_length=20, max_length=100000)
    resume_id: str | None = None
