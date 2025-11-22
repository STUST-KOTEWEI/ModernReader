"""
Provider base classes and utilities for library ingestion
"""
from __future__ import annotations

import abc
import hashlib
from typing import Dict, List, Optional


NormalizedBook = Dict[str, object]


def normalize_isbn(isbn: Optional[str]) -> str:
    if not isbn:
        return ""
    s = isbn.replace("-", "").replace(" ", "").strip()
    # keep only digits/X
    return "".join([c for c in s if c.isdigit() or c.upper() == "X"])[:13]


def detect_language(text: str) -> str:
    if not text:
        return "unknown"
    chinese = sum(1 for c in text if "\u4e00" <= c <= "\u9fff")
    japanese = sum(
        1
        for c in text
        if ("\u3040" <= c <= "\u309f") or ("\u30a0" <= c <= "\u30ff")
    )
    if chinese > len(text) * 0.3:
        return "zh"
    if japanese > len(text) * 0.3:
        return "ja"
    return "en"


def make_id(prefix: str, key: str) -> str:
    h = hashlib.sha1(key.encode("utf-8")).hexdigest()[:10]
    return f"{prefix}_{h}"


class Provider(abc.ABC):
    """Abstract provider interface."""

    name: str = "base"

    def __init__(
        self,
        limit: int = 50,
        verify_ssl: bool = True,
        timeout: int = 10,
    ):
        self.limit = limit
        self.verify_ssl = verify_ssl
        self.timeout = timeout

    @abc.abstractmethod
    def fetch(self, query: Dict[str, str]) -> List[NormalizedBook]:
        """Fetch books for a single query and return normalized list."""
        raise NotImplementedError

    # Common normalization helpers
    def book(self,
             *,
             id: str,
             title: str,
             authors: List[str],
             summary: str = "",
             topics: Optional[List[str]] = None,
             language: Optional[str] = None,
             isbn: Optional[str] = None,
             url: Optional[str] = None,
             publisher: Optional[str] = None,
             publication_date: Optional[str] = None,
             reading_level: str = "general",
             keywords: Optional[List[str]] = None) -> NormalizedBook:
        topics = topics or []
        language = language or detect_language(title)
        return {
            "id": id,
            "title": title,
            "authors": [a for a in (authors or []) if a],
            "summary": summary or "",
            "topics": topics,
            "language": language,
            "publisher": publisher or "",
            "publication_date": publication_date or "",
            "metadata": {
                "isbn": normalize_isbn(isbn),
                "source": self.name,
                "url": url or "",
                "reading_level": reading_level,
                "keywords": keywords or [],
            },
        }
