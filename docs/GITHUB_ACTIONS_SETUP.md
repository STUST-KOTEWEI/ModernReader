# GitHub Actions CI/CD 配置指南

## 📋 概述

本指南幫助你配置 ModernReader 的 GitHub Actions CI/CD Pipeline，實現自動化測試、構建和部署。

---

## 🔑 步驟 1: 配置 GitHub Secrets

### 必需的 Secrets

在 GitHub Repository Settings > Secrets and variables > Actions 中添加以下 secrets:

#### 1. CODECOV_TOKEN (可選但推薦)

**用途**: 上傳代碼覆蓋率報告到 Codecov

**獲取方法**:
1. 訪問 [codecov.io](https://codecov.io)
2. 使用 GitHub 帳號登入
3. 點擊 "Add new repository"
4. 選擇你的 `modernreader` repository
5. 複製顯示的 **Upload Token**
6. 在 GitHub repo 添加 Secret:
   - Name: `CODECOV_TOKEN`
   - Value: 你複製的 token

**截圖參考**:
```
Codecov Dashboard → Repository Settings → Upload Token
```

#### 2. SLACK_WEBHOOK_URL (可選)

**用途**: 發送部署通知到 Slack

**獲取方法**:
1. 訪問 [Slack API](https://api.slack.com/apps)
2. 創建新 App 或選擇現有 App
3. 啟用 "Incoming Webhooks"
4. 點擊 "Add New Webhook to Workspace"
5. 選擇要發送通知的頻道
6. 複製生成的 Webhook URL
7. 在 GitHub repo 添加 Secret:
   - Name: `SLACK_WEBHOOK_URL`
   - Value: 複製的 webhook URL

**Webhook URL 格式**:
```
https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

### 可選的 Secrets

#### 3. GHCR Token (通常不需要)

GitHub Actions 自動提供 `GITHUB_TOKEN`，通常足夠使用。

如需手動配置:
1. GitHub Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. 選擇權限: `write:packages`, `read:packages`
4. 複製 token
5. 添加為 Secret: `GHCR_TOKEN`

---

## 🧪 步驟 2: 測試 CI/CD Pipeline

### 2.1 本地測試 Docker 構建

在推送到 GitHub 前，先在本地測試 Docker 構建:

```bash
# 測試後端 Docker 構建
cd backend
docker build -t modernreader-backend:test .

# 測試前端 Docker 構建
cd ../frontend
docker build -t modernreader-frontend:test .

# 測試 Docker Compose
cd ..
docker-compose build
```

**預期結果**: 所有構建成功，無錯誤

### 2.2 初始化 Git Repository (如果還沒有)

```bash
# 初始化 Git (如果需要)
git init

# 添加遠程倉庫
git remote add origin https://github.com/your-username/modernreader.git

# 檢查狀態
git status
```

### 2.3 創建並推送到 develop 分支

```bash
# 添加所有文件
git add .

# 提交
git commit -m "feat: complete CI/CD pipeline setup"

# 創建 develop 分支
git checkout -b develop

# 推送到 GitHub
git push -u origin develop
```

### 2.4 觀察 GitHub Actions 運行

1. 訪問你的 GitHub repository
2. 點擊 "Actions" 標籤
3. 你應該看到 "CI/CD Pipeline" workflow 開始運行
4. 點擊查看詳細日誌

**預期的 Jobs**:
- ✅ Backend Lint & Type Check
- ✅ Backend Security Scan
- ✅ Backend Build & Test
- ✅ Backend Docker Build
- ✅ Frontend Lint & Type Check
- ✅ Frontend Build
- ✅ Frontend Docker Build

---

## 📊 步驟 3: 驗證 CI/CD 功能

### 3.1 檢查 Lint Jobs

**Backend Lint**:
- Ruff 代碼檢查
- MyPy 類型檢查

**Frontend Lint**:
- ESLint 代碼檢查
- TypeScript 類型檢查

**如何查看結果**:
```
GitHub Actions → CI/CD Pipeline → backend-lint/frontend-lint
```

### 3.2 檢查 Security Scan

**Backend Security**:
- Bandit (Python 安全掃描)
- Safety (依賴漏洞檢查)

**查看安全報告**:
```
GitHub Actions → CI/CD Pipeline → backend-security
→ Download artifacts → security-reports.zip
```

### 3.3 檢查測試與覆蓋率

**Backend Tests**:
```
GitHub Actions → backend-build → Test Results
```

**覆蓋率報告** (如已配置 CODECOV_TOKEN):
1. 訪問 [codecov.io](https://codecov.io)
2. 查看你的 repository
3. 查看覆蓋率趨勢和報告

### 3.4 檢查 Docker Images

**查看構建的 Images**:
1. 訪問 `https://github.com/your-username/modernreader/pkgs/container/modernreader-backend`
2. 你應該看到新推送的 images
3. 標籤格式: `develop-{commit-sha}`

---

## 🚀 步驟 4: 測試自動部署 (可選)

### 4.1 配置 Kubernetes Secrets (如已設置集群)

```bash
# 設置 Kubernetes 配置
kubectl create secret generic github-actions-kubeconfig \
  --from-file=config=$HOME/.kube/config

# Base64 編碼
cat $HOME/.kube/config | base64

# 添加到 GitHub Secrets
# Name: KUBE_CONFIG
# Value: <base64 output>
```

### 4.2 推送到 main 分支觸發 Production 部署

```bash
# 合併 develop 到 main
git checkout main
git merge develop

# 創建版本標籤
git tag -a v1.0.0 -m "Release v1.0.0"

# 推送
git push origin main --tags
```

**這將觸發**:
- ✅ 完整的 CI pipeline
- ✅ Docker images 構建 (tagged as v1.0.0 + latest)
- ✅ Production 部署 (如已配置)
- ✅ GitHub Release 創建
- ✅ Slack 通知 (如已配置)

---

## ✅ 步驟 5: 驗證清單

使用以下清單驗證 CI/CD 配置:

### GitHub Actions 配置

- [ ] `.github/workflows/ci-cd.yml` 文件存在
- [ ] Workflow 在 GitHub Actions 頁面可見
- [ ] 推送代碼後自動觸發

### Secrets 配置

- [ ] CODECOV_TOKEN 已添加 (可選)
- [ ] SLACK_WEBHOOK_URL 已添加 (可選)
- [ ] KUBE_CONFIG 已添加 (如需部署)

### CI Pipeline

- [ ] Backend lint 通過
- [ ] Frontend lint 通過
- [ ] Backend tests 通過
- [ ] Frontend build 成功
- [ ] Security scan 完成
- [ ] 覆蓋率報告上傳 (如已配置)

### Docker Images

- [ ] Backend image 構建成功
- [ ] Frontend image 構建成功
- [ ] Images 推送到 GHCR
- [ ] Image tags 正確 (develop-sha, v1.0.0, latest)

### Deployment (可選)

- [ ] Staging 自動部署 (develop 分支)
- [ ] Production 需手動批准
- [ ] 部署後健康檢查通過
- [ ] Slack 通知收到

---

## 🔧 步驟 6: 本地測試工具

### 6.1 測試腳本

創建本地測試腳本來模擬 CI 環境:

```bash
# 創建測試腳本
cat > scripts/test-ci-locally.sh << 'EOF'
#!/bin/bash

echo "=== Running CI Tests Locally ==="

# Backend Tests
echo "→ Backend Lint..."
cd backend
poetry run ruff check .
poetry run mypy .

echo "→ Backend Security..."
poetry run bandit -r app/
poetry run safety check

echo "→ Backend Tests..."
poetry run pytest --cov=app --cov-report=xml

# Frontend Tests
echo "→ Frontend Lint..."
cd ../frontend
npm run lint
npm run type-check

echo "→ Frontend Build..."
npm run build

echo "✅ All local CI tests passed!"
EOF

chmod +x scripts/test-ci-locally.sh
```

**使用方法**:
```bash
./scripts/test-ci-locally.sh
```

### 6.2 Docker 測試腳本

```bash
# 創建 Docker 測試腳本
cat > scripts/test-docker-locally.sh << 'EOF'
#!/bin/bash

echo "=== Testing Docker Builds ==="

# Backend
echo "→ Building backend..."
docker build -t test-backend:local ./backend

# Frontend
echo "→ Building frontend..."
docker build -t test-frontend:local ./frontend

# Docker Compose
echo "→ Testing docker-compose..."
docker-compose build

echo "✅ All Docker builds successful!"
EOF

chmod +x scripts/test-docker-locally.sh
```

---

## 📈 步驟 7: 監控 CI/CD

### 7.1 添加 Status Badge

在 `README.md` 中添加狀態徽章:

```markdown
# ModernReader

![CI/CD](https://github.com/your-username/modernreader/workflows/CI%2FCD%20Pipeline/badge.svg)
![codecov](https://codecov.io/gh/your-username/modernreader/branch/main/graph/badge.svg)
```

### 7.2 設置通知

**GitHub Notifications**:
1. Repository Settings → Notifications
2. 勾選 "Actions" notifications

**Email Alerts**:
- GitHub 會自動發送失敗通知到你的郵箱

**Slack Alerts** (如已配置):
- 每次部署成功/失敗都會收到通知

---

## 🐛 故障排除

### 問題 1: Backend Lint 失敗

**錯誤**: Ruff 或 MyPy 報錯

**解決**:
```bash
cd backend
poetry run ruff check --fix .
poetry run mypy . --show-error-codes
```

### 問題 2: Docker Build 失敗

**錯誤**: 無法構建 Docker image

**解決**:
```bash
# 查看詳細錯誤
docker build --no-cache --progress=plain -t test ./backend

# 檢查 Dockerfile
cat backend/Dockerfile

# 確保所有文件存在
ls -la backend/
```

### 問題 3: 權限錯誤 (GHCR)

**錯誤**: "denied: permission_denied"

**解決**:
1. 確認 repository 是 public 或你有權限
2. 檢查 GITHUB_TOKEN 權限
3. Repository Settings → Actions → General → Workflow permissions
4. 選擇 "Read and write permissions"

### 問題 4: Tests 失敗

**錯誤**: Pytest 或 npm test 失敗

**解決**:
```bash
# 本地運行測試
cd backend
poetry run pytest -v

cd ../frontend
npm run test
```

### 問題 5: Codecov Upload 失敗

**錯誤**: "Could not upload coverage"

**解決**:
1. 確認 CODECOV_TOKEN 已正確添加
2. 檢查 token 是否過期
3. 在 Codecov 網站重新生成 token

---

## 📚 相關資源

### GitHub Actions 文檔
- [GitHub Actions 官方文檔](https://docs.github.com/en/actions)
- [Workflow 語法](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)

### Docker Registry
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)

### 工具文檔
- [Codecov](https://docs.codecov.io)
- [Ruff](https://docs.astral.sh/ruff/)
- [MyPy](https://mypy.readthedocs.io/)
- [Bandit](https://bandit.readthedocs.io/)

---

## 🎯 下一步

完成 CI/CD 配置後:

1. ✅ CI/CD Pipeline 正常運行
2. 🔄 設置 Kubernetes 集群
3. 🔄 首次生產環境部署
4. 🔄 配置監控和日誌

---

## 📞 需要幫助?

- 查看 GitHub Actions 日誌
- 運行本地測試腳本
- 查看 [PRODUCTION_CICD_GUIDE.md](PRODUCTION_CICD_GUIDE.md)

**最後更新**: 2025年11月1日
