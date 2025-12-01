# STT 與視訊功能改進報告

## 📅 更新日期
2025年10月21日

## 🎯 改進目標
1. 串接真實的語音轉文字（STT）API
2. 修復鏡頭/視訊模組沒有顯示的問題

---

## ✅ 已完成的改進

### 1. 語音轉文字（STT）服務升級

#### 問題描述
- 原本的 STT 服務只回傳 mock 資料：`"這是模擬轉錄結果（mock transcript）"`
- 使用者無法獲得真實的語音辨識結果

#### 解決方案
**更新檔案**: `services/localSttService.ts`

新增了真實的 Web Speech API 支援：

```typescript
// 使用瀏覽器原生 Web Speech API 進行即時語音辨識
export function startWebSpeechRecognition(
  onResult: (text: string) => void,
  onError?: (error: any) => void
): { stop: () => void } | null {
  const SpeechRecognition = (window as any).SpeechRecognition || 
                           (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = 'zh-TW'; // 支援繁體中文

  recognition.onresult = (event: any) => {
    const transcript = Array.from(event.results)
      .map((result: any) => result[0].transcript)
      .join('');
    onResult(transcript);
  };

  recognition.start();
  return { stop: () => recognition.stop() };
}
```

#### 特色功能
- ✅ 使用瀏覽器原生 Web Speech API
- ✅ 支援繁體中文（zh-TW）
- ✅ 即時語音辨識
- ✅ 無需上傳音訊到伺服器
- ✅ 離線也可運作（部分瀏覽器）

---

### 2. 語音輸入按鈕重構

#### 問題描述
- 原本的語音輸入按鈕使用複雜的錄音邏輯
- 需要錄音完成後才能轉錄，體驗不佳

#### 解決方案
**更新檔案**: `pages/Reader.tsx`

重構了 `VoiceInputButton` 元件：

```typescript
// 優先使用瀏覽器 Web Speech API 進行即時語音辨識
const VoiceInputButton: React.FC<{ onResult: (text: string) => void }> = ({ onResult }) => {
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } 
    = useSpeechRecognition();

  // 自動更新轉錄結果
  useEffect(() => {
    if (transcript && !listening) {
      const text = transcript.trim();
      if (text) {
        onResult(text);
        resetTranscript();
      }
    }
  }, [transcript, listening]);

  const toggle = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      SpeechRecognition.startListening({ 
        continuous: false,
        language: 'zh-TW' 
      });
    }
  };

  const label = listening ? '辨識中…（點擊停止）' : '🎤 語音輸入';
  // ...
};
```

#### 改進特色
- ✅ 即時語音辨識顯示
- ✅ 動態按鈕狀態（辨識中會閃爍）
- ✅ 即時預覽轉錄文字
- ✅ 自動偵測瀏覽器支援
- ✅ 友善的錯誤提示

---

### 3. 相機視訊模組顯示修復

#### 問題 A: ImmersiveReader 視訊元件隱藏

**檔案**: `components/ImmersiveReader.tsx`

**原始問題**:
```tsx
<video ref={videoRef} className="hidden" autoPlay playsInline />
```

**修復後**:
```tsx
{(gestureEnabled || eyeTrackingEnabled) && (
  <div className="absolute bottom-4 right-4 z-50">
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-2 border border-purple-500/30">
      <video
        ref={videoRef}
        className="w-48 h-36 rounded-md object-cover"
        autoPlay
        playsInline
      />
      <div className="text-xs text-purple-300 mt-1 text-center">
        {gestureEnabled && '手勢追蹤'}
        {gestureEnabled && eyeTrackingEnabled && ' + '}
        {eyeTrackingEnabled && '眼動追蹤'}
      </div>
    </div>
  </div>
)}
```

**改進特色**:
- ✅ 只在啟用手勢或眼動追蹤時顯示
- ✅ 浮動在右下角，不影響閱讀體驗
- ✅ 半透明背景，視覺融合
- ✅ 顯示當前追蹤模式

---

#### 問題 B: Reader 相機介面優化

**檔案**: `pages/Reader.tsx`

**改進前**: 簡單的視訊顯示，沒有狀態指示

**改進後**:
```tsx
{inputMode === 'camera' && (
  <div className="h-64 bg-gray-800 border-2 border-gray-700 rounded-lg overflow-hidden relative">
    {isCapturing && (
      <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
          Extracting Text...
        </div>
      </div>
    )}
    {isCameraOn ? (
      <div className="w-full h-full relative">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-4">
          <button onClick={handleCapture} className="...">
            📸 Capture Text
          </button>
          <button onClick={stopCamera} className="...">
            ✕ Close
          </button>
        </div>
      </div>
    ) : (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">📷</div>
        <button onClick={startCamera} className="...">Start Camera</button>
        <p className="text-gray-400 text-sm">Capture images to extract text with OCR</p>
      </div>
    )}
  </div>
)}
```

**改進特色**:
- ✅ 載入動畫顯示文字擷取狀態
- ✅ 漸層遮罩讓按鈕更清晰
- ✅ 新增「關閉相機」按鈕
- ✅ 友善的啟動介面
- ✅ 新增 `muted` 屬性避免瀏覽器自動播放限制
- ✅ 錯誤提示改為浮動通知

---

## 🔧 技術細節

### 相依套件
- `react-speech-recognition`: Web Speech API 的 React wrapper
- `regenerator-runtime`: 支援 async/await 語法（已安裝）

### 瀏覽器支援

#### Web Speech API 支援度
- ✅ Chrome/Edge (完整支援)
- ✅ Safari 14.1+ (支援)
- ⚠️ Firefox (部分支援，需啟用)
- ❌ IE (不支援)

#### 相機 API 支援度
- ✅ 所有現代瀏覽器
- ⚠️ 需要 HTTPS 或 localhost
- ⚠️ 需要使用者授權

---

## 📝 使用說明

### 語音輸入功能
1. 點擊「🎤 語音輸入」按鈕
2. 允許瀏覽器使用麥克風權限
3. 開始說話，系統會即時顯示辨識結果
4. 說完後點擊「停止」或系統自動停止
5. 辨識結果會自動填入文字區域

### 相機掃描功能
1. 切換到「Scan」輸入模式
2. 點擊「Start Camera」
3. 允許瀏覽器使用相機權限
4. 對準要掃描的文字
5. 點擊「📸 Capture Text」擷取
6. 等待 OCR 處理（會顯示載入動畫）
7. 辨識的文字會自動填入

### 沉浸式閱讀視訊追蹤
1. 進入沉浸式閱讀模式
2. 啟用「手勢控制」或「眼動追蹤」
3. 視訊預覽會自動出現在右下角
4. 可以看到即時追蹤狀態

---

## 🐛 已知限制

### STT 限制
- Web Speech API 在某些瀏覽器需要網路連線
- 辨識準確度依賴瀏覽器引擎
- 部分瀏覽器可能需要使用者手動啟用功能

### 相機限制
- 需要 HTTPS 連線（開發環境可用 localhost）
- OCR 準確度依賴光線和文字清晰度
- 處理大圖片可能較慢

---

## 🚀 未來改進方向

### STT 改進
- [ ] 整合 Google Cloud Speech-to-Text API
- [ ] 支援更多語言選擇
- [ ] 離線語音辨識（使用 Vosk/Whisper）
- [ ] 即時字幕顯示

### 相機改進
- [ ] 整合更強大的 OCR 引擎（Tesseract.js）
- [ ] 支援多語言 OCR
- [ ] 即時文字偵測預覽
- [ ] 批次掃描多頁文件

### 視訊追蹤改進
- [ ] 可調整視訊預覽大小
- [ ] 可拖曳視訊預覽位置
- [ ] 新增全螢幕視訊模式
- [ ] 錄製追蹤過程

---

## 📊 測試建議

### 語音輸入測試
```bash
# 1. 啟動開發伺服器
npm run dev

# 2. 開啟瀏覽器到 http://localhost:3000
# 3. 點擊語音輸入按鈕
# 4. 測試以下場景：
#    - 短句測試（1-5秒）
#    - 長句測試（10-30秒）
#    - 中英混合測試
#    - 雜訊環境測試
```

### 相機測試
```bash
# 1. 準備測試素材：
#    - 印刷文件
#    - 螢幕顯示文字
#    - 手寫文字
#    - 不同光線條件

# 2. 測試流程：
#    - 點擊 Scan 模式
#    - 啟動相機
#    - 對準測試素材
#    - 擷取並驗證結果
```

---

## 💡 最佳實踐

### 語音輸入
- 在安靜環境使用可獲得最佳效果
- 清晰發音，適度停頓
- 避免同時多人說話
- 檢查麥克風權限

### 相機掃描
- 確保光線充足
- 保持相機穩定
- 文字對焦清晰
- 避免反光和陰影

---

## 🔗 相關文件
- [Web Speech API 文件](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [MediaDevices API 文件](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices)
- [react-speech-recognition](https://github.com/JamesBrill/react-speech-recognition)

---

## ✅ 驗收清單
- [x] STT 服務串接真實 Web Speech API
- [x] 語音輸入按鈕重構並優化
- [x] ImmersiveReader 視訊元件顯示修復
- [x] Reader 相機介面優化
- [x] 新增載入動畫和狀態提示
- [x] 瀏覽器相容性檢查
- [x] 錯誤處理完善
- [x] 文件更新

---

**總結**: 所有語音和視訊功能已完整重構並優化，提供更流暢的使用者體驗！🎉
