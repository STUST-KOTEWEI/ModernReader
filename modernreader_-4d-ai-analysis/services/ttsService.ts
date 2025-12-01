/**
 * Text-to-Speech (TTS) Service
 * High-quality text-to-speech with multiple voices
 * Optimized for MacBook Air M3 8GB RAM
 */

interface TTSVoice {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  quality: 'standard' | 'premium' | 'neural';
  provider: 'browser' | 'google' | 'azure';
}

interface TTSConfig {
  voice: string;
  rate: number; // 0.5 - 2.0
  pitch: number; // 0.0 - 2.0
  volume: number; // 0.0 - 1.0
  language: string;
  emphasis: 'none' | 'reduced' | 'moderate' | 'strong';
}

interface TTSProgress {
  currentWord: number;
  totalWords: number;
  currentChar: number;
  totalChars: number;
  percentage: number;
}

class TTSService {
  private synthesis: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isPaused: boolean = false;
  private isSpeaking: boolean = false;
  private config: TTSConfig = {
    voice: 'default',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    language: 'zh-TW',
    emphasis: 'moderate',
  };
  private progressCallbacks: ((progress: TTSProgress) => void)[] = [];

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.loadVoices();
  }

  /**
   * 載入可用語音
   */
  private loadVoices(): void {
    // 某些瀏覽器需要異步載入語音
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => {
        console.log('🔊 語音已載入:', this.getAvailableVoices().length);
      };
    }
  }

  /**
   * 獲取可用語音列表
   */
  getAvailableVoices(): TTSVoice[] {
    const voices = this.synthesis.getVoices();
    
    return voices.map(voice => ({
      id: voice.voiceURI,
      name: voice.name,
      language: voice.lang,
      gender: this.detectGender(voice.name),
      quality: this.detectQuality(voice.name),
      provider: 'browser',
    }));
  }

  /**
   * 獲取推薦語音（基於語言）
   */
  getRecommendedVoice(language: string = 'zh-TW'): TTSVoice | null {
    const voices = this.getAvailableVoices();
    
    // 優先選擇 Neural 品質
    const neuralVoice = voices.find(v => 
      v.language.startsWith(language.split('-')[0]) && v.quality === 'neural'
    );
    if (neuralVoice) return neuralVoice;

    // 其次選擇 Premium 品質
    const premiumVoice = voices.find(v => 
      v.language.startsWith(language.split('-')[0]) && v.quality === 'premium'
    );
    if (premiumVoice) return premiumVoice;

    // 最後選擇任何匹配語言的語音
    return voices.find(v => v.language.startsWith(language.split('-')[0])) || null;
  }

  /**
   * 朗讀文本
   */
  async speak(text: string, config?: Partial<TTSConfig>): Promise<void> {
    // 停止當前朗讀
    this.stop();

    // 更新配置
    const finalConfig = { ...this.config, ...config };

    // 創建新的語音合成對象
    const utterance = new SpeechSynthesisUtterance(text);
    
    // 設置語音
    const voices = this.synthesis.getVoices();
    const selectedVoice = voices.find(v => v.voiceURI === finalConfig.voice || v.name === finalConfig.voice);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // 設置參數
    utterance.rate = finalConfig.rate;
    utterance.pitch = finalConfig.pitch;
    utterance.volume = finalConfig.volume;
    utterance.lang = finalConfig.language;

    // 設置事件監聽
    return new Promise((resolve, reject) => {
      utterance.onstart = () => {
        this.isSpeaking = true;
        console.log('🔊 開始朗讀');
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.isPaused = false;
        this.currentUtterance = null;
        console.log('✅ 朗讀完成');
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        this.isPaused = false;
        this.currentUtterance = null;
        console.error('❌ 朗讀錯誤:', event);
        reject(event);
      };

      utterance.onboundary = (event) => {
        // 更新進度
        const progress: TTSProgress = {
          currentWord: event.charIndex,
          totalWords: text.split(/\s+/).length,
          currentChar: event.charIndex,
          totalChars: text.length,
          percentage: (event.charIndex / text.length) * 100,
        };
        
        this.progressCallbacks.forEach(callback => callback(progress));
      };

      this.currentUtterance = utterance;
      this.synthesis.speak(utterance);
    });
  }

  /**
   * 暫停朗讀
   */
  pause(): void {
    if (this.isSpeaking && !this.isPaused) {
      this.synthesis.pause();
      this.isPaused = true;
      console.log('⏸️ 朗讀已暫停');
    }
  }

  /**
   * 繼續朗讀
   */
  resume(): void {
    if (this.isSpeaking && this.isPaused) {
      this.synthesis.resume();
      this.isPaused = false;
      console.log('▶️ 繼續朗讀');
    }
  }

  /**
   * 停止朗讀
   */
  stop(): void {
    if (this.isSpeaking || this.isPaused) {
      this.synthesis.cancel();
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
      console.log('⏹️ 朗讀已停止');
    }
  }

  /**
   * 檢查是否正在朗讀
   */
  isCurrentlySpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * 檢查是否已暫停
   */
  isCurrentlyPaused(): boolean {
    return this.isPaused;
  }

  /**
   * 分段朗讀（長文本）
   */
  async speakInChunks(text: string, chunkSize: number = 200): Promise<void> {
    const sentences = text.split(/[.!?。！？]+/).filter(s => s.trim().length > 0);
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
        await this.speak(currentChunk);
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }

    if (currentChunk.trim().length > 0) {
      await this.speak(currentChunk);
    }
  }

  /**
   * 訂閱進度更新
   */
  onProgress(callback: (progress: TTSProgress) => void): () => void {
    this.progressCallbacks.push(callback);
    
    // 返回取消訂閱函數
    return () => {
      this.progressCallbacks = this.progressCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * 設置語速
   */
  setRate(rate: number): void {
    this.config.rate = Math.max(0.5, Math.min(2.0, rate));
    console.log(`⚙️ 語速設為: ${this.config.rate}x`);
  }

  /**
   * 設置音調
   */
  setPitch(pitch: number): void {
    this.config.pitch = Math.max(0.0, Math.min(2.0, pitch));
    console.log(`⚙️ 音調設為: ${this.config.pitch}`);
  }

  /**
   * 設置音量
   */
  setVolume(volume: number): void {
    this.config.volume = Math.max(0.0, Math.min(1.0, volume));
    console.log(`⚙️ 音量設為: ${(this.config.volume * 100).toFixed(0)}%`);
  }

  /**
   * 設置語音
   */
  setVoice(voiceId: string): void {
    this.config.voice = voiceId;
    console.log(`⚙️ 語音設為: ${voiceId}`);
  }

  /**
   * 獲取當前配置
   */
  getConfig(): TTSConfig {
    return { ...this.config };
  }

  /**
   * 預覽語音（朗讀示例文本）
   */
  async previewVoice(voiceId: string, sampleText: string = '你好，這是語音預覽。'): Promise<void> {
    await this.speak(sampleText, { voice: voiceId });
  }

  /**
   * 匯出音訊（如果瀏覽器支援）
   */
  async exportAudio(text: string, format: 'mp3' | 'wav' = 'mp3'): Promise<Blob | null> {
    // Web Speech API 不直接支援音訊匯出
    // 需要使用 Web Audio API 或外部服務
    console.warn('⚠️ 瀏覽器 TTS 不支援直接匯出音訊');
    console.log('💡 建議：使用 Google Cloud TTS API 或 Azure Speech Service');
    return null;
  }

  /**
   * SSML 支援（語音合成標記語言）
   */
  async speakSSML(ssml: string): Promise<void> {
    // Web Speech API 有限的 SSML 支援
    // 移除 SSML 標籤並朗讀純文本
    const plainText = ssml.replace(/<[^>]*>/g, '');
    await this.speak(plainText);
  }

  /**
   * 偵測性別（基於語音名稱）
   */
  private detectGender(voiceName: string): 'male' | 'female' | 'neutral' {
    const name = voiceName.toLowerCase();
    if (name.includes('female') || name.includes('woman') || name.includes('她')) {
      return 'female';
    } else if (name.includes('male') || name.includes('man') || name.includes('他')) {
      return 'male';
    }
    return 'neutral';
  }

  /**
   * 偵測品質
   */
  private detectQuality(voiceName: string): 'standard' | 'premium' | 'neural' {
    const name = voiceName.toLowerCase();
    if (name.includes('neural') || name.includes('premium') || name.includes('enhanced')) {
      return 'neural';
    } else if (name.includes('premium') || name.includes('hq')) {
      return 'premium';
    }
    return 'standard';
  }

  /**
   * 獲取支援的語言列表
   */
  getSupportedLanguages(): string[] {
    const voices = this.getAvailableVoices();
    const languages = new Set(voices.map(v => v.language));
    return Array.from(languages).sort();
  }

  /**
   * 自動選擇最佳語音
   */
  autoSelectVoice(text: string): TTSVoice | null {
    // 簡單的語言檢測
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const totalChars = text.length;

    let language = 'en-US';
    if (chineseChars / totalChars > 0.3) {
      language = 'zh-TW';
    }

    return this.getRecommendedVoice(language);
  }
}

export const ttsService = new TTSService();
export default ttsService;
