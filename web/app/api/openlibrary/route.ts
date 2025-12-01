import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subject = searchParams.get("subject") || "bestseller";
  const limit = searchParams.get("limit") || "12";

  const target = `https://openlibrary.org/subjects/${encodeURIComponent(subject)}.json?limit=${encodeURIComponent(limit)}`;

  try {
    const res = await fetch(target, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(
      { ok: res.ok, status: res.status, statusText: res.statusText, data, source: target },
      { status: res.ok ? 200 : res.status }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reach Open Library";
    return NextResponse.json(
      { ok: false, error: message, source: target },
      { status: 502 }
    );
  }
}
