import { NextRequest, NextResponse } from 'next/server';
import { buildLibraryHolding } from '@/lib/librarySources';
import type { LibraryAccessType } from '@/types/user';

interface MetaRecord {
    id: string;
    title: string;
    subject: string;
    libraryId: string;
    access: LibraryAccessType;
    recency: number;
}

const META_DATASET: MetaRecord[] = [
    { id: 'm1', title: 'Digital Transformation in Libraries', subject: 'technology', libraryId: 'openlibrary', access: 'Digital', recency: 5 },
    { id: 'm2', title: 'Indigenous Oral Histories', subject: 'culture', libraryId: 'ncl', access: 'Hybrid', recency: 9 },
    { id: 'm3', title: 'Machine Learning for Researchers', subject: 'science', libraryId: 'harvard', access: 'Hybrid', recency: 2 },
    { id: 'm4', title: 'World Literature Anthology', subject: 'literature', libraryId: 'bl', access: 'Hybrid', recency: 6 },
    { id: 'm5', title: 'Business Strategy Essentials', subject: 'business', libraryId: 'loc', access: 'Hybrid', recency: 3 },
    { id: 'm6', title: 'Japanese History Digest', subject: 'history', libraryId: 'ndl', access: 'Physical', recency: 7 },
    { id: 'm7', title: 'Design Futures', subject: 'design', libraryId: 'ntu', access: 'Hybrid', recency: 4 },
    { id: 'm8', title: 'Financial Psychology', subject: 'finance', libraryId: 'harvard', access: 'Hybrid', recency: 1 },
];

function buildSQL(filters: {
    subject?: string;
    libraries?: string[];
    access?: LibraryAccessType;
    emotion?: string;
    limit?: number;
}) {
    const clauses = [];
    if (filters.subject) clauses.push(`subject = '${filters.subject}'`);
    if (filters.libraries?.length) clauses.push(`library_id IN (${filters.libraries.map(id => `'${id}'`).join(',')})`);
    if (filters.access && filters.access !== 'Any') clauses.push(`access = '${filters.access}'`);
    if (filters.emotion) clauses.push(`preferred_emotion = '${filters.emotion}' -- hint for ranking`);

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    return `SELECT * FROM metadata ${where} ORDER BY recency DESC LIMIT ${filters.limit || 8};`;
}

function score(record: MetaRecord, emotion?: string) {
    let s = 1 / (1 + record.recency);
    if (emotion && (emotion === 'joy' || emotion === 'surprise') && record.subject === 'technology') s += 0.2;
    if (emotion === 'sadness' && record.subject === 'literature') s += 0.15;
    return s;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const subject: string | undefined = body.subject;
        const libraries: string[] | undefined = body.libraries;
        const access: LibraryAccessType | undefined = body.access;
        const emotion: string | undefined = body.emotion;
        const limit: number = body.limit || 6;

        let results = META_DATASET;
        if (subject) results = results.filter(r => r.subject === subject || r.subject.includes(subject));
        if (libraries?.length) results = results.filter(r => libraries.includes(r.libraryId));
        if (access && access !== 'Any') results = results.filter(r => r.access === access);

        results = results
            .map(r => ({ ...r, metaScore: score(r, emotion) }))
            .sort((a, b) => b.metaScore - a.metaScore)
            .slice(0, limit);

        const enriched = results.map((r, index) => ({
            id: r.id,
            title: r.title,
            subject: r.subject,
            access: r.access,
            libraryHolding: buildLibraryHolding(r.subject, index, {
                preferredLibraryIds: [r.libraryId],
                preferredAccess: r.access,
            }),
        }));

        const sql = buildSQL({ subject, libraries, access, emotion, limit });

        return NextResponse.json({
            sql,
            filters: { subject, libraries, access, emotion, limit },
            results: enriched,
        });
    } catch (error) {
        console.error('Meta search error:', error);
        return NextResponse.json({ error: 'Failed to run meta search' }, { status: 500 });
    }
}
