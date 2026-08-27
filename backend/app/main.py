from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import close_database, database
from .routes import analysis, auth, resumes


@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.users.create_index("email", unique=True)
    await database.analyses.create_index([("user_id", 1), ("created_at", -1)])
    yield
    await close_database()


app = FastAPI(title="JobLens API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(auth.router)
app.include_router(resumes.router)
app.include_router(analysis.router)


@app.get("/health")
async def health():
    return {"status": "ok", "ml_available": False, "message": "ML model not configured"}
