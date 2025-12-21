/**
 * ModernReader - Application Settings
 * 應用程式配置
 */

const Settings = {
  // 應用程式資訊
  app: {
    name: 'ModernReader Royale',
    version: '1.0.0',
    description: '專為頂級閱讀體驗打造的單頁網站樣板',
    author: 'Te-Wei Ko (柯德瑋)',
    homepage: 'https://stust-kotewei.github.io/ModernReader/'
  },

  // API 端點
  api: {
    baseUrl: 'https://api.modernreader.io',
    googleSheetUrl: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
    timeout: 10000
  },

  // 主題配置
  themes: {
    lumina: {
      name: '晨光 Lumina',
      description: '溫暖明亮的晨間氛圍',
      colors: {
        background: 'rgba(255, 246, 230, 0.9)',
        text: '#3a2a09',
        accent: '#ffd166'
      }
    },
    noir: {
      name: '暮夜 Noir',
      description: '深邃優雅的夜間模式',
      colors: {
        background: 'rgba(4, 2, 12, 0.96)',
        text: 'rgba(255, 255, 255, 0.92)',
        accent: '#8ec5fc'
      }
    },
    aurum: {
      name: '琥珀 Aurum',
      description: '復古奢華的金色調',
      colors: {
        background: 'rgba(255, 233, 208, 0.85)',
        text: '#2f1a04',
        accent: '#f6d365'
      }
    }
  },

  // 音景配置
  soundscapes: {
    ocean: {
      name: '星海潮汐',
      description: '清晨海岸·波長 432Hz',
      frequency: '432Hz'
    },
    forest: {
      name: '松林霧徑',
      description: '靜心 Alpha·滲透率 64%',
      frequency: 'Alpha'
    },
    city: {
      name: '夜幕都會',
      description: '城市律動·低頻馭化',
      frequency: 'Low'
    }
  },

  // 閱讀配置
  reading: {
    defaultFontSize: 1,       // rem
    minFontSize: 0.8,
    maxFontSize: 1.4,
    defaultLetterSpacing: 0.02,  // em
    minLetterSpacing: 0,
    maxLetterSpacing: 0.08,
    autoSaveInterval: 30000   // 自動保存間隔（毫秒）
  },

  // 動畫配置
  animations: {
    duration: {
      fast: 200,
      normal: 400,
      slow: 600
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      smooth: 'ease-in-out'
    }
  },

  // 調試模式
  debug: false,

  // 功能開關
  features: {
    cursorGlow: true,
    parallaxEffect: true,
    soundscapes: true,
    chatBot: true,
    bookmarks: true,
    analytics: true
  }
};

// 獲取設定值的工具函數
function getSetting(path, defaultValue = null) {
  const keys = path.split('.');
  let value = Settings;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }
  
  return value;
}

// 導出模組
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Settings, getSetting };
}

// 瀏覽器環境下掛載到 window
if (typeof window !== 'undefined') {
  window.Settings = Settings;
  window.getSetting = getSetting;
}
