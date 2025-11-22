"""
Japan National Diet Library (NDL) provider
API: https://iss.ndl.go.jp/information/api/en/index.html
We use NDL Search API (JSON)
"""
from __future__ import annotations

import requests
from typing import Dict, List

from .base import Provider, make_id


class NDLProvider(Provider):
    name = "NDL"

    def fetch(self, query: Dict[str, str]) -> List[Dict[str, object]]:
        q = query.get("q") or "indigenous language"
        limit = int(query.get("limit") or self.limit)
        params = {
            "any": q,
            "cnt": min(limit, 100),
            "format": "json"
        }
        url = "https://iss.ndl.go.jp/api/opensearch"
        try:
            resp = requests.get(
                url,
                params=params,
                timeout=self.timeout,
                verify=self.verify_ssl
            )
            resp.raise_for_status()
            data = resp.json()
        except Exception:
            return []

        items: List[Dict[str, object]] = []
        channel = data.get("channel", {})
        entries = channel.get("item", [])
        for e in entries[:limit]:
            title = e.get("title") or ""
            authors = []
            if isinstance(e.get("author"), list):
                authors = e.get("author")
            elif e.get("author"):
                authors = [e.get("author")]
            link = e.get("link") or ""
            pub_date = e.get("pubDate") or ""
            subjects = e.get("subject") or []
            if isinstance(subjects, str):
                subjects = [subjects]
            # ISBN may be in description; NDL JSON varies
            isbn = ""
            desc = e.get("description") or ""
            for token in desc.split():
                cleaned_token = token.replace("-", "")
                if (
                    cleaned_token.isdigit()
                    and (10 <= len(cleaned_token) <= 13)
                ):
                    isbn = token
                    break
            work_id = make_id("ndl", link or title)
            items.append(self.book(
                id=work_id,
                title=title,
                authors=authors,
                summary=e.get("description") or "",
                topics=subjects[:5],
                language=None,
                isbn=isbn or None,
                url=link,
                publisher=(
                    e.get("dc:publisher") if e.get("dc:publisher") else None
                ),
                publication_date=pub_date,
                reading_level="general",
                keywords=subjects[:10]
            ))
        return items
