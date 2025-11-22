import { NextRequest, NextResponse } from 'next/server';
import { openai, isOpenAIConfigured } from '@/lib/openai';
import { generateText } from '@/lib/huggingface';
import type { RecommendationRequest, RecommendationResponse, BookRecommendation } from '@/types/user';

export async function POST(req: NextRequest) {
    try {
        const body: RecommendationRequest = await req.json();
        const { occupation, gender, age, emotion, interests, readingGoals, limit = 12 } = body;

        // Build recommendation prompt
        const prompt = `You are an expert book recommendation AI. Based on the following user profile, recommend ${limit} books that would be perfect for them:

User Profile:
- Occupation: ${occupation}
- Gender: ${gender}
- Age: ${age}
- Current Emotion: ${emotion || 'neutral'}
- Interests: ${interests.join(', ')}
- Reading Goals: ${readingGoals.join(', ')}

For each book recommendation, provide:
1. Book title
2. Author name
3. Brief reasoning (2-3 sentences) explaining why this book is perfect for this user
4. Match score (0-100) indicating how well it matches their profile

Format your response as a JSON array of objects with fields: title, author, reasoning, matchScore

Consider:
- Their professional development needs based on occupation
- Age-appropriate content and complexity
- Their current emotional state
- Their stated interests and reading goals
- Books that will genuinely help them grow or enjoy

Return ONLY the JSON array, no other text.`;

        let recommendations: BookRecommendation[] = [];
        let summary = '';

        // Try OpenAI first
        if (isOpenAIConfigured()) {
            try {
                const completion = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a professional book recommendation expert. Always respond with valid JSON arrays only.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.8,
                });

                const content = completion.choices[0]?.message?.content || '[]';
                const parsed = JSON.parse(content);

                recommendations = parsed.map((rec: any) => ({
                    book: {
                        key: `/works/${rec.title.replace(/\s+/g, '_')}`,
                        title: rec.title,
                        authors: [{ name: rec.author }],
                        subject: interests,
                    },
                    reasoning: rec.reasoning,
                    matchScore: rec.matchScore || 85
                }));

                summary = `Based on your profile as a ${age}-year-old ${occupation} interested in ${interests.slice(0, 3).join(', ')}, we've curated these ${recommendations.length} books to help you achieve your goals.`;
            } catch (error) {
                console.error('OpenAI recommendation error:', error);
                // Fall through to HuggingFace
            }
        }

        // Fallback to HuggingFace or mock
        if (recommendations.length === 0) {
            const hfResult = await generateText(prompt);

            if (!hfResult.isMock) {
                try {
                    const parsed = JSON.parse(hfResult.text);
                    recommendations = parsed.map((rec: any) => ({
                        book: {
                            key: `/works/${rec.title.replace(/\s+/g, '_')}`,
                            title: rec.title,
                            authors: [{ name: rec.author }],
                            subject: interests,
                        },
                        reasoning: rec.reasoning,
                        matchScore: rec.matchScore || 80
                    }));
                } catch {
                    // Use mock recommendations
                    recommendations = getMockRecommendations(occupation, interests, limit);
                }
            } else {
                recommendations = getMockRecommendations(occupation, interests, limit);
            }

            summary = `Personalized recommendations for ${occupation} based on your interests in ${interests.slice(0, 3).join(', ')}.`;
        }

        const response: RecommendationResponse = {
            recommendations,
            summary
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Recommendation API error:', error);
        return NextResponse.json(
            { error: 'Failed to generate recommendations' },
            { status: 500 }
        );
    }
}

function getMockRecommendations(occupation: string, interests: string[], limit: number): BookRecommendation[] {
    const mockBooks = [
        { title: 'Atomic Habits', author: 'James Clear', isbn: '9780735211292', subject: 'Self-Help' },
        { title: 'Deep Work', author: 'Cal Newport', isbn: '9781455586691', subject: 'Productivity' },
        { title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '9780062316097', subject: 'History' },
        { title: 'The Lean Startup', author: 'Eric Ries', isbn: '9780307887894', subject: 'Business' },
        { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', isbn: '9780374533557', subject: 'Psychology' },
        { title: 'The Power of Now', author: 'Eckhart Tolle', isbn: '9781577314806', subject: 'Spirituality' },
        { title: '1984', author: 'George Orwell', isbn: '9780451524935', subject: 'Fiction' },
        { title: 'Educated', author: 'Tara Westover', isbn: '9780399590504', subject: 'Memoir' },
        { title: 'The Alchemist', author: 'Paulo Coelho', isbn: '9780062315007', subject: 'Fiction' },
        { title: 'Dune', author: 'Frank Herbert', isbn: '9780441172719', subject: 'Science Fiction' },
        { title: 'The 7 Habits of Highly Effective People', author: 'Stephen Covey', isbn: '9781982137274', subject: 'Self-Help' },
        { title: 'The Psychology of Money', author: 'Morgan Housel', isbn: '9780857197689', subject: 'Finance' },
    ];

    return mockBooks.slice(0, limit).map((book, index) => ({
        book: {
            key: `/works/OL${1000000 + index}W`,
            title: book.title,
            authors: [{ name: book.author }],
            subject: [book.subject],
            cover_id: getCoverIdFromISBN(book.isbn), // Generate cover ID from ISBN
        },
        reasoning: `This book aligns with your interests in ${interests[0] || 'personal growth'} and is highly recommended for ${occupation}s.`,
        matchScore: Math.floor(Math.random() * 20) + 75 // 75-95
    }));
}

// Helper to get cover ID from ISBN
function getCoverIdFromISBN(isbn: string): number {
    // Use ISBN as seed for consistent cover IDs
    const hash = isbn.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 8000000 + (hash % 1000000); // Generate a plausible cover ID
}
