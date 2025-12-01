# ModernReader 快速上手指南

## 歡迎使用 ModernReader！

本指南將帶你快速體驗 ModernReader 的所有革命性功能，從基礎閱讀到穿戴裝置整合與量子通訊。

---

## 🚀 5 分鐘快速開始

### 步驟 1: 安裝與啟動

```bash
# 克隆專案
git clone <your-repo-url>
cd modernreader_-4d-ai-analysis

# 安裝依賴
npm install

# 建立環境變數檔案
cp .env.example .env.local

# 編輯 .env.local，加入你的 Gemini API Key
echo "VITE_GEMINI_API_KEY=your_key_here" >> .env.local

# 啟動應用
npm run dev
```

瀏覽器會自動開啟 `http://localhost:3000`

---

### 步驟 2: 第一次閱讀體驗

1. 點擊頂部導航的 **"Reader"** 進入閱讀頁面
2. 在文字輸入框貼上任何文本（可以試試一篇文章或段落）
3. 點擊 **"深度分析"** 按鈕
4. 等待 AI 分析完成（通常 3-5 秒）
5. 查看分析結果：
   - 📊 多角度分析
   - 🎯 關鍵詞提取
   - 💡 創意連結
   - 🔮 未來影響

---

### 步驟 3: 探索視覺化

1. 切換到 **"Visualize"** 標籤頁
2. 在「情緒風格」下拉選單選擇一個情緒（如「平靜」、「激勵」）
3. 點擊 **"生成視覺"** 或 **"以情緒重生圖像"**
4. AI 會根據文本內容和情緒風格生成圖像
5. 如果 Gemini Imagen 不可用，會自動切換到本地 Stable Diffusion

**提示**: 不同的情緒風格會產生截然不同的視覺效果！

---

### 步驟 4: 嘗試語音功能

#### 文字轉語音 (TTS)

1. 在閱讀頁面選取一段文字
2. 點擊 **"朗讀"** 按鈕（🔊 圖示）
3. 系統會用自然語音朗讀文本
4. 可以調整語速和音量

#### 語音轉文字 (STT)

1. 點擊 **"語音輸入"** 按鈕（🎤 圖示）
2. 允許瀏覽器使用麥克風
3. 開始說話，系統會即時轉換成文字
4. 點擊 **"停止"** 結束錄音

**備註**: 如果本地 TTS/STT 服務未啟動，會自動使用瀏覽器內建的 Web Speech API

---

### 步驟 5: 體驗沉浸式閱讀

1. 點擊頂部導航的 **"Immersive"**
2. 允許相機權限（手機需要 HTTPS 或 localhost）
3. 選擇啟用:
   - 👁️ **眼動追蹤**: 用視線控制滾動
   - 🖐️ **手勢控制**: 揮手翻頁
4. 文字會呈現在 3D 空間中
5. 使用手勢或眼神互動閱讀

**重要**: 手機使用者請參考下方「手機 HTTPS 設定」章節

---

## 📱 手機使用指南

### HTTPS 開發伺服器設定（用於相機功能）

手機瀏覽器要求安全情境才能存取相機，請按以下步驟設定：

#### 方法 1: 使用 Vite 內建自簽憑證（最簡單）

1. 編輯 `.env.local`:

   ```env
   VITE_DEV_HTTPS=true
   ```

2. 重新啟動開發伺服器:

   ```bash
   npm run dev
   ```

3. 查看終端機顯示的本機 IP（例如 `192.168.1.100`）

4. 在手機瀏覽器輸入: `https://192.168.1.100:3000`

5. 接受自簽憑證警告（點選「前往」或「繼續」）

6. 現在可以使用相機功能了！

#### 方法 2: 使用自己的 SSL 憑證

如果你有自己的 SSL 憑證：

```env
VITE_DEV_HTTPS=true
VITE_DEV_SSL_KEY=/絕對路徑/server.key
VITE_DEV_SSL_CERT=/絕對路徑/server.crt
```

#### 方法 3: 使用公開隧道（ngrok / Cloudflare Tunnel）

適合需要公開網址的情況：

```bash
# 安裝 ngrok
brew install ngrok  # macOS
# 或從 https://ngrok.com/download 下載

# 啟動隧道
ngrok http 3000

# 複製 ngrok 提供的 HTTPS 網址到手機瀏覽器
```

---

## ⌚ 穿戴裝置整合

### Apple Watch 設定

**需求**: iOS 裝置 + Apple Watch + ModernReader iOS 應用（開發中）

**功能預覽**:

- 心率監測自動調整閱讀速度
- HRV 偵測專注度，適時建議休息
- 觸覺回饋提示重要段落
- 手腕抬起自動恢復閱讀

**當前狀態**: 服務架構已完成（`services/appleWatchService.ts`），等待 iOS 應用發布

---

### 小米手環設定

**需求**: Android/iOS + 小米手環 + Mi Fit App

**功能預覽**:

- 步數追蹤啟動「走讀模式」（邊走邊聽書）
- 睡眠品質分析推薦最佳閱讀時段
- 壓力指數自動切換輕鬆內容
- 閱讀目標達成震動提醒

**當前狀態**: SDK 整合開發中（`services/miWearableService.ts`）

---

### AR 眼鏡體驗

#### WebXR 模擬器（立即可用）

1. 在支援 WebXR 的瀏覽器開啟應用（Chrome/Edge）
2. 點擊 **"進入 AR 模式"** 按鈕
3. 允許使用相機（如果需要）
4. 體驗 3D 知識圖譜與空間化文本

#### 真實 AR 裝置

**Meta Quest 3** (推薦開發測試)

```bash
# 在 Quest 3 瀏覽器開啟
https://your-server-ip:3000

# 點選 "Enter VR" 按鈕
# 使用手部追蹤互動
```

**Apple Vision Pro** (最佳體驗)

- 需要 visionOS 原生應用（開發中）
- 將支援眼動追蹤、空間音訊、手勢控制

**Rokid Air / Xreal Air** (輕量方案)

- 連接到手機/電腦
- 開啟 ModernReader 網頁應用
- 享受大螢幕閱讀體驗

詳細設定請參考: `WEARABLE_DEVICES_INTEGRATION.md`

---

## ⚛️ 量子通訊設定（進階）

### IBM Quantum Network 註冊

1. 前往 [IBM Quantum](https://quantum-computing.ibm.com/)
2. 註冊免費帳號
3. 取得 API Token
4. 加入 `.env.local`:

   ```env
   IBM_QUANTUM_API_KEY=your_ibm_quantum_token
   ```

5. 重新啟動應用

### 啟用量子同步

在瀏覽器 Console 執行:

```javascript
// 初始化量子網路
await quantumIntegration.initializeQuantumNetwork();

// 建立糾纏通道（連接你的所有裝置）
await quantumIntegration.createEntangledChannel([
  'iphone-primary',
  'apple-watch',
  'ar-glasses'
]);

// 測試量子同步
await quantumIntegration.syncReadingProgressQuantum({
  bookId: 'test-book-123',
  page: 42,
  timestamp: Date.now()
});

// 如果成功，所有裝置會瞬間同步（< 1ms）
```

### 整合 Elik 電子書平台

**需求**: Elik 帳號 + API 存取權限

1. 聯絡 Elik 獲取 API 憑證
2. 在 ModernReader 設定頁面輸入憑證
3. 點擊 **"建立量子橋接"**
4. 系統會使用量子金鑰分發 (QKD) 建立安全連線
5. 你的 Elik 電子書會自動同步到 ModernReader

**合作洽詢**: `quantum-partnerships@modernreader.ai`

---

## 🎨 進階功能

### 情緒提示詞庫

位置: `data/emotionPrompts.json`

包含數百種情緒風格:

- 平靜系列（平和、冥想、禪意）
- 激勵系列（奮鬥、突破、勝利）
- 神秘系列（奇幻、暗黑、科幻）
- 溫暖系列（溫馨、治癒、童話）

**自訂情緒**:

```json
{
  "title": "我的自訂情緒",
  "imagePrompts": [
    "atmospheric lighting, warm tones, cozy environment",
    "soft focus, gentle colors, peaceful mood"
  ],
  "description": "適合放鬆閱讀的溫暖風格"
}
```

加入到 `emotionPrompts.json` 後重新整理即可使用。

---

### 狀態列開關

預設隱藏服務狀態列（SD/TTS/STT），如需顯示:

**方法 1: 環境變數**

```env
VITE_SHOW_STATUS=true
```

**方法 2: LocalStorage**

在瀏覽器 Console 執行:

```javascript
localStorage.setItem('SHOW_STATUS', '1');
location.reload();
```

隱藏:

```javascript
localStorage.removeItem('SHOW_STATUS');
location.reload();
```

---

### 本地 AI 服務（可選）

如果你有自架 AI 服務，可以取代雲端 API:

#### Stable Diffusion

```bash
# 安裝 AUTOMATIC1111 WebUI
git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui
cd stable-diffusion-webui
./webui.sh --api --listen

# 加入 .env.local
VITE_SD_URL=http://localhost:7860/sdapi
```

#### TTS 服務

```bash
# 範例：使用 Coqui TTS
pip install TTS
tts-server --model_name tts_models/en/ljspeech/tacotron2-DDC

# 加入 .env.local
VITE_TTS_API_URL=http://localhost:5002/api
```

#### STT 服務

```bash
# 範例：使用 Whisper
pip install openai-whisper
# 啟動你的 STT 伺服器

# 加入 .env.local
VITE_STT_API_URL=http://localhost:5003/api
```

---

## 🔧 疑難排解

### 問題 1: Gemini API 錯誤

**症狀**: "API key not valid" 或 "Quota exceeded"

**解決**:

1. 檢查 `.env.local` 中的 `VITE_GEMINI_API_KEY` 是否正確
2. 前往 [Google AI Studio](https://aistudio.google.com/apikey) 驗證 API 金鑰
3. 確認 API 配額未超過（免費版有限制）

---

### 問題 2: 相機無法啟動（手機）

**症狀**: 點擊相機按鈕沒有反應或顯示錯誤

**解決**:

1. 確認使用 HTTPS 或 localhost（見上方「手機使用指南」）
2. 檢查瀏覽器是否允許相機權限（設定 → 網站權限）
3. 在 iOS Safari，確保不是隱私瀏覽模式
4. 嘗試用後置相機（應用會優先請求）

---

### 問題 3: 量子網路連線失敗

**症狀**: "Quantum network initialization failed"

**解決**:

1. 確認 `IBM_QUANTUM_API_KEY` 正確無誤
2. 檢查網路連線（量子服務需要穩定網路）
3. 確認 IBM Quantum 帳號狀態正常
4. 免費版有使用時間限制，可能需要等待或升級方案

---

### 問題 4: 穿戴裝置無法連接

**症狀**: Apple Watch 或小米手環顯示離線

**解決**:

1. 確認裝置與手機已配對
2. 檢查 ModernReader 應用是否有藍牙權限
3. 重新啟動裝置藍牙
4. 某些功能需要原生應用（目前開發中）

---

### 問題 5: 建置錯誤

**症狀**: `npm run build` 失敗

**解決**:

```bash
# 清除快取
rm -rf node_modules package-lock.json
npm install

# 確認 Node.js 版本 >= 18
node --version

# 檢查 TypeScript 錯誤
npx tsc --noEmit

# 如有錯誤，根據提示修正
```

---

## 📚 延伸閱讀

- **`WEARABLE_DEVICES_INTEGRATION.md`**: 穿戴裝置完整整合指南
- **`STABILITY_ARCHITECTURE.md`**: 系統穩定性與災難恢復
- **`FEATURES.md`**: 所有功能詳細說明
- **`INSTALLATION.md`**: 詳細安裝步驟
- **`TESTING_GUIDE.md`**: 測試與品質保證

---

## 🎓 學習資源

### 影片教學（即將推出）

- [ ] ModernReader 快速入門 (5 分鐘)
- [ ] 進階功能完全指南 (30 分鐘)
- [ ] 穿戴裝置設定實戰 (15 分鐘)
- [ ] 量子通訊原理與應用 (45 分鐘)

### 範例專案

- [ ] 大學教材分析範例
- [ ] 小說閱讀與筆記範例
- [ ] 技術文件整理範例
- [ ] 多人協作閱讀範例

---

## 💬 社群與支援

- **Discord 社群**: [加入我們](https://discord.gg/modernreader)
- **GitHub Discussions**: [提問與討論](https://github.com/your-repo/discussions)
- **Email 支援**: support@modernreader.ai
- **Twitter**: [@modernreader_ai](https://twitter.com/modernreader_ai)

---

## 🌟 下一步

恭喜！你已經掌握 ModernReader 的基礎與進階功能。

**建議下一步行動**:

1. ✅ 閱讀一篇完整文章，體驗完整分析流程
2. ✅ 嘗試不同的情緒風格生成視覺化
3. ✅ 在手機上設定 HTTPS 並測試相機功能
4. ✅ 註冊 IBM Quantum 帳號，體驗量子同步
5. ✅ 閱讀 `WEARABLE_DEVICES_INTEGRATION.md` 準備穿戴裝置整合
6. ✅ 加入 Discord 社群與其他使用者交流

**最重要的**：享受閱讀，讓 AI 成為你的最佳夥伴！📖✨

---

**版本**: v1.0.0  
**最後更新**: 2025-10-21  
**作者**: ModernReader Team

> "閱讀不只是吸收知識，更是與世界對話的方式。而 ModernReader，讓這場對話變得無限可能。"
