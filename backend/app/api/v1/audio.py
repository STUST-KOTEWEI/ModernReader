"""STT and TTS endpoints."""
from fastapi import APIRouter, Depends, File, UploadFile

from app.schemas.audio import STTResponse, TTSRequest, TTSResponse
from app.services.audio import STTService, TTSService

router = APIRouter()


def get_stt_service() -> STTService:
    return STTService()


def get_tts_service() -> TTSService:
    return TTSService()


@router.post("/stt", response_model=STTResponse)
async def stt_endpoint(
    audio: UploadFile = File(...),
    service: STTService = Depends(get_stt_service),
) -> STTResponse:
    return await service.transcribe(audio)


@router.post("/tts", response_model=TTSResponse)
async def tts_endpoint(
    request: TTSRequest,
    service: TTSService = Depends(get_tts_service),
) -> TTSResponse:
    return await service.synthesize(request)
