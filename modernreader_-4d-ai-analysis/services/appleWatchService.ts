// Apple Watch 連接服務
// 透過 WebSocket 與 iOS 應用通訊

interface HeartRateData {
  bpm: number;
  timestamp: number;
}

interface HRVData {
  hrv: number;  // 心率變異 (ms)
  timestamp: number;
}

interface BiometricData {
  heartRate: number;
  hrv: number;
  oxygenSaturation?: number;
  activityLevel: number;
  timestamp: number;
}

interface AppleWatchConfig {
  wsUrl?: string;
  reconnectInterval?: number;
  heartbeatInterval?: number;
}

class AppleWatchService {
  private ws: WebSocket | null = null;
  private config: AppleWatchConfig;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private heartbeatTimer: number | null = null;
  private lastHeartbeat = 0;
  
  // 回調函數
  private onDataCallbacks: Array<(data: BiometricData) => void> = [];
  private onConnectCallbacks: Array<() => void> = [];
  private onDisconnectCallbacks: Array<() => void> = [];
  
  constructor(config: AppleWatchConfig = {}) {
    this.config = {
      wsUrl: config.wsUrl || 'ws://localhost:8080/applewatch',
      reconnectInterval: config.reconnectInterval || 5000,
      heartbeatInterval: config.heartbeatInterval || 10000
    };
  }
  
  /**
   * 連接到 Apple Watch（透過 iOS 配套應用的 WebSocket）
   */
  async connect(): Promise<void> {
    if (this.isConnected || this.ws?.readyState === WebSocket.CONNECTING) {
      console.log('Apple Watch 已連接或正在連接中');
      return;
    }
    
    try {
      console.log('正在連接 Apple Watch...');
      this.ws = new WebSocket(this.config.wsUrl!);
      
      this.ws.onopen = () => {
        console.log('✅ Apple Watch 連接成功！');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.onConnectCallbacks.forEach(cb => cb());
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('解析 Apple Watch 數據失敗:', error);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('Apple Watch 連接錯誤:', error);
      };
      
      this.ws.onclose = () => {
        console.warn('Apple Watch 連接已斷開');
        this.isConnected = false;
        this.stopHeartbeat();
        this.onDisconnectCallbacks.forEach(cb => cb());
        this.attemptReconnect();
      };
      
    } catch (error) {
      console.error('Apple Watch 連接失敗:', error);
      this.attemptReconnect();
    }
  }
  
  /**
   * 斷開連接
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.stopHeartbeat();
  }
  
  /**
   * 處理收到的訊息
   */
  private handleMessage(data: any): void {
    switch (data.type) {
      case 'biometric':
        this.handleBiometricData(data.payload);
        break;
      case 'heartbeat':
        this.lastHeartbeat = Date.now();
        break;
      case 'status':
        console.log('Apple Watch 狀態:', data.payload);
        break;
      default:
        console.log('未知訊息類型:', data);
    }
  }
  
  /**
   * 處理生物數據
   */
  private handleBiometricData(data: BiometricData): void {
    console.log('收到 Apple Watch 數據:', data);
    
    // 根據心率調整閱讀建議
    if (data.heartRate > 100) {
      this.suggestSlowDown();
    }
    
    // HRV 過低表示專注度下降
    if (data.hrv < 30) {
      this.suggestBreak();
    }
    
    // 血氧過低警示
    if (data.oxygenSaturation && data.oxygenSaturation < 95) {
      this.suggestDeepBreath();
    }
    
    // 通知所有監聽者
    this.onDataCallbacks.forEach(cb => cb(data));
  }
  
  /**
   * 建議放慢速度
   */
  private suggestSlowDown(): void {
    console.log('💓 心率偏高，建議放慢閱讀速度');
    this.notify('建議放慢閱讀速度', '您的心率較高，放鬆閱讀更舒適');
  }
  
  /**
   * 建議休息
   */
  private suggestBreak(): void {
    console.log('🧘 專注度下降，建議稍作休息');
    this.notify('建議稍作休息', '您的 HRV 顯示專注度下降，休息 5 分鐘吧！');
    this.sendHapticFeedback('warning');
  }
  
  /**
   * 建議深呼吸
   */
  private suggestDeepBreath(): void {
    console.log('🫁 血氧偏低，建議深呼吸');
    this.notify('建議深呼吸', '您的血氧濃度略低，深呼吸幾次吧！');
    this.sendHapticFeedback('warning');
  }
  
  /**
   * 發送觸覺回饋到 Apple Watch
   */
  async sendHapticFeedback(type: 'success' | 'warning' | 'error' | 'highlight'): Promise<void> {
    if (!this.isConnected || !this.ws) {
      console.warn('Apple Watch 未連接，無法發送觸覺回饋');
      return;
    }
    
    this.ws.send(JSON.stringify({
      type: 'haptic',
      pattern: type
    }));
  }
  
  /**
   * 發送通知
   */
  private notify(title: string, message: string): void {
    // 發送到 Apple Watch
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({
        type: 'notification',
        title,
        message
      }));
    }
    
    // 同時顯示瀏覽器通知
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message, icon: '/logo-modernreader-192.png' });
    }
  }
  
  /**
   * 心跳檢測
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.lastHeartbeat = Date.now();
    
    this.heartbeatTimer = window.setInterval(() => {
      if (!this.isConnected || !this.ws) return;
      
      // 發送心跳
      this.ws.send(JSON.stringify({ type: 'heartbeat' }));
      
      // 檢查是否超時
      const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeat;
      if (timeSinceLastHeartbeat > 30000) {
        console.warn('Apple Watch 心跳超時，嘗試重連');
        this.disconnect();
        this.attemptReconnect();
      }
    }, this.config.heartbeatInterval!);
  }
  
  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  
  /**
   * 嘗試重新連接
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Apple Watch 重連次數已達上限');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(
      this.config.reconnectInterval! * Math.pow(2, this.reconnectAttempts - 1),
      60000
    );
    
    console.log(`將在 ${delay}ms 後重新連接 Apple Watch (第 ${this.reconnectAttempts} 次)`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }
  
  /**
   * 監聽數據更新
   */
  onData(callback: (data: BiometricData) => void): void {
    this.onDataCallbacks.push(callback);
  }
  
  /**
   * 監聽連接事件
   */
  onConnect(callback: () => void): void {
    this.onConnectCallbacks.push(callback);
  }
  
  /**
   * 監聽斷線事件
   */
  onDisconnect(callback: () => void): void {
    this.onDisconnectCallbacks.push(callback);
  }
  
  /**
   * 獲取連接狀態
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
  
  /**
   * 請求權限（iOS 需要）
   */
  async requestPermissions(): Promise<boolean> {
    // 請求通知權限
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log('通知權限:', permission);
    }
    
    return true;
  }
}

// 匯出單例
export const appleWatchService = new AppleWatchService();
export default appleWatchService;
