"""Pydantic schemas for user settings."""
from typing import Optional, Any, Dict
from pydantic import BaseModel, Field


class UserSettingsResponse(BaseModel):
    default_language: Optional[str] = Field(default=None)
    tts_voice: Optional[str] = Field(default=None)
    romanization_scheme: Optional[str] = Field(default=None)
    autoplay_tts: bool = True
    learning_opt_in: bool = True
    preferences: Optional[Dict[str, Any]] = None


class UpdateUserSettingsRequest(BaseModel):
    default_language: Optional[str] = None
    tts_voice: Optional[str] = None
    romanization_scheme: Optional[str] = None
    autoplay_tts: Optional[bool] = None
    learning_opt_in: Optional[bool] = None
    preferences: Optional[Dict[str, Any]] = None
