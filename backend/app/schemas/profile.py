"""User profile schemas."""
from pydantic import BaseModel, EmailStr


class UserProfileResponse(BaseModel):
    id: str
    email: EmailStr
    username: str | None = None
    avatar_url: str | None = None
    role: str
    language_goal: str | None = None
    created_at: str


class UpdateProfileRequest(BaseModel):
    username: str | None = None
    avatar_url: str | None = None
    language_goal: str | None = None
