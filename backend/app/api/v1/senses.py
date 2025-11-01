"""Multisensory device command endpoints."""
from fastapi import APIRouter, Depends

from app.schemas.senses import SenseCommandRequest, SenseCommandResponse
from app.services.senses import SenseService

router = APIRouter()


def get_sense_service() -> SenseService:
    return SenseService()


@router.post("/command", response_model=SenseCommandResponse)
async def send_command(
    request: SenseCommandRequest,
    service: SenseService = Depends(get_sense_service),
) -> SenseCommandResponse:
    return await service.dispatch(request)
