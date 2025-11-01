"""
RAG API 端點擴展
=======================

新增完整的 RAG 功能端點:
- 批次攝取書籍目錄
- 系統統計資訊
- 語義搜尋
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.db.database import get_db
from app.schemas.rag import (
    RAGIngestRequest,
    RAGIngestResponse,
    RAGQueryRequest,
    RAGQueryResponse
)
from app.services.rag import RAGService
from pydantic import BaseModel

router = APIRouter()


class SemanticSearchRequest(BaseModel):
    """語義搜尋請求"""
    query: str
    top_k: int = 5
    language: str | None = None
    score_threshold: float = 0.0


class SemanticSearchResult(BaseModel):
    """語義搜尋結果"""
    content: str
    metadata: Dict[str, Any]
    similarity: float
    distance: float


@router.post("/ingest", response_model=RAGIngestResponse)
async def ingest_document(
    request: RAGIngestRequest,
    db: Session = Depends(get_db)
):
    """
    攝取單個文檔
    
    將文檔分割、嵌入並索引到向量資料庫
    """
    service = RAGService(db)
    return await service.ingest(request)


@router.post("/query", response_model=RAGQueryResponse)
async def query_rag(
    request: RAGQueryRequest,
    db: Session = Depends(get_db)
):
    """
    RAG 智能問答
    
    1. 語義檢索相關文檔
    2. LLM 生成答案
    3. 返回答案 + 引用來源
    """
    service = RAGService(db)
    return await service.query(request)


@router.post("/ingest-catalog")
async def ingest_book_catalog(db: Session = Depends(get_db)):
    """
    批次攝取書籍目錄
    
    從資料庫讀取所有書籍並嵌入到向量資料庫
    """
    service = RAGService(db)
    result = await service.ingest_book_catalog()
    return result


@router.get("/stats")
async def get_rag_stats(db: Session = Depends(get_db)):
    """
    獲取 RAG 系統統計資訊
    
    包含向量資料庫統計、AI 引擎狀態等
    """
    service = RAGService(db)
    return await service.get_stats()


@router.post("/search", response_model=List[SemanticSearchResult])
async def semantic_search(
    request: SemanticSearchRequest,
    db: Session = Depends(get_db)
):
    """
    純語義搜尋 (不生成答案)
    
    直接返回相關文檔片段
    """
    service = RAGService(db)
    
    # 使用內部向量資料庫
    results = await service.vector_store.semantic_search(
        query=request.query,
        top_k=request.top_k,
        filter_dict=(
            {"language": request.language}
            if request.language
            else None
        ),
        score_threshold=request.score_threshold
    )
    
    return [
        SemanticSearchResult(
            content=r["content"],
            metadata=r["metadata"],
            similarity=r["similarity"],
            distance=r["distance"]
        )
        for r in results
    ]


@router.get("/health")
async def health_check():
    """健康檢查"""
    return {
        "status": "healthy",
        "service": "rag",
        "features": [
            "document_ingestion",
            "semantic_search",
            "llm_generation",
            "batch_catalog_import"
        ]
    }
