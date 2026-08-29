from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: str | None = None
    credits: int = 0


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ResumeResponse(BaseModel):
    id: str
    filename: str
    text_length: int
    uploaded_at: datetime


class JobInfo(BaseModel):
    title: str = "Not listed"
    company: str = "Not listed"
    location: str = "Not listed"
    work_mode: str = "Not listed"
    employment_type: str = "Not listed"
    duration: str = "Not listed"
    experience: str = "Not listed"
    salary: str = "Not listed"
    skills: list[str] = Field(default_factory=list)


class GroqResult(BaseModel):
    classification: Literal["positive", "negative", "uncertain"]
    score: int = Field(ge=0, le=100)
    reasons: list[str]
    summary: str
    job: JobInfo = Field(default_factory=JobInfo)


class AnalysisResponse(BaseModel):
    id: str
    text: str
    groq: GroqResult
    classification: Literal["positive", "negative", "uncertain"]
    score: int
    reasons: list[str]
    resume_match: dict[str, Any] | None = None
    created_at: datetime


class AnalysisRequest(BaseModel):
    text: str = Field(min_length=20, max_length=100000)
    resume_id: str | None = None


class CreateOrderRequest(BaseModel):
    amount: int = Field(ge=10, le=10000, description="Amount in INR")


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
