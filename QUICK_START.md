# ModernReader 開發環境使用指南

## 🚀 快速開始 (3 步驟)

### 1. 初始設置

```bash
# 運行自動設置腳本 (只需執行一次)
./scripts/setup.sh
```

這將自動完成:
- ✅ 檢查並安裝所需工具 (Poetry, Node.js等)
- ✅ 安裝前後端依賴
- ✅ 創建環境配置文件
- ✅ 初始化數據庫
- ✅ 創建必要目錄

### 2. 啟動服務

```bash
# 啟動開發服務器
./start.sh
```

服務將在以下地址啟動:
- 前端: <http://localhost:5173>
- 後端 API: <http://localhost:8001>
- API 文檔: <http://localhost:8001/docs>

### 3. 健康檢查

```bash
# 檢查所有服務狀態
./scripts/health-check.sh
```

## 📝 可用腳本說明

| 腳本 | 功能 | 使用時機 |
|------|------|----------|
| `./scripts/setup.sh` | 初始化開發環境 | 首次使用或重置環境 |
| `./start.sh` | 啟動開發服務器 | 每次開發時 |
| `./scripts/health-check.sh` | 健康檢查 | 診斷問題時 |
| `./cleanup.sh` | 清理測試文件 | 準備部署前 |

## 🛠 常用操作

### 停止服務

按 `Ctrl+C` 即可停止所有服務,腳本會自動清理。

### 查看日誌

```bash
# 後端日誌
tail -f /tmp/modernreader-backend.log

# 前端日誌
tail -f /tmp/modernreader-frontend.log
```

### 重新安裝依賴

```bash
# 後端
cd backend
rm -rf .venv
poetry install

# 前端
cd frontend
rm -rf node_modules
npm install
```

### 重置數據庫

```bash
cd backend
rm modernreader.db
poetry run python scripts/init_db.py
```

## 🐳 使用 Docker (可選)

```bash
# 啟動完整環境
docker-compose up --build

# 後台運行
docker-compose up -d

# 停止服務
docker-compose down
```

## 📚 更多文檔

- [PROJECT_STATUS.md](PROJECT_STATUS.md) - 完整項目狀態
- [PRODUCTION_CICD_GUIDE.md](PRODUCTION_CICD_GUIDE.md) - CI/CD 部署指南
- [CLEANUP_GUIDE.md](CLEANUP_GUIDE.md) - 清理指南

## ❓ 常見問題

### Q: Poetry 安裝失敗怎麼辦?

```bash
curl -sSL https://install.python-poetry.org | python3 -
export PATH="$HOME/.local/bin:$PATH"
```

### Q: 端口被占用怎麼辦?

```bash
# 查找占用端口的進程
lsof -ti:8001 -ti:5173

# 終止進程
kill -9 $(lsof -ti:8001)
```

### Q: 如何配置 API Keys?

編輯 `backend/.env` 文件:

```bash
OPENAI_API_KEY=your-key-here
ANTHROPIC_API_KEY=your-key-here
GOOGLE_API_KEY=your-key-here
```

## 🎯 下一步

1. ✅ 開發環境已就緒
2. 🔄 配置 CI/CD (添加 GitHub Secrets)
3. 🔄 部署到 Kubernetes
4. ⏰ 等待實驗室環境 (Module 5: NLLB-200)

---

**需要幫助?** 查看 [PROJECT_STATUS.md](PROJECT_STATUS.md) 獲取完整文檔。
