import React, { useEffect, useRef, useState } from 'react';
import { checkSdHealth, checkTtsHealth, checkSttHealth } from '../services/healthService';
import { getSdBase, getTtsBase, getSttBase } from '../services/configService';

const Badge: React.FC<{ ok: boolean; title?: string }> = ({ ok, title }) => (
  <span title={title} className={`ml-2 px-2 py-0.5 text-xs rounded ${ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{ok ? 'OK' : 'NG'}</span>
);

export default function ServiceStatus() {
  const [sd, setSd] = useState<{ ok: boolean; base: string; msg?: string }>({ ok: false, base: getSdBase() });
  const [tts, setTts] = useState<{ ok: boolean; base: string; msg?: string }>({ ok: false, base: getTtsBase() });
  const [stt, setStt] = useState<{ ok: boolean; base: string; msg?: string }>({ ok: false, base: getSttBase() });
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<number | null>(null);
  const [auto, setAuto] = useState<boolean>(() => (localStorage.getItem('svcAutoRefresh') === '1'));
  const timerRef = useRef<number | null>(null);

  const refresh = async () => {
    setLoading(true);
    const [sdh, ttsh, stth] = await Promise.all([checkSdHealth(), checkTtsHealth(), checkSttHealth()]);
    setSd({ ok: sdh.ok, base: getSdBase(), msg: sdh.message });
    setTts({ ok: ttsh.ok, base: getTtsBase(), msg: ttsh.message });
    setStt({ ok: stth.ok, base: getSttBase(), msg: stth.message });
    setLoading(false);
    setLastChecked(Date.now());
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (auto) {
      // 30s 週期刷新
      timerRef.current = window.setInterval(() => refresh(), 30000) as unknown as number;
      localStorage.setItem('svcAutoRefresh', '1');
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      localStorage.setItem('svcAutoRefresh', '0');
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [auto]);

  return (
    <div className="sticky top-0 z-40 bg-gray-900/70 backdrop-blur border-b border-gray-800 text-gray-200 flex items-center justify-between px-4 py-2">
      <div className="text-sm flex gap-4">
        <div title={sd.msg}>SD: <code className="text-cyan-300">{sd.base}</code><Badge ok={sd.ok} title={sd.msg} /></div>
        <div title={tts.msg}>TTS: <code className="text-cyan-300">{tts.base}</code><Badge ok={tts.ok} title={tts.msg} /></div>
        <div title={stt.msg}>STT: <code className="text-cyan-300">{stt.base}</code><Badge ok={stt.ok} title={stt.msg} /></div>
      </div>
      <div className="flex items-center gap-2">
        {lastChecked && <span className="text-xs text-gray-400 mr-2" title={new Date(lastChecked).toLocaleString()}>Updated {Math.max(1, Math.round((Date.now() - lastChecked) / 1000))}s ago</span>}
        <label className="text-xs flex items-center gap-1 mr-2 select-none">
          <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Auto
        </label>
        <a href="#/settings" className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded">Settings</a>
        <button onClick={refresh} disabled={loading} className="px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 rounded disabled:bg-gray-600">{loading ? 'Checking…' : 'Refresh'}</button>
      </div>
    </div>
  );
}
