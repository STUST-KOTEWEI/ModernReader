"""Catalog discovery endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pathlib import Path
import json

from app.db.database import get_db
from app.schemas.catalog import CatalogQuery, CatalogSearchResponse
from app.services.catalog import CatalogService
from app.models.catalog import Book, CatalogSource

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
async def import_sample_catalog(db: Session = Depends(get_db)):
    """Import sample books from data/catalogs/sample_books.json into DB.

    只在資料庫沒有書籍時插入，避免重複。
    """
    count = db.query(Book).count()
    if count > 0:
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
        items = json.load(f)

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
        book = Book(
            external_id=it.get("isbn"),
            title=it.get("title", "Untitled"),
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
