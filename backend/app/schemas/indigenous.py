"""Schemas for indigenous language processing API."""
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class HandwritingRecognitionResponse(BaseModel):
    """Response for handwriting recognition."""

    original_image_url: str
    recognized_text: str
    romanized_text: str
    language: str
    confidence: float = Field(ge=0.0, le=1.0)
    alternative_readings: list[dict[str, Any]]
    character_boxes: list[dict[str, Any]]
    processed_at: datetime
    processing_time_ms: float


class PronunciationTrainingRequest(BaseModel):
    """Request for pronunciation training."""

    audio_url: str = Field(description="URL to audio file")
    transcript: str = Field(description="Text transcript")
    language: str = Field(description="Indigenous language code")
    speaker_id: str = Field(description="Unique speaker identifier")
    dialect: Optional[str] = Field(None, description="Dialect variant")


class PronunciationTrainingResponse(BaseModel):
    """Response for pronunciation training."""

    job_id: str
    audio_url: str
    language: str
    quality_score: float = Field(ge=0.0, le=1.0)
    phoneme_count: int
    status: str
    metadata: dict[str, Any]


class PronunciationAssessmentRequest(BaseModel):
    """Request for pronunciation assessment."""

    audio_url: str
    reference_text: str
    language: str


class PronunciationAssessmentResponse(BaseModel):
    """Response for pronunciation assessment."""

    overall_score: float = Field(ge=0.0, le=1.0)
    fluency: float = Field(ge=0.0, le=1.0)
    pronunciation: float = Field(ge=0.0, le=1.0)
    completeness: float = Field(ge=0.0, le=1.0)
    phoneme_scores: list[dict[str, Any]]
    suggestions: list[str]


class LanguageInfoResponse(BaseModel):
    """Response for language information."""

    code: str
    name: str
    has_romanization_rules: bool
    vowels: list[str]
    consonants: list[str]
    special_characters: list[str]
    tone_markers: list[str]
    syllable_patterns: list[str]
    cultural_notes: dict[str, str]


# ===== Language registry =====

class CustomLanguageCreateRequest(BaseModel):
    """Create a custom indigenous language profile."""

    code: str = Field(
        min_length=2, max_length=16, description="ISO code or internal code"
    )
    name: str = Field(min_length=2, max_length=128)
    region: str | None = Field(default=None)
    family: str | None = Field(default=None)
    script: str | None = Field(default=None)
    aliases: list[str] | None = Field(default=None)
    metadata: dict[str, Any] | None = Field(default=None)


class LanguageListItem(BaseModel):
    code: str
    name: str
    region: str | None = None
    family: str | None = None
    script: str | None = None
    source: str = Field(description="builtin|custom")
