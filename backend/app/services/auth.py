"""Authentication service layer."""
from datetime import datetime, timedelta
import httpx
import secrets

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.schemas.auth import AuthResponse, LoginRequest, SignupRequest
from app.utils.security import create_token, hash_password, verify_password
from app.core.config import settings
from app.models.email_verification import EmailVerification


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    async def signup(self, request: SignupRequest) -> AuthResponse:
        # Optional CAPTCHA verification (production)
        await self._maybe_verify_captcha(request.captcha_token)
        hashed = hash_password(request.password)
        try:
            role = UserRole(request.role) if request.role else UserRole.LEARNER
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role",
            ) from exc

        user = User(
            email=request.email,
            hashed_password=hashed,
            role=role,
            language_goal=request.language_goal,
            username=request.username,
            avatar_url=request.avatar_url,
        )
        self.db.add(user)
        try:
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            ) from exc
        self.db.refresh(user)
        return await self._issue_token(
            str(user.id),
            user.role.value,
            user.email,
            user.username,
            user.avatar_url,
        )

    async def login(self, request: LoginRequest) -> AuthResponse:
        # Optional CAPTCHA verification (production)
        await self._maybe_verify_captcha(request.captcha_token)
        user = (
            self.db.query(User)
            .filter(User.email == request.email)
            .one_or_none()
        )
        if not user or not verify_password(
            request.password, user.hashed_password
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )
        # Optional email verification enforcement
        if settings.EMAIL_VERIFICATION_REQUIRED:
            # If model has no email_verified attribute,
            # treat as unverified gracefully
            email_verified = getattr(user, "email_verified", None)
            if email_verified is False:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Email not verified",
                )
        return await self._issue_token(
            str(user.id),
            user.role.value,
            user.email,
            user.username,
            user.avatar_url,
        )

    async def oauth_login_or_signup(self, email: str) -> AuthResponse:
        """Create user if not exists and issue a token.

        For OAuth users, generate a strong random password and store its
        hash to satisfy the non-null constraint (not used for login).
        """
        user = (
            self.db.query(User)
            .filter(User.email == email)
            .one_or_none()
        )
        if not user:
            random_pw = secrets.token_urlsafe(32)
            user = User(
                email=email,
                hashed_password=hash_password(random_pw),
                role=UserRole.LEARNER,
            )
            self.db.add(user)
            try:
                self.db.commit()
            except IntegrityError as exc:
                self.db.rollback()
                # Race: user may be created concurrently; retry fetch
                user = (
                    self.db.query(User)
                    .filter(User.email == email)
                    .one_or_none()
                )
                if not user:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Failed to create OAuth user",
                    ) from exc
        self.db.refresh(user)
        return await self._issue_token(
            str(user.id),
            user.role.value,
            user.email,
            user.username,
            user.avatar_url,
        )

    async def _maybe_verify_captcha(self, token: str | None) -> None:
        """Verify captcha token if configured. No-op if not required."""
        if not settings.CAPTCHA_REQUIRED:
            # Captcha not required - skip verification regardless of token presence
            return
        
        # Captcha is required - check provider and token
        provider = (settings.CAPTCHA_PROVIDER or "").lower().strip()
        if provider not in {"turnstile", "recaptcha"}:
            # Misconfiguration: if required but no provider, block by default
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Captcha provider not configured on server",
            )
        if not token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing captcha token",
            )

        if provider == "turnstile":
            secret = settings.TURNSTILE_SECRET_KEY
            if not secret:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Captcha secret not configured",
                )
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    "https://challenges.cloudflare.com/turnstile/v0/"
                    "siteverify",
                    data={"secret": secret, "response": token},
                )
            data = resp.json()
            if not data.get("success"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Captcha verification failed",
                )
            return

        # Google reCAPTCHA
        secret = settings.RECAPTCHA_SECRET_KEY
        if not secret:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Captcha secret not configured",
            )
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                "https://www.google.com/recaptcha/api/siteverify",
                data={"secret": secret, "response": token},
            )
        data = resp.json()
        if not data.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Captcha verification failed",
            )

    async def _issue_token(
        self,
        subject: str,
        role: str,
        email: str,
        username: str | None = None,
        avatar_url: str | None = None,
    ) -> AuthResponse:
        expires_at = datetime.utcnow() + timedelta(minutes=30)
        token = create_token(
            {"sub": subject, "role": role, "email": email},
            expires_at,
        )
        return AuthResponse(
            access_token=token,
            expires_at=expires_at,
            user_id=subject,
            role=role,
            email=email,
            username=username,
            avatar_url=avatar_url,
        )

    # ===== Email verification helpers =====
    async def create_email_verification(self, email: str) -> EmailVerification:
        token = secrets.token_urlsafe(32)
        ev = EmailVerification(email=email, token=token)
        self.db.add(ev)
        self.db.commit()
        self.db.refresh(ev)
        return ev

    async def mark_email_verified(self, email: str) -> None:
        user = self.db.query(User).filter(User.email == email).one_or_none()
        if user is not None and hasattr(user, "email_verified"):
            setattr(user, "email_verified", True)
            self.db.add(user)
            self.db.commit()

    async def verify_email_token(self, token: str) -> str:
        ev = (
            self.db.query(EmailVerification)
            .filter(EmailVerification.token == token)
            .one_or_none()
        )
        if not ev:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token",
            )
        now = datetime.utcnow()
        if ev.is_used:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token already used",
            )
        if ev.expires_at and ev.expires_at < now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token expired",
            )
        ev.is_used = True
        ev.used_at = now
        self.db.add(ev)
        self.db.commit()
        await self.mark_email_verified(ev.email)
        return ev.email
