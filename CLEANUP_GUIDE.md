# 🧹 專案清理完成指南

## 執行清理

```bash
cd /Users/kedewei/modernreader
./cleanup.sh
```

## 清理內容

### ✅ 已刪除的文件類型

#### 1. 測試文件
```
backend/test_*.py                    # 所有根目錄測試文件
backend/tests/test_*.py              # tests 目錄中的測試文件
```

#### 2. 測試數據
```
backend/test_chroma_db/              # 測試用 ChromaDB
backend/test_vectors/                # 測試用向量庫
backend/modernreader.db              # 開發用數據庫
backend/chroma_db/*                  # 清空 ChromaDB（保留目錄）
backend/vectors/*                    # 清空向量庫（保留目錄）
```

#### 3. ngrok 相關文件
```
NGROK_TOKEN_GUIDE.md
QUICK_START_WITH_NGROK.md
QUICK_START_PUBLIC_URL.md
PUBLIC_URL_GUIDE.md
scripts/setup_public_url.py
scripts/start_with_public_url.sh
start.sh                             # 已更新，移除 ngrok 代碼
```

#### 4. 環境變數文件（個資）
```
backend/.env
frontend/.env
frontend/.env.local
```

#### 5. Python 緩存
```
**/__pycache__/                      # 所有 Python 緩存目錄
**/*.pyc                             # 所有編譯後的 Python 文件
backend/.pytest_cache/               # pytest 緩存
backend/.mypy_cache/                 # mypy 類型檢查緩存
```

#### 6. 前端緩存和構建產物
```
frontend/dist/                       # 構建產物
frontend/.vite/                      # Vite 緩存
# frontend/node_modules/             # 可選（未刪除）
```

#### 7. 臨時文件
```
/tmp/modernreader-backend.log
/tmp/modernreader-frontend.log
/tmp/ngrok-backend.log
```

### ✅ 已創建的文件

#### 環境變數模板
```
backend/.env.example                 # 後端環境變數模板
frontend/.env.example                # 前端環境變數模板
```

#### 更新的啟動腳本
```
start.sh                             # 簡化版（無 ngrok）
```

#### Git 忽略文件
```
.gitignore                           # 完整的 gitignore 規則
```

---

## 清理後的項目結構

```
modernreader/
├── backend/
│   ├── app/                         # ✅ 保留：應用代碼
│   │   ├── api/                     # API 路由
│   │   ├── core/                    # 核心配置
│   │   ├── models/                  # 數據模型
│   │   ├── schemas/                 # Pydantic schemas
│   │   ├── services/                # 業務邏輯
│   │   └── utils/                   # 工具函數
│   ├── scripts/                     # ✅ 保留：初始化腳本
│   ├── tests/                       # ✅ 保留：tests 目錄結構
│   │   └── __init__.py              # （測試文件已刪除）
│   ├── chroma_db/                   # ✅ 保留：目錄結構（已清空）
│   ├── vectors/                     # ✅ 保留：目錄結構（已清空）
│   ├── .env.example                 # ✅ 新增：環境變數模板
│   ├── Dockerfile                   # ✅ 保留
│   ├── pyproject.toml               # ✅ 保留
│   ├── poetry.lock                  # ✅ 保留
│   └── README.md                    # ✅ 保留
│
├── frontend/
│   ├── src/                         # ✅ 保留：源代碼
│   │   ├── components/              # React 組件
│   │   ├── pages/                   # 頁面組件
│   │   ├── services/                # API 服務
│   │   ├── design-system/           # 設計系統
│   │   ├── hooks/                   # React Hooks
│   │   ├── i18n/                    # 國際化
│   │   ├── state/                   # 狀態管理
│   │   └── styles/                  # 樣式文件
│   ├── public/                      # ✅ 保留：靜態資源
│   ├── .env.example                 # ✅ 新增：環境變數模板
│   ├── Dockerfile                   # ✅ 保留
│   ├── package.json                 # ✅ 保留
│   ├── tsconfig.json                # ✅ 保留
│   ├── vite.config.ts               # ✅ 保留
│   └── index.html                   # ✅ 保留
│
├── clients/                         # ✅ 保留：客戶端
│   └── apple/                       # iOS 客戶端
│
├── docs/                            # ✅ 保留：文檔
│   ├── MODULE_*.md                  # 各模組文檔
│
├── ops/                             # ✅ 保留：運維配置
│   ├── deployment/
│   ├── monitoring/
│   └── compliance/
│
├── data/                            # ✅ 保留：數據目錄
│   ├── catalogs/
│   ├── ingestion/
│   └── processing/
│
├── scripts/                         # ✅ 保留：腳本目錄
│   └── (ngrok 腳本已刪除)
│
├── .gitignore                       # ✅ 新增/更新
├── cleanup.sh                       # ✅ 新增：清理腳本
├── start.sh                         # ✅ 更新：簡化版
├── docker-compose.yml               # ✅ 保留
├── README.md                        # ✅ 保留
├── DEPLOYMENT_GUIDE.md              # ✅ 保留
├── IMPLEMENTATION_BLUEPRINT.md      # ✅ 保留
├── GLOBAL_INDIGENOUS_LANGUAGES_*.md # ✅ 保留
└── 其他文檔 *.md                    # ✅ 保留
```

---

## 清理後的啟動流程

### 1. 設置環境變數

```bash
# 後端
cp backend/.env.example backend/.env
# 編輯 backend/.env，填入真實的 API keys

# 前端（可選，使用默認值）
cp frontend/.env.example frontend/.env.local
```

### 2. 啟動系統

```bash
# 使用簡化的啟動腳本（無 ngrok）
./start.sh
```

### 3. 訪問應用

```
前端: http://localhost:5173
後端: http://localhost:8000
API 文檔: http://localhost:8000/docs
```

---

## 環境變數配置

### backend/.env

```bash
# 複製模板
cp backend/.env.example backend/.env

# 編輯並填入真實值
nano backend/.env
```

**必填項目:**
- `OPENAI_API_KEY`: OpenAI API key（用於 LLM 功能）
- `SECRET_KEY`: JWT 加密密鑰（可用 `openssl rand -hex 32` 生成）

**可選項目:**
- `DATABASE_URL`: 數據庫連接（默認 SQLite）
- `USE_MOCK_LLM`: 是否使用 mock LLM（開發時可設為 true）
- `USE_MOCK_EMBEDDINGS`: 是否使用 mock embeddings

### frontend/.env.local

```bash
# 複製模板（可選）
cp frontend/.env.example frontend/.env.local

# 默認配置已足夠，無需修改
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## 部署準備

### 1. 生產環境配置

**後端:**
```bash
# 設置生產環境變數
export USE_MOCK_LLM=false
export USE_MOCK_EMBEDDINGS=false
export DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

**前端:**
```bash
# 構建生產版本
cd frontend
npm run build

# dist/ 目錄可部署到任何靜態服務器
```

### 2. Docker 部署

```bash
# 使用 docker-compose
docker-compose up -d

# 或單獨構建
docker build -t modernreader-backend ./backend
docker build -t modernreader-frontend ./frontend
```

### 3. 雲端部署選項

**前端:**
- ✅ Vercel（推薦，一鍵部署）
- ✅ Netlify
- ✅ AWS S3 + CloudFront
- ✅ Azure Static Web Apps

**後端:**
- ✅ Railway
- ✅ Render
- ✅ AWS ECS
- ✅ Azure App Service
- ✅ Google Cloud Run

---

## Git 提交建議

```bash
# 查看清理結果
git status

# 添加有意義的更改
git add backend/app/
git add frontend/src/
git add docs/
git add *.md
git add .gitignore
git add backend/.env.example
git add frontend/.env.example
git add start.sh
git add docker-compose.yml

# 提交
git commit -m "🧹 清理專案：移除測試文件、ngrok相關和個資"

# 推送
git push origin main
```

---

## 移除的功能說明

### ❌ ngrok 公開網址功能

**移除原因:**
- 開發用，不適合生產環境
- 免費版限制多
- 需要外部服務註冊

**替代方案:**
- **本地開發**: 使用 `localhost`
- **測試分享**: 部署到 Vercel/Netlify（永久網址）
- **生產環境**: 使用真實域名 + SSL

### ❌ 測試文件

**移除原因:**
- 不需要在生產環境
- 減少專案體積
- 避免洩露測試數據

**如需測試:**
- 在開發分支保留測試文件
- 使用 CI/CD 自動化測試
- 測試代碼與生產代碼分離

---

## 常見問題

### Q: 為什麼要刪除 .env 文件？

A: `.env` 文件包含敏感信息（API keys, 密鑰等），不應該提交到 Git。使用 `.env.example` 作為模板，每個開發者創建自己的 `.env`。

### Q: 數據庫清空了怎麼辦？

A: 啟動系統時會自動初始化數據庫。如需預填數據，運行：
```bash
cd backend
poetry run python scripts/seed_catalog.py
```

### Q: 如何恢復測試功能？

A: 測試文件仍在 Git 歷史中，可以從舊 commit 恢復：
```bash
git checkout <commit-hash> -- backend/test_*.py
```

### Q: node_modules 要不要刪除？

A: 清理腳本默認保留 `node_modules`（避免重新安裝太久）。如需完全清理：
```bash
rm -rf frontend/node_modules
npm install  # 重新安裝
```

### Q: 如何部署到 Vercel？

A: 
```bash
cd frontend
npm install -g vercel
vercel

# 按照提示操作，會得到永久網址
```

---

## 下一步建議

1. ✅ **執行清理**: `./cleanup.sh`
2. ✅ **配置環境**: 創建並編輯 `.env` 文件
3. ✅ **測試啟動**: `./start.sh` 確保系統正常運行
4. ✅ **Git 提交**: 提交清理後的乾淨代碼
5. ✅ **部署前端**: 部署到 Vercel 獲得永久網址
6. ⏰ **等待實驗室**: 下下週整合 NLLB-200 模型

---

## 總結

### 刪除內容
- 🗑️ 測試文件（~10 個）
- 🗑️ ngrok 相關（~6 個文件）
- 🗑️ 測試數據庫和向量庫
- 🗑️ 環境變數文件（個資）
- 🗑️ Python/Node 緩存

### 保留內容
- ✅ 所有生產代碼
- ✅ 所有文檔
- ✅ Docker 配置
- ✅ 部署腳本
- ✅ 目錄結構

### 新增內容
- ✅ `.env.example` 模板
- ✅ 完整的 `.gitignore`
- ✅ 簡化的 `start.sh`
- ✅ 清理腳本 `cleanup.sh`

**專案現在乾淨、安全、可部署！** 🎉
