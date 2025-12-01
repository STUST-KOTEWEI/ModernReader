import { getSdBase, getTtsBase, getSttBase } from './configService';

export type HealthResult = { ok: boolean; message?: string };

async function tryFetch(url: string, init?: RequestInit): Promise<HealthResult> {
  try {
    const resp = await fetch(url, init);
    if (!resp.ok) return { ok: false, message: `HTTP ${resp.status}` };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, message: e?.message || 'network error' };
  }
}

export async function checkSdHealth(): Promise<HealthResult> {
  const base = getSdBase();
  // AUTOMATIC1111: /sdapi/v1/sd-models exists; 若不行改 /sdapi/v1/progress
  const r1 = await tryFetch(`${base}/v1/sd-models`);
  if (r1.ok) return r1;
  const r2 = await tryFetch(`${base}/v1/progress`);
  return r2.ok ? r2 : r1;
}

export async function checkTtsHealth(): Promise<HealthResult> {
  const base = getTtsBase();
  // 假設 /health；若沒有，嘗試對 /tts 做 OPTIONS
  const r1 = await tryFetch(`${base}/health`);
  if (r1.ok) return r1;
  const r2 = await tryFetch(`${base}/tts`, { method: 'OPTIONS' });
  return r2.ok ? r2 : r1;
}

export async function checkSttHealth(): Promise<HealthResult> {
  const base = getSttBase();
  // 假設 /health；若沒有，嘗試對 /stt 做 OPTIONS
  const r1 = await tryFetch(`${base}/health`);
  if (r1.ok) return r1;
  const r2 = await tryFetch(`${base}/stt`, { method: 'OPTIONS' });
  return r2.ok ? r2 : r1;
}
