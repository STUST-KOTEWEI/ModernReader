import { NextRequest, NextResponse } from 'next/server';
import { buildLibraryHolding } from '@/lib/librarySources';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const fileName: string = body.fileName || 'document.pdf';
        const size: number = body.size || 0;
        const subject: string = body.subject || 'general';
        const preferredLibrary = body.libraryId ? [body.libraryId] : undefined;

        const holding = buildLibraryHolding(subject, 0, {
            preferredLibraryIds: preferredLibrary,
            preferredAccess: body.access,
        });

        const kb = Math.max(1, Math.round(size / 1024));
        const docId = `doc-${Date.now()}`;

        const chunks = [
            {
                id: `${docId}-c1`,
                heading: 'Overview',
                snippet: `Indexed ${kb} KB from ${fileName}. Key themes detected: ${subject}.`,
                page: 1,
            },
            {
                id: `${docId}-c2`,
                heading: 'Notable Passage',
                snippet: 'This passage is ready for grounded Q&A. Citations will reference page numbers and call numbers.',
                page: 2,
            },
        ];

        return NextResponse.json({
            docId,
            fileName,
            summary: `Ingested ${kb} KB from ${fileName}. Ask questions to get grounded answers with library call numbers.`,
            holding,
            chunks,
        });
    } catch (error) {
        console.error('Doc analyze error:', error);
        return NextResponse.json({ error: 'Failed to ingest document' }, { status: 500 });
    }
}
