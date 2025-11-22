"""Authentication endpoints."""
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse, RedirectResponse, HTMLResponse
from sqlalchemy.orm import Session
from urllib.parse import urlencode
import json
import urllib.request

from app.schemas.auth import AuthResponse, LoginRequest, SignupRequest
from app.services.auth import AuthService
from app.db.database import get_db
from app.core.config import settings

router = APIRouter()


def get_auth_service(db: Annotated[Session, Depends(get_db)]) -> AuthService:
    return AuthService(db)


@router.post("/signup", response_model=AuthResponse)
async def signup(
    request: SignupRequest,
    service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    return await service.signup(request)


@router.post("/login", response_model=AuthResponse)
async def login(
    request: LoginRequest,
    service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    return await service.login(request)


# ===== OAuth (stubs) =====

@router.get("/oauth/google/start", response_model=None)
async def oauth_google_start():
    """Kick off Google OAuth (minimal implementation without extra deps)."""
    client_id = settings.GOOGLE_CLIENT_ID
    redirect_uri = settings.OAUTH_REDIRECT_URL
    if not client_id or not redirect_uri:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=(
                "Google OAuth 未設定。請在 .env 設定: "
                "GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OAUTH_REDIRECT_URL"
            ),
        )
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "online",
        "include_granted_scopes": "true",
        "prompt": "consent",
    }
    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    )
    return RedirectResponse(auth_url)


@router.get("/oauth/google/callback", response_model=None)
async def oauth_google_callback(
    code: str | None = None,
    service: AuthService = Depends(get_auth_service),
):
    client_id = settings.GOOGLE_CLIENT_ID
    client_secret = settings.GOOGLE_CLIENT_SECRET
    redirect_uri = settings.OAUTH_REDIRECT_URL
    if not client_id or not client_secret or not redirect_uri:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=(
                "Google OAuth 未設定。請在 .env 設定: "
                "GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OAUTH_REDIRECT_URL"
            ),
        )
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing authorization code",
        )

    # Exchange code for tokens
    token_data = urlencode(
        {
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        }
    ).encode()
    req = urllib.request.Request(
        "https://oauth2.googleapis.com/token",
        data=token_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:  # nosec B310
            token_resp = json.loads(resp.read().decode("utf-8"))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Token exchange failed: {exc}",
        ) from exc

    access_token = token_resp.get("access_token")
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Token exchange failed: no access_token",
        )

    # Get user info
    ureq = urllib.request.Request(
        "https://openidconnect.googleapis.com/v1/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    try:
        with urllib.request.urlopen(ureq, timeout=10) as resp:  # nosec B310
            userinfo = json.loads(resp.read().decode("utf-8"))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Userinfo fetch failed: {exc}",
        ) from exc

    email = userinfo.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Userinfo missing email",
        )

    auth = await service.oauth_login_or_signup(email=email)

    # Redirect back to frontend with token; allow override via env
    frontend_url = settings.FRONTEND_REDIRECT_URL or "/login"
    # Use a simple HTML page that stores token then redirects, if relative path
    if frontend_url.startswith("/"):
        html = f"""
        <html><body>
        <script>
          try {{
            localStorage.setItem('mr_jwt', {json.dumps(auth.access_token)!r});
            localStorage.setItem('mr_email', {json.dumps(email)!r});
          }} catch (e) {{}}
          const t = encodeURIComponent({json.dumps(auth.access_token)!r});
          const e = encodeURIComponent({json.dumps(email)!r});
          window.location.href = "{frontend_url}?token=" + t + "&email=" + e;
        </script>
        </body></html>
        """
        return HTMLResponse(content=html)

    # Absolute URL - redirect with query params
    redirect_to = (
        f"{frontend_url}?token={auth.access_token}&email={email}"
    )
    return RedirectResponse(redirect_to)


@router.get("/oauth/sheerid/start")
async def oauth_sheerid_start() -> JSONResponse:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail=(
            "SheerID 驗證未設定。請設定環境變數: "
            "SHEERID_CLIENT_ID, SHEERID_CLIENT_SECRET, OAUTH_REDIRECT_URL"
        ),
    )


@router.get("/oauth/sheerid/callback")
async def oauth_sheerid_callback():
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="SheerID callback 未實作，請先完成憑證設定。",
    )
