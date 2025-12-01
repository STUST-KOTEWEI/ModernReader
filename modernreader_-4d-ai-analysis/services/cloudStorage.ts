/**
 * Cloud Storage Service
 * Manages hybrid storage: local (256GB) + cloud (2TB Google Drive)
 * Optimized for MacBook Air M3 8GB RAM
 */

interface StorageStats {
  local: {
    used: number;
    total: number;
    available: number;
    percentage: number;
  };
  cloud: {
    used: number;
    total: number;
    available: number;
    percentage: number;
  };
}

interface SyncStatus {
  isSyncing: boolean;
  lastSync: number;
  pendingUploads: number;
  pendingDownloads: number;
  errors: string[];
}

interface CloudFile {
  id: string;
  name: string;
  size: number;
  location: 'local' | 'cloud' | 'both';
  lastModified: number;
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
  cloudPath?: string;
}

class CloudStorageService {
  private localStorageLimit = 50 * 1024 * 1024 * 1024; // 50GB 本機快取
  private cloudStorageLimit = 2 * 1024 * 1024 * 1024 * 1024; // 2TB 雲端
  private offloadThreshold = 0.8; // 80% 使用率自動轉移
  private syncInterval = 5 * 60 * 1000; // 5分鐘
  private files: Map<string, CloudFile> = new Map();
  private syncTimer: number | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * 初始化雲端儲存服務
   */
  private async initialize(): Promise<void> {
    // 載入本機檔案索引
    await this.loadLocalIndex();
    
    // 啟動自動同步
    this.startAutoSync();
    
    // 監控本機儲存使用率
    this.monitorLocalStorage();
    
    console.log('☁️ 雲端儲存服務已初始化');
  }

  /**
   * 獲取儲存統計資料
   */
  async getStorageStats(): Promise<StorageStats> {
    const localEstimate = await this.getLocalStorageEstimate();
    const cloudEstimate = await this.getCloudStorageEstimate();

    return {
      local: {
        used: localEstimate.usage || 0,
        total: this.localStorageLimit,
        available: this.localStorageLimit - (localEstimate.usage || 0),
        percentage: ((localEstimate.usage || 0) / this.localStorageLimit) * 100,
      },
      cloud: {
        used: cloudEstimate.used,
        total: this.cloudStorageLimit,
        available: this.cloudStorageLimit - cloudEstimate.used,
        percentage: (cloudEstimate.used / this.cloudStorageLimit) * 100,
      },
    };
  }

  /**
   * 儲存檔案（智能選擇儲存位置）
   */
  async saveFile(name: string, data: Blob | string, options?: {
    forceLocal?: boolean;
    forceCloud?: boolean;
    compress?: boolean;
  }): Promise<CloudFile> {
    const size = typeof data === 'string' ? new Blob([data]).size : data.size;
    const stats = await this.getStorageStats();

    // 決定儲存位置
    let location: 'local' | 'cloud' | 'both' = 'local';

    if (options?.forceCloud) {
      location = 'cloud';
    } else if (options?.forceLocal) {
      location = 'local';
    } else {
      // 智能決策
      if (stats.local.percentage > this.offloadThreshold * 100) {
        // 本機空間不足，直接存雲端
        location = 'cloud';
      } else if (size > 100 * 1024 * 1024) {
        // 大檔案 (>100MB) 優先存雲端
        location = 'cloud';
      } else {
        // 小檔案存本機以加快存取
        location = 'local';
      }
    }

    // 壓縮（如需要）
    let finalData = data;
    if (options?.compress && typeof data === 'string') {
      finalData = await this.compressData(data);
    }

    // 儲存檔案
    const file: CloudFile = {
      id: this.generateId(),
      name,
      size,
      location,
      lastModified: Date.now(),
      syncStatus: location === 'cloud' ? 'pending' : 'synced',
    };

    if (location === 'local') {
      await this.saveToLocal(file.id, finalData);
    } else if (location === 'cloud') {
      await this.saveToCloud(file.id, finalData);
      file.cloudPath = `modernreader/data/${file.id}`;
    } else if (location === 'both') {
      await this.saveToLocal(file.id, finalData);
      await this.saveToCloud(file.id, finalData);
      file.cloudPath = `modernreader/data/${file.id}`;
    }

    this.files.set(file.id, file);
    await this.saveLocalIndex();

    console.log(`✅ 檔案已儲存: ${name} (${this.formatBytes(size)}) -> ${location}`);
    
    return file;
  }

  /**
   * 讀取檔案
   */
  async getFile(fileId: string): Promise<Blob | string | null> {
    const file = this.files.get(fileId);
    if (!file) return null;

    // 優先從本機讀取
    if (file.location === 'local' || file.location === 'both') {
      const localData = await this.getFromLocal(fileId);
      if (localData) return localData;
    }

    // 從雲端讀取
    if (file.location === 'cloud' || file.location === 'both') {
      console.log(`☁️ 從雲端下載: ${file.name}`);
      const cloudData = await this.getFromCloud(fileId);
      
      // 下載後快取到本機（如果空間足夠）
      const stats = await this.getStorageStats();
      if (stats.local.percentage < this.offloadThreshold * 100 && cloudData) {
        await this.saveToLocal(fileId, cloudData);
        file.location = 'both';
        this.files.set(fileId, file);
      }
      
      return cloudData;
    }

    return null;
  }

  /**
   * 刪除檔案
   */
  async deleteFile(fileId: string): Promise<void> {
    const file = this.files.get(fileId);
    if (!file) return;

    if (file.location === 'local' || file.location === 'both') {
      await this.deleteFromLocal(fileId);
    }

    if (file.location === 'cloud' || file.location === 'both') {
      await this.deleteFromCloud(fileId);
    }

    this.files.delete(fileId);
    await this.saveLocalIndex();

    console.log(`🗑️ 檔案已刪除: ${file.name}`);
  }

  /**
   * 手動同步
   */
  async sync(): Promise<SyncStatus> {
    console.log('🔄 開始同步...');

    const status: SyncStatus = {
      isSyncing: true,
      lastSync: Date.now(),
      pendingUploads: 0,
      pendingDownloads: 0,
      errors: [],
    };

    try {
      // 上傳待同步的本機檔案
      for (const [fileId, file] of this.files.entries()) {
        if (file.syncStatus === 'pending') {
          try {
            const localData = await this.getFromLocal(fileId);
            if (localData) {
              await this.saveToCloud(fileId, localData);
              file.syncStatus = 'synced';
              file.location = 'both';
              file.cloudPath = `modernreader/data/${fileId}`;
              this.files.set(fileId, file);
            }
          } catch (error) {
            status.errors.push(`上傳失敗: ${file.name}`);
            file.syncStatus = 'error';
          }
        }
      }

      await this.saveLocalIndex();
      
      console.log('✅ 同步完成');
    } catch (error) {
      console.error('❌ 同步錯誤:', error);
      status.errors.push('同步過程發生錯誤');
    } finally {
      status.isSyncing = false;
    }

    return status;
  }

  /**
   * 自動轉移舊檔案到雲端（釋放本機空間）
   */
  async offloadToCloud(): Promise<void> {
    const stats = await this.getStorageStats();
    
    if (stats.local.percentage < this.offloadThreshold * 100) {
      return; // 空間充足，無需轉移
    }

    console.log('📤 本機空間不足，開始轉移檔案到雲端...');

    // 按最後修改時間排序（舊的先轉移）
    const localFiles = Array.from(this.files.values())
      .filter(f => f.location === 'local' || f.location === 'both')
      .sort((a, b) => a.lastModified - b.lastModified);

    let freedSpace = 0;
    const targetFree = this.localStorageLimit * 0.3; // 釋放到 30% 使用率

    for (const file of localFiles) {
      if (freedSpace >= targetFree) break;

      try {
        // 確保檔案在雲端
        if (file.location === 'local') {
          const data = await this.getFromLocal(file.id);
          if (data) {
            await this.saveToCloud(file.id, data);
            file.cloudPath = `modernreader/data/${file.id}`;
          }
        }

        // 從本機刪除
        await this.deleteFromLocal(file.id);
        file.location = 'cloud';
        this.files.set(file.id, file);
        
        freedSpace += file.size;
        console.log(`📤 已轉移: ${file.name} (${this.formatBytes(file.size)})`);
      } catch (error) {
        console.error(`轉移失敗: ${file.name}`, error);
      }
    }

    await this.saveLocalIndex();
    
    console.log(`✅ 已釋放 ${this.formatBytes(freedSpace)} 本機空間`);
  }

  /**
   * 取得同步狀態
   */
  getSyncStatus(): SyncStatus {
    const pending = Array.from(this.files.values()).filter(
      f => f.syncStatus === 'pending'
    ).length;

    return {
      isSyncing: false,
      lastSync: Date.now(),
      pendingUploads: pending,
      pendingDownloads: 0,
      errors: [],
    };
  }

  /**
   * 列出所有檔案
   */
  listFiles(filter?: {
    location?: 'local' | 'cloud' | 'both';
    syncStatus?: CloudFile['syncStatus'];
  }): CloudFile[] {
    let files = Array.from(this.files.values());

    if (filter?.location) {
      files = files.filter(f => f.location === filter.location);
    }

    if (filter?.syncStatus) {
      files = files.filter(f => f.syncStatus === filter.syncStatus);
    }

    return files.sort((a, b) => b.lastModified - a.lastModified);
  }

  /**
   * 啟動自動同步
   */
  private startAutoSync(): void {
    if (this.syncTimer) return;

    this.syncTimer = window.setInterval(() => {
      this.sync();
    }, this.syncInterval);

    console.log('⏰ 自動同步已啟動 (每 5 分鐘)');
  }

  /**
   * 停止自動同步
   */
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('⏸️ 自動同步已停止');
    }
  }

  /**
   * 監控本機儲存使用率
   */
  private async monitorLocalStorage(): Promise<void> {
    setInterval(async () => {
      const stats = await this.getStorageStats();
      
      if (stats.local.percentage > this.offloadThreshold * 100) {
        console.warn(`⚠️ 本機空間使用率: ${stats.local.percentage.toFixed(1)}%`);
        await this.offloadToCloud();
      }
    }, 60000); // 每分鐘檢查一次
  }

  // ============ 私有方法 ============

  private async getLocalStorageEstimate(): Promise<StorageEstimate> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      return await navigator.storage.estimate();
    }
    return { usage: 0, quota: this.localStorageLimit };
  }

  private async getCloudStorageEstimate(): Promise<{ used: number; total: number }> {
    // 模擬雲端儲存查詢（實際應用應連接 Google Drive API）
    let totalUsed = 0;
    for (const file of this.files.values()) {
      if (file.location === 'cloud' || file.location === 'both') {
        totalUsed += file.size;
      }
    }
    return { used: totalUsed, total: this.cloudStorageLimit };
  }

  private async saveToLocal(id: string, data: Blob | string): Promise<void> {
    // 使用 IndexedDB 儲存
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ModernReaderStorage', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['files'], 'readwrite');
        const store = transaction.objectStore('files');
        const putRequest = store.put({ id, data });

        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'id' });
        }
      };
    });
  }

  private async getFromLocal(id: string): Promise<Blob | string | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ModernReaderStorage', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['files'], 'readonly');
        const store = transaction.objectStore('files');
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
          resolve(getRequest.result?.data || null);
        };
        getRequest.onerror = () => reject(getRequest.error);
      };
    });
  }

  private async deleteFromLocal(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ModernReaderStorage', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['files'], 'readwrite');
        const store = transaction.objectStore('files');
        const deleteRequest = store.delete(id);

        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      };
    });
  }

  private async saveToCloud(id: string, data: Blob | string): Promise<void> {
    // 模擬雲端上傳（實際應用應連接 Google Drive API）
    console.log(`☁️ 上傳到雲端: ${id}`);
    // 實際實作: 使用 Google Drive API
    return Promise.resolve();
  }

  private async getFromCloud(id: string): Promise<Blob | string | null> {
    // 模擬雲端下載（實際應用應連接 Google Drive API）
    console.log(`☁️ 從雲端下載: ${id}`);
    // 實際實作: 使用 Google Drive API
    return Promise.resolve(null);
  }

  private async deleteFromCloud(id: string): Promise<void> {
    // 模擬雲端刪除（實際應用應連接 Google Drive API）
    console.log(`☁️ 從雲端刪除: ${id}`);
    // 實際實作: 使用 Google Drive API
    return Promise.resolve();
  }

  private async loadLocalIndex(): Promise<void> {
    try {
      const indexData = localStorage.getItem('modernreader-file-index');
      if (indexData) {
        const files = JSON.parse(indexData);
        this.files = new Map(files);
      }
    } catch (error) {
      console.error('載入檔案索引失敗:', error);
    }
  }

  private async saveLocalIndex(): Promise<void> {
    try {
      const files = Array.from(this.files.entries());
      localStorage.setItem('modernreader-file-index', JSON.stringify(files));
    } catch (error) {
      console.error('儲存檔案索引失敗:', error);
    }
  }

  private async compressData(data: string): Promise<Blob> {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(data);
    
    // 使用 CompressionStream（如果可用）
    if ('CompressionStream' in window) {
      const stream = new Blob([encoded]).stream();
      const compressedStream = stream.pipeThrough(new (window as any).CompressionStream('gzip'));
      return new Response(compressedStream).blob();
    }
    
    return new Blob([encoded]);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const cloudStorage = new CloudStorageService();
export default cloudStorage;
