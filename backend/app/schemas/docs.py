"""Schemas for document upload and query (AskYourPDF-style)."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class DocumentRecord(BaseModel):
    """Metadata about an ingested document."""

    id: str
    title: str
    filename: str
    language: Optional[str] = Field(default=None, description="e.g., zh-TW")
    community: Optional[str] = Field(default=None, description="Community or language group")
    content_type: str
    size_bytes: int
    page_count: Optional[int] = None
    chunk_count: int
    uploaded_at: datetime


class DocUploadResponse(BaseModel):
    """Response after uploading and ingesting a document."""

    document: DocumentRecord
    message: str


class DocListResponse(BaseModel):
    """List of uploaded documents."""

    documents: List[DocumentRecord]


class DocQueryRequest(BaseModel):
    """Query payload for document QA."""

    question: str
    top_k: int = 5
    doc_ids: Optional[list[str]] = None
    language: Optional[str] = None
    community: Optional[str] = None
    persona: Optional[str] = Field(
        default="guide",
        description="persona guiding the answer (e.g., elder, guide, scholar)",
    )


class DocQuerySnippet(BaseModel):
    """A retrieved snippet for context/attribution."""

    text: str
    document_id: str
    title: Optional[str] = None
    score: float


class DocQueryResponse(BaseModel):
    """Query response with generated answer and snippets."""

    answer: str
    snippets: List[DocQuerySnippet]
    generated_at: datetime
