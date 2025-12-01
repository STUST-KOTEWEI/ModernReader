"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Activity, Cloud, ServerCog, RefreshCw, FileText, Zap, Loader2 } from "lucide-react";

type HealthResult = {
  ok: boolean;
  status?: number;
  statusText?: string;
  latencyMs?: number;
  data?: Record<string, unknown>;
  error?: string;
  target?: string;
};

type RagResult = {
  ok: boolean;
  results?: Array<{ id: string; title: string; score: number; excerpt: string; query: string }>;
  error?: string;
};

function DiagnosticsPage() {
  const [health, setHealth] = useState<HealthResult | null>(null);
  const [rag, setRag] = useState<RagResult | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [loadingRag, setLoadingRag] = useState(false);
  const [query, setQuery] = useState("How does Sweet flow work?");

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_BASE || "not set", []);

  const runHealth = useCallback(async () => {
    setLoadingHealth(true);
    try {
      const res = await fetch("/api/health-proxy", { cache: "no-store" });
      const json = (await res.json()) as HealthResult;
      setHealth(json as HealthResult);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Health request failed";
      setHealth({ ok: false, error: message });
    } finally {
      setLoadingHealth(false);
    }
  }, []);

  const runRag = useCallback(async () => {
    setLoadingRag(true);
    try {
      const res = await fetch("/api/rag/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const json = (await res.json()) as RagResult;
      setRag(json);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "RAG request failed";
      setRag({ ok: false, error: message });
    } finally {
      setLoadingRag(false);
    }
  }, [query]);

  useEffect(() => {
    runHealth();
    runRag();
  }, [runHealth, runRag]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <header className="flex items-center gap-3 mb-8">
          <div className="h-11 w-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Activity className="text-cyan-300" size={20} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/60">Diagnostics</p>
            <h1 className="text-3xl font-bold tracking-tight text-white">System Health & Mock RAG</h1>
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <ServerCog className="text-cyan-300" size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">API Health</h2>
                <p className="text-sm text-white/60">Checks {apiBase}/api/v1/health via Worker proxy.</p>
              </div>
              <button
                onClick={runHealth}
                className="ml-auto inline-flex items-center gap-2 px-3 py-2 text-xs rounded-lg bg-white/5 hover:bg-white/10 border border-white/10"
              >
                <Loader2 size={14} className={`animate-spin ${loadingHealth ? "inline-block" : "hidden"}`} />
                <RefreshCw size={14} className={`${loadingHealth ? "hidden" : "inline-block"}`} />
                Refresh
              </button>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2">
              {health ? (
                <>
                  <Row label="Status" value={`${health.status ?? "-"} ${health.statusText ?? ""}`} highlight={health.ok} />
                  <Row label="Latency" value={health.latencyMs ? `${health.latencyMs} ms` : "-"} />
                  <Row label="Target" value={health.target ?? "-"} />
                  <pre className="text-xs bg-black/30 rounded-lg p-3 overflow-auto border border-white/5">
                    {JSON.stringify(health.data ?? health, null, 2)}
                  </pre>
                </>
              ) : (
                <p className="text-sm text-white/60">No data yet.</p>
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <Cloud className="text-amber-300" size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Mock RAG</h2>
                <p className="text-sm text-white/60">Send a query and view mock search results.</p>
              </div>
              <button
                onClick={runRag}
                className="ml-auto inline-flex items-center gap-2 px-3 py-2 text-xs rounded-lg bg-white/5 hover:bg-white/10 border border-white/10"
              >
                <Loader2 size={14} className={`animate-spin ${loadingRag ? "inline-block" : "hidden"}`} />
                <RefreshCw size={14} className={`${loadingRag ? "hidden" : "inline-block"}`} />
                Run
              </button>
            </div>
            <div className="space-y-3">
              <input
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about ModernReader..."
              />
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
                {rag?.results?.length ? (
                  rag.results.map((r) => (
                    <div key={r.id} className="rounded-xl border border-white/5 bg-black/20 p-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <FileText size={14} className="text-amber-300" />
                        {r.title}
                        <span className="ml-auto text-xs text-white/70">score {(r.score * 100).toFixed(1)}%</span>
                      </div>
                      <p className="text-sm text-white/70 mt-1">{r.excerpt}</p>
                      <p className="text-xs text-white/50 mt-1">query: {r.query}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-white/60">No results yet.</p>
                )}
                {rag?.error && <p className="text-sm text-rose-300">Error: {rag.error}</p>}
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-6">
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <Zap className="text-emerald-300" size={16} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">What this page does</h2>
                <p className="text-sm text-white/60">
                  Probes the backend via Worker, and exercises a mock RAG endpoint. Swap /api/rag/mock with your real API anytime.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white/5 border border-white/10 shadow-2xl shadow-cyan-500/5 backdrop-blur-md p-5">
      {children}
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-white/60 min-w-[90px]">{label}</span>
      <span className={`flex-1 text-white ${highlight ? "font-semibold text-emerald-300" : "text-white/80"}`}>{value}</span>
    </div>
  );
}

export default dynamic(() => Promise.resolve(DiagnosticsPage), { ssr: false });
