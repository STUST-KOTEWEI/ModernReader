"""User profile and settings endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from jose import jwt, JWTError  # type: ignore
from typing import Optional
import uuid

from app.db.database import get_db
from app.core.config import settings
from app.models.user import User
from app.models.user_settings import UserSettings
from app.schemas.settings import (
    UserSettingsResponse,
    UpdateUserSettingsRequest,
)
from app.schemas.profile import UserProfileResponse, UpdateProfileRequest


router = APIRouter()


def get_current_user(
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(default=None),
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing token",
        )
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        ) from exc
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    # user.id 是 UUID
    try:
        user_uuid = uuid.UUID(str(sub))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid subject in token",
        )
    user = db.query(User).filter(User.id == user_uuid).one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user


@router.get("/me/settings", response_model=UserSettingsResponse)
async def get_my_settings(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    settings_row = (
        db.query(UserSettings)
        .filter(UserSettings.user_id == user.id)
        .one_or_none()
    )
    if not settings_row:
        return UserSettingsResponse()
    return UserSettingsResponse(
        default_language=settings_row.default_language,
        tts_voice=settings_row.tts_voice,
        romanization_scheme=settings_row.romanization_scheme,
        autoplay_tts=bool(settings_row.autoplay_tts),
        learning_opt_in=bool(settings_row.learning_opt_in),
        preferences=settings_row.preferences,
    )


@router.put("/me/settings", response_model=UserSettingsResponse)
async def update_my_settings(
    request: UpdateUserSettingsRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    row = (
        db.query(UserSettings)
        .filter(UserSettings.user_id == user.id)
        .one_or_none()
    )
    if not row:
        row = UserSettings(user_id=user.id)
        db.add(row)

    # Apply partial updates
    if request.default_language is not None:
        row.default_language = request.default_language
    if request.tts_voice is not None:
        row.tts_voice = request.tts_voice
    if request.romanization_scheme is not None:
        row.romanization_scheme = request.romanization_scheme
    if request.autoplay_tts is not None:
        row.autoplay_tts = bool(request.autoplay_tts)
    if request.learning_opt_in is not None:
        row.learning_opt_in = bool(request.learning_opt_in)
    if request.preferences is not None:
        row.preferences = request.preferences

    db.commit()
    return UserSettingsResponse(
        default_language=row.default_language,
        tts_voice=row.tts_voice,
        romanization_scheme=row.romanization_scheme,
        autoplay_tts=bool(row.autoplay_tts),
        learning_opt_in=bool(row.learning_opt_in),
        preferences=row.preferences,
    )


@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(
    user: User = Depends(get_current_user),
):
    """Get current user profile."""
    return UserProfileResponse(
        id=str(user.id),
        email=user.email,
        username=user.username,
        avatar_url=user.avatar_url,
        role=user.role.value,
        language_goal=user.language_goal,
        created_at=user.created_at.isoformat(),
    )


@router.put("/me", response_model=UserProfileResponse)
async def update_my_profile(
    request: UpdateProfileRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Update current user profile."""
    if request.username is not None:
        # Check username uniqueness
        existing = (
            db.query(User)
            .filter(User.username == request.username, User.id != user.id)
            .one_or_none()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken",
            )
        user.username = request.username
    if request.avatar_url is not None:
        user.avatar_url = request.avatar_url
    if request.language_goal is not None:
        user.language_goal = request.language_goal

    db.commit()
    db.refresh(user)
    return UserProfileResponse(
        id=str(user.id),
        email=user.email,
        username=user.username,
        avatar_url=user.avatar_url,
        role=user.role.value,
        language_goal=user.language_goal,
        created_at=user.created_at.isoformat(),
    )
