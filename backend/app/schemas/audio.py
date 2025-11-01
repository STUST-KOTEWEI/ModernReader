"""Schemas for STT and TTS endpoints."""
from datetime import datetime

from pydantic import BaseModel


class STTResponse(BaseModel):
    job_id: str
    transcript: str
    confidence: float
    processed_at: datetime


class TTSRequest(BaseModel):
    text: str
    voice: str | None = None
    style: str | None = None


class TTSResponse(BaseModel):
    job_id: str
    audio_url: str
    estimated_duration: float
