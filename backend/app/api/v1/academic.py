from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel

from app.services.academic import AcademicPaperService
from app.schemas.catalog import CatalogItem, CatalogSearchResponse

router = APIRouter()

@router.get("/search", response_model=CatalogSearchResponse)
async def search_academic_papers(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(10, ge=1, le=50),
    source: Optional[str] = Query(None, description="Filter by source: arxiv, ieee, acm")
):
    """
    Search for academic papers from ArXiv, IEEE, ACM (via OpenAlex).
    """
    service = AcademicPaperService()
    
    # If source is specific, we might optimize, but for now we search all or specific
    # The service currently does 'all' or specific methods. 
    # I'll just call search_all for now, filtering logic can be added to service later if needed.
    
    try:
        results = await service.search_all(q, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Map to CatalogItem
    catalog_items = []
    for r in results:
        # Filter if source is requested
        if source and source.lower() not in r['source'].lower():
            continue
            
        item = CatalogItem(
            id=r['id'],
            title=r['title'],
            authors=r['authors'],
            language="en", # Mostly English
            topics=r['metadata'].get('categories', []),
            summary=r['summary'],
            source=r['source'],
            metadata={
                "url": r['url'],
                "pdf_url": r['pdf_url'],
                "published": r['published'],
                **r['metadata']
            }
        )
        catalog_items.append(item)

    return CatalogSearchResponse(
        results=catalog_items,
        total=len(catalog_items) # This is just page total, strictly speaking
    )
