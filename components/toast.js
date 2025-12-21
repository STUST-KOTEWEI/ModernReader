/**
 * ModernReader - Toast Notification Component
 * 彈出通知組件
 */

const Toast = {
  container: null,

  /**
   * 初始化 Toast 容器
   */
  init() {
    if (this.container) return;
    
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.style.cssText = `
      position: fixed;
      top: 100px;
      right: 24px;
      z-index: 10001;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
    `;
    document.body.appendChild(this.container);
  },

  /**
   * 顯示 Toast 通知
   * @param {string} message - 通知訊息
   * @param {object} options - 配置選項
   */
  show(message, options = {}) {
    this.init();
    
    const {
      type = 'info',       // info, success, warning, error
      duration = 3000,     // 顯示時長（毫秒）
      icon = null,         // 自定義圖標
      action = null,       // 操作按鈕 { text: string, onClick: function }
      position = 'right'   // left, center, right
    } = options;

    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };

    const colors = {
      info: 'rgba(132, 94, 247, 0.95)',
      success: 'rgba(16, 185, 129, 0.95)',
      warning: 'rgba(245, 158, 11, 0.95)',
      error: 'rgba(239, 68, 68, 0.95)'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      background: ${colors[type]};
      border-radius: 12px;
      color: white;
      font-size: 14px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      transform: translateX(120%);
      transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      pointer-events: auto;
      max-width: 360px;
    `;

    toast.innerHTML = `
      <span class="toast-icon">${icon || icons[type]}</span>
      <span class="toast-message">${message}</span>
      ${action ? `<button class="toast-action" style="
        background: rgba(255,255,255,0.2);
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        color: white;
        cursor: pointer;
        font-size: 12px;
        margin-left: auto;
      ">${action.text}</button>` : ''}
      <button class="toast-close" style="
        background: none;
        border: none;
        color: rgba(255,255,255,0.7);
        cursor: pointer;
        font-size: 18px;
        padding: 0 4px;
        margin-left: ${action ? '8px' : 'auto'};
      ">&times;</button>
    `;

    this.container.appendChild(toast);

    // 動畫進入
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
    });

    // 綁定關閉按鈕
    toast.querySelector('.toast-close').addEventListener('click', () => {
      this.dismiss(toast);
    });

    // 綁定操作按鈕
    if (action?.onClick) {
      toast.querySelector('.toast-action')?.addEventListener('click', () => {
        action.onClick();
        this.dismiss(toast);
      });
    }

    // 自動消失
    if (duration > 0) {
      setTimeout(() => this.dismiss(toast), duration);
    }

    return toast;
  },

  /**
   * 關閉 Toast
   * @param {HTMLElement} toast - Toast 元素
   */
  dismiss(toast) {
    toast.style.transform = 'translateX(120%)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  },

  /**
   * 顯示成功通知
   */
  success(message, options = {}) {
    return this.show(message, { ...options, type: 'success' });
  },

  /**
   * 顯示錯誤通知
   */
  error(message, options = {}) {
    return this.show(message, { ...options, type: 'error' });
  },

  /**
   * 顯示警告通知
   */
  warning(message, options = {}) {
    return this.show(message, { ...options, type: 'warning' });
  },

  /**
   * 顯示信息通知
   */
  info(message, options = {}) {
    return this.show(message, { ...options, type: 'info' });
  },

  /**
   * 清除所有 Toast
   */
  clearAll() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
};

// 導出模組
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Toast };
}
