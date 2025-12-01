/**
 * AI Model Manager
 * Manages multiple Gemini models with fallback strategy
 * Priority: 2.5 Pro → 2.5 Flash → 2.0 Pro → 2.0 Flash
 * Optimized for MacBook Air M3 8GB RAM
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

interface ModelConfig {
  name: string;
  displayName: string;
  priority: number;
  maxTokens: number;
  costPerToken: number;
  available: boolean;
  usageCount: number;
  errorCount: number;
  lastUsed: number;
  rateLimit: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

interface GenerationRequest {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  preferredModel?: string;
  systemInstruction?: string;
}

interface GenerationResponse {
  text: string;
  model: string;
  tokensUsed: number;
  processingTime: number;
}

class AIModelManager {
  private genAI: GoogleGenerativeAI;
  private models: Map<string, ModelConfig> = new Map();
  private currentModel: string = 'gemini-2.5-pro';
  private requestQueue: Map<string, number[]> = new Map();

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.initializeModels();
    this.startHealthMonitoring();
  }

  /**
   * 初始化所有可用模型
   */
  private initializeModels(): void {
    // Gemini 2.5 Pro - 最強大，優先使用
    this.models.set('gemini-2.5-pro', {
      name: 'gemini-2.5-pro',
      displayName: 'Gemini 2.5 Pro',
      priority: 1,
      maxTokens: 1048576, // 1M tokens
      costPerToken: 0.00025,
      available: true,
      usageCount: 0,
      errorCount: 0,
      lastUsed: 0,
      rateLimit: {
        requestsPerMinute: 10,
        tokensPerMinute: 100000,
      },
    });

    // Gemini 2.5 Flash - 快速且經濟
    this.models.set('gemini-2.5-flash', {
      name: 'gemini-2.5-flash',
      displayName: 'Gemini 2.5 Flash',
      priority: 2,
      maxTokens: 1048576,
      costPerToken: 0.00005,
      available: true,
      usageCount: 0,
      errorCount: 0,
      lastUsed: 0,
      rateLimit: {
        requestsPerMinute: 15,
        tokensPerMinute: 150000,
      },
    });

    // Gemini 2.0 Pro - 備用選項
    this.models.set('gemini-2.0-pro', {
      name: 'gemini-2.0-pro',
      displayName: 'Gemini 2.0 Pro',
      priority: 3,
      maxTokens: 32768,
      costPerToken: 0.0002,
      available: true,
      usageCount: 0,
      errorCount: 0,
      lastUsed: 0,
      rateLimit: {
        requestsPerMinute: 12,
        tokensPerMinute: 120000,
      },
    });

    // Gemini 2.0 Flash - 最後備用
    this.models.set('gemini-2.0-flash', {
      name: 'gemini-2.0-flash',
      displayName: 'Gemini 2.0 Flash',
      priority: 4,
      maxTokens: 8192,
      costPerToken: 0.00003,
      available: true,
      usageCount: 0,
      errorCount: 0,
      lastUsed: 0,
      rateLimit: {
        requestsPerMinute: 20,
        tokensPerMinute: 200000,
      },
    });

    console.log('🤖 AI Model Manager 已初始化，可用模型:', Array.from(this.models.keys()));
  }

  /**
   * 智能生成文本（自動選擇最佳模型）
   */
  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    const startTime = Date.now();
    
    // 選擇模型
    const modelName = await this.selectBestModel(request);
    
    try {
      const model = this.genAI.getGenerativeModel({ model: modelName });
      
      // 配置生成參數
      const generationConfig = {
        temperature: request.temperature || 0.7,
        maxOutputTokens: request.maxTokens || 2048,
      };

      // 生成內容
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: request.prompt }] }],
        generationConfig,
        systemInstruction: request.systemInstruction,
      });

      const response = result.response;
      const text = response.text();
      
      // 更新統計
      const modelConfig = this.models.get(modelName)!;
      modelConfig.usageCount++;
      modelConfig.lastUsed = Date.now();
      
      // 記錄請求時間（用於速率限制）
      this.recordRequest(modelName);

      const processingTime = Date.now() - startTime;

      console.log(`✅ ${modelConfig.displayName} 生成成功 (${processingTime}ms)`);

      return {
        text,
        model: modelName,
        tokensUsed: this.estimateTokens(request.prompt + text),
        processingTime,
      };

    } catch (error) {
      console.error(`❌ ${modelName} 生成失敗:`, error);
      
      // 標記模型錯誤
      const modelConfig = this.models.get(modelName);
      if (modelConfig) {
        modelConfig.errorCount++;
        modelConfig.available = modelConfig.errorCount < 3; // 3次錯誤後禁用
      }

      // 嘗試備用模型
      return this.fallbackGenerate(request, modelName);
    }
  }

  /**
   * 選擇最佳模型
   */
  private async selectBestModel(request: GenerationRequest): Promise<string> {
    // 如果指定了模型且可用，使用指定模型
    if (request.preferredModel && this.models.has(request.preferredModel)) {
      const model = this.models.get(request.preferredModel)!;
      if (model.available && !this.isRateLimited(request.preferredModel)) {
        return request.preferredModel;
      }
    }

    // 按優先順序選擇可用模型
    const availableModels = Array.from(this.models.values())
      .filter(m => m.available && !this.isRateLimited(m.name))
      .sort((a, b) => a.priority - b.priority);

    if (availableModels.length === 0) {
      console.warn('⚠️ 所有模型都不可用或達到速率限制，使用預設模型');
      return 'gemini-2.0-flash';
    }

    const selectedModel = availableModels[0];
    console.log(`🎯 選擇模型: ${selectedModel.displayName} (優先級 ${selectedModel.priority})`);
    
    return selectedModel.name;
  }

  /**
   * 備用模型生成
   */
  private async fallbackGenerate(
    request: GenerationRequest,
    failedModel: string
  ): Promise<GenerationResponse> {
    console.log(`🔄 切換到備用模型...`);

    // 獲取下一個可用模型
    const availableModels = Array.from(this.models.values())
      .filter(m => m.name !== failedModel && m.available && !this.isRateLimited(m.name))
      .sort((a, b) => a.priority - b.priority);

    if (availableModels.length === 0) {
      throw new Error('所有 AI 模型都不可用');
    }

    // 使用下一個模型
    request.preferredModel = availableModels[0].name;
    return this.generate(request);
  }

  /**
   * 檢查是否達到速率限制
   */
  private isRateLimited(modelName: string): boolean {
    const model = this.models.get(modelName);
    if (!model) return true;

    const requests = this.requestQueue.get(modelName) || [];
    const now = Date.now();
    const recentRequests = requests.filter(time => now - time < 60000); // 最近 1 分鐘

    return recentRequests.length >= model.rateLimit.requestsPerMinute;
  }

  /**
   * 記錄請求（用於速率限制）
   */
  private recordRequest(modelName: string): void {
    if (!this.requestQueue.has(modelName)) {
      this.requestQueue.set(modelName, []);
    }
    
    const requests = this.requestQueue.get(modelName)!;
    requests.push(Date.now());

    // 清理舊記錄（超過 1 分鐘）
    const now = Date.now();
    this.requestQueue.set(
      modelName,
      requests.filter(time => now - time < 60000)
    );
  }

  /**
   * 估計 Token 數量
   */
  private estimateTokens(text: string): number {
    // 簡單估計：英文 ~4 字符/token，中文 ~2 字符/token
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const otherChars = text.length - chineseChars;
    return Math.ceil(chineseChars / 2 + otherChars / 4);
  }

  /**
   * 獲取模型狀態
   */
  getModelStatus(): ModelConfig[] {
    return Array.from(this.models.values()).sort((a, b) => a.priority - b.priority);
  }

  /**
   * 獲取使用統計
   */
  getUsageStats(): {
    totalRequests: number;
    totalErrors: number;
    modelBreakdown: Record<string, { requests: number; errors: number; successRate: number }>;
    estimatedCost: number;
  } {
    let totalRequests = 0;
    let totalErrors = 0;
    let estimatedCost = 0;
    const modelBreakdown: Record<string, any> = {};

    this.models.forEach((config, name) => {
      totalRequests += config.usageCount;
      totalErrors += config.errorCount;
      
      const successRate = config.usageCount > 0
        ? ((config.usageCount - config.errorCount) / config.usageCount) * 100
        : 0;

      modelBreakdown[name] = {
        requests: config.usageCount,
        errors: config.errorCount,
        successRate: successRate.toFixed(2) + '%',
      };

      // 估計成本（假設平均 1000 tokens/請求）
      estimatedCost += config.usageCount * 1000 * config.costPerToken;
    });

    return {
      totalRequests,
      totalErrors,
      modelBreakdown,
      estimatedCost: Math.round(estimatedCost * 100) / 100,
    };
  }

  /**
   * 重置模型錯誤計數
   */
  resetModelErrors(modelName?: string): void {
    if (modelName && this.models.has(modelName)) {
      const model = this.models.get(modelName)!;
      model.errorCount = 0;
      model.available = true;
      console.log(`✅ ${model.displayName} 錯誤已重置`);
    } else {
      this.models.forEach(model => {
        model.errorCount = 0;
        model.available = true;
      });
      console.log('✅ 所有模型錯誤已重置');
    }
  }

  /**
   * 健康監控
   */
  private startHealthMonitoring(): void {
    setInterval(() => {
      const stats = this.getUsageStats();
      
      // 如果錯誤率過高，重置錯誤計數
      this.models.forEach(model => {
        if (model.errorCount >= 3 && Date.now() - model.lastUsed > 300000) {
          // 5分鐘未使用，重置錯誤
          model.errorCount = 0;
          model.available = true;
          console.log(`🔄 ${model.displayName} 已自動恢復`);
        }
      });

      console.log('📊 AI 模型健康狀態:', {
        總請求: stats.totalRequests,
        總錯誤: stats.totalErrors,
        估計成本: `$${stats.estimatedCost}`,
      });
    }, 300000); // 每 5 分鐘檢查
  }

  /**
   * 批次生成（並行處理多個請求）
   */
  async batchGenerate(requests: GenerationRequest[]): Promise<GenerationResponse[]> {
    console.log(`🚀 批次生成 ${requests.length} 個請求...`);
    
    // 限制並行數量以避免超出速率限制
    const batchSize = 3;
    const results: GenerationResponse[] = [];

    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(req => this.generate(req))
      );
      results.push(...batchResults);

      // 批次之間稍作延遲
      if (i + batchSize < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`✅ 批次生成完成，共 ${results.length} 個結果`);
    return results;
  }

  /**
   * 串流生成（適合長文本）
   */
  async *generateStream(request: GenerationRequest): AsyncGenerator<string, void, unknown> {
    const modelName = await this.selectBestModel(request);
    const model = this.genAI.getGenerativeModel({ model: modelName });

    const generationConfig = {
      temperature: request.temperature || 0.7,
      maxOutputTokens: request.maxTokens || 2048,
    };

    const result = await model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: request.prompt }] }],
      generationConfig,
      systemInstruction: request.systemInstruction,
    });

    console.log(`🌊 開始串流生成 (${modelName})...`);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      yield text;
    }

    console.log('✅ 串流生成完成');
  }
}

export const aiModelManager = new AIModelManager();
export default aiModelManager;
