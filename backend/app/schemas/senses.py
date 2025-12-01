"""Multisensory command schemas."""
from datetime import datetime
from pydantic import BaseModel


class SenseCommandRequest(BaseModel):
    session_id: str
    modality: str
    payload: dict[str, float | str | int]
    text_snippet: str | None = None # Added for tactile feedback request


class SenseCommandResponse(BaseModel):
    session_id: str
    modality: str
    accepted_at: datetime
    feedback_description: str | None = None # Added for tactile feedback response
