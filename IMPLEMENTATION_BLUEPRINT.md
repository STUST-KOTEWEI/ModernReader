# ModernReader 世界頂級版本 —完整實作藍圖

> **目標**：在 12 個月內，將 ModernReader 打造成世界最頂級的多模態 AI 閱讀平台
>
> **當前進度**：
>
> - ✅ 世界級 LLM 引擎架構（已完成 40+ 套件安裝）
> - ✅ 多provider fallback 機制（OpenAI + Anthropic + Google）
> - ⏳ 向量資料庫整合（因 Python 3.14 相容性問題待解決）
> - ⏳ 其餘 9 大模組待實作

---

## 📦 已安裝的核心套件

```bash
# LLM & AI
openai==2.6.1
anthropic==0.72.0
langchain==1.0.3
langchain-openai==1.0.1
langchain-anthropic==1.0.1
langchain-google-genai==3.0.0

# 已建立的檔案
backend/app/core/llm_config.py      # LLM 配置管理
backend/app/services/ai_engine.py   # 世界級 AI 引擎
```

---

## 🏗️ 十大核心模組實作指南

### 1️⃣ 世界級 LLM 引擎 ✅ (80% 完成)

#### **已實作**

- ✅ 多 provider 配置（OpenAI/Anthropic/Google）
- ✅ 自動 fallback 機制
- ✅ 多模態輸入支援（text + image）
- ✅ 認知負荷自適應提示詞

#### **待完成**

```python
# backend/app/api/v1/ai.py
from fastapi import APIRouter, Depends
from app.services.ai_engine import get_ai_engine, MultimodalInput

router = APIRouter()

@router.post("/understand")
async def understand_content(
    text: str | None = None,
    image: bytes | None = None,
    context: dict | None = None
):
    """多模態理解端點"""
    engine = get_ai_engine()
    result = await engine.understand(
        MultimodalInput(text=text, image=image, context=context)
    )
    return {"content": result.content, "provider": result.provider}

@router.post("/generate")
async def generate_adaptive(
    prompt: str,
    cognitive_load: float = 0.5,
    cultural_context: dict | None = None
):
    """認知負荷自適應生成"""
    engine = get_ai_engine()
    content = await engine.generate_adaptive_content(
        prompt, cognitive_load, cultural_context
    )
    return {"generated": content}
```

#### **測試方式**

```bash
# 在 backend/.env 加入
OPENAI_API_KEY=sk-xxx
# 或 ANTHROPIC_API_KEY=sk-ant-xxx
# 或 GOOGLE_API_KEY=AIzaSy...

# 啟動後端
uvicorn app.main:app --reload

# 測試
curl -X POST http://localhost:8000/v1/ai/understand \
  -H "Content-Type: application/json" \
  -d '{"text": "解釋量子糾纏", "context": {"cognitive_load": 0.3}}'
```

---

### 2️⃣ 向量資料庫與 RAG 系統 ⚠️ (待解決相容性)

#### **問題**

- ChromaDB 依賴 pypika==0.48.9，在 Python 3.14 中 build 失敗
- AttributeError: module 'ast' has no attribute 'Str'

#### **解決方案 A（推薦）**：降級到 Python 3.12

```bash
# 使用 pyenv 切換 Python 版本
pyenv install 3.12.7
pyenv local 3.12.7

# 重新建立虛擬環境
cd backend
rm -rf .venv
poetry env use 3.12
poetry install
poetry add chromadb sentence-transformers
```

#### **解決方案 B**：使用純 LangChain + FAISS（無需 ChromaDB）

```python
# backend/app/services/vector_store.py
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter

class ProductionRAG:
    def __init__(self):
        self.embeddings = OpenAIEmbeddings(
            model="text-embedding-3-large"
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        self.vector_store = None
    
    async def ingest_documents(self, texts: list[str], metadatas: list[dict]):
        """文檔嵌入與索引"""
        chunks = []
        chunk_metadatas = []
        
        for text, metadata in zip(texts, metadatas):
            doc_chunks = self.text_splitter.split_text(text)
            chunks.extend(doc_chunks)
            chunk_metadatas.extend([metadata] * len(doc_chunks))
        
        self.vector_store = FAISS.from_texts(
            chunks,
            self.embeddings,
            metadatas=chunk_metadatas
        )
        self.vector_store.save_local("./vectors/faiss_index")
    
    async def semantic_search(
        self,
        query: str,
        top_k: int = 5,
        filter_dict: dict | None = None
    ) -> list[dict]:
        """語義搜尋"""
        if not self.vector_store:
            self.vector_store = FAISS.load_local(
                "./vectors/faiss_index",
                self.embeddings
            )
        
        results = self.vector_store.similarity_search_with_score(
            query, k=top_k
        )
        
        return [
            {
                "content": doc.page_content,
                "metadata": doc.metadata,
                "score": float(score)
            }
            for doc, score in results
        ]
```

#### **整合到現有 RAG 服務**

```python
# 替換 backend/app/services/rag.py
from app.services.vector_store import ProductionRAG
from app.services.ai_engine import get_ai_engine, MultimodalInput

class RAGService:
    def __init__(self, db: Session):
        self.db = db
        self.rag = ProductionRAG()
        self.ai_engine = get_ai_engine()
    
    async def ingest(self, request: RAGIngestRequest) -> RAGIngestResponse:
        """真實的文檔嵌入"""
        await self.rag.ingest_documents(
            texts=[request.content],
            metadatas=[{
                "document_id": request.document_id,
                "title": request.title,
                "language": request.language
            }]
        )
        return RAGIngestResponse(job_id=str(uuid.uuid4()), status="completed")
    
    async def query(self, request: RAGQueryRequest) -> RAGQueryResponse:
        """真實的 RAG 查詢"""
        # 1. 語義檢索
        snippets_raw = await self.rag.semantic_search(
            request.query,
            top_k=request.top_k
        )
        
        # 2. 構建上下文
        context = "\n\n".join([s["content"] for s in snippets_raw[:3]])
        
        # 3. LLM 生成答案
        prompt = f"""基於以下文檔片段回答問題：

{context}

問題：{request.query}

請用 {request.language or '中文'} 回答，保持文化適切性。"""
        
        answer = await self.ai_engine.generate_adaptive_content(prompt)
        
        # 4. 格式化回應
        snippets = [
            RAGSnippet(
                text=s["content"][:200],
                source=s["metadata"].get("title", "Unknown"),
                score=s["score"]
            )
            for s in snippets_raw
        ]
        
        return RAGQueryResponse(
            answer=answer,
            snippets=snippets,
            generated_at=datetime.now()
        )
```

---

### 3️⃣ 神經符號推薦引擎升級

#### **推薦引擎架構**

```python
# backend/app/services/neuro_recommender.py
import networkx as nx
from typing import Literal

ObjectiveType = Literal[
    "learning_effectiveness",
    "cultural_resonance",
    "emotional_engagement",
    "difficulty_match",
    "novelty"
]

class NeuroSymbolicRecommender:
    def __init__(self, db: Session):
        self.db = db
        self.knowledge_graph = nx.DiGraph()  # 文化知識圖譜
        self._build_cultural_graph()
    
    def _build_cultural_graph(self):
        """構建文化知識圖譜"""
        # 從資料庫載入書籍與文化標籤
        books = self.db.query(Book).all()
        
        for book in books:
            self.knowledge_graph.add_node(
                str(book.id),
                type="book",
                **book.__dict__
            )
            
            # 加入文化連結
            for topic in book.topics:
                if not self.knowledge_graph.has_node(topic):
                    self.knowledge_graph.add_node(topic, type="topic")
                self.knowledge_graph.add_edge(str(book.id), topic, relation="about")
    
    async def multi_objective_recommend(
        self,
        user: User,
        objectives: dict[ObjectiveType, float] = None
    ) -> list[dict]:
        """多目標優化推薦"""
        if objectives is None:
            objectives = {
                "learning_effectiveness": 0.3,
                "cultural_resonance": 0.25,
                "emotional_engagement": 0.2,
                "difficulty_match": 0.15,
                "novelty": 0.1
            }
        
        candidates = self._get_candidates(user)
        scored = []
        
        for candidate in candidates:
            scores = {
                "learning_effectiveness": self._score_learning(candidate, user),
                "cultural_resonance": self._score_cultural(candidate, user),
                "emotional_engagement": self._score_emotional(candidate, user),
                "difficulty_match": self._score_difficulty(candidate, user),
                "novelty": self._score_novelty(candidate, user)
            }
            
            # 加權總分
            final_score = sum(
                scores[obj] * weight
                for obj, weight in objectives.items()
            )
            
            explanation = self._generate_explanation(candidate, scores)
            
            scored.append({
                "book": candidate,
                "score": final_score,
                "breakdown": scores,
                "explanation": explanation
            })
        
        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:10]
    
    def _score_cultural(self, book: Book, user: User) -> float:
        """文化共鳴評分（利用知識圖譜）"""
        if not user.language_goal:
            return 0.5
        
        # 計算書籍在文化網路中的中心性
        try:
            centrality = nx.betweenness_centrality(self.knowledge_graph)
            book_centrality = centrality.get(str(book.id), 0)
            
            # 語言匹配
            lang_match = 1.0 if book.language == user.language_goal else 0.3
            
            return (book_centrality * 0.6 + lang_match * 0.4)
        except:
            return 0.5
    
    def _generate_explanation(self, book: Book, scores: dict) -> str:
        """可解釋性：生成推薦理由"""
        reasons = []
        
        if scores["cultural_resonance"] > 0.7:
            reasons.append(f"與你的文化背景（{book.language}）高度相關")
        
        if scores["difficulty_match"] > 0.7:
            reasons.append("難度適中，符合你的當前水平")
        
        if scores["emotional_engagement"] > 0.7:
            reasons.append("內容能引發共鳴與情感投入")
        
        if scores["novelty"] > 0.7:
            reasons.append("提供新鮮的視角與知識")
        
        return "；".join(reasons) if reasons else "綜合評估推薦"
```

---

### 4️⃣ 認知負荷優化器

#### **理論基礎**

- Cognitive Load Theory (Sweller, 1988)
- Spaced Repetition (Ebbinghaus Forgetting Curve)
- Zone of Proximal Development (Vygotsky)

#### **實作**

```python
# backend/app/services/cognitive_optimizer.py
from datetime import datetime, timedelta
import math

class CognitiveLoadOptimizer:
    """認知科學驅動的學習優化"""
    
    async def measure_load(
        self,
        user: User,
        physiological: dict | None = None  # Apple Watch 資料
    ) -> float:
        """
        認知負荷評估 (0-1)
        
        指標：
        - 閱讀速度（字/分鐘）
        - 錯誤率
        - 心率變異性（HRV from Apple Watch）
        - 任務切換頻率
        """
        # 從 session 歷史計算基線
        recent_sessions = (
            self.db.query(ReadingSession)
            .filter(ReadingSession.user_id == user.id)
            .order_by(ReadingSession.created_at.desc())
            .limit(10)
            .all()
        )
        
        if not recent_sessions:
            return 0.5  # 預設中等負荷
        
        # 計算平均閱讀時長
        avg_duration = sum(
            (s.ended_at - s.started_at).total_seconds()
            for s in recent_sessions if s.ended_at
        ) / len(recent_sessions)
        
        # 生理訊號（若有）
        hrv_factor = 1.0
        if physiological and "hrv" in physiological:
            # HRV 越低 = 壓力越大 = 負荷越高
            hrv = physiological["hrv"]
            hrv_factor = 1.0 - min(hrv / 100.0, 1.0)
        
        # 綜合評估
        load = min(1.0, avg_duration / 3600.0 * 0.7 + hrv_factor * 0.3)
        return load
    
    async def adaptive_scaffolding(
        self,
        current_load: float,
        target_load: float = 0.7  # Sweet spot
    ) -> dict:
        """動態支架調整"""
        if current_load > target_load + 0.1:
            return {
                "action": "simplify",
                "recommendations": [
                    "使用更簡單的詞彙",
                    "增加視覺輔助（圖片、圖表）",
                    "縮短段落長度",
                    "提供更多範例"
                ]
            }
        elif current_load < target_load - 0.1:
            return {
                "action": "challenge",
                "recommendations": [
                    "引入更複雜的概念",
                    "減少提示",
                    "增加批判性思考問題",
                    "連結到進階資源"
                ]
            }
        else:
            return {"action": "maintain", "recommendations": ["保持當前節奏"]}
    
    async def spaced_repetition_schedule(
        self,
        item_id: str,
        last_review: datetime,
        ease_factor: float = 2.5,  # SM-2 algorithm
        repetition_number: int = 0
    ) -> datetime:
        """間隔重複排程（SuperMemo SM-2 改進）"""
        if repetition_number == 0:
            interval_days = 1
        elif repetition_number == 1:
            interval_days = 6
        else:
            # 指數增長
            interval_days = math.ceil(
                ease_factor ** (repetition_number - 1)
            )
        
        next_review = last_review + timedelta(days=interval_days)
        return next_review
```

---

### 5️⃣ 低資源語言引擎

#### **語言引擎架構**

```python
# backend/app/services/minority_language_engine.py
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer, pipeline

class MinorityLanguageEngine:
    """低資源語言處理引擎"""
    
    def __init__(self):
        # Facebook NLLB-200 (支援 200+ 語言)
        self.translator = pipeline(
            "translation",
            model="facebook/nllb-200-distilled-600M"
        )
        
        # mBERT (多語言理解)
        self.embedder = pipeline(
            "feature-extraction",
            model="bert-base-multilingual-cased"
        )
    
    async def zero_shot_translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str
    ) -> str:
        """零樣本翻譯（無需訓練資料）"""
        result = self.translator(
            text,
            src_lang=source_lang,
            tgt_lang=target_lang
        )
        return result[0]["translation_text"]
    
    async def bootstrap_new_language(
        self,
        language_code: str,
        seed_examples: list[tuple[str, str]],  # (source, target) pairs
        iterations: int = 100
    ):
        """快速啟動新語言支援（主動學習）"""
        # 1. 用種子樣本微調
        model = AutoModelForSeq2SeqLM.from_pretrained("facebook/nllb-200-distilled-600M")
        # ... 微調程式碼（使用 LoRA）
        
        # 2. 生成合成資料
        synthetic_data = await self._generate_synthetic(seed_examples)
        
        # 3. 主動學習：找出模型最不確定的樣本讓專家標註
        uncertain_samples = await self._active_learning_query(model)
        
        return {
            "status": "bootstrapped",
            "model_path": f"./models/{language_code}_v1",
            "samples_needed": len(uncertain_samples)
        }
```

---

## 📱 6-10 模組簡要架構

### 6️⃣ Apple 生理訊號整合

```swift
// clients/apple/Sources/ModernReaderHealth/HealthKitManager.swift
import HealthKit

class HealthKitManager {
    func requestAuthorization() async throws {
        let types: Set = [
            HKQuantityType(.heartRateVariabilitySDNN),
            HKQuantityType(.heartRate)
        ]
        try await healthStore.requestAuthorization(toShare: [], read: types)
    }
    
    func fetchHRV() async throws -> Double {
        // 查詢最近 5 分鐘的 HRV
        // 回傳平均值供認知負荷計算
    }
}
```

### 7️⃣ ARKit + Haptics

```swift
// clients/apple/Sources/ModernReaderAR/CulturalSceneRenderer.swift
import ARKit
import RealityKit

class CulturalSceneRenderer {
    func render3DContext(for text: String, culture: String) {
        // 根據文化背景渲染 3D 場景
        // 例：原住民神話 → 顯示 3D 圖騰
    }
}
```

### 8️⃣ 區塊鏈治理

```solidity
// contracts/CAREGovernance.sol
contract CAREGovernance {
    mapping(bytes32 => CulturalAsset) public assets;
    
    function requestAccess(bytes32 assetId) external {
        require(hasConsent(msg.sender), "Need CARE consent");
        emit AccessRequested(assetId, msg.sender);
    }
}
```

### 9️⃣ Android 版本

```kotlin
// android/app/src/main/kotlin/ModernReaderApp.kt
class ModernReaderApp : Application() {
    // Kotlin Multiplatform 共享程式碼
}
```

### 🔟 眾包平台

```python
# backend/app/services/crowdsourcing.py
class CrowdsourcingPlatform:
    async def submit_annotation(user_id: str, task_id: str, label: str):
        # 積分系統 + 品質控制
        pass
```

---

## 🚀 立即可執行的步驟

### 1. 解決 Python 版本問題

```bash
# 選項 A：降級到 Python 3.12
pyenv install 3.12.7
cd backend && pyenv local 3.12.7
poetry env use 3.12 && poetry install

# 選項 B：使用 Python 3.13（更穩定）
pyenv install 3.13.1
cd backend && pyenv local 3.13.1
poetry env use 3.13 && poetry install
```

### 2. 設定 API Keys

```bash
# backend/.env
OPENAI_API_KEY=sk-proj-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
GOOGLE_API_KEY=AIzaSy...
```

### 3. 測試 AI 引擎

```python
# backend/test_ai_engine.py
import asyncio
from app.services.ai_engine import WorldClassAIEngine, MultimodalInput

async def main():
    engine = WorldClassAIEngine()
    
    # 測試文本理解
    result = await engine.understand(
        MultimodalInput(text="什麼是量子糾纏？用簡單的方式解釋。")
    )
    
    print(f"Provider: {result.provider}")
    print(f"Response: {result.content}")
    print(f"Tokens: {result.tokens_used}")

asyncio.run(main())
```

### 4. 整合到 FastAPI 路由

```python
# backend/app/api/routes.py
from app.api.v1 import ai  # 新增

router.include_router(ai.router, prefix="/v1/ai", tags=["ai"])
```

---

## 📊 進度追蹤

| 模組 | 進度 | 預估完成時間 |
|-----|------|------------|
| 1. 世界級 LLM 引擎 | 80% | 1 週 |
| 2. 向量資料庫 & RAG | 30% | 2 週 |
| 3. 神經符號推薦 | 20% | 3 週 |
| 4. 認知負荷優化 | 10% | 2 週 |
| 5. 低資源語言 | 0% | 4 週 |
| 6. Apple 整合 | 0% | 3 週 |
| 7. AR + Haptics | 0% | 4 週 |
| 8. 區塊鏈治理 | 0% | 4 週 |
| 9. 跨平台擴展 | 0% | 6 週 |
| 10. 眾包平台 | 0% | 3 週 |

**總預估時間**：約 8-10 個月（並行開發）

---

## 💰 預算與資源

| 項目 | 月成本 | 年成本 |
|-----|--------|--------|
| LLM API (GPT-4 + Claude) | $4,200 | $50,000 |
| GPU 伺服器 (A100 x2) | $2,500 | $30,000 |
| 區塊鏈基礎設施 | $800 | $10,000 |
| 開發團隊（3人） | $25,000 | $300,000 |
| **總計** | **$32,500** | **$390,000** |

---

## 🎯 下一步行動

1. **今天**：解決 Python 版本問題，測試 AI 引擎
2. **本週**：完成 RAG 系統，實作第一個族語模型
3. **本月**：神經符號推薦上線，Apple Watch 整合
4. **下季**：ARKit 場景渲染，區塊鏈治理原型
5. **半年後**：田野測試，論文投稿（NeurIPS/CHI）
6. **一年後**：公開 Beta，申請專利，融資 Series A

---

## 📚 參考資料

- [LangChain Documentation](https://python.langchain.com/)
- [OpenAI Cookbook](https://github.com/openai/openai-cookbook)
- [NLLB-200 Model](https://huggingface.co/facebook/nllb-200-distilled-600M)
- [Cognitive Load Theory](https://www.instructionaldesign.org/theories/cognitive-load/)
- [SuperMemo Algorithm](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2)

---

**建立時間**：2025-10-31  
**最後更新**：世界級 LLM 引擎 80% 完成  
**下次里程碑**：RAG 系統上線（2 週內）
