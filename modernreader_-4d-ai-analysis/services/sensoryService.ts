/**
 * 4D多感官服務
 * 整合視覺、聽覺、觸覺、嗅覺等多重感官體驗
 */

// ==================== 視覺增強 ====================
export class VisualEnhancement {
  private canvas: HTMLCanvasElement | null = null;
  
  // AR/VR 支援檢測
  static async checkXRSupport() {
    if ('xr' in navigator) {
      const xr = (navigator as any).xr;
      return {
        vr: await xr?.isSessionSupported?.('immersive-vr') || false,
        ar: await xr?.isSessionSupported?.('immersive-ar') || false,
      };
    }
    return { vr: false, ar: false };
  }

  // 3D 文字渲染
  create3DText(text: string, options = {}) {
    return {
      text,
      depth: 0.5,
      rotation: { x: 0, y: 0, z: 0 },
      color: '#8b5cf6',
      ...options
    };
  }

  // 環境光效
  createAmbientLighting(mood: 'focus' | 'relax' | 'energize' | 'immersive') {
    const moods = {
      focus: { color: '#3b82f6', intensity: 0.6 },
      relax: { color: '#10b981', intensity: 0.4 },
      energize: { color: '#f59e0b', intensity: 0.8 },
      immersive: { color: '#8b5cf6', intensity: 0.5 }
    };
    return moods[mood];
  }
}

// ==================== 聽覺增強 ====================
export class AudioEnhancement {
  private audioContext: AudioContext | null = null;
  private spatialPanner: PannerNode | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  // 3D 空間音效
  createSpatialAudio(audioBuffer: AudioBuffer, position: { x: number; y: number; z: number }) {
    if (!this.audioContext) return null;

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;

    this.spatialPanner = this.audioContext.createPanner();
    this.spatialPanner.panningModel = 'HRTF';
    this.spatialPanner.distanceModel = 'inverse';
    this.spatialPanner.refDistance = 1;
    this.spatialPanner.maxDistance = 10000;
    this.spatialPanner.rolloffFactor = 1;
    this.spatialPanner.coneInnerAngle = 360;
    this.spatialPanner.coneOuterAngle = 0;
    this.spatialPanner.coneOuterGain = 0;

    this.spatialPanner.setPosition(position.x, position.y, position.z);

    source.connect(this.spatialPanner);
    this.spatialPanner.connect(this.audioContext.destination);

    return source;
  }

  // 環境音效
  async playAmbientSound(type: 'library' | 'nature' | 'cafe' | 'rain' | 'ocean') {
    // 可以整合真實的音效檔案或生成音效
    console.log(`Playing ambient sound: ${type}`);
  }

  // 文字轉語音（帶情感）
  async textToSpeechWithEmotion(text: string, emotion: 'neutral' | 'happy' | 'sad' | 'excited') {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // 根據情感調整語音參數
      const emotionSettings = {
        neutral: { pitch: 1, rate: 1, volume: 1 },
        happy: { pitch: 1.2, rate: 1.1, volume: 1 },
        sad: { pitch: 0.8, rate: 0.9, volume: 0.8 },
        excited: { pitch: 1.3, rate: 1.2, volume: 1 }
      };

      const settings = emotionSettings[emotion];
      utterance.pitch = settings.pitch;
      utterance.rate = settings.rate;
      utterance.volume = settings.volume;

      window.speechSynthesis.speak(utterance);
    }
  }
}

// ==================== 觸覺反饋 ====================
export class HapticFeedback {
  // 震動模式
  static vibrate(pattern: number | number[]) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  // 預設震動效果
  static patterns = {
    click: [10],
    success: [50, 100, 50],
    error: [100, 50, 100, 50, 100],
    notification: [200, 100, 200],
    pageFlip: [30],
    highlight: [20, 50, 20],
    longPress: [500],
    typing: [5]
  };

  static triggerFeedback(type: keyof typeof HapticFeedback.patterns) {
    this.vibrate(this.patterns[type]);
  }
}

// ==================== 手勢控制 ====================
export class GestureControl {
  private video: HTMLVideoElement | null = null;
  private handTracker: any = null;

  async initialize(videoElement: HTMLVideoElement) {
    this.video = videoElement;
    // 使用 handtrack.js 或其他手勢識別庫
    try {
      const handtrack = (window as any).handTrack;
      if (handtrack) {
        this.handTracker = await handtrack.load();
      }
    } catch (e) {
      console.error('Hand tracking not available:', e);
    }
  }

  async detectGestures() {
    if (!this.handTracker || !this.video) return null;

    const predictions = await this.handTracker.detect(this.video);
    return this.interpretGestures(predictions);
  }

  private interpretGestures(predictions: any[]) {
    // 解釋手勢為動作
    // 例如：揮手 = 翻頁、捏合 = 縮放、指向 = 選擇
    return predictions.map(p => ({
      gesture: p.label,
      confidence: p.score,
      bbox: p.bbox
    }));
  }
}

// ==================== 語音識別 ====================
export class VoiceRecognition {
  private recognition: any = null;
  private isListening = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'zh-TW';
      }
    }
  }

  startListening(onResult: (text: string, isFinal: boolean) => void) {
    if (!this.recognition) return;

    this.recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const text = event.results[last][0].transcript;
      const isFinal = event.results[last].isFinal;
      onResult(text, isFinal);
    };

    this.recognition.start();
    this.isListening = true;
  }

  stopListening() {
    if (this.recognition) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  // 語音命令識別
  parseVoiceCommand(text: string): { action: string; params?: any } | null {
    const commands = [
      { pattern: /閱讀|朗讀|讀出來/, action: 'read_aloud' },
      { pattern: /翻頁|下一頁/, action: 'next_page' },
      { pattern: /上一頁|回到上一頁/, action: 'prev_page' },
      { pattern: /放大|zoom in/, action: 'zoom_in' },
      { pattern: /縮小|zoom out/, action: 'zoom_out' },
      { pattern: /搜尋|找(.+)/, action: 'search', capture: 1 },
      { pattern: /書籤|加入書籤/, action: 'bookmark' },
      { pattern: /高亮|標記/, action: 'highlight' },
      { pattern: /總結|摘要/, action: 'summarize' },
    ];

    for (const cmd of commands) {
      const match = text.match(cmd.pattern);
      if (match) {
        return {
          action: cmd.action,
          params: cmd.capture ? match[cmd.capture] : undefined
        };
      }
    }
    return null;
  }
}

// ==================== 眼動追蹤 ====================
export class EyeTracking {
  private videoElement: HTMLVideoElement | null = null;
  private isTracking = false;

  async initialize(video: HTMLVideoElement) {
    this.videoElement = video;
    // WebGazer.js 或其他眼動追蹤庫
    console.log('Eye tracking initialized');
  }

  async calibrate() {
    // 校準眼動追蹤
    console.log('Calibrating eye tracking...');
  }

  getCurrentGazePoint(): { x: number; y: number } | null {
    // 返回當前注視點
    return null; // 實際實現需要整合庫
  }

  // 檢測閱讀模式
  detectReadingPattern() {
    // 分析眼動軌跡，判斷是否在閱讀
    return {
      isReading: false,
      focusArea: null,
      readingSpeed: 0
    };
  }
}

// ==================== 腦波整合 (需要硬體) ====================
export class BrainwaveIntegration {
  private device: any = null;

  async connectDevice(deviceType: 'muse' | 'emotiv' | 'neurosky') {
    console.log(`Connecting to ${deviceType} device...`);
    // 需要整合對應的 SDK
  }

  getCurrentState() {
    return {
      attention: 0,
      meditation: 0,
      stress: 0
    };
  }

  // 根據腦波狀態調整閱讀體驗
  adaptExperience(state: { attention: number; meditation: number; stress: number }) {
    if (state.attention < 0.5) {
      return 'increase_engagement'; // 增加互動性
    }
    if (state.stress > 0.7) {
      return 'reduce_complexity'; // 降低複雜度
    }
    return 'maintain';
  }
}

// ==================== IoT 感官裝置整合 ====================
export class IoTSensoryDevice {
  private mqttClient: any = null;

  async connect(brokerUrl: string) {
    // 連接 MQTT broker 來控制 IoT 裝置
    console.log(`Connecting to IoT devices at ${brokerUrl}`);
  }

  // 觸發香氛裝置
  async triggerScent(scent: 'lavender' | 'citrus' | 'mint' | 'coffee' | 'ocean') {
    console.log(`Triggering scent: ${scent}`);
    // 發送 MQTT 消息到香氛裝置
  }

  // 調整溫度
  async adjustTemperature(temp: number) {
    console.log(`Adjusting temperature to ${temp}°C`);
  }

  // 控制環境光
  async setAmbientLight(color: string, brightness: number) {
    console.log(`Setting ambient light: ${color} at ${brightness}%`);
  }

  // 觸發風扇模擬風感
  async triggerWind(intensity: number) {
    console.log(`Wind intensity: ${intensity}`);
  }
}

// ==================== 生物識別 ====================
export class BiometricAuth {
  static async authenticate() {
    if ('credentials' in navigator) {
      try {
        const credential = await (navigator.credentials as any).get({
          publicKey: {
            challenge: new Uint8Array(32),
            rp: { name: 'ModernReader' },
            user: {
              id: new Uint8Array(16),
              name: 'user@example.com',
              displayName: 'User'
            },
            pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
          }
        });
        return credential !== null;
      } catch (e) {
        console.error('Biometric auth failed:', e);
      }
    }
    return false;
  }
}

// ==================== 手寫識別 ====================
export class HandwritingRecognition {
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private isDrawing = false;
  private strokes: { x: number; y: number }[][] = [];

  initialize(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
  }

  startDrawing(x: number, y: number) {
    this.isDrawing = true;
    this.strokes.push([{ x, y }]);
  }

  draw(x: number, y: number) {
    if (!this.isDrawing || !this.context) return;
    
    const currentStroke = this.strokes[this.strokes.length - 1];
    currentStroke.push({ x, y });

    this.context.lineWidth = 2;
    this.context.lineCap = 'round';
    this.context.strokeStyle = '#8b5cf6';

    const prevPoint = currentStroke[currentStroke.length - 2];
    this.context.beginPath();
    this.context.moveTo(prevPoint.x, prevPoint.y);
    this.context.lineTo(x, y);
    this.context.stroke();
  }

  stopDrawing() {
    this.isDrawing = false;
  }

  async recognizeText(): Promise<string> {
    // 使用 Tesseract.js 或其他 OCR 庫
    // 或發送到後端進行手寫識別
    return "手寫文字識別結果";
  }

  clear() {
    if (this.context && this.canvas) {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.strokes = [];
    }
  }
}

// ==================== 多模態輸入融合 ====================
export class MultimodalInput {
  private voiceRec: VoiceRecognition;
  private gestureCtrl: GestureControl;
  private handwriting: HandwritingRecognition;

  constructor() {
    this.voiceRec = new VoiceRecognition();
    this.gestureCtrl = new GestureControl();
    this.handwriting = new HandwritingRecognition();
  }

  // 融合多種輸入源
  async processMultimodalInput(sources: {
    voice?: string;
    gesture?: any;
    handwriting?: string;
    gaze?: { x: number; y: number };
  }) {
    const intents = [];

    if (sources.voice) {
      const voiceCommand = this.voiceRec.parseVoiceCommand(sources.voice);
      if (voiceCommand) intents.push(voiceCommand);
    }

    if (sources.gesture) {
      // 處理手勢
      intents.push({ action: 'gesture', params: sources.gesture });
    }

    if (sources.handwriting) {
      intents.push({ action: 'text_input', params: sources.handwriting });
    }

    if (sources.gaze) {
      intents.push({ action: 'gaze_select', params: sources.gaze });
    }

    return this.resolveIntents(intents);
  }

  private resolveIntents(intents: any[]) {
    // 解析並優先排序意圖
    return intents[0]; // 簡化版本
  }
}

// ==================== 沉浸式場景管理 ====================
export class ImmersiveSceneManager {
  private currentScene: string = 'default';

  // 場景預設
  private scenes = {
    library: {
      visual: { background: 'library-3d', lighting: 'warm' },
      audio: 'library-ambient',
      scent: 'coffee',
      temperature: 22
    },
    nature: {
      visual: { background: 'forest-3d', lighting: 'natural' },
      audio: 'nature',
      scent: 'ocean',
      temperature: 24
    },
    focus: {
      visual: { background: 'minimal', lighting: 'focus' },
      audio: 'white-noise',
      scent: 'mint',
      temperature: 20
    },
    cozy: {
      visual: { background: 'fireplace', lighting: 'dim' },
      audio: 'rain',
      scent: 'lavender',
      temperature: 23
    }
  };

  async setScene(sceneName: keyof typeof this.scenes) {
    this.currentScene = sceneName;
    const scene = this.scenes[sceneName];
    
    // 應用場景設置
    console.log(`Applying scene: ${sceneName}`, scene);
    
    return scene;
  }

  getCurrentScene() {
    return this.currentScene;
  }
}

// 導出所有服務
export const sensoryServices = {
  visual: new VisualEnhancement(),
  audio: new AudioEnhancement(),
  haptic: HapticFeedback,
  gesture: new GestureControl(),
  voice: new VoiceRecognition(),
  eyeTracking: new EyeTracking(),
  brainwave: new BrainwaveIntegration(),
  iot: new IoTSensoryDevice(),
  handwriting: new HandwritingRecognition(),
  multimodal: new MultimodalInput(),
  scene: new ImmersiveSceneManager(),
};
