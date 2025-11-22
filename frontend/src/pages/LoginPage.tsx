import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";

import { authClient } from "../services/api";
import { useSessionStore } from "../state/session";
import { Button } from "../design-system";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { setSession } = useSessionStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [captchaQuestion, setCaptchaQuestion] = useState<{a:number;b:number}|null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState<string>("");
  const [captchaOk, setCaptchaOk] = useState<boolean>(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileSiteKey = (import.meta as any).env?.VITE_TURNSTILE_SITE_KEY as string | undefined;
  const useTurnstile = !!turnstileSiteKey && !isDemo;
  const widgetRef = React.useRef<HTMLDivElement | null>(null);

  const isDemo = (() => {
    try {
      if (window.location.protocol === 'file:') return true;
      const params = new URLSearchParams(window.location.search);
      if (params.has('demo')) return true;
      return localStorage.getItem('mr_demo') === '1';
    } catch { return false; }
  })();

  // Detect if we're on localhost or production
  const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  // Prefer an explicit env override so we can use HTTPS tunnels (ngrok/cloudflared) in dev
  const envBase = (import.meta as any).env?.VITE_OAUTH_BASE_URL as string | undefined;
  const normalizedEnvBase = envBase ? envBase.replace(/\/$/, "") : undefined;
  const oauthBaseUrl =
    normalizedEnvBase ||
    (isLocalhost
      ? "http://localhost:8001/api/v1/auth/oauth"
      : `${window.location.protocol}//${window.location.host}/api/v1/auth/oauth`);

  // Feature flag: allow hiding OAuth buttons entirely (use local email/password only)
  const enableOAuth = String((import.meta as any).env?.VITE_ENABLE_OAUTH ?? "false").toLowerCase() === "true";

  // Handle token passed from OAuth callback via query string
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const email = params.get("email");
    
    console.log("LoginPage: checking for OAuth callback params", { token: token ? "exists" : "none", email });
    
    if (token && email) {
      console.log("LoginPage: Setting session from OAuth callback");
      useSessionStore.getState().setSession({ token, user: { email } });
      // Clean URL and redirect to home
      window.history.replaceState({}, "", window.location.pathname);
      console.log("LoginPage: Redirecting to home");
      setTimeout(() => {
        window.location.href = "/";
      }, 100); // Small delay to ensure state is saved
    }
  }, []);

  // Initialize CAPTCHA (Turnstile if configured, else simple math)
  useEffect(() => {
    if (useTurnstile) {
      // Load script once
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
          // if already added by another page
          setTimeout(init, 0);
        }
      }
      return;
    }
    // Fallback: simple math captcha
    if (!isDemo) {
      const a = Math.floor(3 + Math.random()*6); // 3..8
      const b = Math.floor(2 + Math.random()*7); // 2..8
      setCaptchaQuestion({a,b});
      setCaptchaAnswer("");
      setCaptchaOk(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!isDemo && !useTurnstile) {
        // minimal anti-bot check; replaced by Turnstile when configured
        if (!captchaQuestion) throw new Error('驗證尚未就緒，請稍後再試');
        const expected = captchaQuestion.a + captchaQuestion.b;
        if (String(expected) !== String(captchaAnswer).trim()) {
          throw new Error('請完成「我不是機器人」驗證');
        }
      }
      if (useTurnstile && !turnstileToken) {
        throw new Error('請完成「我不是機器人」驗證');
      }
      const response = await authClient.login({ email, password, captcha_token: turnstileToken || undefined });
      setSession({ token: response.access_token, user: { email } });
      try {
        if (remember) {
          localStorage.setItem("mr_jwt", response.access_token);
          localStorage.setItem("mr_email", email);
        } else {
          localStorage.removeItem("mr_jwt");
          localStorage.removeItem("mr_email");
        }
      } catch {}
      navigate("/");
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || "登入失敗，請檢查您的帳號密碼";
      setError(detail);
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-200 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Login card */}
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
            ModernReader
          </h1>
          <p className="text-gray-600">歡迎回來！登入您的帳號</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r-lg animate-shake">
            <p className="font-medium">登入錯誤</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {isDemo && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✨</span>
              <div>
                <h3 className="font-semibold text-emerald-800 mb-1">試用模式（免登入）</h3>
                <p className="text-sm text-emerald-700 mb-2">
                  不需註冊、不需輸入任何資料，直接點擊下方按鈕即可體驗所有功能！
                </p>
                <Button
                  type="button"
                  onClick={() => {
                    const demoToken = `demo.guest.${Date.now()}`;
                    const demoEmail = 'demo@modernreader.local';
                    setSession({ token: demoToken, user: { email: demoEmail } });
                    try {
                      localStorage.setItem('mr_jwt', demoToken);
                      localStorage.setItem('mr_email', demoEmail);
                    } catch {}
                    navigate('/app');
                  }}
                  className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-lg shadow-md"
                >
                  🚀 立即開始試用（免登入）
                </Button>
                <div className="mt-3 pt-3 border-t border-emerald-200">
                  <p className="text-xs text-emerald-600 mb-1">想要完整功能？</p>
                  <button
                    type="button"
                    className="text-sm font-medium text-emerald-700 hover:text-emerald-900 underline"
                    onClick={() => { 
                      try { 
                        localStorage.removeItem('mr_demo');
                        localStorage.removeItem('mr_demo_forced');
                        localStorage.setItem('mr_online_requested', '1');
                      } catch {}
                      window.location.reload();
                    }}
                  >
                    切換到線上版（需註冊）→
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isDemo && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm">
              <div className="flex items-center gap-2 mb-1">
                <span>🔒</span>
                <span className="font-semibold">線上版</span>
              </div>
              <p className="text-xs">需註冊帳號、通過人機驗證並由伺服器檢查帳密。</p>
              <button
                type="button"
                className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800 underline"
                onClick={() => { 
                  try { 
                    localStorage.setItem('mr_demo', '1');
                    localStorage.setItem('mr_demo_forced', '1');
                  } catch {}
                  window.location.reload();
                }}
              >
                ← 改用試用模式（免註冊免登入）
              </button>
            </div>
          )}
          
          {!isDemo && (
            <>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  autoComplete="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 placeholder-gray-400"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  密碼
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 placeholder-gray-400"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "隱藏" : "顯示"}
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    記住我
                  </label>
                  <span className="text-xs text-gray-400">至少 6 位字元</span>
                </div>
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
                  <p className="text-xs text-gray-500 mt-1">正式部署可換成 Cloudflare Turnstile/Recaptcha</p>
                </div>
              )}

              {useTurnstile && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">我不是機器人</label>
                  <div ref={widgetRef} className="cf-turnstile" data-sitekey={turnstileSiteKey}></div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={
                  loading || !email || password.length < 6 ||
                  (!useTurnstile && !captchaOk) ||
                  (useTurnstile && !turnstileToken)
                }
              >
                {loading ? "登入中..." : "登入"}
              </Button>
            </>
          )}
        </form>

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
                onClick={() => window.open(`${oauthBaseUrl}/google/start`, "_self")}
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
                onClick={() => window.open(`${oauthBaseUrl}/sheerid/start`, "_self")}
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

        {/* Sign up link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            還沒有帳號？{" "}
            <button
              onClick={() => navigate("/signup")}
              className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              立即註冊
            </button>
          </p>
        </div>

        {/* Info banner for HTTPS requirement */}
        {isLocalhost && enableOAuth && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              💡 提示：OAuth 登入需要 HTTPS。本地開發請使用 ngrok 或 Cloudflare Tunnel。
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
