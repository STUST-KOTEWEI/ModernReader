/**
 * ModernReader - Event Hooks
 * 事件鉤子系統
 */

const Hooks = {
  hooks: new Map(),

  /**
   * 註冊鉤子
   * @param {string} name - 鉤子名稱
   * @param {Function} callback - 回調函數
   * @param {number} priority - 優先級 (數字越小越先執行)
   * @returns {Function} 取消註冊的函數
   */
  add(name, callback, priority = 10) {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, []);
    }

    const hook = { callback, priority };
    this.hooks.get(name).push(hook);

    // 按優先級排序
    this.hooks.get(name).sort((a, b) => a.priority - b.priority);

    // 返回取消函數
    return () => this.remove(name, callback);
  },

  /**
   * 移除鉤子
   * @param {string} name - 鉤子名稱
   * @param {Function} callback - 回調函數
   */
  remove(name, callback) {
    if (!this.hooks.has(name)) return;

    const hooks = this.hooks.get(name);
    const index = hooks.findIndex(h => h.callback === callback);
    if (index > -1) {
      hooks.splice(index, 1);
    }
  },

  /**
   * 執行鉤子 (同步)
   * @param {string} name - 鉤子名稱
   * @param {*} value - 初始值
   * @param {...*} args - 額外參數
   * @returns {*} 處理後的值
   */
  apply(name, value, ...args) {
    if (!this.hooks.has(name)) return value;

    const hooks = this.hooks.get(name);
    let result = value;

    for (const hook of hooks) {
      const newResult = hook.callback(result, ...args);
      if (newResult !== undefined) {
        result = newResult;
      }
    }

    return result;
  },

  /**
   * 執行鉤子 (異步)
   * @param {string} name - 鉤子名稱
   * @param {*} value - 初始值
   * @param {...*} args - 額外參數
   * @returns {Promise<*>} 處理後的值
   */
  async applyAsync(name, value, ...args) {
    if (!this.hooks.has(name)) return value;

    const hooks = this.hooks.get(name);
    let result = value;

    for (const hook of hooks) {
      const newResult = await hook.callback(result, ...args);
      if (newResult !== undefined) {
        result = newResult;
      }
    }

    return result;
  },

  /**
   * 觸發動作 (不返回值)
   * @param {string} name - 動作名稱
   * @param {...*} args - 參數
   */
  do(name, ...args) {
    if (!this.hooks.has(name)) return;

    const hooks = this.hooks.get(name);
    for (const hook of hooks) {
      hook.callback(...args);
    }
  },

  /**
   * 觸發動作 (異步)
   * @param {string} name - 動作名稱
   * @param {...*} args - 參數
   */
  async doAsync(name, ...args) {
    if (!this.hooks.has(name)) return;

    const hooks = this.hooks.get(name);
    for (const hook of hooks) {
      await hook.callback(...args);
    }
  },

  /**
   * 檢查鉤子是否存在
   * @param {string} name - 鉤子名稱
   * @returns {boolean}
   */
  has(name) {
    return this.hooks.has(name) && this.hooks.get(name).length > 0;
  },

  /**
   * 獲取鉤子數量
   * @param {string} name - 鉤子名稱
   * @returns {number}
   */
  count(name) {
    return this.hooks.has(name) ? this.hooks.get(name).length : 0;
  },

  /**
   * 清除所有鉤子
   * @param {string} name - 可選，指定鉤子名稱
   */
  clear(name) {
    if (name) {
      this.hooks.delete(name);
    } else {
      this.hooks.clear();
    }
  }
};

// 預定義的鉤子名稱
const HookNames = {
  // 閱讀相關
  BEFORE_READ: 'before_read',
  AFTER_READ: 'after_read',
  PAGE_CHANGE: 'page_change',
  PROGRESS_UPDATE: 'progress_update',
  
  // 主題相關
  THEME_CHANGE: 'theme_change',
  BEFORE_THEME_APPLY: 'before_theme_apply',
  AFTER_THEME_APPLY: 'after_theme_apply',
  
  // 用戶相關
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  PREFERENCES_SAVE: 'preferences_save',
  
  // 書籤相關
  BOOKMARK_ADD: 'bookmark_add',
  BOOKMARK_REMOVE: 'bookmark_remove',
  
  // 內容相關
  CONTENT_RENDER: 'content_render',
  CONTENT_FILTER: 'content_filter',
  
  // 音效相關
  SOUND_PLAY: 'sound_play',
  SOUNDSCAPE_CHANGE: 'soundscape_change',
  
  // 初始化
  APP_INIT: 'app_init',
  APP_READY: 'app_ready'
};

// 導出模組
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Hooks, HookNames };
}

if (typeof window !== 'undefined') {
  window.Hooks = Hooks;
  window.HookNames = HookNames;
}
