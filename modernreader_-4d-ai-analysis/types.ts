export interface KeyConcept {
  concept: string;
  explanation: string;
}

export interface QA {
  question: string;
  answer: string;
}

export interface AnalysisResult {
  summary: string;
  concepts: KeyConcept[];
  qa: QA[];
}

export interface AdvancedNlpResult {
  sentiment: {
    score: 'Positive' | 'Negative' | 'Neutral';
    explanation: string;
  };
  entities: {
    people: string[];
    organizations: string[];
    locations: string[];
  };
}

export interface BookRecommendation {
  title: string;
  author: string;
  summary: string;
  reason: string;
}

export type ActiveTab = 'summary' | 'concepts' | 'qa' | 'visualize' | 'listen' | 'nlp' | 'recommendations';

export interface ReaderSession {
  inputText: string;
  analysisResult: AnalysisResult | null;
  advancedNlpResult: AdvancedNlpResult | null;
  imageUrl: string | null;
  recommendations: BookRecommendation[] | null;
  activeTab: ActiveTab;
  // Optional: selected emotion title from the emotion prompt library
  selectedEmotion?: string | null;
}

// Emotion prompt library item
export interface EmotionPrompt {
  emotion_title: string; // e.g., "001. 寧靜的喜悅 (Tranquil Joy)"
  keywords: string; // comma-separated keywords
  scene_imagery: string;
  color_light: string;
  style_composition: string;
  combined_prompt: string; // often wrapped in 「」
}

// ================================
// Research data types (Appendix A)
// ================================

// Device / environment info
export interface DeviceInfo {
  model?: string; // e.g., iPhone15,3 / Apple Watch model
  os?: string; // e.g., iOS 18.1
  app?: { version?: string };
  web?: { version?: string };
}

// Biometrics summary (use aggregates; avoid raw continuous streams)
export interface BiometricsSummary {
  heartRate?: number; // bpm average or snapshot
  hrv?: { rmssd?: number; sdnn?: number };
  stressLevel?: number; // normalized score
  sleepQuality?: number; // normalized score
}

// Reading interaction metrics
export interface ReadingMetrics {
  contentId: string; // pseudonymized content id
  contentType: 'article' | 'lesson' | 'audio' | 'video' | string;
  durationSec: number; // effective reading seconds
  focusScore?: number; // normalized 0..1
  difficulty?: number; // 1..5 or 1..10
  comprehensionScore?: number; // 0..100
}

// Timeline event (kept minimal or sampled)
export interface TimelineEvent {
  t: number; // seconds from session start
  type: string; // e.g., page_open / tts_play / complete
  [k: string]: any; // optional extra fields (discouraged)
}

// Research record (minimum necessary fields)
export interface ResearchRecord {
  participantId: string; // pseudonymized id, not identifiable
  sessionId: string; // session code
  createdAt: string; // ISO8601, may be rounded to day
  consentVersion: string; // consent form version
  device?: DeviceInfo;
  biometrics?: BiometricsSummary;
  reading: ReadingMetrics;
  events?: TimelineEvent[]; // optional; consider sampling or summary
}

// Governance options for runtime processing
export interface GovernanceOptions {
  salt?: string; // salt for hashing pseudonyms
  retainDays?: number; // retention period in days
  roundCreatedAtToDay?: boolean; // drop time granularity
  dropEvents?: boolean; // remove events entirely
  eventSamplingIntervalSec?: number; // keep every N seconds
}
