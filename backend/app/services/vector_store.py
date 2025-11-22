"""
生產級向量資料庫與 RAG 系統
支援 ChromaDB + 語義搜尋 + 文檔嵌入
"""
from typing import Any
import uuid
from datetime import datetime

from langchain_openai import OpenAIEmbeddings
from pydantic import SecretStr
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

from app.core.config import settings


class ProductionVectorStore:
    """生產級向量資料庫（ChromaDB + OpenAI Embeddings）"""

    def __init__(self, collection_name: str = "modernreader_docs"):
        self.embeddings = OpenAIEmbeddings(
            model="text-embedding-3-large",  # 最新最強的 embedding 模型
            api_key=SecretStr(settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None,
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,  # 每個 chunk 約 1000 字符
            chunk_overlap=200,  # 重疊 200 字符保持上下文連貫
            separators=["\n\n", "\n", "。", "！", "？", " ", ""],
        )
        self.collection_name = collection_name
        self.vector_store: Chroma | None = None

    async def initialize(self, persist_directory: str = "./chroma_db"):
        """初始化向量資料庫"""
        self.vector_store = Chroma(
            collection_name=self.collection_name,
            embedding_function=self.embeddings,
            persist_directory=persist_directory,
        )

    async def ingest_documents(
        self,
        texts: list[str],
        metadatas: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """
        文檔嵌入與索引

        Args:
            texts: 文檔內容列表
            metadatas: 每個文檔的元數據（document_id, title, language 等）

        Returns:
            嵌入結果統計
        """
        if not self.vector_store:
            await self.initialize()

        all_chunks = []
        all_metadatas = []

        for text, metadata in zip(texts, metadatas):
            # 分割文檔
            chunks = self.text_splitter.split_text(text)

            # 為每個 chunk 附加元數據
            for i, chunk in enumerate(chunks):
                chunk_metadata = {
                    **metadata,
                    "chunk_index": i,
                    "chunk_id": str(uuid.uuid4()),
                    "ingested_at": datetime.utcnow().isoformat(),
                }
                all_chunks.append(chunk)
                all_metadatas.append(chunk_metadata)

        # 批量嵌入
        documents = [
            Document(page_content=chunk, metadata=meta)
            for chunk, meta in zip(all_chunks, all_metadatas)
        ]

        assert self.vector_store is not None
        self.vector_store.add_documents(documents)

        return {
            "total_documents": len(texts),
            "total_chunks": len(all_chunks),
            "avg_chunks_per_doc": len(all_chunks) / len(texts),
            "status": "success",
        }

    async def semantic_search(
        self,
        query: str,
        top_k: int = 5,
        filter_dict: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        """
        語義搜尋

        Args:
            query: 查詢文本
            top_k: 返回前 k 個結果
            filter_dict: 元數據過濾（例如 {"language": "zh-TW"}）

        Returns:
            搜尋結果列表，包含 content, metadata, score
        """
        if not self.vector_store:
            await self.initialize()

        # ChromaDB 的相似度搜尋（with score）
        assert self.vector_store is not None
        results = self.vector_store.similarity_search_with_score(
            query, k=top_k, filter=filter_dict
        )

        return [
            {
                "content": doc.page_content,
                "metadata": doc.metadata,
                "score": float(score),
            }
            for doc, score in results
        ]

    async def hybrid_search(
        self,
        query: str,
        top_k: int = 5,
        semantic_weight: float = 0.7,
        keyword_weight: float = 0.3,
    ) -> list[dict[str, Any]]:
        """
        混合搜尋（語義 + 關鍵詞）

        Args:
            query: 查詢文本
            top_k: 返回前 k 個結果
            semantic_weight: 語義搜尋權重
            keyword_weight: 關鍵詞搜尋權重

        Returns:
            重排序後的搜尋結果
        """
        # 1. 語義搜尋
        semantic_results = await self.semantic_search(query, top_k * 2)

        # 2. 簡單的關鍵詞匹配（在語義結果中）
        query_keywords = set(query.lower().split())
        for result in semantic_results:
            content_keywords = set(result["content"].lower().split())
            keyword_score = len(
                query_keywords.intersection(content_keywords)
            ) / len(query_keywords)

            # 混合評分
            result["hybrid_score"] = (
                result["score"] * semantic_weight
                + keyword_score * keyword_weight
            )

        # 3. 重排序
        semantic_results.sort(key=lambda x: x["hybrid_score"], reverse=True)

        return semantic_results[:top_k]

    async def delete_documents(
        self, filter_dict: dict[str, Any]
    ) -> dict[str, Any]:
        """刪除文檔（根據元數據過濾）"""
        if not self.vector_store:
            await self.initialize()
        # ChromaDB 的刪除操作
        assert self.vector_store is not None
        self.vector_store.delete(filter=filter_dict)

        return {"status": "deleted", "filter": filter_dict}


# 全局實例（單例模式）
_vector_store_instance: ProductionVectorStore | None = None


def get_vector_store() -> ProductionVectorStore:
    """獲取向量資料庫實例（單例）"""
    global _vector_store_instance
    if _vector_store_instance is None:
        _vector_store_instance = ProductionVectorStore()
    return _vector_store_instance
