import { useEffect, useState } from "react";

import { recommendationClient, aiClient, catalogLookup } from "../services/api";
import { useI18n } from "../i18n/useI18n";

interface RecItem {
  content_id: string;
  confidence: number;
}

export const RecommendationPanel = () => {
  const { t } = useI18n();
  const [recommendations, setRecommendations] = useState<RecItem[]>([]);
  const [emotionText, setEmotionText] = useState<string>("");
  const [emotion, setEmotion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      let detected: string | undefined = undefined;
      if (emotionText.trim()) {
        const res = await aiClient.analyzeEmotion({ text: emotionText.trim() });
        setEmotion(res.top_emotion);
        detected = res.top_emotion;
      }
      const resp = await recommendationClient.getRecommendations({ user_id: "demo-user", emotion_state: detected });
      const list: RecItem[] = (resp.recommendations || []).map((r: any) => ({ 
        content_id: r.content_id, 
        confidence: r.confidence ?? r.overall_score ?? 0.5 
      }));
      setRecommendations(list);
    } catch (e) {
      console.error(e);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <section className="panel">
      <h3>{t('recommendedForYou')}</h3>

      <div className="mb-3">
        <label className="block text-xs text-gray-500 mb-1">{t('textEmotionAnalysis')}</label>
        <textarea
          className="w-full border rounded p-2 text-sm"
          rows={2}
          placeholder={t('pasteOrTypeText')}
          value={emotionText}
          onChange={(e) => setEmotionText(e.target.value)}
        />
        <div className="flex items-center gap-2 mt-2">
          <button className="px-3 py-1.5 bg-gray-100 rounded" onClick={refresh} disabled={loading}>{t('refresh')}</button>
          {emotion && (
            <span className="text-xs text-gray-600">{t('topEmotion')}: <strong>{emotion}</strong></span>
          )}
        </div>
      </div>

      <ul>
        {recommendations.map((item) => (
          <li key={item.content_id}>
            <RecommendedRow id={item.content_id} confidence={item.confidence} />
          </li>
        ))}
      </ul>
    </section>
  );
};

const RecommendedRow: React.FC<{ id: string; confidence: number }> = ({ id, confidence }) => {
  const [title, setTitle] = useState<string>(id);
  const [meta, setMeta] = useState<{ author?: string; isbn?: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    catalogLookup(id)
      .then((b: any) => {
        if (!mounted) return;
        setTitle(b?.title || id);
        setMeta({ author: (b?.authors && b.authors[0]) || undefined, isbn: b?.metadata?.isbn });
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [id]);

  return (
    <div className="panel-item">
      <strong>{title}</strong>
      <span className="text-xs text-gray-500">{meta?.author}</span>
      <small>Confidence: {(confidence * 100).toFixed(0)}%</small>
    </div>
  );
};
