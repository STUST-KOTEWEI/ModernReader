"""Mock STT/TTS services."""
from datetime import datetime
import uuid

from fastapi import UploadFile

from app.schemas.audio import STTResponse, TTSRequest, TTSResponse


class STTService:
    async def transcribe(self, file: UploadFile) -> STTResponse:
        content = await file.read()
        words = len(content.split()) if content else 0
        transcript = "(Prototype transcript) 待接 Whisper 真實輸出。"
        return STTResponse(
            job_id=str(uuid.uuid4()),
            transcript=transcript,
            confidence=0.4 + min(0.3, words / 5000),
            processed_at=datetime.utcnow(),
        )


class TTSService:
    async def synthesize(self, request: TTSRequest) -> TTSResponse:
        job_id = str(uuid.uuid4())
        filename = f"mock-{job_id}.wav"
        audio_url = f"/assets/audio/{filename}"
        return TTSResponse(job_id=job_id, audio_url=audio_url, estimated_duration=len(request.text.split()) * 0.5)
