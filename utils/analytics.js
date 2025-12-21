/**
 * ModernReader - Analytics Utilities
 * 用戶行為分析工具模組
 */

const Analytics = {
  events: [],
  
  /**
   * 記錄事件
   * @param {string} eventName - 事件名稱
   * @param {object} data - 事件數據
   */
  track(eventName, data = {}) {
    const event = {
      name: eventName,
      data,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    this.events.push(event);
    
    // 在控制台輸出（開發模式）
    if (window.DEBUG_MODE) {
      console.log('📊 Analytics Event:', eventName, data);
    }
    
    // 觸發自定義事件
    window.dispatchEvent(new CustomEvent('analytics:track', { detail: event }));
  },

  /**
   * 記錄頁面瀏覽
   * @param {string} pageName - 頁面名稱
   */
  pageView(pageName) {
    this.track('page_view', { page: pageName });
  },

  /**
   * 記錄用戶互動
   * @param {string} action - 互動類型
   * @param {string} target - 互動目標
   */
  interaction(action, target) {
    this.track('interaction', { action, target });
  },

  /**
   * 記錄功能使用
   * @param {string} feature - 功能名稱
   */
  featureUsed(feature) {
    this.track('feature_used', { feature });
  },

  /**
   * 記錄錯誤
   * @param {string} errorType - 錯誤類型
   * @param {string} message - 錯誤訊息
   */
  error(errorType, message) {
    this.track('error', { type: errorType, message });
  },

  /**
   * 記錄閱讀時間
   * @param {string} bookId - 書籍ID
   * @param {number} duration - 閱讀時長（秒）
   */
  readingTime(bookId, duration) {
    this.track('reading_time', { bookId, duration });
  },

  /**
   * 獲取所有事件（用於調試）
   * @returns {array} 事件列表
   */
  getEvents() {
    return [...this.events];
  },

  /**
   * 清除事件記錄
   */
  clear() {
    this.events = [];
  },

  /**
   * 獲取會話統計
   * @returns {object} 統計數據
   */
  getSessionStats() {
    return {
      totalEvents: this.events.length,
      pageViews: this.events.filter(e => e.name === 'page_view').length,
      interactions: this.events.filter(e => e.name === 'interaction').length,
      featuresUsed: [...new Set(
        this.events
          .filter(e => e.name === 'feature_used')
          .map(e => e.data.feature)
      )],
      sessionStart: this.events[0]?.timestamp || null
    };
  }
};

// 自動記錄頁面載入
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    Analytics.pageView(document.title);
  });
  
  // 記錄頁面可見性變化
  document.addEventListener('visibilitychange', () => {
    Analytics.track('visibility_change', { 
      visible: !document.hidden 
    });
  });
}

// 導出模組
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Analytics };
}
