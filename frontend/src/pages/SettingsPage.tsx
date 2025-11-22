import React from 'react';
import { LanguageSelect } from '../components/LanguageSelect';
import { Button, Card } from '../design-system';
import { useI18n } from '../i18n/useI18n';
import { aiClient, userClient } from '../services/api';
import { useSessionStore } from '../state/session';

export const SettingsPage: React.FC = () => {
  const { t } = useI18n();
  const { token } = useSessionStore();

  const [defaultLanguage, setDefaultLanguage] = React.useState<string>('en');
  const [ttsVoice, setTtsVoice] = React.useState<string>('');
  const [romanization, setRomanization] = React.useState<string>('');
  const [autoplayTts, setAutoplayTts] = React.useState<boolean>(true);
  const [learningOptIn, setLearningOptIn] = React.useState<boolean>(true);
  const [saving, setSaving] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [message, setMessage] = React.useState<string>('');
  const [preferences, setPreferences] = React.useState<Record<string, any>>({});
  const [llmProvider, setLlmProvider] = React.useState<string>('auto');
  const [providers, setProviders] = React.useState<Array<{ id: string; label: string }>>([]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await userClient.getSettings(token || undefined);
        if (!mounted) return;
        if (s.default_language) setDefaultLanguage(s.default_language);
        if (s.tts_voice) setTtsVoice(s.tts_voice);
        if (s.romanization_scheme) setRomanization(s.romanization_scheme);
        setAutoplayTts(Boolean(s.autoplay_tts));
        setLearningOptIn(Boolean(s.learning_opt_in));
        if (s.preferences) {
          setPreferences(s.preferences);
          if (typeof s.preferences.llm_provider === 'string') {
            setLlmProvider(s.preferences.llm_provider);
          }
        }
      } catch (e) {
        // ignore if not set or unauthorized; page is under /app anyway
      } finally {
        if (mounted) setLoaded(true);
      }
    })();
    (async () => {
      try {
        const list = await aiClient.listProviders();
        if (!mounted) return;
        setProviders(list.filter((p) => p.available).map((p) => ({ id: p.id, label: p.label })));
      } catch (error) {
        console.warn('Failed to load provider list', error);
      }
      if (!mounted || typeof window === 'undefined') return;
      try {
        const saved = localStorage.getItem('mr_llm_provider');
        if (saved) {
          setLlmProvider(saved);
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, [token]);

  const onSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const nextPreferences = { ...preferences };
      if (llmProvider === 'auto') {
        delete nextPreferences.llm_provider;
      } else {
        nextPreferences.llm_provider = llmProvider;
      }
      await userClient.updateSettings({
        default_language: defaultLanguage,
        tts_voice: ttsVoice || null,
        romanization_scheme: romanization || null,
        autoplay_tts: autoplayTts,
        learning_opt_in: learningOptIn,
        preferences: nextPreferences,
      }, token || undefined);
      setPreferences(nextPreferences);
      try {
        if (llmProvider === 'auto') {
          localStorage.removeItem('mr_llm_provider');
        } else {
          localStorage.setItem('mr_llm_provider', llmProvider);
        }
      } catch {}
      setMessage(t('success'));
    } catch (e: any) {
      setMessage(t('error'));
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 2000);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">{t('settings')}</h1>
      <Card className="max-w-2xl">
        {!loaded ? (
          <div>{t('loading')}</div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('languageLabel')}</label>
              <LanguageSelect onChangeExtra={(lang) => setDefaultLanguage(lang)} />
              <p className="text-xs text-gray-500 mt-1">Default UI language.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">LLM Provider</label>
              <select
                value={llmProvider}
                onChange={(e) => {
                  const value = e.target.value;
                  setLlmProvider(value);
                  setPreferences((prev) => {
                    const next = { ...prev };
                    if (value === 'auto') {
                      delete next.llm_provider;
                    } else {
                      next.llm_provider = value;
                    }
                    return next;
                  });
                }}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="auto">Auto</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Choose which provider to prioritize. Auto follows backend fallback order.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">TTS Voice</label>
              <input
                value={ttsVoice}
                onChange={(e) => setTtsVoice(e.target.value)}
                placeholder="e.g. zh-TW-HsiaoChenNeural"
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Romanization Scheme</label>
              <input
                value={romanization}
                onChange={(e) => setRomanization(e.target.value)}
                placeholder="e.g. Pinyin, Hepburn, etc."
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div className="flex items-center gap-2">
              <input id="autoplay" type="checkbox" checked={autoplayTts} onChange={(e) => setAutoplayTts(e.target.checked)} />
              <label htmlFor="autoplay">Autoplay TTS</label>
            </div>

            <div className="flex items-center gap-2">
              <input id="optin" type="checkbox" checked={learningOptIn} onChange={(e) => setLearningOptIn(e.target.checked)} />
              <label htmlFor="optin">Learning data opt-in</label>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button type="submit" disabled={saving}>{saving ? t('loading') : t('save')}</Button>
              {message && <span className="text-sm text-gray-500">{message}</span>}
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default SettingsPage;
