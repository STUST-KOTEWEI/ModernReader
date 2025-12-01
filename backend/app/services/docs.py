"""Document upload and QA service (AskYourPDF-style)."""

from __future__ import annotations

import json
import uuid
from datetime import datetime
from pathlib import Path
from threading import Lock
from typing import Optional

from fastapi import HTTPException, UploadFile
from pypdf import PdfReader

from app.core.config import settings
from app.schemas.docs import (
    DocQueryRequest,
    DocQueryResponse,
    DocQuerySnippet,
    DocumentRecord,
)
from app.services.ai_engine import get_ai_engine
from app.services.vector_store import get_vector_store

# Paths
BACKEND_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = BACKEND_ROOT.parent / "data" / "uploads"
DATA_DIR.mkdir(parents=True, exist_ok=True)
INDEX_PATH = DATA_DIR / "index.json"
_INDEX_LOCK = Lock()


def _load_index() -> list[dict]:
    """Load document index from disk."""
    if not INDEX_PATH.exists():
        return []
    try:
        return json.loads(INDEX_PATH.read_text())
    except Exception:
        return []


def _save_index(entries: list[dict]) -> None:
    """Persist document index to disk."""
    with _INDEX_LOCK:
        INDEX_PATH.write_text(json.dumps(entries, ensure_ascii=False, indent=2))


def list_documents() -> list[DocumentRecord]:
    """Return all recorded documents."""
    raw = _load_index()
    documents: list[DocumentRecord] = []
    for item in raw:
        try:
            documents.append(DocumentRecord(**item))
        except Exception:
            # Skip corrupted entries
            continue
    # Order by newest first
    documents.sort(key=lambda d: d.uploaded_at, reverse=True)
    return documents


def _record_document(record: DocumentRecord) -> None:
    """Append a document record to index."""
    entries = _load_index()
    # Serialize using JSON-compatible types (e.g., datetime -> ISO string)
    entries.append(record.model_dump(mode="json"))
    _save_index(entries)


def _extract_text(file_path: Path, content_type: str) -> tuple[str, Optional[int]]:
    """Extract text from PDF or plain text files."""
    suffix = file_path.suffix.lower()
    if suffix == ".pdf":
        reader = PdfReader(str(file_path))
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n".join(pages), len(reader.pages)
    if suffix in {".txt", ".md"}:
        return file_path.read_text(encoding="utf-8", errors="ignore"), None
    raise HTTPException(status_code=400, detail="Only PDF, TXT, or MD files are supported.")


class DocumentService:
    """Handles document ingestion and QA."""

    def __init__(self):
        if not settings.OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY is required for document embeddings.")
        self.vector_store = get_vector_store()
        self.ai_engine = get_ai_engine()

    async def upload_document(
        self,
        file: UploadFile,
        title: Optional[str] = None,
        language: Optional[str] = None,
        community: Optional[str] = None,
    ) -> DocumentRecord:
        """Save, ingest, and record a document."""
        filename = file.filename or "upload"
        suffix = Path(filename).suffix.lower()
        if suffix not in {".pdf", ".txt", ".md"}:
            raise HTTPException(status_code=400, detail="Only PDF, TXT, or MD files are supported.")

        doc_id = str(uuid.uuid4())
        dest_path = DATA_DIR / f"{doc_id}{suffix}"

        # Persist upload
        content = await file.read()
        dest_path.write_bytes(content)

        text, page_count = _extract_text(dest_path, file.content_type or "")
        if not text.strip():
            raise HTTPException(status_code=400, detail="Uploaded file is empty or unreadable.")

        metadata = {
            "document_id": doc_id,
            "title": title or Path(filename).stem,
            "language": language or "zh-TW",
            "community": community,
            "content_type": suffix.replace(".", ""),
        }

        ingest_result = await self.vector_store.ingest_documents(
            texts=[text],
            metadatas=[metadata],
        )

        chunk_counts = ingest_result.get("doc_chunk_counts") or []
        chunk_count = chunk_counts[0] if chunk_counts else ingest_result.get("total_chunks", 0)

        record = DocumentRecord(
            id=doc_id,
            title=metadata["title"],
            filename=filename,
            language=metadata["language"],
            community=metadata["community"],
            content_type=metadata["content_type"],
            size_bytes=len(content),
            page_count=page_count,
            chunk_count=chunk_count,
            uploaded_at=datetime.utcnow(),
        )

        _record_document(record)
        return record

    async def query(self, request: DocQueryRequest) -> DocQueryResponse:
        """Query ingested documents and generate an answer."""
        filter_dict: dict[str, object] | None = {}
        if request.doc_ids:
            filter_dict["document_id"] = {"$in": request.doc_ids}
        if request.language:
            filter_dict["language"] = request.language
        if request.community:
            filter_dict["community"] = request.community
        if not filter_dict:
            filter_dict = None

        search_results = await self.vector_store.semantic_search(
            query=request.question,
            top_k=request.top_k or 5,
            filter_dict=filter_dict,
        )

        if not search_results:
            return DocQueryResponse(
                answer="目前沒有找到相關內容，試著上傳文件或調整提問。",
                snippets=[],
                generated_at=datetime.utcnow(),
            )

        context_parts = []
        snippets: list[DocQuerySnippet] = []
        for idx, result in enumerate(search_results, start=1):
            metadata = result.get("metadata", {})
            title = metadata.get("title") or "未命名文件"
            context_parts.append(f"[{idx}] {title}\n{result['content']}")
            snippets.append(
                DocQuerySnippet(
                    text=result["content"][:500],
                    document_id=metadata.get("document_id", ""),
                    title=title,
                    score=float(result.get("score", 0.0)),
                )
            )

        context_block = "\n\n---\n\n".join(context_parts[:3])
        persona = (request.persona or "guide").lower()
        persona_prompt = {
            "elder": "以長者/傳承者的口吻，保持尊重與謙遜。",
            "scholar": "以研究者的口吻，精確、條理化，必要時指出不確定之處。",
            "guide": "以導覽員的口吻，清晰、溫暖，適度解釋背景。",
        }.get(persona, "以導覽員的口吻，清晰、溫暖。")

        prompt = (
            f"{persona_prompt} 你是一位閱讀助理，請根據以下文件片段回答使用者問題，"
            "若不確定請誠實說明，並使用引用編號標示來源。\n\n"
            f"使用者問題：{request.question}\n\n"
            f"文件片段：\n{context_block}\n\n"
            "回答時請附上來源編號，例如 [1]、[2]，並避免捏造。"
        )

        answer = await self.ai_engine.generate_adaptive_content(
            prompt=prompt,
            cognitive_load=0.4,
            cultural_context={"language": request.language or "zh-TW"},
        )

        return DocQueryResponse(
            answer=answer,
            snippets=snippets,
            generated_at=datetime.utcnow(),
        )
