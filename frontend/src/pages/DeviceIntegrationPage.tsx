import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';
import { Button, Card } from '../design-system';
import { Bluetooth, Wifi, RefreshCw, Check, AlertCircle, ChevronLeft, Activity } from 'lucide-react';

interface Device {
  id: string;
  name: string;
  type: 'epaper' | 'haptic' | 'scent' | 'audio';
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  icon: string;
  description: string;
  battery?: number;
  lastSync?: number;
  capabilities: string[];
}

interface SyncData {
  bookmarks: number;
  highlights: number;
  notes: number;
  readingProgress: number;
}

export default function DeviceIntegrationPage() {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [bleAvailable, setBleAvailable] = useState<boolean>(typeof navigator !== 'undefined' && !!(navigator as any).bluetooth);
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);
  const [devices, setDevices] = useState<Device[]>([
    {
      id: 'epaper-1',
      name: 'E-Ink Display 7.8"',
      type: 'epaper',
      status: 'disconnected',
      icon: '📄',
      description: language === 'zh' 
        ? '電子紙顯示器，無背光、護眼閱讀體驗。支援藍牙與 WiFi 連線。'
        : 'E-Ink display, no backlight for eye-friendly reading. Supports Bluetooth and WiFi.',
      battery: 85,
      capabilities: ['讀書顯示', '筆記同步', '離線閱讀']
    },
    {
      id: 'haptic-1',
      name: 'Haptic Feedback Band',
      type: 'haptic',
      status: 'disconnected',
      icon: '🤲',
      description: language === 'zh'
        ? '觸覺回饋手環，可在閱讀時提供振動提示，增強沉浸感。'
        : 'Haptic feedback wristband for vibration cues during reading, enhancing immersion.',
      battery: 72,
      capabilities: ['觸覺回饋', '情境震動', '閱讀提醒']
    },
    {
      id: 'scent-1',
      name: 'Aroma Diffuser',
      type: 'scent',
      status: 'disconnected',
      icon: '🌸',
      description: language === 'zh'
        ? '香氛擴香器，根據閱讀內容情境自動釋放香氣，打造多感官閱讀。'
        : 'Aroma diffuser that releases scents based on reading context for multisensory experience.',
      battery: 60,
      capabilities: ['香氛擴散', '場景切換', '濃度調節']
    },
    {
      id: 'audio-1',
      name: 'Smart Earbuds Pro',
      type: 'audio',
      status: 'disconnected',
      icon: '🎧',
      description: language === 'zh'
        ? '智能耳機，支援有聲書播放與環境音效，提供沉浸式聆聽體驗。'
        : 'Smart earbuds with audiobook support and ambient sounds for immersive listening.',
      battery: 95,
      capabilities: ['有聲書播放', '環境音效', '主動降噪']
    }
  ]);

  const [syncData, setSyncData] = useState<SyncData>({
    bookmarks: 12,
    highlights: 45,
    notes: 8,
    readingProgress: 67
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  const connectDevice = async (deviceId: string) => {
    setDevices(prev =>
      prev.map(d =>
        d.id === deviceId ? { ...d, status: 'connecting' } : d
      )
    );

    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    setDevices(prev =>
      prev.map(d =>
        d.id === deviceId ? { ...d, status: 'connected' } : d
      )
    );
  };

  const disconnectDevice = (deviceId: string) => {
    setDevices(prev =>
      prev.map(d =>
        d.id === deviceId ? { ...d, status: 'disconnected' } : d
      )
    );
  };

  const getStatusColor = (status: Device['status']) => {
    switch (status) {
      case 'connected':
        return 'text-green-600 dark:text-green-400';
      case 'connecting':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = (status: Device['status']) => {
    const texts = {
      zh: {
        disconnected: '未連線',
        connecting: '連線中...',
        connected: '已連線',
        error: '發生錯誤'
      },
      en: {
        disconnected: 'Disconnected',
        connecting: 'Connecting...',
        connected: 'Connected',
        error: 'Error'
      },
      ja: {
        disconnected: '未接続',
        connecting: '接続中...',
        connected: '接続済み',
        error: 'エラー'
      }
    };
    return texts[language as keyof typeof texts]?.[status] || texts.en[status];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            🔌 {language === 'zh' ? '裝置串接' : language === 'ja' ? 'デバイス連携' : 'Device Integration'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            {language === 'zh' 
              ? '連接合作夥伴的智能裝置，打造多感官沉浸式閱讀體驗。'
              : language === 'ja'
              ? 'パートナーデバイスを接続して、マルチセンサリーな読書体験を実現。'
              : 'Connect partner devices for an immersive multi-sensory reading experience.'}
          </p>
        </div>

        {/* Connectivity Status */}
        <div className="mb-6 grid sm:grid-cols-2 gap-4">
          <div className={`rounded-lg p-4 border ${isOnline ? 'border-green-300 bg-green-50 dark:bg-green-900/20' : 'border-red-300 bg-red-50 dark:bg-red-900/20'}`}>
            <div className="flex items-center gap-2">
              <Wifi className={`${isOnline ? 'text-green-600' : 'text-red-600'}`} size={18} />
              <span className="font-semibold">
                {language === 'zh' ? '網路狀態' : language === 'ja' ? 'ネットワーク状況' : 'Network'}
              </span>
              <span className={`ml-auto text-sm ${isOnline ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                {isOnline ? (language === 'zh' ? '已連線' : language === 'ja' ? 'オンライン' : 'Online') : (language === 'zh' ? '離線' : language === 'ja' ? 'オフライン' : 'Offline')}
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              {isOnline
                ? (language === 'zh' ? '可使用 Wi‑Fi 或行動網路與裝置同步。' : language === 'ja' ? 'Wi‑Fiまたはモバイルネットワークでデバイスと同期可能。' : 'Wi‑Fi or mobile data available for device sync.')
                : (language === 'zh' ? '目前離線，仍可透過藍牙進行近端連線（若支援）。' : language === 'ja' ? '現在オフライン。対応していれば、Bluetoothで近距離接続が可能。' : 'Offline. Nearby Bluetooth connections may still work (if supported).')}
            </p>
          </div>
          <div className={`rounded-lg p-4 border ${bleAvailable ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 bg-gray-50 dark:bg-gray-800/50'}`}>
            <div className="flex items-center gap-2">
              <Bluetooth className={`${bleAvailable ? 'text-blue-600' : 'text-gray-500'}`} size={18} />
              <span className="font-semibold">
                {language === 'zh' ? '藍牙支援' : language === 'ja' ? 'Bluetooth対応' : 'Bluetooth'}
              </span>
              <span className={`ml-auto text-sm ${bleAvailable ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300'}`}>
                {bleAvailable ? (language === 'zh' ? '可用' : language === 'ja' ? '使用可' : 'Available') : (language === 'zh' ? '未支援' : language === 'ja' ? '未対応' : 'Not supported')}
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              {bleAvailable
                ? (language === 'zh' ? '可連結支援藍牙低功耗（BLE）的周邊裝置。' : language === 'ja' ? 'BLE対応の周辺機器に接続できます。' : 'Can connect to BLE-compatible peripherals.')
                : (language === 'zh' ? '此瀏覽器或裝置未開放 Web Bluetooth。請改用支援的瀏覽器。' : language === 'ja' ? 'このブラウザーや端末ではWeb Bluetoothが使えません。対応ブラウザーを使用してください。' : 'Web Bluetooth isn’t available on this browser/device. Try a supported browser.')}
            </p>
          </div>
        </div>

        {/* Devices Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map(device => (
            <Card key={device.id}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-5xl">{device.icon}</div>
                  <span className={`text-sm font-semibold ${getStatusColor(device.status)}`}>
                    {getStatusText(device.status)}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                    {device.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {device.description}
                  </p>
                </div>
                {device.status === 'connected' ? (
                  <Button
                    variant="secondary"
                    onClick={() => disconnectDevice(device.id)}
                    className="w-full"
                  >
                    {language === 'zh' ? '中斷連線' : language === 'ja' ? '切断' : 'Disconnect'}
                  </Button>
                ) : (
                  <Button
                    onClick={() => connectDevice(device.id)}
                    disabled={device.status === 'connecting'}
                    className="w-full"
                  >
                    {device.status === 'connecting'
                      ? (language === 'zh' ? '連線中...' : language === 'ja' ? '接続中...' : 'Connecting...')
                      : (language === 'zh' ? '連線' : language === 'ja' ? '接続' : 'Connect')}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Integration Benefits */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
            {language === 'zh' ? '為什麼使用合作夥伴裝置？' : language === 'ja' ? 'パートナーデバイスの利点' : 'Why Use Partner Devices?'}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-3xl">👁️</div>
              <h3 className="font-semibold text-gray-800 dark:text-white">
                {language === 'zh' ? '護眼閱讀' : language === 'ja' ? '目に優しい' : 'Eye-Friendly'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'zh' 
                  ? 'E-Ink 顯示器無藍光，長時間閱讀不疲勞。'
                  : language === 'ja'
                  ? 'E-Inkディスプレイはブルーライトなし、長時間読書も快適。'
                  : 'E-Ink displays emit no blue light for comfortable long reading sessions.'}
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl">🎭</div>
              <h3 className="font-semibold text-gray-800 dark:text-white">
                {language === 'zh' ? '情境沉浸' : language === 'ja' ? '没入感' : 'Immersive Context'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'zh'
                  ? '觸覺與嗅覺回饋增強故事情境，身臨其境。'
                  : language === 'ja'
                  ? '触覚と嗅覚でストーリーの臨場感を高める。'
                  : 'Haptic and scent feedback enhance story context and presence.'}
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl">🔋</div>
              <h3 className="font-semibold text-gray-800 dark:text-white">
                {language === 'zh' ? '省電環保' : language === 'ja' ? '省エネ' : 'Energy Efficient'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'zh'
                  ? 'E-Ink 裝置待機時間長達數週，減少充電需求。'
                  : language === 'ja'
                  ? 'E-Inkデバイスは数週間のバッテリー持続。'
                  : 'E-Ink devices can last weeks on a single charge.'}
              </p>
            </div>
          </div>
        </div>

        {/* Purchase CTA */}
        <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">
            {language === 'zh' ? '立即體驗完整沉浸式閱讀' : language === 'ja' ? '完全没入型読書を体験' : 'Experience Full Immersive Reading'}
          </h2>
          <p className="mb-6 text-indigo-100">
            {language === 'zh'
              ? '與我們的合作夥伴購買專屬裝置，享受前所未有的閱讀革命。'
              : language === 'ja'
              ? 'パートナーから専用デバイスを購入し、革新的な読書体験を。'
              : 'Purchase exclusive devices from our partners and revolutionize your reading.'}
          </p>
          <Button variant="secondary" className="text-lg px-8 py-3">
            {language === 'zh' ? '瀏覽裝置商店' : language === 'ja' ? 'デバイスストアへ' : 'Browse Device Store'}
          </Button>
        </div>
      </div>
    </div>
  );
}
