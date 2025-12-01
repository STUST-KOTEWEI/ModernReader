import { GovernanceOptions, ResearchRecord, TimelineEvent } from '../types';

// Utility: stable JSON stringify with key sorting
function stableStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(stableStringify).join(',')}]`;
  const keys = Object.keys(obj).sort();
  const entries = keys.map(k => `${JSON.stringify(k)}:${stableStringify(obj[k])}`);
  return `{${entries.join(',')}}`;
}

// Utility: ISO date rounding to day precision
function roundIsoToDay(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`; // YYYY-MM-DD
}

// Utility: hash string to hex using Web Crypto (SHA-256). If subtle not available, fallback to non-crypto hash.
async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(input);
  const subtle = (globalThis.crypto as Crypto | undefined)?.subtle;
  if (subtle && typeof subtle.digest === 'function') {
    const digest = await subtle.digest('SHA-256', data);
    const bytes = Array.from(new Uint8Array(digest));
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback (non-cryptographic, development only): FNV-1a 32-bit -> hex
  let h = 0x811c9dc5;
  for (let i = 0; i < data.length; i++) {
    h ^= data[i];
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  // Extend to 64-bit-style hex by hashing again with a salt-like constant
  let h2 = 0x811c9dc5;
  const salt = 0x9e3779b9;
  const b = new Uint8Array(8);
  new DataView(b.buffer).setUint32(0, h >>> 0);
  new DataView(b.buffer).setUint32(4, salt >>> 0);
  for (let i = 0; i < b.length; i++) {
    h2 ^= b[i];
    h2 += (h2 << 1) + (h2 << 4) + (h2 << 7) + (h2 << 8) + (h2 << 24);
  }
  const hex32 = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  return `${hex32(h)}${hex32(h2)}`;
}

// Pseudonymize an identifier with optional salt
export async function pseudonymizeId(rawId: string, salt?: string): Promise<string> {
  const toHash = salt ? `${salt}:${rawId}` : rawId;
  return sha256Hex(toHash);
}

// Sample events: keep first event and every N seconds thereafter
export function sampleEvents(events: TimelineEvent[], intervalSec: number): TimelineEvent[] {
  if (!Array.isArray(events) || events.length === 0) return [];
  if (!intervalSec || intervalSec <= 0) return [events[0]]; // keep minimal
  const result: TimelineEvent[] = [];
  let nextKeep = 0;
  for (const ev of events) {
    const t = typeof ev.t === 'number' ? ev.t : 0;
    if (result.length === 0 || t >= nextKeep) {
      result.push({ t, type: ev.type }); // drop extra fields by default
      nextKeep = t + intervalSec;
    }
  }
  return result;
}

// Apply minimum necessary filtering and privacy rules
export async function applyGovernance(input: ResearchRecord, opts: GovernanceOptions = {}): Promise<ResearchRecord> {
  const {
    salt,
    retainDays, // not used here for mutation; exposed via isExpired
    roundCreatedAtToDay,
    dropEvents,
    eventSamplingIntervalSec,
  } = opts;

  // Clone shallowly and rebuild with minimal fields
  const record: ResearchRecord = {
    participantId: input.participantId,
    sessionId: input.sessionId,
    createdAt: input.createdAt,
    consentVersion: input.consentVersion,
    device: input.device ? {
      model: input.device.model,
      os: input.device.os,
      app: input.device.app ? { version: input.device.app.version } : undefined,
      web: input.device.web ? { version: input.device.web.version } : undefined,
    } : undefined,
    biometrics: input.biometrics ? {
      heartRate: input.biometrics.heartRate,
      hrv: input.biometrics.hrv ? {
        rmssd: input.biometrics.hrv.rmssd,
        sdnn: input.biometrics.hrv.sdnn,
      } : undefined,
      stressLevel: input.biometrics.stressLevel,
      sleepQuality: input.biometrics.sleepQuality,
    } : undefined,
    reading: {
      contentId: input.reading.contentId,
      contentType: input.reading.contentType,
      durationSec: input.reading.durationSec,
      focusScore: input.reading.focusScore,
      difficulty: input.reading.difficulty,
      comprehensionScore: input.reading.comprehensionScore,
    },
    events: undefined, // set later according to rules
  };

  // Pseudonymize identifiers
  record.participantId = await pseudonymizeId(record.participantId, salt);
  record.sessionId = await pseudonymizeId(record.sessionId, salt);
  record.reading.contentId = await pseudonymizeId(record.reading.contentId, salt);

  // Round createdAt to day if requested
  if (roundCreatedAtToDay) {
    record.createdAt = roundIsoToDay(record.createdAt);
  }

  // Events handling
  if (!dropEvents && Array.isArray(input.events)) {
    record.events = eventSamplingIntervalSec
      ? sampleEvents(input.events, eventSamplingIntervalSec)
      : undefined; // default drop events to minimize
  }

  return record;
}

// Check if a record should be expired based on retention policy
export function isExpired(createdAtIso: string, retainDays = 90): boolean {
  const created = new Date(createdAtIso);
  if (isNaN(created.getTime())) return false;
  const now = Date.now();
  const diffDays = (now - created.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > retainDays;
}

// Deterministic anonymized hash for entire record snapshot (for audit dedup)
export async function anonymizedRecordFingerprint(record: ResearchRecord, salt?: string): Promise<string> {
  const payload = stableStringify(record);
  return sha256Hex(salt ? `${salt}:${payload}` : payload);
}

export default {
  applyGovernance,
  pseudonymizeId,
  sampleEvents,
  isExpired,
  anonymizedRecordFingerprint,
};
