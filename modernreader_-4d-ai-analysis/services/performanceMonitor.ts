/**
 * Performance Monitor Service
 * Monitors system resources and adapts application behavior
 * Optimized for MacBook Air M3 8GB RAM
 */

interface SystemMetrics {
  cpuUsage: number;
  gpuUsage: number;
  ramUsage: number;
  storageUsed: number;
  localStorageUsed: number;
  cloudStorageUsed: number;
  batteryLevel?: number;
  batteryCharging?: boolean;
  thermalState?: 'normal' | 'fair' | 'serious' | 'critical';
  timestamp: number;
}

interface PerformanceLimits {
  maxCpuUtilization: number;
  maxGpuUtilization: number;
  maxRamUsage: number;
  maxLocalStorage: number;
  powerEfficiencyMode: boolean;
}

interface DeviceProfile {
  device: string;
  totalRAM: number;
  cpuCores: number;
  gpuCores: number;
  isAppleSilicon: boolean;
}

class PerformanceMonitor {
  private metrics: SystemMetrics[] = [];
  private limits: PerformanceLimits = {
    maxCpuUtilization: 70, // M3 優化: 70%
    maxGpuUtilization: 75, // M3 優化: 75%
    maxRamUsage: 5 * 1024 * 1024 * 1024, // 5GB (為系統保留 3GB)
    maxLocalStorage: 50 * 1024 * 1024 * 1024, // 50GB 本機快取
    powerEfficiencyMode: true, // 啟用省電模式
  };
  private deviceProfile: DeviceProfile = {
    device: 'MacBook Air M3',
    totalRAM: 8 * 1024 * 1024 * 1024, // 8GB
    cpuCores: 8,
    gpuCores: 8,
    isAppleSilicon: true,
  };
  private checkInterval: number | null = null;
  private listeners: ((metrics: SystemMetrics) => void)[] = [];

  constructor() {
    this.detectDevice();
    this.startMonitoring();
  }

  startMonitoring(intervalMs: number = 5000): void {
    if (this.checkInterval) return;

    this.checkInterval = window.setInterval(() => {
      this.collectMetrics();
    }, intervalMs);
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async collectMetrics(): Promise<void> {
    const storageStats = await this.getStorageBreakdown();
    const batteryInfo = await this.getBatteryInfo();
    
    const metrics: SystemMetrics = {
      cpuUsage: await this.estimateCPUUsage(),
      gpuUsage: await this.estimateGPUUsage(),
      ramUsage: this.estimateRAMUsage(),
      storageUsed: await this.estimateStorageUsage(),
      localStorageUsed: storageStats.local,
      cloudStorageUsed: storageStats.cloud,
      batteryLevel: batteryInfo.level,
      batteryCharging: batteryInfo.charging,
      thermalState: await this.estimateThermalState(),
      timestamp: Date.now(),
    };

    this.metrics.push(metrics);
    
    // Keep only last 100 measurements
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(metrics));

    // Auto-adjust if limits exceeded
    this.autoAdjustPerformance(metrics);
  }

  private async estimateCPUUsage(): Promise<number> {
    // Browser-based CPU estimation using Performance API
    if ('performance' in window) {
      const entries = performance.getEntriesByType('measure');
      if (entries.length > 0) {
        const avgDuration = entries.reduce((sum, entry) => sum + entry.duration, 0) / entries.length;
        return Math.min(100, (avgDuration / 16.67) * 100); // Relative to 60fps frame time
      }
    }
    return 0;
  }

  private async estimateGPUUsage(): Promise<number> {
    // Estimate based on WebGL context
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        // Estimate based on active textures and buffers
        return Math.random() * 30 + 20; // Placeholder - real GPU monitoring needs native APIs
      }
    }
    return 0;
  }

  private estimateRAMUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize;
    }
    return 0;
  }

  private async estimateStorageUsage(): Promise<number> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    }
    return 0;
  }

  private autoAdjustPerformance(metrics: SystemMetrics): void {
    const cpuOverload = metrics.cpuUsage > this.limits.maxCpuUtilization;
    const gpuOverload = metrics.gpuUsage > this.limits.maxGpuUtilization;
    const ramOverload = metrics.ramUsage > this.limits.maxRamUsage;

    if (cpuOverload || gpuOverload || ramOverload) {
      console.warn('Resource limits exceeded, adjusting performance...', {
        cpu: metrics.cpuUsage,
        gpu: metrics.gpuUsage,
        ram: (metrics.ramUsage / (1024 * 1024 * 1024)).toFixed(2) + 'GB',
      });

      // Dispatch event for app to handle
      window.dispatchEvent(new CustomEvent('performance-throttle', {
        detail: { cpuOverload, gpuOverload, ramOverload }
      }));
    }
  }

  getAverageMetrics(lastN: number = 10): SystemMetrics {
    const recent = this.metrics.slice(-lastN);
    if (recent.length === 0) {
      return {
        cpuUsage: 0,
        gpuUsage: 0,
        ramUsage: 0,
        storageUsed: 0,
        localStorageUsed: 0,
        cloudStorageUsed: 0,
        timestamp: Date.now(),
      };
    }

    return {
      cpuUsage: recent.reduce((sum, m) => sum + m.cpuUsage, 0) / recent.length,
      gpuUsage: recent.reduce((sum, m) => sum + m.gpuUsage, 0) / recent.length,
      ramUsage: recent.reduce((sum, m) => sum + m.ramUsage, 0) / recent.length,
      storageUsed: recent.reduce((sum, m) => sum + m.storageUsed, 0) / recent.length,
      localStorageUsed: recent.reduce((sum, m) => sum + m.localStorageUsed, 0) / recent.length,
      cloudStorageUsed: recent.reduce((sum, m) => sum + m.cloudStorageUsed, 0) / recent.length,
      timestamp: Date.now(),
    };
  }

  subscribe(callback: (metrics: SystemMetrics) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  isWithinLimits(): boolean {
    const avg = this.getAverageMetrics();
    return (
      avg.cpuUsage <= this.limits.maxCpuUtilization &&
      avg.gpuUsage <= this.limits.maxGpuUtilization &&
      avg.ramUsage <= this.limits.maxRamUsage
    );
  }

  /**
   * 偵測裝置類型並調整設定
   */
  private detectDevice(): void {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;

    // 偵測 Apple Silicon (M1/M2/M3)
    if (/Mac/.test(platform) && /AppleWebKit/.test(userAgent)) {
      this.deviceProfile.isAppleSilicon = true;
      
      // 根據 RAM 調整限制
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const estimatedRAM = memory.jsHeapSizeLimit * 4; // 粗略估計
        
        if (estimatedRAM < 10 * 1024 * 1024 * 1024) {
          // 8GB RAM 裝置
          this.limits.maxRamUsage = 5 * 1024 * 1024 * 1024;
          this.limits.maxCpuUtilization = 70;
          this.limits.maxGpuUtilization = 75;
          this.deviceProfile.totalRAM = 8 * 1024 * 1024 * 1024;
        }
      }

      console.log('🍎 偵測到 Apple Silicon 裝置，已套用優化設定');
    }
  }

  /**
   * 獲取儲存空間分解
   */
  private async getStorageBreakdown(): Promise<{ local: number; cloud: number }> {
    let local = 0;
    let cloud = 0;

    // 從 localStorage 讀取雲端儲存統計
    try {
      const cloudStats = localStorage.getItem('cloud-storage-stats');
      if (cloudStats) {
        cloud = JSON.parse(cloudStats).used || 0;
      }
    } catch (error) {
      // 忽略錯誤
    }

    // 獲取本機儲存使用量
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      local = estimate.usage || 0;
    }

    return { local, cloud };
  }

  /**
   * 獲取電池資訊
   */
  private async getBatteryInfo(): Promise<{ level?: number; charging?: boolean }> {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        return {
          level: battery.level * 100,
          charging: battery.charging,
        };
      } catch (error) {
        return {};
      }
    }
    return {};
  }

  /**
   * 估計散熱狀態
   */
  private async estimateThermalState(): Promise<'normal' | 'fair' | 'serious' | 'critical'> {
    // 根據 CPU 使用率和時間估計
    const avgCpu = this.metrics.slice(-10).reduce((sum, m) => sum + m.cpuUsage, 0) / 10;
    
    if (avgCpu > 85) return 'critical';
    if (avgCpu > 75) return 'serious';
    if (avgCpu > 60) return 'fair';
    return 'normal';
  }

  /**
   * 獲取裝置資訊
   */
  getDeviceProfile(): DeviceProfile {
    return { ...this.deviceProfile };
  }

  /**
   * 設定效能限制
   */
  setLimits(limits: Partial<PerformanceLimits>): void {
    this.limits = { ...this.limits, ...limits };
    console.log('⚙️ 效能限制已更新:', this.limits);
  }
}

export const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;