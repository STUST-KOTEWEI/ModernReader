"""Multisensory command schemas."""
from datetime import datetime
from pydantic import BaseModel


class SenseCommandRequest(BaseModel):
    session_id: str
    modality: str
    payload: dict[str, float | str | int]


class SenseCommandResponse(BaseModel):
    session_id: str
    modality: str
    accepted_at: datetime
