from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from authlib.integrations.starlette_client import OAuth

from ..config import settings
from ..db import database
from ..schemas import TokenResponse, UserResponse
from ..security import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])
oauth = OAuth()
if settings.google_client_id and settings.google_client_secret:
    oauth.register("google", client_id=settings.google_client_id, client_secret=settings.google_client_secret, server_metadata_url="https://accounts.google.com/.well-known/openid-configuration", client_kwargs={"scope": "openid email profile"})


def _redirect_uri_for_request(request: Request) -> str:
    configured = settings.google_redirect_uri.strip()
    if configured:
        parsed = urlparse(configured)
        if parsed.scheme and parsed.hostname and request.url.scheme == parsed.scheme and request.url.hostname == parsed.hostname and request.url.port == parsed.port:
            return configured
    return str(request.url_for("google_callback"))


@router.get("/google/login")
async def google_login(request: Request):
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(503, "Google OAuth is not configured")
    redirect_uri = _redirect_uri_for_request(request)
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback", response_class=HTMLResponse)
async def google_callback(request: Request):
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(503, "Google OAuth is not configured")
    token = await oauth.google.authorize_access_token(request)
    profile = token["userinfo"]
    user_id = str(profile["sub"])
    user = {"_id": user_id, "email": profile["email"], "name": profile.get("name", profile["email"]), "picture": profile.get("picture")}
    await database.users.update_one({"_id": user_id}, {"$set": user, "$setOnInsert": {"credits": 0}}, upsert=True)
    access_token = create_access_token(user_id)
    return HTMLResponse(f"<script>window.opener?.postMessage({{type:'JOBLENS_AUTH',token:{access_token!r}}}, '*');window.close();</script>Login complete. You can close this window.")


@router.get("/me", response_model=UserResponse)
async def me(request: Request):
    from ..dependencies import current_user
    return await current_user(await _credentials(request))


async def _credentials(request: Request):
    from fastapi.security import HTTPAuthorizationCredentials
    header = request.headers.get("authorization", "")
    if not header.lower().startswith("bearer "):
        return None
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=header[7:])
