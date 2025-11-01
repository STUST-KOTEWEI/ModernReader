"""Catalog service backed by metadata store."""
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.catalog import Book, CatalogSource
from app.schemas.catalog import CatalogItem, CatalogQuery, CatalogSearchResponse


class CatalogService:
    def __init__(self, db: Session):
        self.db = db

    async def search(self, query: CatalogQuery) -> CatalogSearchResponse:
        stmt = self.db.query(Book)

        if query.q:
            like = f"%{query.q.lower()}%"
            stmt = stmt.filter(
                func.lower(Book.title).like(like)
                | func.lower(Book.summary).like(like)
            )

        if query.isbn:
            stmt = stmt.filter(Book.external_id == query.isbn)

        if query.language:
            stmt = stmt.filter(Book.language == query.language)

        if query.source:
            stmt = stmt.join(Book.source).filter(CatalogSource.name == query.source)

        total = stmt.count()
        results = (
            stmt.order_by(Book.created_at.desc())
            .limit(query.limit)
            .offset(query.offset)
            .all()
        )

        items = []
        for book in results:
            items.append(
                CatalogItem(
                    id=str(book.id),
                    title=book.title,
                    authors=book.authors,
                    language=book.language,
                    topics=book.topics,
                    summary=book.summary,
                    source=book.source.name if book.source else None,
                    metadata=book.extra_metadata,
                )
            )

        return CatalogSearchResponse(results=items, total=total)
