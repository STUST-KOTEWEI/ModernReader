import React, { useState, useEffect } from 'react';
import { advancedRecommenderClient } from '../services/api';
import { useI18n } from '../i18n/useI18n';
import { Button, Card } from '../design-system';

interface Recommendation {
  item_id: string;
  title: string;
  score: number;
  explanation?: string;
}

export const RecommendationsPage: React.FC = () => {
  const { t } = useI18n();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [objectives, setObjectives] = useState<any[]>([]);

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
        objectives: [
          { name: 'relevance', weight: 0.4 },
          { name: 'difficulty_match', weight: 0.3 },
          { name: 'novelty', weight: 0.3 }
        ],
        limit: 5
      });
      setRecommendations(response.recommendations || []);
    } catch (err) {
      console.error('Failed to load recommendations', err);
      // Fallback mock data
      setRecommendations([
        { item_id: '1', title: 'Quantum Computing Basics', score: 0.85, explanation: 'Matches your interest in physics' },
        { item_id: '2', title: 'Introduction to AI', score: 0.78, explanation: 'Popular in your learning path' },
        { item_id: '3', title: 'Culture and Language', score: 0.72, explanation: 'Aligns with multilingual goals' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('recommendedForYou')}</h1>
        <Button onClick={loadRecommendations} disabled={loading}>
          {loading ? t('loading') : 'Refresh'}
        </Button>
      </div>

      {objectives.length > 0 && (
        <Card title="Available Objectives">
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
            <p className="text-gray-500">Click "Refresh" to load recommendations</p>
          </Card>
        )}

        {recommendations.map((rec) => (
          <Card key={rec.item_id}>
            <div className="flex justify-between items-start">
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
              <Button variant="secondary" className="ml-4">
                {t('viewDetails')}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
