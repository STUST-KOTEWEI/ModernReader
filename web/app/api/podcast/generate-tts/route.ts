import { NextRequest, NextResponse } from 'next/server';
import { openai, isOpenAIConfigured } from '@/lib/openai';

// Voice styles mapping
const VOICE_STYLES = {
    'Elder': 'onyx',      // Deep, wise voice
    'Youth': 'nova',      // Young, energetic
    'Teacher': 'alloy',   // Clear, instructive
    'Storyteller': 'fable', // Narrative, engaging
    'Historian': 'echo',  // Authoritative
    'Poet': 'shimmer',    // Melodic, expressive
    'Guide': 'alloy',     // Friendly, helpful
    'Narrator': 'onyx'    // Neutral, professional
} as const;

export async function POST(req: NextRequest) {
    try {
        const { text, voiceStyle = 'Elder' } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        // If OpenAI is not configured, return mock response
        if (!isOpenAIConfigured()) {
            return NextResponse.json({
                audioUrl: '/mock-audio.mp3',
                isMock: true,
                message: 'Using mock audio. Add OPENAI_API_KEY to enable real TTS.'
            });
        }

        // Select voice based on style
        const voice = VOICE_STYLES[voiceStyle as keyof typeof VOICE_STYLES] || 'alloy';

        // Generate speech using OpenAI TTS
        const mp3 = await openai.audio.speech.create({
            model: 'tts-1-hd',
            voice: voice,
            input: text,
            speed: 1.0,
        });

        // Convert to buffer
        const buffer = Buffer.from(await mp3.arrayBuffer());

        // Return audio file
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': buffer.length.toString(),
            },
        });
    } catch (error) {
        console.error('TTS generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate speech' },
            { status: 500 }
        );
    }
}
