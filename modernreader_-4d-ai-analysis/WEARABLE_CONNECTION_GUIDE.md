# 穿戴裝置快速連接指南

## 🎯 概述

ModernReader 現在支援 Apple Watch 和小米手環的即時連接！透過生物訊號（心率、HRV、步數等）智慧調整閱讀體驗。

---

## ⌚ Apple Watch 連接步驟

### 方法 1: 透過 iOS 配套應用（推薦）

#### 前置需求
- iPhone (iOS 14+)
- Apple Watch (watchOS 7+)
- ModernReader iOS 應用（開發中，預計 Q1 2025 發布）

#### 連接步驟
1. 在 iPhone 上安裝 ModernReader iOS 應用
2. 開啟應用並授予以下權限:
   - HealthKit（讀取心率、HRV、血氧數據）
   - 通知權限
3. 應用會自動啟動 WebSocket 伺服器 (`ws://localhost:8080/applewatch`)
4. 在瀏覽器開啟 ModernReader Web 應用
5. 前往「設定」頁面，找到「穿戴裝置管理」
6. 點擊「連接 Apple Watch」
7. 等待連接成功（綠色指示燈）

### 方法 2: 開發測試模式（無需 iOS 應用）

#### 使用模擬數據進行測試

```javascript
// 在瀏覽器 Console 執行
import { appleWatchService } from './services/appleWatchService';

// 模擬連接
appleWatchService.onConnect(() => {
  console.log('Apple Watch 已連接！');
});

// 模擬發送數據
setInterval(() => {
  const mockData = {
    heartRate: 70 + Math.random() * 20,
    hrv: 30 + Math.random() * 40,
    oxygenSaturation: 95 + Math.random() * 5,
    activityLevel: Math.random() * 100,
    timestamp: Date.now()
  };
  
  // 手動觸發數據更新
  appleWatchService.onData(mockData);
}, 3000);
```

---

## 📱 小米手環連接步驟

### 方法 1: Web Bluetooth（瀏覽器直連）

#### 前置需求

- 支援 Web Bluetooth 的瀏覽器（Chrome 56+, Edge 79+）
- 小米手環 (Mi Band 4/5/6/7 均支援)
- 藍牙已開啟且手環在範圍內（10 公尺）

#### 連接步驟
1. 確保小米手環已充電且開機
2. 在 ModernReader 設定頁面找到「穿戴裝置管理」
3. 點擊「連接小米手環」
4. 瀏覽器會彈出藍牙裝置選擇視窗
5. 選擇您的小米手環（名稱通常為 "Mi Band X-XXXX"）
6. 點擊「配對」
7. 等待連接成功

**提示**: 如果看不到手環:
- 確認藍牙已開啟
- 手環未與其他裝置連接
- 手環電量充足
- 重啟手環並重試

### 方法 2: 透過 Mi Fit App（WebSocket 橋接）

#### 前置需求
- 小米手環 + Mi Fit App
- 手機與電腦在同一 Wi-Fi 網路

#### 連接步驟
1. 在手機上安裝 Mi Fit App 並綁定手環
2. 下載 Mi Fit WebSocket 橋接工具:
   ```bash
   git clone https://github.com/modernreader/mi-fit-bridge
   cd mi-fit-bridge
   npm install
   npm start
   ```
3. 工具會啟動 WebSocket 伺服器（預設 `ws://localhost:8081/miband`）
4. 在 ModernReader 設定中修改小米手環連接 URL（如果需要）
5. 點擊「連接小米手環」

---

## 🔧 設定與測試

### 在 ModernReader 中啟用穿戴裝置

1. 開啟 ModernReader (`https://localhost:3000`)
2. 點擊側邊欄的「Settings」（⚙️ 圖示）
3. 滾動到「穿戴裝置管理」區塊
4. 選擇要連接的裝置並點擊「連接」

### 測試裝置功能

#### Apple Watch 測試
- 點擊「測試震動」→ 手錶應該會震動
- 查看即時心率、HRV 數據
- 嘗試深呼吸 → HRV 應該會上升
- 快速走動 → 心率應該會上升

#### 小米手環測試
- 點擊「測試通知」→ 手環應該會震動
- 查看步數統計
- 走動幾步 → 步數應該會增加
- 查看電池電量

---

## 🎨 智慧功能說明

### Apple Watch 功能

| 功能 | 說明 | 觸發條件 |
|-----|-----|---------|
| 心率調整 | 自動調整閱讀速度 | 心率 > 100 BPM |
| 專注度提醒 | 建議休息 | HRV < 30 ms |
| 血氧警示 | 提醒深呼吸 | SpO2 < 95% |
| 觸覺回饋 | 章節完成震動 | 完成重要段落 |
| 手勢控制 | 抬腕恢復閱讀 | 手腕抬起偵測 |

### 小米手環功能

| 功能 | 說明 | 觸發條件 |
|-----|-----|---------|
| 走讀模式 | 邊走邊聽書 | 步數 < 2000 且在適合時間 |
| 晨讀推薦 | 推薦早晨閱讀 | 睡眠品質 > 80% |
| 壓力調節 | 切換療癒內容 | 壓力指數 > 70% |
| 目標提醒 | 閱讀目標達成通知 | 完成每日閱讀目標 |

---

## 🔐 隱私與安全

### 數據處理原則
- ✅ 所有生物訊號數據**僅在本地處理**
- ✅ 不會上傳到雲端伺服器
- ✅ 不與第三方分享
- ✅ 使用者可隨時斷開連接並清除數據

### 權限說明
- **HealthKit（Apple Watch）**: 僅讀取心率、HRV、血氧，不寫入任何數據
- **藍牙（小米手環）**: 僅用於讀取手環數據，不修改手環設定
- **通知**: 用於發送閱讀提醒，可在系統設定中關閉

---

## 🐛 疑難排解

### Apple Watch 連接失敗

**問題**: 點擊連接後無反應

**解決方案**:
1. 確認 iPhone 與 Apple Watch 已配對
2. 確認 ModernReader iOS 應用正在執行
3. 檢查 HealthKit 權限已授予
4. 重啟 iOS 應用和 Watch 應用
5. 查看瀏覽器 Console 錯誤訊息

**問題**: 數據不更新

**解決方案**:
1. 檢查 Apple Watch 是否在手腕上（需佩戴才能監測心率）
2. 確認 HealthKit 背景更新已啟用
3. 重新連接裝置

### 小米手環連接失敗

**問題**: 藍牙配對視窗沒有出現

**解決方案**:
1. 確認瀏覽器支援 Web Bluetooth（Chrome 56+）
2. 確認網站使用 HTTPS 或 localhost
3. 檢查藍牙權限已授予瀏覽器
4. 重新整理頁面並重試

**問題**: 找不到手環裝置

**解決方案**:
1. 手環與手機解除配對（Mi Fit App）
2. 重啟手環（長按按鈕）
3. 確保手環電量充足
4. 移除其他藍牙裝置干擾
5. 縮短手環與電腦距離（< 5 公尺）

**問題**: 連接成功但無數據

**解決方案**:
1. 手環可能需要在 Mi Fit App 中同步一次
2. 檢查手環韌體是否為最新版本
3. 嘗試使用 WebSocket 橋接模式

---

## 🔄 自動重連

兩種裝置都支援自動重連功能:
- 斷線後會自動嘗試重新連接（最多 10 次）
- 使用指數退避策略（1s → 2s → 4s → 8s...）
- 超過重連次數後需手動點擊「連接」

---

## 📊 數據查看

### 即時數據顯示
- 在「穿戴裝置管理」區塊點擊「顯示詳情」
- 可查看所有即時生物訊號數據
- 數據會自動更新（每 1-3 秒）

### 歷史數據查看
- 功能開發中，預計 Q2 2025 上線
- 將支援:
  - 心率趨勢圖表
  - HRV 長期追蹤
  - 步數統計
  - 閱讀與生物訊號關聯分析

---

## 🚀 進階設定

### 修改連接參數

編輯服務配置:

#### Apple Watch
```typescript
// services/appleWatchService.ts
const appleWatchService = new AppleWatchService({
  wsUrl: 'ws://your-server:8080/applewatch',
  reconnectInterval: 5000,  // 重連間隔 (ms)
  heartbeatInterval: 10000  // 心跳間隔 (ms)
});
```

#### 小米手環
```typescript
// services/miBandService.ts
const miBandService = new MiBandService({
  wsUrl: 'ws://your-server:8081/miband',
  useWebBluetooth: true,     // 是否使用 Web Bluetooth
  reconnectInterval: 5000
});
```

---

## 📱 iOS 應用開發狀態

### ModernReader iOS 應用
- **狀態**: 開發中
- **預計發布**: Q1 2025
- **功能**: Apple Watch 橋接、HealthKit 整合、離線閱讀
- **測試版**: 申請加入 TestFlight → support@modernreader.ai

---

## 🎓 使用建議

### 最佳實踐
1. **晨讀時段**: 利用小米手環的睡眠品質數據，在精神最好時閱讀
2. **走讀模式**: 通勤或散步時啟動語音朗讀 + 步數追蹤
3. **專注模式**: 關注 Apple Watch 的 HRV，在專注度最高時處理難懂內容
4. **休息提醒**: 信任裝置的建議，適時休息對長期學習更有幫助

### 電池管理
- Apple Watch: 連續監測約可使用 8-10 小時
- 小米手環: 藍牙連接約可使用 5-7 天（與正常使用相同）

---

## 💬 支援與反饋

- **技術支援**: support@modernreader.ai
- **功能建議**: features@modernreader.ai
- **Discord 社群**: https://discord.gg/modernreader
- **GitHub Issues**: https://github.com/modernreader/modernreader/issues

---

**版本**: v1.0  
**最後更新**: 2025-10-21  
**作者**: ModernReader Team

> "讓科技真正理解你的身體，閱讀不再只是用眼睛。" — ModernReader
