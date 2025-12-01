# 🚀 ModernReader - MacBook Air M3 快速入門指南

> 針對 **MacBook Air M3 (8GB RAM, 256GB 儲存)** 優化配置

## ⚡ 5分鐘快速開始

### 步驟 1: 安裝依賴 (約2分鐘)

```bash
# 確認您在專案目錄中
cd /Users/kedewei/Library/CloudStorage/GoogleDrive-4b4g0077@office.stust.edu.tw/我的雲端硬碟/modernreader_-4d-ai-analysis

# 安裝所有依賴
npm install
```

### 步驟 2: 配置環境變數 (30秒)

創建 `.env.local` 檔案：

```bash
# 使用以下命令創建配置檔
cat > .env.local << 'EOF'
# ===================================
# ModernReader 環境配置
# 針對 MacBook Air M3 8GB RAM 優化
# ===================================

# === AI 配置 (必須) ===
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# === 效能設定 (針對 M3 8GB 優化) ===
VITE_MAX_GPU_UTILIZATION=75
VITE_MAX_CPU_UTILIZATION=70
VITE_MAX_RAM_USAGE=5120
VITE_ENABLE_PERFORMANCE_MONITORING=true

# === 功能開關 ===
VITE_ENABLE_AR=true
VITE_ENABLE_BLOCKCHAIN=true
VITE_ENABLE_COLLABORATIVE=true
VITE_ENABLE_NEURAL_READING=true
VITE_ENABLE_MULTIMODAL=true
VITE_ENABLE_PREDICTIVE_ANALYTICS=true

# === 儲存設定 (256GB 裝置優化) ===
VITE_MAX_STORAGE=107374182400
VITE_ENABLE_INDEXEDDB=true

# === 視覺化品質 (M3 GPU 優化) ===
VITE_3D_QUALITY=high
VITE_PARTICLE_EFFECTS=true
VITE_ANIMATION_FPS=60

# === 協作設定 ===
VITE_MQTT_BROKER=wss://broker.hivemq.com:8884/mqtt
VITE_ENABLE_REALTIME_SYNC=true

# === 安全設定 ===
VITE_ENABLE_ENCRYPTION=true
VITE_API_RATE_LIMIT=100
EOF

echo "✅ 環境配置完成！"
```

**或者手動創建：**
使用您喜歡的編輯器（VSCode, nano, vim 等）創建 `.env.local` 檔案，並複製上面的內容。

### 步驟 3: 啟動應用 (10秒)

```bash
# 啟動開發伺服器
npm run dev
```

您會看到類似以下的輸出：
```
VITE v6.2.0  ready in 823 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 步驟 4: 開始使用 🎉

在瀏覽器中打開：**http://localhost:5173**

---

## 🎯 針對您裝置的優化設定

### MacBook Air M3 (8GB RAM, 256GB) 最佳配置

您的裝置配置已經在 `.env.local` 中優化：

| 設定項目 | 優化值 | 說明 |
|---------|--------|------|
| **RAM 使用上限** | 5GB | 為系統保留 3GB |
| **GPU 使用率** | 75% | M3 GPU 高效能 |
| **CPU 使用率** | 70% | 保持系統流暢 |
| **3D 品質** | High | M3 可輕鬆處理 |
| **粒子效果** | 啟用 | 增強視覺體驗 |
| **FPS 目標** | 60 | 流暢動畫 |
| **儲存配額** | 100GB | 256GB 儲存的合理分配 |

---

## 📚 功能快速導覽

### 1️⃣ AI 智能分析 (10秒體驗)

```
1. 在主頁面貼上任何文字
2. 點擊「分析」按鈕
3. 立即獲得：
   ✅ AI 摘要
   ✅ 關鍵要點
   ✅ 情感分析
   ✅ 複雜度評分
   ✅ 未來趨勢預測
```

**範例文字（可直接使用）：**
```
人工智能正在改變我們的生活方式。從智能手機到自動駕駛汽車，
AI 技術無處不在。隨著機器學習和深度學習的發展，AI 系統變得
越來越智能，能夠完成更複雜的任務。未來，AI 將在醫療、教育、
金融等領域發揮更大作用。
```

### 2️⃣ 3D 知識視覺化 (30秒體驗)

```
1. 分析完文字後，點擊「3D 視覺化」
2. 使用滑鼠：
   - 拖曳：旋轉視角
   - 滾輪：縮放
   - 點擊節點：查看詳情
3. 探索概念之間的連結
```

💡 **M3 提示**：您的 M3 GPU 可完美運行高品質 3D 渲染！

### 3️⃣ 神經閱讀模式 (1分鐘體驗)

```
1. 啟用「仿生閱讀」模式
2. 調整閱讀速度滑桿 (200-800 WPM)
3. 文字會自動加粗關鍵部分
4. 觀察閱讀效率提升
```

### 4️⃣ 知識庫建立 (5分鐘體驗)

```
1. 點擊「儲存到知識庫」
2. 添加標籤（例如：AI, 科技, 學習）
3. 使用語義搜尋查找相關內容
4. 查看知識圖譜
```

**您可以儲存高達 100GB 的知識！**

### 5️⃣ 協作閱讀 (隨時開始)

```
1. 點擊「開始協作會話」
2. 分享連結給朋友
3. 一起做筆記、高亮、討論
4. 即時同步所有人的註解
```

---

## 🎨 界面快速導覽

```
┌─────────────────────────────────────────┐
│  ModernReader                    [⚙️ 設定] │
├─────────────────────────────────────────┤
│  📝 文字輸入區域                          │
│  ┌───────────────────────────────────┐  │
│  │ 在此貼上或輸入文字...               │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│  [🤖 AI分析] [🎨 3D視覺化] [💾 儲存]      │
├─────────────────────────────────────────┤
│  📊 分析結果                             │
│  • 摘要                                  │
│  • 關鍵要點                              │
│  • 情感分析                              │
│  • 推薦閱讀                              │
└─────────────────────────────────────────┘
```

---

## 💻 效能監控

您可以在應用中即時查看系統效能：

```javascript
// 在瀏覽器開發者工具控制台中執行
// Cmd + Option + I 打開控制台

import { performanceMonitor } from './services/performanceMonitor';

performanceMonitor.subscribe(metrics => {
  console.log('=== 系統效能 ===');
  console.log('CPU 使用率:', metrics.cpuUsage.toFixed(1) + '%');
  console.log('GPU 使用率:', metrics.gpuUsage.toFixed(1) + '%');
  console.log('RAM 使用量:', (metrics.ramUsage / 1024 / 1024 / 1024).toFixed(2) + 'GB');
  console.log('儲存空間:', (metrics.storageUsed / 1024 / 1024).toFixed(0) + 'MB');
});
```

---

## 🔧 常見問題與解決方案

### ❓ 問題 1: 啟動時出現錯誤

**症狀**：`npm run dev` 失敗

**解決方案**：
```bash
# 清除快取並重新安裝
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm run dev
```

### ❓ 問題 2: 3D 視覺化卡頓

**症狀**：3D 動畫不流暢

**解決方案**：降低品質設定
```bash
# 編輯 .env.local
VITE_3D_QUALITY=medium
VITE_PARTICLE_EFFECTS=false
```

然後重啟：
```bash
# Ctrl+C 停止，然後重新啟動
npm run dev
```

### ❓ 問題 3: API 配額用完

**症狀**：API 返回 429 錯誤

**解決方案**：
- 查看 [Google AI Studio](https://makersuite.google.com/app/apikey) 的配額
- 等待配額重置（通常每天）
- 或申請更高配額

### ❓ 問題 4: 瀏覽器儲存空間不足

**症狀**：無法儲存更多知識

**解決方案**：
```javascript
// 在瀏覽器控制台執行
// 請求持久化儲存
navigator.storage.persist().then(granted => {
  if (granted) {
    console.log('✅ 儲存空間已持久化');
  } else {
    console.log('⚠️ 請在瀏覽器設定中允許儲存');
  }
});

// 檢查儲存配額
navigator.storage.estimate().then(estimate => {
  const usedGB = (estimate.usage / 1024 / 1024 / 1024).toFixed(2);
  const quotaGB = (estimate.quota / 1024 / 1024 / 1024).toFixed(2);
  console.log(`已使用: ${usedGB}GB / ${quotaGB}GB`);
});
```

---

## 🎓 實用範例與使用場景

### 場景 1: 學生複習考試

```
1. 複製課本章節內容
2. 點擊「AI 分析」
3. 獲得重點摘要
4. 使用「生成測驗」功能
5. 設定間隔複習提醒
```

### 場景 2: 研究論文閱讀

```
1. 貼上論文摘要
2. 查看「跨領域連結」
3. 生成「知識圖譜」
4. 導出引用格式
5. 儲存到個人知識庫
```

### 場景 3: 商業文件分析

```
1. 上傳商業報告
2. 獲得「執行摘要」
3. 查看「關鍵洞察」
4. 與團隊分享「協作連結」
5. 追蹤理解程度
```

---

## ⚡ M3 專屬優化技巧

### 🚀 充分發揮 M3 效能

1. **使用 Safari**：M3 與 Safari 配合最佳
2. **啟用硬體加速**：Safari > 設定 > 進階 > 使用硬體加速
3. **關閉不必要的背景應用**：釋放 RAM
4. **使用原生解析度**：獲得最佳視覺體驗

### 💾 256GB 儲存管理

```bash
# 查看專案儲存使用
du -sh /Users/kedewei/Library/CloudStorage/GoogleDrive-4b4g0077@office.stust.edu.tw/我的雲端硬碟/modernreader_-4d-ai-analysis

# 定期清理 node_modules（如果不開發）
# 僅在不需要開發時執行
# npm prune --production
```

### 🔋 電池續航優化

在 `.env.local` 中使用省電模式：
```env
# 省電模式（外出使用）
VITE_3D_QUALITY=medium
VITE_PARTICLE_EFFECTS=false
VITE_ANIMATION_FPS=30
VITE_MAX_CPU_UTILIZATION=50
```

---

## 🎯 快捷鍵

| 快捷鍵 | 功能 |
|--------|------|
| `Cmd + K` | 快速搜尋 |
| `Cmd + N` | 新建文件 |
| `Cmd + S` | 儲存到知識庫 |
| `Cmd + /` | 顯示所有快捷鍵 |
| `Cmd + B` | 切換仿生閱讀 |
| `Cmd + Shift + V` | 3D 視覺化 |
| `Esc` | 關閉彈出視窗 |

---

## 📖 進階學習路徑

### 第一天：基礎掌握 ⭐
- [ ] 完成快速入門
- [ ] 嘗試 AI 分析功能
- [ ] 探索 3D 視覺化
- [ ] 儲存第一個知識節點

### 第一週：熟練使用 ⭐⭐
- [ ] 閱讀 [FEATURES.md](FEATURES.md)
- [ ] 建立個人知識庫（10+ 條目）
- [ ] 嘗試協作閱讀
- [ ] 自定義閱讀偏好

### 第一月：進階精通 ⭐⭐⭐
- [ ] 閱讀 [README.md](README.md)
- [ ] 探索所有 AI 功能
- [ ] 使用預測分析
- [ ] 嘗試 AR/VR 模式（如果有設備）
- [ ] 參與社群貢獻

---

## 🌟 專業提示

### 📝 最佳實踐

1. **定期備份知識庫**
   ```javascript
   // 在控制台執行
   import { quantumKnowledgeBase } from './services/quantumKnowledgeBase';
   const backup = await quantumKnowledgeBase.export('json');
   console.log(backup); // 複製並儲存
   ```

2. **使用標籤系統**
   - 為每個知識點添加 3-5 個標籤
   - 使用階層式標籤（如：AI > 機器學習 > 深度學習）

3. **善用協作功能**
   - 與同學/同事組建學習小組
   - 分享有價值的洞察
   - 互相投票優質內容

4. **設定學習目標**
   - 使用預測分析規劃學習路徑
   - 追蹤進度和成就
   - 定期複習舊知識

---

## 🆘 獲取幫助

### 官方資源
- 📚 [完整文檔](README.md)
- 🎯 [功能列表](FEATURES.md)
- 🛠️ [安裝指南](INSTALLATION.md)
- 📊 [專案總結](PROJECT_SUMMARY.md)

### 社群支援
- 💬 Discord: [加入社群](https://discord.gg/modernreader)
- 🐦 Twitter: [@modernreader_ai](https://twitter.com/modernreader_ai)
- 📧 Email: support@modernreader.ai
- 🐛 回報問題: [GitHub Issues](https://github.com/modernreader/issues)

### 本地除錯
```bash
# 啟用詳細日誌
export DEBUG=vite:*
npm run dev

# 查看瀏覽器控制台
# 按 Cmd + Option + I
```

---

## 🎉 恭喜！

您已經準備好開始使用 **ModernReader** 了！

### ✨ 現在就開始：

```bash
npm run dev
```

然後在瀏覽器打開 **http://localhost:5173**

---

<div align="center">

## 🚀 開啟您的智能閱讀之旅！

### 針對您的 MacBook Air M3 優化配置

**8GB RAM** + **256GB 儲存** + **M3 GPU** = **完美體驗** ✨

---

### 💡 記住

*"閱讀不只是接收資訊，而是與知識的對話。"*

**- ModernReader 團隊**

---

**下一步**：開始使用並探索無限可能！📚🔥

[查看完整功能](FEATURES.md) | [閱讀詳細文檔](README.md) | [部署到生產](INSTALLATION.md)

</div>
