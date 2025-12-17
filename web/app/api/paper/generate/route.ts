import { NextRequest, NextResponse } from 'next/server';
import { openai, isOpenAIConfigured } from '@/lib/openai';

export async function POST(req: NextRequest) {
    try {
        const { text, topic, format = 'arXiv' } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'No text provided' }, { status: 400 });
        }

        // If OpenAI is not configured, return mock response
        if (!isOpenAIConfigured()) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            return NextResponse.json({
                paper: `# Mock Academic Paper\n\n## Abstract\n\nThis is a mock abstract generated because OpenAI is not configured.\n\n## Introduction\n\n...`,
                isMock: true
            });
        }

        // Truncate text if too long (approx 10k chars to stay within limits/cost)
        const truncatedText = text.substring(0, 15000);

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are an expert academic researcher and writer. Your task is to convert the provided source text into a high-quality academic paper in ${format} format.

${format === 'IEEE' ? `
Style: IEEE Transaction style.
Structure:
1. Title
2. Abstract
3. I. Introduction (Use Roman Numerals for sections)
4. II. Related Work
5. III. Methodology
6. IV. Experiments / Results
7. V. Conclusion
8. References (IEEE style: [1], [2])
Tone: Technical, concise, engineering-focused.
` : format === 'ACM' ? `
Style: ACM Conference Proceedings.
Structure:
1. Title
2. Abstract
3. CCS Concepts (Generate relevant CCS concepts)
4. Keywords
5. 1. Introduction
6. 2. Background
7. 3. System Design
8. 4. Evaluation
9. 5. Conclusion
10. References (ACM style)
Tone: Rigorous, computing-focused.
` : `
Style: arXiv Pre-print.
Structure:
1. Title
2. Abstract
3. Introduction
4. Methodology
5. Results
6. Conclusion
7. References
Tone: Formal, objective, suitable for broad scientific audience.
`}

Format the output in clean Markdown. Use LaTeX formatting for math equations if applicable (e.g., $E=mc^2$).
Ensure the tone is formal, objective, and suitable for publication.`
                },
                {
                    role: "user",
                    content: `Source Text:\n\n${truncatedText}\n\nTopic/Focus (optional): ${topic || 'General Analysis'}`
                }
            ],
            temperature: 0.7,
        });

        const paper = completion.choices[0]?.message?.content || "Paper generation failed.";

        return NextResponse.json({ paper, isMock: false });
    } catch (error) {
        console.error('Paper generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate paper' },
            { status: 500 }
        );
    }
}
