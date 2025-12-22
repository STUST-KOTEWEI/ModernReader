# 貢獻指南 (Contributing Guide)

感謝您對 ModernReader Royale 的興趣！

## 🚀 如何貢獻

### 報告問題 (Issues)

如果您發現 bug 或有功能建議，請：

1. 檢查是否已有相關 issue
2. 建立新的 issue，清楚描述問題或建議
3. 提供重現步驟（如果是 bug）

### 提交代碼 (Pull Requests)

1. Fork 本專案
2. 建立您的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

### 代碼規範

- 使用語義化的 commit 訊息
- 保持代碼簡潔易讀
- 遵循現有的代碼風格
- 添加必要的註解（中英文皆可）

## 📦 發布流程 (Release Process)

### 維護者發布步驟

1. **更新版本號**
   ```bash
   # 編輯 VERSION 文件
   echo "1.1.0" > VERSION
   ```

2. **更新 CHANGELOG**
   ```bash
   # 編輯 CHANGELOG.md，添加新版本的變更記錄
   ```

3. **提交變更**
   ```bash
   git add VERSION CHANGELOG.md
   git commit -m "Bump version to 1.1.0"
   git push origin main
   ```

4. **建立版本標籤**
   ```bash
   git tag -a v1.1.0 -m "Release version 1.1.0"
   git push origin v1.1.0
   ```

5. **等待自動發布**
   - GitHub Actions 會自動建立 Release
   - 檢查 [Actions](https://github.com/STUST-KOTEWEI/ModernReader/actions) 頁面確認狀態
   - Release 會出現在 [Releases](https://github.com/STUST-KOTEWEI/ModernReader/releases) 頁面

### 版本號規則 (Semantic Versioning)

- **MAJOR** (主版本): 不相容的 API 變更
- **MINOR** (次版本): 向下相容的功能新增
- **PATCH** (修訂版本): 向下相容的 bug 修復

範例：
- `v1.0.0` → `v1.0.1`: Bug 修復
- `v1.0.1` → `v1.1.0`: 新功能
- `v1.1.0` → `v2.0.0`: 重大變更

### 自動發布

每次推送到 `main` 分支並修改以下文件時，系統會自動建立開發版本：
- `index.html`
- `styles.css`
- `app.js`

自動版本格式：`v{YYYY}.{MM}.{DD}.build{count}`

## 📝 Changelog 格式

遵循 [Keep a Changelog](https://keepachangelog.com/) 格式：

```markdown
## [版本號] - YYYY-MM-DD

### Added (新增)
- 新功能說明

### Changed (變更)
- 變更說明

### Deprecated (棄用)
- 即將移除的功能

### Removed (移除)
- 已移除的功能

### Fixed (修復)
- Bug 修復說明

### Security (安全性)
- 安全性修復
```

## 🤝 行為準則

- 尊重所有貢獻者
- 建設性的反饋
- 專注於改進專案
- 歡迎各種形式的貢獻（代碼、文檔、設計等）

## 📧 聯繫方式

如有任何問題，歡迎通過以下方式聯繫：

- 開啟 GitHub Issue
- 查看專案 README 中的聯繫資訊

---

感謝您的貢獻！🎉
