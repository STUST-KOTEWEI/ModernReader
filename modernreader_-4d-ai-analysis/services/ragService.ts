/**
 * RAG (Retrieval-Augmented Generation) Service
 * Enhanced AI generation with knowledge retrieval
 * Optimized for MacBook Air M3 8GB RAM
 */

import aiModelManager from './aiModelManager';
import { quantumKnowledgeBase } from './quantumKnowledgeBase';
import nlpService from './nlpService';

interface RAGConfig {
  retrievalCount: number; // 檢索多少相關文檔
  chunkSize: number; // 文本分塊大小
  chunkOverlap: number; // 分塊重疊
  minRelevance: number; // 最小相關度閾值
  useHybridSearch: boolean; // 混合搜尋（關鍵詞+語義）
}

interface RAGResponse {
  answer: string;
  sources: Source[];
  confidence: number;
  processingTime: number;
  retrievedDocs: number;
}

interface Source {
  content: string;
  relevance: number;
  metadata?: any;
}

interface DocumentChunk {
  id: string;
  content: string;
  embedding?: number[];
  metadata: {
    documentId: string;
    chunkIndex: number;
    totalChunks: number;
  };
}

class RAGService {
  private config: RAGConfig = {
    retrievalCount: 5,
    chunkSize: 500,
    chunkOverlap: 50,
    minRelevance: 0.3,
    useHybridSearch: true,
  };

  private documentChunks: Map<string, DocumentChunk[]> = new Map();

  /**
   * 添加文檔到 RAG 系統
   */
  async addDocument(content: string, metadata?: any): Promise<string> {
    const documentId = this.generateId();
    
    // 分塊處理
    const chunks = this.chunkText(content);
    const documentChunks: DocumentChunk[] = [];

    console.log(`📄 正在處理文檔: ${chunks.length} 個分塊`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // 添加到知識庫
      const node = await quantumKnowledgeBase.addKnowledge(chunk, {
        type: 'concept',
        sources: [documentId],
        tags: metadata?.tags || [],
      });

      documentChunks.push({
        id: node.id,
        content: chunk,
        embedding: node.embeddings,
        metadata: {
          documentId,
          chunkIndex: i,
          totalChunks: chunks.length,
          ...metadata,
        },
      });
    }

    this.documentChunks.set(documentId, documentChunks);

    console.log(`✅ 文檔已添加: ${documentId} (${chunks.length} 個分塊)`);
    
    return documentId;
  }

  /**
   * RAG 查詢（檢索增強生成）
   */
  async query(question: string, options?: Partial<RAGConfig>): Promise<RAGResponse> {
    const startTime = Date.now();
    const config = { ...this.config, ...options };

    console.log(`🔍 RAG 查詢: "${question}"`);

    // 步驟 1: 檢索相關文檔
    const retrievedDocs = await this.retrieve(question, config);

    if (retrievedDocs.length === 0) {
      console.warn('⚠️ 未找到相關文檔');
      return {
        answer: '抱歉，我在知識庫中沒有找到相關信息來回答這個問題。',
        sources: [],
        confidence: 0,
        processingTime: Date.now() - startTime,
        retrievedDocs: 0,
      };
    }

    console.log(`📚 檢索到 ${retrievedDocs.length} 個相關文檔`);

    // 步驟 2: 構建增強提示
    const augmentedPrompt = this.buildAugmentedPrompt(question, retrievedDocs);

    // 步驟 3: 使用 AI 生成答案
    const response = await aiModelManager.generate({
      prompt: augmentedPrompt,
      temperature: 0.3, // 較低溫度以獲得更準確的答案
      maxTokens: 2048,
    });

    // 步驟 4: 計算信心分數
    const confidence = this.calculateConfidence(retrievedDocs, response.text);

    const processingTime = Date.now() - startTime;

    console.log(`✅ RAG 查詢完成 (${processingTime}ms, 信心度: ${(confidence * 100).toFixed(1)}%)`);

    return {
      answer: response.text.trim(),
      sources: retrievedDocs,
      confidence,
      processingTime,
      retrievedDocs: retrievedDocs.length,
    };
  }

  /**
   * 多輪對話 RAG
   */
  async conversationalQuery(
    question: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    options?: Partial<RAGConfig>
  ): Promise<RAGResponse> {
    const config = { ...this.config, ...options };

    // 將對話歷史轉換為上下文
    const conversationContext = conversationHistory
      .map(msg => `${msg.role === 'user' ? '用戶' : 'AI'}: ${msg.content}`)
      .join('\n');

    // 結合對話上下文進行檢索
    const enhancedQuestion = `${conversationContext}\n\n用戶: ${question}`;
    const retrievedDocs = await this.retrieve(enhancedQuestion, config);

    // 構建對話增強提示
    const augmentedPrompt = `你是一個知識助手。根據以下對話歷史和相關文檔回答問題。

對話歷史：
${conversationContext}

相關文檔：
${retrievedDocs.map((doc, i) => `[文檔 ${i + 1}]\n${doc.content}`).join('\n\n')}

用戶: ${question}

AI: `;

    const response = await aiModelManager.generate({
      prompt: augmentedPrompt,
      temperature: 0.4,
      maxTokens: 2048,
    });

    return {
      answer: response.text.trim(),
      sources: retrievedDocs,
      confidence: this.calculateConfidence(retrievedDocs, response.text),
      processingTime: 0,
      retrievedDocs: retrievedDocs.length,
    };
  }

  /**
   * 檢索相關文檔
   */
  private async retrieve(query: string, config: RAGConfig): Promise<Source[]> {
    // 使用知識庫的語義搜尋
    const results = await quantumKnowledgeBase.search(query, {
      limit: config.retrievalCount,
      minRelevance: config.minRelevance,
    });

    // 轉換為 Source 格式
    const sources: Source[] = results.map(node => ({
      content: node.content,
      relevance: node.importance,
      metadata: {
        id: node.id,
        type: node.type,
        tags: node.tags,
        sources: node.sources,
      },
    }));

    // 按相關度排序
    sources.sort((a, b) => b.relevance - a.relevance);

    return sources;
  }

  /**
   * 構建增強提示
   */
  private buildAugmentedPrompt(question: string, sources: Source[]): string {
    const context = sources
      .map((source, index) => {
        return `[參考文獻 ${index + 1}] (相關度: ${(source.relevance * 100).toFixed(0)}%)\n${source.content}`;
      })
      .join('\n\n');

    return `你是一個專業的知識助手。請根據以下參考文獻回答問題。

重要規則：
1. 只使用提供的參考文獻中的信息
2. 如果參考文獻中沒有足夠信息，明確說明
3. 引用時註明參考文獻編號
4. 回答要準確、簡潔、有條理

參考文獻：
${context}

問題：${question}

回答：`;
  }

  /**
   * 計算信心分數
   */
  private calculateConfidence(sources: Source[], answer: string): number {
    if (sources.length === 0) return 0;

    // 基於多個因素計算信心度
    const avgRelevance = sources.reduce((sum, s) => sum + s.relevance, 0) / sources.length;
    const sourceCount = Math.min(sources.length / this.config.retrievalCount, 1);
    const answerLength = Math.min(answer.length / 500, 1); // 假設理想答案長度 500 字符

    return (avgRelevance * 0.5 + sourceCount * 0.3 + answerLength * 0.2);
  }

  /**
   * 文本分塊
   */
  private chunkText(text: string): string[] {
    const { chunkSize, chunkOverlap } = this.config;
    const chunks: string[] = [];
    
    // 按句子分割
    const sentences = text.split(/[.!?。！？\n]+/).filter(s => s.trim().length > 0);
    
    let currentChunk = '';
    let currentLength = 0;

    for (const sentence of sentences) {
      const sentenceLength = sentence.length;

      if (currentLength + sentenceLength > chunkSize && currentChunk.length > 0) {
        // 當前分塊已滿，保存並開始新分塊
        chunks.push(currentChunk.trim());
        
        // 保留重疊部分
        const overlapText = currentChunk.slice(-chunkOverlap);
        currentChunk = overlapText + ' ' + sentence;
        currentLength = overlapText.length + sentenceLength;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
        currentLength += sentenceLength;
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * 摘要生成（基於檢索的摘要）
   */
  async summarizeWithRAG(topic: string, maxLength: number = 300): Promise<string> {
    const sources = await this.retrieve(topic, {
      ...this.config,
      retrievalCount: 10,
    });

    if (sources.length === 0) {
      return `無法找到關於「${topic}」的相關信息。`;
    }

    const combinedText = sources.map(s => s.content).join('\n\n');

    const prompt = `請根據以下內容，生成一個約 ${maxLength} 字的綜合摘要，主題是「${topic}」。

內容：
${combinedText}

摘要：`;

    const response = await aiModelManager.generate({
      prompt,
      temperature: 0.5,
      maxTokens: maxLength * 2,
    });

    return response.text.trim();
  }

  /**
   * 事實核查
   */
  async factCheck(claim: string): Promise<{
    verdict: 'SUPPORTED' | 'REFUTED' | 'NOT_ENOUGH_INFO';
    confidence: number;
    evidence: Source[];
    explanation: string;
  }> {
    const sources = await this.retrieve(claim, {
      ...this.config,
      retrievalCount: 10,
    });

    const prompt = `請根據以下證據，判斷這個聲明是否正確。

聲明：${claim}

證據：
${sources.map((s, i) => `[證據 ${i + 1}] ${s.content}`).join('\n\n')}

請以 JSON 格式回答：
{
  "verdict": "SUPPORTED" | "REFUTED" | "NOT_ENOUGH_INFO",
  "confidence": 0.0-1.0,
  "explanation": "詳細解釋"
}`;

    const response = await aiModelManager.generate({
      prompt,
      temperature: 0.2,
      maxTokens: 1024,
    });

    try {
      const result = JSON.parse(response.text.match(/\{[\s\S]*\}/)?.[0] || '{}');
      return {
        verdict: result.verdict || 'NOT_ENOUGH_INFO',
        confidence: result.confidence || 0,
        evidence: sources,
        explanation: result.explanation || '無法判斷',
      };
    } catch (error) {
      console.error('事實核查解析失敗:', error);
      return {
        verdict: 'NOT_ENOUGH_INFO',
        confidence: 0,
        evidence: sources,
        explanation: '解析失敗',
      };
    }
  }

  /**
   * 引用生成
   */
  async generateCitation(question: string): Promise<{
    answer: string;
    citations: Array<{ text: string; source: string }>;
  }> {
    const ragResponse = await this.query(question);

    // 生成帶引用的答案
    const citationsPrompt = `將以下答案改寫，添加適當的引用標註 [1], [2] 等。

答案：
${ragResponse.answer}

參考文獻：
${ragResponse.sources.map((s, i) => `[${i + 1}] ${s.content.substring(0, 100)}...`).join('\n')}

帶引用的答案：`;

    const response = await aiModelManager.generate({
      prompt: citationsPrompt,
      temperature: 0.3,
      maxTokens: 2048,
    });

    return {
      answer: response.text.trim(),
      citations: ragResponse.sources.map((s, i) => ({
        text: s.content,
        source: s.metadata?.sources?.[0] || `來源 ${i + 1}`,
      })),
    };
  }

  /**
   * 批次查詢
   */
  async batchQuery(questions: string[]): Promise<RAGResponse[]> {
    console.log(`🚀 批次 RAG 查詢: ${questions.length} 個問題`);
    
    const results = await Promise.all(
      questions.map(q => this.query(q))
    );

    console.log('✅ 批次查詢完成');
    return results;
  }

  /**
   * 獲取文檔統計
   */
  getDocumentStats(): {
    totalDocuments: number;
    totalChunks: number;
    avgChunksPerDoc: number;
  } {
    const totalDocuments = this.documentChunks.size;
    let totalChunks = 0;

    this.documentChunks.forEach(chunks => {
      totalChunks += chunks.length;
    });

    return {
      totalDocuments,
      totalChunks,
      avgChunksPerDoc: totalDocuments > 0 ? totalChunks / totalDocuments : 0,
    };
  }

  /**
   * 刪除文檔
   */
  async deleteDocument(documentId: string): Promise<void> {
    const chunks = this.documentChunks.get(documentId);
    if (!chunks) {
      console.warn(`文檔不存在: ${documentId}`);
      return;
    }

    // 從知識庫中刪除所有分塊
    // (需要實作知識庫的刪除方法)
    
    this.documentChunks.delete(documentId);
    console.log(`🗑️ 文檔已刪除: ${documentId}`);
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<RAGConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('⚙️ RAG 配置已更新:', this.config);
  }

  private generateId(): string {
    return `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const ragService = new RAGService();
export default ragService;
