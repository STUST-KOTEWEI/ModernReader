"""Session schemas."""
from datetime import datetime
from pydantic import BaseModel


class SessionEventRequest(BaseModel):
    session_id: str
    user_id: str
    book_id: str
    event_type: str
    emotion: str | None = None
    metadata: dict[str, str | int | float] | None = None


class SessionEventResponse(BaseModel):
    session_id: str
    processed_at: datetime
    actions: list[str]
