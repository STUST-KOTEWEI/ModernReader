# ModernReader Royale

[![Release](https://img.shields.io/github/v/release/STUST-KOTEWEI/ModernReader?style=flat-square)](https://github.com/STUST-KOTEWEI/ModernReader/releases)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/demo-live-success.svg?style=flat-square)](https://stust-kotewei.github.io/ModernReader/)

ModernReader Royale 是一款專為頂級閱讀體驗打造的單頁網站樣板，結合光譜視覺、動態交互與禮賓級功能展示，呈現世界級的奢華閱讀品牌形象。

## 功能亮點

- **旗艦式 Hero 區塊**：玻璃質感裝置預覽與 AI 情緒調校說明卡，營造沉浸開場。
- **Signature Experiences**：逐一顯示專屬閱讀場景，使用視差光暈與滾動動畫增添層次。
- **Immersive Atelier 面板**：即時切換場景主題、字體比例、字距與音場，模擬客製化閱讀儀式。
- **策展星圖**：橫向滑動的收藏卡片，呈現全球限量藏書的策展視覺。
- **禮賓服務模組**：流動光暈與數據徽章展示 24/7 禮賓服務能量。

## 📥 下載與使用

### 方式一：下載 Release 版本

1. 前往 [Releases 頁面](https://github.com/STUST-KOTEWEI/ModernReader/releases)
2. 下載最新版本的 `ModernReader-vX.X.X.zip`
3. 解壓縮文件
4. 使用靜態伺服器開啟（例如 `npx serve .` 或 `python -m http.server`）
5. 在瀏覽器中訪問 `http://localhost:3000`（或對應埠口）

### 方式二：在線體驗

直接訪問 GitHub Pages: [https://stust-kotewei.github.io/ModernReader/](https://stust-kotewei.github.io/ModernReader/)

### 方式三：從源碼運行

```bash
git clone https://github.com/STUST-KOTEWEI/ModernReader.git
cd ModernReader
# 使用任意靜態伺服器
npx serve .
# 或
python -m http.server
```

## 使用方式

1. 以任意靜態伺服器開啟專案根目錄（例如 `npx serve .`）。
2. 造訪瀏覽器 `https://stust-kotewei.github.io/ModernReader/`（或對應埠口）體驗互動介面。
3. 在 Immersive Atelier 區塊調整主題、字距與音場，感受動態反饋。

## 開發與設計重點

- 採用 Playfair Display 與 Inter 字體搭配，營造現代奢華氣質。
- 全局使用玻璃擬態（Glassmorphism）、Aurora 漸層與軟質陰影呈現空間感。
- 使用 Intersection Observer 與自訂動畫增強進場動態。

歡迎依品牌需求進一步擴充內容或整合後端服務。


---

## 🤖 技術架構

**ModernReader** 是一個完整的AI驅動閱讀體驗平台，結合前端UI與後端AI框架：

### 前端層 (Current Repository)
- **ModernReader Royale UI** - 豪華閱讀介面
- 玻璃擬態設計 (Glassmorphism)
- Aurora 漸變背景效果
- 響應式互動控制
- GitHub Pages: [https://stust-kotewei.github.io/ModernReader/](https://stust-kotewei.github.io/ModernReader/)

### 後端層 (AI Engine)
- **Project H.O.L.O.** (Holistic Omni-sensory Literary Orchestra)
- 深度語意分析 (NLP)
- 多模態感知生成 (Multi-modal AI)
- 情感與語調識別
- Text-to-Speech, Text-to-Sound, Text-to-Scent
- Repository: [AI-Reader](https://github.com/STUST-KOTEWEI/AI-Reader)

### 整合特性

✨ **完整技術棧**
- Frontend: HTML5, CSS3, JavaScript (ES6+)
- Backend: Python, NLP Models, Generative AI
- Deployment: GitHub Pages + API Services

🎯 **核心創新**
1. **視覺體驗** - ModernReader Royale豪華UI
2. **AI理解** - Project H.O.L.O.深度語意分析
3. **多感官輸出** - 聽覺、觸覺、嗅覺整合
4. **個性化** - AI驅動的閱讀推薦與適應

---

## 🔗 相關專案

- [AI-Reader (Project H.O.L.O.)](https://github.com/STUST-KOTEWEI/AI-Reader) - AI後端引擎
- [Profile](https://github.com/STUST-KOTEWEI/profile) - 研究者個人網站

---

## 🚀 發行版本 (Releases)

### 自動化發布系統

本專案使用 GitHub Actions 實現自動化發布流程：

#### 📌 手動版本發布
要建立新的版本發布，請按照以下步驟：

```bash
# 1. 更新 VERSION 文件
echo "1.0.1" > VERSION

# 2. 提交變更
git add VERSION
git commit -m "Bump version to 1.0.1"
git push

# 3. 建立版本標籤
git tag -a v1.0.1 -m "Release version 1.0.1"
git push origin v1.0.1
```

推送版本標籤後，GitHub Actions 會自動：
- 建立 ZIP 壓縮檔
- 生成發布說明
- 建立 GitHub Release
- 上傳發布文件

#### 🤖 自動發布
每次推送到 `main` 分支並修改以下文件時，系統會自動建立發布：
- `index.html`
- `styles.css`
- `app.js`

自動發布使用日期和構建編號命名（例如：`v2025.12.22.build123`）

### 版本命名規則

- **手動版本**: `v{major}.{minor}.{patch}` (例如: v1.0.0, v2.1.3)
- **自動版本**: `v{YYYY}.{MM}.{DD}.build{count}` (例如: v2025.12.22.build45)

### 查看發布歷史

訪問 [Releases 頁面](https://github.com/STUST-KOTEWEI/ModernReader/releases) 查看所有發布版本和下載文件。

---

## 📝 授權

MIT License © 2025 Te-Wei Ko (柯德瑋)

---

## 👨‍💻 作者

**柯德瑋 (Te-Wei Ko)**
- 情感運算與多模態互動研究者
- 南臺科技大學 資訊工程系
- 專注於AI、E-paper技術與多感官使用者體驗

---

## 🤖 開發說明

**本專案使用 AI 輔助開發工具**

本專案在開發過程中使用了以下 AI 輔助工具，以提升開發效率和代碼質量：

- **GitHub Copilot**: 用於代碼補全、函數生成和重構建議
- **Google Labs Jules**: 協助專案架構設計和技術文檔撰寫

這些工具在開發過程中提供了寶貴的輔助，但所有最終決策、架構設計和代碼審查仍由開發者本人完成。使用 AI 工具是為了：

✨ 加速開發流程
📚 學習最佳實踐
⚫ 提高代碼質量
🎨 專注於創新功能實現

我們相信透明地披露 AI 工具的使用，有助於推動學術界和工業界對 AI 輔助開發的理解與規範。
