// 本地 Stable Diffusion 圖片生成服務
// 需自架 Stable Diffusion Web API (如 AUTOMATIC1111, ComfyUI)
// 預設 API: http://localhost:7860/sdapi/v1/txt2img

import { getSdBase } from './configService';
const SD_BASE = getSdBase();

export async function generateImageLocal(prompt: string, options?: {
  negative_prompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfg_scale?: number;
}): Promise<string | null> {
  try {
    // 優先使用 .env 或代理路徑，其次預設 localhost 7860
    const url = `${SD_BASE}/v1/txt2img`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        negative_prompt: options?.negative_prompt || '',
        width: options?.width || 512,
        height: options?.height || 512,
        steps: options?.steps || 20,
        cfg_scale: options?.cfg_scale || 7,
      })
    });
    const data = await response.json();
    // 回傳 base64 圖片資料
    if (data && data.images && data.images.length > 0) {
      return `data:image/png;base64,${data.images[0]}`;
    }
    return null;
  } catch (err) {
    console.error('Stable Diffusion local API error:', err);
    // 最後嘗試直接 localhost 端點
    try {
      const fallbackResp = await fetch('http://localhost:7860/sdapi/v1/txt2img', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          negative_prompt: options?.negative_prompt || '',
          width: options?.width || 512,
          height: options?.height || 512,
          steps: options?.steps || 20,
          cfg_scale: options?.cfg_scale || 7,
        })
      });
      const data = await fallbackResp.json();
      if (data && data.images && data.images.length > 0) {
        return `data:image/png;base64,${data.images[0]}`;
      }
    } catch (e2) {
      console.error('Stable Diffusion localhost fallback failed:', e2);
    }
    return null;
  }
}
