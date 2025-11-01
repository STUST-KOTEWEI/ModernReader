import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient } from '../services/api';
import { useI18n } from '../i18n/useI18n';
import { Button, Card } from '../design-system';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await authClient.signup({ email, password });
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 flex gap-2">
        <button onClick={() => setLanguage('en')} className={`px-2 py-1 rounded ${language === 'en' ? 'bg-indigo-600 text-white' : 'bg-white'}`}>EN</button>
        <button onClick={() => setLanguage('zh')} className={`px-2 py-1 rounded ${language === 'zh' ? 'bg-indigo-600 text-white' : 'bg-white'}`}>中文</button>
        <button onClick={() => setLanguage('ja')} className={`px-2 py-1 rounded ${language === 'ja' ? 'bg-indigo-600 text-white' : 'bg-white'}`}>日本語</button>
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
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('password')}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('loading') : t('signup')}
          </Button>
        </form>

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
