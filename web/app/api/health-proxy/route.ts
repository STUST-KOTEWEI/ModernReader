import { NextResponse } from "next/server";

export async function GET() {
  const base = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "");
  if (!base) {
    return NextResponse.json(
      { ok: false, error: "NEXT_PUBLIC_API_BASE is not configured" },
      { status: 500 }
    );
  }

  const target = `${base}/api/v1/health`;
  const started = Date.now();
  try {
    const res: Response = await fetch(target, {
      cache: "no-store",
      headers: { "x-modernreader-probe": "health-proxy" },
    });
    const latency = Date.now() - started;
    const data = await res
      .json()
      .catch((): Record<string, unknown> => ({ raw: "non-JSON response" }));

    return NextResponse.json(
      {
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        latencyMs: latency,
        data,
        target,
      },
      { status: res.ok ? 200 : res.status }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Health check failed";
    return NextResponse.json(
      { ok: false, error: message, target },
      { status: 502 }
    );
  }
}
