// 本地 TTS 服務封裝：優先嘗試自架 Coqui TTS (HTTP API)，再退回瀏覽器 Web Speech API。
// 建議在本機啟動一個支援 /api/tts 端點的服務，回傳 base64 音訊（16k~24k PCM 或 MP3）。

import { getTtsBase } from './configService';
const TTS_BASE = getTtsBase();

export async function textToSpeechLocal(text: string): Promise<string> {
  // 1) 嘗試呼叫本地 Coqui/自架 API，預設 http://localhost:5002/api/tts
  try {
    const resp = await fetch(`${TTS_BASE}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice: 'female_en', format: 'wav', sample_rate: 24000 })
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data && data.audio) {
        return data.audio as string; // base64
      }
    }
  } catch (e) {
    console.warn('Local TTS HTTP API unavailable, fallback to Web Speech API.', e);
  }

  // 2) Web Speech API fallback: 直接播放，不回傳 base64
  // 為了維持呼叫介面一致性，這裡回傳空字串，呼叫端需偵測空字串並改用 Web Speech API 播放。
  return '';
}
