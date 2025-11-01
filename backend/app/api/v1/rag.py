"""RAG endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.rag import (
    RAGIngestRequest,
    RAGIngestResponse,
    RAGQueryRequest,
    RAGQueryResponse,
)
from app.services.rag import RAGService

router = APIRouter()


def get_service(db: Session = Depends(get_db)) -> RAGService:
    return RAGService(db)


@router.post("/ingest", response_model=RAGIngestResponse)
async def ingest(
    request: RAGIngestRequest,
    service: RAGService = Depends(get_service),
) -> RAGIngestResponse:
    return await service.ingest(request)


@router.post("/query", response_model=RAGQueryResponse)
async def query(
    request: RAGQueryRequest,
    service: RAGService = Depends(get_service),
) -> RAGQueryResponse:
    return await service.query(request)
