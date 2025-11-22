import { NextRequest, NextResponse } from 'next/server';
import { openai, isOpenAIConfigured } from '@/lib/openai';

const EMOTIONS = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'neutral'] as const;
export type Emotion = typeof EMOTIONS[number];

interface EmotionAnalysis {
    primary: Emotion;
    secondary?: Emotion;
    intensity: number; // 0-1
    confidence: number; // 0-1
    sentiment: 'positive' | 'negative' | 'neutral';
    sources: {
        textAnalysis: Emotion;
        sentimentScore: number;
        keyPhrases: string[];
    };
}

export async function POST(req: NextRequest) {
    try {
        const { text, voiceTone, context } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        // If OpenAI is not configured, return basic analysis
        if (!isOpenAIConfigured()) {
            return NextResponse.json({
                primary: 'neutral',
                intensity: 0.5,
                confidence: 0.5,
                sentiment: 'neutral',
                isMock: true
            });
        }

        // Multi-source emotion detection using GPT-4
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are an advanced emotion detection system. Analyze the text and respond with a JSON object containing:
{
  "primary": "one of: ${EMOTIONS.join(', ')}",
  "secondary": "optional secondary emotion",
  "intensity": 0.0-1.0,
  "confidence": 0.0-1.0,
  "sentiment": "positive/negative/neutral",
  "keyPhrases": ["array", "of", "emotional", "phrases"],
  "reasoning": "brief explanation"
}

Consider:
- Explicit emotional words
- Implicit emotional context
- Punctuation and capitalization
- Sentence structure and tone
${voiceTone ? `- Voice tone indicators: ${voiceTone}` : ''}
${context ? `- Conversation context: ${context}` : ''}`
                },
                {
                    role: "user",
                    content: text
                }
            ],
            response_format: { type: "json_object" },
            max_tokens: 200,
            temperature: 0.3,
        });

        const analysis = JSON.parse(completion.choices[0]?.message?.content || '{}');

        const result: EmotionAnalysis = {
            primary: EMOTIONS.includes(analysis.primary) ? analysis.primary : 'neutral',
            secondary: analysis.secondary && EMOTIONS.includes(analysis.secondary) ? analysis.secondary : undefined,
            intensity: analysis.intensity || 0.5,
            confidence: analysis.confidence || 0.8,
            sentiment: analysis.sentiment || 'neutral',
            sources: {
                textAnalysis: analysis.primary || 'neutral',
                sentimentScore: analysis.intensity || 0.5,
                keyPhrases: analysis.keyPhrases || []
            }
        };

        return NextResponse.json({
            ...result,
            reasoning: analysis.reasoning,
            isMock: false
        });
    } catch (error) {
        console.error('Enhanced emotion detection error:', error);
        return NextResponse.json(
            { error: 'Failed to detect emotion' },
            { status: 500 }
        );
    }
}
