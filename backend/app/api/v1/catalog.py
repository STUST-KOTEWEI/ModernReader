"""Catalog discovery endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.catalog import CatalogQuery, CatalogSearchResponse
from app.services.catalog import CatalogService

router = APIRouter()


def get_catalog_service(db: Session = Depends(get_db)) -> CatalogService:
    return CatalogService(db)


@router.get("/search", response_model=CatalogSearchResponse)
async def search_catalog(
    query: CatalogQuery = Depends(),
    service: CatalogService = Depends(get_catalog_service),
) -> CatalogSearchResponse:
    return await service.search(query)
