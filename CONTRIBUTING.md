# 貢獻指南 Contributing Guide

感謝您有興趣為 ModernReader Royale 做出貢獻！

Thank you for your interest in contributing to ModernReader Royale!

## 🌟 如何貢獻 How to Contribute

### 回報問題 Reporting Issues

1. 先搜尋現有的 Issues，確認問題尚未被回報
2. 使用清晰的標題描述問題
3. 提供詳細的重現步驟
4. 附上截圖或錯誤訊息（如適用）

### 提交功能建議 Feature Requests

1. 確認功能與專案願景一致
2. 詳細描述功能用途和預期行為
3. 提供使用案例說明

### 提交程式碼 Code Contributions

1. Fork 此專案
2. 建立功能分支：`git checkout -b feature/amazing-feature`
3. 提交變更：`git commit -m 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 開啟 Pull Request

## 📝 程式碼規範 Code Standards

### JavaScript

- 使用 ES6+ 語法
- 遵循 `.eslintrc.json` 規範
- 使用有意義的變數和函數名稱
- 添加 JSDoc 註解

```javascript
/**
 * 計算閱讀進度
 * @param {number} currentPage - 當前頁數
 * @param {number} totalPages - 總頁數
 * @returns {number} 進度百分比
 */
function calculateProgress(currentPage, totalPages) {
  return Math.round((currentPage / totalPages) * 100);
}
```

### CSS

- 使用 CSS 變數管理主題
- 遵循 BEM 命名慣例
- 避免過度嵌套

```css
/* 好的範例 */
.card { }
.card__title { }
.card__content { }
.card--featured { }

/* 避免 */
.card .title .inner .text { }
```

### HTML

- 使用語義化標籤
- 確保可訪問性 (a11y)
- 添加適當的 `aria-` 屬性

## 🏗️ 專案結構 Project Structure

```
ModernReader/
├── index.html          # 主頁面
├── styles.css          # 主要樣式
├── app.js              # 主要應用程式邏輯
├── assets/
│   ├── icons/          # SVG 圖標
│   └── images/         # 圖片資源
├── components/
│   ├── modal.js        # 模態框組件
│   ├── toast.js        # Toast 通知組件
│   └── loader.js       # 載入動畫組件
├── config/
│   └── settings.js     # 應用程式設定
├── utils/
│   ├── storage.js      # 本地存儲工具
│   ├── analytics.js    # 分析追蹤工具
│   ├── i18n.js         # 國際化支援
│   ├── keyboard.js     # 鍵盤快捷鍵
│   └── share.js        # 社群分享功能
├── services/
│   └── api.js          # API 服務層
├── data/
│   └── books.json      # 書籍資料
└── tests/
    └── unit.test.js    # 單元測試
```

## 🧪 測試 Testing

在提交 PR 之前，請確保：

1. 所有現有測試通過
2. 新功能有對應的測試
3. 在主流瀏覽器測試（Chrome, Firefox, Safari）

```bash
# 啟動本地伺服器
npm start

# 執行測試（在瀏覽器控制台）
runTests()
```

## 🎨 設計原則 Design Principles

1. **奢華感 Luxury** - 使用玻璃擬態、漸層、柔和陰影
2. **流暢性 Fluidity** - 優雅的過渡動畫
3. **可訪問性 Accessibility** - 支援鍵盤導航、螢幕閱讀器
4. **響應式 Responsive** - 適配各種螢幕尺寸
5. **效能 Performance** - 優化載入時間和動畫效能

## 📋 Pull Request 檢查清單

- [ ] 程式碼遵循專案規範
- [ ] 添加必要的測試
- [ ] 更新相關文檔
- [ ] 提交訊息清晰明確
- [ ] 無 ESLint 錯誤
- [ ] 在本地測試通過

## 🤝 行為準則 Code of Conduct

- 尊重所有貢獻者
- 保持建設性的討論
- 接受不同的觀點和建議
- 專注於專案的最佳利益

## 📄 授權 License

貢獻的程式碼將依照 MIT License 授權。

---

再次感謝您的貢獻！如有任何問題，歡迎開啟 Issue 討論。

Thank you again for your contribution! Feel free to open an issue if you have any questions.
