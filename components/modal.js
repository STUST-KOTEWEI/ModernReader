/**
 * ModernReader - Modal Component
 * 可重用的模態框組件
 */

const Modal = {
  activeModals: [],

  /**
   * 開啟模態框
   * @param {string} modalId - 模態框 ID
   * @param {object} options - 配置選項
   */
  open(modalId, options = {}) {
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.warn(`Modal with id "${modalId}" not found`);
      return;
    }

    const {
      onOpen = null,
      onClose = null,
      closeOnBackdrop = true,
      closeOnEscape = true
    } = options;

    // 儲存回調
    modal._modalOptions = { onOpen, onClose, closeOnBackdrop, closeOnEscape };

    // 顯示模態框
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    modal.classList.add('modal-enter');
    
    setTimeout(() => modal.classList.remove('modal-enter'), 300);

    // 添加到活動列表
    this.activeModals.push(modalId);

    // 綁定背景點擊關閉
    if (closeOnBackdrop) {
      modal._backdropHandler = (e) => {
        if (e.target === modal) {
          this.close(modalId);
        }
      };
      modal.addEventListener('click', modal._backdropHandler);
    }

    // 執行開啟回調
    if (onOpen) onOpen(modal);

    // 記錄分析
    if (typeof Analytics !== 'undefined') {
      Analytics.track('modal_open', { modalId });
    }
  },

  /**
   * 關閉模態框
   * @param {string} modalId - 模態框 ID
   */
  close(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const options = modal._modalOptions || {};

    // 添加退出動畫
    modal.classList.add('modal-exit');
    
    setTimeout(() => {
      modal.style.display = 'none';
      modal.classList.remove('modal-exit');
      document.body.style.overflow = 'auto';

      // 移除背景點擊監聽
      if (modal._backdropHandler) {
        modal.removeEventListener('click', modal._backdropHandler);
        delete modal._backdropHandler;
      }

      // 從活動列表移除
      const index = this.activeModals.indexOf(modalId);
      if (index > -1) {
        this.activeModals.splice(index, 1);
      }

      // 執行關閉回調
      if (options.onClose) options.onClose(modal);
    }, 300);

    // 記錄分析
    if (typeof Analytics !== 'undefined') {
      Analytics.track('modal_close', { modalId });
    }
  },

  /**
   * 關閉所有模態框
   */
  closeAll() {
    [...this.activeModals].forEach(modalId => this.close(modalId));
  },

  /**
   * 創建動態模態框
   * @param {object} config - 模態框配置
   * @returns {HTMLElement} 模態框元素
   */
  create(config) {
    const {
      id = `modal-${Date.now()}`,
      title = '',
      content = '',
      buttons = [],
      size = 'medium', // small, medium, large
      closable = true
    } = config;

    const modal = document.createElement('div');
    modal.id = id;
    modal.className = 'modal';

    const sizeClass = {
      small: 'max-width: 400px;',
      medium: 'max-width: 600px;',
      large: 'max-width: 800px;'
    }[size] || '';

    modal.innerHTML = `
      <div class="modal-content" style="${sizeClass}">
        ${closable ? `<span class="modal-close" data-close="${id}">&times;</span>` : ''}
        ${title ? `<h2>${title}</h2>` : ''}
        <div class="modal-body">${content}</div>
        ${buttons.length > 0 ? `
          <div class="modal-footer">
            ${buttons.map(btn => `
              <button class="btn ${btn.primary ? 'btn--primary' : 'btn--ghost'}" 
                      data-action="${btn.action || ''}">${btn.text}</button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;

    // 綁定關閉按鈕
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close(id));
    }

    // 綁定按鈕動作
    buttons.forEach((btn, index) => {
      const buttonEl = modal.querySelectorAll('.modal-footer .btn')[index];
      if (buttonEl && btn.onClick) {
        buttonEl.addEventListener('click', () => btn.onClick(modal));
      }
    });

    document.body.appendChild(modal);
    return modal;
  },

  /**
   * 確認對話框
   * @param {string} message - 確認訊息
   * @param {object} options - 選項
   * @returns {Promise<boolean>}
   */
  confirm(message, options = {}) {
    return new Promise((resolve) => {
      const {
        title = '確認',
        confirmText = '確定',
        cancelText = '取消'
      } = options;

      const modal = this.create({
        title,
        content: `<p>${message}</p>`,
        buttons: [
          {
            text: cancelText,
            onClick: (m) => {
              this.close(m.id);
              resolve(false);
            }
          },
          {
            text: confirmText,
            primary: true,
            onClick: (m) => {
              this.close(m.id);
              resolve(true);
            }
          }
        ],
        size: 'small'
      });

      this.open(modal.id);
    });
  },

  /**
   * 提示對話框
   * @param {string} message - 提示訊息
   * @param {object} options - 選項
   * @returns {Promise<void>}
   */
  alert(message, options = {}) {
    return new Promise((resolve) => {
      const { title = '提示', buttonText = '確定' } = options;

      const modal = this.create({
        title,
        content: `<p>${message}</p>`,
        buttons: [
          {
            text: buttonText,
            primary: true,
            onClick: (m) => {
              this.close(m.id);
              resolve();
            }
          }
        ],
        size: 'small'
      });

      this.open(modal.id);
    });
  }
};

// 全局 Escape 鍵監聽
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && Modal.activeModals.length > 0) {
    const lastModalId = Modal.activeModals[Modal.activeModals.length - 1];
    const modal = document.getElementById(lastModalId);
    if (modal?._modalOptions?.closeOnEscape !== false) {
      Modal.close(lastModalId);
    }
  }
});

// 兼容舊版 openModal/closeModal 函數
function openModal(modalId) {
  Modal.open(modalId);
}

function closeModal(modalId) {
  Modal.close(modalId);
}

// 導出模組
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Modal };
}

// 瀏覽器環境下掛載到 window
if (typeof window !== 'undefined') {
  window.Modal = Modal;
  window.openModal = openModal;
  window.closeModal = closeModal;
}
