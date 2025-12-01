import prompts from '../data/emotionPrompts.json';
import type { EmotionPrompt } from '../types';

// Cast JSON import to typed array
const EMOTION_PROMPTS = prompts as EmotionPrompt[];

// Helper: strip corner quotes 「」 and extra quotes/spaces
function sanitize(text: string): string {
  return (text || '')
    .replace(/[「」]/g, '')
    .replace(/^\s+|\s+$/g, '')
    .trim();
}

// Helper: normalize title for search (remove numeric prefix and punctuation)
function normalizeTitle(title: string): string {
  return (title || '')
    .replace(/^\d+\.?\s*/u, '') // drop leading index like "001. "
    .replace(/[()（）]/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
}

export function getAllEmotionPrompts(): EmotionPrompt[] {
  return EMOTION_PROMPTS;
}

export function listEmotionTitles(): string[] {
  return EMOTION_PROMPTS.map(p => p.emotion_title);
}

export function getEmotionByIndex(index: number): EmotionPrompt | null {
  if (index < 0 || index >= EMOTION_PROMPTS.length) return null;
  return EMOTION_PROMPTS[index];
}

export function findEmotion(query: string): EmotionPrompt | null {
  const q = normalizeTitle(query);
  if (!q) return null;
  // exact match by normalized title
  let found = EMOTION_PROMPTS.find(p => normalizeTitle(p.emotion_title) === q);
  if (found) return found;
  // substring match
  found = EMOTION_PROMPTS.find(p => normalizeTitle(p.emotion_title).includes(q));
  if (found) return found;
  // keyword fallback
  return EMOTION_PROMPTS.find(p => (p.keywords || '').toLowerCase().includes(q)) || null;
}

export function buildEmotionImagePrompt(basePrompt: string, emotion: string | number): string {
  const item: EmotionPrompt | null =
    typeof emotion === 'number' ? getEmotionByIndex(emotion) : findEmotion(String(emotion));

  const combined = item ? sanitize(item.combined_prompt) : '';
  const glue = basePrompt && combined ? ' | ' : '';
  return `${basePrompt || ''}${glue}${combined}`.trim();
}

export function getPromptDetails(emotion: string | number): EmotionPrompt | null {
  return typeof emotion === 'number' ? getEmotionByIndex(emotion) : findEmotion(String(emotion));
}
