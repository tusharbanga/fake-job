from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from .config import settings
from .db import close_database, database
from .routes import analysis, auth, payments, resumes


@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.users.create_index("email", unique=True)
    await database.analyses.create_index([("user_id", 1), ("created_at", -1)])
    # Older records may not have Razorpay fields (or may contain null). Apply
    # uniqueness only after Razorpay has supplied a real string identifier.
    await database.payments.create_index(
        "razorpay_order_id", unique=True,
        partialFilterExpression={"razorpay_order_id": {"$type": "string"}},
    )
    await database.payments.create_index(
        "razorpay_payment_id", unique=True,
        partialFilterExpression={"razorpay_payment_id": {"$type": "string"}},
    )
    yield
    await close_database()


app = FastAPI(title="JobLens API", version="1.0.0", lifespan=lifespan)
app.add_middleware(SessionMiddleware, secret_key=settings.jwt_secret, same_site="lax", https_only=False)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(auth.router)
app.include_router(resumes.router)
app.include_router(analysis.router)
app.include_router(payments.router)


@app.get("/health")
async def health():
    return {"status": "ok", "message": "AI analysis service ready"}
