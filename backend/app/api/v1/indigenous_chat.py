"""API endpoints for indigenous language LLM chatbot."""
from __future__ import annotations

import base64
import binascii
import logging
from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.services.ai_engine import MultimodalInput, get_ai_engine
from app.services.global_indigenous_languages import (
    ChatbotResponse as ServiceChatbotResponse,
    GlobalIndigenousLanguageEngine,
    LLMFineTuningDataset,
)
from app.services.speech import get_speech_service
from app.core.llm_config import LLMProvider

logger = logging.getLogger(__name__)


router = APIRouter(prefix="/indigenous-chat", tags=["Indigenous Chat"])

# Initialize global engine
engine = GlobalIndigenousLanguageEngine(use_mock=True)


def _decode_base64_payload(data: str) -> bytes:
    payload = data
    if "," in payload:
        payload = payload.split(",", 1)[1]
    try:
        return base64.b64decode(payload, validate=True)
    except binascii.Error as exc:  # pragma: no cover - validation
        raise HTTPException(
            status_code=400, detail=f"Invalid base64 payload: {exc}"
        ) from exc


def _parse_provider(value: str) -> LLMProvider:
    try:
        return LLMProvider(value)
    except ValueError as exc:
        raise HTTPException(
            status_code=400, detail=f"Unsupported provider '{value}'"
        ) from exc


# ========== Request/Response Models ==========


class ChatMessage(BaseModel):
    """Chat message from user."""

    message: str = Field(..., min_length=1, max_length=2000)
    language_code: str = Field(..., min_length=2, max_length=10)
    session_id: Optional[str] = None
    include_translation: bool = True
    include_cultural_notes: bool = True
    include_pronunciation: bool = True
    image_base64: Optional[str] = Field(
        None, description="Base64 圖片資料（data URI 可）"
    )
    image_mime_type: Optional[str] = Field(
        None, description="圖片 MIME 類型，如 image/png"
    )
    audio_base64: Optional[str] = Field(
        None, description="Base64 語音資料"
    )
    audio_mime_type: Optional[str] = Field(
        None, description="語音 MIME 類型，如 audio/webm"
    )


class ChatResponse(BaseModel):
    """Response from chatbot."""

    message: str
    language: str
    language_name: str
    confidence: float
    cultural_context: Optional[str]
    translation: Optional[str]
    pronunciation_guide: Optional[str]
    related_phrases: list[str]
    source: str
    session_id: str
    timestamp: str
    media_context: Optional[dict[str, Any]] = None


class FineTuningJobRequest(BaseModel):
    """Request to start LLM fine-tuning job."""

    language_code: str = Field(..., min_length=2, max_length=10)
    base_model: str = Field(default="gpt-4o-mini")
    training_epochs: int = Field(default=3, ge=1, le=10)
    learning_rate: float = Field(default=0.0001, gt=0, lt=0.01)
    batch_size: int = Field(default=16, ge=1, le=128)
    use_lora: bool = True  # Use LoRA for efficient fine-tuning


class FineTuningJobResponse(BaseModel):
    """Fine-tuning job status."""

    job_id: str
    status: str  # pending, training, completed, failed
    language_code: str
    model_id: Optional[str]
    training_samples: int
    validation_loss: Optional[float]
    training_time_minutes: Optional[int]
    cost_usd: Optional[float]
    created_at: str
    completed_at: Optional[str]
    capabilities: list[str]


class LanguageListResponse(BaseModel):
    """List of supported languages."""

    total: int
    languages: list[dict]
    regions: dict[str, int]
    endangerment_stats: dict[str, int]


class TrainingDataUpload(BaseModel):
    """Upload training data for a language."""

    language_code: str
    data_type: str  # audio, text, handwriting
    content: str
    metadata: dict


# ========== API Endpoints ==========


@router.post("/chat", response_model=ChatResponse)
async def chat_with_bot(request: ChatMessage) -> ChatResponse:
    """
    Chat with indigenous language AI bot.
    
    Features:
    - Natural conversation in indigenous language
    - Cultural context and pronunciation
    - Translation to major languages
    - Session management
    
    Example:
        POST /indigenous-chat/chat
        {
            "message": "Hello, how are you?",
            "language_code": "mi",
            "include_translation": true,
            "include_cultural_notes": true
        }
    """
    try:
        # Validate language support
        if request.language_code not in engine.supported_languages:
            available = list(engine.supported_languages.keys())[:10]
            raise HTTPException(
                status_code=400,
                detail=f"Language '{request.language_code}' not supported. "
                f"Available: {', '.join(available)}...",
            )

        # Get language info
        lang_info = engine.supported_languages[request.language_code]

        media_context: dict[str, Any] = {}
        priority_override: list[LLMProvider] | None = None
        ai_engine = None

        if request.provider:
            ai_engine = get_ai_engine()
            preferred = _parse_provider(request.provider)
            priority_override = [preferred]
            for provider in ai_engine.config.provider_priority:
                if provider not in priority_override:
                    priority_override.append(provider)
            media_context["preferred_provider"] = request.provider

        # Decode and summarize image if provided
        if request.image_base64:
            image_bytes = _decode_base64_payload(request.image_base64)
            media_context["image_mime_type"] = (
                request.image_mime_type or "image/jpeg"
            )
            try:
                if ai_engine is None:
                    ai_engine = get_ai_engine()
                image_result = await ai_engine.understand(
                    MultimodalInput(
                        text=(
                            "請以 2-3 句中文描述這張圖片，強調文化、人物或環境線索。"
                        ),
                        image=image_bytes,
                        image_mime_type=request.image_mime_type,
                        context={
                            "source": "indigenous_chat_image",
                            "language_code": request.language_code,
                        },
                    ),
                    system_prompt=(
                        "You assist indigenous language learners by providing "
                        "concise cultural observations from images."
                    ),
                    provider_priority=priority_override,
                )
                media_context["image_summary"] = image_result.content
            except Exception as err:
                logger.warning("Image understanding failed: %s", err)

        # Decode and transcribe audio
        if request.audio_base64:
            audio_bytes = _decode_base64_payload(request.audio_base64)
            try:
                speech_service = get_speech_service()
                audio_text = await speech_service.transcribe(
                    audio_bytes,
                    mime_type=request.audio_mime_type,
                    prompt="Transcribe indigenous language conversation."
                )
                media_context["audio_transcript"] = audio_text
                media_context["audio_mime_type"] = (
                    request.audio_mime_type or "audio/wav"
                )
            except RuntimeError as err:
                logger.warning("Audio transcription unavailable: %s", err)
            except Exception as err:  # pragma: no cover - provider errors
                logger.error("Audio transcription failed: %s", err)

        # Combine message with media context for the LLM
        combined_message = request.message.strip() if request.message else ""
        if media_context.get("audio_transcript"):
            transcript = media_context["audio_transcript"]
            combined_message = (
                f"{combined_message}\n\n[Voice transcript]\n{transcript}"
                if combined_message
                else transcript
            )
        if media_context.get("image_summary"):
            summary = media_context["image_summary"]
            combined_message = (
                f"{combined_message}\n\n[Image description]\n{summary}"
                if combined_message
                else summary
            )

        if not combined_message:
            raise HTTPException(
                status_code=400, detail="Message content cannot be empty"
            )

        # Generate bot response
        response = await engine.chat(
            message=combined_message,
            language_code=request.language_code,
            context=None,  # TODO: Load from session
            include_translation=request.include_translation,
            include_cultural_notes=request.include_cultural_notes,
            media_context=media_context or None,
        )

        # Generate or use provided session ID
        session_id = request.session_id or f"sess-{int(datetime.now().timestamp())}"

        return ChatResponse(
            message=response.message,
            language=response.language,
            language_name=lang_info.name,
            confidence=response.confidence,
            cultural_context=response.cultural_context,
            translation=response.translation,
            pronunciation_guide=response.pronunciation_guide if request.include_pronunciation else None,
            related_phrases=response.related_phrases,
            source=response.source,
            session_id=session_id,
            timestamp=datetime.now().isoformat(),
            media_context=response.media_context,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/fine-tune/start", response_model=FineTuningJobResponse)
async def start_fine_tuning(request: FineTuningJobRequest) -> FineTuningJobResponse:
    """
    Start LLM fine-tuning job for an indigenous language.
    
    This endpoint:
    1. Collects all user-contributed data (audio, text, handwriting)
    2. Prepares dataset in HuggingFace/OpenAI format
    3. Starts fine-tuning job (LoRA/QLoRA)
    4. Returns job ID for monitoring
    
    Example:
        POST /indigenous-chat/fine-tune/start
        {
            "language_code": "mi",
            "base_model": "gpt-4o-mini",
            "use_lora": true
        }
    """
    try:
        # Validate language
        if request.language_code not in engine.supported_languages:
            raise HTTPException(
                status_code=400,
                detail=f"Language '{request.language_code}' not supported",
            )

        # Collect training data from all sources
        # TODO: Query database for actual user contributions
        dataset = await engine.collect_training_data(
            language_code=request.language_code,
            audio_samples=[],  # From pronunciation training
            text_samples=[],  # From user submissions
            handwriting_samples=[],  # From HTR system
        )

        if len(dataset.training_samples) < 100:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient training data. Need at least 100 samples, "
                f"got {len(dataset.training_samples)}",
            )

        # Start fine-tuning job
        job_result = await engine.fine_tune_llm(
            dataset=dataset, base_model=request.base_model
        )

        return FineTuningJobResponse(
            job_id=job_result["job_id"],
            status=job_result["status"],
            language_code=request.language_code,
            model_id=job_result.get("model_id"),
            training_samples=job_result["training_samples"],
            validation_loss=job_result.get("validation_loss"),
            training_time_minutes=job_result.get("training_time_minutes"),
            cost_usd=job_result.get("cost_usd"),
            created_at=datetime.now().isoformat(),
            completed_at=None,
            capabilities=job_result.get("capabilities", []),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/fine-tune/status/{job_id}", response_model=FineTuningJobResponse)
async def get_fine_tuning_status(job_id: str) -> FineTuningJobResponse:
    """
    Get status of fine-tuning job.
    
    Example:
        GET /indigenous-chat/fine-tune/status/ftjob-mi-1234567890
    """
    # TODO: Query actual job status from database/API
    return FineTuningJobResponse(
        job_id=job_id,
        status="training",
        language_code="mi",
        model_id=None,
        training_samples=500,
        validation_loss=0.15,
        training_time_minutes=35,
        cost_usd=10.50,
        created_at="2025-11-01T10:00:00",
        completed_at=None,
        capabilities=["translation", "conversation"],
    )


@router.get("/languages", response_model=LanguageListResponse)
async def list_all_languages() -> LanguageListResponse:
    """
    Get list of all supported indigenous languages.
    
    Returns 100+ languages with metadata:
    - Region and country
    - Number of speakers
    - Endangerment status
    - Script type
    - Language family
    
    Example:
        GET /indigenous-chat/languages
    """
    stats = engine.get_language_statistics()

    languages = [
        {
            "code": code,
            "name": lang.name,
            "native_name": lang.native_name,
            "region": lang.region.value,
            "country": lang.country,
            "speakers": lang.num_speakers,
            "endangerment": lang.endangerment_status,
            "script": lang.script_type,
            "family": lang.language_family,
            "has_written_form": lang.has_written_form,
        }
        for code, lang in engine.supported_languages.items()
    ]

    # Sort by number of speakers (descending)
    languages.sort(key=lambda x: x["speakers"], reverse=True)

    return LanguageListResponse(
        total=stats["total_languages"],
        languages=languages,
        regions={
            region: data["count"] for region, data in stats["by_region"].items()
        },
        endangerment_stats=stats["by_endangerment"],
    )


@router.get("/languages/{language_code}")
async def get_language_details(language_code: str) -> dict:
    """
    Get detailed information about a specific language.
    
    Example:
        GET /indigenous-chat/languages/mi
    """
    if language_code not in engine.supported_languages:
        raise HTTPException(
            status_code=404, detail=f"Language '{language_code}' not found"
        )

    lang = engine.supported_languages[language_code]

    return {
        "code": language_code,
        "name": lang.name,
        "native_name": lang.native_name,
        "region": lang.region.value,
        "country": lang.country,
        "speakers": lang.num_speakers,
        "endangerment_status": lang.endangerment_status,
        "script_type": lang.script_type,
        "has_written_form": lang.has_written_form,
        "language_family": lang.language_family,
        "related_languages": lang.related_languages,
        "cultural_significance": lang.cultural_significance,
        "chat_available": True,  # Chatbot available
        "fine_tuning_available": True,  # Can be fine-tuned
    }


@router.post("/training-data/contribute")
async def contribute_training_data(
    language_code: str = Form(...),
    data_type: str = Form(...),
    file: UploadFile = File(...),
) -> dict:
    """
    Contribute training data for LLM fine-tuning.
    
    Users can upload:
    - Audio recordings (pronunciation)
    - Text translations
    - Handwritten samples
    
    This data will be used for future LLM fine-tuning.
    
    Example:
        POST /indigenous-chat/training-data/contribute
        Form data:
        - language_code: mi
        - data_type: audio
        - file: recording.wav
    """
    if language_code not in engine.supported_languages:
        raise HTTPException(
            status_code=400, detail=f"Language '{language_code}' not supported"
        )

    if data_type not in ["audio", "text", "handwriting"]:
        raise HTTPException(
            status_code=400,
            detail="data_type must be 'audio', 'text', or 'handwriting'",
        )

    # TODO: Save file to storage and database
    file_size = 0
    content = await file.read()
    file_size = len(content)

    return {
        "message": "Training data contributed successfully",
        "language": language_code,
        "type": data_type,
        "filename": file.filename,
        "size_bytes": file_size,
        "contribution_id": f"contrib-{int(datetime.now().timestamp())}",
        "status": "pending_review",
    }


@router.get("/statistics")
async def get_global_statistics() -> dict:
    """
    Get global statistics about indigenous language support.
    
    Example:
        GET /indigenous-chat/statistics
    """
    stats = engine.get_language_statistics()

    # Add more derived stats
    endangered_count = sum(
        1
        for lang in engine.supported_languages.values()
        if lang.endangerment_status in ["endangered", "critically endangered"]
    )

    return {
        **stats,
        "endangered_languages_count": endangered_count,
        "largest_language": max(
            engine.supported_languages.items(),
            key=lambda x: x[1].num_speakers,
        )[1].name,
        "most_endangered_region": max(
            stats["by_region"].items(),
            key=lambda x: len(
                [
                    l
                    for l in engine.get_languages_by_region(
                        getattr(
                            __import__(
                                "app.services.global_indigenous_languages"
                            ).services.global_indigenous_languages,
                            "LanguageRegion",
                        )[x[0].upper()]
                    )
                    if l.endangerment_status
                    in ["endangered", "critically endangered"]
                ]
            ),
        )[0],
    }
