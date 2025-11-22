"""Seed catalog metadata from JSON resources."""
from __future__ import annotations

import json
import sys
from pathlib import Path

from sqlalchemy.orm import Session

CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
REPO_ROOT = PROJECT_ROOT.parent
sys.path.append(str(PROJECT_ROOT))

from app.db.database import SessionLocal, engine  # type: ignore  # noqa: E402
from app.models import Base, Book, CatalogSource  # type: ignore  # noqa: E402

DATA_PATH = REPO_ROOT / "data" / "catalogs" / "sample_books.json"


def load_data(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def seed(session: Session, records: list[dict]) -> None:
    for record in records:
        source_name = record.pop("source", "Unknown")
        source = (
            session.query(CatalogSource)
            .filter_by(name=source_name)
            .one_or_none()
        )
        if not source:
            source = CatalogSource(
                name=source_name,
                description=f"Imported from {source_name}"
            )
            session.add(source)
            session.flush()

        metadata = record.get("metadata", {})
        metadata.setdefault("layout", "text")

        book = Book(
            title=record["title"],
            authors=record.get("authors", []),
            language=record.get("language", "unspecified"),
            topics=record.get("topics", []),
            summary=record.get("summary", ""),
            extra_metadata=metadata,
            external_id=metadata.get("isbn"),
            source=source,
        )
        session.add(book)
    session.commit()


def main() -> None:
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        records = load_data(DATA_PATH)
        seed(session, records)
        print(f"Seeded {len(records)} catalog entries from {DATA_PATH.name}")
    finally:
        session.close()


if __name__ == "__main__":
    main()
