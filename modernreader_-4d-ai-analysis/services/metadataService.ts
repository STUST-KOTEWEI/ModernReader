/**
 * Metadata Service
 * Comprehensive metadata extraction and management
 * Optimized for MacBook Air M3 8GB RAM
 */

import nlpService from './nlpService';

interface DocumentMetadata {
  id: string;
  title: string;
  author?: string;
  createdDate: Date;
  modifiedDate: Date;
  language: string;
  wordCount: number;
  characterCount: number;
  readingTime: number; // minutes
  keywords: string[];
  summary: string;
  category?: string;
  tags: string[];
  sentiment?: {
    score: number;
    label: string;
  };
  complexity?: {
    level: string;
    grade: number;
  };
  entities?: Array<{ text: string; type: string }>;
  topics?: Array<{ name: string; confidence: number }>;
  customFields?: Record<string, any>;
}

interface FileMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  mimeType: string;
  extension: string;
  hash?: string;
  checksum?: string;
}

class MetadataService {
  private metadataStore: Map<string, DocumentMetadata> = new Map();

  /**
   * 提取文檔元數據
   */
  async extractMetadata(
    content: string,
    options?: {
      extractEntities?: boolean;
      extractTopics?: boolean;
      extractSentiment?: boolean;
      customExtractors?: Array<(content: string) => Promise<any>>;
    }
  ): Promise<DocumentMetadata> {
    console.log('📊 正在提取元數據...');
    const startTime = Date.now();

    // 基本元數據
    const id = this.generateId();
    const title = this.extractTitle(content);
    const wordCount = this.countWords(content);
    const characterCount = content.length;
    const readingTime = this.calculateReadingTime(wordCount);
    const language = nlpService.detectLanguage(content);

    // 進階元數據（使用 NLP）
    let keywords: string[] = [];
    let summary = '';
    let sentiment: any = undefined;
    let complexity: any = undefined;
    let entities: any = undefined;
    let topics: any = undefined;

    try {
      // 並行執行多個分析
      const analysisPromises = [];

      if (options?.extractEntities) {
        analysisPromises.push(
          nlpService.extractEntities(content).then(ents => entities = ents.slice(0, 10))
        );
      }

      if (options?.extractTopics) {
        analysisPromises.push(
          nlpService.extractTopics(content).then(tops => topics = tops)
        );
      }

      if (options?.extractSentiment) {
        analysisPromises.push(
          nlpService.analyzeSentiment(content).then(sent => sentiment = {
            score: sent.score,
            label: sent.label,
          })
        );
      }

      // 總是提取關鍵詞和摘要
      analysisPromises.push(
        nlpService.extractKeywords(content).then(kws => keywords = kws.slice(0, 10).map(k => k.text))
      );

      analysisPromises.push(
        nlpService.summarize(content, 150).then(sum => summary = sum)
      );

      // 同步調用 analyzeComplexity（不需要 Promise）
      const comp = nlpService.analyzeComplexity(content);
      complexity = {
        level: comp.readingLevel,
        grade: comp.gradeLevel,
      };

      // 等待所有分析完成
      await Promise.all(analysisPromises);

      // 執行自定義提取器
      if (options?.customExtractors) {
        for (const extractor of options.customExtractors) {
          await extractor(content);
        }
      }

    } catch (error) {
      console.error('元數據提取部分失敗:', error);
    }

    const metadata: DocumentMetadata = {
      id,
      title,
      createdDate: new Date(),
      modifiedDate: new Date(),
      language,
      wordCount,
      characterCount,
      readingTime,
      keywords,
      summary,
      tags: [],
      sentiment,
      complexity,
      entities,
      topics,
      customFields: {},
    };

    // 儲存到本地存儲
    this.metadataStore.set(id, metadata);

    const duration = Date.now() - startTime;
    console.log(`✅ 元數據提取完成 (${duration}ms)`);

    return metadata;
  }

  /**
   * 提取檔案元數據
   */
  async extractFileMetadata(file: File): Promise<FileMetadata> {
    const metadata: FileMetadata = {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      mimeType: file.type,
      extension: this.getFileExtension(file.name),
    };

    // 計算檔案雜湊（如果需要）
    if (file.size < 50 * 1024 * 1024) { // 僅對小於 50MB 的檔案
      try {
        metadata.hash = await this.calculateFileHash(file);
      } catch (error) {
        console.error('計算檔案雜湊失敗:', error);
      }
    }

    return metadata;
  }

  /**
   * 更新元數據
   */
  updateMetadata(id: string, updates: Partial<DocumentMetadata>): DocumentMetadata | null {
    const metadata = this.metadataStore.get(id);
    if (!metadata) {
      console.warn(`元數據不存在: ${id}`);
      return null;
    }

    const updated = {
      ...metadata,
      ...updates,
      modifiedDate: new Date(),
    };

    this.metadataStore.set(id, updated);
    console.log(`✅ 元數據已更新: ${id}`);

    return updated;
  }

  /**
   * 獲取元數據
   */
  getMetadata(id: string): DocumentMetadata | null {
    return this.metadataStore.get(id) || null;
  }

  /**
   * 搜尋元數據
   */
  searchMetadata(query: {
    keyword?: string;
    language?: string;
    category?: string;
    tags?: string[];
    dateRange?: { start: Date; end: Date };
    minWordCount?: number;
    maxWordCount?: number;
  }): DocumentMetadata[] {
    let results = Array.from(this.metadataStore.values());

    // 應用篩選條件
    if (query.keyword) {
      const lowerKeyword = query.keyword.toLowerCase();
      results = results.filter(meta =>
        meta.title.toLowerCase().includes(lowerKeyword) ||
        meta.summary.toLowerCase().includes(lowerKeyword) ||
        meta.keywords.some(kw => kw.toLowerCase().includes(lowerKeyword))
      );
    }

    if (query.language) {
      results = results.filter(meta => meta.language === query.language);
    }

    if (query.category) {
      results = results.filter(meta => meta.category === query.category);
    }

    if (query.tags && query.tags.length > 0) {
      results = results.filter(meta =>
        query.tags!.some(tag => meta.tags.includes(tag))
      );
    }

    if (query.dateRange) {
      results = results.filter(meta =>
        meta.createdDate >= query.dateRange!.start &&
        meta.createdDate <= query.dateRange!.end
      );
    }

    if (query.minWordCount !== undefined) {
      results = results.filter(meta => meta.wordCount >= query.minWordCount!);
    }

    if (query.maxWordCount !== undefined) {
      results = results.filter(meta => meta.wordCount <= query.maxWordCount!);
    }

    return results;
  }

  /**
   * 刪除元數據
   */
  deleteMetadata(id: string): boolean {
    const deleted = this.metadataStore.delete(id);
    if (deleted) {
      console.log(`🗑️ 元數據已刪除: ${id}`);
    }
    return deleted;
  }

  /**
   * 批量提取元數據
   */
  async batchExtractMetadata(contents: string[]): Promise<DocumentMetadata[]> {
    console.log(`🚀 批量提取 ${contents.length} 個文檔的元數據...`);

    const results = await Promise.all(
      contents.map(content => this.extractMetadata(content))
    );

    console.log('✅ 批量提取完成');
    return results;
  }

  /**
   * 匯出元數據
   */
  exportMetadata(format: 'json' | 'csv' | 'xml' = 'json'): string {
    const allMetadata = Array.from(this.metadataStore.values());

    switch (format) {
      case 'json':
        return JSON.stringify(allMetadata, null, 2);

      case 'csv':
        const headers = 'ID,Title,Author,Created,Word Count,Reading Time,Language,Summary\n';
        const rows = allMetadata.map(meta =>
          `"${meta.id}","${meta.title}","${meta.author || ''}","${meta.createdDate.toISOString()}",${meta.wordCount},${meta.readingTime},"${meta.language}","${meta.summary}"`
        ).join('\n');
        return headers + rows;

      case 'xml':
        const xmlItems = allMetadata.map(meta =>
          `  <document>
    <id>${meta.id}</id>
    <title>${meta.title}</title>
    <wordCount>${meta.wordCount}</wordCount>
    <readingTime>${meta.readingTime}</readingTime>
    <language>${meta.language}</language>
  </document>`
        ).join('\n');
        return `<?xml version="1.0" encoding="UTF-8"?>\n<documents>\n${xmlItems}\n</documents>`;

      default:
        return JSON.stringify(allMetadata);
    }
  }

  /**
   * 匯入元數據
   */
  importMetadata(data: string, format: 'json' | 'csv' = 'json'): number {
    let imported = 0;

    try {
      if (format === 'json') {
        const metadata: DocumentMetadata[] = JSON.parse(data);
        metadata.forEach(meta => {
          this.metadataStore.set(meta.id, meta);
          imported++;
        });
      }
      // TODO: 實作 CSV 匯入

      console.log(`✅ 已匯入 ${imported} 筆元數據`);
    } catch (error) {
      console.error('匯入元數據失敗:', error);
    }

    return imported;
  }

  /**
   * 獲取統計資料
   */
  getStatistics(): {
    totalDocuments: number;
    totalWords: number;
    totalReadingTime: number;
    languageDistribution: Record<string, number>;
    categoryDistribution: Record<string, number>;
    avgWordCount: number;
    avgReadingTime: number;
  } {
    const allMetadata = Array.from(this.metadataStore.values());
    
    const stats = {
      totalDocuments: allMetadata.length,
      totalWords: 0,
      totalReadingTime: 0,
      languageDistribution: {} as Record<string, number>,
      categoryDistribution: {} as Record<string, number>,
      avgWordCount: 0,
      avgReadingTime: 0,
    };

    allMetadata.forEach(meta => {
      stats.totalWords += meta.wordCount;
      stats.totalReadingTime += meta.readingTime;

      stats.languageDistribution[meta.language] =
        (stats.languageDistribution[meta.language] || 0) + 1;

      if (meta.category) {
        stats.categoryDistribution[meta.category] =
          (stats.categoryDistribution[meta.category] || 0) + 1;
      }
    });

    if (allMetadata.length > 0) {
      stats.avgWordCount = Math.round(stats.totalWords / allMetadata.length);
      stats.avgReadingTime = Math.round(stats.totalReadingTime / allMetadata.length);
    }

    return stats;
  }

  // ========== 私有輔助方法 ==========

  private extractTitle(content: string): string {
    // 提取第一行或第一個標題
    const firstLine = content.split('\n')[0].trim();
    
    // 檢查是否為 Markdown 標題
    const mdTitle = firstLine.match(/^#+\s+(.+)/);
    if (mdTitle) {
      return mdTitle[1];
    }

    // 返回前 100 個字符作為標題
    return firstLine.substring(0, 100) || '未命名文檔';
  }

  private countWords(text: string): number {
    // 移除多餘空白
    const cleaned = text.trim().replace(/\s+/g, ' ');
    
    // 計算中文字符
    const chineseChars = (cleaned.match(/[\u4e00-\u9fa5]/g) || []).length;
    
    // 計算英文單詞
    const englishWords = cleaned.split(/\s+/).filter(word => 
      /[a-zA-Z]/.test(word)
    ).length;

    return chineseChars + englishWords;
  }

  private calculateReadingTime(wordCount: number): number {
    // 假設閱讀速度：
    // 中文: ~400 字/分鐘
    // 英文: ~200 詞/分鐘
    // 平均: ~300 字/分鐘
    return Math.ceil(wordCount / 300);
  }

  private getFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  private async calculateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private generateId(): string {
    return `meta-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 清除所有元數據
   */
  clearAll(): void {
    this.metadataStore.clear();
    console.log('🗑️ 所有元數據已清除');
  }
}

export const metadataService = new MetadataService();
export default metadataService;
