# 🗄️ SQL Service 完整文檔

## 概述

**SQL Service** 是 ModernReader 的資料查詢服務，提供類 SQL 語法來查詢 IndexedDB 資料，支援標準 SQL 操作，並整合 AI 輔助查詢。

---

## ✨ 核心功能

### 1. **標準 SQL 查詢**
- ✅ `SELECT` - 查詢資料
- ✅ `FROM` - 指定表格
- ✅ `WHERE` - 條件篩選
- ✅ `ORDER BY` - 排序
- ✅ `LIMIT` - 限制數量
- ✅ `OFFSET` - 分頁偏移

### 2. **CRUD 操作**
- ✅ `INSERT` - 新增資料
- ✅ `UPDATE` - 更新資料
- ✅ `DELETE` - 刪除資料
- ✅ `SELECT` - 查詢資料

### 3. **聚合函數**
- ✅ `COUNT()` - 計數
- ✅ `SUM()` - 總和
- ✅ `AVG()` - 平均值
- ✅ `MIN()` - 最小值
- ✅ `MAX()` - 最大值

### 4. **AI 輔助**
- ✅ **自然語言查詢** - 用中文問問題，自動生成 SQL
- ✅ **查詢解釋** - 用白話解釋 SQL 的作用
- ✅ **查詢優化** - AI 自動優化 SQL 效能

### 5. **效能優化**
- ✅ **查詢快取** - 5 分鐘快取，避免重複查詢
- ✅ **批次操作** - 批量插入/更新/刪除
- ✅ **索引支援** - 自動使用索引加速查詢

---

## 📦 預設表格

### 1. **documents** (文檔表)
```typescript
{
  id: number;           // 主鍵
  title: string;        // 標題
  content: string;      // 內容
  author: string;       // 作者
  category: string;     // 分類
  tags: string[];       // 標籤
  wordCount: number;    // 字數
  createdAt: Date;      // 建立時間
  updatedAt: Date;      // 更新時間
}
```

### 2. **users** (使用者表)
```typescript
{
  id: number;           // 主鍵
  username: string;     // 使用者名稱 (唯一)
  email: string;        // 電子郵件 (唯一)
  createdAt: Date;      // 建立時間
}
```

### 3. **annotations** (註解表)
```typescript
{
  id: number;           // 主鍵
  documentId: number;   // 文檔 ID
  userId: number;       // 使用者 ID
  content: string;      // 註解內容
  createdAt: Date;      // 建立時間
}
```

---

## 🚀 使用範例

### 1. 基本 SQL 查詢

```typescript
import { sqlService } from './services/sqlService';

// 查詢所有文檔
const result = await sqlService.query('SELECT * FROM documents');
console.log(result.rows);

// 條件查詢
const result = await sqlService.query(`
  SELECT title, author, createdAt 
  FROM documents 
  WHERE category = 'AI' 
  ORDER BY createdAt DESC 
  LIMIT 10
`);

// 模糊搜尋
const result = await sqlService.query(`
  SELECT * FROM documents 
  WHERE title LIKE '%量子%' 
  ORDER BY wordCount DESC
`);
```

### 2. 使用方法 API

```typescript
// SELECT 查詢
const result = await sqlService.select('documents', {
  columns: ['title', 'author', 'wordCount'],
  where: [
    { field: 'category', operator: '=', value: 'AI' },
    { field: 'wordCount', operator: '>', value: 1000 }
  ],
  orderBy: [
    { field: 'createdAt', direction: 'DESC' }
  ],
  limit: 20
});

console.log(`找到 ${result.rowCount} 筆資料`);
console.log(`查詢耗時: ${result.executionTime.toFixed(2)}ms`);
```

### 3. 插入資料

```typescript
// 插入單筆
const { insertedIds } = await sqlService.insert('documents', {
  title: '量子計算入門',
  content: '量子計算是...',
  author: 'Alice',
  category: 'AI',
  tags: ['量子', '計算'],
  wordCount: 5000,
  createdAt: new Date()
});

console.log(`新增成功，ID: ${insertedIds[0]}`);

// 批量插入
const { insertedIds } = await sqlService.bulkInsert('documents', [
  { title: '文章1', content: '...', createdAt: new Date() },
  { title: '文章2', content: '...', createdAt: new Date() },
  { title: '文章3', content: '...', createdAt: new Date() }
]);

console.log(`批量新增 ${insertedIds.length} 筆`);
```

### 4. 更新資料

```typescript
// 更新符合條件的記錄
const { updatedCount } = await sqlService.update(
  'documents',
  { category: 'Science', updatedAt: new Date() },
  [{ field: 'author', operator: '=', value: 'Bob' }]
);

console.log(`更新了 ${updatedCount} 筆資料`);
```

### 5. 刪除資料

```typescript
// 刪除符合條件的記錄
const { deletedCount } = await sqlService.delete('documents', [
  { field: 'wordCount', operator: '<', value: 100 }
]);

console.log(`刪除了 ${deletedCount} 筆資料`);
```

### 6. 聚合函數

```typescript
// 計數
const totalDocs = await sqlService.count('documents');
console.log(`總共 ${totalDocs} 篇文檔`);

// 計算平均字數
const avgWords = await sqlService.avg('documents', 'wordCount');
console.log(`平均字數: ${avgWords.toFixed(0)}`);

// 找最長的文章
const maxWords = await sqlService.max('documents', 'wordCount');
console.log(`最長文章: ${maxWords} 字`);

// 計算某分類的總字數
const totalWords = await sqlService.sum('documents', 'wordCount', [
  { field: 'category', operator: '=', value: 'AI' }
]);
console.log(`AI 分類總字數: ${totalWords}`);
```

### 7. 🤖 AI 自然語言查詢

```typescript
// 用中文問問題，AI 自動生成 SQL 並執行
const result = await sqlService.naturalLanguageQuery(
  '找出最近 7 天建立的、字數超過 2000 的 AI 相關文章，按建立時間排序'
);

console.log('AI 生成的查詢結果:');
console.log(result.rows);

// 更多範例
await sqlService.naturalLanguageQuery('有多少篇文章是 Alice 寫的？');
await sqlService.naturalLanguageQuery('找出最受歡迎的 10 個標籤');
await sqlService.naturalLanguageQuery('計算每個分類的平均字數');
```

### 8. 查詢解釋和優化

```typescript
const sql = 'SELECT * FROM documents WHERE category = "AI" ORDER BY createdAt DESC';

// 解釋查詢
const explanation = await sqlService.explainQuery(sql);
console.log('查詢說明:', explanation);

// 優化查詢
const optimizedSQL = await sqlService.optimizeQuery(sql);
console.log('優化後的 SQL:', optimizedSQL);
```

---

## 🎯 支援的 WHERE 運算符

| 運算符 | 說明 | 範例 |
|--------|------|------|
| `=` | 等於 | `WHERE category = 'AI'` |
| `!=` | 不等於 | `WHERE author != 'Unknown'` |
| `>` | 大於 | `WHERE wordCount > 1000` |
| `<` | 小於 | `WHERE wordCount < 500` |
| `>=` | 大於等於 | `WHERE createdAt >= '2025-01-01'` |
| `<=` | 小於等於 | `WHERE updatedAt <= '2025-12-31'` |
| `LIKE` | 模糊搜尋 | `WHERE title LIKE '%量子%'` |
| `IN` | 在集合中 | `WHERE category IN ['AI', 'Science']` |
| `IS NULL` | 為空 | `WHERE author IS NULL` |
| `IS NOT NULL` | 不為空 | `WHERE updatedAt IS NOT NULL` |

---

## 📊 表格管理

### 列出所有表格

```typescript
const tables = await sqlService.listTables();
console.log('所有表格:', tables);
// ['documents', 'users', 'annotations']
```

### 查看表格結構

```typescript
const schema = await sqlService.describeTable('documents');
console.log('表格結構:', schema);
/*
{
  name: 'documents',
  primaryKey: 'id',
  columns: [
    { name: 'id', type: 'number', nullable: false, unique: true },
    { name: 'title', type: 'string', nullable: false },
    ...
  ],
  indexes: [
    { name: 'title', columns: ['title'], unique: false },
    ...
  ]
}
*/
```

### 建立新表格

```typescript
await sqlService.createTable({
  name: 'tags',
  primaryKey: 'id',
  columns: [
    { name: 'id', type: 'number', nullable: false, unique: true },
    { name: 'name', type: 'string', nullable: false, unique: true },
    { name: 'count', type: 'number', nullable: false, default: 0 }
  ],
  indexes: [
    { name: 'name', columns: ['name'], unique: true }
  ]
});
```

### 刪除表格

```typescript
await sqlService.dropTable('tags');
```

---

## ⚡ 效能最佳化

### 1. 查詢快取

```typescript
// 相同查詢會使用快取 (5 分鐘有效)
const result1 = await sqlService.query('SELECT * FROM documents');
const result2 = await sqlService.query('SELECT * FROM documents'); // 使用快取

// 清除快取
sqlService.clearCache();
```

### 2. 批次操作

```typescript
// 批量插入 (比單筆快很多)
await sqlService.bulkInsert('documents', [
  { title: 'Doc1', content: '...', createdAt: new Date() },
  { title: 'Doc2', content: '...', createdAt: new Date() },
  // ... 更多資料
]);

// 批量更新
await sqlService.bulkUpdate('documents', [
  { where: [{ field: 'id', operator: '=', value: 1 }], data: { title: '新標題1' } },
  { where: [{ field: 'id', operator: '=', value: 2 }], data: { title: '新標題2' } }
]);
```

### 3. 限制查詢數量

```typescript
// 使用 LIMIT 避免載入過多資料
const result = await sqlService.query('SELECT * FROM documents LIMIT 100');

// 分頁查詢
const page1 = await sqlService.query('SELECT * FROM documents LIMIT 20 OFFSET 0');
const page2 = await sqlService.query('SELECT * FROM documents LIMIT 20 OFFSET 20');
```

---

## 📈 統計資訊

```typescript
const stats = await sqlService.getStatistics();
console.log('資料庫統計:');
console.log(`- 表格數: ${stats.tables}`);
console.log(`- 總記錄數: ${stats.totalRecords}`);
console.log(`- 快取查詢數: ${stats.cacheSize}`);
```

---

## 🎓 進階用法

### 複雜查詢範例

```typescript
// 1. 找出最活躍的作者
const result = await sqlService.naturalLanguageQuery(
  '找出發表文章最多的 10 位作者，並統計每人的總字數'
);

// 2. 時間範圍查詢
const result = await sqlService.select('documents', {
  where: [
    { field: 'createdAt', operator: '>=', value: '2025-01-01' },
    { field: 'createdAt', operator: '<=', value: '2025-12-31' }
  ],
  orderBy: [{ field: 'createdAt', direction: 'DESC' }]
});

// 3. 多條件組合
const result = await sqlService.select('documents', {
  columns: ['title', 'author', 'wordCount', 'createdAt'],
  where: [
    { field: 'category', operator: '=', value: 'AI' },
    { field: 'wordCount', operator: '>', value: 2000 },
    { field: 'author', operator: '!=', value: 'Unknown' }
  ],
  orderBy: [
    { field: 'wordCount', direction: 'DESC' },
    { field: 'createdAt', direction: 'DESC' }
  ],
  limit: 50
});
```

---

## ⚙️ 環境變數

```env
# SQL Service 設定
VITE_ENABLE_SQL=true                    # 啟用 SQL 服務
VITE_SQL_CACHE_EXPIRY=300000            # 快取過期時間 (5 分鐘)
VITE_SQL_MAX_QUERY_TIME=10000           # 最大查詢時間 (10 秒)
VITE_SQL_ENABLE_AI_QUERY=true           # 啟用 AI 查詢
VITE_SQL_AUTO_OPTIMIZE=true             # 自動優化查詢
```

---

## 🔥 完整範例：文章管理系統

```typescript
import { sqlService } from './services/sqlService';

class ArticleManager {
  // 發布文章
  async publishArticle(article: {
    title: string;
    content: string;
    author: string;
    category: string;
    tags: string[];
  }) {
    const wordCount = article.content.length;
    const { insertedIds } = await sqlService.insert('documents', {
      ...article,
      wordCount,
      createdAt: new Date()
    });
    
    return insertedIds[0];
  }

  // 搜尋文章
  async searchArticles(keyword: string) {
    return await sqlService.query(`
      SELECT title, author, category, wordCount, createdAt
      FROM documents
      WHERE title LIKE '%${keyword}%' OR content LIKE '%${keyword}%'
      ORDER BY createdAt DESC
      LIMIT 50
    `);
  }

  // 取得熱門文章
  async getTrendingArticles(limit: number = 10) {
    return await sqlService.select('documents', {
      columns: ['title', 'author', 'wordCount', 'category'],
      orderBy: [{ field: 'createdAt', direction: 'DESC' }],
      limit
    });
  }

  // 取得作者統計
  async getAuthorStats(author: string) {
    const total = await sqlService.count('documents', [
      { field: 'author', operator: '=', value: author }
    ]);
    
    const totalWords = await sqlService.sum('documents', 'wordCount', [
      { field: 'author', operator: '=', value: author }
    ]);
    
    const avgWords = await sqlService.avg('documents', 'wordCount', [
      { field: 'author', operator: '=', value: author }
    ]);

    return { total, totalWords, avgWords };
  }

  // 自然語言查詢
  async askQuestion(question: string) {
    return await sqlService.naturalLanguageQuery(question);
  }
}

// 使用範例
const manager = new ArticleManager();

// 發布文章
const articleId = await manager.publishArticle({
  title: '深度學習入門',
  content: '深度學習是機器學習的一個分支...',
  author: 'Alice',
  category: 'AI',
  tags: ['深度學習', 'AI', '機器學習']
});

// 搜尋文章
const results = await manager.searchArticles('深度學習');

// 取得熱門文章
const trending = await manager.getTrendingArticles(10);

// 作者統計
const stats = await manager.getAuthorStats('Alice');
console.log(`Alice 總共寫了 ${stats.total} 篇文章，共 ${stats.totalWords} 字`);

// 自然語言查詢
const aiResult = await manager.askQuestion('有哪些關於量子計算的文章？');
```

---

## 🎉 總結

SQL Service 提供了：

1. ✅ **標準 SQL 語法** - SELECT, INSERT, UPDATE, DELETE
2. ✅ **聚合函數** - COUNT, SUM, AVG, MIN, MAX
3. ✅ **AI 自然語言查詢** - 用中文問問題
4. ✅ **查詢優化** - 自動快取、批次操作
5. ✅ **表格管理** - 建立、刪除、查看結構
6. ✅ **效能監控** - 執行時間、快取統計

完全整合 IndexedDB + AI，讓資料查詢變得簡單又強大！🚀
