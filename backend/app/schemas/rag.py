"""Schemas for retrieval-augmented generation endpoints."""
from datetime import datetime
from typing import Sequence

from pydantic import BaseModel


class RAGIngestRequest(BaseModel):
    document_id: str
    title: str
    language: str
    content: str


class RAGIngestResponse(BaseModel):
    job_id: str
    status: str = "accepted"


class RAGQueryRequest(BaseModel):
    query: str
    language: str | None = None
    top_k: int = 3


class RAGSnippet(BaseModel):
    text: str
    source: str
    score: float


class RAGQueryResponse(BaseModel):
    answer: str
    snippets: Sequence[RAGSnippet]
    generated_at: datetime
