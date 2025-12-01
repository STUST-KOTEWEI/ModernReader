/**
 * Meta Search Service
 * Multi-source search aggregation and ranking
 * Optimized for MacBook Air M3 8GB RAM
 */

import { quantumKnowledgeBase } from './quantumKnowledgeBase';
import nlpService from './nlpService';

interface SearchSource {
  name: string;
  type: 'local' | 'web' | 'academic' | 'knowledge_base';
  enabled: boolean;
  weight: number; // 0-1
  priority: number; // 1-10
}

interface SearchResult {
  title: string;
  snippet: string;
  url?: string;
  source: string;
  relevanceScore: number;
  publishDate?: string;
  author?: string;
  citations?: number;
  metadata?: any;
}

interface MetaSearchResult {
  results: SearchResult[];
  totalResults: number;
  searchTime: number;
  sourcesUsed: string[];
  aggregationMethod: 'ranking' | 'clustering' | 'diversity';
}

interface SearchQuery {
  query: string;
  filters?: {
    dateRange?: { start: Date; end: Date };
    sources?: string[];
    resultType?: 'all' | 'articles' | 'videos' | 'images';
    language?: string;
  };
  limit?: number;
  offset?: number;
}

class MetaSearchService {
  private sources: Map<string, SearchSource> = new Map();
  private searchHistory: Array<{ query: string; timestamp: number; results: number }> = [];

  constructor() {
    this.initializeSources();
  }

  /**
   * 初始化搜尋來源
   */
  private initializeSources(): void {
    // 本地知識庫
    this.sources.set('knowledge_base', {
      name: 'Knowledge Base',
      type: 'knowledge_base',
      enabled: true,
      weight: 1.0,
      priority: 1,
    });

    // Google Scholar（學術搜尋）
    this.sources.set('google_scholar', {
      name: 'Google Scholar',
      type: 'academic',
      enabled: true,
      weight: 0.9,
      priority: 2,
    });

    // Wikipedia
    this.sources.set('wikipedia', {
      name: 'Wikipedia',
      type: 'web',
      enabled: true,
      weight: 0.8,
      priority: 3,
    });

    // Web Search（通用網頁搜尋）
    this.sources.set('web_search', {
      name: 'Web Search',
      type: 'web',
      enabled: true,
      weight: 0.7,
      priority: 4,
    });

    console.log('🔍 Meta Search 已初始化，可用來源:', Array.from(this.sources.keys()));
  }

  /**
   * 多來源聚合搜尋
   */
  async search(searchQuery: SearchQuery): Promise<MetaSearchResult> {
    const startTime = Date.now();
    console.log(`🔍 開始 Meta Search: "${searchQuery.query}"`);

    // 並行搜尋所有啟用的來源
    const searchPromises: Promise<SearchResult[]>[] = [];
    const sourcesUsed: string[] = [];

    // 選擇要使用的來源
    const enabledSources = Array.from(this.sources.values())
      .filter(source => source.enabled)
      .filter(source => !searchQuery.filters?.sources || 
                       searchQuery.filters.sources.includes(source.name))
      .sort((a, b) => a.priority - b.priority);

    for (const source of enabledSources) {
      sourcesUsed.push(source.name);
      
      switch (source.type) {
        case 'knowledge_base':
          searchPromises.push(this.searchKnowledgeBase(searchQuery));
          break;
        case 'web':
          searchPromises.push(this.searchWeb(searchQuery, source));
          break;
        case 'academic':
          searchPromises.push(this.searchAcademic(searchQuery));
          break;
      }
    }

    // 等待所有搜尋完成
    const allResults = await Promise.all(searchPromises);
    
    // 合併結果
    let combinedResults: SearchResult[] = [];
    allResults.forEach((results, index) => {
      const source = enabledSources[index];
      // 應用權重
      results.forEach(result => {
        result.relevanceScore *= source.weight;
      });
      combinedResults.push(...results);
    });

    // 去重
    combinedResults = this.deduplicateResults(combinedResults);

    // 重新排序
    combinedResults = this.rankResults(combinedResults);

    // 限制結果數量
    const limit = searchQuery.limit || 20;
    const offset = searchQuery.offset || 0;
    const paginatedResults = combinedResults.slice(offset, offset + limit);

    const searchTime = Date.now() - startTime;

    // 記錄搜尋歷史
    this.searchHistory.push({
      query: searchQuery.query,
      timestamp: Date.now(),
      results: combinedResults.length,
    });

    console.log(`✅ Meta Search 完成: ${combinedResults.length} 個結果 (${searchTime}ms)`);

    return {
      results: paginatedResults,
      totalResults: combinedResults.length,
      searchTime,
      sourcesUsed,
      aggregationMethod: 'ranking',
    };
  }

  /**
   * 搜尋本地知識庫
   */
  private async searchKnowledgeBase(searchQuery: SearchQuery): Promise<SearchResult[]> {
    try {
      const nodes = await quantumKnowledgeBase.search(searchQuery.query, {
        limit: 10,
        minRelevance: 0.3,
      });

      return nodes.map(node => ({
        title: node.content.substring(0, 100) + '...',
        snippet: node.content.substring(0, 300) + '...',
        source: 'Knowledge Base',
        relevanceScore: node.importance,
        metadata: {
          type: node.type,
          tags: node.tags,
          connections: node.connections.length,
        },
      }));
    } catch (error) {
      console.error('Knowledge Base 搜尋失敗:', error);
      return [];
    }
  }

  /**
   * 網頁搜尋（模擬）
   */
  private async searchWeb(searchQuery: SearchQuery, source: SearchSource): Promise<SearchResult[]> {
    // 實際應用應整合真實的搜尋 API (Google, Bing, DuckDuckGo)
    console.log(`🌐 搜尋 ${source.name}...`);
    
    // 模擬搜尋結果
    return [
      {
        title: `${searchQuery.query} - 相關網頁 1`,
        snippet: `這是關於 ${searchQuery.query} 的詳細介紹...`,
        url: 'https://example.com/1',
        source: source.name,
        relevanceScore: 0.8,
      },
      {
        title: `${searchQuery.query} - 相關網頁 2`,
        snippet: `進一步了解 ${searchQuery.query} 的應用...`,
        url: 'https://example.com/2',
        source: source.name,
        relevanceScore: 0.7,
      },
    ];
  }

  /**
   * 學術搜尋（模擬）
   */
  private async searchAcademic(searchQuery: SearchQuery): Promise<SearchResult[]> {
    // 實際應用應整合 Google Scholar API 或其他學術數據庫
    console.log('📚 搜尋學術資源...');
    
    return [
      {
        title: `Academic Paper: ${searchQuery.query}`,
        snippet: `Research findings on ${searchQuery.query}...`,
        url: 'https://scholar.google.com/1',
        source: 'Google Scholar',
        relevanceScore: 0.9,
        publishDate: '2024-01-15',
        author: 'Dr. Smith et al.',
        citations: 42,
      },
    ];
  }

  /**
   * 結果去重
   */
  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    const unique: SearchResult[] = [];

    for (const result of results) {
      // 基於標題和來源的簡單去重
      const key = `${result.title}-${result.source}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(result);
      }
    }

    return unique;
  }

  /**
   * 結果排序
   */
  private rankResults(results: SearchResult[]): SearchResult[] {
    return results.sort((a, b) => {
      // 多因素排序
      let scoreA = a.relevanceScore;
      let scoreB = b.relevanceScore;

      // 考慮引用數（如果有）
      if (a.citations) scoreA += Math.log10(a.citations + 1) * 0.1;
      if (b.citations) scoreB += Math.log10(b.citations + 1) * 0.1;

      // 考慮發布日期（越新越好）
      if (a.publishDate && b.publishDate) {
        const dateA = new Date(a.publishDate).getTime();
        const dateB = new Date(b.publishDate).getTime();
        const recencyBonus = 0.05;
        scoreA += (dateA > dateB ? recencyBonus : 0);
        scoreB += (dateB > dateA ? recencyBonus : 0);
      }

      return scoreB - scoreA;
    });
  }

  /**
   * 語義搜尋（使用 NLP）
   */
  async semanticSearch(query: string): Promise<MetaSearchResult> {
    console.log('🧠 執行語義搜尋...');

    // 使用 NLP 分析查詢
    const analysis = await nlpService.analyze(query);
    
    // 擴展查詢（使用關鍵詞和實體）
    const expandedQuery = [
      query,
      ...analysis.keywords.slice(0, 5).map(k => k.text),
      ...analysis.entities.slice(0, 3).map(e => e.text),
    ].join(' ');

    console.log(`📝 擴展查詢: "${expandedQuery}"`);

    // 執行擴展搜尋
    return this.search({ query: expandedQuery });
  }

  /**
   * 多語言搜尋
   */
  async multilingualSearch(query: string, targetLanguages: string[]): Promise<MetaSearchResult> {
    console.log(`🌍 多語言搜尋: ${targetLanguages.join(', ')}`);

    // 並行搜尋多種語言
    const searchPromises = targetLanguages.map(lang => 
      this.search({ 
        query, 
        filters: { language: lang } 
      })
    );

    const results = await Promise.all(searchPromises);

    // 合併所有語言的結果
    const combinedResults = results.flatMap(r => r.results);
    const allSources = [...new Set(results.flatMap(r => r.sourcesUsed))];

    return {
      results: this.rankResults(this.deduplicateResults(combinedResults)),
      totalResults: combinedResults.length,
      searchTime: Math.max(...results.map(r => r.searchTime)),
      sourcesUsed: allSources,
      aggregationMethod: 'ranking',
    };
  }

  /**
   * 相關搜尋建議
   */
  async getRelatedQueries(query: string): Promise<string[]> {
    // 使用 NLP 提取關鍵概念
    const analysis = await nlpService.analyze(query);
    
    const relatedQueries: string[] = [];

    // 基於主題
    analysis.topics.forEach(topic => {
      relatedQueries.push(`${topic.name} 詳細介紹`);
      relatedQueries.push(`${topic.name} 應用案例`);
    });

    // 基於實體
    analysis.entities.slice(0, 3).forEach(entity => {
      relatedQueries.push(`${entity.text} 是什麼`);
    });

    return relatedQueries.slice(0, 10);
  }

  /**
   * 搜尋趨勢分析
   */
  getSearchTrends(limit: number = 10): Array<{ query: string; count: number }> {
    const queryCounts = new Map<string, number>();

    this.searchHistory.forEach(entry => {
      const count = queryCounts.get(entry.query) || 0;
      queryCounts.set(entry.query, count + 1);
    });

    return Array.from(queryCounts.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * 搜尋自動完成
   */
  async autocomplete(partialQuery: string): Promise<string[]> {
    // 基於搜尋歷史的簡單自動完成
    const suggestions = this.searchHistory
      .filter(entry => entry.query.toLowerCase().includes(partialQuery.toLowerCase()))
      .map(entry => entry.query)
      .slice(0, 5);

    return [...new Set(suggestions)]; // 去重
  }

  /**
   * 啟用/禁用搜尋來源
   */
  toggleSource(sourceName: string, enabled: boolean): void {
    const source = this.sources.get(sourceName);
    if (source) {
      source.enabled = enabled;
      console.log(`${enabled ? '✅' : '❌'} ${source.name} ${enabled ? '已啟用' : '已禁用'}`);
    }
  }

  /**
   * 獲取所有來源
   */
  getSources(): SearchSource[] {
    return Array.from(this.sources.values());
  }

  /**
   * 清除搜尋歷史
   */
  clearHistory(): void {
    this.searchHistory = [];
    console.log('🗑️ 搜尋歷史已清除');
  }

  /**
   * 導出搜尋結果
   */
  exportResults(results: SearchResult[], format: 'json' | 'csv' | 'markdown'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(results, null, 2);
      
      case 'csv':
        const headers = 'Title,Snippet,URL,Source,Relevance Score\n';
        const rows = results.map(r => 
          `"${r.title}","${r.snippet}","${r.url || ''}","${r.source}",${r.relevanceScore}`
        ).join('\n');
        return headers + rows;
      
      case 'markdown':
        return results.map((r, i) => 
          `## ${i + 1}. ${r.title}\n\n${r.snippet}\n\n**來源**: ${r.source} | **相關度**: ${(r.relevanceScore * 100).toFixed(0)}%\n${r.url ? `**連結**: ${r.url}` : ''}\n\n---\n`
        ).join('\n');
      
      default:
        return JSON.stringify(results);
    }
  }
}

export const metaSearchService = new MetaSearchService();
export default metaSearchService;
