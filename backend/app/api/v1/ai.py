"""
AI 相關的 API 路由（LLM + RAG）
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.ai_engine import get_ai_engine, MultimodalInput
from app.services.rag import RAGService
from app.schemas.rag import (
    RAGIngestRequest,
    RAGIngestResponse,
    RAGQueryRequest,
    RAGQueryResponse,
)
from pydantic import BaseModel, Field

router = APIRouter()


# ===== LLM 相關端點 =====


class UnderstandRequest(BaseModel):
    """多模態理解請求"""

    text: str | None = Field(
        None, description="輸入文本", max_length=10000
    )
    image_url: str | None = Field(None, description="圖片 URL（可選）")
    context: dict | None = Field(None, description="額外上下文")


class UnderstandResponse(BaseModel):
    """多模態理解回應"""

    content: str = Field(description="理解結果")
    provider: str = Field(description="使用的 LLM provider")
    tokens_used: int = Field(description="使用的 token 數量")


class AdaptiveContentRequest(BaseModel):
    """認知負荷自適應內容生成請求"""

    prompt: str = Field(description="生成提示詞", max_length=5000)
    cognitive_load: float = Field(
        0.5, description="認知負荷 (0-1)", ge=0.0, le=1.0
    )
    cultural_context: dict | None = Field(
        None, description="文化上下文（語言、背景等）"
    )


class AdaptiveContentResponse(BaseModel):
    """認知負荷自適應內容生成回應"""

    content: str = Field(description="生成的內容")


@router.post("/understand", response_model=UnderstandResponse)
async def understand_content(request: UnderstandRequest):
    """
    多模態理解端點

    支援：
    - 純文本理解
    - 文本 + 圖片理解（需提供 image_url）
    - 上下文感知（可傳入 cognitive_load, language 等）
    """
    engine = get_ai_engine()

    try:
        result = await engine.understand(
            MultimodalInput(
                text=request.text,
                image_url=request.image_url,
                context=request.context,
            )
        )
        return UnderstandResponse(
            content=result.content,
            provider=result.provider.value,
            tokens_used=result.tokens_used,
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
        content = await engine.generate_adaptive_content(
            prompt=request.prompt,
            cognitive_load=request.cognitive_load,
            cultural_context=request.cultural_context,
        )
        return AdaptiveContentResponse(content=content)
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
