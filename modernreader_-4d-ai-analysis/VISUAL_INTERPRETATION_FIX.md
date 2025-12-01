# Visual Interpretation 功能修復

## 問題描述
Visual Interpretation (視覺化) 分頁沒有顯示任何內容，只顯示「Generating visualization...」

## 根本原因
1. **Gemini Imagen API**: 需要 API key 且可能失敗
2. **Stable Diffusion Fallback**: 當 Gemini 失敗時會嘗試本地 SD，但如果也失敗，`imageUrl` 會是 `null`
3. **UI 顯示**: 原本的 UI 在沒有圖片時只顯示載入訊息，沒有重試或說明選項

## 解決方案

### 改進的 VisualizeView 元件

新增了以下功能：

#### 1. 狀態管理
```typescript
const [isGenerating, setIsGenerating] = useState(false);
const [localImageUrl, setLocalImageUrl] = useState<string | null>(imageUrl);
const [error, setError] = useState<string | null>(null);
```

#### 2. 手動重試功能
使用者可以點擊「Generate Visualization」按鈕手動觸發圖片生成：
```typescript
const handleRetryGeneration = async () => {
    setIsGenerating(true);
    setError(null);
    try {
        const { generateImageLocal } = await import('../services/stableDiffusionService');
        const result = await generateImageLocal(prompt, {
            width: 768,
            height: 512,
            steps: 30,
            cfg_scale: 7.5
        });
        if (result) {
            setLocalImageUrl(result);
        }
    } catch (err) {
        setError(err.message);
    }
};
```

#### 3. 三種 UI 狀態

##### A. 有圖片時
- 顯示生成的圖片
- 顯示說明文字

##### B. 生成中
- 顯示旋轉動畫
- 顯示「Generating visualization...」

##### C. 沒有圖片時
- 顯示友善的圖示 🎨
- 顯示「Generate Visualization」按鈕
- 顯示兩種設定方式的說明：
  1. 設定 Gemini API Key
  2. 運行本地 Stable Diffusion

##### D. 發生錯誤時
- 顯示錯誤訊息
- 顯示「🔄 Retry with Local SD」按鈕
- 顯示設定說明

## 使用方式

### 方式 1：使用 Gemini Imagen（推薦）

1. 取得 Gemini API Key (https://ai.google.dev/)
2. 在 `.env.local` 中設定：
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
3. 重新啟動開發伺服器
4. 進行文字分析，Visual Interpretation 會自動生成

### 方式 2：使用本地 Stable Diffusion

#### 使用 Mock 服務（快速測試）
```bash
# 啟動 mock SD 服務
npm run dev:mock-ai

# 或手動啟動
node ./dev/mock-ai-servers.js
```

#### 使用真實 Stable Diffusion
```bash
# 需要安裝 AUTOMATIC1111 或類似工具
# 確保在 http://localhost:7860 運行
# 或設定 VITE_SD_URL 環境變數
```

### 方式 3：手動生成

1. 進入 Visual Interpretation 分頁
2. 點擊「Generate Visualization」按鈕
3. 系統會嘗試使用本地 SD 服務生成圖片

## 技術細節

### 圖片生成流程

```
1. 文字分析開始
   ↓
2. 嘗試 Gemini Imagen API
   ↓
3. 如果失敗 → 嘗試本地 Stable Diffusion
   ↓
4. 如果都失敗 → imageUrl = null
   ↓
5. VisualizeView 顯示適當的 UI 狀態
```

### 生成參數

```typescript
{
  width: 768,      // 圖片寬度
  height: 512,     // 圖片高度
  steps: 30,       // 生成步數（越高越慢但品質越好）
  cfg_scale: 7.5   // CFG Scale（提示詞遵循度）
}
```

### API 端點

- **Gemini Imagen**: Google AI API
- **Local SD**: `http://localhost:7860/sdapi/v1/txt2img`
- **Mock SD**: `http://localhost:7860/sdapi/v1/txt2img` (回傳 1x1 佔位圖)

## 改進特色

✅ **友善的錯誤處理**: 清楚告知使用者發生什麼問題
✅ **手動重試**: 不需要重新分析文字就能生成圖片
✅ **設定指引**: 顯示如何設定兩種圖片生成方式
✅ **載入狀態**: 有旋轉動畫顯示生成進度
✅ **彈性配置**: 支援多種圖片生成來源

## 測試步驟

### 測試 1: 無 API Key 狀態
1. 確認 `.env.local` 沒有 `VITE_GEMINI_API_KEY`
2. 進行文字分析
3. 進入 Visual Interpretation 分頁
4. 應該看到「Generate Visualization」按鈕和設定說明

### 測試 2: 手動生成（Mock）
1. 啟動 mock AI 服務: `npm run dev:mock-ai`
2. 點擊「Generate Visualization」按鈕
3. 應該看到載入動畫
4. 然後顯示 1x1 佔位圖（Mock 回傳）

### 測試 3: Gemini API
1. 設定有效的 `VITE_GEMINI_API_KEY`
2. 重新啟動開發伺服器
3. 進行文字分析
4. Visual Interpretation 應該自動生成圖片

### 測試 4: 錯誤處理
1. 停止所有 SD 服務
2. 移除 Gemini API Key
3. 嘗試生成圖片
4. 應該看到錯誤訊息和重試按鈕

## 已知限制

⚠️ **Mock SD 服務**: 只回傳 1x1 透明圖片，不是真實生成
⚠️ **Gemini Imagen**: 需要付費 API，有配額限制
⚠️ **本地 SD**: 需要高效能電腦和額外軟體安裝
⚠️ **生成時間**: 真實 SD 生成可能需要 10-30 秒

## 未來改進方向

- [ ] 支援更多圖片生成參數調整（style, quality, etc）
- [ ] 快取生成的圖片避免重複生成
- [ ] 支援多張圖片生成
- [ ] 整合其他圖片生成服務（DALL-E, Midjourney）
- [ ] 圖片編輯和微調功能

## 相關檔案

- `pages/Reader.tsx` - VisualizeView 元件
- `services/geminiService.ts` - Gemini Imagen API
- `services/stableDiffusionService.ts` - 本地 SD API
- `dev/mock-ai-servers.js` - Mock SD 服務

---

**總結**: Visual Interpretation 現在有完整的錯誤處理、手動重試功能和清楚的設定指引！🎨
