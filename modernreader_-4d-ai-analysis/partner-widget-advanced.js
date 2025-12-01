// ModernReader 進階 Partner Widget 範例
// 功能：主題色自動切換、API 串接、與主程式溝通
(function(){
  const slot = document.getElementById('vendor-wearable-slot');
  if (!slot) return;

  // 主題色偵測（預設紫色/藍色，支援主程式主題色變化）
  function getTheme() {
    const root = document.documentElement;
    // 假設主程式有設置 CSS 變數 --accent-purple, --accent-cyan
    return {
      accent: getComputedStyle(root).getPropertyValue('--accent-purple') || '#8B5CF6',
      accent2: getComputedStyle(root).getPropertyValue('--accent-cyan') || '#22D3EE',
      text: getComputedStyle(root).getPropertyValue('--text-primary') || '#fff',
      bg: getComputedStyle(root).getPropertyValue('--background-primary') || '#181c20'
    };
  }

  // Widget root
  const root = document.createElement('div');
  root.id = 'partner-widget-advanced';
  root.style.cssText = [
    `background: linear-gradient(90deg, ${getTheme().accent} 0%, ${getTheme().accent2} 100%)`,
    'color: #fff',
    'border-radius: 16px',
    'padding: 24px',
    'margin: 24px 0',
    'box-shadow: 0 4px 24px #8B5CF688',
    'font-family: Inter, Arial, sans-serif',
    'font-size: 1.1rem',
    'max-width: 420px',
    'text-align: center',
    'z-index: 1000',
    'transition: background 0.5s'
  ].join(';');

  // API 串接（以天氣 API 為例）
  async function fetchWeather() {
    try {
      const res = await fetch('https://wttr.in/Tainan?format=3');
      return await res.text();
    } catch {
      return '天氣資料取得失敗';
    }
  }

  // 與主程式溝通（window.postMessage）
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'theme-update') {
      // 動態切換主題色
      root.style.background = `linear-gradient(90deg, ${e.data.accent} 0%, ${e.data.accent2} 100%)`;
      root.style.color = e.data.text;
    }
    if (e.data && e.data.type === 'user-info') {
      document.getElementById('partner-widget-user').textContent = 'Hi, ' + e.data.name;
    }
  });

  // Widget 內容
  root.innerHTML = `
    <div style="font-size:2.2rem;">🌤️</div>
    <div style="font-weight:700;font-size:1.3rem;">品牌專屬互動 Widget</div>
    <div id="partner-widget-user" style="margin:8px 0 8px 0;font-size:1rem;"></div>
    <div id="partner-widget-weather" style="margin:8px 0 8px 0;font-size:1rem;">載入天氣中...</div>
    <button id="partner-widget-btn" style="margin-top:10px;padding:8px 20px;border-radius:8px;background:#fff;color:${getTheme().accent};font-weight:600;font-size:1rem;border:none;cursor:pointer;">向主程式發送訊息</button>
    <div id="partner-widget-msg" style="margin-top:12px;font-size:1rem;"></div>
  `;

  // 載入天氣
  fetchWeather().then(txt => {
    document.getElementById('partner-widget-weather').textContent = txt;
  });

  // 互動事件
  root.querySelector('#partner-widget-btn').onclick = function() {
    window.postMessage({ type: 'partner-widget', action: 'hello', payload: { msg: '來自合作品牌的問候！' } }, '*');
    document.getElementById('partner-widget-msg').textContent = '訊息已送出給主程式';
  };

  // 掛載到 slot
  slot.style.display = '';
  slot.replaceWith(root);

  // 主動向主程式請求用戶資訊與主題色
  window.postMessage({ type: 'partner-widget', action: 'request-user-info' }, '*');
  window.postMessage({ type: 'partner-widget', action: 'request-theme' }, '*');
})();
