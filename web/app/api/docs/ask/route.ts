import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { docId = 'doc-unknown', question = '' } = body;

        const answer = `Based on ${docId}, here is a grounded reply: ${question || 'No question provided.'}`;
        const chunks = [
            {
                id: `${docId}-c1`,
                heading: 'Context',
                snippet: 'Citations are simulated for this demo. Connect a vector store to replace this with live chunks.',
                page: 3,
            },
            {
                id: `${docId}-c2`,
                heading: 'Follow-up',
                snippet: 'You can refine the question or upload another PDF to widen the context.',
                page: 5,
            },
        ];

        return NextResponse.json({
            docId,
            answer,
            chunks,
        });
    } catch (error) {
        console.error('Doc ask error:', error);
        return NextResponse.json({ error: 'Failed to answer question' }, { status: 500 });
    }
}
