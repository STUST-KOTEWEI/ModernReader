# LLM Provider 快速設定指南

ModernReader 的 `WorldClassAIEngine` 允許同時設定多個 LLM 供應商，並在失敗時自動 fallback。本指南說明如何啟用或擴充各家服務，包含自架的 GPT-OSS 相容模型。

## 1. 基本環境變數

將以下設定寫入 `backend/.env`（或您的部署環境變數）：

| 變數 | 說明 |
|------|------|
| `OPENAI_API_KEY` | OpenAI API 金鑰（可選） |
| `ANTHROPIC_API_KEY` | Anthropic Claude 金鑰（可選） |
| `GOOGLE_API_KEY` | Google Gemini 金鑰（可選） |
| `OSS_API_BASE` | 自架或第三方 OpenAI 相容 API base URL（如 `http://localhost:8000/v1`） |
| `OSS_API_KEY` | 自架服務需要的金鑰（若不需可留空） |
| `OSS_TEXT_MODEL` | 預設文字模型名稱（預設 `gpt-4o-mini`，可換成 `llama3.1:8b` 等） |
| `OSS_VISION_MODEL` | 需要多模態時的模型（如 `llama3.2-vision`），可留空 |
| `OSS_TRANSCRIBE_MODEL` | 若 OSS 服務支援語音轉文字，可指定模型名稱；預設沿用 `OSS_TEXT_MODEL` |

> 若使用 Ollama，可搭配 `ollama serve --addr 0.0.0.0:8000`，並在 `OSS_API_BASE` 設為 `http://localhost:8000/v1`。

## 2. Provider 優先順序

`app/core/llm_config.py` 中的 `provider_priority` 決定嘗試順序，預設為：OpenAI → Anthropic → Google → GPT_OSS。可以依需求在 `.env` 另行指定：

```env
LLM_PROVIDER_PRIORITY=openai,anthropic,gpt_oss
```

若指定的 provider 沒有設定對應 API（例如缺少金鑰），初始化時會自動略過。

## 3. GPT-OSS 常見選項

| 方案 | `OSS_API_BASE` | `OSS_TEXT_MODEL` 範例 | 備註 |
|------|----------------|------------------------|------|
| Ollama | `http://localhost:11434/v1` | `llama3.1` | 需啟用 `ollama serve`，並加裝對應模型 |
| LocalAI | `http://localhost:8080/v1` | `phi-3-mini` | 支援多種 GGUF 模型 |
| vLLM / OpenAI-Compatible | `https://your-host/v1` | `mistral-7b-instruct` | 可與 KServe / Sagemaker 等部署整合 |

若服務不需金鑰，可將 `OSS_API_KEY` 留空；程式會自動填入 `oss-no-key` 以符合 OpenAI 客戶端要求。

## 4. 多模態支援

- `/api/v1/ai/understand` 支援文字、圖片（Base64）與語音檔（Base64 + MIME 類型）。
- 語音訊息會使用 OpenAI Whisper v3（或任一相容 endpoint）進行轉寫；若未提供任何語音服務，API 會回傳 503。欲改用自架模型，可設定 `OSS_TRANSCRIBE_MODEL`。
- 若 GPT-OSS 服務支援 Vision，可在 `.env` 設定 `OSS_VISION_MODEL`，前端即可透過新的圖片上傳功能觸發描述生成。

## 5. 前端/使用者設定整合

- `/api/v1/ai/providers` 回傳目前部署可用的 provider 清單（含模型、是否支援 Vision / Transcription）。
- 設定頁面（`/app/settings`）新增「LLM Provider」下拉選單，可切換 `Auto`（沿用後端 fallback）或明確指定如 `openai`、`gpt_oss`。
- 使用者偏好會存回 `user_settings.preferences.llm_provider`，並同步儲存在 `localStorage` 的 `mr_llm_provider` 方便前端快速存取。
- AI 助手與原住民 Chatbot 皆會依此偏好指定 provider，確保在 Demo、OpenAI 與自架模型間自由切換。

## 6. 排錯建議

1. 呼叫 `/api/v1/ai/health` 確認已讀到目標 provider。
2. 檢查後端日誌是否有初始化失敗訊息（例如 TLS、金鑰格式錯誤）。
3. 若使用 Docker，記得將自架 LLM 的服務加入 docker-compose 並調整 `OSS_API_BASE` URL。

完成設定後，前端的語言 AI 對話頁面會自動串聯新的 Provider，並於側邊設定頁顯示目前使用中的模型。
