// ModernReader Partner Widget Example
// 供合作廠商掛載於 #vendor-wearable-slot
// 使用方式：於 index.html 載入本檔，或於 devtools console 執行

(function(){
  // 檢查 slot 是否存在
  const slot = document.getElementById('vendor-wearable-slot');
  if (!slot) return;

  // 建立 widget root
  const root = document.createElement('div');
  root.id = 'partner-widget-root';
  root.style.cssText = [
    'background: linear-gradient(90deg, #8B5CF6 0%, #22D3EE 100%)',
    'color: #fff',
    'border-radius: 16px',
    'padding: 24px',
    'margin: 24px 0',
    'box-shadow: 0 4px 24px #8B5CF688',
    'font-family: Inter, Arial, sans-serif',
    'font-size: 1.1rem',
    'max-width: 420px',
    'text-align: center',
    'z-index: 1000'
  ].join(';');

  // Widget 內容
  root.innerHTML = `
    <div style="font-size:2.2rem;">🤝</div>
    <div style="font-weight:700;font-size:1.3rem;">合作夥伴專屬 Widget</div>
    <div style="margin:12px 0 8px 0;">可顯示裝置狀態、品牌資訊、專屬活動等</div>
    <button id="partner-widget-btn" style="margin-top:10px;padding:8px 20px;border-radius:8px;background:#fff;color:#8B5CF6;font-weight:600;font-size:1rem;border:none;cursor:pointer;">顯示品牌訊息</button>
    <div id="partner-widget-msg" style="margin-top:12px;font-size:1rem;"></div>
  `;

  // 互動事件
  root.querySelector('#partner-widget-btn').onclick = function() {
    document.getElementById('partner-widget-msg').textContent = '歡迎加入 ModernReader 4D 生態圈！';
  };

  // 掛載到 slot
  slot.style.display = '';
  slot.replaceWith(root);
})();
