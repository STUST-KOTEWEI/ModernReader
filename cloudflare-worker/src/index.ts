export interface Env {
  API_BASE: string; // set via `wrangler secret put API_BASE`
  CORS_ALLOWED_ORIGINS?: string; // optional comma-separated list
}

const DEFAULT_ORIGINS = [
  "https://moden-reader.4b4g0077.workers.dev",
  "http://localhost:3000",
  "https://app.modernreader.com", // add your custom domain here when ready
];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    // Simple landing page for root to show worker is live
    if (request.method === "GET" && url.pathname === "/") {
      return new Response(renderLanding(url), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const backend = new URL(env.API_BASE);
    backend.pathname = url.pathname;
    backend.search = url.search;

    // Handle CORS preflight early
    if (request.method === "OPTIONS") {
      return corsResponse(204, null, url.origin, env);
    }

    // Forward request to backend
    const init: RequestInit = {
      method: request.method,
      headers: stripHostHeader(request.headers),
      body: shouldHaveBody(request.method) ? request.body : undefined,
      redirect: "follow",
    };

    const backendResp = await fetch(backend, init);
    const respHeaders = new Headers(backendResp.headers);

    // Apply CORS on response
    addCorsHeaders(respHeaders, url.origin, env);
    return new Response(backendResp.body, {
      status: backendResp.status,
      statusText: backendResp.statusText,
      headers: respHeaders,
    });
  },
};

function shouldHaveBody(method: string) {
  return !["GET", "HEAD"].includes(method.toUpperCase());
}

function stripHostHeader(headers: Headers): Headers {
  const newHeaders = new Headers(headers);
  newHeaders.delete("host");
  return newHeaders;
}

function parseAllowedOrigins(env: Env): string[] {
  const custom = env.CORS_ALLOWED_ORIGINS?.split(",").map(s => s.trim()).filter(Boolean) ?? [];
  return custom.length ? custom : DEFAULT_ORIGINS;
}

function addCorsHeaders(headers: Headers, origin: string, env: Env) {
  const allowed = parseAllowedOrigins(env);
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0];
  headers.set("Access-Control-Allow-Origin", allowOrigin);
  headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Authorization,Content-Type,Accept,Origin,X-Requested-With");
  headers.set("Access-Control-Allow-Credentials", "true");
}

function corsResponse(status: number, body: BodyInit | null, origin: string, env: Env) {
  const headers = new Headers();
  addCorsHeaders(headers, origin, env);
  return new Response(body, { status, headers });
}

function renderLanding(url: URL) {
  const apiBase = "API_BASE hidden (set as secret)";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ModernReader Cloudflare Worker</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 2rem; display: flex; justify-content: center; }
    .card { max-width: 720px; width: 100%; background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.35); }
    h1 { margin-top: 0; color: #38bdf8; }
    code { background: #1f2937; padding: 2px 6px; border-radius: 6px; }
    a { color: #38bdf8; }
    ul { padding-left: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>ModernReader Worker Live</h1>
    <p>This Cloudflare Worker proxies requests to your backend.</p>
    <ul>
      <li><strong>Worker URL:</strong> ${url.origin}</li>
      <li><strong>Backend (secret):</strong> ${apiBase}</li>
      <li><strong>Try health:</strong> <a href="${url.origin}/api/v1/health">${url.origin}/api/v1/health</a></li>
    </ul>
    <p>Need changes? Edit <code>cloudflare-worker/src/index.ts</code> in the repo.</p>
  </div>
</body>
</html>`;
}
