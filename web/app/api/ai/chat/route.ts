import { NextRequest, NextResponse } from 'next/server';
import { openai, isOpenAIConfigured } from '@/lib/openai';
import { getPersona } from '@/lib/personas';

export async function POST(req: NextRequest) {
    try {
        const { message, history, personaId } = await req.json();
        const persona = getPersona(personaId || 'universal_guide');

        // If OpenAI is not configured, return enhanced mock response
        if (!isOpenAIConfigured()) {
            await new Promise(resolve => setTimeout(resolve, 800));

            let mockResponse = "";
            if (persona.id === 'nature_spirit') {
                mockResponse = "The wind whispers secrets of the old world. Can you hear them? The trees remember what was written long before ink touched paper.";
            } else if (persona.id === 'playful_companion') {
                mockResponse = "Wow! That's so interesting! 🌟 Tell me more! I love learning new things! 🐾";
            } else {
                mockResponse = "I hear you. Knowledge is a river that flows through all of us. Let us explore this thought together.";
            }

            return NextResponse.json({
                response: mockResponse,
                isMock: true
            });
        }

        // Build conversation history
        const messages = [
            {
                role: "system" as const,
                content: persona.systemPrompt
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
