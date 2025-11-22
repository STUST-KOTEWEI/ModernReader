# 生產環境部署與防護配置指南

## 🔒 多層防機器人保護（無需付費 API）

ModernReader 已實作多層防機器人機制，無需 Cloudflare Turnstile 或 reCAPTCHA 也能有效防護：

### 前端防護層（已實作）

#### 1. **Rate Limiting（速率限制）**
- 使用 localStorage 追蹤嘗試次數
- 註冊：10分鐘內最多 3 次
- 登入：15分鐘內最多 5 次
- 超過限制會顯示剩餘等待時間

#### 2. **Bot Detection（機器人偵測）**
自動檢測多種機器人特徵：
- User-Agent 分析（bot、crawler、headless 關鍵字）
- WebDriver 屬性檢查
- Plugin 數量（headless 通常為 0）
- 語言列表（bot 通常為空）
- Touch 支援不一致（行動 UA 但無 touch）
- Chrome 物件缺失檢測
- 預設解析度偵測 (1024x768)

評分系統：score >= 50 判定為機器人

#### 3. **Honeypot Field（蜜罐欄位）**
- 在表單中添加不可見欄位（CSS 隱藏）
- 正常用戶看不到，機器人會自動填寫
- 一旦觸發立即阻擋

#### 4. **Timing Validation（時間驗證）**
- 記錄表單載入時間
- 要求至少 3 秒後才能提交
- 防止腳本快速批次提交

#### 5. **Interaction Tracking（互動追蹤）**
追蹤用戶行為：
- 滑鼠移動次數
- 點擊次數
- 觸控次數
要求至少 2 次移動或 1 次點擊

#### 6. **Browser Fingerprinting（瀏覽器指紋）**
生成簡易指紋：
- User-Agent
- 語言設定
- 螢幕解析度與色深
- 時區
- Canvas 指紋
用於後端關聯分析（可選）

#### 7. **Basic Math Captcha（數學驗證碼）**
- 簡單加法題（如：5 + 7 = ?）
- 作為最後一道防線
- 可升級為 Turnstile/reCAPTCHA

### 後端防護層（已修正）

#### 修正的問題
原本後端在 `CAPTCHA_REQUIRED=false` 時，如果前端送了 captcha_token 會進入錯誤分支。

**已修正邏輯：**
```python
async def _maybe_verify_captcha(self, token: str | None) -> None:
    if not settings.CAPTCHA_REQUIRED:
        # 不需要驗證 - 直接跳過，無論 token 是否存在
        return
    # 以下為 CAPTCHA_REQUIRED=true 時的邏輯
```

## 🚀 部署步驟

### 1. 基礎部署（開發/測試環境）

```bash
# 後端 .env 配置
CAPTCHA_REQUIRED=false
CAPTCHA_PROVIDER=  # 留空
EMAIL_VERIFICATION_REQUIRED=false

# 前端會自動使用多層防護 + 數學驗證碼
```

**測試方式：**
```bash
cd backend && uvicorn app.main:app --reload --port 8001
cd frontend && npm run dev
```

訪問 http://localhost:5173/signup 測試註冊流程。

### 2. 生產環境（有網域，Turnstile 免費）

#### A. 設定 Cloudflare Turnstile（免費且無需付費方案）

1. **訪問** https://dash.cloudflare.com/
2. **Turnstile > Add Site**
   - Site name: modernreader-prod
   - Domain: `your-domain.com`
   - Widget Mode: Managed (推薦)
3. **複製 Sitekey & Secret Key**

#### B. 更新配置

**後端 `.env`：**
```bash
CAPTCHA_REQUIRED=true
CAPTCHA_PROVIDER=turnstile
TURNSTILE_SECRET_KEY=your-secret-key-here
```

**前端環境變數（Vite）：**
在 `frontend/.env` 或 `frontend/.env.production`：
```bash
VITE_TURNSTILE_SITE_KEY=your-site-key-here
```

#### C. 驗證

- 前端會自動載入 Turnstile Widget
- 數學驗證碼會被隱藏
- 用戶完成 Turnstile 挑戰後才能提交

### 3. 生產環境（使用 Google reCAPTCHA v2）

如果偏好 reCAPTCHA：

1. **訪問** https://www.google.com/recaptcha/admin
2. **建立新網站**
   - reCAPTCHA type: v2 "I'm not a robot" Checkbox
   - Domains: 新增你的網域
3. **複製 Site Key & Secret Key**

**後端 `.env`：**
```bash
CAPTCHA_REQUIRED=true
CAPTCHA_PROVIDER=recaptcha
RECAPTCHA_SECRET_KEY=your-secret-key-here
```

**前端：**
```bash
VITE_RECAPTCHA_SITE_KEY=your-site-key-here
# 並修改 LoginPage/SignupPage 的 Turnstile 邏輯為 reCAPTCHA
```

## 📊 防護效果對比

| 防護層級 | 適用場景 | 防護強度 | 成本 |
|---------|---------|---------|------|
| **基礎多層防護** | 開發/內部/小型 | ⭐⭐⭐ | 免費 |
| **+ Turnstile** | 生產環境（有網域） | ⭐⭐⭐⭐⭐ | 免費 |
| **+ reCAPTCHA** | 需 Google 整合 | ⭐⭐⭐⭐ | 免費（有配額） |

## 🧪 測試防護機制

### 測試基礎防護

1. **Rate Limiting：**
   ```bash
   # 連續註冊 4 次（會被阻擋）
   ```

2. **Bot Detection：**
   ```bash
   # 使用 headless Chrome
   chromium --headless --dump-dom http://localhost:5173/signup
   # 應該被偵測並阻擋
   ```

3. **Honeypot：**
   ```javascript
   // 在瀏覽器 Console
   document.getElementById('signup-form_honeypot').value = 'bot';
   // 提交會被阻擋
   ```

4. **Timing：**
   ```javascript
   // 頁面載入後立即提交（< 3秒）
   // 會被阻擋
   ```

### 監控與日誌

所有防護觸發會記錄在瀏覽器 Console：
```
[Anti-bot] Honeypot triggered
[Anti-bot] Bot detected: ['webdriver_detected', 'no_plugins']
[Anti-bot] Form submitted too quickly
[Anti-bot] No human interaction detected
```

## 🔧 進階配置

### 調整防護參數

編輯 `frontend/src/pages/SignupPage.tsx` 中的參數：

```typescript
// Rate limit: 3 attempts per 10 minutes
const rateLimit = checkRateLimit('signup', 3, 10 * 60 * 1000);

// Timing: minimum 3 seconds
if (!validateFormTiming(formLoadTime.current, 3)) {

// Interaction: at least 2 mouse moves or 1 click
if (!interactionTracker.current.hasHumanInteraction()) {
```

### 後端 IP 速率限制（可選）

可搭配 Nginx/Caddy 的 rate limiting：

**Nginx 範例：**
```nginx
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

location /api/v1/auth/ {
    limit_req zone=auth_limit burst=3 nodelay;
    proxy_pass http://backend:8001;
}
```

## 📝 生產環境檢查清單

- [ ] 後端 JWT_SECRET_KEY 已更換為強密碼
- [ ] DATABASE_URL 指向生產資料庫（非 SQLite）
- [ ] CORS_ALLOW_ORIGINS 限制為實際網域
- [ ] CAPTCHA 已設定（Turnstile 或 reCAPTCHA）
- [ ] 前端已設定對應的 VITE_*_SITE_KEY
- [ ] 測試註冊/登入流程正常
- [ ] 測試防護機制觸發正確
- [ ] 設定 Nginx/Cloudflare Rate Limiting
- [ ] 監控日誌中的異常活動

## 🆘 常見問題

**Q: 500 錯誤「Captcha provider not configured」**
A: 後端 `.env` 設定 `CAPTCHA_REQUIRED=false` 即可使用基礎防護。

**Q: 註冊太慢被阻擋？**
A: 調整 `validateFormTiming` 的 minSeconds 參數（目前為 3 秒）。

**Q: Turnstile 不顯示？**
A: 檢查網域是否在 Cloudflare Dashboard 中正確設定。

**Q: 想完全關閉防護？**
A: 在 SignupPage.tsx 的 handleSignup 中註解掉整個 `if (!isDemo)` 區塊（不建議）。

## 📚 相關文件

- [Cloudflare Turnstile 文件](https://developers.cloudflare.com/turnstile/)
- [Google reCAPTCHA 文件](https://developers.google.com/recaptcha)
- [OWASP Bot Management](https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks)
