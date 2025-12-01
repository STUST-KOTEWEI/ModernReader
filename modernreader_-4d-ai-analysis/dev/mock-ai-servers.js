// Simple mock servers for local AI services (no external dependencies)
// Ports:
// - 7860: Stable Diffusion mock (AUTOMATIC1111-like endpoints under /sdapi)
// - 5002: TTS mock (POST /api/tts -> { audio: <base64-wav> }, GET /api/health)
// - 5003: STT mock (POST /api/stt -> { text })

import http from 'node:http';

const SD_PORT = Number(process.env.SD_PORT || 7860);
const TTS_PORT = Number(process.env.TTS_PORT || 5002);
const STT_PORT = Number(process.env.STT_PORT || 5003);

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

// Generate a 0.5s 24kHz mono 16-bit PCM sine wave (A4 440Hz) WAV and return base64
function generateBeepWavBase64() {
  const sampleRate = 24000;
  const durationSec = 0.5;
  const frames = Math.floor(sampleRate * durationSec);
  const freq = 440;
  const amplitude = 0.2; // 0..1

  const pcm16 = new Int16Array(frames);
  for (let i = 0; i < frames; i++) {
    const t = i / sampleRate;
    const s = Math.sin(2 * Math.PI * freq * t) * amplitude;
    pcm16[i] = Math.max(-1, Math.min(1, s)) * 32767;
  }

  const headerSize = 44;
  const dataSize = pcm16.length * 2;
  const buffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buffer);

  function writeString(offset, str) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

  // RIFF header
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true); // file size - 8
  writeString(8, 'WAVE');

  // fmt chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // audio format PCM
  view.setUint16(22, 1, true); // channels
  view.setUint32(24, sampleRate, true); // sample rate
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample

  // data chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // PCM data
  const out = new Int16Array(buffer, headerSize, pcm16.length);
  out.set(pcm16);

  return Buffer.from(buffer).toString('base64');
}

const ONE_BY_ONE_PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

// SD mock server (7860)
http.createServer(async (req, res) => {
  const url = req.url || '';
  if (req.method === 'GET' && url.startsWith('/sdapi/v1/sd-models')) {
    return sendJson(res, 200, [{ title: 'Mock SD Model' }]);
  }
  if (req.method === 'GET' && url.startsWith('/sdapi/v1/progress')) {
    return sendJson(res, 200, { progress: 0.0, eta_relative: 0 });
  }
  if (req.method === 'POST' && url.startsWith('/sdapi/v1/txt2img')) {
    await readBody(req); // ignore payload
    return sendJson(res, 200, { images: [ONE_BY_ONE_PNG_B64] });
  }
  sendJson(res, 404, { error: 'not found' });
}).listen(SD_PORT, () => console.log(`[mock-ai] SD mock listening on :${SD_PORT}`));

// TTS mock server (5002)
http.createServer(async (req, res) => {
  const url = req.url || '';
  if (req.method === 'GET' && (url === '/api/health' || url === '/health')) {
    return sendJson(res, 200, { ok: true });
  }
  if (req.method === 'POST' && url === '/api/tts') {
    await readBody(req); // consume
    const b64 = generateBeepWavBase64();
    return sendJson(res, 200, { audio: b64 });
  }
  if (req.method === 'OPTIONS' && url === '/api/tts') {
    res.writeHead(204);
    return res.end();
  }
  sendJson(res, 404, { error: 'not found' });
}).listen(TTS_PORT, () => console.log(`[mock-ai] TTS mock listening on :${TTS_PORT}`));

// STT mock server (5003)
http.createServer(async (req, res) => {
  const url = req.url || '';
  if (req.method === 'GET' && (url === '/api/health' || url === '/health')) {
    return sendJson(res, 200, { ok: true });
  }
  if (req.method === 'POST' && url === '/api/stt') {
    await readBody(req); // consume audio blob
    return sendJson(res, 200, { text: '這是模擬轉錄結果（mock transcript）' });
  }
  if (req.method === 'OPTIONS' && url === '/api/stt') {
    res.writeHead(204);
    return res.end();
  }
  sendJson(res, 404, { error: 'not found' });
}).listen(STT_PORT, () => console.log(`[mock-ai] STT mock listening on :${STT_PORT}`));
