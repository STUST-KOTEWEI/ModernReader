"""Catalog schemas."""
from typing import Any, Sequence
from pydantic import BaseModel, Field


class CatalogQuery(BaseModel):
    q: str | None = Field(None, description="Keyword query")
    isbn: str | None = None
    language: str | None = None
    source: str | None = Field(None, description="Catalog source identifier")
    limit: int = Field(20, ge=1, le=100)
    offset: int = Field(0, ge=0)


class CatalogItem(BaseModel):
    id: str
    title: str
    authors: list[str]
    language: str
    topics: list[str]
    summary: str
    source: str | None = None
    metadata: dict[str, Any] | None = None

    class Config:
        from_attributes = True


class CatalogSearchResponse(BaseModel):
    results: Sequence[CatalogItem]
    total: int
