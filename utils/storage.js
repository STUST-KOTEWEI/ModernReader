/**
 * ModernReader - Local Storage Utilities
 * 本地存儲工具模組，用於持久化用戶數據
 */

const StorageKeys = {
  READING_PROGRESS: 'mr_reading_progress',
  BOOKMARKS: 'mr_bookmarks',
  USER_PREFERENCES: 'mr_preferences',
  READING_HISTORY: 'mr_history',
  THEME_SETTINGS: 'mr_theme'
};

const Storage = {
  /**
   * 儲存數據到本地存儲
   * @param {string} key - 存儲鍵名
   * @param {*} value - 要存儲的值
   */
  set(key, value) {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error('Storage.set error:', error);
      return false;
    }
  },

  /**
   * 從本地存儲獲取數據
   * @param {string} key - 存儲鍵名
   * @param {*} defaultValue - 默認值
   * @returns {*} 存儲的值或默認值
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Storage.get error:', error);
      return defaultValue;
    }
  },

  /**
   * 從本地存儲刪除數據
   * @param {string} key - 存儲鍵名
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage.remove error:', error);
      return false;
    }
  },

  /**
   * 清空所有 ModernReader 相關數據
   */
  clearAll() {
    Object.values(StorageKeys).forEach(key => {
      localStorage.removeItem(key);
    });
  }
};

// 閱讀進度管理
const ReadingProgress = {
  /**
   * 儲存閱讀進度
   * @param {string} bookId - 書籍ID
   * @param {number} progress - 進度百分比 (0-100)
   * @param {string} chapter - 當前章節
   */
  save(bookId, progress, chapter = '') {
    const allProgress = Storage.get(StorageKeys.READING_PROGRESS, {});
    allProgress[bookId] = {
      progress,
      chapter,
      lastRead: new Date().toISOString()
    };
    Storage.set(StorageKeys.READING_PROGRESS, allProgress);
  },

  /**
   * 獲取閱讀進度
   * @param {string} bookId - 書籍ID
   * @returns {object|null} 進度資訊
   */
  get(bookId) {
    const allProgress = Storage.get(StorageKeys.READING_PROGRESS, {});
    return allProgress[bookId] || null;
  },

  /**
   * 獲取所有閱讀進度
   * @returns {object} 所有進度資訊
   */
  getAll() {
    return Storage.get(StorageKeys.READING_PROGRESS, {});
  }
};

// 書籤管理
const Bookmarks = {
  /**
   * 添加書籤
   * @param {string} bookId - 書籍ID
   * @param {object} bookmark - 書籤資訊
   */
  add(bookId, bookmark) {
    const allBookmarks = Storage.get(StorageKeys.BOOKMARKS, {});
    if (!allBookmarks[bookId]) {
      allBookmarks[bookId] = [];
    }
    allBookmarks[bookId].push({
      ...bookmark,
      id: Date.now(),
      createdAt: new Date().toISOString()
    });
    Storage.set(StorageKeys.BOOKMARKS, allBookmarks);
  },

  /**
   * 獲取書籍的所有書籤
   * @param {string} bookId - 書籍ID
   * @returns {array} 書籤列表
   */
  getByBook(bookId) {
    const allBookmarks = Storage.get(StorageKeys.BOOKMARKS, {});
    return allBookmarks[bookId] || [];
  },

  /**
   * 刪除書籤
   * @param {string} bookId - 書籍ID
   * @param {number} bookmarkId - 書籤ID
   */
  remove(bookId, bookmarkId) {
    const allBookmarks = Storage.get(StorageKeys.BOOKMARKS, {});
    if (allBookmarks[bookId]) {
      allBookmarks[bookId] = allBookmarks[bookId].filter(b => b.id !== bookmarkId);
      Storage.set(StorageKeys.BOOKMARKS, allBookmarks);
    }
  }
};

// 用戶偏好設置
const UserPreferences = {
  /**
   * 儲存用戶偏好
   * @param {object} preferences - 偏好設置
   */
  save(preferences) {
    const current = Storage.get(StorageKeys.USER_PREFERENCES, {});
    Storage.set(StorageKeys.USER_PREFERENCES, { ...current, ...preferences });
  },

  /**
   * 獲取用戶偏好
   * @returns {object} 偏好設置
   */
  get() {
    return Storage.get(StorageKeys.USER_PREFERENCES, {
      theme: 'lumina',
      fontSize: 1,
      letterSpacing: 0.02,
      soundscape: 'ocean'
    });
  },

  /**
   * 重置為默認設置
   */
  reset() {
    Storage.remove(StorageKeys.USER_PREFERENCES);
  }
};

// 導出模組
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Storage, StorageKeys, ReadingProgress, Bookmarks, UserPreferences };
}

// 瀏覽器環境下掛載到 window
if (typeof window !== 'undefined') {
  window.Storage = Storage;
  window.StorageKeys = StorageKeys;
  window.ReadingProgress = ReadingProgress;
  window.Bookmarks = Bookmarks;
  window.UserPreferences = UserPreferences;
}
