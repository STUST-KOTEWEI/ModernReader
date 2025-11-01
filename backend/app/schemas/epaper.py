"""Schema definitions for e-paper formatting and publishing."""
from datetime import datetime
from typing import Sequence, Any

from pydantic import BaseModel, Field


class EPaperSegment(BaseModel):
    heading: str
    body: str
    highlights: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] | None = None


class EPaperFormatRequest(BaseModel):
    title: str
    text: str
    max_chars_per_card: int = Field(280, ge=80, le=800)


class EPaperFormatResponse(BaseModel):
    title: str
    cards: Sequence[EPaperSegment]


class EPaperPublishRequest(BaseModel):
    title: str
    device_group: str
    valid_until: datetime | None = None
    cards: Sequence[EPaperSegment]


class EPaperPublishResponse(BaseModel):
    job_id: str
    card_count: int
    status: str


class EPaperQueueResponse(BaseModel):
    job_id: str
    version: str
    cards: Sequence[EPaperSegment]
