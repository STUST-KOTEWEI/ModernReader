import React, { useState, useEffect } from 'react';
import { sqlService, QueryResult } from '../services/sqlService';

interface SQLExplorerProps {
  theme?: any;
}

function GlassCard({ children, theme, style = {} }: any) {
  return (
    <div style={{
      background: theme?.card || 'rgba(30,32,36,0.85)',
      boxShadow: theme?.shadow || '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
      borderRadius: 24,
      padding: '2rem',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(200,200,200,0.08)',
      ...style
    }}>
      {children}
    </div>
  );
}

export default function SQLExplorer({ theme }: SQLExplorerProps) {
  const [query, setQuery] = useState('SELECT * FROM documents LIMIT 10');
  const [naturalQuery, setNaturalQuery] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tables, setTables] = useState<string[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [mode, setMode] = useState<'sql' | 'natural'>('sql');

  useEffect(() => {
    loadTables();
    loadStats();
    initializeSampleData();
  }, []);

  const loadTables = async () => {
    try {
      const tableList = await sqlService.listTables();
      setTables(tableList);
    } catch (err) {
      console.error('Failed to load tables:', err);
    }
  };

  const loadStats = async () => {
    try {
      const statistics = await sqlService.getStatistics();
      setStats(statistics);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const initializeSampleData = async () => {
    try {
      // 確保表格存在
      const tableList = await sqlService.listTables();
      if (!tableList.includes('documents')) {
        // 創建示例文檔
        await sqlService.insert('documents', {
          id: 1,
          title: 'AI 與機器學習入門',
          content: '這是一篇關於人工智慧和機器學習的文章...',
          author: '張三',
          category: '科技',
          tags: ['AI', 'ML', '教學'],
          created: new Date().toISOString(),
          views: 150
        });
        await sqlService.insert('documents', {
          id: 2,
          title: 'TypeScript 進階技巧',
          content: 'TypeScript 是一個強型別的 JavaScript 超集...',
          author: '李四',
          category: '程式設計',
          tags: ['TypeScript', 'JavaScript', '前端'],
          created: new Date().toISOString(),
          views: 320
        });
        await sqlService.insert('documents', {
          id: 3,
          title: 'React 19 新功能',
          content: 'React 19 帶來了許多令人興奮的新功能...',
          author: '王五',
          category: '程式設計',
          tags: ['React', '前端', 'Web'],
          created: new Date().toISOString(),
          views: 280
        });
        await loadTables();
        await loadStats();
      }
    } catch (err) {
      console.error('Failed to initialize sample data:', err);
    }
  };

  const executeQuery = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const queryResult = await sqlService.query(query);
      setResult(queryResult);
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : '查詢執行失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const executeNaturalQuery = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const queryResult = await sqlService.naturalLanguageQuery(naturalQuery);
      setResult(queryResult);
      setQuery(queryResult.query); // 顯示生成的 SQL
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : '自然語言查詢失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const exampleQueries = [
    'SELECT * FROM documents WHERE category = "科技" ORDER BY views DESC',
    'SELECT category, COUNT(*) as count FROM documents GROUP BY category',
    'SELECT author, AVG(views) as avg_views FROM documents GROUP BY author',
    'SELECT * FROM documents WHERE views > 200 LIMIT 5'
  ];

  const exampleNaturalQueries = [
    '查詢所有科技類文章',
    '統計每個分類的文章數量',
    '找出瀏覽量最高的 5 篇文章',
    '查詢張三寫的所有文章'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ 
          fontSize: 36, 
          fontWeight: 700, 
          color: theme?.accent || '#00c6ff',
          marginBottom: 8
        }}>
          SQL Explorer 🗄️
        </h1>
        <p style={{ color: theme?.text || '#f8fafc', opacity: 0.8 }}>
          強大的 SQL 查詢工具，支援自然語言查詢與 AI 輔助
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <GlassCard theme={theme} style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: 14, color: theme?.text || '#f8fafc', opacity: 0.7 }}>資料表數量</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme?.accent || '#00c6ff', marginTop: 8 }}>
              {stats.tables}
            </div>
          </GlassCard>
          <GlassCard theme={theme} style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: 14, color: theme?.text || '#f8fafc', opacity: 0.7 }}>總記錄數</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme?.accent || '#00c6ff', marginTop: 8 }}>
              {stats.totalRecords}
            </div>
          </GlassCard>
          <GlassCard theme={theme} style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: 14, color: theme?.text || '#f8fafc', opacity: 0.7 }}>快取查詢</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme?.accent || '#00c6ff', marginTop: 8 }}>
              {stats.cacheSize}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Mode Toggle */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={() => setMode('sql')}
          style={{
            padding: '12px 24px',
            borderRadius: 12,
            border: 'none',
            background: mode === 'sql' ? (theme?.accent || '#00c6ff') : 'rgba(255,255,255,0.1)',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          SQL 查詢
        </button>
        <button
          onClick={() => setMode('natural')}
          style={{
            padding: '12px 24px',
            borderRadius: 12,
            border: 'none',
            background: mode === 'natural' ? (theme?.accent || '#00c6ff') : 'rgba(255,255,255,0.1)',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          自然語言查詢
        </button>
      </div>

      {/* Query Input */}
      <GlassCard theme={theme}>
        {mode === 'sql' ? (
          <>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: theme?.accent || '#00c6ff', marginBottom: 16 }}>
              SQL 查詢
            </h3>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="輸入 SQL 查詢..."
              style={{
                width: '100%',
                height: 120,
                padding: '1rem',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.3)',
                color: '#fff',
                fontSize: 14,
                fontFamily: 'monospace',
                resize: 'vertical'
              }}
            />
            <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {exampleQueries.map((eq, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuery(eq)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.05)',
                    color: theme?.text || '#f8fafc',
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                >
                  範例 {idx + 1}
                </button>
              ))}
            </div>
            <button
              onClick={executeQuery}
              disabled={isLoading || !query}
              style={{
                marginTop: 16,
                padding: '12px 32px',
                borderRadius: 12,
                border: 'none',
                background: isLoading || !query ? 'rgba(255,255,255,0.2)' : (theme?.accent || '#00c6ff'),
                color: '#fff',
                fontWeight: 600,
                cursor: isLoading || !query ? 'not-allowed' : 'pointer',
                fontSize: 16
              }}
            >
              {isLoading ? '執行中...' : '執行查詢'}
            </button>
          </>
        ) : (
          <>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: theme?.accent || '#00c6ff', marginBottom: 16 }}>
              自然語言查詢
            </h3>
            <textarea
              value={naturalQuery}
              onChange={(e) => setNaturalQuery(e.target.value)}
              placeholder="用中文描述你想查詢的內容，例如：「查詢所有科技類文章」"
              style={{
                width: '100%',
                height: 120,
                padding: '1rem',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.3)',
                color: '#fff',
                fontSize: 14,
                resize: 'vertical'
              }}
            />
            <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {exampleNaturalQueries.map((eq, idx) => (
                <button
                  key={idx}
                  onClick={() => setNaturalQuery(eq)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.05)',
                    color: theme?.text || '#f8fafc',
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                >
                  範例 {idx + 1}
                </button>
              ))}
            </div>
            <button
              onClick={executeNaturalQuery}
              disabled={isLoading || !naturalQuery}
              style={{
                marginTop: 16,
                padding: '12px 32px',
                borderRadius: 12,
                border: 'none',
                background: isLoading || !naturalQuery ? 'rgba(255,255,255,0.2)' : (theme?.accent || '#00c6ff'),
                color: '#fff',
                fontWeight: 600,
                cursor: isLoading || !naturalQuery ? 'not-allowed' : 'pointer',
                fontSize: 16
              }}
            >
              {isLoading ? 'AI 分析中...' : '執行查詢'}
            </button>
          </>
        )}
      </GlassCard>

      {/* Results */}
      {error && (
        <GlassCard theme={theme}>
          <div style={{ color: '#ff6b6b', fontWeight: 600 }}>❌ 錯誤</div>
          <div style={{ color: '#ff6b6b', marginTop: 8 }}>{error}</div>
        </GlassCard>
      )}

      {result && (
        <GlassCard theme={theme}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: theme?.accent || '#00c6ff' }}>
              查詢結果
            </h3>
            <div style={{ color: theme?.text || '#f8fafc', opacity: 0.7, fontSize: 14 }}>
              {result.rowCount} 筆 · {result.executionTime.toFixed(2)}ms
            </div>
          </div>
          
          {mode === 'natural' && (
            <div style={{ 
              marginBottom: 16, 
              padding: '1rem', 
              borderRadius: 12, 
              background: 'rgba(0,0,0,0.3)',
              fontFamily: 'monospace',
              fontSize: 14,
              color: '#00c6ff'
            }}>
              生成的 SQL: {result.query}
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {result.rows.length > 0 && Object.keys(result.rows[0]).map((key) => (
                    <th key={key} style={{
                      padding: '12px',
                      textAlign: 'left',
                      borderBottom: '2px solid rgba(255,255,255,0.1)',
                      color: theme?.accent || '#00c6ff',
                      fontWeight: 600
                    }}>
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, idx) => (
                  <tr key={idx}>
                    {Object.values(row).map((value: any, vidx) => (
                      <td key={vidx} style={{
                        padding: '12px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        color: theme?.text || '#f8fafc'
                      }}>
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Tables */}
      {tables.length > 0 && (
        <GlassCard theme={theme}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: theme?.accent || '#00c6ff', marginBottom: 16 }}>
            可用資料表
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {tables.map((table) => (
              <div key={table} style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: 'rgba(0,198,255,0.1)',
                border: '1px solid rgba(0,198,255,0.3)',
                color: theme?.accent || '#00c6ff',
                fontSize: 14,
                fontWeight: 600
              }}>
                {table}
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
