export interface PrototypeStat {
  label: string;
  value: string;
  context: string;
}

export interface PrototypeFeature {
  id: string;
  title: string;
  summary: string;
  icon: string;
  pillar: string;
  metric_label?: string | null;
  metric_value?: string | null;
}

export interface PrototypeFlow {
  id: string;
  title: string;
  bullets: string[];
  highlight: string;
}

export interface PrototypePreviewMode {
  id: string;
  title: string;
  caption: string;
  illustration: string;
  actions: string[];
}

export interface PrototypeTimelinePhase {
  phase: string;
  weeks: string;
  focus: string[];
  outcome: string;
}

export interface PrototypeTechStack {
  layer: string;
  tools: string[];
}

export interface PrototypeHero {
  headline: string;
  subheading: string;
  promise: string;
  location: string;
  hero_stats: PrototypeStat[];
}

export interface PrototypeCallToAction {
  headline: string;
  subtitle: string;
  contact_email: string;
  discord: string;
  deck_url?: string | null;
}

export interface PrototypeOverview {
  hero: PrototypeHero;
  features: PrototypeFeature[];
  flows: PrototypeFlow[];
  preview_modes: PrototypePreviewMode[];
  timeline: PrototypeTimelinePhase[];
  tech_stack: PrototypeTechStack[];
  call_to_action: PrototypeCallToAction;
}

export interface PrototypeInterestPayload {
  name: string;
  email: string;
  role: string;
  organization?: string;
  focus_area?: string;
  message?: string;
}

export interface PrototypeInterestResponse extends PrototypeInterestPayload {
  id: string;
  created_at: string;
  updated_at: string;
}
