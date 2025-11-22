import { NextRequest, NextResponse } from 'next/server';
import { openai, isOpenAIConfigured } from '@/lib/openai';

export async function POST(req: NextRequest) {
    try {
        const { prompt, style = 'indigenous folklore art' } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        // If OpenAI is not configured, return placeholder
        if (!isOpenAIConfigured()) {
            return NextResponse.json({
                imageUrl: 'https://via.placeholder.com/1024x1024/1a1a1a/fdfbf7?text=DALL-E+Image+Placeholder',
                isMock: true,
                message: 'Add OPENAI_API_KEY to enable real image generation'
            });
        }

        // Generate image using DALL-E 3
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: `${prompt}. Art style: ${style}. High quality, detailed, culturally respectful indigenous art.`,
            n: 1,
            size: "1024x1024",
            quality: "standard",
        });

        const imageUrl = response.data[0]?.url;

        if (!imageUrl) {
            throw new Error('No image URL returned');
        }

        return NextResponse.json({
            imageUrl,
            revisedPrompt: response.data[0]?.revised_prompt,
            isMock: false
        });
    } catch (error) {
        console.error('Image generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate image' },
            { status: 500 }
        );
    }
}
