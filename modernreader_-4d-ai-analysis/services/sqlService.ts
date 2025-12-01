/**
 * SQL Query Service
 * 提供類 SQL 語法查詢 IndexedDB 資料
 * 支援 SELECT, WHERE, JOIN, GROUP BY, ORDER BY, LIMIT 等操作
 */

import { aiModelManager } from './aiModelManager';
import { nlpService } from './nlpService';

// ========================================
// 類型定義
// ========================================

interface SQLQuery {
  select?: string[];         // SELECT 欄位
  from: string;              // FROM 表名
  where?: WhereCondition[];  // WHERE 條件
  join?: JoinClause[];       // JOIN 子句
  groupBy?: string[];        // GROUP BY 欄位
  having?: WhereCondition[]; // HAVING 條件
  orderBy?: OrderByClause[]; // ORDER BY 子句
  limit?: number;            // LIMIT 數量
  offset?: number;           // OFFSET 偏移
}

interface WhereCondition {
  field: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'NOT IN' | 'IS NULL' | 'IS NOT NULL' | 'BETWEEN';
  value?: any;
  value2?: any; // 用於 BETWEEN
  logic?: 'AND' | 'OR';
}

interface JoinClause {
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  table: string;
  on: {
    leftField: string;
    rightField: string;
  };
}

interface OrderByClause {
  field: string;
  direction: 'ASC' | 'DESC';
}

interface QueryResult {
  rows: any[];
  rowCount: number;
  executionTime: number;
  query: string;
}

interface AggregateFunction {
  type: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';
  field: string;
  alias?: string;
}

interface TableSchema {
  name: string;
  columns: ColumnDefinition[];
  indexes: IndexDefinition[];
  primaryKey?: string;
}

interface ColumnDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  nullable?: boolean;
  unique?: boolean;
  default?: any;
}

interface IndexDefinition {
  name: string;
  columns: string[];
  unique?: boolean;
}

// ========================================
// SQL Service 類別
// ========================================

class SQLService {
  private db: IDBDatabase | null = null;
  private dbName = 'ModernReaderSQL';
  private version = 1;
  private schemas: Map<string, TableSchema> = new Map();
  private queryCache: Map<string, { result: QueryResult; timestamp: number }> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5 分鐘

  constructor() {
    this.initializeDatabase();
    this.loadSchemas();
  }

  // ========================================
  // 資料庫初始化
  // ========================================

  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 建立預設表格
        if (!db.objectStoreNames.contains('documents')) {
          const store = db.createObjectStore('documents', { keyPath: 'id', autoIncrement: true });
          store.createIndex('title', 'title', { unique: false });
          store.createIndex('author', 'author', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('category', 'category', { unique: false });
        }

        if (!db.objectStoreNames.contains('users')) {
          const store = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
          store.createIndex('username', 'username', { unique: true });
          store.createIndex('email', 'email', { unique: true });
        }

        if (!db.objectStoreNames.contains('annotations')) {
          const store = db.createObjectStore('annotations', { keyPath: 'id', autoIncrement: true });
          store.createIndex('documentId', 'documentId', { unique: false });
          store.createIndex('userId', 'userId', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  private async loadSchemas(): Promise<void> {
    // 預定義 schema
    this.schemas.set('documents', {
      name: 'documents',
      primaryKey: 'id',
      columns: [
        { name: 'id', type: 'number', nullable: false, unique: true },
        { name: 'title', type: 'string', nullable: false },
        { name: 'content', type: 'string', nullable: false },
        { name: 'author', type: 'string', nullable: true },
        { name: 'category', type: 'string', nullable: true },
        { name: 'tags', type: 'array', nullable: true },
        { name: 'wordCount', type: 'number', nullable: true },
        { name: 'createdAt', type: 'date', nullable: false },
        { name: 'updatedAt', type: 'date', nullable: true }
      ],
      indexes: [
        { name: 'title', columns: ['title'], unique: false },
        { name: 'author', columns: ['author'], unique: false },
        { name: 'category', columns: ['category'], unique: false }
      ]
    });

    this.schemas.set('users', {
      name: 'users',
      primaryKey: 'id',
      columns: [
        { name: 'id', type: 'number', nullable: false, unique: true },
        { name: 'username', type: 'string', nullable: false, unique: true },
        { name: 'email', type: 'string', nullable: false, unique: true },
        { name: 'createdAt', type: 'date', nullable: false }
      ],
      indexes: [
        { name: 'username', columns: ['username'], unique: true },
        { name: 'email', columns: ['email'], unique: true }
      ]
    });
  }

  // ========================================
  // SQL 查詢解析器
  // ========================================

  async query(sql: string): Promise<QueryResult> {
    const startTime = performance.now();

    // 檢查快取
    const cached = this.queryCache.get(sql);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return { ...cached.result, executionTime: performance.now() - startTime };
    }

    // 解析 SQL
    const parsedQuery = this.parseSQL(sql);
    
    // 執行查詢
    const rows = await this.executeQuery(parsedQuery);

    const result: QueryResult = {
      rows,
      rowCount: rows.length,
      executionTime: performance.now() - startTime,
      query: sql
    };

    // 快取結果
    this.queryCache.set(sql, { result, timestamp: Date.now() });

    return result;
  }

  private parseSQL(sql: string): SQLQuery {
    const normalized = sql.trim().toUpperCase();

    // SELECT 解析
    const selectMatch = normalized.match(/SELECT\s+(.*?)\s+FROM/i);
    const select = selectMatch 
      ? selectMatch[1].split(',').map(s => s.trim())
      : ['*'];

    // FROM 解析
    const fromMatch = normalized.match(/FROM\s+(\w+)/i);
    if (!fromMatch) throw new Error('缺少 FROM 子句');
    const from = fromMatch[1].toLowerCase();

    // WHERE 解析
    const where = this.parseWhere(sql);

    // ORDER BY 解析
    const orderBy = this.parseOrderBy(sql);

    // LIMIT 解析
    const limitMatch = normalized.match(/LIMIT\s+(\d+)/i);
    const limit = limitMatch ? parseInt(limitMatch[1]) : undefined;

    // OFFSET 解析
    const offsetMatch = normalized.match(/OFFSET\s+(\d+)/i);
    const offset = offsetMatch ? parseInt(offsetMatch[1]) : undefined;

    return { select, from, where, orderBy, limit, offset };
  }

  private parseWhere(sql: string): WhereCondition[] | undefined {
    const whereMatch = sql.match(/WHERE\s+(.*?)(?:\s+ORDER BY|\s+LIMIT|\s*$)/i);
    if (!whereMatch) return undefined;

    const conditions: WhereCondition[] = [];
    const whereClause = whereMatch[1];

    // 簡化版 WHERE 解析（支援 AND）
    const parts = whereClause.split(/\s+AND\s+/i);
    
    for (const part of parts) {
      const operators = ['>=', '<=', '!=', '=', '>', '<', 'LIKE', 'IN'];
      let matched = false;

      for (const op of operators) {
        const regex = new RegExp(`(\\w+)\\s*${op}\\s*(.+)`, 'i');
        const match = part.match(regex);
        
        if (match) {
          let value = match[2].trim();
          
          // 移除引號
          let parsedValue: any = value;
          if (value.startsWith("'") || value.startsWith('"')) {
            parsedValue = value.slice(1, -1);
          } else if (!isNaN(Number(value))) {
            // 轉換數字
            parsedValue = Number(value);
          }

          conditions.push({
            field: match[1].toLowerCase(),
            operator: op as any,
            value: parsedValue,
            logic: 'AND'
          });

          matched = true;
          break;
        }
      }

      if (!matched) {
        console.warn(`無法解析 WHERE 條件: ${part}`);
      }
    }

    return conditions.length > 0 ? conditions : undefined;
  }

  private parseOrderBy(sql: string): OrderByClause[] | undefined {
    const orderByMatch = sql.match(/ORDER BY\s+(.*?)(?:\s+LIMIT|\s*$)/i);
    if (!orderByMatch) return undefined;

    const orderClauses: OrderByClause[] = [];
    const parts = orderByMatch[1].split(',');

    for (const part of parts) {
      const match = part.trim().match(/(\w+)\s*(ASC|DESC)?/i);
      if (match) {
        orderClauses.push({
          field: match[1].toLowerCase(),
          direction: (match[2]?.toUpperCase() as 'ASC' | 'DESC') || 'ASC'
        });
      }
    }

    return orderClauses.length > 0 ? orderClauses : undefined;
  }

  // ========================================
  // 查詢執行
  // ========================================

  private async executeQuery(query: SQLQuery): Promise<any[]> {
    if (!this.db) await this.initializeDatabase();
    if (!this.db) throw new Error('資料庫未初始化');

    const transaction = this.db.transaction([query.from], 'readonly');
    const store = transaction.objectStore(query.from);
    
    // 讀取所有資料
    const allData = await this.getAllFromStore(store);

    // 應用 WHERE 條件
    let filteredData = query.where 
      ? this.applyWhereConditions(allData, query.where)
      : allData;

    // 應用 SELECT（欄位篩選）
    if (query.select && !query.select.includes('*')) {
      filteredData = filteredData.map(row => {
        const selected: any = {};
        for (const field of query.select!) {
          if (field.includes('(')) {
            // 聚合函數
            continue;
          }
          selected[field] = row[field];
        }
        return selected;
      });
    }

    // 應用 ORDER BY
    if (query.orderBy) {
      filteredData = this.applySorting(filteredData, query.orderBy);
    }

    // 應用 LIMIT 和 OFFSET
    if (query.offset !== undefined) {
      filteredData = filteredData.slice(query.offset);
    }
    if (query.limit !== undefined) {
      filteredData = filteredData.slice(0, query.limit);
    }

    return filteredData;
  }

  private getAllFromStore(store: IDBObjectStore): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private applyWhereConditions(data: any[], conditions: WhereCondition[]): any[] {
    return data.filter(row => {
      for (const condition of conditions) {
        const fieldValue = row[condition.field];
        
        switch (condition.operator) {
          case '=':
            if (fieldValue !== condition.value) return false;
            break;
          case '!=':
            if (fieldValue === condition.value) return false;
            break;
          case '>':
            if (fieldValue <= condition.value) return false;
            break;
          case '<':
            if (fieldValue >= condition.value) return false;
            break;
          case '>=':
            if (fieldValue < condition.value) return false;
            break;
          case '<=':
            if (fieldValue > condition.value) return false;
            break;
          case 'LIKE':
            const pattern = condition.value.replace(/%/g, '.*');
            const regex = new RegExp(pattern, 'i');
            if (!regex.test(String(fieldValue))) return false;
            break;
          case 'IN':
            if (!Array.isArray(condition.value) || !condition.value.includes(fieldValue)) return false;
            break;
          case 'IS NULL':
            if (fieldValue != null) return false;
            break;
          case 'IS NOT NULL':
            if (fieldValue == null) return false;
            break;
        }
      }
      return true;
    });
  }

  private applySorting(data: any[], orderBy: OrderByClause[]): any[] {
    return data.sort((a, b) => {
      for (const clause of orderBy) {
        const aVal = a[clause.field];
        const bVal = b[clause.field];
        
        let comparison = 0;
        if (aVal < bVal) comparison = -1;
        if (aVal > bVal) comparison = 1;

        if (comparison !== 0) {
          return clause.direction === 'DESC' ? -comparison : comparison;
        }
      }
      return 0;
    });
  }

  // ========================================
  // 進階查詢方法
  // ========================================

  async select(table: string, options: {
    columns?: string[];
    where?: WhereCondition[];
    orderBy?: OrderByClause[];
    limit?: number;
    offset?: number;
  } = {}): Promise<QueryResult> {
    const columns = options.columns?.join(', ') || '*';
    let sql = `SELECT ${columns} FROM ${table}`;

    if (options.where && options.where.length > 0) {
      const whereClause = options.where
        .map(w => `${w.field} ${w.operator} ${this.formatValue(w.value)}`)
        .join(' AND ');
      sql += ` WHERE ${whereClause}`;
    }

    if (options.orderBy && options.orderBy.length > 0) {
      const orderClause = options.orderBy
        .map(o => `${o.field} ${o.direction}`)
        .join(', ');
      sql += ` ORDER BY ${orderClause}`;
    }

    if (options.limit) {
      sql += ` LIMIT ${options.limit}`;
    }

    if (options.offset) {
      sql += ` OFFSET ${options.offset}`;
    }

    return this.query(sql);
  }

  async insert(table: string, data: any | any[]): Promise<{ insertedIds: number[] }> {
    if (!this.db) await this.initializeDatabase();
    if (!this.db) throw new Error('資料庫未初始化');

    const records = Array.isArray(data) ? data : [data];
    const transaction = this.db.transaction([table], 'readwrite');
    const store = transaction.objectStore(table);
    const insertedIds: number[] = [];

    for (const record of records) {
      const request = store.add(record);
      const id = await new Promise<number>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result as number);
        request.onerror = () => reject(request.error);
      });
      insertedIds.push(id);
    }

    // 清除快取
    this.queryCache.clear();

    return { insertedIds };
  }

  async update(table: string, data: any, where?: WhereCondition[]): Promise<{ updatedCount: number }> {
    if (!this.db) await this.initializeDatabase();
    if (!this.db) throw new Error('資料庫未初始化');

    // 先查詢要更新的記錄
    const result = await this.select(table, { where });
    const recordsToUpdate = result.rows;

    const transaction = this.db.transaction([table], 'readwrite');
    const store = transaction.objectStore(table);
    let updatedCount = 0;

    for (const record of recordsToUpdate) {
      const updated = { ...record, ...data };
      const request = store.put(updated);
      await new Promise((resolve, reject) => {
        request.onsuccess = () => {
          updatedCount++;
          resolve(null);
        };
        request.onerror = () => reject(request.error);
      });
    }

    // 清除快取
    this.queryCache.clear();

    return { updatedCount };
  }

  async delete(table: string, where?: WhereCondition[]): Promise<{ deletedCount: number }> {
    if (!this.db) await this.initializeDatabase();
    if (!this.db) throw new Error('資料庫未初始化');

    // 先查詢要刪除的記錄
    const result = await this.select(table, { where });
    const recordsToDelete = result.rows;

    const transaction = this.db.transaction([table], 'readwrite');
    const store = transaction.objectStore(table);
    let deletedCount = 0;

    for (const record of recordsToDelete) {
      const request = store.delete(record.id || record[this.schemas.get(table)?.primaryKey || 'id']);
      await new Promise((resolve, reject) => {
        request.onsuccess = () => {
          deletedCount++;
          resolve(null);
        };
        request.onerror = () => reject(request.error);
      });
    }

    // 清除快取
    this.queryCache.clear();

    return { deletedCount };
  }

  // ========================================
  // 聚合函數
  // ========================================

  async count(table: string, where?: WhereCondition[]): Promise<number> {
    const result = await this.select(table, { where });
    return result.rowCount;
  }

  async sum(table: string, field: string, where?: WhereCondition[]): Promise<number> {
    const result = await this.select(table, { where });
    return result.rows.reduce((sum, row) => sum + (Number(row[field]) || 0), 0);
  }

  async avg(table: string, field: string, where?: WhereCondition[]): Promise<number> {
    const result = await this.select(table, { where });
    if (result.rowCount === 0) return 0;
    const total = result.rows.reduce((sum, row) => sum + (Number(row[field]) || 0), 0);
    return total / result.rowCount;
  }

  async min(table: string, field: string, where?: WhereCondition[]): Promise<number> {
    const result = await this.select(table, { where });
    if (result.rowCount === 0) return 0;
    return Math.min(...result.rows.map(row => Number(row[field]) || 0));
  }

  async max(table: string, field: string, where?: WhereCondition[]): Promise<number> {
    const result = await this.select(table, { where });
    if (result.rowCount === 0) return 0;
    return Math.max(...result.rows.map(row => Number(row[field]) || 0));
  }

  // ========================================
  // AI 輔助 SQL 生成
  // ========================================

  async naturalLanguageQuery(question: string): Promise<QueryResult> {
    console.log(`🤖 使用 AI 將自然語言轉為 SQL: ${question}`);

    // 取得所有 schema
    const schemasInfo = Array.from(this.schemas.values()).map(schema => ({
      table: schema.name,
      columns: schema.columns.map(c => `${c.name} (${c.type})`).join(', ')
    }));

    const prompt = `
你是一個 SQL 專家。請將以下自然語言問題轉換為 SQL 查詢。

可用的表格和欄位:
${schemasInfo.map(s => `- ${s.table}: ${s.columns}`).join('\n')}

問題: ${question}

請直接回傳 SQL 查詢語句，不要包含任何解釋。
例如: SELECT * FROM documents WHERE title LIKE '%量子%' ORDER BY createdAt DESC LIMIT 10
`;

    const response = await aiModelManager.generate({
      prompt,
      temperature: 0.1,
      maxTokens: 500
    });

    const sql = response.text.trim().replace(/```sql|```/g, '').trim();
    console.log(`📝 生成的 SQL: ${sql}`);

    return this.query(sql);
  }

  async explainQuery(sql: string): Promise<string> {
    const prompt = `
請用繁體中文解釋以下 SQL 查詢的作用:

${sql}

請用簡單易懂的方式說明這個查詢會做什麼。
`;

    const response = await aiModelManager.generate({
      prompt,
      temperature: 0.3,
      maxTokens: 300
    });

    return response.text.trim();
  }

  async optimizeQuery(sql: string): Promise<string> {
    const prompt = `
請優化以下 SQL 查詢，提供更高效的版本:

${sql}

請直接回傳優化後的 SQL，不要包含解釋。
`;

    const response = await aiModelManager.generate({
      prompt,
      temperature: 0.1,
      maxTokens: 500
    });

    return response.text.trim().replace(/```sql|```/g, '').trim();
  }

  // ========================================
  // 批次操作
  // ========================================

  async bulkInsert(table: string, records: any[]): Promise<{ insertedIds: number[] }> {
    return this.insert(table, records);
  }

  async bulkUpdate(table: string, updates: Array<{ where: WhereCondition[]; data: any }>): Promise<{ totalUpdated: number }> {
    let totalUpdated = 0;
    for (const { where, data } of updates) {
      const result = await this.update(table, data, where);
      totalUpdated += result.updatedCount;
    }
    return { totalUpdated };
  }

  async bulkDelete(table: string, whereConditions: WhereCondition[][]): Promise<{ totalDeleted: number }> {
    let totalDeleted = 0;
    for (const where of whereConditions) {
      const result = await this.delete(table, where);
      totalDeleted += result.deletedCount;
    }
    return { totalDeleted };
  }

  // ========================================
  // 表格管理
  // ========================================

  async createTable(schema: TableSchema): Promise<void> {
    // IndexedDB 需要升級版本才能建立新表
    this.version++;
    this.schemas.set(schema.name, schema);
    
    if (this.db) {
      this.db.close();
    }

    await this.initializeDatabase();
  }

  async dropTable(tableName: string): Promise<void> {
    if (!this.db) throw new Error('資料庫未初始化');
    
    this.version++;
    this.schemas.delete(tableName);
    
    this.db.close();
    await this.initializeDatabase();
  }

  async listTables(): Promise<string[]> {
    if (!this.db) await this.initializeDatabase();
    if (!this.db) return [];
    
    return Array.from(this.db.objectStoreNames);
  }

  async describeTable(tableName: string): Promise<TableSchema | null> {
    return this.schemas.get(tableName) || null;
  }

  // ========================================
  // 工具方法
  // ========================================

  private formatValue(value: any): string {
    if (typeof value === 'string') {
      return `'${value}'`;
    }
    if (value === null || value === undefined) {
      return 'NULL';
    }
    return String(value);
  }

  clearCache(): void {
    this.queryCache.clear();
  }

  async vacuum(): Promise<void> {
    // IndexedDB 自動管理空間，這裡只清除快取
    this.clearCache();
  }

  async getStatistics(): Promise<{
    tables: number;
    totalRecords: number;
    cacheSize: number;
    queries: number;
  }> {
    const tables = await this.listTables();
    let totalRecords = 0;

    for (const table of tables) {
      const result = await this.select(table);
      totalRecords += result.rowCount;
    }

    return {
      tables: tables.length,
      totalRecords,
      cacheSize: this.queryCache.size,
      queries: this.queryCache.size
    };
  }
}

// ========================================
// 匯出實例
// ========================================

export const sqlService = new SQLService();
export type { SQLQuery, QueryResult, WhereCondition, OrderByClause, TableSchema };
