import { NextRequest, NextResponse } from 'next/server';
import { detectEmotionFromText } from '@/lib/emotion';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const text: string = body.text || '';
        const result = await detectEmotionFromText(text);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Emotion detect error:', error);
        return NextResponse.json({ emotion: 'neutral', confidence: 0.0, reason: 'Detection failed', source: 'fallback' }, { status: 500 });
    }
}
