"""
Auto crawl multiple public library sources using providers and sources.yaml
"""
from __future__ import annotations

import json
import time
from pathlib import Path
from datetime import datetime
from typing import Dict, List

import yaml

from providers import OpenLibraryProvider, NDLProvider, Provider

BASE_DIR = Path('/Users/kedewei/modernreader/data/catalogs')
CONFIG_FILE = Path('/Users/kedewei/modernreader/data/ingestion/sources.yaml')
OUTPUT_FILE = BASE_DIR / 'public_library_books.json'


def provider_factory(name: str, **kw) -> Provider:
    name = name.lower()
    if name == 'openlibrary':
        return OpenLibraryProvider(**kw)
    if name == 'ndl':
        return NDLProvider(**kw)
    raise ValueError(f'Unsupported provider: {name}')


def dedup(books: List[Dict]) -> List[Dict]:
    seen = set()
    out = []
    for b in books:
        bid = b.get('id')
        if not bid or bid in seen:
            continue
        seen.add(bid)
        out.append(b)
    return out


def run():
    cfg = yaml.safe_load(open(CONFIG_FILE, 'r', encoding='utf-8'))
    providers_cfg = cfg.get('providers', [])

    all_books: List[Dict] = []
    for p in providers_cfg:
        if not p.get('enabled', True):
            continue
        name = p['name']
        limit = p.get('limit', 50)
        verify_ssl = p.get('verify_ssl', True)
        prov = provider_factory(name, limit=limit, verify_ssl=verify_ssl)
        queries = p.get('queries', [])
        for q in queries:
            try:
                books = prov.fetch(q)
                all_books.extend(books)
            except Exception:
                # continue on error
                pass
            time.sleep(0.5)

    all_books = dedup(all_books)

    payload = {
        'metadata': {
            'generated_at': datetime.now().isoformat(),
            'total_books': len(all_books),
            'sources': list(
                sorted({b['metadata']['source'] for b in all_books})
            ),
        },
        'books': all_books,
    }
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"✓ Auto crawl completed: {len(all_books)} books -> {OUTPUT_FILE}")


if __name__ == '__main__':
    run()
