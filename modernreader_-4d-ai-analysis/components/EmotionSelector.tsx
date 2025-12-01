import React, { useMemo } from 'react';
import { listEmotionTitles } from '../services/emotionPromptService';

interface EmotionSelectorProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  className?: string;
}

export const EmotionSelector: React.FC<EmotionSelectorProps> = ({ value, onChange, className }) => {
  const [titles, error] = useMemo(() => {
    try {
      const list: string[] = listEmotionTitles();
      return [list, null] as const;
    } catch (e) {
      console.warn('Emotion prompt service not available:', e);
      return [[], e instanceof Error ? e.message : 'Unknown error'] as const;
    }
  }, []);

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-300 mb-1">情緒風格</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        <option value="">不指定（原生風格）</option>
        {titles.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400 mt-1">無法載入情緒庫：{error}</p>}
    </div>
  );
};

export default EmotionSelector;
