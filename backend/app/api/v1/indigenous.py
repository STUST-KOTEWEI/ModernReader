"""API endpoints for indigenous language processing."""
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
from sqlalchemy.orm import Session

from app.schemas.indigenous import (
    HandwritingRecognitionResponse,
    PronunciationTrainingRequest,
    PronunciationTrainingResponse,
    PronunciationAssessmentResponse,
    LanguageInfoResponse,
    CustomLanguageCreateRequest,
    LanguageListItem,
)
from app.services.indigenous_handwriting import (
    IndigenousHandwritingEngine,
    PronunciationTrainingEngine,
    IndigenousLanguage,
)
from app.db.database import get_db
from app.models.indigenous_language import IndigenousLanguageProfile

router = APIRouter()


def get_handwriting_engine() -> IndigenousHandwritingEngine:
    """Dependency for handwriting engine."""
    return IndigenousHandwritingEngine(use_mock=True)


def get_pronunciation_engine() -> PronunciationTrainingEngine:
    """Dependency for pronunciation engine."""
    return PronunciationTrainingEngine(use_mock=True)


@router.post(
    "/handwriting/recognize",
    response_model=HandwritingRecognitionResponse,
    summary="Recognize handwritten indigenous text",
)
async def recognize_handwriting(
    image: UploadFile = File(..., description="Handwritten text image"),
    language: str = Form(..., description="Indigenous language code"),
    auto_romanize: bool = Form(True, description="Apply romanization"),
    engine: IndigenousHandwritingEngine = Depends(get_handwriting_engine),
) -> HandwritingRecognitionResponse:
    """
    Recognize handwritten indigenous language text and optionally romanize.

    Supports indigenous languages (built-in examples include):
    - Amis (ami), Atayal (tay), Paiwan (pwn), Bunun (bnn)
    - Puyuma (pyu), Rukai (dru), Tsou (tsu), Saisiyat (xsy)
    - Yami/Tao (tao), Thao (ssf), Kavalan (ckv), Truku (trv)
    - Sakizaya (szy), Seediq (trv), Hla'alua (sxr), Kanakanavu (xnb)

    **Features:**
    - Handwriting-to-text recognition
    - Automatic romanization
    - Character-level bounding boxes
    - Confidence scores
    - Alternative readings
    """
    image_data = await image.read()
    lang_enum = IndigenousLanguage(language)

    result = await engine.recognize_handwriting(
        image_data=image_data, language=lang_enum, auto_romanize=auto_romanize
    )

    return HandwritingRecognitionResponse(
        original_image_url=result.original_image_url,
        recognized_text=result.recognized_text,
        romanized_text=result.romanized_text,
        language=result.language.value,
        confidence=result.confidence,
        alternative_readings=[
            {"text": text, "confidence": conf}
            for text, conf in result.alternative_readings
        ],
        character_boxes=result.character_boxes,
        processed_at=result.processed_at,
        processing_time_ms=result.processing_time_ms,
    )


@router.post(
    "/pronunciation/train",
    response_model=PronunciationTrainingResponse,
    summary="Process audio for pronunciation training",
)
async def train_pronunciation(
    request: PronunciationTrainingRequest,
    engine: PronunciationTrainingEngine = Depends(get_pronunciation_engine),
) -> PronunciationTrainingResponse:
    """
    Process audio samples to train pronunciation models.

    **Use Cases:**
    - Build TTS models for indigenous languages
    - Create pronunciation training datasets
    - Fine-tune LLMs with audio data

    **Requirements:**
    - Audio format: WAV/MP3, 16kHz sample rate
    - Transcript must match audio
    - Speaker ID for multi-speaker models
    """
    lang_enum = IndigenousLanguage(request.language)

    # Mock audio data (in real impl, would get from storage)
    audio_data = b"mock_audio_data"

    result = await engine.process_audio_sample(
        audio_data=audio_data,
        transcript=request.transcript,
        language=lang_enum,
        speaker_id=request.speaker_id,
        dialect=request.dialect,
    )

    return PronunciationTrainingResponse(
        job_id=(
            f"train_{request.speaker_id}_"
            f"{int(result.metadata['duration_sec'] * 1000)}"
        ),
        audio_url=result.audio_url,
        language=result.language.value,
        quality_score=result.audio_quality_score,
        phoneme_count=len(result.phoneme_timestamps),
        status="processed",
        metadata=result.metadata,
    )


@router.post(
    "/pronunciation/assess",
    response_model=PronunciationAssessmentResponse,
    summary="Assess pronunciation quality",
)
async def assess_pronunciation(
    audio: UploadFile = File(..., description="Learner pronunciation audio"),
    reference_text: str = Form(..., description="Correct text"),
    language: str = Form(..., description="Language code"),
    engine: PronunciationTrainingEngine = Depends(get_pronunciation_engine),
) -> PronunciationAssessmentResponse:
    """
    Assess learner pronunciation against reference text.

    **Provides:**
    - Overall pronunciation score
    - Fluency assessment
    - Phoneme-level feedback
    - Improvement suggestions
    """
    audio_data = await audio.read()
    lang_enum = IndigenousLanguage(language)

    result = engine.assess_pronunciation(
        audio_data=audio_data,
        reference_text=reference_text,
        language=lang_enum,
    )

    return PronunciationAssessmentResponse(
        overall_score=result["overall_score"],
        fluency=result["fluency"],
        pronunciation=result["pronunciation"],
        completeness=result["completeness"],
        phoneme_scores=result["phoneme_scores"],
        suggestions=result["suggestions"],
    )


@router.get(
    "/language/{language_code}/info",
    response_model=LanguageInfoResponse,
    summary="Get indigenous language information",
)
async def get_language_info(
    language_code: str,
    engine: IndigenousHandwritingEngine = Depends(get_handwriting_engine),
) -> LanguageInfoResponse:
    """
    Get linguistic information about an indigenous language.

    **Returns:**
    - Vowels and consonants
    - Special characters (glottal stops, etc.)
    - Tone markers
    - Syllable patterns
    - Cultural notes
    """
    lang_enum = IndigenousLanguage(language_code)
    info = engine.get_language_info(lang_enum)

    return LanguageInfoResponse(
        code=info["code"],
        name=info["name"],
        has_romanization_rules=info["has_romanization_rules"],
        vowels=info["vowels"],
        consonants=info["consonants"],
        special_characters=info["special_characters"],
        tone_markers=info["tone_markers"],
        syllable_patterns=info["syllable_patterns"],
        cultural_notes=info["cultural_notes"],
    )


@router.get(
    "/languages",
    response_model=list[LanguageListItem],
    summary="List supported indigenous languages (builtin + custom)",
)
async def list_languages(db: Session = Depends(get_db)):
    """Return builtin languages plus custom registry entries.

    - builtin: sourced from IndigenousLanguage enum
    - custom: stored in DB (global, user-added)
    """
    builtin = [
        LanguageListItem(code=lang.value, name=lang.name, source="builtin")
        for lang in IndigenousLanguage
    ]
    customs = [
        LanguageListItem(
            code=rec.code,
            name=rec.name,
            region=rec.region,
            family=rec.family,
            script=rec.script,
            source="custom",
        )
        for rec in db.query(IndigenousLanguageProfile).all()
    ]
    # Deduplicate by code, prefer custom entry
    by_code = {item.code: item for item in builtin}
    for c in customs:
        by_code[c.code] = c
    return list(by_code.values())


@router.post(
    "/languages",
    summary="Create a custom indigenous language",
)
async def create_language(
    request: CustomLanguageCreateRequest,
    db: Session = Depends(get_db),
):
    # Check exists
    existing = (
        db.query(IndigenousLanguageProfile)
        .filter(IndigenousLanguageProfile.code == request.code)
        .one_or_none()
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Language code already exists",
        )

    rec = IndigenousLanguageProfile(
        code=request.code,
        name=request.name,
        region=request.region,
        family=request.family,
        script=request.script,
        aliases=request.aliases,
        metadata=request.metadata,
        is_custom=True,
    )
    db.add(rec)
    db.commit()
    return {
        "status": "ok",
        "language": {
            "code": rec.code,
            "name": rec.name,
            "region": rec.region,
            "family": rec.family,
            "script": rec.script,
            "source": "custom",
        },
    }
