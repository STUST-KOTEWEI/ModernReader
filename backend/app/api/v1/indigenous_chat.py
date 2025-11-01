"""
API endpoints for indigenous language LLM chatbot.

Features:
- Real-time chat in 100+ indigenous languages
- Cultural context awareness
- Translation and pronunciation
- LLM fine-tuning management
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field

from app.services.global_indigenous_languages import (
    GlobalIndigenousLanguageEngine,
    ChatbotResponse as ServiceChatbotResponse,
    LLMFineTuningDataset,
)

router = APIRouter(prefix="/indigenous-chat", tags=["Indigenous Chat"])

# Initialize global engine
engine = GlobalIndigenousLanguageEngine(use_mock=True)


# ========== Request/Response Models ==========


class ChatMessage(BaseModel):
    """Chat message from user."""

    message: str = Field(..., min_length=1, max_length=2000)
    language_code: str = Field(..., min_length=2, max_length=10)
    session_id: Optional[str] = None
    include_translation: bool = True
    include_cultural_notes: bool = True
    include_pronunciation: bool = True


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

        # Generate bot response
        response = await engine.chat(
            message=request.message,
            language_code=request.language_code,
            context=None,  # TODO: Load from session
            include_translation=request.include_translation,
            include_cultural_notes=request.include_cultural_notes,
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
