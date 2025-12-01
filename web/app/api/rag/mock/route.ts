import { NextResponse } from "next/server";

const MOCK_DOCS = [
  {
    id: "doc-001",
    title: "Sweet Flow Overview",
    score: 0.92,
    excerpt: "Sweet is a multi-step reading journey: See, Watch, Experience, Enjoy, Tell.",
  },
  {
    id: "doc-002",
    title: "Indigenous Language Preservation",
    score: 0.88,
    excerpt: "Community-led curation with respectful consent workflows and provenance tags.",
  },
  {
    id: "doc-003",
    title: "ModernReader Architecture",
    score: 0.85,
    excerpt: "Frontend: Next.js 16; Backend: FastAPI; Vector store: Chroma/FAISS.",
  },
];

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const query = body.query ?? "";
  const top = MOCK_DOCS.map((d, idx) => ({
    ...d,
    score: d.score - idx * 0.03,
    query,
  }));
  return NextResponse.json({ ok: true, results: top });
}
