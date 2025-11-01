# ModernReader - Production CI/CD Guide

## 概述

本指南說明 ModernReader 的完整 CI/CD Pipeline 設置和使用方法。

## 架構

### GitHub Actions Workflow

位於 `.github/workflows/ci-cd.yml`，包含以下階段:

**Backend Pipeline:**
- `backend-lint`: Ruff 代碼檢查
- `backend-type-check`: MyPy 類型檢查
- `backend-security`: Bandit + Safety 安全掃描
- `backend-build`: 執行測試 + 覆蓋率報告
- `backend-docker`: 構建和推送 Docker 映像

**Frontend Pipeline:**
- `frontend-lint`: ESLint 代碼檢查
- `frontend-type-check`: TypeScript 類型檢查
- `frontend-build`: Vite 構建
- `frontend-docker`: 構建和推送 Docker 映像

**Deployment:**
- `deploy-staging`: 自動部署到 Staging (develop 分支)
- `deploy-production`: 自動部署到 Production (main 分支 + tags)
- `notify`: Slack 通知

## 所需配置

### 1. GitHub Secrets

在 GitHub Repository Settings > Secrets and variables > Actions 中添加:

```bash
# Required Secrets
GITHUB_TOKEN                 # 自動提供 (不需手動設置)
CODECOV_TOKEN               # 從 codecov.io 獲取
SLACK_WEBHOOK_URL           # Slack Incoming Webhook URL

# Optional (如使用 Kubernetes)
KUBE_CONFIG                 # Base64 編碼的 kubeconfig
DOCKER_REGISTRY_TOKEN       # GHCR token (通常使用 GITHUB_TOKEN)
```

### 2. 獲取 Codecov Token

1. 訪問 https://codecov.io
2. 使用 GitHub 帳號登入
3. 添加你的 repository
4. 複製 Upload Token
5. 在 GitHub Secrets 中添加為 `CODECOV_TOKEN`

### 3. 設置 Slack 通知

1. 在 Slack workspace 中創建 Incoming Webhook:
   - 訪問 https://api.slack.com/apps
   - 創建新 App 或選擇現有 App
   - 啟用 Incoming Webhooks
   - 添加 New Webhook to Workspace
   - 選擇要發送通知的頻道
2. 複製 Webhook URL
3. 在 GitHub Secrets 中添加為 `SLACK_WEBHOOK_URL`

### 4. 配置容器註冊表 (GHCR)

GitHub Container Registry (ghcr.io) 已自動配置，使用 `GITHUB_TOKEN`。

如需手動推送:

```bash
# 登入 GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# 構建和推送
docker build -t ghcr.io/your-org/modernreader-backend:latest ./backend
docker push ghcr.io/your-org/modernreader-backend:latest
```

## 工作流程

### 開發流程

```bash
# 1. 創建功能分支
git checkout -b feature/new-feature

# 2. 開發並提交
git add .
git commit -m "feat: add new feature"

# 3. 推送到 GitHub
git push origin feature/new-feature

# 4. 創建 Pull Request
# GitHub Actions 會自動運行:
# - Lint checks
# - Type checks
# - Security scans
# - Tests with coverage
# - Docker builds
```

### Staging 部署

```bash
# 1. 合併到 develop 分支
git checkout develop
git merge feature/new-feature
git push origin develop

# 2. GitHub Actions 自動:
# - 運行所有檢查和測試
# - 構建 Docker 映像
# - 標記為 staging-{commit-sha}
# - 推送到 GHCR
# - 部署到 Staging 環境 (如已配置)
```

### Production 部署

```bash
# 1. 創建 Release Tag
git checkout main
git merge develop
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin main --tags

# 2. GitHub Actions 自動:
# - 運行完整測試套件
# - 構建 Docker 映像
# - 標記為 v1.0.0 和 latest
# - 推送到 GHCR
# - 部署到 Production 環境 (如已配置)
# - 創建 GitHub Release
# - 發送 Slack 通知
```

## Kubernetes 部署

### 前置需求

```bash
# 安裝 kubectl
brew install kubectl

# 配置 kubeconfig
export KUBECONFIG=~/.kube/config

# 驗證連接
kubectl cluster-info
```

### 部署到 Staging

```bash
cd ops/deployment
chmod +x deploy-staging.sh
./deploy-staging.sh develop

# 或指定特定 commit
./deploy-staging.sh feature/new-feature
```

### 部署到 Production

```bash
cd ops/deployment
chmod +x deploy-production.sh
./deploy-production.sh v1.0.0

# 或使用最新 tag
./deploy-production.sh
```

### Rollback

```bash
cd ops/deployment
chmod +x rollback.sh

# Rollback production to previous version
./rollback.sh production

# Rollback staging to specific revision
./rollback.sh staging 3
```

## Kubernetes 資源

### 手動部署

```bash
# 創建 namespace
kubectl create namespace modernreader

# 創建 secrets
kubectl create secret generic api-keys \
  --from-literal=OPENAI_API_KEY="your-key" \
  --from-literal=ANTHROPIC_API_KEY="your-key" \
  --from-literal=GOOGLE_API_KEY="your-key" \
  --from-literal=SECRET_KEY="your-jwt-secret" \
  -n modernreader

# 部署應用
kubectl apply -f ops/deployment/kubernetes.yml

# 查看狀態
kubectl get all -n modernreader
kubectl get ingress -n modernreader
```

### 監控部署

```bash
# 查看 Pods
kubectl get pods -n modernreader

# 查看日誌
kubectl logs -f deployment/backend -n modernreader
kubectl logs -f deployment/frontend -n modernreader

# 查看 HPA 狀態
kubectl get hpa -n modernreader

# 查看 Events
kubectl get events -n modernreader --sort-by='.lastTimestamp'
```

### 擴展部署

```bash
# 手動擴展
kubectl scale deployment backend --replicas=5 -n modernreader

# 查看自動擴展狀態
kubectl describe hpa backend-hpa -n modernreader
```

## 本地測試

### 測試 Docker 構建

```bash
# Backend
docker build -t modernreader-backend:test ./backend
docker run -p 8001:8001 modernreader-backend:test

# Frontend
docker build -t modernreader-frontend:test ./frontend
docker run -p 80:80 modernreader-frontend:test
```

### 測試 Docker Compose

```bash
# 啟動完整堆疊
docker-compose up --build

# 驗證服務
curl http://localhost:8001/health  # Backend
curl http://localhost/              # Frontend
```

### 運行 CI 檢查

```bash
# Backend lint
cd backend
poetry run ruff check .
poetry run mypy .

# Backend tests
poetry run pytest --cov=app --cov-report=xml

# Frontend lint
cd frontend
npm run lint
npm run type-check

# Frontend build
npm run build
```

## 故障排除

### CI/CD 失敗

1. **Lint 失敗**:
   ```bash
   # Backend
   cd backend
   poetry run ruff check --fix .
   
   # Frontend
   cd frontend
   npm run lint -- --fix
   ```

2. **Type 檢查失敗**:
   ```bash
   # Backend
   poetry run mypy . --show-error-codes
   
   # Frontend
   npm run type-check
   ```

3. **測試失敗**:
   ```bash
   # Backend
   poetry run pytest -v
   
   # Frontend
   npm run test
   ```

4. **Docker 構建失敗**:
   ```bash
   # 檢查 Dockerfile
   docker build --no-cache -t test ./backend
   
   # 查看構建日誌
   docker build --progress=plain -t test ./backend
   ```

### Kubernetes 部署失敗

1. **Pods 啟動失敗**:
   ```bash
   kubectl describe pod <pod-name> -n modernreader
   kubectl logs <pod-name> -n modernreader
   ```

2. **ImagePullBackOff**:
   ```bash
   # 驗證映像存在
   docker pull ghcr.io/your-org/modernreader-backend:latest
   
   # 檢查 imagePullSecrets
   kubectl get secrets -n modernreader
   ```

3. **CrashLoopBackOff**:
   ```bash
   # 查看日誌
   kubectl logs <pod-name> -n modernreader --previous
   
   # 檢查配置
   kubectl get configmap backend-config -n modernreader -o yaml
   kubectl get secret api-keys -n modernreader -o yaml
   ```

4. **Ingress 不工作**:
   ```bash
   # 檢查 Ingress 狀態
   kubectl describe ingress modernreader-ingress -n modernreader
   
   # 檢查 Ingress Controller
   kubectl get pods -n ingress-nginx
   ```

## Badge 添加

在 `README.md` 中添加狀態徽章:

```markdown
![CI/CD](https://github.com/your-org/modernreader/workflows/CI%2FCD%20Pipeline/badge.svg)
![codecov](https://codecov.io/gh/your-org/modernreader/branch/main/graph/badge.svg)
```

## 最佳實踐

### 分支策略

- `main`: 生產環境，僅接受來自 develop 的合併
- `develop`: 開發環境，功能分支合併到此
- `feature/*`: 功能開發分支
- `hotfix/*`: 緊急修復分支

### 提交規範

遵循 Conventional Commits:

```bash
feat: 新功能
fix: 錯誤修復
docs: 文檔更新
style: 代碼格式化
refactor: 代碼重構
test: 測試相關
chore: 構建/工具相關
```

### 版本標記

使用語義化版本 (Semantic Versioning):

```bash
v1.0.0  # Major.Minor.Patch
v1.1.0  # 新功能
v1.1.1  # 修復
v2.0.0  # Breaking changes
```

### 安全檢查

定期運行安全掃描:

```bash
# Backend
poetry run bandit -r app/
poetry run safety check

# Frontend
npm audit
npm audit fix
```

## 擴展配置

### 添加環境變量

1. 在 Kubernetes ConfigMap 中添加:
   ```yaml
   data:
     NEW_VAR: "value"
   ```

2. 在 Deployment 中引用:
   ```yaml
   env:
   - name: NEW_VAR
     valueFrom:
       configMapKeyRef:
         name: backend-config
         key: NEW_VAR
   ```

### 添加新的部署環境

複製並修改 `deploy-staging.sh`:

```bash
cp ops/deployment/deploy-staging.sh ops/deployment/deploy-qa.sh
# 修改 NAMESPACE 和其他參數
```

### 自定義通知

修改 `.github/workflows/ci-cd.yml` 中的 notify job:

```yaml
- name: Send notification
  run: |
    curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
      -H 'Content-Type: application/json' \
      -d '{"text":"Custom notification message"}'
```

## 監控和日誌

### 添加 APM

集成 Application Performance Monitoring:

```python
# backend/app/main.py
from opentelemetry import trace
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

FastAPIInstrumentor.instrument_app(app)
```

### 日誌聚合

使用 ELK Stack 或 Loki:

```bash
# 安裝 Loki
kubectl apply -f https://raw.githubusercontent.com/grafana/loki/main/production/ksonnet/loki/loki.yaml

# 配置 Promtail
kubectl apply -f ops/monitoring/promtail.yaml
```

## 下一步

1. ✅ CI/CD Pipeline 已配置
2. ✅ Kubernetes 部署清單已創建
3. ✅ 部署腳本已準備
4. 🔄 配置 Kubernetes 集群
5. 🔄 設置 Ingress Controller
6. 🔄 配置 SSL/TLS 證書
7. 🔄 設置監控和日誌
8. 🔄 配置備份策略

## 相關文檔

- [Deployment Stack](ops/deployment/STACK.md)
- [Observability](ops/monitoring/OBSERVABILITY.md)
- [Compliance](ops/compliance/CARE_CHECKLIST.md)
- [Module 5: NLLB-200](docs/MODULE_5_NLLB_INTEGRATION.md) (下下週)

## 支持

如有問題，請:
1. 查看 GitHub Actions 日誌
2. 檢查 Kubernetes Events
3. 查看應用日誌
4. 提交 Issue 到 GitHub
