/**
 * ModernReader - Sync Service
 * 雲端同步服務
 */

const SyncService = {
  isSyncing: false,
  lastSyncTime: null,
  syncQueue: [],
  SYNC_INTERVAL: 30000, // 30 秒
  syncTimer: null,

  /**
   * 初始化同步服務
   */
  init() {
    // 恢復上次同步時間
    this.lastSyncTime = localStorage.getItem('mr_last_sync');

    // 監聽線上/離線狀態
    window.addEventListener('online', () => {
      console.log('📶 Online - syncing pending changes');
      this.syncAll();
    });

    window.addEventListener('offline', () => {
      console.log('📴 Offline - changes will be queued');
    });

    // 啟動定期同步
    this.startAutoSync();

    console.log('☁️ Sync service initialized');
  },

  /**
   * 啟動自動同步
   */
  startAutoSync() {
    if (this.syncTimer) return;
    
    this.syncTimer = setInterval(() => {
      if (navigator.onLine && this.syncQueue.length > 0) {
        this.syncAll();
      }
    }, this.SYNC_INTERVAL);
  },

  /**
   * 停止自動同步
   */
  stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  },

  /**
   * 添加到同步佇列
   * @param {string} type - 同步類型
   * @param {object} data - 同步資料
   */
  queue(type, data) {
    const item = {
      id: `sync_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type,
      data,
      timestamp: new Date().toISOString(),
      retries: 0
    };

    this.syncQueue.push(item);
    this.saveQueue();

    // 如果在線，嘗試立即同步
    if (navigator.onLine) {
      this.syncItem(item);
    }
  },

  /**
   * 同步單一項目
   * @param {object} item - 同步項目
   * @returns {Promise}
   */
  async syncItem(item) {
    try {
      // 模擬 API 呼叫
      await this.simulateApiCall(item);

      // 從佇列移除
      this.syncQueue = this.syncQueue.filter(i => i.id !== item.id);
      this.saveQueue();

      // 觸發同步完成事件
      window.dispatchEvent(new CustomEvent('sync:item', { detail: item }));

      return true;
    } catch (error) {
      item.retries++;
      if (item.retries >= 3) {
        console.error('Sync failed after 3 retries:', item);
        this.syncQueue = this.syncQueue.filter(i => i.id !== item.id);
        this.saveQueue();
      }
      return false;
    }
  },

  /**
   * 同步所有待處理項目
   * @returns {Promise}
   */
  async syncAll() {
    if (this.isSyncing || !navigator.onLine) return;

    this.isSyncing = true;
    window.dispatchEvent(new CustomEvent('sync:start'));

    try {
      const pending = [...this.syncQueue];
      let successCount = 0;

      for (const item of pending) {
        const success = await this.syncItem(item);
        if (success) successCount++;
      }

      this.lastSyncTime = new Date().toISOString();
      localStorage.setItem('mr_last_sync', this.lastSyncTime);

      window.dispatchEvent(new CustomEvent('sync:complete', { 
        detail: { synced: successCount, pending: this.syncQueue.length }
      }));

      console.log(`☁️ Sync complete: ${successCount} items synced`);
    } catch (error) {
      window.dispatchEvent(new CustomEvent('sync:error', { detail: error }));
    } finally {
      this.isSyncing = false;
    }
  },

  /**
   * 模擬 API 呼叫
   * @param {object} item
   * @returns {Promise}
   */
  simulateApiCall(item) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 模擬 10% 失敗率
        if (Math.random() > 0.1) {
          resolve({ success: true });
        } else {
          reject(new Error('Sync failed'));
        }
      }, 200 + Math.random() * 300);
    });
  },

  /**
   * 保存佇列到本地
   */
  saveQueue() {
    localStorage.setItem('mr_sync_queue', JSON.stringify(this.syncQueue));
  },

  /**
   * 恢復佇列
   */
  loadQueue() {
    try {
      const saved = localStorage.getItem('mr_sync_queue');
      if (saved) {
        this.syncQueue = JSON.parse(saved);
      }
    } catch (e) {
      this.syncQueue = [];
    }
  },

  /**
   * 同步閱讀進度
   * @param {string} bookId
   * @param {object} progress
   */
  syncReadingProgress(bookId, progress) {
    this.queue('reading_progress', { bookId, ...progress });
  },

  /**
   * 同步書籤
   * @param {string} bookId
   * @param {object} bookmark
   */
  syncBookmark(bookId, bookmark) {
    this.queue('bookmark', { bookId, ...bookmark });
  },

  /**
   * 同步用戶設定
   * @param {object} settings
   */
  syncSettings(settings) {
    this.queue('settings', settings);
  },

  /**
   * 獲取同步狀態
   * @returns {object}
   */
  getStatus() {
    return {
      isSyncing: this.isSyncing,
      pendingCount: this.syncQueue.length,
      lastSyncTime: this.lastSyncTime,
      isOnline: navigator.onLine
    };
  },

  /**
   * 強制同步
   * @returns {Promise}
   */
  forceSync() {
    return this.syncAll();
  },

  /**
   * 清除同步佇列
   */
  clearQueue() {
    this.syncQueue = [];
    this.saveQueue();
  }
};

// 初始化
if (typeof window !== 'undefined') {
  SyncService.loadQueue();
  SyncService.init();
}

// 導出模組
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SyncService };
}

if (typeof window !== 'undefined') {
  window.SyncService = SyncService;
}
