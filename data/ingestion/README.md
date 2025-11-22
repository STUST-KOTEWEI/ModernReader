# 圖書館資料爬蟲工具

## 概述

本工具集用於從公開圖書館網站抓取書籍資料，並整合到 ModernReader 的書籍目錄中。

## 支援的資料來源

### 已實作
1. **國立公共資訊圖書館 (NLPI)**
   - 網址: https://www.nlpi.edu.tw/
   - 館藏查詢: https://ipac.nlpi.edu.tw/
   - 特色: 台灣最大的公共圖書館，擁有豐富的中文館藏

2. **南台科技大學圖書館 (STUST)**
   - 網址: https://lis.stust.edu.tw/tc/
   - 特色: 學術類書籍，特別是科技、工程領域

3. **台北市立圖書館 (TPML)**
   - 網址: https://www.tpml.edu.tw/
   - 特色: 暢銷書、自我成長類書籍

4. **高雄市立圖書館 (KSML)**
   - 網址: https://www.ksml.edu.tw/
   - 特色: 在地文史、南台灣文化

### 待實作
- 國家圖書館
- 台中市立圖書館
- 新北市立圖書館
- 其他縣市公共圖書館

## 使用方式

### 0. 自動爬蟲（多來源）

已新增 `auto_crawl.py` 與 `sources.yaml`，可一次抓取多個國內外來源並自動去重：

```bash
cd /Users/kedewei/modernreader
source .venv/bin/activate
python data/ingestion/auto_crawl.py
```

設定檔位置：`data/ingestion/sources.yaml`（可調整來源、關鍵字、筆數、是否驗證 SSL）

### 1. 安裝依賴套件

```bash
cd modernreader
source .venv/bin/activate
pip install requests beautifulsoup4
```

### 2. 執行爬蟲

```bash
# 抓取所有來源的資料
python data/ingestion/library_scraper.py
```

輸出檔案會儲存在: `data/catalogs/public_library_books.json`

### 3. 合併到現有目錄

```bash
# 合併公開圖書館資料與原住民語書籍
python data/ingestion/merge_catalogs.py
```

此腳本會：
- 自動備份原始 `sample_books.json`
- 合併新資料（避免重複）
- 顯示統計資訊
- 更新 `sample_books.json`

## 資料結構

### 書籍物件格式

```json
{
  "id": "nlpi_001",
  "title": "書名",
  "authors": ["作者1", "作者2"],
  "publisher": "出版社",
  "publication_date": "2023",
  "isbn": "9789861234567",
  "language": "zh",
  "topics": ["主題1", "主題2"],
  "summary": "書籍簡介",
  "metadata": {
    "source": "NLPI",
    "url": "https://ipac.nlpi.edu.tw/bookDetail/123456",
    "reading_level": "general",
    "keywords": ["關鍵字1", "關鍵字2"]
  }
}
```

### 語言代碼

- `zh`: 中文
- `en`: 英文
- `ja`: 日文
- `amis`: 阿美語
- `atayal`: 泰雅語
- `paiwan`: 排灣語
- `rukai`: 魯凱語
- `seediq`: 賽德克語
- `tao`: 達悟語

### 閱讀級別

- `beginner`: 初級
- `intermediate`: 中級
- `advanced`: 高級
- `general`: 一般（所有級別適用）

## 限制與注意事項

### API 限制

1. **NLPI**: 
   - 目前使用預設書單（因 API 端點未公開或需要認證）
   - 如果需要大量資料，請考慮使用官方 API（如有提供）

2. **STUST**:
   - 圖書館系統沒有公開 API
   - 使用預設學術書籍清單

3. **速率限制**:
   - 腳本內建 1 秒延遲以避免過度請求
   - 請遵守網站使用條款

### SSL 證書問題

如果遇到 SSL 證書驗證錯誤：
```python
# 在 requests.get() 中加入
verify=False
```

⚠️ **警告**: 僅在測試環境使用，生產環境應解決證書問題。

## 擴展新資料來源

### 步驟

1. 在 `LibraryScraper` 類別中新增方法:

```python
def scrape_new_library(self) -> List[Dict]:
    """抓取新圖書館資料"""
    books = []
    
    try:
        response = self.session.get('https://library-url.com/api')
        data = response.json()
        
        for item in data:
            book = {
                'id': f'newlib_{item["id"]}',
                'title': item['title'],
                # ... 其他欄位
            }
            books.append(book)
    except Exception as e:
        logger.error(f"抓取失敗: {e}")
    
    return books
```

2. 在 `scrape_all()` 中調用:

```python
def scrape_all(self):
    all_books = []
    
    # ... 現有來源
    
    # 新來源
    new_books = self.scrape_new_library()
    all_books.extend(new_books)
    
    return all_books
```

## 資料品質

### 已實作檢查

- ✅ 重複書籍過濾（基於 ID）
- ✅ 語言自動偵測
- ✅ 主題標籤標準化

### 待改進

- [ ] ISBN 格式驗證
- [ ] 作者名稱標準化
- [ ] 出版日期格式統一
- [ ] 主題分類自動映射
- [ ] 書籍封面圖片抓取

## 常見問題

### Q: 為什麼有些書籍沒有 ISBN？

A: 部分原住民語書籍或特展資料可能沒有正式的 ISBN。這些書籍仍然有價值，我們使用其他欄位（如標題、作者）來識別。

### Q: 如何新增更多書籍？

A: 有三種方式：
1. 執行爬蟲腳本從公開圖書館抓取
2. 手動編輯 `sample_books.json`
3. 建立新的爬蟲腳本針對特定來源

### Q: 資料更新頻率？

A: 目前需要手動執行腳本。未來可以考慮：
- 建立排程任務（每日/每週）
- 實作增量更新（只抓新書）
- 整合 CI/CD 自動化流程

## 授權與合規

### 資料使用注意事項

1. **公開資料**: 所有資料來自公開可存取的圖書館網站
2. **用途限制**: 僅用於教育和研究目的
3. **歸屬**: 每本書的 `metadata.source` 標註資料來源
4. **著作權**: 書籍描述和元資料屬於各圖書館，使用時請遵守相關規定

### 遵守規範

- ✅ 遵守 robots.txt
- ✅ 設定合理的 User-Agent
- ✅ 實作速率限制
- ✅ 標註資料來源

## 貢獻

歡迎貢獻新的資料來源或改進爬蟲邏輯！

1. Fork 專案
2. 建立新分支: `git checkout -b feature/new-library-scraper`
3. 提交變更: `git commit -am 'Add new library scraper'`
4. 推送分支: `git push origin feature/new-library-scraper`
5. 建立 Pull Request

## 聯絡

如有問題或建議，請開 Issue 或聯絡專案維護者。

---

最後更新: 2025-11-02
