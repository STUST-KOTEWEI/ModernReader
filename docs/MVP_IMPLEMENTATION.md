# ModernReader MVP 實作說明

本版本把 ModernReader 從純前端展示原型推進為可持續擴充的閱讀產品基礎。前端支援瀏覽器端 EPUB 解析，後端提供帳號、書籍同步、情緒標記、AI 摘要、RAG 問答、Podcast 腳本與 TTS API。

## 啟動前端

```bash
cd web/frontend
npm install
npm run dev
```

## 啟動後端

```bash
python3 -m pip install -r web/backend/requirements.txt
uvicorn web.backend.main:app --reload --port 8000
```

後端資料預設儲存在 `web/backend/modernreader.sqlite3`。可使用 `MODERNREADER_DB` 指定其他位置。

## 啟用真正 AI

後端支援 OpenAI 相容 API。設定以下環境變數後，`/api/ai/summary`、`/api/ai/ask` 與 `/api/ai/podcast-script` 會使用 LLM；未設定時會自動回退到離線模式。

```bash
export OPENAI_API_KEY="your-key"
export OPENAI_API_BASE="https://api.openai.com/v1" # 或其他 OpenAI 相容服務
export MODERNREADER_MODEL="gpt-5-mini"
```

API Key 只能放在後端環境變數，不能放進 React 前端或提交至 GitHub。

## 已完成的 API

| API | 用途 |
|---|---|
| `POST /api/auth/register` | 建立帳號 |
| `POST /api/auth/login` | 登入並取得 Bearer token |
| `GET /api/books` | 取得使用者書櫃 |
| `POST /api/books` | 同步文字書籍 |
| `GET /api/books/{id}` | 取得書籍內容 |
| `POST /api/ai/summary` | 生成摘要，無 API Key 時離線回退 |
| `POST /api/ai/ask` | 基於書籍段落的 RAG 問答 |
| `POST /api/ai/podcast-script` | 生成 Podcast 腳本 |
| `POST /api/annotations` | 儲存情緒標記 |
| `GET /api/annotations` | 讀取情緒標記 |
| `POST /api/tts` | 產生 MP3 語音 |

## EPUB 限制

EPUB 現在由瀏覽器以 JSZip 解析 `container.xml`、OPF manifest 與 spine，並抽取章節文字。這種設計不需要把原始 EPUB 上傳到伺服器，因此更有利於隱私與離線使用。下一階段可再加入圖片、CSS、版面與固定布局 EPUB 支援。

## 尚需外部條件的項目

Apple Watch 需要 Apple Developer 帳號、macOS/Xcode、iOS App 與 HealthKit 權限；硬體整合需要實體設備、SDK 與協議文件；App 上架需要 Apple Developer 與 Google Play Console 帳號。這些部分已不適合在沒有帳號或設備的環境中假裝完成。
