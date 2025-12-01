// 小米手環連接服務
// 透過 Web Bluetooth API 或 WebSocket 與手環通訊

// Web Bluetooth API 型別補充
interface BluetoothDevice {
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
  addEventListener(event: string, callback: () => void): void;
}

interface BluetoothRemoteGATTServer {
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string): Promise<any>;
}

declare global {
  interface Navigator {
    bluetooth?: {
      requestDevice(options: any): Promise<BluetoothDevice>;
    };
  }
}

interface MiBandData {
  steps: number;
  heartRate?: number;
  sleepQuality?: number;  // 0-100
  stressLevel?: number;   // 0-100
  batteryLevel: number;
  timestamp: number;
}

interface MiBandConfig {
  wsUrl?: string;
  useWebBluetooth?: boolean;
  reconnectInterval?: number;
}

class MiBandService {
  private ws: WebSocket | null = null;
  private bluetoothDevice: BluetoothDevice | null = null;
  private config: MiBandConfig;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  
  // 回調函數
  private onDataCallbacks: Array<(data: MiBandData) => void> = [];
  private onConnectCallbacks: Array<() => void> = [];
  private onDisconnectCallbacks: Array<() => void> = [];
  
  constructor(config: MiBandConfig = {}) {
    this.config = {
      wsUrl: config.wsUrl || 'ws://localhost:8081/miband',
      useWebBluetooth: config.useWebBluetooth ?? true,
      reconnectInterval: config.reconnectInterval || 5000
    };
  }
  
  /**
   * 連接小米手環
   */
  async connect(): Promise<void> {
    if (this.config.useWebBluetooth && 'bluetooth' in navigator) {
      await this.connectViaBluetooth();
    } else {
      await this.connectViaWebSocket();
    }
  }
  
  /**
   * 透過 Web Bluetooth 連接
   */
  private async connectViaBluetooth(): Promise<void> {
    try {
      console.log('正在透過藍牙連接小米手環...');
      
      // 請求藍牙裝置
      this.bluetoothDevice = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'Mi Band' },
          { namePrefix: 'Xiaomi' }
        ],
        optionalServices: [
          'heart_rate',
          'battery_service',
          '0000fee0-0000-1000-8000-00805f9b34fb', // Mi Band 服務
          '0000fee1-0000-1000-8000-00805f9b34fb'  // Mi Band 特徵
        ]
      });
      
      console.log('已選擇裝置:', this.bluetoothDevice.name);
      
      // 連接 GATT 伺服器
      const server = await this.bluetoothDevice.gatt!.connect();
      console.log('✅ 小米手環藍牙連接成功！');
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.onConnectCallbacks.forEach(cb => cb());
      
      // 監聽斷線
      this.bluetoothDevice.addEventListener('gattserverdisconnected', () => {
        console.warn('小米手環藍牙已斷開');
        this.isConnected = false;
        this.onDisconnectCallbacks.forEach(cb => cb());
        this.attemptReconnect();
      });
      
      // 開始讀取數據
      await this.startBluetoothDataCollection(server);
      
    } catch (error) {
      console.error('藍牙連接失敗:', error);
      // 降級到 WebSocket
      console.log('嘗試透過 WebSocket 連接...');
      await this.connectViaWebSocket();
    }
  }
  
  /**
   * 開始藍牙數據採集
   */
  private async startBluetoothDataCollection(server: BluetoothRemoteGATTServer): Promise<void> {
    try {
      // 讀取心率
      const heartRateService = await server.getPrimaryService('heart_rate');
      const heartRateChar = await heartRateService.getCharacteristic('heart_rate_measurement');
      
      heartRateChar.addEventListener('characteristicvaluechanged', (event: any) => {
        const value = event.target.value;
        const heartRate = value.getUint8(1);
        console.log('心率:', heartRate);
        
        this.handleData({
          steps: 0, // 需要額外查詢
          heartRate,
          batteryLevel: 100, // 需要額外查詢
          timestamp: Date.now()
        });
      });
      
      await heartRateChar.startNotifications();
      console.log('已啟動心率監測');
      
      // 讀取電池
      const batteryService = await server.getPrimaryService('battery_service');
      const batteryChar = await batteryService.getCharacteristic('battery_level');
      const batteryValue = await batteryChar.readValue();
      const batteryLevel = batteryValue.getUint8(0);
      console.log('電池電量:', batteryLevel + '%');
      
    } catch (error) {
      console.error('藍牙數據採集失敗:', error);
    }
  }
  
  /**
   * 透過 WebSocket 連接
   */
  private async connectViaWebSocket(): Promise<void> {
    if (this.isConnected || this.ws?.readyState === WebSocket.CONNECTING) {
      console.log('小米手環已連接或正在連接中');
      return;
    }
    
    try {
      console.log('正在透過 WebSocket 連接小米手環...');
      this.ws = new WebSocket(this.config.wsUrl!);
      
      this.ws.onopen = () => {
        console.log('✅ 小米手環 WebSocket 連接成功！');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.onConnectCallbacks.forEach(cb => cb());
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'miband_data') {
            this.handleData(data.payload);
          }
        } catch (error) {
          console.error('解析小米手環數據失敗:', error);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('小米手環 WebSocket 錯誤:', error);
      };
      
      this.ws.onclose = () => {
        console.warn('小米手環 WebSocket 已斷開');
        this.isConnected = false;
        this.onDisconnectCallbacks.forEach(cb => cb());
        this.attemptReconnect();
      };
      
    } catch (error) {
      console.error('小米手環連接失敗:', error);
      this.attemptReconnect();
    }
  }
  
  /**
   * 處理手環數據
   */
  private handleData(data: MiBandData): void {
    console.log('收到小米手環數據:', data);
    
    // 步數過低且在合適時間 → 推薦走讀模式
    if (data.steps < 2000 && this.isWalkingTime()) {
      this.suggestWalkingMode();
    }
    
    // 睡眠品質優良 → 推薦晨讀
    if (data.sleepQuality && data.sleepQuality > 80) {
      this.suggestMorningReading();
    }
    
    // 壓力過高 → 切換療癒內容
    if (data.stressLevel && data.stressLevel > 70) {
      this.suggestRelaxingContent();
    }
    
    // 通知監聽者
    this.onDataCallbacks.forEach(cb => cb(data));
  }
  
  /**
   * 判斷是否為適合走路的時間
   */
  private isWalkingTime(): boolean {
    const hour = new Date().getHours();
    // 早上 7-9 點或下午 5-7 點
    return (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
  }
  
  /**
   * 建議走讀模式
   */
  private suggestWalkingMode(): void {
    console.log('🚶 建議開啟走讀模式（邊走邊聽書）');
    this.notify('走讀模式', '今天步數較少，要不要邊走邊聽書？');
    this.sendNotification('開啟走讀模式');
  }
  
  /**
   * 建議晨讀
   */
  private suggestMorningReading(): void {
    console.log('☀️ 睡眠品質良好，推薦晨讀');
    this.notify('晨讀推薦', '您昨晚睡得很好！現在是閱讀的最佳時機');
  }
  
  /**
   * 建議療癒內容
   */
  private suggestRelaxingContent(): void {
    console.log('🧘 壓力偏高，推薦放鬆內容');
    this.notify('放鬆一下', '偵測到壓力較高，為您推薦療癒系內容');
  }
  
  /**
   * 發送通知到手環
   */
  async sendNotification(message: string): Promise<void> {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify({
        type: 'notification',
        message
      }));
    } else if (this.bluetoothDevice && this.bluetoothDevice.gatt?.connected) {
      // 透過藍牙發送震動
      console.log('透過藍牙發送通知（震動）');
    }
  }
  
  /**
   * 發送通知
   */
  private notify(title: string, message: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message, icon: '/logo-modernreader-192.png' });
    }
  }
  
  /**
   * 嘗試重新連接
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('小米手環重連次數已達上限');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(
      this.config.reconnectInterval! * Math.pow(2, this.reconnectAttempts - 1),
      60000
    );
    
    console.log(`將在 ${delay}ms 後重新連接小米手環 (第 ${this.reconnectAttempts} 次)`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }
  
  /**
   * 斷開連接
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    if (this.bluetoothDevice?.gatt?.connected) {
      this.bluetoothDevice.gatt.disconnect();
    }
    
    this.isConnected = false;
  }
  
  /**
   * 監聽數據更新
   */
  onData(callback: (data: MiBandData) => void): void {
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
   * 請求權限
   */
  async requestPermissions(): Promise<boolean> {
    // 請求通知權限
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    
    // Web Bluetooth 權限會在 requestDevice 時請求
    return true;
  }
}

// 匯出單例
export const miBandService = new MiBandService();
export default miBandService;
