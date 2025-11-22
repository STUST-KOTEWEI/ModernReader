import { NextRequest, NextResponse } from 'next/server';
import { openai, isOpenAIConfigured } from '@/lib/openai';

export async function POST(req: NextRequest) {
    try {
        const { message, history } = await req.json();

        // If OpenAI is not configured, return mock response
        if (!isOpenAIConfigured()) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return NextResponse.json({
                response: "That is a profound observation. In many indigenous cultures, the wind is seen as a messenger carrying the spirits of our ancestors. It connects the past with the present.",
                isMock: true
            });
        }

        // Build conversation history
        const messages = [
            {
                role: "system" as const,
                content: "You are a wise Tribal Elder sharing indigenous wisdom and folklore. Speak with warmth, depth, and cultural knowledge. Keep responses concise (2-3 sentences)."
            },
            ...(history || []).map((msg: { role: string; content: string }) => ({
                role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
                content: msg.content
            })),
            {
                role: "user" as const,
                content: message
            }
        ];

        // Real OpenAI call
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages,
            max_tokens: 150,
            temperature: 0.7,
        });

        const response = completion.choices[0]?.message?.content || "I cannot respond at this time.";

        return NextResponse.json({ response, isMock: false });
    } catch (error) {
        console.error('Chat error:', error);
        return NextResponse.json(
            { error: 'Failed to get response' },
            { status: 500 }
        );
    }
}
