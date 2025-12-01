"""AI 相關的 API 路由（LLM + RAG + 多模態）"""
from __future__ import annotations

import base64
import binascii
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.ai_engine import get_ai_engine, MultimodalInput
from app.services.rag import RAGService
from app.services.speech import get_speech_service
from app.schemas.rag import (
    RAGIngestRequest,
    RAGIngestResponse,
    RAGQueryRequest,
    RAGQueryResponse,
)
from pydantic import BaseModel, Field

from app.core.llm_config import LLMProvider

logger = logging.getLogger(__name__)

PROVIDER_LABELS: dict[LLMProvider, str] = {
    LLMProvider.OPENAI: "OpenAI (GPT-4o)",
    LLMProvider.ANTHROPIC: "Anthropic (Claude)",
    LLMProvider.GOOGLE: "Google Gemini",
    LLMProvider.GPT_OSS: "GPT-OSS / 自架模型",
}


router = APIRouter()


# ===== LLM 相關端點 =====


def _decode_base64_payload(data: str) -> bytes:
    """Decode base64 data, allowing optional data URI prefix."""
    payload = data
    if "," in payload:
        payload = payload.split(",", 1)[1]
    try:
        return base64.b64decode(payload, validate=True)
    except binascii.Error as exc:  # pragma: no cover - input validation
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


def _build_priority(
    provider: str | None, provider_priority: list[str] | None
) -> list[LLMProvider] | None:
    overrides: list[LLMProvider] = []
    if provider:
        overrides.append(_parse_provider(provider))
    if provider_priority:
        for item in provider_priority:
            if not item:
                continue
            enum = _parse_provider(item)
            if enum not in overrides:
                overrides.append(enum)
    return overrides or None


class UnderstandRequest(BaseModel):
    """多模態理解請求"""

    text: str | None = Field(
        None, description="輸入文本", max_length=10000
    )
    image_url: str | None = Field(None, description="圖片 URL（可選）")
    image_base64: str | None = Field(
        None, description="Base64 圖片內容（data URI 亦可）"
    )
    image_mime_type: str | None = Field(
        None, description="圖片 MIME 類型，如 image/png"
    )
    audio_base64: str | None = Field(
        None, description="Base64 語音內容"
    )
    audio_mime_type: str | None = Field(
        None, description="語音 MIME 類型，如 audio/webm"
    )
    provider: str | None = Field(
        None, description="指定 LLM provider（例如 openai、anthropic、gpt_oss）"
    )
    provider_priority: list[str] | None = Field(
        default=None,
        description="自訂 provider 嘗試順序（例如 ['openai','gpt_oss']）",
    )
    context: dict[str, Any] | None = Field(None, description="額外上下文")


class UnderstandResponse(BaseModel):
    """多模態理解回應"""

    content: str = Field(description="理解結果")
    provider: str = Field(description="使用的 LLM provider")
    tokens_used: int = Field(description="使用的 token 數量")
    audio_base64: str | None = Field(None, description="語音回應的 Base64 編碼內容（如果請求）")


class AdaptiveContentRequest(BaseModel):
    """認知負荷自適應內容生成請求"""

    prompt: str = Field(description="生成提示詞", max_length=5000)
    cognitive_load: float = Field(
        0.5, description="認知負荷 (0-1)", ge=0.0, le=1.0
    )
    cultural_context: dict[str, Any] | None = Field(
        None, description="文化上下文（語言、背景等）"
    )
    provider: str | None = Field(
        None, description="指定 LLM provider"
    )
    provider_priority: list[str] | None = Field(
        default=None, description="自訂 provider 嘗試順序"
    )


class AdaptiveContentResponse(BaseModel):
    """認知負荷自適應內容生成回應"""

    content: str = Field(description="生成的內容")


class TranscribeRequest(BaseModel):
    """語音轉文字請求"""

    audio_base64: str = Field(..., description="Base64 語音內容")
    mime_type: str | None = Field(
        "audio/wav", description="語音 MIME 類型"
    )
    prompt: str | None = Field(
        None, description="可選的轉寫提示，提高準確度"
    )


class TranscribeResponse(BaseModel):
    """語音轉文字回應"""

    text: str = Field(description="轉寫後的文字")


class ProviderInfo(BaseModel):
    """LLM provider state."""

    id: str = Field(description="Provider ID，例如 openai")
    label: str = Field(description="易讀名稱")
    available: bool = Field(description="是否已設定並可用")
    default_model: str | None = Field(
        default=None, description="預設文字模型"
    )
    supports_vision: bool = Field(
        description="是否支援圖片/多模態理解"
    )
    supports_transcription: bool = Field(
        description="是否支援語音轉文字"
    )


# ===== Emotion Detection（Text-based） =====


class EmotionAnalyzeRequest(BaseModel):
    """情緒分析請求（基於文本）"""

    text: str = Field(description="輸入文本", max_length=10000)


class EmotionAnalyzeResponse(BaseModel):
    """情緒分析回應"""

    top_emotion: str = Field(description="最可能的情緒標籤")
    emotions: dict[str, float] = Field(
        description="各情緒的機率分佈（總和為 1）"
    )


from app.services.speech import get_speech_service

@router.post("/understand", response_model=UnderstandResponse)
async def understand_content(request: UnderstandRequest, return_audio: bool = False):
    """
    多模態理解端點

    支援：
    - 純文本理解
    - 文本 + 圖片理解（需提供 image_url）
    - 上下文感知（可傳入 cognitive_load, language 等）
    - 可選回傳語音回應
    """
    engine = get_ai_engine()

    system_prompt = (
        request.context.get("system_prompt")
        if isinstance(request.context, dict)
        else None
    )
    context = dict(request.context or {})

    priority_override = _build_priority(
        request.provider, request.provider_priority
    )
    if priority_override:
        configured = list(priority_override)
        for provider in engine.config.provider_priority:
            if provider not in configured:
                configured.append(provider)
        priority_override = configured

    image_bytes = None
    if request.image_base64:
        image_bytes = _decode_base64_payload(request.image_base64)
        context.setdefault("media", {})["image_mime_type"] = (
            request.image_mime_type or "image/jpeg"
        )

    audio_transcript = None
    if request.audio_base64:
        audio_bytes = _decode_base64_payload(request.audio_base64)
        try:
            speech_service = get_speech_service()
            audio_transcript = await speech_service.transcribe(
                audio_bytes,
                mime_type=request.audio_mime_type,
            )
            context.setdefault("media", {})["audio_transcript"] = (
                audio_transcript
            )
        except RuntimeError as err:
            logger.warning("Audio transcription unavailable: %s", err)
        except Exception as err:  # pragma: no cover - provider error
            logger.error("Audio transcription failed: %s", err)

    text_payload = request.text or ""
    if audio_transcript:
        text_payload = (
            f"{text_payload}\n\n{audio_transcript}" if text_payload else audio_transcript
        )

    try:
        result = await engine.understand(
            MultimodalInput(
                text=text_payload or None,
                image=image_bytes,
                image_mime_type=request.image_mime_type,
                context=context or None,
            ),
            system_prompt=system_prompt,
            provider_priority=priority_override,
        )
        
        audio_response_base64 = None
        if return_audio and result.content:
            try:
                speech_service = get_speech_service()
                audio_bytes = await speech_service.synthesize_speech(result.content)
                audio_response_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            except RuntimeError as err:
                logger.warning("Audio synthesis unavailable: %s", err)
            except Exception as err:
                logger.error("Audio synthesis failed: %s", err)

        return UnderstandResponse(
            content=result.content,
            provider=result.provider.value,
            tokens_used=result.tokens_used or 0,
            audio_base64=audio_response_base64
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate", response_model=AdaptiveContentResponse)
async def generate_adaptive(request: AdaptiveContentRequest):
    """
    認知負荷自適應內容生成

    根據使用者的認知負荷動態調整內容：
    - 低負荷 (0-0.3): 挑戰性內容，複雜詞彙
    - 中負荷 (0.3-0.7): 平衡內容
    - 高負荷 (0.7-1.0): 簡化內容，更多範例
    """
    engine = get_ai_engine()

    try:
        priority_override = _build_priority(
            request.provider, request.provider_priority
        )
        if priority_override:
            configured = list(priority_override)
            for provider in engine.config.provider_priority:
                if provider not in configured:
                    configured.append(provider)
            priority_override = configured

        content = await engine.generate_adaptive_content(
            prompt=request.prompt,
            cognitive_load=request.cognitive_load,
            cultural_context=request.cultural_context,
            provider_priority=priority_override,
        )
        return AdaptiveContentResponse(content=content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(request: TranscribeRequest) -> TranscribeResponse:
    """語音轉文字服務。"""

    audio_bytes = _decode_base64_payload(request.audio_base64)

    try:
        service = get_speech_service()
        text = await service.transcribe(
            audio_bytes,
            mime_type=request.mime_type,
            prompt=request.prompt,
        )
        return TranscribeResponse(text=text)
    except RuntimeError as err:
        raise HTTPException(status_code=503, detail=str(err)) from err
    except Exception as err:  # pragma: no cover - provider errors
        raise HTTPException(status_code=500, detail=str(err)) from err


@router.post("/emotion/analyze", response_model=EmotionAnalyzeResponse)
async def analyze_emotion_text(request: EmotionAnalyzeRequest):
    """
    簡易的文本情緒偵測端點（無外部依賴）

    - 使用輕量字典和表情符號啟發式
    - 回傳每個情緒的相對機率以及 top_emotion
    """
    try:
        from app.services.emotion import analyze_text_emotions

        probs, top = analyze_text_emotions(request.text)
        return EmotionAnalyzeResponse(top_emotion=top, emotions=probs)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===== RAG 相關端點 =====


@router.post("/rag/ingest", response_model=RAGIngestResponse)
async def rag_ingest(
    request: RAGIngestRequest, db: Session = Depends(get_db)
):
    """
    文檔嵌入與索引

    將文檔內容嵌入到向量資料庫，支援後續語義搜尋與 RAG 查詢
    """
    rag_service = RAGService(db)

    try:
        result = await rag_service.ingest(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rag/query", response_model=RAGQueryResponse)
async def rag_query(
    request: RAGQueryRequest, db: Session = Depends(get_db)
):
    """
    RAG 查詢（檢索 + 生成）

    1. 語義搜尋相關文檔片段
    2. 構建上下文
    3. 使用 LLM 生成答案
    4. 返回答案與來源片段
    """
    rag_service = RAGService(db)

    try:
        result = await rag_service.query(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """AI 系統健康檢查"""
    engine = get_ai_engine()

    return {
        "status": "healthy",
        "providers": [p.value for p in engine.config.provider_priority],
        "ai_engine": "operational",
        "rag_system": "operational",
    }


@router.get("/providers", response_model=list[ProviderInfo])
async def list_providers() -> list[ProviderInfo]:
    """列出所有已配置的 LLM provider 狀態。"""
    engine = get_ai_engine()
    config = engine.config
    infos: list[ProviderInfo] = []

    for provider in LLMProvider:
        available = provider in engine.clients
        if provider == LLMProvider.OPENAI:
            default_model = config.default_text_model
            supports_vision = True
            supports_transcription = bool(config.openai_api_key)
        elif provider == LLMProvider.GOOGLE:
            default_model = "gemini-2.0-flash-exp"
            supports_vision = True
            supports_transcription = False
        elif provider == LLMProvider.ANTHROPIC:
            default_model = "claude-3-5-sonnet-20241022"
            supports_vision = False
            supports_transcription = False
        else:  # GPT_OSS
            default_model = config.oss_text_model or config.default_text_model
            supports_vision = bool(config.oss_vision_model)
            supports_transcription = bool(
                config.oss_transcribe_model or config.oss_text_model
            )

        infos.append(
            ProviderInfo(
                id=provider.value,
                label=PROVIDER_LABELS.get(provider, provider.value),
                available=available,
                default_model=default_model,
                supports_vision=supports_vision,
                supports_transcription=supports_transcription,
            )
        )
    return infos
