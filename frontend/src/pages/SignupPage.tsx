import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient } from '../services/api';
import { useI18n } from '../i18n/useI18n';
import { LanguageSelect } from '../components/LanguageSelect';
import { Button, Card } from '../design-system';
import { useSessionStore } from '../state/session';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { setSession } = useSessionStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await authClient.signup({ email, password });
      // Auto-login after signup for smoother onboarding
      const login = await authClient.login({ email, password });
      if (login?.access_token) {
        setSession({ token: login.access_token, user: { email } });
        navigate('/');
      } else {
        navigate('/login');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Signup failed');
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

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">{t('email')}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('email')}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500"
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
                className="w-full px-3 py-2 pr-12 border rounded focus:ring-2 focus:ring-indigo-500"
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

          <Button type="submit" className="w-full" disabled={loading || !email || password.length < 6}>
            {loading ? t('loading') : t('signup')}
          </Button>
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
