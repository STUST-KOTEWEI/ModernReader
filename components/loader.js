/**
 * ModernReader - Loader Component
 * 載入動畫組件
 */

const Loader = {
  container: null,
  activeLoaders: new Map(),

  /**
   * 初始化載入器容器
   */
  init() {
    if (this.container) return;

    // 添加載入器樣式
    const style = document.createElement('style');
    style.textContent = `
      .loader-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(5, 1, 15, 0.9);
        backdrop-filter: blur(10px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 10003;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .loader-overlay.visible {
        opacity: 1;
      }

      .loader-spinner {
        width: 60px;
        height: 60px;
        border: 3px solid rgba(132, 94, 247, 0.3);
        border-top-color: #845ef7;
        border-radius: 50%;
        animation: loader-spin 1s linear infinite;
      }

      .loader-text {
        margin-top: 20px;
        color: rgba(255, 255, 255, 0.8);
        font-size: 14px;
        letter-spacing: 0.1em;
      }

      .loader-progress {
        width: 200px;
        height: 4px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        margin-top: 16px;
        overflow: hidden;
      }

      .loader-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #845ef7, #ff6b9d);
        border-radius: 2px;
        transition: width 0.3s ease;
      }

      @keyframes loader-spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* 行內載入器 */
      .loader-inline {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .loader-inline .loader-dot {
        width: 8px;
        height: 8px;
        background: #845ef7;
        border-radius: 50%;
        animation: loader-bounce 1.4s ease-in-out infinite;
      }

      .loader-inline .loader-dot:nth-child(1) { animation-delay: 0s; }
      .loader-inline .loader-dot:nth-child(2) { animation-delay: 0.2s; }
      .loader-inline .loader-dot:nth-child(3) { animation-delay: 0.4s; }

      @keyframes loader-bounce {
        0%, 80%, 100% {
          transform: scale(0);
          opacity: 0.5;
        }
        40% {
          transform: scale(1);
          opacity: 1;
        }
      }

      /* 按鈕載入狀態 */
      .btn.loading {
        position: relative;
        color: transparent !important;
        pointer-events: none;
      }

      .btn.loading::after {
        content: '';
        position: absolute;
        width: 16px;
        height: 16px;
        top: 50%;
        left: 50%;
        margin-top: -8px;
        margin-left: -8px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: loader-spin 0.8s linear infinite;
      }

      /* 骨架屏 */
      .skeleton {
        background: linear-gradient(90deg, 
          rgba(255, 255, 255, 0.05) 25%, 
          rgba(255, 255, 255, 0.1) 50%, 
          rgba(255, 255, 255, 0.05) 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s infinite;
        border-radius: 4px;
      }

      .skeleton-text {
        height: 1em;
        margin-bottom: 0.5em;
      }

      .skeleton-title {
        height: 1.5em;
        width: 60%;
        margin-bottom: 1em;
      }

      .skeleton-image {
        width: 100%;
        padding-bottom: 56.25%;
      }

      @keyframes skeleton-loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `;
    document.head.appendChild(style);
  },

  /**
   * 顯示全頁載入器
   * @param {object} options - 配置選項
   * @returns {string} 載入器 ID
   */
  show(options = {}) {
    this.init();

    const {
      text = '載入中...',
      showProgress = false,
      id = `loader-${Date.now()}`
    } = options;

    const overlay = document.createElement('div');
    overlay.id = id;
    overlay.className = 'loader-overlay';
    overlay.innerHTML = `
      <div class="loader-spinner"></div>
      <div class="loader-text">${text}</div>
      ${showProgress ? `
        <div class="loader-progress">
          <div class="loader-progress-bar" style="width: 0%"></div>
        </div>
      ` : ''}
    `;

    document.body.appendChild(overlay);
    this.activeLoaders.set(id, overlay);

    // 觸發動畫
    requestAnimationFrame(() => {
      overlay.classList.add('visible');
    });

    return id;
  },

  /**
   * 隱藏載入器
   * @param {string} id - 載入器 ID
   */
  hide(id) {
    const overlay = this.activeLoaders.get(id);
    if (!overlay) return;

    overlay.classList.remove('visible');
    setTimeout(() => {
      overlay.remove();
      this.activeLoaders.delete(id);
    }, 300);
  },

  /**
   * 隱藏所有載入器
   */
  hideAll() {
    this.activeLoaders.forEach((_, id) => this.hide(id));
  },

  /**
   * 更新載入進度
   * @param {string} id - 載入器 ID
   * @param {number} progress - 進度 (0-100)
   * @param {string} text - 更新文字
   */
  setProgress(id, progress, text = null) {
    const overlay = this.activeLoaders.get(id);
    if (!overlay) return;

    const progressBar = overlay.querySelector('.loader-progress-bar');
    if (progressBar) {
      progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }

    if (text) {
      const textEl = overlay.querySelector('.loader-text');
      if (textEl) textEl.textContent = text;
    }
  },

  /**
   * 創建行內載入器
   * @returns {HTMLElement}
   */
  createInline() {
    this.init();
    
    const loader = document.createElement('span');
    loader.className = 'loader-inline';
    loader.innerHTML = `
      <span class="loader-dot"></span>
      <span class="loader-dot"></span>
      <span class="loader-dot"></span>
    `;
    return loader;
  },

  /**
   * 設置按鈕載入狀態
   * @param {HTMLElement} button - 按鈕元素
   * @param {boolean} loading - 是否載入中
   */
  setButtonLoading(button, loading) {
    this.init();
    
    if (loading) {
      button.classList.add('loading');
      button.disabled = true;
    } else {
      button.classList.remove('loading');
      button.disabled = false;
    }
  },

  /**
   * 創建骨架屏
   * @param {string} type - 類型 (text, title, image)
   * @param {number} count - 數量
   * @returns {HTMLElement}
   */
  createSkeleton(type = 'text', count = 1) {
    this.init();
    
    const container = document.createElement('div');
    
    for (let i = 0; i < count; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = `skeleton skeleton-${type}`;
      container.appendChild(skeleton);
    }
    
    return container;
  }
};

// 導出模組
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Loader };
}

// 瀏覽器環境下掛載到 window
if (typeof window !== 'undefined') {
  window.Loader = Loader;
}
