import React from 'react';

export function HealthBanner() {
  const [healthy, setHealthy] = React.useState<boolean | null>(null);
  const [detail, setDetail] = React.useState<string>('');
  const failRef = React.useRef(0);
  const [isDemo, setIsDemo] = React.useState<boolean>(() => {
    try { return typeof window !== 'undefined' && (window.location.protocol === 'file:' || localStorage.getItem('mr_demo') === '1'); } catch { return false; }
  });

  const check = React.useCallback(async () => {
    // Probe multiple backend health endpoints; consider healthy if any returns 200
    const probes = [
      '/api/v1/health',
      '/api/v1/recommender/health',
      '/api/v1/ai/health',
      '/api/v1/rag/health',
      '/api/v1/crowdsourcing/health',
      '/api/v1/cognitive/health',
    ];
    for (const path of probes) {
      try {
        const res = await fetch(path, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          setHealthy(true);
          setDetail(data?.status ? `${data.status} @ ${path}` : `ok @ ${path}`);
          // If backend is healthy and we are in demo but not forced, offer switch back
          try {
            const forced = localStorage.getItem('mr_demo_forced') === '1';
            if (isDemo && !forced) {
              // don’t auto-flip silently; render a banner button below
            }
          } catch {}
          return;
        }
      } catch {
        // ignore and continue to next probe
      }
    }
    // If none succeeded, mark unhealthy; show last attempted path's 404 as detail for clarity
    setHealthy(false);
    setDetail('404');
    // After a couple failures, auto-enable demo mode to avoid repeated 500s for users
    try {
      failRef.current += 1;
      if (failRef.current >= 2) {
        localStorage.setItem('mr_demo', '1');
        setIsDemo(true);
      }
    } catch {}
  }, []);

  React.useEffect(() => {
    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, [check]);

  // Render:
  // - If demo AND backend healthy -> show a green banner to switch back to live
  if (isDemo && healthy === true) {
    return (
      <div className="w-full bg-green-600 text-white text-sm py-2 px-4 flex items-center justify-between">
        <div>
          <strong>已偵測到後端可用</strong>（{detail}）。可切換回線上版以載入真實資料。
        </div>
        <button
          className="bg-white/20 hover:bg-white/30 rounded px-3 py-1"
          onClick={() => {
            try {
              localStorage.removeItem('mr_demo');
              localStorage.removeItem('mr_demo_forced');
              localStorage.setItem('mr_online_requested', '1');
            } catch {}
            window.location.reload();
          }}
        >切換到線上版</button>
      </div>
    );
  }

  // - If not demo AND backend unhealthy -> show red banner
  if (!isDemo && healthy === false) {
    return (
      <div className="w-full bg-red-600 text-white text-sm py-2 px-4">
        <strong>後端服務不可用</strong>（{detail}）。部分功能將暫時停用，請稍後重試。
      </div>
    );
  }

  return null;
}
