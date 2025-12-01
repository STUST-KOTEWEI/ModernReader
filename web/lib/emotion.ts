import type { EmotionType } from "@/types/user";

type Detection = { emotion: EmotionType; confidence: number; reason: string; source: 'model' | 'heuristic' };

const KEYWORD_EMOTION_MAP: Record<string, EmotionType> = {
    happy: 'joy',
    joy: 'joy',
    excited: 'joy',
    love: 'joy',
    sad: 'sadness',
    down: 'sadness',
    upset: 'sadness',
    angry: 'anger',
    mad: 'anger',
    rage: 'anger',
    scared: 'fear',
    anxious: 'fear',
    worry: 'fear',
    surprise: 'surprise',
    shocked: 'surprise',
    disgust: 'disgust',
    gross: 'disgust',
};

function heuristicDetect(text: string): Detection {
    const lower = text.toLowerCase();
    for (const key of Object.keys(KEYWORD_EMOTION_MAP)) {
        if (lower.includes(key)) {
            const emotion = KEYWORD_EMOTION_MAP[key];
            return {
                emotion,
                confidence: 0.74,
                reason: `Keyword "${key}" detected.`,
                source: 'heuristic',
            };
        }
    }
    if (lower.includes('!') || lower.includes('great')) {
        return { emotion: 'joy', confidence: 0.62, reason: 'Upbeat wording detected.', source: 'heuristic' };
    }
    if (lower.includes('tired') || lower.includes('stressed')) {
        return { emotion: 'fear', confidence: 0.58, reason: 'Stress terms detected.', source: 'heuristic' };
    }
    return { emotion: 'neutral', confidence: 0.35, reason: 'No strong cues; default neutral.', source: 'heuristic' };
}

async function modelDetect(text: string): Promise<Detection | null> {
    try {
        const { pipeline } = await import('@xenova/transformers');
        const classifier = await pipeline('text-classification', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
        const outputs = await classifier(text.slice(0, 1000), { topk: 2 });
        const arr = Array.isArray(outputs) ? outputs : [outputs];
        const top = (arr[0] ?? null) as { label?: string; score?: number } | null;
        if (!top?.label) return null;
        const label = top.label.toLowerCase();
        const score = top.score ?? 0.5;
        const emotion: EmotionType = label.includes('1') || label.includes('positive') ? 'joy' : 'sadness';
        return {
            emotion,
            confidence: Math.max(0.5, Math.min(0.95, score)),
            reason: `Model label: ${top.label}`,
            source: 'model',
        };
    } catch (error) {
        console.error('Model emotion detection failed', error);
        return null;
    }
}

export async function detectEmotionFromText(text: string): Promise<Detection> {
    const modelGuess = await modelDetect(text);
    if (modelGuess) return modelGuess;
    return heuristicDetect(text);
}
