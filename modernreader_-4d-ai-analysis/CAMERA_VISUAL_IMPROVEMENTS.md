# 相機與視覺化功能改進

## 📅 更新日期
2025年10月21日

## 🎯 改進內容

### 1. 相機鏡頭切換功能

#### 問題
- 相機只能使用後置鏡頭（environment）
- 無法切換到前置鏡頭（user）進行自拍或前置掃描

#### 解決方案

##### A. 新增狀態管理
```typescript
const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
```

##### B. 改進 startCamera 函數
```typescript
const startCamera = async (facing?: 'user' | 'environment') => {
    const facingMode = facing || cameraFacing;
    const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode } 
    });
    // ...
};
```

##### C. 新增切換功能
```typescript
const switchCamera = async () => {
    const newFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(newFacing);
    if (isCameraOn) {
        await startCamera(newFacing);
    }
};
```

##### D. UI 改進

**右上角切換按鈕**：
- 圓形按鈕，顯示旋轉箭頭圖示
- 點擊即可在前置/後置鏡頭間切換
- Hover 時顯示提示文字

**左上角模式指示**：
- 📷 後置鏡頭
- 🤳 前置鏡頭
- 半透明背景，清楚顯示當前模式

### 2. Visual Interpretation 智慧生成

#### 問題
- 圖片生成使用通用提示詞，與內容無關
- 無法根據文字內容生成相關視覺化

#### 解決方案

##### A. 新增參數
```typescript
const VisualizeView: React.FC<{ 
    imageUrl: string | null;
    inputText?: string;      // 原始文字
    summary?: string;        // AI 摘要
}> = ({ imageUrl, inputText, summary }) => {
```

##### B. 智慧提示詞生成
```typescript
let prompt = "abstract digital art, vibrant colors, conceptual visualization";

if (summary) {
    // 優先使用 AI 生成的摘要
    const shortSummary = summary.substring(0, 100);
    prompt = `Create a vibrant, abstract digital art visualization representing: ${shortSummary}`;
} else if (inputText) {
    // 回退到原始文字
    const shortText = inputText.substring(0, 100);
    prompt = `Abstract conceptual art inspired by: ${shortText}`;
}
```

##### C. 傳遞上下文
```typescript
visualize: <VisualizeView 
    imageUrl={session.imageUrl} 
    inputText={session.inputText} 
    summary={session.analysisResult?.summary} 
/>
```

## 🎨 使用介面

### 相機功能

#### 啟動相機
1. 點擊「Scan」模式
2. 點擊「Start Camera」
3. 允許相機權限

#### 切換鏡頭
1. 相機開啟後，右上角有切換按鈕
2. 點擊切換按鈕在前置/後置鏡頭間切換
3. 左上角顯示當前鏡頭模式

#### 拍攝文字
1. 對準要掃描的文字
2. 點擊底部「📸 Capture Text」
3. 等待 OCR 處理

### 視覺化功能

#### 自動生成
- 完成文字分析後，系統會自動嘗試生成視覺化
- 使用 AI 摘要作為提示詞
- 生成與內容相關的抽象藝術

#### 手動生成
1. 進入 Visual Interpretation 分頁
2. 如果沒有圖片，點擊「Generate Visualization」
3. 系統會使用摘要或原始文字生成圖片

## 📱 UI 元素說明

### 相機介面

```
┌─────────────────────────────────┐
│ 📷 後置鏡頭        🔄           │  ← 左上：模式指示 | 右上：切換按鈕
│                                 │
│                                 │
│         [視訊預覽]              │
│                                 │
│                                 │
│─────────────────────────────────│
│  📸 Capture Text    ✕ Close    │  ← 底部：操作按鈕
└─────────────────────────────────┘
```

### 切換按鈕
- 🔄 圖示：旋轉箭頭
- 位置：右上角
- 樣式：半透明黑色背景
- 功能：點擊切換前置/後置

### 模式指示
- 📷 後置鏡頭：environment (預設)
- 🤳 前置鏡頭：user
- 位置：左上角
- 樣式：半透明黑色背景

## 🔧 技術細節

### 鏡頭模式

#### facingMode 選項
```typescript
'environment' // 後置鏡頭（預設）- 掃描文件、書籍
'user'        // 前置鏡頭 - 自拍、視訊通話
```

#### 瀏覽器支援
- ✅ Chrome/Edge: 完整支援
- ✅ Safari iOS: 完整支援
- ✅ Firefox: 完整支援
- ⚠️ 桌面瀏覽器：可能只有一個鏡頭

### 視覺化提示詞策略

#### 優先級
1. **AI 摘要**（最佳）
   - 已經過 AI 處理，更簡潔
   - 包含核心概念
   
2. **原始文字**（次佳）
   - 如果沒有摘要
   - 使用前 100 個字元

3. **通用提示**（回退）
   - 如果都沒有
   - 生成抽象藝術

#### 提示詞格式
```typescript
// 使用摘要
"Create a vibrant, abstract digital art visualization representing: [摘要前100字]"

// 使用原始文字
"Abstract conceptual art inspired by: [文字前100字]"

// 通用回退
"abstract digital art, vibrant colors, conceptual visualization"
```

## 🎯 使用案例

### 案例 1：掃描書籍（後置鏡頭）
1. 啟動相機（預設後置）
2. 對準書頁
3. 拍攝並擷取文字
4. 查看視覺化（基於擷取的文字）

### 案例 2：掃描螢幕（前置鏡頭）
1. 啟動相機
2. 點擊切換到前置鏡頭
3. 對準另一個螢幕的文字
4. 拍攝並擷取

### 案例 3：內容視覺化
1. 輸入或掃描文字
2. 執行分析
3. AI 生成摘要
4. 自動使用摘要生成相關視覺化
5. 或手動點擊重新生成

## ✅ 測試清單

### 相機功能
- [ ] 啟動後置鏡頭
- [ ] 切換到前置鏡頭
- [ ] 切換回後置鏡頭
- [ ] 模式指示正確顯示
- [ ] 切換按鈕反應靈敏
- [ ] 拍攝功能正常

### 視覺化功能
- [ ] 有摘要時使用摘要生成
- [ ] 無摘要時使用原始文字
- [ ] 無內容時使用通用提示
- [ ] 手動生成功能正常
- [ ] 錯誤處理完善

## 🐛 已知限制

### 相機
- ⚠️ **桌面電腦**：通常只有一個鏡頭，切換功能可能無效
- ⚠️ **權限**：首次使用需要允許相機權限
- ⚠️ **HTTPS**：某些瀏覽器要求 HTTPS（localhost 除外）

### 視覺化
- ⚠️ **Mock 服務**：只回傳 1x1 佔位圖
- ⚠️ **Gemini API**：需要有效 API Key 且有配額
- ⚠️ **本地 SD**：需要運行真實 Stable Diffusion 服務
- ⚠️ **提示詞長度**：限制在 100 字元以獲得更好效果

## 🚀 未來改進

### 相機
- [ ] 支援手動對焦
- [ ] 支援閃光燈控制
- [ ] 支援縮放功能
- [ ] 批次掃描多頁
- [ ] 自動邊緣偵測

### 視覺化
- [ ] 多種藝術風格選擇
- [ ] 生成多張圖片供選擇
- [ ] 圖片編輯功能
- [ ] 更智慧的提示詞生成（使用 AI）
- [ ] 快取已生成的圖片

## 📚 相關檔案

- `pages/Reader.tsx` - 主要改進檔案
  - InputPanel 元件：相機功能
  - VisualizeView 元件：視覺化功能
- `services/stableDiffusionService.ts` - 圖片生成 API
- `services/geminiService.ts` - Gemini Imagen API

## 🎉 改進總結

✅ **相機功能**
- 支援前置/後置鏡頭切換
- 清楚的視覺指示
- 流暢的切換體驗

✅ **視覺化功能**
- 智慧提示詞生成
- 內容相關的圖片
- 更好的使用者體驗

---

**所有功能已完成並可立即測試！** 📸🎨
