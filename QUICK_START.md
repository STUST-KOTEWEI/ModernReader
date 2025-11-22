# ModernReader 開發 & 體驗指南

這份文件將原本的快速入門與 v2.0 功能重點整合，提供開發與產品體驗的單一入口。

## 🚀 快速開始（3 步驟）

### 1. 初始化環境（首次或依賴更新後）

```bash
./scripts/setup.sh
```

此腳本會檢查必要工具、安裝前後端依賴、建立 `.env` 模板、初始化資料庫與所需目錄。

### 2. 啟動服務

**一鍵啟動**（含 tunnel、自動寫入日誌）

```bash
./start-dev.sh
```

**分開啟動**

```bash
# 後端（FastAPI + Uvicorn）
cd backend
poetry run uvicorn app.main:app --reload --port 8001

# 前端（Vite dev server）
./scripts/start-frontend.sh
```

服務預設埠：前端 `http://localhost:5173`，後端 `http://localhost:8001`，API 文件 `http://localhost:8001/docs`。

### 3. 健康檢查

```bash
./scripts/health-check.sh
```

如需離線展示，可使用 demo 腳本：

```bash
./scripts/open-offline.sh  # 自動啟動本機預覽並加上 ?demo=1
```

## 🧭 ModernReader 的 11 大核心模組

- `🎤 發音練習` `/app/pronunciation` — AI 即時評分、練習歷史
- `📈 學習進度` `/app/progress` — 成就、連勝、統計面板
- `🌍 原住民語言` `/app/indigenous` — 手寫識別、文化知識庫
- `💬 語言對話` `/app/indigenous-chat` — 多模態 LLM 對話、翻譯、發音
- `📚 智能書庫` `/app/catalog` — 30+ 書籍、完整 metadata
- `🧠 AI 助手` `/app/ai-demo` — RAG、摘要、重點整理
- `✨ 情緒推薦` `/app/recommendations` — 情緒偵測搭配個人化推薦
- `🎧 有聲書` `/app/audio` — 試聽限制、解鎖流程
- `📱 裝置整合` `/app/devices` — 電子紙、觸覺手環、香氛等設備
- `🕶️ AR 模擬` `/app/ar` — 擴增實境閱讀情境
- `🗺️ 功能導覽` `/app/tour` — 全站導覽與起始教學（建議新用戶從此開始）

提示：所有模組皆可從左側側邊欄進入；儀表板提供即時情緒狀態與 AI 摘要。

## 🛠 常用腳本與例行操作

| 指令 | 作用 | 備註 |
|------|------|------|
| `./scripts/setup.sh` | 初始化或重建環境 | 安裝依賴、建立 `.env`、初始化 DB |
| `./start-dev.sh` | 一鍵啟動前後端與 tunnel | 日誌位於 `/tmp/mr-*.log` |
| `./scripts/start-frontend.sh` | 單獨啟動前端（支援 `--port`、`--no-open`） | 預設自動尋找空埠 |
| `./scripts/health-check.sh` | 健康檢查 | 快速檢查 API / 前端狀態 |
| `./scripts/open-offline.sh` | 離線 Demo 模式 | 無需後端即可展示主要功能 |

其他常用流程：

- 匯入示範書單：`poetry run python backend/scripts/ingest_public_catalog.py`
- 重置資料庫：`rm backend/modernreader.db && poetry run python scripts/init_db.py`
- 查看日誌：`tail -f /tmp/mr-backend.log`、`tail -f /tmp/mr-frontend.log`

## 🤖 LLM 與多模態整合（含 GPT-OSS）

- LLM 管理由 `app/services/ai_engine.py` 處理，支援 OpenAI、Anthropic、Google Gemini 以及新的 `GPT_OSS` provider。
- `.env` 支援 `OSS_API_BASE`、`OSS_API_KEY`、`OSS_TEXT_MODEL`、`OSS_VISION_MODEL`，可串接自架的 OpenAI 相容服務（Ollama、LocalAI、vLLM 等）。
- `/api/v1/ai/understand` 現在可接收文字、圖片（Base64）與語音（Base64 + MIME）；語音會自動轉寫後併入對話上下文。
- `/api/v1/ai/transcribe` 提供獨立語音轉文字 API，前端可先取得文字稿再送出訊息。
- 前端設定頁與 AI 助手/原住民 Chatbot 皆提供「LLM Provider」下拉選單，可即時指定使用 OpenAI、GPT-OSS 或保留 Auto fallback。

## 🎧 Demo 與線上模式切換

- Demo 模式：偵測離線或 `?demo=1` 自動啟用，使用內建 mock 資料。
- 線上模式：需啟動後端；登入/註冊支援簡易驗證或 Cloudflare Turnstile / Google reCAPTCHA（取決於 `.env` 設定）。

## 📚 延伸文件

- `docs/llm_providers.md` — LLM / GPT-OSS 設定與串接指南
- `OAUTH_SETUP_GUIDE.md` — Google OAuth 流程
- `LOCALHOST_RUN_SETUP.md` — 本機快速啟動與疑難排解

更多歷史更新請參考 `UPDATE_SUMMARY.md` 與 `COPILOT_FEATURES.md`。
