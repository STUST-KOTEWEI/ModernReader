/**
 * ModernReader - Keyboard Shortcuts Module
 * 鍵盤快捷鍵支援模組
 */

const Keyboard = {
  shortcuts: new Map(),
  enabled: true,
  debug: false,

  /**
   * 初始化鍵盤快捷鍵
   */
  init() {
    document.addEventListener('keydown', (e) => this.handleKeydown(e));
    this.registerDefaults();
    console.log('⌨️ Keyboard shortcuts initialized');
  },

  /**
   * 處理按鍵事件
   * @param {KeyboardEvent} e
   */
  handleKeydown(e) {
    if (!this.enabled) return;
    
    // 忽略輸入框中的按鍵
    const tagName = e.target.tagName.toLowerCase();
    if (['input', 'textarea', 'select'].includes(tagName)) {
      // 但允許 Escape 關閉
      if (e.key !== 'Escape') return;
    }

    const combo = this.getCombo(e);
    
    if (this.debug) {
      console.log('Key combo:', combo);
    }

    const handler = this.shortcuts.get(combo);
    if (handler) {
      e.preventDefault();
      handler.callback(e);
      
      // 記錄分析
      if (typeof Analytics !== 'undefined') {
        Analytics.track('keyboard_shortcut', { combo, action: handler.description });
      }
    }
  },

  /**
   * 獲取按鍵組合字串
   * @param {KeyboardEvent} e
   * @returns {string}
   */
  getCombo(e) {
    const parts = [];
    
    if (e.ctrlKey || e.metaKey) parts.push('ctrl');
    if (e.altKey) parts.push('alt');
    if (e.shiftKey) parts.push('shift');
    
    // 標準化按鍵名
    let key = e.key.toLowerCase();
    if (key === ' ') key = 'space';
    if (key === 'arrowleft') key = 'left';
    if (key === 'arrowright') key = 'right';
    if (key === 'arrowup') key = 'up';
    if (key === 'arrowdown') key = 'down';
    
    parts.push(key);
    return parts.join('+');
  },

  /**
   * 註冊快捷鍵
   * @param {string} combo - 按鍵組合 (如 'ctrl+s', 'escape')
   * @param {Function} callback - 回調函數
   * @param {string} description - 描述
   */
  register(combo, callback, description = '') {
    const normalizedCombo = combo.toLowerCase().replace(/\s/g, '');
    this.shortcuts.set(normalizedCombo, { callback, description });
  },

  /**
   * 取消註冊快捷鍵
   * @param {string} combo - 按鍵組合
   */
  unregister(combo) {
    this.shortcuts.delete(combo.toLowerCase());
  },

  /**
   * 註冊預設快捷鍵
   */
  registerDefaults() {
    // Escape - 關閉模態框
    this.register('escape', () => {
      if (typeof Modal !== 'undefined' && Modal.activeModals.length > 0) {
        Modal.closeAll();
      }
    }, '關閉視窗');

    // 左右箭頭 - 翻頁（書籍導航）
    this.register('left', () => {
      this.triggerPageNavigation('previous');
    }, '上一頁');

    this.register('right', () => {
      this.triggerPageNavigation('next');
    }, '下一頁');

    // Ctrl+S - 儲存
    this.register('ctrl+s', () => {
      const saveBtn = document.getElementById('saveRitual');
      if (saveBtn) saveBtn.click();
    }, '儲存閱讀儀式');

    // Ctrl+B - 添加書籤
    this.register('ctrl+b', () => {
      if (typeof Bookmarks !== 'undefined') {
        Bookmarks.add('current', {
          chapter: document.querySelector('#livePreview .preview-header span:first-child')?.textContent || 'Unknown',
          position: window.scrollY
        });
        if (typeof Toast !== 'undefined') {
          Toast.success('已添加書籤');
        }
      }
    }, '添加書籤');

    // Ctrl+K - 搜尋
    this.register('ctrl+k', () => {
      // 可以擴展為開啟搜尋模態框
      console.log('Search triggered');
    }, '搜尋');

    // / - 快速搜尋
    this.register('/', () => {
      const searchInput = document.querySelector('input[type="search"], #searchInput');
      if (searchInput) {
        searchInput.focus();
      }
    }, '快速搜尋');

    // T - 切換主題
    this.register('t', () => {
      const themeToggle = document.getElementById('themeToggle');
      if (themeToggle) themeToggle.click();
    }, '切換主題');

    // ? - 顯示快捷鍵說明
    this.register('shift+/', () => {
      this.showHelp();
    }, '顯示快捷鍵說明');

    // H - 回到頂部
    this.register('h', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, '回到頂部');

    // J/K - 上下滾動（類似 Vim）
    this.register('j', () => {
      window.scrollBy({ top: 100, behavior: 'smooth' });
    }, '向下滾動');

    this.register('k', () => {
      window.scrollBy({ top: -100, behavior: 'smooth' });
    }, '向上滾動');

    // 數字鍵 1-4 - 導航到區塊
    ['1', '2', '3', '4'].forEach((num, index) => {
      const sections = ['hero', 'experiences', 'immersion', 'curation'];
      this.register(num, () => {
        const section = document.getElementById(sections[index]);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' });
        }
      }, `跳至區塊 ${num}`);
    });
  },

  /**
   * 觸發頁面導航
   * @param {string} direction - 'previous' 或 'next'
   */
  triggerPageNavigation(direction) {
    const scrollLeft = document.getElementById('scrollLeft');
    const scrollRight = document.getElementById('scrollRight');
    
    if (direction === 'previous' && scrollLeft) {
      scrollLeft.click();
    } else if (direction === 'next' && scrollRight) {
      scrollRight.click();
    }
  },

  /**
   * 顯示快捷鍵說明
   */
  showHelp() {
    const shortcuts = Array.from(this.shortcuts.entries())
      .map(([combo, { description }]) => `
        <tr>
          <td><kbd>${combo.split('+').map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(' + ')}</kbd></td>
          <td>${description}</td>
        </tr>
      `).join('');

    const content = `
      <style>
        .keyboard-help table { width: 100%; border-collapse: collapse; }
        .keyboard-help td { padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .keyboard-help kbd { 
          background: rgba(255,255,255,0.1); 
          padding: 4px 8px; 
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
        }
      </style>
      <div class="keyboard-help">
        <table>${shortcuts}</table>
      </div>
    `;

    if (typeof Modal !== 'undefined') {
      const modal = Modal.create({
        title: '⌨️ 鍵盤快捷鍵',
        content,
        size: 'medium'
      });
      Modal.open(modal.id);
    }
  },

  /**
   * 啟用/禁用快捷鍵
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  },

  /**
   * 獲取所有已註冊的快捷鍵
   * @returns {Array}
   */
  getAll() {
    return Array.from(this.shortcuts.entries()).map(([combo, { description }]) => ({
      combo,
      description
    }));
  }
};

// 初始化
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    Keyboard.init();
  });
}

// 導出模組
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Keyboard };
}

// 瀏覽器環境下掛載到 window
if (typeof window !== 'undefined') {
  window.Keyboard = Keyboard;
}
