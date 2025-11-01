import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ragClient, cognitiveClient, advancedRecommenderClient } from '../services/api';
import { useI18n } from '../i18n/useI18n';
import { Button, Card } from '../design-system';

export const AIAssistantDemoPage: React.FC = () => {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [cognitiveLoad, setCognitiveLoad] = useState<number | null>(null);

  const handleRAGQuery = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await ragClient.query({ query, language: 'zh' });
      setAnswer(response.answer || 'No answer found');
    } catch (err) {
      setAnswer('Error: Unable to fetch answer');
    } finally {
      setLoading(false);
    }
  };

  const handleAssessCognitiveLoad = async () => {
    setLoading(true);
    try {
      const response = await cognitiveClient.assessLoad({
        user_id: 'demo-user',
        reading_speed: 180,
        error_rate: 0.05,
        pause_frequency: 5.0
      });
      setCognitiveLoad(response.cognitive_load);
    } catch (err) {
      console.error('Failed to assess cognitive load', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">{t('aiAssistant')}</h1>

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
      <Card title={t('cognitiveLoad')}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Assess your current cognitive load based on reading behavior
          </p>
          <Button onClick={handleAssessCognitiveLoad} disabled={loading}>
            Assess Load
          </Button>

          {cognitiveLoad !== null && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded">
              <p className="font-semibold">
                Current Load: {(cognitiveLoad * 100).toFixed(0)}%
              </p>
              <p className="text-sm mt-1">
                {cognitiveLoad < 0.4 ? t('underload') : cognitiveLoad > 0.7 ? t('overload') : t('optimalLoad')}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
