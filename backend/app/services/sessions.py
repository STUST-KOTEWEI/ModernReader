"""Session event processing."""
import uuid
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.catalog import Book
from app.models.session import ReadingSession, SessionEvent
from app.models.user import User
from app.schemas.sessions import SessionEventRequest, SessionEventResponse


class SessionService:
    def __init__(self, db: Session):
        self.db = db

    async def process_event(self, request: SessionEventRequest) -> SessionEventResponse:
        session, actions = self._get_or_create_session(request)

        event = SessionEvent(
            session=session,
            event_type=request.event_type,
            emotion=request.emotion,
            payload=request.metadata,
        )
        self.db.add(event)
        self.db.commit()

        actions.append("event_logged")
        if request.emotion:
            actions.append("emotion_captured")

        return SessionEventResponse(
            session_id=str(session.id),
            processed_at=datetime.utcnow(),
            actions=actions,
        )

    def _get_or_create_session(self, request: SessionEventRequest) -> tuple[ReadingSession, list[str]]:
        actions: list[str] = []
        session_id = self._safe_uuid(request.session_id)
        user_id = self._safe_uuid(request.user_id)
        book_id = self._safe_uuid(request.book_id)

        if not user_id or not book_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user_id or book_id")

        session = self.db.get(ReadingSession, session_id) if session_id else None
        if not session:
            if session_id is None:
                session_id = uuid.uuid4()
            user = self.db.get(User, user_id)
            book = self.db.get(Book, book_id)
            if not user or not book:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User or book not found")
            session = ReadingSession(id=session_id, user_id=user.id, book_id=book.id)
            self.db.add(session)
            self.db.flush()
            actions.append("session_created")
        return session, actions

    @staticmethod
    def _safe_uuid(value: str | None) -> uuid.UUID | None:
        if not value:
            return None
        try:
            return uuid.UUID(value)
        except ValueError:
            return None
