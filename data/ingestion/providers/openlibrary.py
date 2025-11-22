"""
OpenLibrary provider
API Docs: https://openlibrary.org/developers/api
"""
from __future__ import annotations

import requests
from typing import Dict, List

from .base import Provider, make_id


class OpenLibraryProvider(Provider):
    name = "OpenLibrary"

    def fetch(self, query: Dict[str, str]) -> List[Dict[str, object]]:
        q = query.get("q") or query.get("subject") or "books"
        limit = int(query.get("limit") or self.limit)
        params = {
            "q": q,
            "limit": min(limit, 100),
        }
        url = "https://openlibrary.org/search.json"
        try:
            resp = requests.get(
                url, params=params, timeout=self.timeout,
                verify=self.verify_ssl
            )
            resp.raise_for_status()
            data = resp.json()
        except Exception:
            return []

        items: List[Dict[str, object]] = []
        docs = data.get("docs", [])[:limit]
        for d in docs:
            title = d.get("title") or ""
            authors = d.get("author_name") or []
            isbns = d.get("isbn") or []
            key = d.get("key") or title
            url = f"https://openlibrary.org{key}"
            work_id = make_id("ol", key)
            topics = d.get("subject") or []
            publish_year = str(d.get("first_publish_year") or "")
            lang_values = d.get("language") or []
            lang = lang_values[0] if lang_values else None
            items.append(self.book(
                id=work_id,
                title=title,
                authors=authors,
                summary="",
                topics=topics[:5],
                language=lang,
                isbn=isbns[0] if isbns else None,
                url=url,
                publisher=(d.get("publisher") or [""])[0],
                publication_date=publish_year,
                keywords=(d.get("subject_key") or [])[:10]
            ))
        return items
