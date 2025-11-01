"""E-paper endpoints."""
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.epaper import (
    EPaperFormatRequest,
    EPaperFormatResponse,
    EPaperPublishRequest,
    EPaperPublishResponse,
    EPaperQueueResponse,
)
from app.services.epaper import EPaperService

router = APIRouter()


def get_service(db: Session = Depends(get_db)) -> EPaperService:
    return EPaperService(db)


@router.post("/format", response_model=EPaperFormatResponse)
async def format_text(
    request: EPaperFormatRequest,
    service: EPaperService = Depends(get_service),
) -> EPaperFormatResponse:
    return await service.format_text(request)


@router.post("/publish", response_model=EPaperPublishResponse)
async def publish(
    request: EPaperPublishRequest,
    service: EPaperService = Depends(get_service),
) -> EPaperPublishResponse:
    return await service.publish(request)


@router.get("/queue", response_model=list[EPaperQueueResponse])
async def queue(
    device_id: str = Query(..., description="Identifier for the e-paper device"),
    since: datetime | None = Query(None, description="Only return jobs newer than this timestamp"),
    service: EPaperService = Depends(get_service),
) -> list[EPaperQueueResponse]:
    return await service.queue(device_id=device_id, since=since)
