import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ragClient, cognitiveClient } from '../services/api';
import { useI18n } from '../i18n/useI18n';
import { Button, Card } from '../design-system';

export const AIAssistantDemoPage: React.FC = () => {
  const { t } = useI18n();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [cognitiveLoad, setCognitiveLoad] = useState<number | null>(null);
  const [speed, setSpeed] = useState(180);
  const [errorRate, setErrorRate] = useState(0.05);
  const [pauseFreq, setPauseFreq] = useState(5.0);
  const [error, setError] = useState<string | null>(null);
  const [ingestText, setIngestText] = useState('');
  const [ingestUrl, setIngestUrl] = useState('');
  const [ingestFile, setIngestFile] = useState<File | null>(null);
  const [kbDocs, setKbDocs] = useState<Array<{ name: string; size: number; type: string; language?: string; time: string }>>([]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qParam = params.get('q');
    if (qParam) setQuery(qParam);
    // Load KB docs from localStorage
    try {
      const raw = localStorage.getItem('mr_kb_docs');
      if (raw) setKbDocs(JSON.parse(raw));
    } catch {}
  }, [location.search]);

  const handleRAGQuery = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await ragClient.query({ query, language: 'zh' });
      setAnswer(response.answer || 'No answer found');
    } catch (err) {
      setAnswer('');
      setError('查詢失敗，請先加入一些內容或稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const handleAssessCognitiveLoad = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await cognitiveClient.assessLoad({
        user_id: 'demo-user',
        reading_speed: speed,
        error_rate: errorRate,
        pause_frequency: pauseFreq
      });
      setCognitiveLoad(response.cognitive_load);
    } catch (err) {
      console.error('Failed to assess cognitive load', err);
      setError('無法取得認知負荷，請稍後重試');
    } finally {
      setLoading(false);
    }
  };

  const handleIngest = async () => {
    if (!ingestText.trim() && !ingestUrl.trim() && !ingestFile) return;
    setLoading(true);
    setError(null);
    try {
      if (ingestText.trim()) {
        await ragClient.ingest({ content: ingestText, metadata: { source: 'user' } });
      }
      if (ingestUrl.trim()) {
        await ragClient.ingest({ content: ingestUrl, metadata: { source: 'url' } });
      }
      if (ingestFile) {
        let content = '';
        // Best-effort text extraction for text/*; otherwise store placeholder
        if (ingestFile.type.startsWith('text/')) {
          content = await ingestFile.text();
        } else {
          content = `uploaded_file:${ingestFile.name} (${ingestFile.type || 'binary'}, ${ingestFile.size} bytes)`;
        }
        await ragClient.ingest({
          content,
          metadata: {
            source: 'file_upload',
            filename: ingestFile.name,
            size: ingestFile.size,
            type: ingestFile.type || 'application/octet-stream'
          },
          collection_name: 'user_kb'
        });
        // Persist minimal doc info locally for demo visibility
        const entry = { name: ingestFile.name, size: ingestFile.size, type: ingestFile.type || 'file', time: new Date().toISOString() };
        const next = [entry, ...kbDocs].slice(0, 50);
        setKbDocs(next);
        try { localStorage.setItem('mr_kb_docs', JSON.stringify(next)); } catch {}
        setIngestFile(null);
      }
    } catch (err) {
      setError('加入內容失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleIngestSampleCatalog = async () => {
    setLoading(true);
    setError(null);
    try {
      await ragClient.ingestCatalog();
    } catch (err) {
      setError('匯入範例目錄失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">{t('aiAssistant')}</h1>

      {error && (
        <div className="p-3 rounded bg-red-100 text-red-800 border border-red-200">{error}</div>
      )}

      {/* Quick Ingest */}
      <Card title={t('searchKnowledge')}>
        <div className="space-y-3">
          <input
            className="w-full px-3 py-2 border rounded"
            placeholder="貼上網址（可選）"
            value={ingestUrl}
            onChange={(e) => setIngestUrl(e.target.value)}
          />
          <textarea
            className="w-full px-3 py-2 border rounded"
            placeholder="貼上文字、筆記或摘要（可選）"
            value={ingestText}
            onChange={(e) => setIngestText(e.target.value)}
            rows={3}
          />
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">上傳檔案（PDF/文字/圖片，可選）</label>
            <input
              type="file"
              accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.gif,.webp,.wav,.mp3,.m4a"
              onChange={(e) => setIngestFile(e.target.files?.[0] || null)}
              aria-label="Upload file to knowledge base"
              className="w-full px-3 py-2 border rounded"
            />
            {ingestFile && (
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                準備上傳：{ingestFile.name}（{(ingestFile.size/1024).toFixed(1)} KB）
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleIngest} disabled={loading}>加入到知識庫</Button>
            <Button variant="secondary" onClick={handleIngestSampleCatalog} disabled={loading}>匯入範例目錄</Button>
          </div>
        </div>
      </Card>

      {/* My Knowledge Base */}
      <Card title="我的知識庫">
        {kbDocs.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">目前尚無上傳的檔案或內容。可於上方加入文字、網址或上傳 PDF/文字檔。</p>
        ) : (
          <div className="space-y-3">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700 rounded border border-gray-200 dark:border-gray-700">
              {kbDocs.slice(0,10).map((d, idx) => (
                <li key={idx} className="p-3 flex items-center justify-between">
                  <div className="truncate">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{d.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{d.type || 'file'} · {(d.size/1024).toFixed(1)} KB · {new Date(d.time).toLocaleString()}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={() => { setKbDocs([]); try { localStorage.removeItem('mr_kb_docs'); } catch {} }}
              >清空清單</Button>
            </div>
          </div>
        )}
      </Card>

      {/* RAG Query Section */}
      <Card title={t('askQuestion')}>
        <div className="space-y-4">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('queryPlaceholder')}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500"
            rows={3}
          />
          <Button onClick={handleRAGQuery} disabled={loading}>
            {loading ? t('loading') : t('submit')}
          </Button>

          {answer && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <h3 className="font-semibold mb-2">{t('ragAnswer')}:</h3>
              <p>{answer}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Cognitive Load Assessment */}
      <Card title={t('assessCognitiveLoad')}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('cognitiveLoadDesc')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <label className="flex flex-col">
              <span>閱讀速度 (WPM): {speed}</span>
              <input type="range" min={80} max={300} value={speed} onChange={(e)=>setSpeed(parseInt(e.target.value))} />
            </label>
            <label className="flex flex-col">
              <span>錯誤率: {(errorRate*100).toFixed(0)}%</span>
              <input type="range" min={0} max={30} value={Math.round(errorRate*100)} onChange={(e)=>setErrorRate(parseInt(e.target.value)/100)} />
            </label>
            <label className="flex flex-col">
              <span>每分鐘停頓次數: {pauseFreq.toFixed(1)}</span>
              <input type="range" min={0} max={20} step={1} value={pauseFreq} onChange={(e)=>setPauseFreq(parseInt(e.target.value))} />
            </label>
          </div>
          <Button onClick={handleAssessCognitiveLoad} disabled={loading}>
            {t('assessLoad')}
          </Button>

          {cognitiveLoad !== null && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded">
              <h3 className="font-semibold mb-2">{t('cognitiveLoadResult')}</h3>
              <p className="font-semibold text-lg">
                {(cognitiveLoad * 100).toFixed(0)}%
              </p>
              <p className="text-sm mt-1">
                {t('cognitiveState')}: {cognitiveLoad < 0.4 ? t('underload') : cognitiveLoad > 0.7 ? t('overload') : t('optimalLoad')}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
