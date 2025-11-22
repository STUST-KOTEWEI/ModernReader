# Hugging Face 免費 API 設定指南

## 🆓 完全免費！無需信用卡

Hugging Face 提供**完全免費**的 Inference API，無需信用卡，只需註冊帳號。

---

## 📝 步驟 1: 註冊 Hugging Face 帳號

1. 前往 https://huggingface.co/join
2. 使用 Email 或 Google/GitHub 註冊
3. 驗證 Email（如果需要）

**完全免費，無需信用卡！**

---

## 🔑 步驟 2: 取得 API Token

1. 登入後，前往 https://huggingface.co/settings/tokens
2. 點擊 **"New token"**
3. 設定：
   - Name: `ModernReader`
   - Type: **Read** (免費層級)
4. 點擊 **"Generate"**
5. **複製** Token（格式：`hf_xxxxxxxxxxxxx`）

---

## ⚙️ 步驟 3: 設定環境變數

編輯 `/Users/kedewei/modernreader/web/.env.local`：

```bash
# Hugging Face API Token (完全免費)
HUGGINGFACE_API_KEY=hf_your_token_here
```

將 `hf_your_token_here` 替換為您剛才複製的 Token。

---

## 🔄 步驟 4: 重啟開發伺服器

```bash
# 在終端機按 Ctrl+C 停止
# 然後重新執行
cd /Users/kedewei/modernreader/web
npm run dev
```

---

## ✅ 可用功能

使用 Hugging Face 免費 API，以下功能將啟用：

### 1. AI Chat (對話)
- 模型: **Llama-2-7b-chat** (Meta 開源)
- 支援 10 種 Persona
- 品質：良好（略低於 GPT-4）

### 2. 情緒辨識
- 模型: **DistilRoBERTa** (情緒分類)
- 支援 7 種情緒
- 準確度：高

### 3. 翻譯
- 模型: **NLLB-200** (Facebook)
- 支援 **200 種語言**
- 品質：優秀

### ❌ 不支援的功能
- ❌ TTS 語音生成（需要 OpenAI 或 ElevenLabs）
- ❌ DALL-E 圖片生成（會顯示 placeholder）

---

## 💡 混合方案（推薦）

如果您想要最佳體驗：

1. **Hugging Face** (免費) → Chat, 情緒, 翻譯
2. **OpenAI 免費額度** ($5) → TTS, 圖片生成

在 `.env.local` 同時設定兩個 API Key：
```bash
HUGGINGFACE_API_KEY=hf_xxxxx
OPENAI_API_KEY=sk-xxxxx
```

系統會自動選擇最佳 API！

---

## 🚀 測試

設定完成後，測試以下功能：

1. **AI Chat**: `/reader` → Discussion 區
2. **情緒辨識**: 輸入帶有情緒的訊息
3. **翻譯**: Omnilingual 語言選擇器

---

## ❓ 常見問題

### Q: 免費額度有限制嗎？
A: 有，但非常寬鬆：
- 每小時 1000 次請求
- 足夠個人測試使用

### Q: 速度如何？
A: 第一次請求較慢（冷啟動），之後會快很多

### Q: 需要信用卡嗎？
A: **完全不需要！**

---

## 🔗 相關連結

- Hugging Face 官網: https://huggingface.co
- API 文件: https://huggingface.co/docs/api-inference
- 可用模型: https://huggingface.co/models

---

**需要幫助？** 請參考 `ENV_SETUP.md` 或聯繫支援。
