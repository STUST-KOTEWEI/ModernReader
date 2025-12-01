# ModernReader Platform

> 新世代智能閱讀系統 - AI × 多模態互動 × 全物種通用

## 🎯 專案概述

ModernReader 是一個結合 AI、多模態互動和通用設計的現代閱讀平台，提供：

- 🤖 **AI 個性化推薦** - 基於使用者興趣和閱讀目標
- 🎙️ **Podcast 自動生成** - 8 種聲音風格 + 1600+ 種語言
- 💬 **AI 聊天伴侶** - 10+ 種人格模式可選
- 🌍 **多語言翻譯** - 支援 1600+ 種語言
- 😊 **情緒偵測** - 根據情緒調整推薦
- 📚 **HyRead 整合** - 帳密認證與 DRM 保護

---

## 🚀 快速開始

### Web 應用 (Next.js 16)

```bash
cd web
npm install
npm run dev
```

開啟 `http://localhost:3000`

**主要功能**:
- 📖 Library - 書籍瀏覽與搜尋
- ✨ For You - AI 個性化推薦
- 🎙️ Podcasts - TTS 語音生成
- 💬 Chat Rooms - 討論室
- 👤 Profile - 個人資料管理
- ⚙️ Settings - 深色模式、字體大小

### Backend API (FastAPI)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r <(poetry export --without-hashes)
uvicorn app.main:app --reload
```

API 文檔: `http://127.0.0.1:8000/docs`

---

## 📁 專案結構

```
modernreader/
├── web/                    # Next.js 16 主應用 (1.0GB)
│   ├── app/               # App Router
│   │   ├── api/          # API Routes
│   │   ├── books/        # 書籍頁面
│   │   ├── for-you/      # 個性化推薦
│   │   ├── podcasts/     # Podcast 生成
│   │   └── ...
│   ├── components/        # React 組件
│   ├── lib/              # 工具函式
│   └── types/            # TypeScript 類型
│
├── backend/               # FastAPI 服務 (15MB)
│   ├── app/
│   │   ├── api/          # API 端點
│   │   ├── services/     # 業務邏輯
│   │   └── models/       # 資料模型
│   └── scripts/          # 工具腳本
│
├── docs/                  # 📚 文檔
│   ├── research/         # 研究報告
│   ├── setup/            # 設定指南
│   ├── deployment/       # 部署文檔
│   └── features/         # 功能說明
│
├── data/                  # 語料庫
├── clients/               # Apple 客戶端
├── scripts/               # 工具腳本
└── ops/                   # 部署配置
```

---

## 🔧 環境設定

### 必要的環境變數

在 `web/.env.local` 中設定：

```bash
# OpenAI (推薦、TTS、圖片生成)
OPENAI_API_KEY=your_openai_key

# Hugging Face (免費替代方案)
HUGGINGFACE_API_KEY=your_hf_key

# NextAuth (認證)
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (可選)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

詳細設定請參考 [`docs/setup/`](docs/setup/)

---

## ✨ 主要功能

### 1. AI 個性化推薦
- 基於職業、興趣、閱讀目標
- 顯示匹配分數和推薦理由
- 真實書籍封面和資訊

### 2. Podcast 生成
- 8 種聲音風格 (Elder, Youth, Teacher, etc.)
- OpenAI TTS 高品質語音
- ISBN 書籍 Podcast 生成器

### 3. AI 聊天伴侶
- 10+ 種內建人格 (Wise Elder, Teacher, Poet, etc.)
- 自定義 AI 助手 (自訂名稱、Emoji、Prompt)
- 情緒感知對話

### 4. 多模態閱讀
- Sweet 流程 (See-Watch-Experience-Enjoy-Tell)
- 觸覺回饋模擬
- 語音命令控制

### 5. 社群功能
- 聊天室討論
- 分享到 Twitter/LINE/Instagram
- 閱讀進度追蹤

---

## 📖 文檔

- 📋 [研究報告](docs/research/研究報告.md) - 完整研究計畫
- 🚀 [快速開始](docs/setup/QUICK_START.md) - 快速上手指南
- 🔧 [環境設定](docs/setup/ENV_SETUP.md) - 環境變數配置
- 🤖 [HuggingFace 設定](docs/setup/HUGGINGFACE_SETUP.md) - 免費 AI 服務
- 🔐 [OAuth 設定](docs/setup/OAUTH_SETUP_GUIDE.md) - Google 登入
- 🚢 [部署安全](docs/deployment/DEPLOYMENT_SECURITY.md) - 生產環境部署
- ✨ [功能說明](docs/features/) - 詳細功能文檔

---

## 🛠️ 技術棧

### Frontend (Web)
- **Framework**: Next.js 16 (App Router + Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, clsx, tailwind-merge
- **UI**: Lucide Icons, Framer Motion, Radix UI (Primitives)
- **Auth**: NextAuth.js (with Middleware protection)
- **Testing**: Jest, React Testing Library

### Testing

Run the test suite:

```bash
npm test
```

### Backend
- **Framework**: FastAPI (Python)
- **Database**: SQLite (SQLAlchemy ORM)
- **AI**: OpenAI, Hugging Face
- **TTS**: OpenAI TTS, Azure Speech (optional)

### APIs
- **AI**: OpenAI GPT-4o-mini, Hugging Face
- **Books**: Open Library API
- **Translation**: NLLB-200 (Hugging Face)
- **Images**: DALL-E 3

---

## 🎨 特色

### 設計理念
- 🌙 深色模式支援
- 📱 響應式設計
- ♿ 無障礙友善
- 🎨 現代美學

### 效能優化
- ⚡ Turbopack 快速編譯
- 🔄 無限滾動載入
- 💾 localStorage 資料持久化
- 🎯 智能去重邏輯

---

## 🤝 貢獻

歡迎貢獻！請遵循以下原則：
- 社群共同設計
- 倫理保護優先
- 文化敏感度
- 無障礙考量

---

## 📝 授權

研究專案 - 南臺科技大學

---

## 🔗 相關連結

- [Open Library API](https://openlibrary.org/developers/api)
- [OpenAI Platform](https://platform.openai.com/)
- [Hugging Face](https://huggingface.co/)
- [Next.js Documentation](https://nextjs.org/docs)

---

## 📧 聯絡

如有問題或建議，請開 Issue 或聯絡專案團隊。

---

**Built with ❤️ for modern readers**
