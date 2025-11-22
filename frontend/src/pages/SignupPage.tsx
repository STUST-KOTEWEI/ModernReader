import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient } from '../services/api';
import { useI18n } from '../i18n/useI18n';
import { LanguageSelect } from '../components/LanguageSelect';
import { Button, Card } from '../design-system';
import { useSessionStore } from '../state/session';
import {
  detectBot,
  checkRateLimit,
  createHoneypotField,
  isHoneypotTriggered,
  InteractionTracker,
  validateFormTiming,
  generateFingerprint,
} from '../utils/antiBot';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { setSession } = useSessionStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState<{a:number;b:number}|null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState<string>('');
  const [captchaOk, setCaptchaOk] = useState<boolean>(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileSiteKey = (import.meta as any).env?.VITE_TURNSTILE_SITE_KEY as string | undefined;
  const requireEmailVerification = String((import.meta as any).env?.VITE_REQUIRE_EMAIL_VERIFICATION ?? 'false').toLowerCase() === 'true';
  const widgetRef = React.useRef<HTMLDivElement | null>(null);
  
  // Anti-bot state
  const formLoadTime = useRef(Date.now());
  const interactionTracker = useRef<InteractionTracker | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
  const isDemo = (() => {
    try {
      if (window.location.protocol === 'file:') return true;
      const params = new URLSearchParams(window.location.search);
      if (params.has('demo')) return true;
      return localStorage.getItem('mr_demo') === '1';
    } catch { return false; }
  })();
  
  const useTurnstile = !!turnstileSiteKey && !isDemo;

  // Detect if we're on localhost or production
  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';
  // Prefer an explicit env override so we can use HTTPS tunnels (ngrok/cloudflared) in dev
  const envBase = (import.meta as any).env?.VITE_OAUTH_BASE_URL as string | undefined;
  const normalizedEnvBase = envBase ? envBase.replace(/\/$/, '') : undefined;
  const oauthBaseUrl =
    normalizedEnvBase ||
    (isLocalhost
      ? 'http://localhost:8001/api/v1/auth/oauth'
      : `${window.location.protocol}//${window.location.host}/api/v1/auth/oauth`);

  // Feature flag to toggle OAuth buttons
  const enableOAuth = String((import.meta as any).env?.VITE_ENABLE_OAUTH ?? 'false').toLowerCase() === 'true';

  // Handle token passed from OAuth callback via query string
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');
    if (token && email) {
      useSessionStore.getState().setSession({ token, user: { email } });
      // Clean URL and redirect to home
      window.history.replaceState({}, '', window.location.pathname);
      window.location.href = '/';
    }
  }, []);

  useEffect(() => {
    if (useTurnstile) {
      const anyWindow = window as any;
      const init = () => {
        try {
          if (widgetRef.current && anyWindow.turnstile) {
            anyWindow.turnstile.render(widgetRef.current, {
              sitekey: turnstileSiteKey,
              callback: (t: string) => setTurnstileToken(t),
              'error-callback': () => setTurnstileToken(null),
              'timeout-callback': () => setTurnstileToken(null),
            });
          }
        } catch {}
      };
      if (anyWindow.turnstile && anyWindow.turnstile.render) {
        init();
      } else {
        const scriptId = 'cf-turnstile';
        if (!document.getElementById(scriptId)) {
          const s = document.createElement('script');
          s.id = scriptId;
          s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
          s.async = true;
          s.defer = true;
          s.onload = () => init();
          document.head.appendChild(s);
        } else {
          setTimeout(init, 0);
        }
      }
      return;
    }
    if (!isDemo) {
      const a = Math.floor(3 + Math.random()*6);
      const b = Math.floor(2 + Math.random()*7);
      setCaptchaQuestion({a,b});
      setCaptchaAnswer('');
      setCaptchaOk(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // === Multi-layer Bot Protection (without external service) ===
      if (!isDemo) {
        // 1. Rate limiting
        const rateLimit = checkRateLimit('signup', 3, 10 * 60 * 1000); // 3 attempts per 10 minutes
        if (!rateLimit.allowed) {
          const waitMinutes = Math.ceil((rateLimit.resetTime - Date.now()) / 60000);
          throw new Error(`註冊嘗試次數過多，請於 ${waitMinutes} 分鐘後再試`);
        }
        
        // 2. Honeypot check
        if (isHoneypotTriggered('signup-form')) {
          console.warn('[Anti-bot] Honeypot triggered');
          throw new Error('驗證失敗，請稍後再試');
        }
        
        // 3. Bot detection
        const botCheck = detectBot();
        if (botCheck.isBot) {
          console.warn('[Anti-bot] Bot detected:', botCheck.reasons);
          throw new Error('偵測到異常行為，請使用正常瀏覽器註冊');
        }
        
        // 4. Timing validation (form not submitted too quickly)
        if (!validateFormTiming(formLoadTime.current, 3)) {
          console.warn('[Anti-bot] Form submitted too quickly');
          throw new Error('註冊速度過快，請仔細填寫表單');
        }
        
        // 5. Interaction validation
        if (interactionTracker.current && !interactionTracker.current.hasHumanInteraction()) {
          console.warn('[Anti-bot] No human interaction detected');
          throw new Error('請與頁面正常互動後再提交');
        }
        
        // 6. Basic captcha or Turnstile
        if (!useTurnstile) {
          if (!captchaQuestion) throw new Error('驗證尚未就緒，請稍後再試');
          const expected = captchaQuestion.a + captchaQuestion.b;
          if (String(expected) !== String(captchaAnswer).trim()) {
            throw new Error('請完成「我不是機器人」驗證');
          }
        } else if (!turnstileToken) {
          throw new Error('請完成「我不是機器人」驗證');
        }
        
        // 7. Generate browser fingerprint (for backend correlation if needed)
        const fingerprint = generateFingerprint();
        console.log('[Anti-bot] Browser fingerprint:', fingerprint);
      }
      
      await authClient.signup({ email, password, captcha_token: turnstileToken || undefined });
      if (requireEmailVerification && !isDemo) {
        try { await authClient.sendVerificationEmail(email); } catch {}
        alert('註冊成功，請前往信箱收取驗證信並完成驗證後再登入。');
        navigate('/login');
        return;
      }
      // Auto-login after signup for smoother onboarding (demo or when email verification not enforced)
      const login = await authClient.login({ email, password, captcha_token: turnstileToken || undefined });
      if (login?.access_token) {
        setSession({ token: login.access_token, user: { email } });
        navigate('/');
      } else {
        navigate('/login');
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || 'Signup failed';
      setError(detail);
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSelect />
      </div>

      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">{t('createAccount')}</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {isDemo && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✨</span>
              <div>
                <h3 className="font-semibold text-emerald-800 mb-1">試用模式（免註冊）</h3>
                <p className="text-sm text-emerald-700 mb-2">
                  不需要真的註冊！直接回到登入頁點擊「立即開始試用」按鈕即可。
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-sm font-medium text-emerald-700 hover:text-emerald-900 underline"
                >
                  ← 回到登入頁（免註冊直接試用）
                </button>
              </div>
            </div>
          </div>
        )}

        <form ref={formRef} onSubmit={handleSignup} className="space-y-4">
          {!isDemo && (
            <>
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span>🔒</span>
                  <span className="font-semibold">線上版註冊</span>
                </div>
                <p className="text-xs">請填寫有效 Email、設定密碼並通過人機驗證。</p>
                <button
                  type="button"
                  className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800 underline"
                  onClick={() => { 
                    try { 
                      localStorage.setItem('mr_demo', '1');
                      localStorage.setItem('mr_demo_forced', '1');
                    } catch {}
                    navigate('/login');
                  }}
                >
                  ← 改用試用模式（免註冊免登入）
                </button>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">{t('email')}</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('email')}
                  autoComplete="email"
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 placeholder-gray-400"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1">{t('password')}</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('password')}
                    autoComplete="new-password"
                    className="w-full px-3 py-2 pr-12 border rounded focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 placeholder-gray-400"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '隱藏' : '顯示'}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">至少 6 位字元</p>
              </div>

              {!useTurnstile && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">我不是機器人</label>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded bg-gray-100 border text-sm">
                      {(captchaQuestion?.a ?? '?')} + {(captchaQuestion?.b ?? '?')} =
                    </span>
                    <input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={captchaAnswer}
                      onChange={(e) => { setCaptchaAnswer(e.target.value); const ok = Number(e.target.value) === ((captchaQuestion?.a||0)+(captchaQuestion?.b||0)); setCaptchaOk(ok); }}
                      className="w-24 px-3 py-2 border rounded"
                      placeholder="答案"
                      aria-label="anti-bot answer"
                      required
                    />
                    {captchaOk && <span className="text-emerald-600 text-sm">✓</span>}
                  </div>
                </div>
              )}

              {useTurnstile && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">我不是機器人</label>
                  <div ref={widgetRef} className="cf-turnstile" data-sitekey={turnstileSiteKey}></div>
                </div>
              )}              <Button type="submit" className="w-full" disabled={loading || !email || password.length < 6 || (!isDemo && !useTurnstile && !captchaOk) || (useTurnstile && !turnstileToken)}>
                {loading ? t('loading') : t('signup')}
              </Button>
            </>
          )}
        </form>

        <div className="mt-3 text-xs text-gray-500">
          {isDemo ? (
            <button
              className="underline"
              onClick={() => { try { localStorage.removeItem('mr_demo'); localStorage.removeItem('mr_demo_forced'); localStorage.setItem('mr_online_requested', '1'); } catch {}; window.location.reload(); }}
            >切換到線上版</button>
          ) : (
            <button
              className="underline"
              onClick={() => { try { localStorage.setItem('mr_demo','1'); } catch {}; window.location.reload(); }}
            >改用試用模式</button>
          )}
        </div>

        {enableOAuth && (
          <>
            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">或使用</span>
              </div>
            </div>

            {/* OAuth buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => window.open(`${oauthBaseUrl}/google/start`, '_self')}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="font-medium text-gray-700 group-hover:text-gray-900">Sign in with Google</span>
              </button>

              <button
                type="button"
                onClick={() => window.open(`${oauthBaseUrl}/sheerid/start`, '_self')}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-indigo-300 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-all duration-200 group"
              >
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="font-medium text-indigo-700 group-hover:text-indigo-900">身份驗證 (SheerID)</span>
              </button>
            </div>
          </>
        )}

        <div className="mt-4 text-center text-sm">
          {t('alreadyHaveAccount')}{' '}
          <a href="/login" className="text-indigo-600 hover:underline">
            {t('login')}
          </a>
        </div>
      </Card>
    </div>
  );
};
