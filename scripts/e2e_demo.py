"""Minimal E2E smoke test for content -> chapters -> podcast -> unlock.

Usage:
  $ /Users/kedewei/modernreader/backend/.venv/bin/python scripts/e2e_demo.py

Requires backend running at MR_API_BASE (default http://127.0.0.1:8000/api/v1).
"""
from __future__ import annotations

import os
import sys
import time
import uuid
import requests


API = os.environ.get("MR_API_BASE", "http://127.0.0.1:8000/api/v1")


def main() -> int:
    s = requests.Session()

    # 1) signup or login
    email = f"demo_{uuid.uuid4().hex[:8]}@example.com"
    password = "password123!"
    try:
        r = s.post(f"{API}/auth/signup", json={"email": email, "password": password})
        r.raise_for_status()
    except requests.HTTPError:
        # try login
        r = s.post(f"{API}/auth/login", json={"email": email, "password": password})
        r.raise_for_status()
    token = r.json()["access_token"]
    s.headers.update({"Authorization": f"Bearer {token}"})
    print("✓ Auth OK for", email)

    # 2) ensure sample catalog exists
    s.post(f"{API}/catalog/import-sample")

    # 3) pick a book
    r = s.get(f"{API}/catalog/search")
    r.raise_for_status()
    results = r.json().get("results", [])
    if not results:
        print("No books found.")
        return 1
    book_id = results[0]["id"]
    print("✓ Selected book", book_id)

    # 4) upload content (small text)
    text = """Chapter 1: Hello ModernReader.\nThis is a test paragraph.\n\nChapter 2: Another part.\nMore text here."""
    r = s.post(f"{API}/catalog/upload-content", json={
        "book_id": book_id,
        "text": text,
        "format": "txt",
    })
    r.raise_for_status()
    content_id = r.json().get("content_id")
    print("✓ Uploaded content", content_id)

    # 5) list chapters
    r = s.get(f"{API}/catalog/books/{book_id}/chapters")
    r.raise_for_status()
    chapters = r.json().get("chapters", [])
    if not chapters:
        print("No chapters generated.")
        return 1
    ch_id = chapters[0]["id"]
    print("✓ Got", len(chapters), "chapters; first:", ch_id)

    # 6) try generate podcast (may fail if TTS not configured)
    r = s.post(f"{API}/catalog/chapters/{ch_id}/generate-podcast")
    if r.status_code == 400:
        print("! TTS not configured, skipping audio generation")
    else:
        r.raise_for_status()
        print("✓ Generated audio at", r.json().get("audio_url"))

    # 7) purchase/unlock
    r = s.post(f"{API}/purchase", json={
        "book_id": book_id,
        "amount": 10,
        "currency": "TWD",
    })
    r.raise_for_status()
    code = r.json().get("unlock_code")
    print("✓ Received unlock code", code)

    r = s.get(f"{API}/unlock", params={"book_id": book_id, "code": code})
    r.raise_for_status()
    assert r.json().get("unlocked"), "Unlock failed"
    print("✓ Unlock success")

    print("E2E OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
