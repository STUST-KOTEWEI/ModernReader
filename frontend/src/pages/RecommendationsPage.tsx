import React, { useState, useEffect } from 'react';
import { advancedRecommenderClient } from '../services/api';
import { useI18n } from '../i18n/useI18n';
import { Button, Card } from '../design-system';

interface Recommendation {
  item_id: string;
  title: string;
  score: number;
  explanation?: string;
  imageUrl?: string;
  description?: string;
}

export const RecommendationsPage: React.FC = () => {
  const { t } = useI18n();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [objectives, setObjectives] = useState<any[]>([]);
  const [selected, setSelected] = useState<Recommendation | null>(null);
  const [emotion, setEmotion] = useState<string>('curious');

  useEffect(() => {
    loadObjectives();
  }, []);

  const loadObjectives = async () => {
    try {
      const response = await advancedRecommenderClient.getObjectives();
      setObjectives(response.objectives || []);
    } catch (err) {
      console.error('Failed to load objectives', err);
    }
  };

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const response = await advancedRecommenderClient.recommend({
        user_id: 'demo-user',
        context: { emotion },
        objectives: [
          { name: 'relevance', weight: 0.4 },
          { name: 'difficulty_match', weight: 0.3 },
          { name: 'novelty', weight: 0.3 }
        ],
        limit: 5
      });
      const recs: Recommendation[] = (response.recommendations || []).map((r: any, idx: number) => ({
        item_id: r.item_id,
        title: r.title,
        score: r.score,
        explanation: r.explanation,
        imageUrl: r.imageUrl || null,
        description: r.description || r.explanation || ''
      }));
      // attach simple placeholders if no image
      const placeholders = [
        '📘','📙','📗','📕','📓'
      ];
      setRecommendations(
        recs.map((r, i) => ({
          ...r,
          imageUrl: r.imageUrl || `emoji:${placeholders[i % placeholders.length]}`
        }))
      );
    } catch (err) {
      console.error('Failed to load recommendations', err);
      // Fallback mock data
      setRecommendations([
        { item_id: '1', title: 'Quantum Computing Basics', score: 0.85, explanation: 'Matches your interest in physics', imageUrl: 'emoji:📘', description: 'A gentle intro to quantum information.' },
        { item_id: '2', title: 'Introduction to AI', score: 0.78, explanation: 'Popular in your learning path', imageUrl: 'emoji:🤖', description: 'Core concepts and history of AI.' },
        { item_id: '3', title: 'Culture and Language', score: 0.72, explanation: 'Aligns with multilingual goals', imageUrl: 'emoji:🌏', description: 'Exploring culture in multilingual settings.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <h1 className="text-3xl font-bold">{t('recommendedForYou')}</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-300">
            {t('emotion')}
          </label>
          <select
            value={emotion}
            onChange={(e) => setEmotion(e.target.value)}
            className="px-3 py-2 border rounded"
            aria-label={t('emotion')}
          >
            <option value="happy">{t('moodHappy')}</option>
            <option value="curious">{t('moodCurious')}</option>
            <option value="stressed">{t('moodStressed')}</option>
            <option value="tired">{t('moodTired')}</option>
          </select>
          <Button onClick={loadRecommendations} disabled={loading}>
          {loading ? t('loading') : t('refresh')}
          </Button>
        </div>
      </div>

      {objectives.length > 0 && (
        <Card title={t('availableObjectives')}>
          <div className="flex flex-wrap gap-2">
            {objectives.map((obj: any, idx: number) => (
              <span key={idx} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                {obj.name}
              </span>
            ))}
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {recommendations.length === 0 && !loading && (
          <Card>
            <p className="text-gray-500">{t('clickRefreshToLoad')}</p>
          </Card>
        )}

        {recommendations.map((rec) => (
          <Card key={rec.item_id}>
            <div className="flex items-start">
              {/* Thumbnail */}
              <div className="w-16 h-20 mr-4 flex items-center justify-center rounded border bg-gray-50 dark:bg-gray-700 overflow-hidden">
                {rec.imageUrl?.startsWith('emoji:') ? (
                  <span className="text-2xl">{rec.imageUrl.replace('emoji:','')}</span>
                ) : (
                  <img src={rec.imageUrl} alt={rec.title} className="w-full h-full object-cover" />
                )}
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">{rec.title}</h3>
                {rec.explanation && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {rec.explanation}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {t('confidence')}: {(rec.score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <Button variant="secondary" className="ml-4" onClick={() => setSelected(rec)}>
                {t('viewDetails')}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-lg w-full p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="w-20 h-28 flex items-center justify-center rounded border bg-gray-50 dark:bg-gray-700 overflow-hidden">
                {selected.imageUrl?.startsWith('emoji:') ? (
                  <span className="text-3xl">{selected.imageUrl.replace('emoji:','')}</span>
                ) : (
                  <img src={selected.imageUrl} alt={selected.title} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-1">{selected.title}</h3>
                {selected.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{selected.description}</p>
                )}
                {selected.explanation && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{selected.explanation}</p>
                )}
              </div>
            </div>
            <div className="mt-4 text-right">
              <Button variant="secondary" onClick={() => setSelected(null)}>{t('close')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
