/**
 * ModernReader - Plugin System
 * 插件系統
 */

const PluginManager = {
  plugins: new Map(),
  initialized: false,

  /**
   * 註冊插件
   * @param {object} plugin - 插件物件
   */
  register(plugin) {
    if (!plugin.id || !plugin.name) {
      console.error('Plugin must have id and name');
      return false;
    }

    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin ${plugin.id} already registered`);
      return false;
    }

    this.plugins.set(plugin.id, {
      ...plugin,
      enabled: plugin.enabled !== false,
      loaded: false
    });

    console.log(`📦 Plugin registered: ${plugin.name}`);
    return true;
  },

  /**
   * 啟用插件
   * @param {string} pluginId
   */
  async enable(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      console.error(`Plugin ${pluginId} not found`);
      return false;
    }

    plugin.enabled = true;

    if (!plugin.loaded && plugin.init) {
      try {
        await plugin.init();
        plugin.loaded = true;
        console.log(`✅ Plugin enabled: ${plugin.name}`);
        
        // 觸發鉤子
        if (typeof Hooks !== 'undefined') {
          Hooks.do('plugin_enabled', plugin);
        }
      } catch (error) {
        console.error(`Failed to init plugin ${plugin.name}:`, error);
        return false;
      }
    }

    return true;
  },

  /**
   * 禁用插件
   * @param {string} pluginId
   */
  async disable(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;

    plugin.enabled = false;

    if (plugin.destroy) {
      try {
        await plugin.destroy();
      } catch (error) {
        console.error(`Failed to destroy plugin ${plugin.name}:`, error);
      }
    }

    console.log(`⏹️ Plugin disabled: ${plugin.name}`);
    
    // 觸發鉤子
    if (typeof Hooks !== 'undefined') {
      Hooks.do('plugin_disabled', plugin);
    }

    return true;
  },

  /**
   * 初始化所有已啟用的插件
   */
  async initAll() {
    if (this.initialized) return;

    console.log('🔌 Initializing plugins...');

    for (const [id, plugin] of this.plugins) {
      if (plugin.enabled) {
        await this.enable(id);
      }
    }

    this.initialized = true;
    console.log(`🔌 ${this.plugins.size} plugins loaded`);
  },

  /**
   * 獲取插件
   * @param {string} pluginId
   * @returns {object|null}
   */
  get(pluginId) {
    return this.plugins.get(pluginId) || null;
  },

  /**
   * 獲取所有插件
   * @returns {Array}
   */
  getAll() {
    return Array.from(this.plugins.values());
  },

  /**
   * 獲取已啟用的插件
   * @returns {Array}
   */
  getEnabled() {
    return this.getAll().filter(p => p.enabled);
  },

  /**
   * 卸載插件
   * @param {string} pluginId
   */
  async unregister(pluginId) {
    await this.disable(pluginId);
    this.plugins.delete(pluginId);
  },

  /**
   * 呼叫插件方法
   * @param {string} pluginId
   * @param {string} method
   * @param {...*} args
   */
  call(pluginId, method, ...args) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || !plugin.enabled || !plugin[method]) return null;
    return plugin[method](...args);
  },

  /**
   * 廣播到所有插件
   * @param {string} method
   * @param {...*} args
   */
  broadcast(method, ...args) {
    const results = [];
    for (const [_, plugin] of this.plugins) {
      if (plugin.enabled && plugin[method]) {
        results.push(plugin[method](...args));
      }
    }
    return results;
  }
};

// 範例插件模板
const ExamplePlugin = {
  id: 'example-plugin',
  name: 'Example Plugin',
  version: '1.0.0',
  author: 'ModernReader Team',
  description: '這是一個插件範例模板',
  enabled: false, // 預設不啟用

  // 初始化
  init() {
    console.log('Example plugin initialized');
    
    // 註冊鉤子
    if (typeof Hooks !== 'undefined') {
      Hooks.add('theme_change', (theme) => {
        console.log('Theme changed to:', theme);
        return theme;
      });
    }
  },

  // 銷毀
  destroy() {
    console.log('Example plugin destroyed');
  },

  // 自訂方法
  doSomething() {
    console.log('Doing something...');
  }
};

// 註冊範例插件 (但不啟用)
// PluginManager.register(ExamplePlugin);

// 導出模組
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PluginManager, ExamplePlugin };
}

if (typeof window !== 'undefined') {
  window.PluginManager = PluginManager;
}
