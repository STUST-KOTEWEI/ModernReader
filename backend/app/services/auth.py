"""Authentication service layer."""
from datetime import datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.schemas.auth import AuthResponse, LoginRequest, SignupRequest
from app.utils.security import create_token, hash_password, verify_password


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    async def signup(self, request: SignupRequest) -> AuthResponse:
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
            str(user.id), user.role.value, user.email
        )

    async def login(self, request: LoginRequest) -> AuthResponse:
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
        return await self._issue_token(
            str(user.id), user.role.value, user.email
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
            import secrets

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
        )

    async def _issue_token(
        self, subject: str, role: str, email: str
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
        )
