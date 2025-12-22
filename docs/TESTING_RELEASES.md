# 測試發布工作流程 (Testing Release Workflow)

本文檔說明如何測試 GitHub Actions 自動發布工作流程。

## 🧪 測試準備

確保您已經：
1. ✅ 安裝了 Git
2. ✅ 有 GitHub 帳號並配置了認證
3. ✅ Fork 或 clone 了本專案
4. ✅ 推送了包含 workflow 文件的分支

## 📋 測試方法一：手動版本發布測試

### 步驟 1: 準備測試版本

```bash
# 確認當前在正確的分支
git checkout your-feature-branch

# 確認 workflow 文件已存在
ls -la .github/workflows/

# 應該看到：
# - release.yml
# - auto-release.yml
```

### 步驟 2: 合併到主分支 (可選)

如果要在主分支測試：

```bash
git checkout main
git merge your-feature-branch
git push origin main
```

### 步驟 3: 建立測試標籤

```bash
# 建立一個測試版本標籤
git tag -a v1.0.0 -m "Initial release - Testing workflow"

# 推送標籤到 GitHub
git push origin v1.0.0
```

### 步驟 4: 監控工作流程執行

1. 前往 GitHub Actions 頁面：
   ```
   https://github.com/{OWNER}/{REPO}/actions
   ```
   (將 {OWNER} 和 {REPO} 替換為實際的倉庫所有者和名稱)

2. 查找名為 "Create Release" 的工作流程

3. 點擊查看執行詳情

4. 等待工作流程完成（通常需要 1-3 分鐘）

### 步驟 5: 驗證發布結果

1. 前往 Releases 頁面：
   ```
   https://github.com/{OWNER}/{REPO}/releases
   ```

2. 確認新的 release 已建立：
   - ✅ Release 標題: "ModernReader Royale v1.0.0"
   - ✅ ZIP 文件已附加: `ModernReader-v1.0.0.zip`
   - ✅ 發布說明已生成
   - ✅ 包含下載連結和使用說明

3. 下載並測試 ZIP 文件：
   ```bash
   # 下載 ZIP (替換為實際的倉庫 URL)
   wget https://github.com/{OWNER}/{REPO}/releases/download/v1.0.0/ModernReader-v1.0.0.zip
   
   # 解壓縮
   unzip ModernReader-v1.0.0.zip -d test-release
   
   # 檢查內容
   cd test-release
   ls -la
   
   # 應該看到：
   # - index.html
   # - styles.css
   # - app.js
   # - README.md
   ```

## 📋 測試方法二：自動發布測試

### 步驟 1: 修改源文件

```bash
# 編輯任一核心文件
echo "// Test auto-release" >> app.js

# 提交變更
git add app.js
git commit -m "test: Trigger auto-release workflow"
```

### 步驟 2: 推送到主分支

```bash
git push origin main
```

### 步驟 3: 監控自動發布

1. 前往 Actions 頁面查看 "Auto Release on Main Branch" 工作流程
2. 確認工作流程被觸發並成功執行
3. 檢查生成的版本號格式（例如：`v2025.12.22.build123`）

### 步驟 4: 驗證自動發布

1. 前往 Releases 頁面
2. 確認自動發布版本已建立
3. 驗證版本號和發布說明

## 🐛 故障排除

### 問題 1: 工作流程未觸發

**可能原因:**
- workflow 文件不在預設分支
- 標籤格式不正確
- 權限設定問題

**解決方法:**
```bash
# 確認在預設分支
git branch

# 確認 workflow 文件在正確位置
ls -la .github/workflows/

# 確認標籤格式
git tag -l "v*"
```

### 問題 2: 權限錯誤

**錯誤訊息:** "Resource not accessible by integration"

**解決方法:**
1. 前往 Repository Settings → Actions → General
2. 在 "Workflow permissions" 確認已選擇 "Read and write permissions"
3. 儲存設定後重新執行 workflow

### 問題 3: ZIP 文件建立失敗

**解決方法:**
```bash
# 本地測試 ZIP 建立
cd /path/to/ModernReader
zip -r test.zip index.html styles.css app.js README.md -x "*.git*"
ls -lh test.zip
```

## ✅ 測試檢查清單

使用此清單確認測試完成：

- [ ] Workflow 文件已推送到 GitHub
- [ ] 手動標籤觸發測試成功
- [ ] Release 已正確建立
- [ ] ZIP 文件可下載且內容正確
- [ ] 發布說明格式正確
- [ ] 自動發布測試成功（可選）
- [ ] Badge 在 README 中正確顯示
- [ ] 所有連結可正常訪問

## 📝 測試結果記錄

記錄測試結果以供參考：

```markdown
### 測試日期: YYYY-MM-DD

#### 手動發布測試
- 版本: v1.0.0
- 狀態: ✅ 成功 / ❌ 失敗
- 執行時間: X 分鐘
- 備註:

#### 自動發布測試
- 版本: vYYYY.MM.DD.buildXXX
- 狀態: ✅ 成功 / ❌ 失敗
- 執行時間: X 分鐘
- 備註:
```

## 🔄 清理測試數據

測試完成後，可以選擇清理測試版本：

```bash
# 刪除本地標籤
git tag -d v1.0.0

# 刪除遠端標籤
git push origin --delete v1.0.0
```

**注意:** GitHub Release 需要手動在網頁介面刪除。

## 📚 參考資源

- [GitHub Actions 文檔](https://docs.github.com/en/actions)
- [Creating Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)

---

**提示:** 首次設定完成後，建議先在測試 repository 或 fork 中測試，確認無誤後再應用到正式環境。
