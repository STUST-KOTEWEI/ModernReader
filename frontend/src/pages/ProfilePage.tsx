import React from 'react';
import { Button, Card } from '../design-system';
import { useI18n } from '../i18n/useI18n';
import { userClient } from '../services/api';
import { useSessionStore } from '../state/session';

export const ProfilePage: React.FC = () => {
  const { t } = useI18n();
  const { token } = useSessionStore();

  const [username, setUsername] = React.useState<string>('');
  const [avatarUrl, setAvatarUrl] = React.useState<string>('');
  const [languageGoal, setLanguageGoal] = React.useState<string>('');
  const [email, setEmail] = React.useState<string>('');
  const [role, setRole] = React.useState<string>('');
  const [saving, setSaving] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [message, setMessage] = React.useState<string>('');

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      // If no token, don't call API; show login-needed state
      if (!token) {
        if (mounted) setLoaded(true);
        return;
      }
      try {
        const profile = await userClient.getProfile(token);
        if (!mounted) return;
  setEmail(profile.email);
  setUsername((profile as any).username || '');
  setAvatarUrl((profile as any).avatar_url || '');
  setLanguageGoal((profile as any).language_goal || '');
        setRole(profile.role);
      } catch (e: any) {
        // Handle unauthorized or network errors gracefully
        console.error(e);
      } finally {
        if (mounted) setLoaded(true);
      }
    })();
    return () => { mounted = false; };
  }, [token]);

  const onSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await userClient.updateProfile({
        username: username || null,
        avatar_url: avatarUrl || null,
        language_goal: languageGoal || null,
      }, token || undefined);
      setMessage(t('success'));
    } catch (e: any) {
      const detail = e.response?.data?.detail;
      if (detail === 'Username already taken') {
        setMessage(t('usernameTaken'));
      } else {
        setMessage(t('error'));
      }
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // Helper: compress image to ~256x256 and return dataURL
  const compressImage = async (file: File, maxSize = 256, quality = 0.8): Promise<string> => {
    const img = document.createElement('img');
    const url = URL.createObjectURL(file);
    try {
      await new Promise((res, rej) => { img.onload = () => res(null as any); img.onerror = rej; img.src = url; });
      const canvas = document.createElement('canvas');
      const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = Math.max(1, Math.round(img.width * ratio));
      canvas.height = Math.max(1, Math.round(img.height * ratio));
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', quality);
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      setAvatarUrl(dataUrl);
    } catch {
      // fallback: raw
      const reader = new FileReader();
      reader.onloadend = () => setAvatarUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const setKotoraAvatar = () => {
    // Simple SVG avatar (tiger-like mascot "可托拉") as data URL
    const svg = encodeURIComponent(`
      <svg xmlns='http://www.w3.org/2000/svg' width='256' height='256' viewBox='0 0 256 256'>
        <rect width='256' height='256' rx='40' fill='#FDE68A'/>
        <circle cx='128' cy='120' r='70' fill='#F59E0B'/>
        <circle cx='96' cy='110' r='12' fill='#1F2937'/>
        <circle cx='160' cy='110' r='12' fill='#1F2937'/>
        <path d='M96 150 Q128 170 160 150' stroke='#1F2937' stroke-width='8' fill='none' stroke-linecap='round'/>
        <path d='M70 85 l30 10 M156 75 l30 10 M80 140 l-20 10 M196 130 l-20 10' stroke='#92400E' stroke-width='10' stroke-linecap='round'/>
        <text x='128' y='230' font-size='22' text-anchor='middle' fill='#B45309'>可托拉</text>
      </svg>`);
    const url = `data:image/svg+xml;charset=utf-8,${svg}`;
    setAvatarUrl(url);
  };

  // Drag & Drop upload
  const onDrop: React.DragEventHandler<HTMLDivElement> = async (ev) => {
    ev.preventDefault();
    const file = ev.dataTransfer.files?.[0];
    if (!file) return;
    const dataUrl = await compressImage(file);
    setAvatarUrl(dataUrl);
  };

  const onDragOver: React.DragEventHandler<HTMLDivElement> = (ev) => {
    ev.preventDefault();
  };

  // Paste from clipboard
  React.useEffect(() => {
    const onPaste = async (ev: ClipboardEvent) => {
      if (!ev.clipboardData) return;
      const item = Array.from(ev.clipboardData.items).find(i => i.type.startsWith('image/'));
      if (!item) return;
      const file = item.getAsFile();
      if (!file) return;
      const dataUrl = await compressImage(file);
      setAvatarUrl(dataUrl);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">{t('profile')}</h1>
      <Card className="max-w-2xl">
        {!loaded ? (
          <div>{t('loading')}</div>
        ) : !token ? (
          <div className="p-4 text-gray-600 dark:text-gray-300">{t('pleaseLogin')}</div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div 
                className="relative group cursor-pointer"
                onClick={handleAvatarClick}
                onDrop={onDrop}
                onDragOver={onDragOver}
                title={t('clickToUpload')}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={t('avatar')} className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-2xl font-bold text-indigo-600 dark:text-indigo-300">
                    {username ? username[0].toUpperCase() : email[0]?.toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">
                  {t('clickToUpload')}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                aria-label={t('avatar')}
              />
              <div>
                <h2 className="text-xl font-semibold">{username || email}</h2>
                <p className="text-sm text-gray-500">{role}</p>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">{t('email')} ({t('readOnly')})</label>
              <input
                id="email"
                value={email}
                disabled
                className="w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('username')}</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('chooseUsername')}
                className="w-full px-3 py-2 border rounded"
              />
              <p className="text-xs text-gray-500 mt-1">{t('usedForDisplay')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('avatarUrl')}</label>
              <input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-3 py-2 border rounded"
              />
              <p className="text-xs text-gray-500 mt-1">{t('linkToProfilePic')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('languageGoal')}</label>
              <input
                value={languageGoal}
                onChange={(e) => setLanguageGoal(e.target.value)}
                placeholder={t('languageGoalPlaceholder')}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button type="submit" disabled={saving}>{saving ? t('loading') : t('save')}</Button>
              <Button variant="secondary" onClick={setKotoraAvatar}>使用預設頭像（可托拉）</Button>
              {message && <span className={`text-sm ${message === t('success') ? 'text-green-600' : 'text-red-600'}`}>{message}</span>}
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default ProfilePage;
