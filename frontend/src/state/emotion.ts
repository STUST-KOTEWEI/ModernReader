import { create } from 'zustand';

export type EmotionMood = 'happy' | 'curious' | 'stressed' | 'tired';

interface EmotionState {
  current: EmotionMood;
  source: 'camera' | 'text' | 'manual' | 'unknown';
  lastUpdated: number | null;
  setEmotion: (mood: EmotionMood, source?: EmotionState['source']) => void;
}

export const useEmotionStore = create<EmotionState>((set) => ({
  current: 'curious',
  source: 'unknown',
  lastUpdated: null,
  setEmotion: (mood, source = 'manual') => set({ current: mood, source, lastUpdated: Date.now() })
}));

export function mapFaceExpressionToMood(expr: string): EmotionMood {
  const e = expr.toLowerCase();
  if (e === 'happy' || e === 'joyful') return 'happy';
  if (e === 'surprised' || e === 'curious' || e === 'neutral') return 'curious';
  if (e === 'sad' || e === 'tired') return 'tired';
  if (e === 'angry' || e === 'fearful' || e === 'disgusted' || e === 'stressed') return 'stressed';
  return 'curious';
}
