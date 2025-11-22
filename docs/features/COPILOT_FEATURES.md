# ModernReader - 微軟 Copilot 風格增強版

## 🎉 最新功能

### 1. 智慧助理 (Microsoft Copilot 風格)

仿照 Microsoft Copilot 的設計，提供情緒感知的智慧對話體驗：

- **右下角常駐聊天按鈕** 💬
  - 浮動於所有頁面，隨時可用
  - 綠色指示燈顯示線上狀態
  - Hover 顯示提示工具提示

- **情緒感知回覆** 🎭
  - 自動分析提問的情緒狀態（好奇、焦慮、疲憊等）
  - 根據情緒調整回覆語氣
  - 顯示情緒標籤和信心度

- **現代化 UI 設計**
  - 漸層藍色主題（Blue → Indigo）
  - 流暢動畫和過渡效果
  - 訊息氣泡和時間戳記
  - 載入中動畫（跳動圓點）

### 2. 增強的封面系統

- **Open Library 整合**
  - 自動從 ISBN 查詢書籍封面
  - 支援 ISBN-10 和 ISBN-13
  - 多種尺寸選項（S/M/L）

- **智慧 Fallback**
  - 封面載入失敗自動顯示 📚 圖示
  - 離線模式友善
  - 未來可擴展為 SVG 佔位符

### 3. 裝置串接狀態

在「裝置串接」頁面顯示：
- **網路狀態** 🌐
  - 即時監測線上/離線
  - Wi-Fi 或行動網路可用性
  - 提供離線時藍牙連線建議

- **藍牙支援** 📡
  - 檢測 Web Bluetooth API 可用性
  - 顯示 BLE 裝置連接指引
  - 瀏覽器相容性提示

## 🚀 快速啟動

### 方法一：使用啟動腳本（推薦）

```bash
# 在專案根目錄執行
bash scripts/start-frontend.sh
```

這個腳本會：
1. 自動檢查並安裝依賴
2. 啟動 Vite 開發伺服器（port 5173）
3. 自動開啟瀏覽器

### 方法二：手動啟動

```bash
# 進入 frontend 目錄
cd frontend

# 安裝依賴（首次執行）
npm install

# 啟動開發伺服器
npm run dev

# 開啟瀏覽器訪問
open http://localhost:5173
```

### 正式環境建置

```bash
cd frontend
npm run build

# 產物在 dist/ 目錄
# 可用 nginx 或任何靜態伺服器部署
```

## 📖 使用指南

### 使用智慧助理

1. **開啟聊天窗**
   - 點擊右下角藍色浮動按鈕（Sparkles 圖示）
   - 聊天窗會從底部滑入

2. **提問方式**
   - 輸入任何關於書籍、學習或平台的問題
   - 按 Enter 或點擊「送出」
   - 助理會分析你的情緒並給出回應

3. **情緒辨識**
   - 助理會自動偵測問題中的情緒
   - 在回覆上方顯示情緒標籤（如：🤔 curious）
   - 高信心度會額外標示

4. **關閉聊天**
   - 點擊標題列的 X 按鈕
   - 聊天記錄會保留在當前會話

### 書籍目錄功能

1. **搜尋書籍**
   - 使用搜尋欄輸入關鍵字
   - 可按語言篩選（中文、英文、日文等）
   - 點擊「搜尋」或按 Enter

2. **檢視封面**
   - 有 ISBN 的書籍自動顯示 Open Library 封面
   - 載入失敗會顯示 📚 圖示
   - 離線模式仍可瀏覽（無封面圖片）

3. **館藏地點**
   - 點擊地點連結可在 Google Maps 開啟
   - 規劃實體書籍借閱路線

### 裝置串接功能

1. **檢查連線狀態**
   - 頁面上方顯示網路和藍牙狀態
   - 綠色 = 可用，紅色/灰色 = 不可用

2. **連接裝置**
   - 點擊裝置卡片的「連線」按鈕
   - 模擬連線過程（真實裝置需後端支援）
   - 已連線顯示「中斷連線」選項

3. **裝置類型**
   - 📄 E-Ink 電子紙顯示器
   - 🤲 觸覺回饋手環
   - 🌸 香氛擴香器
   - 🎧 智能耳機

## 🎨 設計亮點

### Microsoft Copilot 風格元素

1. **色彩系統**
   - 主色：Blue 600 → Indigo 600 漸層
   - 強調色：綠色（線上狀態）、黃色（情緒標籤）
   - 暗色模式完整支援

2. **動畫效果**
   - 聊天窗滑入/滑出動畫
   - 浮動按鈕 hover 縮放效果
   - 訊息載入跳動圓點
   - 綠色狀態指示燈脈衝

3. **排版細節**
   - 圓角設計（rounded-2xl）
   - 陰影層次（shadow-2xl）
   - 間距一致（p-4, gap-3）
   - 字體大小階層清晰

### 回應式設計

- 手機、平板、桌面完全適配
- 聊天窗在小螢幕自動調整寬度
- 裝置卡片 grid 自動換列
- Touch 友善的按鈕尺寸

## 🔧 技術細節

### 情緒分析流程

```typescript
// 1. 使用者輸入問題
const question = "這本書好看嗎？我有點累了";

// 2. 呼叫情緒 API
const emotion = await aiClient.analyzeEmotion({ text: question });
// 回傳: { top_emotion: 'tired', emotions: { tired: 0.6, curious: 0.3 } }

// 3. 根據情緒調整回覆前綴
const prefix = "看起來有點累了，簡單說明一下：";

// 4. 查詢 RAG 知識庫
const answer = await ragClient.query({ query: question });

// 5. 組合完整回應
const response = prefix + "\n\n" + answer;
```

### 封面載入策略

```typescript
// 1. ISBN 正規化
const normalizeIsbn = (isbn: string) => {
  // 移除破折號和空格
  const clean = isbn.replace(/[-\s]/g, '');
  // 確保長度為 10 或 13
  return clean.length === 10 || clean.length === 13 ? clean : undefined;
};

// 2. 組建 Open Library URL
const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;

// 3. 錯誤處理
<img src={coverUrl} onError={() => setShowFallback(true)} />
```

### 連線狀態偵測

```typescript
// 網路狀態
const [isOnline, setIsOnline] = useState(navigator.onLine);

useEffect(() => {
  window.addEventListener('online', () => setIsOnline(true));
  window.addEventListener('offline', () => setIsOnline(false));
}, []);

// 藍牙支援
const bleAvailable = !!(navigator as any).bluetooth;
```

## 🐛 已知問題與解決方案

### 問題：瀏覽器顯示空白頁

**原因：** 訪問了錯誤的 port（5175 而非 5173）

**解決方案：**
1. 確認 dev server 正在運行（看到 `VITE ready` 訊息）
2. 訪問正確的 URL：`http://localhost:5173`
3. 或使用啟動腳本自動開啟

### 問題：封面圖片無法載入

**原因：** ISBN 格式不正確或 Open Library 無此書

**解決方案：**
- 系統會自動顯示 📚 圖示作為 fallback
- 離線模式不影響功能，只是無圖片

### 問題：情緒分析不準確

**原因：** Demo 模式使用簡化的情緒判斷

**解決方案：**
- 連接真實後端使用完整 AI 模型
- 或調整 `aiClient.analyzeEmotion` 的 demo 邏輯

## 📦 專案結構

```
frontend/
├── src/
│   ├── components/
│   │   └── FloatingChatbot.tsx    # Copilot 風格聊天組件
│   ├── pages/
│   │   ├── CatalogPage.tsx        # 書籍目錄（增強封面）
│   │   └── DeviceIntegrationPage.tsx  # 裝置串接（狀態顯示）
│   └── services/
│       └── api.ts                 # API 客戶端（情緒、RAG、封面）
└── dist/                          # 建置產物
```

## 🚀 後續開發建議

### 短期（1-2 週）

1. **聊天記錄持久化**
   - 使用 localStorage 儲存對話
   - 跨 session 保留歷史記錄
   - 提供清除記錄按鈕

2. **封面快取優化**
   - Service Worker 快取封面圖片
   - 離線可顯示已快取的封面
   - 減少重複請求

3. **裝置實際連線**
   - 實作 Web Bluetooth 配對流程
   - E-Paper 裝置推送內容
   - 觸覺回饋測試介面

### 中期（1-2 月）

1. **多模態輸入**
   - 語音輸入問題（Web Speech API）
   - 圖片辨識提問
   - 手寫輸入支援

2. **個人化助理**
   - 記住使用者偏好
   - 主動推薦相關內容
   - 學習使用者閱讀習慣

3. **進階情緒功能**
   - 情緒趨勢圖表
   - 根據情緒推薦書籍
   - 情緒日記功能

### 長期（3-6 月）

1. **多人協作**
   - 讀書會聊天室
   - 共享筆記和標註
   - 協作閱讀進度

2. **AI 導師模式**
   - 蘇格拉底式提問
   - 批判性思考引導
   - 知識網絡建構

3. **跨平台同步**
   - iOS/Android 原生 App
   - Browser Extension
   - E-Reader 專用版本

## 💡 貢獻指南

歡迎提交 Issue 和 Pull Request！

建議的改進方向：
- UI/UX 優化建議
- 效能改進
- 新功能提案
- Bug 回報

## 📄 授權

MIT License

---

**享受全新的智慧閱讀體驗！** 📚✨
