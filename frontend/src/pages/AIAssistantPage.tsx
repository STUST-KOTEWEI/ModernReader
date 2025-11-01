/**
 * 世界級 AI 助手頁面
 * 支援：多模態理解、RAG 查詢、認知負荷自適應
 */
import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api/v1';

interface AIResponse {
  content: string;
  provider: string;
  tokens_used: number;
}

interface RAGResponse {
  answer: string;
  snippets: Array<{
    text: string;
    source: string;
    score: number;
  }>;
  generated_at: string;
}

export const AIAssistantPage: React.FC = () => {
  // ===== 多模態理解 =====
  const [understandInput, setUnderstandInput] = useState('');
  const [understandResult, setUnderstandResult] = useState<AIResponse | null>(null);
  const [understandLoading, setUnderstandLoading] = useState(false);

  // ===== 認知負荷自適應生成 =====
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [cognitiveLoad, setCognitiveLoad] = useState(0.5);
  const [generateResult, setGenerateResult] = useState<string | null>(null);
  const [generateLoading, setGenerateLoading] = useState(false);

  // ===== RAG 系統 =====
  const [ragQuery, setRagQuery] = useState('');
  const [ragResult, setRagResult] = useState<RAGResponse | null>(null);
  const [ragLoading, setRagLoading] = useState(false);

  // ===== 文檔嵌入 =====
  const [ingestContent, setIngestContent] = useState('');
  const [ingestTitle, setIngestTitle] = useState('');
  const [ingestStatus, setIngestStatus] = useState<string | null>(null);

  // 處理多模態理解
  const handleUnderstand = async () => {
    if (!understandInput.trim()) return;
    
    setUnderstandLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/ai/understand`, {
        text: understandInput,
        context: {
          cognitive_load: cognitiveLoad,
          language: 'zh-TW'
        }
      });
      setUnderstandResult(response.data);
    } catch (error) {
      console.error('理解失敗:', error);
      alert('理解失敗，請檢查 API Key 是否設定');
    } finally {
      setUnderstandLoading(false);
    }
  };

  // 處理認知負荷自適應生成
  const handleGenerate = async () => {
    if (!generatePrompt.trim()) return;
    
    setGenerateLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/ai/generate`, {
        prompt: generatePrompt,
        cognitive_load: cognitiveLoad,
        cultural_context: {
          language: 'zh-TW'
        }
      });
      setGenerateResult(response.data.content);
    } catch (error) {
      console.error('生成失敗:', error);
      alert('生成失敗，請檢查 API Key 是否設定');
    } finally {
      setGenerateLoading(false);
    }
  };

  // 處理 RAG 查詢
  const handleRAGQuery = async () => {
    if (!ragQuery.trim()) return;
    
    setRagLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/ai/rag/query`, {
        query: ragQuery,
        language: 'zh-TW',
        top_k: 5
      });
      setRagResult(response.data);
    } catch (error) {
      console.error('RAG 查詢失敗:', error);
      alert('RAG 查詢失敗');
    } finally {
      setRagLoading(false);
    }
  };

  // 處理文檔嵌入
  const handleIngest = async () => {
    if (!ingestContent.trim() || !ingestTitle.trim()) {
      alert('請填寫標題和內容');
      return;
    }
    
    try {
      const response = await axios.post(`${API_BASE}/ai/rag/ingest`, {
        content: ingestContent,
        document_id: `doc_${Date.now()}`,
        title: ingestTitle,
        language: 'zh-TW'
      });
      setIngestStatus(`✅ 嵌入成功！Job ID: ${response.data.job_id}`);
      setTimeout(() => setIngestStatus(null), 5000);
    } catch (error) {
      console.error('嵌入失敗:', error);
      setIngestStatus('❌ 嵌入失敗');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ 
        fontSize: '32px', 
        fontWeight: 'bold', 
        marginBottom: '30px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        🧠 世界級 AI 助手
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* ===== 多模態理解區域 ===== */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '15px' }}>
            💬 多模態理解
          </h2>
          <textarea
            value={understandInput}
            onChange={(e) => setUnderstandInput(e.target.value)}
            placeholder="輸入任何問題，AI 會理解並回答..."
            style={{
              width: '100%',
              height: '120px',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid #e2e8f0',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
          <button
            onClick={handleUnderstand}
            disabled={understandLoading}
            style={{
              marginTop: '10px',
              padding: '10px 20px',
              background: understandLoading ? '#cbd5e0' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: understandLoading ? 'not-allowed' : 'pointer',
              fontWeight: '600'
            }}
          >
            {understandLoading ? '理解中...' : '🚀 理解'}
          </button>

          {understandResult && (
            <div style={{
              marginTop: '15px',
              padding: '15px',
              background: '#f7fafc',
              borderRadius: '8px',
              borderLeft: '4px solid #667eea'
            }}>
              <div style={{ fontSize: '12px', color: '#718096', marginBottom: '8px' }}>
                Provider: {understandResult.provider} | Tokens: {understandResult.tokens_used}
              </div>
              <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                {understandResult.content}
              </div>
            </div>
          )}
        </div>

        {/* ===== 認知負荷自適應生成 ===== */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '15px' }}>
            🎯 認知負荷自適應
          </h2>
          <textarea
            value={generatePrompt}
            onChange={(e) => setGeneratePrompt(e.target.value)}
            placeholder="輸入生成提示詞..."
            style={{
              width: '100%',
              height: '80px',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid #e2e8f0',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
          
          <div style={{ marginTop: '10px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '5px' }}>
              認知負荷: {cognitiveLoad.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={cognitiveLoad}
              onChange={(e) => setCognitiveLoad(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ fontSize: '12px', color: '#718096', marginTop: '5px' }}>
              {cognitiveLoad < 0.3 && '低負荷：挑戰性內容'}
              {cognitiveLoad >= 0.3 && cognitiveLoad < 0.7 && '中負荷：平衡內容'}
              {cognitiveLoad >= 0.7 && '高負荷：簡化內容'}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generateLoading}
            style={{
              marginTop: '10px',
              padding: '10px 20px',
              background: generateLoading ? '#cbd5e0' : '#764ba2',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: generateLoading ? 'not-allowed' : 'pointer',
              fontWeight: '600'
            }}
          >
            {generateLoading ? '生成中...' : '✨ 生成'}
          </button>

          {generateResult && (
            <div style={{
              marginTop: '15px',
              padding: '15px',
              background: '#faf5ff',
              borderRadius: '8px',
              borderLeft: '4px solid #764ba2'
            }}>
              <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                {generateResult}
              </div>
            </div>
          )}
        </div>

        {/* ===== RAG 查詢區域 ===== */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '15px' }}>
            🔍 RAG 智能搜尋
          </h2>
          <input
            type="text"
            value={ragQuery}
            onChange={(e) => setRagQuery(e.target.value)}
            placeholder="搜尋知識庫..."
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid #e2e8f0',
              fontSize: '14px'
            }}
          />
          <button
            onClick={handleRAGQuery}
            disabled={ragLoading}
            style={{
              marginTop: '10px',
              padding: '10px 20px',
              background: ragLoading ? '#cbd5e0' : '#48bb78',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: ragLoading ? 'not-allowed' : 'pointer',
              fontWeight: '600'
            }}
          >
            {ragLoading ? '搜尋中...' : '🔎 搜尋'}
          </button>

          {ragResult && (
            <div style={{ marginTop: '15px' }}>
              <div style={{
                padding: '15px',
                background: '#f0fff4',
                borderRadius: '8px',
                borderLeft: '4px solid #48bb78',
                marginBottom: '15px'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                  📝 答案
                </div>
                <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  {ragResult.answer}
                </div>
              </div>

              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>
                📚 來源片段
              </div>
              {ragResult.snippets.map((snippet, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px',
                    background: '#f7fafc',
                    borderRadius: '6px',
                    marginBottom: '8px',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ color: '#718096', marginBottom: '4px' }}>
                    {snippet.source} (相似度: {(snippet.score * 100).toFixed(1)}%)
                  </div>
                  <div>{snippet.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== 文檔嵌入區域 ===== */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '15px' }}>
            📥 文檔嵌入
          </h2>
          <input
            type="text"
            value={ingestTitle}
            onChange={(e) => setIngestTitle(e.target.value)}
            placeholder="文檔標題"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid #e2e8f0',
              fontSize: '14px',
              marginBottom: '10px'
            }}
          />
          <textarea
            value={ingestContent}
            onChange={(e) => setIngestContent(e.target.value)}
            placeholder="文檔內容..."
            style={{
              width: '100%',
              height: '120px',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid #e2e8f0',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
          <button
            onClick={handleIngest}
            style={{
              marginTop: '10px',
              padding: '10px 20px',
              background: '#ed8936',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            📤 嵌入到知識庫
          </button>

          {ingestStatus && (
            <div style={{
              marginTop: '15px',
              padding: '12px',
              background: ingestStatus.includes('✅') ? '#f0fff4' : '#fff5f5',
              borderRadius: '8px',
              fontSize: '14px'
            }}>
              {ingestStatus}
            </div>
          )}
        </div>

      </div>

      {/* ===== 系統狀態 ===== */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: '#edf2f7',
        borderRadius: '8px',
        fontSize: '13px',
        color: '#4a5568'
      }}>
        🟢 後端運行中：http://127.0.0.1:8001 | 
        📚 Swagger UI：<a href="http://127.0.0.1:8001/docs" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>
          http://127.0.0.1:8001/docs
        </a>
      </div>
    </div>
  );
};
