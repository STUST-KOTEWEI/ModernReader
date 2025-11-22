"""
生產級 RAG 服務
=====================================================

整合 FAISS 向量資料庫 + 世界級 LLM 引擎
實現真實的文檔嵌入、語義檢索、智能問答

特性:
- 文檔自動分割與嵌入
- 語義相似度檢索
- LLM 生成文化適切答案
- 可解釋性 (顯示引用來源)
- 混合檢索 (向量 + 關鍵詞)
"""

from datetime import datetime
import uuid
from typing import List, Dict, Any
from typing import Optional

from sqlalchemy.orm import Session

from app.models.catalog import Book
from app.schemas.rag import (
    RAGIngestRequest,
    RAGIngestResponse,
    RAGQueryRequest,
    RAGQueryResponse,
    RAGSnippet
)
from app.services.vector_store_faiss import get_vector_store_faiss
from app.services.ai_engine import get_ai_engine


class RAGService:
    """生產級 RAG 服務 (Retrieval-Augmented Generation)"""
    
    def __init__(self, db: Session):
        self.db = db
        # 使用 FAISS 向量資料庫
        self.vector_store = get_vector_store_faiss()
        # 使用世界級 AI 引擎
        self.ai_engine = get_ai_engine()

    async def ingest(self, request: RAGIngestRequest) -> RAGIngestResponse:
        """
        文檔攝取: 嵌入並索引
        
        1. 分割文檔為 chunks
        2. 生成向量嵌入
        3. 存入 FAISS 索引
        4. 持久化
        """
        try:
            # 準備元數據
            metadata = {
                "document_id": request.document_id,
                "title": request.title,
                "language": request.language or "zh-TW",
                "content_type": "book",
                "ingested_at": datetime.now().isoformat()
            }
            
            # 執行嵌入
            _ = await self.vector_store.ingest_documents(
                texts=[request.content],
                metadatas=[metadata],
                ids=[request.document_id]
            )
            
            job_id = str(uuid.uuid4())
            
            return RAGIngestResponse(
                job_id=job_id,
                status="completed",
            )
        
        except Exception:
            return RAGIngestResponse(
                job_id=str(uuid.uuid4()),
                status="failed",
            )

    async def query(self, request: RAGQueryRequest) -> RAGQueryResponse:
        """
        智能問答: RAG 完整工作流
        
        1. 語義檢索相關文檔片段
        2. 構建上下文
        3. LLM 生成文化適切答案
        4. 返回答案 + 引用來源
        """
        try:
            # 1. 語義檢索
            search_results = await self.vector_store.semantic_search(
                query=request.query,
                top_k=request.top_k or 5,
                filter_dict={
                    "language": request.language
                } if request.language else {}
            )
            
            if not search_results:
                return self._fallback_response(request)
            
            # 2. 構建上下文
            context_parts = []
            for i, result in enumerate(search_results[:3], 1):
                context_parts.append(
                    f"[來源 {i}: {result['metadata'].get('title', '未知')}]\n"
                    f"{result['content']}"
                )
            
            context = "\n\n---\n\n".join(context_parts)
            
            # 3. LLM 生成答案
            prompt = self._build_prompt(
                query=request.query,
                context=context,
                language=request.language or "zh-TW"
            )
            
            answer = await self.ai_engine.generate_adaptive_content(
                prompt=prompt,
                cognitive_load=0.5,  # 中等認知負荷
                cultural_context={
                    "language": request.language or "zh-TW",
                    "formality": "moderate"
                }
            )
            
            # 4. 格式化引用片段
            snippets = [
                RAGSnippet(
                    text=result["content"][:300],
                    source=result["metadata"].get("title", "未知來源"),
                    score=result["similarity"]
                )
                for result in search_results
            ]
            
            return RAGQueryResponse(
                answer=answer,
                snippets=snippets,
                generated_at=datetime.now()
            )
        
        except Exception as e:
            print(f"❌ RAG 查詢失敗: {e}")
            return self._fallback_response(request, error=str(e))
    
    async def ingest_book_catalog(self) -> Dict[str, Any]:
        """
        批次攝取書籍目錄
        從資料庫讀取所有書籍並嵌入
        """
        books = self.db.query(Book).limit(100).all()
        
        if not books:
            return {
                "status": "no_books",
                "message": "資料庫中無書籍資料"
            }
        
        # 批次嵌入
        texts = []
        metadatas = []
        ids = []
        
        for book in books:
            # 組合書籍完整資訊
            authors = (
                ", ".join(book.authors)
                if getattr(book, "authors", None)
                else "未知"
            )
            full_text = f"""
標題: {book.title}
作者: {authors}
語言: {book.language or '未指定'}
摘要: {book.summary or '無摘要'}
            """.strip()
            
            texts.append(full_text)
            metadatas.append({
                "document_id": str(book.id),
                "title": book.title,
                "authors": getattr(book, "authors", []),
                "language": book.language,
                "content_type": "book_catalog"
            })
            ids.append(f"book_{book.id}")
        
        result = await self.vector_store.ingest_documents(
            texts=texts,
            metadatas=metadatas,
            ids=ids
        )
        
        return {
            "status": "success",
            "books_ingested": len(books),
            "total_chunks": result.get("total_chunks", 0),
            "message": f"✅ 已嵌入 {len(books)} 本書籍"
        }
    
    async def get_stats(self) -> Dict[str, Any]:
        """獲取 RAG 系統統計"""
        vector_stats = await self.vector_store.get_stats()
        
        return {
            "vector_store": vector_stats,
            "ai_engine": {
                "providers": ["OpenAI", "Anthropic", "Google"],
                "fallback": "enabled"
            },
            "status": "operational"
        }
    
    def _build_prompt(
        self,
        query: str,
        context: str,
        language: str
    ) -> str:
        """構建 RAG 提示詞"""
        return f"""你是 ModernReader 的 AI 閱讀助手,專門協助理解文化多樣性內容。

請基於以下文檔片段回答用戶問題:

{context}

---

用戶問題: {query}

請用 {language} 回答,注意:
1. 引用上述文檔內容
2. 保持文化適切性
3. 如果文檔中沒有相關資訊,請誠實說明
4. 用簡單易懂的語言解釋複雜概念

答案:"""
    
    def _fallback_response(
        self,
        request: RAGQueryRequest,
        error: Optional[str] = None
    ) -> RAGQueryResponse:
        """備援回應 (當檢索失敗時)"""
        # 嘗試從資料庫查詢
        stmt = self.db.query(Book).order_by(Book.created_at.desc())
        if request.language:
            stmt = stmt.filter(Book.language == request.language)
        book = stmt.first()
        
        snippets: List[RAGSnippet] = []
        if book:
            snippets.append(
                RAGSnippet(
                    text=book.summary[:200] if book.summary else "無摘要",
                    source=book.title,
                    score=0.5,
                )
            )
        
        answer = f"""抱歉,目前向量資料庫中暫無相關內容。

{f'錯誤資訊: {error}' if error else ''}

建議閱讀: {book.title if book else '請先攝取文檔到系統中'}

提示: 使用 /api/v1/rag/ingest 端點來添加文檔內容。
"""
        
        return RAGQueryResponse(
            answer=answer,
            snippets=snippets,
            generated_at=datetime.now()
        )
