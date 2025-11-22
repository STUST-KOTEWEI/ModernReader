/**
 * 世界級 AI 助手頁面
 * 支援：多模態理解、RAG 查詢、認知負荷自適應
 */
import React, { useEffect, useState } from 'react';
import { aiClient } from '../services/api';

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
  const [providers, setProviders] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('auto');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await aiClient.listProviders();
        if (!mounted) return;
        setProviders(list.filter((p) => p.available).map((p) => ({ id: p.id, label: p.label })));
      } catch (error) {
        console.warn('Failed to load provider list', error);
      }
      if (!mounted || typeof window === 'undefined') return;
      try {
        const saved = localStorage.getItem('mr_llm_provider');
        if (saved) {
          setSelectedProvider(saved);
        }
      } catch {}
    })();
    if (typeof window === 'undefined') {
      return () => {
        mounted = false;
      };
    }

    const sync = (event: StorageEvent) => {
      if (event.key === 'mr_llm_provider' && event.newValue) {
        setSelectedProvider(event.newValue);
      }
    };
    window.addEventListener('storage', sync);
    return () => {
      mounted = false;
      window.removeEventListener('storage', sync);
    };
  }, []);

  // 處理多模態理解
  const handleUnderstand = async () => {
    if (!understandInput.trim()) return;
    
    setUnderstandLoading(true);
    try {
      const response = await aiClient.understand({
        text: understandInput,
        context: { cognitive_load: cognitiveLoad, language: 'zh-TW' },
        provider: selectedProvider !== 'auto' ? selectedProvider : undefined,
      });
      setUnderstandResult(response);
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
      const response = await aiClient.generate({
        prompt: generatePrompt,
        cognitive_load: cognitiveLoad,
        cultural_context: { language: 'zh-TW' },
        provider: selectedProvider !== 'auto' ? selectedProvider : undefined,
      });
      setGenerateResult(response.content);
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
      const response = await aiClient.ragQuery({ query: ragQuery, language: 'zh-TW', top_k: 5 });
      setRagResult(response);
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
      const response = await aiClient.ragIngest({
        content: ingestContent,
        document_id: `doc_${Date.now()}`,
        title: ingestTitle,
        language: 'zh-TW'
      });
      setIngestStatus(`✅ 嵌入成功！Job ID: ${response.job_id}`);
      setTimeout(() => setIngestStatus(null), 5000);
    } catch (error) {
      console.error('嵌入失敗:', error);
      setIngestStatus('❌ 嵌入失敗');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🧠 世界級 AI 助手</h1>
      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm font-medium">LLM Provider</label>
        <select
          value={selectedProvider}
          onChange={(e) => {
            const value = e.target.value;
            setSelectedProvider(value);
            try {
              if (value === 'auto') {
                localStorage.removeItem('mr_llm_provider');
              } else {
                localStorage.setItem('mr_llm_provider', value);
              }
            } catch {}
          }}
          className="border border-gray-300 rounded px-2 py-1 text-sm"
        >
          <option value="auto">Auto</option>
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* 多模態理解 */}
        <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-3">💬 多模態理解</h2>
          <textarea
            value={understandInput}
            onChange={(e) => setUnderstandInput(e.target.value)}
            placeholder="輸入任何問題，AI 會理解並回答..."
            className="w-full h-28 border rounded p-2 bg-white dark:bg-gray-900"
          />
          <button
            onClick={handleUnderstand}
            disabled={understandLoading}
            className={`mt-2 px-4 py-2 rounded text-white ${understandLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {understandLoading ? '理解中...' : '🚀 理解'}
          </button>

          {understandResult && (
            <div className="mt-3 border rounded p-3 bg-gray-50 dark:bg-gray-900">
              <div className="text-xs text-gray-500 mb-1">
                Provider: {understandResult.provider} | Tokens: {understandResult.tokens_used}
              </div>
              <div className="whitespace-pre-wrap text-sm">{understandResult.content}</div>
            </div>
          )}
        </div>

        {/* 認知負荷自適應生成 */}
        <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-3">🎯 認知負荷自適應</h2>
          <textarea
            value={generatePrompt}
            onChange={(e) => setGeneratePrompt(e.target.value)}
            placeholder="輸入生成提示詞..."
            className="w-full h-28 border rounded p-2 bg-white dark:bg-gray-900"
          />

          <div className="mt-3">
            <label className="block text-sm mb-1">認知負荷: {cognitiveLoad.toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={cognitiveLoad}
              onChange={(e) => setCognitiveLoad(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">
              {cognitiveLoad < 0.3 && '低負荷：挑戰性內容'}
              {cognitiveLoad >= 0.3 && cognitiveLoad < 0.7 && '中負荷：平衡內容'}
              {cognitiveLoad >= 0.7 && '高負荷：簡化內容'}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generateLoading}
            className={`mt-2 px-4 py-2 rounded text-white ${generateLoading ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'}`}
          >
            {generateLoading ? '生成中...' : '✨ 生成'}
          </button>

          {generateResult && (
            <div className="mt-3 border rounded p-3 bg-gray-50 dark:bg-gray-900">
              <div className="whitespace-pre-wrap text-sm">{generateResult}</div>
            </div>
          )}
        </div>

        {/* RAG 查詢 */}
        <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-3">🔍 RAG 智能搜尋</h2>
          <label htmlFor="ragQueryInput" className="text-sm">搜尋知識庫</label>
          <input
            id="ragQueryInput"
            type="text"
            value={ragQuery}
            onChange={(e) => setRagQuery(e.target.value)}
            placeholder="搜尋知識庫..."
            title="搜尋知識庫"
            className="w-full border rounded p-2 mt-1 bg-white dark:bg-gray-900"
          />
          <button
            onClick={handleRAGQuery}
            disabled={ragLoading}
            className={`mt-2 px-4 py-2 rounded text-white ${ragLoading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {ragLoading ? '搜尋中...' : '🔎 搜尋'}
          </button>

          {ragResult && (
            <div className="mt-3">
              <div className="border rounded p-3 bg-gray-50 dark:bg-gray-900 mb-2">
                <div className="text-sm font-medium mb-1">📝 答案</div>
                <div className="whitespace-pre-wrap text-sm">{ragResult.answer}</div>
              </div>
              <div className="text-sm font-medium mb-1">📚 來源片段</div>
              {ragResult.snippets.map((snippet, idx) => (
                <div key={idx} className="border rounded p-2 mb-2 bg-gray-50 dark:bg-gray-900">
                  <div className="text-xs text-gray-500 mb-1">
                    {snippet.source} (相似度: {(snippet.score * 100).toFixed(1)}%)
                  </div>
                  <div className="text-sm">{snippet.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 文檔嵌入 */}
        <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-3">📥 文檔嵌入</h2>
          <label htmlFor="ingestTitleInput" className="text-sm">文檔標題</label>
          <input
            id="ingestTitleInput"
            type="text"
            value={ingestTitle}
            onChange={(e) => setIngestTitle(e.target.value)}
            placeholder="文檔標題"
            title="文檔標題"
            className="w-full border rounded p-2 mt-1 bg-white dark:bg-gray-900"
          />
          <textarea
            value={ingestContent}
            onChange={(e) => setIngestContent(e.target.value)}
            placeholder="文檔內容..."
            className="w-full h-28 border rounded p-2 mt-2 bg-white dark:bg-gray-900"
          />
          <button
            onClick={handleIngest}
            className="mt-2 px-4 py-2 rounded text-white bg-amber-600 hover:bg-amber-700"
          >
            📤 嵌入到知識庫
          </button>

          {ingestStatus && (
            <div className={`mt-2 border rounded p-2 ${ingestStatus.includes('✅') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {ingestStatus}
            </div>
          )}
        </div>
      </div>

      {/* 系統狀態 */}
      <div className="text-xs text-gray-500 mt-6">
        🟢 後端運行中：http://127.0.0.1:8001 |
        📚 Swagger UI：
        <a href="http://127.0.0.1:8001/docs" target="_blank" rel="noopener noreferrer" className="underline ml-1">
          http://127.0.0.1:8001/docs
        </a>
      </div>
    </div>
  );
};
