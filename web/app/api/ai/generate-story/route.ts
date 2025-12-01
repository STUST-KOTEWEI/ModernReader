import { NextRequest, NextResponse } from 'next/server';
import { openai, isOpenAIConfigured } from '@/lib/openai';

export async function POST(req: NextRequest) {
    try {
        const { style } = await req.json();

        // If OpenAI is not configured, return mock response
        if (!isOpenAIConfigured()) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            return NextResponse.json({
                story: "Once upon a time, in a valley where the mist never lifted, a young hunter named Kaleb discovered a glowing stone...",
                isMock: true
            });
        }

        // Real OpenAI call
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a storyteller creating cultural folklore stories. Style: ${style || 'Elder'}. Keep stories under 100 words, mystical and culturally rich.`
                },
                {
                    role: "user",
                    content: "Generate a short cultural folklore story about nature and wisdom."
                }
            ],
            max_tokens: 200,
            temperature: 0.8,
        });

        const story = completion.choices[0]?.message?.content || "Story generation failed.";

        return NextResponse.json({ story, isMock: false });
    } catch (error) {
        console.error('Story generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate story' },
            { status: 500 }
        );
    }
}
