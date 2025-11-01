"""Recommendation schemas."""
from typing import Sequence
from pydantic import BaseModel, Field


class RecommendationRequest(BaseModel):
    user_id: str
    context_book_id: str | None = None
    emotion_state: str | None = None
    limit: int = Field(5, ge=1, le=20)


class RecommendedBook(BaseModel):
    book_id: str
    title: str
    rationale: str
    confidence: float


class RecommendationResponse(BaseModel):
    recommendations: Sequence[RecommendedBook]
