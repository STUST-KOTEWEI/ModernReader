"""Ingest public catalogs end-to-end (crawl -> merge -> import DB).

This script:
1) Runs the library scraper to fetch from NLPI/STUST/public sources and
   supplements with OpenLibrary/DEMO to ensure at least 50 items.
2) Merges into data/catalogs/sample_books.json (with backup) using the
   existing merge utility.
3) Imports the merged catalog directly into the database (no API server
   required).

Usage:
  poetry run python backend/scripts/ingest_public_catalog.py
"""
from __future__ import annotations

import sys
import os
from pathlib import Path
import json
from typing import Iterable

# Resolve repo paths first, then extend sys.path before local imports
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
REPO_ROOT = PROJECT_ROOT.parent

# Ensure backend and ingestion modules are importable
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))
if str(REPO_ROOT / "data" / "ingestion") not in sys.path:
    sys.path.append(str(REPO_ROOT / "data" / "ingestion"))

from app.db.database import SessionLocal, engine  # type: ignore
from app.models import Base, Book, CatalogSource  # type: ignore
from library_scraper import LibraryScraper  # type: ignore
import merge_catalogs as merger  # type: ignore


DATA_DIR = REPO_ROOT / "data" / "catalogs"
PUBLIC_JSON = DATA_DIR / "public_library_books.json"
SAMPLE_JSON = DATA_DIR / "sample_books.json"


def ensure_repo_cwd() -> None:
    # Keep DB at backend/modernreader.db per default config
    os.chdir(str(PROJECT_ROOT))


def crawl_public() -> None:
    scraper = LibraryScraper()
    books = scraper.scrape_all()
    scraper.save_to_json(books, str(PUBLIC_JSON))


def merge_catalogs() -> None:
    merger.merge_catalogs()


def _iter_items(raw) -> Iterable[dict]:
    if isinstance(raw, list):
        return raw
    if isinstance(raw, dict):
        for key in ("items", "books", "data"):
            if key in raw and isinstance(raw[key], list):
                return raw[key]
    raise ValueError("Unsupported catalog JSON format")


def import_to_db() -> int:
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    inserted = 0
    try:
        with SAMPLE_JSON.open("r", encoding="utf-8") as fh:
            raw = json.load(fh)
        items = list(_iter_items(raw))

        # Cache existing for simple dedupe by external_id or title
        existing_titles = {t for (t,) in session.query(Book.title).all()}
        existing_ext_ids = {
            (eid or "") for (eid,) in session.query(Book.external_id).all()
        }

        for it in items:
            meta = it.get("metadata", {})
            external_id = it.get("isbn") or it.get("id") or meta.get("isbn")
            title = it.get("title") or meta.get("title")
            if not title:
                continue

            if (external_id and external_id in existing_ext_ids) or (
                title in existing_titles
            ):
                continue

            source_name = meta.get("source") or it.get("source") or "Unknown"
            source = (
                session.query(CatalogSource)
                .filter(CatalogSource.name == source_name)
                .one_or_none()
            )
            if not source:
                source = CatalogSource(
                    name=source_name,
                    description=f"Imported from {source_name}",
                )
                session.add(source)
                session.flush()

            book = Book(
                external_id=external_id,
                title=title,
                authors=it.get("authors", []),
                language=it.get("language", "unspecified"),
                level=it.get("level"),
                topics=it.get("topics", []),
                summary=it.get("summary", ""),
                extra_metadata=meta,
                source=source,
            )
            session.add(book)
            inserted += 1

        session.commit()
        return inserted
    finally:
        session.close()


def main() -> None:
    ensure_repo_cwd()
    print("[1/3] Crawling public catalogs…")
    crawl_public()
    print("[2/3] Merging catalogs…")
    merge_catalogs()
    print("[3/3] Importing into DB…")
    n = import_to_db()
    print(f"Done. Inserted {n} new books into the database.")


if __name__ == "__main__":
    main()
