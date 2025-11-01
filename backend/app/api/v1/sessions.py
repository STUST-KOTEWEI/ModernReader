"""Reading session endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.sessions import SessionEventRequest, SessionEventResponse
from app.services.sessions import SessionService

router = APIRouter()


def get_session_service(db: Session = Depends(get_db)) -> SessionService:
    return SessionService(db)


@router.post("/events", response_model=SessionEventResponse)
async def session_event(
    request: SessionEventRequest,
    service: SessionService = Depends(get_session_service),
) -> SessionEventResponse:
    return await service.process_event(request)
