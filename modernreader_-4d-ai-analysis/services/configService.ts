// 集中管理端點配置：localStorage > .env > 預設代理
export function getSdBase(): string {
  const ls = localStorage.getItem('sdUrl');
  if (ls && ls.trim()) return ls.trim();
  const env = (import.meta as any)?.env?.VITE_SD_URL as string | undefined;
  return env && env.trim() ? env.trim() : '/sdapi';
}

export function getTtsBase(): string {
  const ls = localStorage.getItem('ttsUrl');
  if (ls && ls.trim()) return ls.trim();
  const env = (import.meta as any)?.env?.VITE_TTS_API_URL as string | undefined;
  return env && env.trim() ? env.trim() : '/ttsapi';
}

export function getSttBase(): string {
  const ls = localStorage.getItem('sttUrl');
  if (ls && ls.trim()) return ls.trim();
  const env = (import.meta as any)?.env?.VITE_STT_API_URL as string | undefined;
  return env && env.trim() ? env.trim() : '/sttapi';
}
