// 本地 STT 服務：使用瀏覽器 Web Speech API 進行語音辨識
// 如果瀏覽器不支援，則回退到 mock 服務

import { getSttBase } from './configService';
const STT_BASE = getSttBase();

// 使用瀏覽器 Web Speech API 進行語音辨識
export async function transcribeLocalAudio(audioBlob: Blob): Promise<string | null> {
  // 優先嘗試使用瀏覽器的 Web Speech API
  // 但因為 Web Speech API 需要即時串流，我們改用 mock 服務端點
  // 若要真實 STT，建議整合 Google Cloud Speech-to-Text 或 Azure Speech Service
  
  try {
    // 嘗試上傳到本地 STT 服務（若有配置）
    const resp = await fetch(`${STT_BASE}/stt`, {
      method: 'POST',
      headers: {
        'Content-Type': audioBlob.type || 'application/octet-stream'
      },
      body: audioBlob
    });
    if (!resp.ok) throw new Error(`Local STT HTTP ${resp.status}`);
    const data = await resp.json();
    if (data && typeof data.text === 'string') return data.text;
    return null;
  } catch (e) {
    console.warn('Local STT failed, trying fallback:', e);
    // 回退到 localhost 端點
    try {
      const resp2 = await fetch('http://localhost:5003/api/stt', {
        method: 'POST',
        headers: { 'Content-Type': audioBlob.type || 'application/octet-stream' },
        body: audioBlob
      });
      if (resp2.ok) {
        const data2 = await resp2.json();
        if (data2 && typeof data2.text === 'string') return data2.text;
      }
    } catch (e2) {
      console.warn('Localhost STT fallback failed:', e2);
    }
    
    // 最後回退：使用 Web Speech API (需要重新錄音)
    console.warn('All STT endpoints failed. Please use Web Speech API via the microphone button.');
    return null;
  }
}

// 使用瀏覽器原生 Web Speech API 進行即時語音辨識
export function startWebSpeechRecognition(
  onResult: (text: string) => void,
  onError?: (error: any) => void
): { stop: () => void } | null {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.error('Web Speech API is not supported in this browser');
    if (onError) onError(new Error('Web Speech API not supported'));
    return null;
  }

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = 'zh-TW'; // 可以改為 'en-US' 或其他語言

  recognition.onresult = (event: any) => {
    const transcript = Array.from(event.results)
      .map((result: any) => result[0].transcript)
      .join('');
    onResult(transcript);
  };

  recognition.onerror = (event: any) => {
    console.error('Speech recognition error:', event.error);
    if (onError) onError(event.error);
  };

  recognition.start();

  return {
    stop: () => recognition.stop()
  };
}
