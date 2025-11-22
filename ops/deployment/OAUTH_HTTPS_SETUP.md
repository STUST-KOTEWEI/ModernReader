# OAuth HTTPS 設定指南

OAuth 提供商（Google、SheerID）要求使用 HTTPS callback URLs。本地開發需要建立 HTTPS 隧道。

## 選項 1：使用 ngrok（最快速）

### 1. 安裝 ngrok
```bash
# macOS
brew install ngrok

# 或從官網下載
# https://ngrok.com/download
```

### 2. 註冊並取得 authtoken
1. 訪問 https://dashboard.ngrok.com/signup
2. 複製你的 authtoken
3. 設定 authtoken：
```bash
ngrok config add-authtoken YOUR_TOKEN_HERE
```

### 3. 啟動 ngrok 隧道（免費版）
```bash
# 前端（React dev server）
ngrok http 5173

# 或使用自定義域名（付費版）
ngrok http 5173 --domain=modernreader-dev.ngrok-free.app
```

### 4. 更新環境變數
ngrok 會顯示類似：
```
Forwarding    https://abc123.ngrok-free.app -> http://localhost:5173
```

在 `backend/.env` 添加：
```bash
# OAuth 設定
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
OAUTH_REDIRECT_URL=https://abc123.ngrok-free.app/api/v1/auth/oauth/google/callback

SHEERID_CLIENT_ID=your_sheerid_client_id
SHEERID_CLIENT_SECRET=your_sheerid_client_secret
# SheerID callback: https://abc123.ngrok-free.app/api/v1/auth/oauth/sheerid/callback
```

### 5. 在 Google Cloud Console 設定
1. 訪問 https://console.cloud.google.com/apis/credentials
2. 建立 OAuth 2.0 Client ID
3. **Authorized redirect URIs** 添加：
   - `https://abc123.ngrok-free.app/api/v1/auth/oauth/google/callback`
4. 取得 Client ID 和 Client Secret

---

## 選項 2：使用 Cloudflare Tunnel（推薦用於長期開發）

### 1. 安裝 cloudflared
```bash
# macOS
brew install cloudflare/cloudflare/cloudflared

# 其他系統：https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
```

### 2. 登入 Cloudflare
```bash
cloudflared tunnel login
```

### 3. 建立隧道
```bash
# 建立命名隧道
cloudflared tunnel create modernreader-dev

# 建立配置檔案 ~/.cloudflared/config.yml
```

編輯 `~/.cloudflared/config.yml`：
```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /Users/YOUR_USERNAME/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: dev.modernreader.com
    service: http://localhost:5173
  - hostname: api-dev.modernreader.com
    service: http://localhost:8001
  - service: http_status:404
```

### 4. 設定 DNS
```bash
# 將自定義域名指向隧道
cloudflared tunnel route dns modernreader-dev dev.modernreader.com
cloudflared tunnel route dns modernreader-dev api-dev.modernreader.com
```

### 5. 啟動隧道
```bash
cloudflared tunnel run modernreader-dev
```

### 6. 更新環境變數
在 `backend/.env`：
```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
OAUTH_REDIRECT_URL=https://dev.modernreader.com/api/v1/auth/oauth/google/callback

SHEERID_CLIENT_ID=your_sheerid_client_id
SHEERID_CLIENT_SECRET=your_sheerid_client_secret
```

---

## 選項 3：使用自簽名憑證（不推薦）

OAuth 提供商通常不接受自簽名憑證，僅用於內部測試。

```bash
# 生成自簽名憑證
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Vite 配置
# vite.config.ts
import { defineConfig } from 'vite'
import fs from 'fs'

export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync('./key.pem'),
      cert: fs.readFileSync('./cert.pem')
    },
    port: 5173
  }
})
```

---

## 前端自動檢測 HTTPS

目前 `LoginPage.tsx` 已實作自動檢測：

```tsx
const oauthBaseUrl = isLocalhost
  ? "http://localhost:8001/api/v1/auth/oauth"  // 本地 HTTP（需改為 ngrok HTTPS）
  : `${window.location.protocol}//${window.location.host}/api/v1/auth/oauth`;  // 生產環境 HTTPS
```

**建議修改**：使用環境變數控制 OAuth base URL

在 `frontend/.env.local`：
```bash
VITE_OAUTH_BASE_URL=https://abc123.ngrok-free.app/api/v1/auth/oauth
```

在 `LoginPage.tsx`：
```tsx
const oauthBaseUrl = import.meta.env.VITE_OAUTH_BASE_URL || 
  `${window.location.protocol}//${window.location.host}/api/v1/auth/oauth`;
```

---

## 完整開發流程

### 1. 啟動後端
```bash
cd backend
uvicorn app.main:app --reload --port 8001
```

### 2. 啟動前端
```bash
cd frontend
npm run dev
```

### 3. 啟動 ngrok 隧道
```bash
# Terminal 3
ngrok http 5173
```

### 4. 更新 OAuth redirect URLs
在 Google Cloud Console 和 SheerID 後台更新 redirect URIs 為 ngrok HTTPS URL。

### 5. 測試 OAuth 流程
訪問 `https://abc123.ngrok-free.app`，點擊 "Sign in with Google"。

---

## 常見問題

### Q: ngrok 免費版 URL 每次重啟都會改變？
**A**: 是的。付費版可以使用固定域名（$8/月）。或使用 Cloudflare Tunnel（免費且支持自定義域名）。

### Q: Safari 顯示「無法連接伺服器」？
**A**: 這是因為 OAuth endpoint 返回 501 錯誤。確保：
1. 後端環境變數已設定（`GOOGLE_CLIENT_ID` 等）
2. OAuth endpoint 已實作（目前是 stub）
3. 使用 HTTPS URL（ngrok/Cloudflare）

### Q: 如何實作完整的 Google OAuth？
**A**: 參考 `backend/app/api/v1/auth.py`，需要：
1. 安裝 `authlib` 或 `google-auth-oauthlib`
2. 實作 `/oauth/google/start`：重定向到 Google 授權頁面
3. 實作 `/oauth/google/callback`：接收 authorization code，交換 access token，創建用戶 session
4. 返回 JWT token 給前端

---

## 生產環境部署

生產環境使用 Kubernetes Ingress + cert-manager 自動管理 Let's Encrypt 憑證：

```yaml
# ops/deployment/kubernetes.yml 已配置
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: modernreader-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
    - hosts:
        - modernreader.com
        - www.modernreader.com
      secretName: modernreader-tls
```

OAuth callback URLs 使用生產域名：
```
https://modernreader.com/api/v1/auth/oauth/google/callback
https://modernreader.com/api/v1/auth/oauth/sheerid/callback
```
