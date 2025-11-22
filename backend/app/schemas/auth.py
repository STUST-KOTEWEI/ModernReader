"""Auth schema definitions."""
from datetime import datetime
from pydantic import BaseModel, EmailStr


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    role: str = "learner"
    language_goal: str | None = None
    username: str | None = None
    avatar_url: str | None = None
    captcha_token: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    captcha_token: str | None = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime
    user_id: str | None = None
    role: str | None = None
    email: EmailStr | None = None
    username: str | None = None
    avatar_url: str | None = None
