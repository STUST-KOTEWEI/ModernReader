# 🚀 ModernReader - 安裝與部署完整指南

## 📋 目錄
1. [系統需求檢查](#系統需求檢查)
2. [快速安裝](#快速安裝)
3. [詳細配置](#詳細配置)
4. [開發環境設置](#開發環境設置)
5. [生產環境部署](#生產環境部署)
6. [疑難排解](#疑難排解)

---

## 系統需求檢查

### 1. 檢查 Node.js 版本
```bash
node --version  # 需要 18.0.0 或以上
npm --version   # 需要 9.0.0 或以上
```

如果版本過舊,請更新:
```bash
# macOS (使用 Homebrew)
brew install node

# Windows (使用 Chocolatey)
choco install nodejs

# Linux (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. 檢查儲存空間
```bash
# macOS/Linux
df -h

# Windows
Get-PSDrive
```
確保至少有 **1TB** 可用空間

### 3. 檢查 RAM
```bash
# macOS
vm_stat

# Linux
free -h

# Windows PowerShell
Get-CimInstance Win32_PhysicalMemory | Measure-Object -Property capacity -Sum
```
建議至少 **8GB** 總 RAM (應用最多使用 7GB)

---

## 快速安裝

### 方法 1: 完整安裝 (推薦)

```bash
# 1. 進入專案目錄
cd modernreader_-4d-ai-analysis

# 2. 安裝所有依賴
npm install

# 3. 複製環境變數範本
cp .env.local.example .env.local

# 4. 編輯 .env.local,加入你的 API 金鑰
# 使用你喜歡的編輯器
nano .env.local
# 或
code .env.local

# 5. 啟動開發伺服器
npm run dev
```

### 方法 2: 一鍵安裝腳本

創建 `install.sh`:
```bash
#!/bin/bash

echo "🚀 ModernReader 安裝開始..."

# 檢查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安裝,請先安裝 Node.js 18+"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"

# 安裝依賴
echo "📦 正在安裝依賴..."
npm install

# 設置環境變數
if [ ! -f .env.local ]; then
    cp .env.local.example .env.local
    echo "⚙️  已創建 .env.local,請編輯並加入你的 API 金鑰"
else
    echo "✅ .env.local 已存在"
fi

# 驗證安裝
echo "🔍 驗證安裝..."
npm list --depth=0

echo "✨ 安裝完成!"
echo "📝 下一步:"
echo "   1. 編輯 .env.local 並加入 Gemini API 金鑰"
echo "   2. 執行: npm run dev"
echo "   3. 打開瀏覽器: http://localhost:5173"
```

執行安裝:
```bash
chmod +x install.sh
./install.sh
```

---

## 詳細配置

### 1. 獲取 Gemini API 金鑰

1. 訪問 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 登入你的 Google 帳號
3. 點擊 "Create API Key"
4. 複製生成的 API 金鑰

### 2. 配置環境變數

編輯 `.env.local`:

```env
# ===================================
# ModernReader 環境配置
# ===================================

# === AI 配置 (必須) ===
VITE_GEMINI_API_KEY=你的_API_金鑰_在這裡

# === 效能設定 ===
VITE_MAX_GPU_UTILIZATION=85
VITE_MAX_CPU_UTILIZATION=85
VITE_MAX_RAM_USAGE=7168  # 7GB in MB
VITE_ENABLE_PERFORMANCE_MONITORING=true

# === 功能開關 ===
VITE_ENABLE_AR=true
VITE_ENABLE_BLOCKCHAIN=true
VITE_ENABLE_COLLABORATIVE=true
VITE_ENABLE_NEURAL_READING=true
VITE_ENABLE_MULTIMODAL=true
VITE_ENABLE_PREDICTIVE_ANALYTICS=true

# === 儲存設定 ===
VITE_MAX_STORAGE=1099511627776  # 1TB
VITE_ENABLE_INDEXEDDB=true

# === 視覺化品質 ===
VITE_3D_QUALITY=high  # low, medium, high, ultra
VITE_PARTICLE_EFFECTS=true
VITE_ANIMATION_FPS=60

# === 協作設定 (選用) ===
VITE_MQTT_BROKER=wss://broker.hivemq.com:8884/mqtt
VITE_ENABLE_REALTIME_SYNC=true

# === 區塊鏈設定 (選用) ===
VITE_BLOCKCHAIN_NETWORK=ethereum-mainnet
VITE_WEB3_PROVIDER=https://mainnet.infura.io/v3/你的_project_id

# === 安全設定 ===
VITE_ENABLE_ENCRYPTION=true
VITE_API_RATE_LIMIT=100
```

### 3. 效能調優

根據你的硬體調整設定:

**低階設備** (4GB RAM, 整合顯卡):
```env
VITE_3D_QUALITY=low
VITE_PARTICLE_EFFECTS=false
VITE_ANIMATION_FPS=30
VITE_MAX_RAM_USAGE=3072  # 3GB
```

**中階設備** (8GB RAM, 獨立顯卡):
```env
VITE_3D_QUALITY=medium
VITE_PARTICLE_EFFECTS=true
VITE_ANIMATION_FPS=60
VITE_MAX_RAM_USAGE=5120  # 5GB
```

**高階設備** (16GB+ RAM, RTX 顯卡):
```env
VITE_3D_QUALITY=ultra
VITE_PARTICLE_EFFECTS=true
VITE_ANIMATION_FPS=60
VITE_MAX_RAM_USAGE=7168  # 7GB
```

---

## 開發環境設置

### 1. VSCode 推薦擴展

安裝以下擴展以獲得最佳開發體驗:

```bash
# 自動安裝推薦擴展
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
```

### 2. 開發命令

```bash
# 開發模式 (熱重載)
npm run dev

# 類型檢查
npm run type-check

# 代碼檢查
npm run lint

# 格式化代碼
npm run format

# 構建生產版本
npm run build

# 預覽生產構建
npm run preview
```

### 3. 開發工具

```bash
# 安裝開發依賴
npm install --save-dev @types/three @types/node

# 更新所有依賴
npm update

# 檢查過時的依賴
npm outdated
```

---

## 生產環境部署

### 方法 1: Vercel (推薦)

```bash
# 1. 安裝 Vercel CLI
npm install -g vercel

# 2. 登入 Vercel
vercel login

# 3. 部署
vercel

# 4. 設置環境變數
vercel env add VITE_GEMINI_API_KEY

# 5. 生產部署
vercel --prod
```

### 方法 2: Netlify

```bash
# 1. 構建專案
npm run build

# 2. 安裝 Netlify CLI
npm install -g netlify-cli

# 3. 登入 Netlify
netlify login

# 4. 部署
netlify deploy --prod --dir=dist

# 5. 設置環境變數
netlify env:set VITE_GEMINI_API_KEY "你的金鑰"
```

### 方法 3: Docker

創建 `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5173

CMD ["npm", "run", "preview"]
```

構建並運行:
```bash
# 構建 Docker 映像
docker build -t modernreader .

# 運行容器
docker run -p 5173:5173 \
  -e VITE_GEMINI_API_KEY=你的金鑰 \
  modernreader
```

### 方法 4: 自托管 (Nginx)

```bash
# 1. 構建
npm run build

# 2. 複製到服務器
scp -r dist/* user@your-server:/var/www/modernreader/

# 3. Nginx 配置
# /etc/nginx/sites-available/modernreader
server {
    listen 80;
    server_name modernreader.yourdomain.com;
    
    root /var/www/modernreader;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 啟用 gzip 壓縮
    gzip on;
    gzip_types text/css application/javascript application/json;
    
    # 快取靜態資源
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# 4. 啟用網站
sudo ln -s /etc/nginx/sites-available/modernreader /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 5. 設置 SSL (Let's Encrypt)
sudo certbot --nginx -d modernreader.yourdomain.com
```

---

## 疑難排解

### 問題 1: API 金鑰錯誤

**錯誤**: `API key not valid`

**解決方案**:
1. 確認 `.env.local` 中的 API 金鑰正確
2. 重啟開發伺服器
3. 清除瀏覽器快取

```bash
# 重啟開發伺服器
Ctrl+C
npm run dev
```

### 問題 2: 依賴安裝失敗

**錯誤**: `npm install` 失敗

**解決方案**:
```bash
# 清除 npm 快取
npm cache clean --force

# 刪除 node_modules 和 lock 文件
rm -rf node_modules package-lock.json

# 重新安裝
npm install
```

### 問題 3: 記憶體不足

**錯誤**: `JavaScript heap out of memory`

**解決方案**:
```bash
# 增加 Node.js 記憶體限制
export NODE_OPTIONS="--max-old-space-size=8192"
npm run build
```

### 問題 4: 端口被占用

**錯誤**: `Port 5173 is already in use`

**解決方案**:
```bash
# macOS/Linux
lsof -ti:5173 | xargs kill -9

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# 或使用其他端口
npm run dev -- --port 3000
```

### 問題 5: TypeScript 錯誤

**錯誤**: TypeScript 編譯錯誤

**解決方案**:
```bash
# 重新生成類型定義
npm run type-check

# 更新 TypeScript
npm install -D typescript@latest
```

### 問題 6: 3D 渲染問題

**錯誤**: Three.js 黑屏或效能差

**解決方案**:
1. 降低 3D 品質:
```env
VITE_3D_QUALITY=low
VITE_PARTICLE_EFFECTS=false
```

2. 更新顯卡驅動
3. 使用支援 WebGL 2.0 的瀏覽器

### 問題 7: IndexedDB 配額錯誤

**錯誤**: `QuotaExceededError`

**解決方案**:
```javascript
// 在瀏覽器控制台執行
navigator.storage.persist().then(granted => {
  console.log('Storage persisted:', granted);
});
```

---

## 效能監控

### 1. 瀏覽器開發工具

打開 Chrome DevTools:
- **Performance**: 記錄效能
- **Memory**: 監控記憶體使用
- **Network**: 檢查網路請求
- **Application** > **Storage**: 查看 IndexedDB

### 2. 應用內監控

ModernReader 內建效能監控:

```typescript
// 在瀏覽器控制台
import { performanceMonitor } from './services/performanceMonitor';

// 訂閱效能指標
performanceMonitor.subscribe(metrics => {
  console.log('CPU:', metrics.cpuUsage);
  console.log('GPU:', metrics.gpuUsage);
  console.log('RAM:', metrics.ramUsage);
});
```

### 3. Lighthouse 測試

```bash
# 安裝 Lighthouse CLI
npm install -g lighthouse

# 運行測試
lighthouse http://localhost:5173 --view
```

---

## 備份與恢復

### 導出知識庫

```typescript
// 在應用中執行
import { quantumKnowledgeBase } from './services/quantumKnowledgeBase';

// 導出為 JSON
const backup = await quantumKnowledgeBase.export('json');
console.log(backup);

// 下載備份
const blob = new Blob([backup], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'modernreader-backup.json';
a.click();
```

### 導入知識庫

```typescript
// 導入備份
import { quantumKnowledgeBase } from './services/quantumKnowledgeBase';

const backupData = /* 你的備份數據 */;
await quantumKnowledgeBase.import(backupData, 'json');
```

---

## 更新與維護

### 更新依賴

```bash
# 檢查可更新的包
npm outdated

# 更新所有依賴到最新版本
npm update

# 更新特定包
npm update react react-dom

# 主要版本更新 (謹慎)
npx npm-check-updates -u
npm install
```

### 清理與優化

```bash
# 清理構建文件
rm -rf dist

# 清理快取
npm cache clean --force

# 重新安裝依賴
rm -rf node_modules package-lock.json
npm install

# 分析包大小
npm run build
npx vite-bundle-visualizer
```

---

## 安全建議

1. **不要提交 `.env.local`** 到版本控制
2. **定期更新依賴** 以修復安全漏洞
3. **使用環境變數** 管理敏感資訊
4. **啟用 HTTPS** 在生產環境
5. **設置 CORS** 和 CSP 標頭
6. **定期備份** 知識庫數據

---

## 支援資源

- **文檔**: 
  - [README.md](README.md) - 完整說明
  - [FEATURES.md](FEATURES.md) - 功能文檔
  - [QUICKSTART.md](QUICKSTART.md) - 快速入門
  
- **社群**:
  - GitHub Issues
  - Discord 社群
  - Stack Overflow (標籤: modernreader)

- **聯絡**:
  - Email: support@modernreader.ai
  - Twitter: @modernreader_ai

---

<div align="center">

## 🎉 安裝完成!

### 享受世界級閱讀體驗! 📚✨

**下一步**: 查看 [QUICKSTART.md](QUICKSTART.md) 開始使用

</div>
