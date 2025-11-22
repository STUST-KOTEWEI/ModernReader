/**
 * Anti-bot utilities for production deployment
 * Implements multiple layers of bot protection without requiring external services
 */

interface BotDetectionResult {
  isBot: boolean;
  score: number; // 0-100, higher = more bot-like
  reasons: string[];
}

/**
 * Generate a simple browser fingerprint
 * Not foolproof but adds an extra layer
 */
export function generateFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('🤖', 2, 2);
  }
  
  const data = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
    canvas.toDataURL(),
  ].join('|||');
  
  // Simple hash
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Detect bot-like behavior
 */
export function detectBot(): BotDetectionResult {
  const reasons: string[] = [];
  let score = 0;
  
  // Check 1: User agent
  const ua = navigator.userAgent.toLowerCase();
  const botKeywords = ['bot', 'crawl', 'spider', 'scrape', 'curl', 'wget', 'python', 'java'];
  if (botKeywords.some(kw => ua.includes(kw))) {
    reasons.push('suspicious_user_agent');
    score += 50;
  }
  
  // Check 2: Headless browser detection
  if (navigator.webdriver) {
    reasons.push('webdriver_detected');
    score += 40;
  }
  
  // Check 3: Plugins (headless browsers often have 0)
  if (navigator.plugins.length === 0) {
    reasons.push('no_plugins');
    score += 10;
  }
  
  // Check 4: Languages (bots often have empty array)
  if (navigator.languages.length === 0) {
    reasons.push('no_languages');
    score += 15;
  }
  
  // Check 5: Touch support mismatch
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isMobile = /mobile|android|ios/i.test(ua);
  if (isMobile && !hasTouch) {
    reasons.push('touch_mismatch');
    score += 20;
  }
  
  // Check 6: Window properties (headless often lacks some)
  if (typeof (window as any).chrome === 'undefined' && /chrome/i.test(ua)) {
    reasons.push('chrome_object_missing');
    score += 15;
  }
  
  // Check 7: Screen resolution (bots often use default)
  if (screen.width === 1024 && screen.height === 768) {
    reasons.push('default_resolution');
    score += 5;
  }
  
  return {
    isBot: score >= 50,
    score,
    reasons,
  };
}

/**
 * Rate limiting per IP (client-side tracking)
 * Stores attempt counts in localStorage
 */
interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetTime: number; // timestamp
}

export function checkRateLimit(action: 'login' | 'signup', maxAttempts = 5, windowMs = 15 * 60 * 1000): RateLimitResult {
  const key = `mr_ratelimit_${action}`;
  const now = Date.now();
  
  try {
    const stored = localStorage.getItem(key);
    let data: { count: number; resetTime: number } = stored ? JSON.parse(stored) : { count: 0, resetTime: now + windowMs };
    
    // Reset if window expired
    if (now > data.resetTime) {
      data = { count: 1, resetTime: now + windowMs };
      localStorage.setItem(key, JSON.stringify(data));
      return { allowed: true, remainingAttempts: maxAttempts - 1, resetTime: data.resetTime };
    }
    
    // Check if limit exceeded
    if (data.count >= maxAttempts) {
      return { allowed: false, remainingAttempts: 0, resetTime: data.resetTime };
    }
    
    // Increment count
    data.count += 1;
    localStorage.setItem(key, JSON.stringify(data));
    return { allowed: true, remainingAttempts: maxAttempts - data.count, resetTime: data.resetTime };
  } catch {
    // If localStorage fails, allow but don't track
    return { allowed: true, remainingAttempts: maxAttempts, resetTime: now + windowMs };
  }
}

/**
 * Create a honeypot field (invisible to humans, visible to bots)
 */
export function createHoneypotField(formId: string): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'text';
  input.name = 'website'; // Common bot target
  input.id = `${formId}_honeypot`;
  input.tabIndex = -1;
  input.autocomplete = 'off';
  input.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none';
  input.setAttribute('aria-hidden', 'true');
  return input;
}

/**
 * Check if honeypot was triggered
 */
export function isHoneypotTriggered(formId: string): boolean {
  const input = document.getElementById(`${formId}_honeypot`) as HTMLInputElement | null;
  return !!input && input.value.trim().length > 0;
}

/**
 * Mouse/touch tracking for human behavior verification
 */
export class InteractionTracker {
  private mouseMoves = 0;
  private clicks = 0;
  private touches = 0;
  private startTime = Date.now();
  
  constructor() {
    this.attachListeners();
  }
  
  private attachListeners() {
    document.addEventListener('mousemove', () => this.mouseMoves++, { passive: true });
    document.addEventListener('click', () => this.clicks++, { passive: true });
    document.addEventListener('touchstart', () => this.touches++, { passive: true });
  }
  
  /**
   * Check if user has shown human-like interaction
   */
  hasHumanInteraction(): boolean {
    const elapsed = Date.now() - this.startTime;
    // Expect at least 2 moves or 1 click within reasonable time
    return (this.mouseMoves >= 2 || this.clicks >= 1 || this.touches >= 1) && elapsed > 1000;
  }
  
  getStats() {
    return {
      mouseMoves: this.mouseMoves,
      clicks: this.clicks,
      touches: this.touches,
      elapsed: Date.now() - this.startTime,
    };
  }
}

/**
 * Time-based challenge: ensure form wasn't submitted too quickly
 */
export function validateFormTiming(formLoadTime: number, minSeconds = 3): boolean {
  const elapsed = (Date.now() - formLoadTime) / 1000;
  return elapsed >= minSeconds;
}
