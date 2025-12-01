"""Document upload/query endpoints (AskYourPDF-style)."""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.schemas.docs import (
    DocListResponse,
    DocQueryRequest,
    DocQueryResponse,
    DocUploadResponse,
)
from app.services.docs import DocumentService, list_documents

router = APIRouter()


def get_service() -> DocumentService:
    try:
        return DocumentService()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc


@router.get("/docs", response_model=DocListResponse)
async def docs_list() -> DocListResponse:
    """List uploaded documents."""
    return DocListResponse(documents=list_documents())


@router.post("/docs/upload", response_model=DocUploadResponse)
async def upload_doc(
    file: UploadFile = File(...),
    title: str | None = None,
    language: str | None = None,
    community: str | None = None,
    service: DocumentService = Depends(get_service),
) -> DocUploadResponse:
    """Upload and ingest a document (PDF/TXT/MD)."""
    document = await service.upload_document(
        file=file,
        title=title,
        language=language,
        community=community,
    )
    return DocUploadResponse(
        document=document,
        message="Document ingested successfully.",
    )


@router.post("/docs/query", response_model=DocQueryResponse)
async def query_docs(
    request: DocQueryRequest,
    service: DocumentService = Depends(get_service),
) -> DocQueryResponse:
    """Query uploaded documents and get an LLM-backed answer."""
    return await service.query(request)
