"""Catalog discovery endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path
import json
import hashlib
import re
from typing import List  # noqa: F401 (reserved for future use)

from app.db.database import get_db
from app.schemas.catalog import CatalogQuery, CatalogSearchResponse
from app.schemas.content import UploadContentRequest, UploadContentResponse
from app.services.catalog import CatalogService
from app.models.catalog import Book, CatalogSource
from app.models.content import BookContent, BookChapter
from app.services.podcast import PodcastService
from app.api.v1.users import get_current_user
from app.models.user import User
from app.core.security import rate_limit_dependency

router = APIRouter()


def get_catalog_service(db: Session = Depends(get_db)) -> CatalogService:
    return CatalogService(db)


@router.get("/search", response_model=CatalogSearchResponse)
async def search_catalog(
    query: CatalogQuery = Depends(),
    service: CatalogService = Depends(get_catalog_service),
) -> CatalogSearchResponse:
    return await service.search(query)


@router.post("/import-sample")
async def import_sample_catalog(
    db: Session = Depends(get_db),
    force: bool = False,
):
    """Import sample books from data/catalogs/sample_books.json into DB.

    只在資料庫沒有書籍時插入，避免重複。
    """
    count = db.query(Book).count()
    if count > 0 and not force:
        return {
            "status": "skipped",
            "message": "books already exist",
            "existing": count,
        }

    json_path = (
        Path(__file__).resolve().parents[4]
        / "data"
        / "catalogs"
        / "sample_books.json"
    )
    if not json_path.exists():
        raise HTTPException(
            status_code=500, detail=f"Sample file not found: {json_path}"
        )

    with json_path.open("r", encoding="utf-8") as f:
        raw = json.load(f)
        if isinstance(raw, list):
            items = raw
        elif isinstance(raw, dict):
            # 支援多種鍵名
            for key in ("items", "books", "data"):
                if key in raw and isinstance(raw[key], list):
                    items = raw[key]
                    break
            else:
                raise HTTPException(
                    status_code=500,
                    detail=(
                        "Invalid sample_books.json format: expected list "
                        "or dict with items/books"
                    ),
                )

    # Ensure a default source
    source = (
        db.query(CatalogSource)
        .filter(CatalogSource.name == "sample")
        .one_or_none()
    )
    if not source:
        source = CatalogSource(
            name="sample", description="Sample catalog data"
        )
        db.add(source)
        db.flush()

    inserted = 0
    for it in items:
        external_id = it.get("isbn") or it.get("id")
        title = it.get("title", "Untitled")

        # 簡單去重：external_id 或 title 相同則跳過
        exists = (
            db.query(Book)
            .filter(
                (Book.external_id == external_id)
                | (Book.title == title)
            )
            .first()
        )
        if exists:
            continue

        book = Book(
            external_id=external_id,
            title=title,
            authors=it.get("authors", []),
            language=it.get("language", "zh-TW"),
            level=it.get("level"),
            topics=it.get("topics", []),
            summary=it.get("summary", ""),
            extra_metadata={
                k: v
                for k, v in it.items()
                if k
                not in {
                    "isbn",
                    "title",
                    "authors",
                    "language",
                    "level",
                    "topics",
                    "summary",
                }
            },
            source=source,
        )
        db.add(book)
        inserted += 1

    db.commit()
    return {"status": "ok", "inserted": inserted}


# -------- Content upload & chapters --------

def _simple_split_chapters(text: str) -> list[tuple[str, str]]:
    """Split into (title, text) tuples.

    Naive approach: detect headings or split by fixed-size blocks.
    """
    # Try heading patterns (Chapter/第X章)
    parts = re.split(r"(?im)^(?:chapter\s+\d+|第\s*\d+\s*章)[:\s-]*", text)
    chapters: list[tuple[str, str]] = []
    if len(parts) > 1:
        for i, chunk in enumerate(parts):
            ctext = chunk.strip()
            if not ctext:
                continue
            title = f"Chapter {i}" if i > 0 else "Introduction"
            chapters.append((title, ctext))
    else:
        # fallback: split by ~1500 chars blocks
        block = 1500
        for i in range(0, len(text), block):
            ctext = text[i:i+block]
            title = f"Part {i//block+1}"
            chapters.append((title, ctext))
    return chapters


@router.post("/upload-content", response_model=UploadContentResponse)
async def upload_content(
    request: UploadContentRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    _: None = Depends(rate_limit_dependency),
):
    # Validate book
    book = db.query(Book).filter(Book.id == request.book_id).one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="book not found")

    content_hash = hashlib.sha256(request.text.encode("utf-8")).hexdigest()
    existing = (
        db.query(BookContent)
        .filter(BookContent.book_id == book.id)
        .one_or_none()
    )
    if existing:
        # Overwrite text and chapters for simplicity
        existing.full_text = request.text
        existing.content_hash = content_hash
        existing.format = request.format or (
            (book.extra_metadata or {}).get("format", "txt")
        )
        # delete old chapters
        db.query(BookChapter).filter(
            BookChapter.content_id == existing.id
        ).delete()
        content = existing
    else:
        content = BookContent(
            book_id=book.id,
            full_text=request.text,
            content_hash=content_hash,
            format=request.format or (
                (book.extra_metadata or {}).get("format", "txt")
            ),
        )
        db.add(content)
        db.flush()

    chapters = _simple_split_chapters(request.text)
    for idx, (title, ctext) in enumerate(chapters, start=1):
        db.add(
            BookChapter(
                content_id=content.id,
                chapter_number=idx,
                title=title,
                text=ctext,
                word_count=len(ctext.split()),
                is_preview=(idx == 1),
            )
        )
    db.commit()
    return UploadContentResponse(status="ok", content_id=str(content.id))


@router.get("/books/{book_id}/chapters")
async def list_chapters(book_id: str, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="book not found")
    content = (
        db.query(BookContent)
        .filter(BookContent.book_id == book.id)
        .one_or_none()
    )
    if not content:
        return {"chapters": []}
    chapters = (
        db.query(BookChapter)
        .filter(BookChapter.content_id == content.id)
        .order_by(BookChapter.chapter_number.asc())
        .all()
    )
    return {
        "chapters": [
            {
                "id": str(c.id),
                "chapter_number": c.chapter_number,
                "title": c.title,
                "is_preview": c.is_preview,
                "podcast_url": c.podcast_url,
            }
            for c in chapters
        ]
    }


@router.post("/chapters/{chapter_id}/generate-podcast")
async def generate_chapter_podcast(
    chapter_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    _: None = Depends(rate_limit_dependency),
):
    chapter = (
        db.query(BookChapter)
        .filter(BookChapter.id == chapter_id)
        .one_or_none()
    )
    if not chapter:
        raise HTTPException(status_code=404, detail="chapter not found")
    svc = PodcastService()
    if not svc.is_configured():
        raise HTTPException(
            status_code=400, detail="TTS not configured on server"
        )
    svc.synthesize_chapter(chapter)
    # Store a URL that maps to audio endpoint
    chapter.podcast_url = f"/api/v1/catalog/chapters/{chapter_id}/audio"
    db.add(chapter)
    db.commit()
    return {"status": "ok", "audio_url": chapter.podcast_url}


@router.get("/chapters/{chapter_id}/audio")
async def get_chapter_audio(
    chapter_id: str, db: Session = Depends(get_db)
):
    chapter = (
        db.query(BookChapter)
        .filter(BookChapter.id == chapter_id)
        .one_or_none()
    )
    if not chapter:
        raise HTTPException(status_code=404, detail="chapter not found")
    svc = PodcastService()
    path = svc._chapter_filename(chapter)
    if not path.exists():
        raise HTTPException(status_code=404, detail="audio not found")
    return FileResponse(
        path,
        media_type="audio/wav",
        filename=f"chapter-{chapter.chapter_number}.wav",
    )
