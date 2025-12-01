import { useState, useEffect } from 'react';
import { appleWatchService } from '../services/appleWatchService';

interface WearableDevice {
  name: string;
  type: 'apple-watch';
  connected: boolean;
  lastUpdate?: number;
  data?: any;
}

export default function WearableDeviceManager() {
  const [devices, setDevices] = useState<WearableDevice[]>([
    { name: 'Apple Watch', type: 'apple-watch', connected: false }
  ]);
  
  const [appleWatchData, setAppleWatchData] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  useEffect(() => {
    // 監聽 Apple Watch 連接狀態
    appleWatchService.onConnect(() => {
      updateDeviceStatus('apple-watch', true);
    });
    
    appleWatchService.onDisconnect(() => {
      updateDeviceStatus('apple-watch', false);
    });
    
    appleWatchService.onData((data) => {
      setAppleWatchData(data);
      updateDeviceData('apple-watch', data);
    });
    
    // 清理
    return () => {
      // 可以在這裡清理監聽器
    };
  }, []);
  
  const updateDeviceStatus = (type: string, connected: boolean) => {
    setDevices(prev => prev.map(dev => 
      dev.type === type ? { ...dev, connected } : dev
    ));
  };
  
  const updateDeviceData = (type: string, data: any) => {
    setDevices(prev => prev.map(dev => 
      dev.type === type ? { ...dev, data, lastUpdate: Date.now() } : dev
    ));
  };
  
  const handleConnect = async (type: 'apple-watch') => {
    try {
      await appleWatchService.requestPermissions();
      await appleWatchService.connect();
    } catch (error) {
      console.error(`連接 ${type} 失敗:`, error);
      alert(`連接失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };
  
  const handleDisconnect = (type: 'apple-watch') => {
    appleWatchService.disconnect();
  };
  
  const sendTestHaptic = async () => {
    await appleWatchService.sendHapticFeedback('success');
  };
  
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-3xl">⌚</span>
          穿戴裝置管理
        </h2>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          {showDetails ? '隱藏詳情' : '顯示詳情'}
        </button>
      </div>
      
      <div className="space-y-4">
        {devices.map((device) => (
          <div
            key={device.type}
            className={`bg-gray-800 rounded-lg p-4 border-2 transition-all ${
              device.connected
                ? 'border-green-500 shadow-lg shadow-green-500/20'
                : 'border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  device.connected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                }`} />
                <span className="text-white font-medium text-lg">
                  {device.name}
                </span>
                {device.connected && device.lastUpdate && (
                  <span className="text-xs text-gray-400">
                    {new Date(device.lastUpdate).toLocaleTimeString('zh-TW')}
                  </span>
                )}
              </div>
              
              <div className="flex gap-2">
                {device.connected ? (
                  <>
                    <button
                      onClick={() => handleDisconnect(device.type)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                    >
                      斷開
                    </button>
                    <button
                      onClick={sendTestHaptic}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                    >
                      測試震動
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleConnect(device.type)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                  >
                    連接
                  </button>
                )}
              </div>
            </div>
            
            {/* 顯示裝置數據 */}
            {showDetails && device.connected && device.data && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <DataCard label="心率" value={`${device.data.heartRate} BPM`} icon="💓" />
                  <DataCard label="HRV" value={`${device.data.hrv} ms`} icon="📊" />
                  {device.data.oxygenSaturation && (
                    <DataCard label="血氧" value={`${device.data.oxygenSaturation}%`} icon="🫁" />
                  )}
                  <DataCard label="活動度" value={`${device.data.activityLevel}%`} icon="🏃" />
                </div>
              </div>
            )}
            
            {/* 連接說明 */}
            {!device.connected && (
              <div className="mt-3 p-3 bg-gray-900 rounded-lg">
                <p className="text-sm text-gray-400">
                  <strong className="text-white">連接方式：</strong><br/>
                  1. 確保 Apple Watch 與 iPhone 已配對<br/>
                  2. 在 iPhone 上安裝 ModernReader iOS 應用（開發中）<br/>
                  3. 在應用中啟用 HealthKit 權限<br/>
                  4. 點擊「連接」按鈕
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* 功能說明 */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-500/30">
        <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
          <span>💡</span>
          智慧功能
        </h3>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• <strong>Apple Watch</strong>: 心率監測調整閱讀節奏、HRV 專注度偵測、觸覺回饋提示</li>
          <li>• 供應商擴充：HTML 已預留合作廠商區塊，可快速接入（見 index.html 的 vendor slot）</li>
          <li>• 所有數據即時同步，智慧調整閱讀體驗</li>
        </ul>
      </div>
      
      {/* 連接狀態總覽 */}
      <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-400">
        <span>連接裝置: {devices.filter(d => d.connected).length} / {devices.length}</span>
        <span>•</span>
        <span>4D 沉浸式閱讀已{devices.some(d => d.connected) ? '啟用' : '待啟用'}</span>
      </div>
    </div>
  );
}

// 數據卡片元件
function DataCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-gray-900 rounded-lg p-3 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  );
}
