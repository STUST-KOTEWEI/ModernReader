import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/huggingface';
import { getPersona } from '@/lib/personas';

export async function POST(req: NextRequest) {
    try {
        const { message, history, persona = 'universal_guide', userEmotion = 'neutral' } = await req.json();

        // Get persona-specific system prompt
        const personaObj = getPersona(persona);
        const basePrompt = personaObj.systemPrompt;
        const emotionEnhancedPrompt = `${basePrompt}\n\nThe user is feeling ${userEmotion}. Respond with empathy.`;

        // Build conversation context
        const conversationHistory = (history || [])
            .slice(-3) // Last 3 messages for context
            .map((msg: { role: string; content: string }) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
            .join('\n');

        const fullPrompt = conversationHistory
            ? `${conversationHistory}\nUser: ${message}\nAssistant:`
            : `User: ${message}\nAssistant:`;

        // Generate response using Hugging Face
        const result = await generateText(fullPrompt, emotionEnhancedPrompt);

        return NextResponse.json({
            response: result.text,
            isMock: result.isMock,
            persona,
            userEmotion,
            provider: 'Hugging Face (Free)'
        });
    } catch (error) {
        console.error('Chat error:', error);
        return NextResponse.json(
            { error: 'Failed to get response' },
            { status: 500 }
        );
    }
}
