"""Speech-to-text utilities for voice-enabled features."""
from __future__ import annotations

import io
import logging
from typing import Optional

from openai import AsyncOpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)


class SpeechToTextService:
    """Wrapper around OpenAI-compatible transcription APIs."""

    def __init__(self) -> None:
        self.client: Optional[AsyncOpenAI] = None
        self.model: str | None = None
        self._initialize_client()

    def _initialize_client(self) -> None:
        """Set up AsyncOpenAI client against configured provider."""
        if settings.OPENAI_API_KEY:
            self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            self.model = "gpt-4o-mini-transcribe"
            logger.info("Speech service configured with OpenAI")
            return

        if settings.OSS_API_BASE:
            api_key = settings.OSS_API_KEY or "oss-no-key"
            self.client = AsyncOpenAI(
                api_key=api_key,
                base_url=settings.OSS_API_BASE,
            )
            self.model = (
                settings.OSS_TRANSCRIBE_MODEL
                or settings.OSS_TEXT_MODEL
                or "whisper-1"
            )
            logger.info("Speech service configured with GPT-OSS provider")
            return

        logger.warning("Speech service not configured; audio features disabled")

    async def transcribe(
        self,
        audio_bytes: bytes,
        mime_type: str | None = None,
        prompt: str | None = None,
    ) -> str:
        """Transcribe audio bytes using available provider."""
        if not self.client or not self.model:
            raise RuntimeError("Speech transcription provider not configured")

        # AsyncOpenAI requires a file-like object with a name attribute
        extension = (mime_type or "audio/wav").split("/")[-1] or "wav"
        file_name = f"audio.{extension}"
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = file_name

        try:
            response = await self.client.audio.transcriptions.create(
                model=self.model,
                file=(file_name, audio_file, mime_type or "audio/wav"),
                response_format="text",
                temperature=0,
                prompt=prompt,
            )
        except Exception as exc:  # pragma: no cover - surface error upstream
            logger.error("Speech transcription failed: %s", exc)
            raise

        if isinstance(response, str):
            return response.strip()

        text = getattr(response, "text", None)
        if not text:
            raise RuntimeError("Speech transcription returned empty result")
        return text.strip()


_speech_service: SpeechToTextService | None = None


def get_speech_service() -> SpeechToTextService:
    """Return singleton speech service."""
    global _speech_service
    if _speech_service is None:
        _speech_service = SpeechToTextService()
    return _speech_service
