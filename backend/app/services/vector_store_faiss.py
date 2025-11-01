"""
生產級向量資料庫服務 (使用 FAISS)
===========================================

避免 ChromaDB 在 Python 3.12+ 的相容性問題
使用 Facebook AI Similarity Search (FAISS) 實現高效向量檢索

特性:
- 文檔嵌入與索引
- 語義相似度搜尋
- 持久化儲存
- 元數據過濾
- 混合檢索 (向量 + 關鍵詞)

安裝依賴:
pip install faiss-cpu langchain-community langchain-openai
"""

from typing import List, Dict, Optional, Tuple, Any
import os
import json
import numpy as np
from datetime import datetime
from pathlib import Path

try:
    import faiss
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    from langchain_openai import OpenAIEmbeddings
    from langchain_community.vectorstores import FAISS
    from langchain_community.docstore.in_memory import InMemoryDocstore
    from langchain.schema import Document
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False
    print("⚠️  FAISS 未安裝,使用 mock 模式")


class ProductionVectorStoreFAISS:
    """生產級向量資料庫 (FAISS 後端)"""
    
    def __init__(
        self,
        storage_path: str = "./vectors",
        embedding_model: str = "text-embedding-3-small",
        chunk_size: int = 1000,
        chunk_overlap: int = 200
    ):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        
        self.embedding_model = embedding_model
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        
        # Mock 模式或真實模式
        self.mock_mode = not FAISS_AVAILABLE
        
        if not self.mock_mode:
            # 使用 OpenAI embeddings
            self.embeddings = OpenAIEmbeddings(
                model=self.embedding_model,
                # 自動從環境變數讀取 OPENAI_API_KEY
            )
            
            # 文本分割器
            self.text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=self.chunk_size,
                chunk_overlap=self.chunk_overlap,
                length_function=len,
                separators=["\n\n", "\n", "。", "!", "?", ",", " ", ""]
            )
            
            # FAISS 向量存儲
            self.vector_store: Optional[FAISS] = None
            self._load_or_create_index()
        else:
            # Mock 資料
            self.mock_documents = []
    
    def _load_or_create_index(self):
        """載入現有索引或創建新索引"""
        index_path = self.storage_path / "faiss_index"
        
        if index_path.exists():
            try:
                self.vector_store = FAISS.load_local(
                    str(index_path),
                    self.embeddings,
                    allow_dangerous_deserialization=True
                )
                print(f"✅ 已載入 FAISS 索引: {index_path}")
            except Exception as e:
                print(f"⚠️  載入索引失敗: {e}, 創建新索引")
                self.vector_store = None
    
    async def ingest_documents(
        self,
        texts: List[str],
        metadatas: List[Dict] = None,
        ids: List[str] = None
    ) -> Dict[str, Any]:
        """
        文檔攝取與嵌入
        
        Args:
            texts: 文檔內容列表
            metadatas: 元數據列表 (與 texts 對應)
            ids: 文檔 ID 列表
            
        Returns:
            攝取結果統計
        """
        if self.mock_mode:
            return self._mock_ingest(texts, metadatas, ids)
        
        if metadatas is None:
            metadatas = [{} for _ in texts]
        
        if ids is None:
            ids = [f"doc_{i}_{datetime.now().timestamp()}" for i in range(len(texts))]
        
        # 分割文檔
        all_chunks = []
        all_chunk_metadatas = []
        
        for text, metadata, doc_id in zip(texts, metadatas, ids):
            # 加入文檔 ID 到元數據
            metadata["document_id"] = doc_id
            metadata["ingested_at"] = datetime.now().isoformat()
            
            # 分割文本
            chunks = self.text_splitter.split_text(text)
            
            # 為每個 chunk 創建 Document
            for i, chunk in enumerate(chunks):
                chunk_metadata = metadata.copy()
                chunk_metadata["chunk_index"] = i
                chunk_metadata["chunk_total"] = len(chunks)
                
                all_chunks.append(chunk)
                all_chunk_metadatas.append(chunk_metadata)
        
        # 嵌入與索引
        documents = [
            Document(page_content=chunk, metadata=meta)
            for chunk, meta in zip(all_chunks, all_chunk_metadatas)
        ]
        
        if self.vector_store is None:
            # 創建新索引
            self.vector_store = FAISS.from_documents(
                documents,
                self.embeddings
            )
        else:
            # 添加到現有索引
            self.vector_store.add_documents(documents)
        
        # 持久化
        self._save_index()
        
        return {
            "status": "success",
            "documents_ingested": len(texts),
            "total_chunks": len(all_chunks),
            "average_chunks_per_doc": len(all_chunks) / len(texts),
            "timestamp": datetime.now().isoformat()
        }
    
    async def semantic_search(
        self,
        query: str,
        top_k: int = 5,
        filter_dict: Dict = None,
        score_threshold: float = 0.0
    ) -> List[Dict[str, Any]]:
        """
        語義相似度搜尋
        
        Args:
            query: 查詢文本
            top_k: 返回結果數量
            filter_dict: 元數據過濾條件
            score_threshold: 最低相似度閾值
            
        Returns:
            搜尋結果列表,包含內容、元數據、分數
        """
        if self.mock_mode:
            return self._mock_search(query, top_k)
        
        if self.vector_store is None:
            return []
        
        # 執行相似度搜尋
        results = self.vector_store.similarity_search_with_score(
            query,
            k=top_k,
            filter=filter_dict
        )
        
        # 格式化結果
        formatted_results = []
        for doc, score in results:
            # FAISS 返回的是距離,轉換為相似度 (距離越小越相似)
            similarity = 1.0 / (1.0 + score)
            
            if similarity >= score_threshold:
                formatted_results.append({
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "similarity": similarity,
                    "distance": float(score)
                })
        
        return formatted_results
    
    async def hybrid_search(
        self,
        query: str,
        top_k: int = 5,
        keywords: List[str] = None,
        alpha: float = 0.7  # 向量搜尋權重 (0-1)
    ) -> List[Dict[str, Any]]:
        """
        混合檢索: 結合向量搜尋與關鍵詞匹配
        
        Args:
            query: 查詢文本
            top_k: 返回結果數量
            keywords: 關鍵詞列表
            alpha: 向量搜尋權重 (1-alpha 為關鍵詞權重)
            
        Returns:
            混合檢索結果
        """
        # 1. 向量搜尋
        vector_results = await self.semantic_search(query, top_k * 2)
        
        # 2. 關鍵詞匹配 (簡單實現)
        if keywords:
            for result in vector_results:
                keyword_score = sum(
                    1 for kw in keywords
                    if kw.lower() in result["content"].lower()
                ) / len(keywords) if keywords else 0
                
                # 混合分數
                result["hybrid_score"] = (
                    alpha * result["similarity"] +
                    (1 - alpha) * keyword_score
                )
            
            # 重新排序
            vector_results.sort(key=lambda x: x.get("hybrid_score", 0), reverse=True)
        
        return vector_results[:top_k]
    
    async def get_document_by_id(self, document_id: str) -> Optional[Dict[str, Any]]:
        """根據文檔 ID 檢索"""
        results = await self.semantic_search(
            query="",  # 空查詢
            top_k=100,
            filter_dict={"document_id": document_id}
        )
        
        if results:
            # 合併所有 chunks
            chunks = sorted(results, key=lambda x: x["metadata"].get("chunk_index", 0))
            full_content = "\n\n".join([r["content"] for r in chunks])
            
            return {
                "document_id": document_id,
                "content": full_content,
                "metadata": chunks[0]["metadata"],
                "chunk_count": len(chunks)
            }
        
        return None
    
    async def delete_document(self, document_id: str) -> Dict[str, Any]:
        """刪除文檔 (FAISS 不直接支援刪除,需要重建索引)"""
        if self.mock_mode:
            self.mock_documents = [
                d for d in self.mock_documents
                if d.get("metadata", {}).get("document_id") != document_id
            ]
            return {"status": "success", "deleted": document_id}
        
        # 注意: FAISS 不支援直接刪除,這裡返回提示
        return {
            "status": "not_implemented",
            "message": "FAISS 不支援直接刪除,請考慮定期重建索引或使用其他向量資料庫"
        }
    
    def _save_index(self):
        """持久化 FAISS 索引"""
        if self.vector_store:
            index_path = self.storage_path / "faiss_index"
            self.vector_store.save_local(str(index_path))
            print(f"✅ FAISS 索引已保存: {index_path}")
    
    async def get_stats(self) -> Dict[str, Any]:
        """獲取統計資訊"""
        if self.mock_mode:
            return {
                "mode": "mock",
                "total_documents": len(self.mock_documents),
                "embedding_model": self.embedding_model
            }
        
        if self.vector_store:
            # FAISS 統計
            return {
                "mode": "production",
                "index_type": "FAISS",
                "total_vectors": self.vector_store.index.ntotal,
                "embedding_model": self.embedding_model,
                "embedding_dimension": self.vector_store.index.d,
                "storage_path": str(self.storage_path)
            }
        
        return {"mode": "production", "status": "no_index"}
    
    # ==================== Mock 模式方法 ====================
    
    def _mock_ingest(self, texts, metadatas, ids):
        """Mock 文檔攝取"""
        for i, text in enumerate(texts):
            self.mock_documents.append({
                "id": ids[i] if ids else f"mock_{i}",
                "content": text,
                "metadata": metadatas[i] if metadatas else {},
                "ingested_at": datetime.now().isoformat()
            })
        
        return {
            "status": "success (mock mode)",
            "documents_ingested": len(texts),
            "total_chunks": len(texts),
            "average_chunks_per_doc": 1.0
        }
    
    def _mock_search(self, query: str, top_k: int):
        """Mock 語義搜尋"""
        # 簡單的關鍵詞匹配
        results = []
        query_lower = query.lower()
        
        for doc in self.mock_documents:
            content = doc["content"].lower()
            # 計算簡單的相似度 (關鍵詞出現次數)
            similarity = sum(
                1 for word in query_lower.split()
                if word in content
            ) / max(len(query_lower.split()), 1)
            
            if similarity > 0:
                results.append({
                    "content": doc["content"][:500],
                    "metadata": doc["metadata"],
                    "similarity": similarity,
                    "distance": 1.0 - similarity
                })
        
        # 排序並返回 top_k
        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:top_k]


# 全局單例
_vector_store_instance = None


def get_vector_store_faiss() -> ProductionVectorStoreFAISS:
    """獲取全局向量資料庫實例 (FAISS)"""
    global _vector_store_instance
    if _vector_store_instance is None:
        _vector_store_instance = ProductionVectorStoreFAISS()
    return _vector_store_instance
