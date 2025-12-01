/**
 * Speech-to-Text (STT) Service
 * Real-time speech recognition with multiple languages
 * Optimized for MacBook Air M3 8GB RAM
 */

interface STTConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

interface STTResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  alternatives?: Array<{ transcript: string; confidence: number }>;
  timestamp: number;
}

interface STTStats {
  totalRecordings: number;
  totalDuration: number; // seconds
  avgConfidence: number;
  mostUsedLanguage: string;
}

class STTService {
  private recognition: any; // SpeechRecognition
  private isListening: boolean = false;
  private config: STTConfig = {
    language: 'zh-TW',
    continuous: false,
    interimResults: true,
    maxAlternatives: 3,
  };
  private resultCallbacks: ((result: STTResult) => void)[] = [];
  private errorCallbacks: ((error: any) => void)[] = [];
  private stats: STTStats = {
    totalRecordings: 0,
    totalDuration: 0,
    avgConfidence: 0,
    mostUsedLanguage: 'zh-TW',
  };
  private startTime: number = 0;

  constructor() {
    this.initializeRecognition();
  }

  /**
   * 初始化語音識別
   */
  private initializeRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('❌ 瀏覽器不支援語音識別');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.applyConfig();
    this.setupEventListeners();

    console.log('🎤 語音識別已初始化');
  }

  /**
   * 應用配置
   */
  private applyConfig(): void {
    if (!this.recognition) return;

    this.recognition.lang = this.config.language;
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.maxAlternatives = this.config.maxAlternatives;
  }

  /**
   * 設置事件監聽器
   */
  private setupEventListeners(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.startTime = Date.now();
      console.log('🎤 開始錄音');
    };

    this.recognition.onresult = (event: any) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      
      const alternatives = [];
      for (let i = 0; i < lastResult.length; i++) {
        alternatives.push({
          transcript: lastResult[i].transcript,
          confidence: lastResult[i].confidence,
        });
      }

      const result: STTResult = {
        transcript: lastResult[0].transcript,
        confidence: lastResult[0].confidence,
        isFinal: lastResult.isFinal,
        alternatives,
        timestamp: Date.now(),
      };

      // 更新統計
      if (result.isFinal) {
        this.stats.totalRecordings++;
        this.stats.avgConfidence = 
          (this.stats.avgConfidence * (this.stats.totalRecordings - 1) + result.confidence) / 
          this.stats.totalRecordings;
      }

      // 通知所有訂閱者
      this.resultCallbacks.forEach(callback => callback(result));
    };

    this.recognition.onerror = (event: any) => {
      console.error('❌ 語音識別錯誤:', event.error);
      this.errorCallbacks.forEach(callback => callback(event));
    };

    this.recognition.onend = () => {
      if (this.startTime > 0) {
        const duration = (Date.now() - this.startTime) / 1000;
        this.stats.totalDuration += duration;
      }
      
      this.isListening = false;
      console.log('⏹️ 錄音結束');
    };
  }

  /**
   * 開始語音識別
   */
  start(): void {
    if (!this.recognition) {
      console.error('❌ 語音識別未初始化');
      return;
    }

    if (this.isListening) {
      console.warn('⚠️ 已經在錄音中');
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      console.error('❌ 啟動語音識別失敗:', error);
    }
  }

  /**
   * 停止語音識別
   */
  stop(): void {
    if (!this.recognition || !this.isListening) {
      return;
    }

    try {
      this.recognition.stop();
    } catch (error) {
      console.error('❌ 停止語音識別失敗:', error);
    }
  }

  /**
   * 中止語音識別（立即停止）
   */
  abort(): void {
    if (!this.recognition) return;

    try {
      this.recognition.abort();
      this.isListening = false;
    } catch (error) {
      console.error('❌ 中止語音識別失敗:', error);
    }
  }

  /**
   * 檢查是否正在錄音
   */
  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  /**
   * 訂閱識別結果
   */
  onResult(callback: (result: STTResult) => void): () => void {
    this.resultCallbacks.push(callback);
    
    // 返回取消訂閱函數
    return () => {
      this.resultCallbacks = this.resultCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * 訂閱錯誤事件
   */
  onError(callback: (error: any) => void): () => void {
    this.errorCallbacks.push(callback);
    
    return () => {
      this.errorCallbacks = this.errorCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * 錄製單次語音（Promise 模式）
   */
  async recordOnce(timeout: number = 10000): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('語音識別未初始化'));
        return;
      }

      // 設置為非連續模式
      const originalContinuous = this.config.continuous;
      this.config.continuous = false;
      this.applyConfig();

      let finalTranscript = '';
      let hasResult = false;

      const resultHandler = (result: STTResult) => {
        if (result.isFinal) {
          finalTranscript = result.transcript;
          hasResult = true;
        }
      };

      const errorHandler = (error: any) => {
        cleanup();
        reject(error);
      };

      const cleanup = () => {
        clearTimeout(timeoutId);
        this.resultCallbacks = this.resultCallbacks.filter(cb => cb !== resultHandler);
        this.errorCallbacks = this.errorCallbacks.filter(cb => cb !== errorHandler);
        this.config.continuous = originalContinuous;
        this.applyConfig();
      };

      const timeoutId = setTimeout(() => {
        this.stop();
        cleanup();
        if (hasResult) {
          resolve(finalTranscript);
        } else {
          reject(new Error('錄音超時'));
        }
      }, timeout);

      this.resultCallbacks.push(resultHandler);
      this.errorCallbacks.push(errorHandler);

      this.recognition.onend = () => {
        cleanup();
        if (hasResult) {
          resolve(finalTranscript);
        } else {
          reject(new Error('未識別到語音'));
        }
      };

      this.start();
    });
  }

  /**
   * 連續語音識別（適合長時間錄音）
   */
  startContinuous(): void {
    this.config.continuous = true;
    this.applyConfig();
    this.start();
  }

  /**
   * 設置語言
   */
  setLanguage(language: string): void {
    this.config.language = language;
    this.applyConfig();
    console.log(`⚙️ 語言設為: ${language}`);
  }

  /**
   * 設置是否返回中間結果
   */
  setInterimResults(enabled: boolean): void {
    this.config.interimResults = enabled;
    this.applyConfig();
    console.log(`⚙️ 中間結果: ${enabled ? '啟用' : '禁用'}`);
  }

  /**
   * 獲取支援的語言
   */
  getSupportedLanguages(): string[] {
    // 常見的語音識別支援語言
    return [
      'zh-TW', // 繁體中文
      'zh-CN', // 簡體中文
      'en-US', // 英語（美國）
      'en-GB', // 英語（英國）
      'ja-JP', // 日語
      'ko-KR', // 韓語
      'es-ES', // 西班牙語
      'fr-FR', // 法語
      'de-DE', // 德語
      'it-IT', // 義大利語
      'pt-BR', // 葡萄牙語（巴西）
      'ru-RU', // 俄語
    ];
  }

  /**
   * 獲取統計資料
   */
  getStats(): STTStats {
    return { ...this.stats };
  }

  /**
   * 重置統計資料
   */
  resetStats(): void {
    this.stats = {
      totalRecordings: 0,
      totalDuration: 0,
      avgConfidence: 0,
      mostUsedLanguage: this.config.language,
    };
    console.log('🔄 統計資料已重置');
  }

  /**
   * 檢查瀏覽器支援
   */
  static isSupported(): boolean {
    return !!(
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition
    );
  }

  /**
   * 語音轉文字並進行 NLP 分析
   */
  async recordAndAnalyze(timeout: number = 10000): Promise<{
    transcript: string;
    analysis?: any; // NLP analysis result
  }> {
    const transcript = await this.recordOnce(timeout);
    
    // 可以在這裡整合 NLP Service
    // const analysis = await nlpService.analyze(transcript);
    
    return {
      transcript,
      // analysis,
    };
  }

  /**
   * 語音命令識別
   */
  async recognizeCommand(
    commands: string[],
    timeout: number = 5000
  ): Promise<{ command: string | null; confidence: number }> {
    try {
      const transcript = await this.recordOnce(timeout);
      const lowerTranscript = transcript.toLowerCase();

      // 查找匹配的命令
      for (const command of commands) {
        if (lowerTranscript.includes(command.toLowerCase())) {
          return { command, confidence: 0.9 };
        }
      }

      // 模糊匹配
      const fuzzyMatch = this.fuzzyMatchCommand(lowerTranscript, commands);
      if (fuzzyMatch.confidence > 0.6) {
        return fuzzyMatch;
      }

      return { command: null, confidence: 0 };
    } catch (error) {
      console.error('❌ 命令識別失敗:', error);
      return { command: null, confidence: 0 };
    }
  }

  /**
   * 模糊匹配命令
   */
  private fuzzyMatchCommand(
    transcript: string,
    commands: string[]
  ): { command: string | null; confidence: number } {
    let bestMatch: string | null = null;
    let bestScore = 0;

    for (const command of commands) {
      const score = this.calculateSimilarity(transcript, command);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = command;
      }
    }

    return { command: bestMatch, confidence: bestScore };
  }

  /**
   * 計算文字相似度（簡化版）
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    // 簡單的子字串匹配
    if (s1.includes(s2) || s2.includes(s1)) {
      return 0.8;
    }

    // Levenshtein distance 簡化版
    const maxLen = Math.max(s1.length, s2.length);
    const distance = this.levenshteinDistance(s1, s2);
    return 1 - distance / maxLen;
  }

  /**
   * Levenshtein 距離算法
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,    // deletion
            dp[i][j - 1] + 1,    // insertion
            dp[i - 1][j - 1] + 1 // substitution
          );
        }
      }
    }

    return dp[m][n];
  }

  /**
   * 獲取當前配置
   */
  getConfig(): STTConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<STTConfig>): void {
    this.config = { ...this.config, ...config };
    this.applyConfig();
    console.log('⚙️ STT 配置已更新:', this.config);
  }
}

export const sttService = new STTService();
export default sttService;
