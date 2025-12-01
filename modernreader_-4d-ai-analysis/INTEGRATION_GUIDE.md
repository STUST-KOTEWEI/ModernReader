# 🚀 ModernReader 完整服務整合指南

## 📦 全部服務列表（共 19 個）

### 原有服務（11 個）
1. ✅ Advanced AI Service
2. ✅ Quantum Knowledge Base
3. ✅ Immersive Visualization
4. ✅ Neural Reading
5. ✅ Collaborative Intelligence
6. ✅ Multimodal Learning
7. ✅ Predictive Analytics
8. ✅ Augmented Reality
9. ✅ Blockchain Knowledge
10. ✅ Performance Monitor
11. ✅ Sensory Service

### 新增服務（8 個）
12. ✅ **AI Model Manager** - Gemini 多模型智能備援
13. ✅ **NLP Service** - 完整自然語言處理
14. ✅ **RAG Service** - 檢索增強生成
15. ✅ **TTS Service** - 高品質語音合成
16. ✅ **STT Service** - 即時語音識別
17. ✅ **Meta Search** - 多來源聚合搜尋
18. ✅ **Metadata Service** - 智能元數據管理
19. ✅ **SQL Service** - 類 SQL 查詢 + AI 輔助

---

## 🔥 快速開始

### 1. 環境設定

確認 `.env.local` 已配置：

```env
# AI API Key
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# AI 模型優先順序
VITE_AI_MODEL_PRIORITY=gemini-2.5-pro,gemini-2.5-flash,gemini-2.0-pro,gemini-2.0-flash
VITE_AI_AUTO_FALLBACK=true

# 啟用所有新服務
VITE_ENABLE_NLP=true
VITE_ENABLE_RAG=true
VITE_ENABLE_TTS=true
VITE_ENABLE_STT=true
VITE_ENABLE_META_SEARCH=true
VITE_ENABLE_METADATA=true
VITE_ENABLE_SQL=true
```

### 2. 啟動應用

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

---

## 🎯 服務整合範例

### 範例 1: 智能文檔分析系統

```typescript
import { aiModelManager } from './services/aiModelManager';
import { nlpService } from './services/nlpService';
import { ragService } from './services/ragService';
import { metadataService } from './services/metadataService';
import { sqlService } from './services/sqlService';

class SmartDocumentAnalyzer {
  async analyzeDocument(text: string) {
    // 1. NLP 分析
    const nlpAnalysis = await nlpService.analyze(text);
    console.log('實體:', nlpAnalysis.entities);
    console.log('情感:', nlpAnalysis.sentiment);
    console.log('關鍵詞:', nlpAnalysis.keywords);
    
    // 2. 提取元數據
    const metadata = await metadataService.extractMetadata(text, {
      extractEntities: true,
      extractTopics: true,
      extractSentiment: true
    });
    
    // 3. 儲存到 RAG 系統
    await ragService.addDocument({
      id: Date.now().toString(),
      title: metadata.title || '未命名',
      content: text,
      metadata: {
        author: metadata.author,
        keywords: metadata.keywords,
        topics: metadata.topics
      }
    });
    
    // 4. 儲存到 SQL 資料庫
    const { insertedIds } = await sqlService.insert('documents', {
      title: metadata.title,
      content: text,
      author: metadata.author,
      category: metadata.topics[0]?.topic || 'General',
      tags: metadata.keywords.map(k => k.keyword),
      wordCount: metadata.wordCount,
      createdAt: new Date()
    });
    
    return {
      nlpAnalysis,
      metadata,
      documentId: insertedIds[0]
    };
  }
}
```

### 範例 2: 語音互動問答系統

```typescript
import { sttService } from './services/sttService';
import { ragService } from './services/ragService';
import { ttsService } from './services/ttsService';
import { nlpService } from './services/nlpService';

class VoiceQASystem {
  async interactiveQA() {
    console.log('🎤 語音問答系統啟動');
    
    // 1. 語音識別問題
    const question = await sttService.recordOnce(10000);
    console.log(`❓ 您的問題: ${question}`);
    
    // 2. NLP 理解問題
    const analysis = await nlpService.analyze(question);
    const intent = analysis.topics[0]?.topic || 'general';
    
    // 3. RAG 檢索回答
    const ragResult = await ragService.query(question, {
      retrievalCount: 5,
      minRelevance: 0.3
    });
    
    console.log(`💡 答案: ${ragResult.answer}`);
    console.log(`📚 來源: ${ragResult.sources.map(s => s.title).join(', ')}`);
    
    // 4. 語音播報答案
    await ttsService.speak(ragResult.answer, {
      rate: 1.0,
      pitch: 1.0,
      volume: 0.8
    });
    
    return ragResult;
  }
}
```

### 範例 3: 多來源知識搜尋

```typescript
import { metaSearchService } from './services/metaSearchService';
import { nlpService } from './services/nlpService';
import { sqlService } from './services/sqlService';

class KnowledgeSearchEngine {
  async comprehensiveSearch(query: string) {
    console.log(`🔍 搜尋: ${query}`);
    
    // 1. 語義搜尋（使用 NLP 擴展查詢）
    const searchResults = await metaSearchService.semanticSearch(query, {
      limit: 20,
      sources: {
        knowledgeBase: true,
        googleScholar: true,
        wikipedia: true,
        webSearch: true
      }
    });
    
    console.log(`找到 ${searchResults.totalResults} 個結果`);
    
    // 2. 提取關鍵資訊
    for (const result of searchResults.results.slice(0, 5)) {
      console.log(`📄 ${result.title}`);
      console.log(`   來源: ${result.source}`);
      console.log(`   相關度: ${(result.score * 100).toFixed(1)}%`);
      
      // NLP 分析摘要
      const analysis = await nlpService.analyze(result.snippet);
      console.log(`   情感: ${analysis.sentiment.label} (${(analysis.sentiment.score * 100).toFixed(0)}%)`);
    }
    
    // 3. 儲存搜尋歷史到 SQL
    await sqlService.insert('search_history', {
      query,
      totalResults: searchResults.totalResults,
      timestamp: new Date()
    });
    
    // 4. 取得相關建議
    const relatedQueries = await metaSearchService.getRelatedQueries(query, 5);
    console.log('相關查詢:', relatedQueries);
    
    return searchResults;
  }
}
```

### 範例 4: AI 輔助寫作助手

```typescript
import { aiModelManager } from './services/aiModelManager';
import { nlpService } from './services/nlpService';
import { ragService } from './services/ragService';
import { metadataService } from './services/metadataService';

class WritingAssistant {
  async improveText(text: string, context?: string) {
    console.log('✍️ AI 寫作助手');
    
    // 1. 分析原文
    const analysis = await nlpService.analyze(text);
    console.log(`原文複雜度: ${analysis.complexity.gradeLevel} 年級`);
    console.log(`原文情感: ${analysis.sentiment.label}`);
    
    // 2. 使用 RAG 增強上下文
    let enhancedPrompt = `請改善以下文本:\n\n${text}`;
    
    if (context) {
      const ragContext = await ragService.query(context, {
        retrievalCount: 3
      });
      enhancedPrompt += `\n\n相關參考:\n${ragContext.sources.map(s => s.content).join('\n\n')}`;
    }
    
    // 3. AI 生成改善版本（自動選擇最佳模型）
    const improved = await aiModelManager.generate({
      prompt: enhancedPrompt,
      temperature: 0.7,
      maxTokens: 2000
    });
    
    console.log(`使用模型: ${improved.model}`);
    console.log(`Tokens: ${improved.usage?.totalTokens}`);
    
    // 4. 分析改善後的文本
    const improvedAnalysis = await nlpService.analyze(improved.text);
    
    // 5. 提取新元數據
    const metadata = await metadataService.extractMetadata(improved.text);
    
    return {
      original: text,
      improved: improved.text,
      originalAnalysis: analysis,
      improvedAnalysis,
      metadata,
      model: improved.model
    };
  }

  async generateOutline(topic: string) {
    // 使用 AI 生成大綱
    const response = await aiModelManager.generate({
      prompt: `請為「${topic}」生成一個詳細的文章大綱，包含主要章節和子章節。`,
      temperature: 0.8
    });
    
    return response.text;
  }

  async expandSection(section: string, references: string[]) {
    // 使用 RAG 擴展章節
    const ragResult = await ragService.query(section, {
      retrievalCount: 5
    });
    
    const prompt = `
根據以下參考資料，詳細擴展這個章節:

章節: ${section}

參考資料:
${ragResult.sources.map((s, i) => `${i + 1}. ${s.content}`).join('\n\n')}

請寫出詳細、有深度的內容。
`;
    
    const response = await aiModelManager.generate({
      prompt,
      temperature: 0.7,
      maxTokens: 1500
    });
    
    return response.text;
  }
}
```

### 範例 5: 資料分析儀表板

```typescript
import { sqlService } from './services/sqlService';
import { metadataService } from './services/metadataService';
import { nlpService } from './services/nlpService';

class AnalyticsDashboard {
  async getOverview() {
    // 1. SQL 統計
    const stats = await sqlService.getStatistics();
    
    // 2. 文檔統計
    const totalDocs = await sqlService.count('documents');
    const totalWords = await sqlService.sum('documents', 'wordCount');
    const avgWords = await sqlService.avg('documents', 'wordCount');
    
    // 3. 分類統計
    const categoryCounts = await sqlService.query(`
      SELECT category, COUNT(*) as count, SUM(wordCount) as totalWords
      FROM documents
      GROUP BY category
      ORDER BY count DESC
    `);
    
    // 4. 最活躍作者
    const topAuthors = await sqlService.query(`
      SELECT author, COUNT(*) as articles, SUM(wordCount) as totalWords
      FROM documents
      WHERE author IS NOT NULL
      GROUP BY author
      ORDER BY articles DESC
      LIMIT 10
    `);
    
    // 5. 近期趨勢
    const recentDocs = await sqlService.select('documents', {
      columns: ['createdAt', 'category'],
      orderBy: [{ field: 'createdAt', direction: 'DESC' }],
      limit: 100
    });
    
    return {
      overview: {
        totalDocuments: totalDocs,
        totalWords,
        avgWords: Math.round(avgWords),
        readingTime: Math.round(totalWords / 400) // 中文 400字/分鐘
      },
      categories: categoryCounts.rows,
      topAuthors: topAuthors.rows,
      recentActivity: recentDocs.rows
    };
  }

  async searchInsights(query: string) {
    // 使用 AI 自然語言查詢
    const result = await sqlService.naturalLanguageQuery(query);
    
    // 例如: "有多少篇 AI 相關的文章？"
    // 例如: "找出最長的 5 篇文章"
    // 例如: "計算每個作者的平均字數"
    
    return result;
  }

  async sentimentTrend() {
    // 分析所有文檔的情感趨勢
    const allDocs = await sqlService.select('documents', {
      columns: ['content', 'createdAt']
    });
    
    const sentiments = [];
    for (const doc of allDocs.rows) {
      const analysis = await nlpService.analyzeSentiment(doc.content);
      sentiments.push({
        date: doc.createdAt,
        sentiment: analysis.label,
        score: analysis.score
      });
    }
    
    return sentiments;
  }
}
```

---

## 📊 效能監控

```typescript
import { performanceMonitor } from './services/performanceMonitor';

// 監控效能
performanceMonitor.startMonitoring();

// 取得即時狀態
const status = performanceMonitor.getCurrentStatus();
console.log('CPU:', status.cpu, '%');
console.log('RAM:', status.memory, 'MB');
console.log('GPU:', status.gpu, '%');

// 檢查是否超過限制
if (performanceMonitor.isOverLimit()) {
  console.warn('⚠️ 系統資源使用過高');
  // 降低服務品質或清理快取
}
```

---

## 🎓 最佳實踐

### 1. AI 模型選擇策略

```typescript
// 讓 AI Model Manager 自動選擇最佳模型
const response = await aiModelManager.generate({
  prompt: "您的提示",
  temperature: 0.7
});

// 系統會自動:
// 1. 優先使用 Gemini 2.5 Pro
// 2. 如果失敗或速率限制，降級到 2.5 Flash
// 3. 再失敗則使用 2.0 Pro
// 4. 最後備援 2.0 Flash
```

### 2. 快取管理

```typescript
// NLP 服務自動快取
const analysis1 = await nlpService.analyze(text); // 執行分析
const analysis2 = await nlpService.analyze(text); // 使用快取

// SQL 查詢快取
const result1 = await sqlService.query(sql); // 執行查詢
const result2 = await sqlService.query(sql); // 使用快取（5 分鐘內）

// 手動清除快取
nlpService.clearCache();
sqlService.clearCache();
```

### 3. 批次處理

```typescript
// 批次插入文檔
await sqlService.bulkInsert('documents', [
  { title: 'Doc1', content: '...', createdAt: new Date() },
  { title: 'Doc2', content: '...', createdAt: new Date() },
  // ... 更多
]);

// 批次 AI 生成
const prompts = ['prompt1', 'prompt2', 'prompt3'];
const results = await aiModelManager.batchGenerate(
  prompts.map(p => ({ prompt: p })),
  { maxConcurrent: 3 }
);
```

### 4. 錯誤處理

```typescript
try {
  const response = await aiModelManager.generate({ prompt: "..." });
} catch (error) {
  console.error('AI 生成失敗:', error);
  // 所有模型都失敗的情況下才會拋出錯誤
}

try {
  const result = await sqlService.query(sql);
} catch (error) {
  console.error('SQL 查詢失敗:', error);
  // 檢查 SQL 語法或資料庫狀態
}
```

---

## 📚 相關文檔

- **NEW_SERVICES_COMPLETE.md** - 所有新服務的詳細說明
- **SQL_SERVICE_GUIDE.md** - SQL 服務完整指南
- **OPTIMIZATION_COMPLETE.md** - M3 優化指南
- **README.md** - 專案總覽

---

## 🎉 總結

您現在擁有一個完整的 **AI 驅動知識管理系統**，包含：

✅ **19 個完整服務**
✅ **7300+ 行 TypeScript 程式碼**
✅ **AI 多模型智能備援**
✅ **完整 NLP + RAG + TTS + STT + SQL**
✅ **多來源知識聚合**
✅ **元數據自動管理**
✅ **MacBook Air M3 8GB 優化**

立即開始使用：`npm run dev` 🚀

---

**最後更新**: 2025年10月20日  
**版本**: v3.0-ai-complete  
**狀態**: ✅ 全部完成
