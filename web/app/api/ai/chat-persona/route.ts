import { NextRequest, NextResponse } from 'next/server';
import { openai, isOpenAIConfigured } from '@/lib/openai';
import { getPersonaPrompt, PersonaType } from '@/lib/personas';

export async function POST(req: NextRequest) {
    try {
        const { message, history, persona = 'Elder', userEmotion = 'neutral' } = await req.json();

        // If OpenAI is not configured, return mock response
        if (!isOpenAIConfigured()) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return NextResponse.json({
                response: `[${persona}] I sense you're feeling ${userEmotion}. That is a profound observation. In many indigenous cultures, the wind is seen as a messenger carrying the spirits of our ancestors.`,
                isMock: true
            });
        }

        // Get persona-specific system prompt and enhance with emotion awareness
        const basePrompt = getPersonaPrompt(persona as PersonaType);
        const emotionEnhancedPrompt = `${basePrompt}\n\nIMPORTANT: The user is currently feeling ${userEmotion}. Respond with empathy and adjust your tone accordingly. If they're sad, be comforting. If joyful, share in their happiness. If angry, be calming and understanding.`;

        // Build conversation history
        const messages = [
            {
                role: "system" as const,
                content: emotionEnhancedPrompt
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

        return NextResponse.json({ response, isMock: false, persona, userEmotion });
    } catch (error) {
        console.error('Chat error:', error);
        return NextResponse.json(
            { error: 'Failed to get response' },
            { status: 500 }
        );
    }
}
