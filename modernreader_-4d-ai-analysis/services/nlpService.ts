/**
 * Natural Language Processing Service
 * Advanced NLP capabilities using Gemini AI
 * Optimized for MacBook Air M3 8GB RAM
 */

import aiModelManager from './aiModelManager';

interface NLPAnalysis {
  entities: Entity[];
  keywords: Keyword[];
  sentiment: SentimentAnalysis;
  topics: Topic[];
  summary: string;
  language: string;
  complexity: ComplexityScore;
}

interface Entity {
  text: string;
  type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'DATE' | 'EVENT' | 'CONCEPT' | 'OTHER';
  salience: number; // 0-1
  mentions: number;
  context: string;
}

interface Keyword {
  text: string;
  score: number;
  frequency: number;
  tfidf: number;
}

interface SentimentAnalysis {
  score: number; // -1 to 1
  magnitude: number; // 0 to infinity
  label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED';
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
  };
}

interface Topic {
  name: string;
  confidence: number;
  keywords: string[];
}

interface ComplexityScore {
  readingLevel: string;
  gradeLevel: number;
  avgSentenceLength: number;
  avgWordLength: number;
  syllablesPerWord: number;
}

class NLPService {
  private cache: Map<string, NLPAnalysis> = new Map();

  /**
   * 完整 NLP 分析
   */
  async analyze(text: string): Promise<NLPAnalysis> {
    // 檢查快取
    const cacheKey = this.getCacheKey(text);
    if (this.cache.has(cacheKey)) {
      console.log('📦 使用快取的 NLP 分析');
      return this.cache.get(cacheKey)!;
    }

    console.log('🔍 開始 NLP 分析...');

    // 並行執行多個分析任務
    const [entities, keywords, sentiment, topics, summary, language, complexity] = await Promise.all([
      this.extractEntities(text),
      this.extractKeywords(text),
      this.analyzeSentiment(text),
      this.extractTopics(text),
      this.summarize(text, 100),
      this.detectLanguage(text),
      this.analyzeComplexity(text),
    ]);

    const analysis: NLPAnalysis = {
      entities,
      keywords,
      sentiment,
      topics,
      summary,
      language,
      complexity,
    };

    // 快取結果
    this.cache.set(cacheKey, analysis);
    
    // 限制快取大小
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    console.log('✅ NLP 分析完成');
    return analysis;
  }

  /**
   * 實體抽取（人名、地名、組織等）
   */
  async extractEntities(text: string): Promise<Entity[]> {
    const prompt = `分析以下文本，提取所有重要實體（人名、地名、組織、日期、事件、概念等）。
對每個實體提供：
1. 實體文本
2. 類型（PERSON, ORGANIZATION, LOCATION, DATE, EVENT, CONCEPT, OTHER）
3. 重要性分數 (0-1)
4. 出現次數
5. 上下文

以 JSON 格式返回結果。

文本：
${text}

格式：
[{"text": "實體名稱", "type": "類型", "salience": 0.8, "mentions": 3, "context": "上下文"}]`;

    const response = await aiModelManager.generate({
      prompt,
      temperature: 0.1, // 低溫度以獲得精確結果
      maxTokens: 2048,
    });

    try {
      const entities = JSON.parse(this.extractJSON(response.text));
      return entities.slice(0, 20); // 限制前 20 個最重要的實體
    } catch (error) {
      console.error('實體抽取解析失敗:', error);
      return [];
    }
  }

  /**
   * 關鍵詞提取
   */
  async extractKeywords(text: string): Promise<Keyword[]> {
    const prompt = `提取以下文本的關鍵詞，包括：
1. 關鍵詞文本
2. 重要性分數 (0-1)
3. 出現頻率
4. TF-IDF 分數

以 JSON 格式返回前 15 個關鍵詞。

文本：
${text}

格式：
[{"text": "關鍵詞", "score": 0.9, "frequency": 5, "tfidf": 0.85}]`;

    const response = await aiModelManager.generate({
      prompt,
      temperature: 0.1,
      maxTokens: 1024,
    });

    try {
      const keywords = JSON.parse(this.extractJSON(response.text));
      return keywords;
    } catch (error) {
      console.error('關鍵詞提取解析失敗:', error);
      return this.fallbackKeywordExtraction(text);
    }
  }

  /**
   * 情感分析
   */
  async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    const prompt = `分析以下文本的情感傾向：
1. 整體情感分數 (-1 到 1，負面到正面)
2. 情感強度 (0 到 1)
3. 情感標籤 (POSITIVE, NEGATIVE, NEUTRAL, MIXED)
4. 詳細情緒分數 (joy, sadness, anger, fear, surprise，各 0-1)

以 JSON 格式返回結果。

文本：
${text}

格式：
{
  "score": 0.5,
  "magnitude": 0.7,
  "label": "POSITIVE",
  "emotions": {"joy": 0.6, "sadness": 0.1, "anger": 0.0, "fear": 0.1, "surprise": 0.3}
}`;

    const response = await aiModelManager.generate({
      prompt,
      temperature: 0.2,
      maxTokens: 512,
    });

    try {
      return JSON.parse(this.extractJSON(response.text));
    } catch (error) {
      console.error('情感分析解析失敗:', error);
      return {
        score: 0,
        magnitude: 0.5,
        label: 'NEUTRAL',
        emotions: { joy: 0.2, sadness: 0.2, anger: 0.2, fear: 0.2, surprise: 0.2 },
      };
    }
  }

  /**
   * 主題提取
   */
  async extractTopics(text: string): Promise<Topic[]> {
    const prompt = `識別以下文本的主要主題。對每個主題提供：
1. 主題名稱
2. 信心分數 (0-1)
3. 相關關鍵詞

以 JSON 格式返回前 5 個主題。

文本：
${text}

格式：
[{"name": "主題名稱", "confidence": 0.9, "keywords": ["關鍵詞1", "關鍵詞2"]}]`;

    const response = await aiModelManager.generate({
      prompt,
      temperature: 0.3,
      maxTokens: 1024,
    });

    try {
      return JSON.parse(this.extractJSON(response.text));
    } catch (error) {
      console.error('主題提取解析失敗:', error);
      return [];
    }
  }

  /**
   * 文本摘要
   */
  async summarize(text: string, maxWords: number = 100): Promise<string> {
    const prompt = `請將以下文本濃縮為約 ${maxWords} 字的摘要，保留核心要點。

文本：
${text}

摘要：`;

    const response = await aiModelManager.generate({
      prompt,
      temperature: 0.5,
      maxTokens: maxWords * 3,
    });

    return response.text.trim();
  }

  /**
   * 語言檢測
   */
  detectLanguage(text: string): string {
    // 簡單的語言檢測
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const totalChars = text.length;
    
    if (chineseChars / totalChars > 0.3) {
      return 'zh-TW';
    } else if (/[ぁ-んァ-ヶー]/.test(text)) {
      return 'ja';
    } else if (/[가-힣]/.test(text)) {
      return 'ko';
    } else {
      return 'en';
    }
  }

  /**
   * 文本複雜度分析
   */
  analyzeComplexity(text: string): ComplexityScore {
    const sentences = text.split(/[.!?。！？]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    
    const avgSentenceLength = words.length / sentences.length;
    const avgWordLength = text.length / words.length;
    
    // 估計音節數（簡化版）
    const syllablesPerWord = avgWordLength * 0.5;
    
    // Flesch-Kincaid Grade Level (簡化版)
    const gradeLevel = Math.max(0, Math.min(18,
      0.39 * avgSentenceLength + 11.8 * syllablesPerWord - 15.59
    ));

    let readingLevel: string;
    if (gradeLevel <= 6) readingLevel = 'Elementary';
    else if (gradeLevel <= 9) readingLevel = 'Middle School';
    else if (gradeLevel <= 12) readingLevel = 'High School';
    else readingLevel = 'College';

    return {
      readingLevel,
      gradeLevel: Math.round(gradeLevel * 10) / 10,
      avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
      avgWordLength: Math.round(avgWordLength * 10) / 10,
      syllablesPerWord: Math.round(syllablesPerWord * 10) / 10,
    };
  }

  /**
   * 問答系統
   */
  async answerQuestion(context: string, question: string): Promise<string> {
    const prompt = `根據以下上下文回答問題。如果上下文中沒有足夠信息，請明確說明。

上下文：
${context}

問題：${question}

答案：`;

    const response = await aiModelManager.generate({
      prompt,
      temperature: 0.3,
      maxTokens: 512,
    });

    return response.text.trim();
  }

  /**
   * 文本相似度計算
   */
  async calculateSimilarity(text1: string, text2: string): Promise<number> {
    const prompt = `評估以下兩段文本的相似度（0-1，0表示完全不同，1表示完全相同）。
只返回一個數字。

文本1：${text1.substring(0, 500)}
文本2：${text2.substring(0, 500)}

相似度：`;

    const response = await aiModelManager.generate({
      prompt,
      temperature: 0.1,
      maxTokens: 10,
    });

    const similarity = parseFloat(response.text.trim());
    return isNaN(similarity) ? 0 : Math.max(0, Math.min(1, similarity));
  }

  /**
   * 文本分類
   */
  async classify(text: string, categories: string[]): Promise<{ category: string; confidence: number }[]> {
    const prompt = `將以下文本分類到這些類別之一：${categories.join(', ')}

為每個類別提供信心分數 (0-1)。

文本：
${text}

以 JSON 格式返回：
[{"category": "類別名", "confidence": 0.8}]`;

    const response = await aiModelManager.generate({
      prompt,
      temperature: 0.2,
      maxTokens: 512,
    });

    try {
      const results = JSON.parse(this.extractJSON(response.text));
      return results.sort((a: any, b: any) => b.confidence - a.confidence);
    } catch (error) {
      console.error('分類解析失敗:', error);
      return categories.map(cat => ({ category: cat, confidence: 1 / categories.length }));
    }
  }

  /**
   * 命名實體識別（NER）
   */
  async recognizeNamedEntities(text: string): Promise<Entity[]> {
    return this.extractEntities(text);
  }

  /**
   * 關係提取
   */
  async extractRelations(text: string): Promise<Array<{
    subject: string;
    predicate: string;
    object: string;
    confidence: number;
  }>> {
    const prompt = `提取以下文本中的關係三元組（主語-謂語-賓語）。

文本：
${text}

以 JSON 格式返回：
[{"subject": "主語", "predicate": "謂語", "object": "賓語", "confidence": 0.9}]`;

    const response = await aiModelManager.generate({
      prompt,
      temperature: 0.1,
      maxTokens: 2048,
    });

    try {
      return JSON.parse(this.extractJSON(response.text));
    } catch (error) {
      console.error('關係提取解析失敗:', error);
      return [];
    }
  }

  // ========== 輔助方法 ==========

  private getCacheKey(text: string): string {
    // 使用簡單的哈希函數
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  private extractJSON(text: string): string {
    // 提取 JSON 部分（處理可能的 markdown 格式）
    const jsonMatch = text.match(/```(?:json)?\s*(\[[\s\S]*?\]|\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      return jsonMatch[1];
    }
    
    // 嘗試直接匹配 JSON
    const directMatch = text.match(/\[[\s\S]*?\]|\{[\s\S]*?\}/);
    if (directMatch) {
      return directMatch[0];
    }
    
    return text;
  }

  private fallbackKeywordExtraction(text: string): Keyword[] {
    // 簡單的關鍵詞提取備用方案
    const words = text.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3);

    const frequency = new Map<string, number>();
    words.forEach(word => {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    });

    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([text, freq]) => ({
        text,
        score: freq / words.length,
        frequency: freq,
        tfidf: freq / words.length,
      }));
  }

  /**
   * 清除快取
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ NLP 快取已清除');
  }
}

export const nlpService = new NLPService();
export default nlpService;
