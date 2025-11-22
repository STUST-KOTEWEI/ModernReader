# Google OAuth 快速設定指南

你的 Cloudflare Quick Tunnel 已準備好：
**https://origin-brings-modes-happening.trycloudflare.com**

## 環境設定檔案已準備完成 ✅

### 後端 (`backend/.env`)
- ✅ OAUTH_REDIRECT_URL 已設定為你的 Quick Tunnel
- ⚠️ 需要填入: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

### 前端 (`frontend/.env.local`)  
- ✅ VITE_OAUTH_BASE_URL 已設定為你的 Quick Tunnel

---

## 步驟1：申請 Google OAuth 憑證

### 1.1 訪問 Google Cloud Console
```
https://console.cloud.google.com/apis/credentials
```

### 1.2 建立專案 (如果沒有)
- 點擊頂部專案選擇器 → "新增專案"
- 名稱: ModernReader Dev (或自訂)
- 點擊"建立"

### 1.3 啟用 OAuth 同意畫面
1. 左側選單 → APIs & Services → OAuth consent screen
2. User Type: External → "建立"
3. 填寫基本資訊:
   - App name: ModernReader
   - User support email: 你的 email
   - Developer contact email: 你的 email
4. Scopes: 保持預設（或添加 email, profile, openid）
5. Test users: 添加你的 Google 帳號 email（開發階段必須）
6. 儲存並繼續

### 1.4 建立 OAuth 2.0 Client ID
1. 左側選單 → Credentials
2. 點擊"+ CREATE CREDENTIALS" → "OAuth client ID"
3. Application type: **Web application**
4. Name: ModernReader Local Dev
5. **Authorized redirect URIs** → 點擊 "+ ADD URI"
   ```
   https://origin-brings-modes-happening.trycloudflare.com/api/v1/auth/oauth/google/callback
   ```
   ⚠️ 必須完全一致（大小寫、路徑都要相同）

6. 點擊"CREATE"
7. 複製顯示的 **Client ID** 和 **Client Secret**

---

## 步驟2：填入憑證到環境變數

### 編輯 `backend/.env`
找到這兩行並填入剛才複製的值：

```bash
GOOGLE_CLIENT_ID=你的_CLIENT_ID_貼在這裡
GOOGLE_CLIENT_SECRET=你的_CLIENT_SECRET_貼在這裡
```

儲存檔案。

---

## 步驟3：啟動服務

### 終端機1：啟動後端
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8001
```

看到 "Application startup complete" 表示成功。

### 終端機2：啟動前端  
```bash
cd frontend
npm install  # 第一次執行需要
npm run dev
```

看到 "Local: http://localhost:5173" 表示成功。

### 終端機3：保持 Quick Tunnel 運行
```bash
cloudflared tunnel --url http://localhost:5173
```

看到 `https://origin-brings-modes-happening.trycloudflare.com` 表示隧道正常。
**⚠️ 這個視窗不要關閉，隧道才能持續運作。**

---

## 步驟4：測試 OAuth 登入

### 4.1 開啟隧道網址
用瀏覽器訪問（不要用 localhost）：
```
https://origin-brings-modes-happening.trycloudflare.com
```

### 4.2 測試流程
1. 點擊首頁的「登入」按鈕
2. 點擊 "Sign in with Google" 按鈕
3. 應該會導向 Google 授權頁面
4. 選擇你的 Google 帳號（必須是在 Test users 列表中的帳號）
5. 同意授權
6. 自動回到首頁，顯示已登入狀態（右上角顯示你的 email）

### 4.3 預期結果
- ✅ 登入成功後，首頁顯示你的 email
- ✅ 可以訪問需要登入的頁面
- ✅ JWT token 儲存在 localStorage (key: `mr_jwt`)

---

## 常見問題排解

### Q1: Safari 顯示「無法連接伺服器」
**原因**: 後端沒有在 8001 port 運行。
**解法**: 確認終端機1的 uvicorn 沒有錯誤訊息，應該看到 "Uvicorn running on http://0.0.0.0:8001"

### Q2: Google 回傳「redirect_uri_mismatch」錯誤
**原因**: Google Console 的 redirect URI 與 backend/.env 的 OAUTH_REDIRECT_URL 不一致。
**解法**: 
1. 檢查 `backend/.env` 的 `OAUTH_REDIRECT_URL` 值
2. 回到 Google Console → Credentials → 編輯你的 OAuth Client
3. 確保 Authorized redirect URIs 完全一致（包括大小寫、結尾斜線等）

### Q3: Google 授權後回到首頁但沒有登入
**原因1**: 前端沒有正確接收 token。
**解法**: 打開瀏覽器開發者工具（F12） → Console，查看是否有錯誤訊息。

**原因2**: 後端 callback 失敗。
**解法**: 查看終端機1的後端日誌，確認有收到 `/oauth/google/callback` 請求並成功回應。

### Q4: Quick Tunnel URL 變了（重啟 cloudflared 後）
**Cloudflare Quick Tunnel 的免費版每次重啟 URL 都會改變。**
**解法**:
1. 複製新的 URL (例如 `https://新的隨機子域.trycloudflare.com`)
2. 更新 `backend/.env`:
   ```bash
   OAUTH_REDIRECT_URL=https://新的隨機子域.trycloudflare.com/api/v1/auth/oauth/google/callback
   ```
3. 更新 `frontend/.env.local`:
   ```bash
   VITE_OAUTH_BASE_URL=https://新的隨機子域.trycloudflare.com/api/v1/auth/oauth/google/callback
   ```
4. 回到 Google Console → Credentials → 更新 Authorized redirect URIs
5. 重啟後端和前端

**避免頻繁變更的方法**:
- 使用 ngrok 付費版（$8/月，固定域名）
- 使用 Cloudflare 命名隧道（需登入，但免費且固定域名）

### Q5: Vite 前端無法連到後端 API
**原因**: Vite proxy 設定或後端 CORS 問題。
**解法**: 
- 透過隧道訪問: `https://origin-brings-modes-happening.trycloudflare.com`
- 不要用 `http://localhost:5173`（會有 CORS 問題）

---

## 手動驗證步驟

### 驗證1: 後端健康檢查
```bash
curl https://origin-brings-modes-happening.trycloudflare.com/api/v1/recommender/health
```
應該回傳 `{"status":"ok"}` 或類似訊息。

### 驗證2: OAuth start endpoint
在瀏覽器訪問:
```
https://origin-brings-modes-happening.trycloudflare.com/api/v1/auth/oauth/google/start
```
應該自動導向 Google 授權頁面。

### 驗證3: 檢查環境變數
```bash
cd backend
source .venv/bin/activate
python -c "from app.core.config import settings; print(f'Client ID: {settings.GOOGLE_CLIENT_ID[:20]}... (前20字元)')"
```
應該顯示你的 Client ID 前20字元，不是空字串。

---

## Email/Password 登入（無需 OAuth 設定）

如果暫時不想設定 OAuth，可以先用 Email/Password:

1. 訪問（透過隧道）: https://origin-brings-modes-happening.trycloudflare.com
2. 點擊「立即註冊」
3. 填寫 email 和密碼 → 註冊
4. 自動登入並導向首頁

Email/Password 功能完全獨立，不需要 Google OAuth 憑證。

---

## 下一步

OAuth 走通後，可以考慮:
1. ✅ 實作 SheerID 驗證（學生/教師身份認證）
2. ✅ 使用固定域名（ngrok付費版或Cloudflare命名隧道）
3. ✅ 部署到正式環境（更新 OAUTH_REDIRECT_URL 為正式域名）

需要協助隨時告訴我！
