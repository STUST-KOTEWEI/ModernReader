/**
 * ModernReader - Internationalization (i18n) Module
 * 國際化多語言支援模組
 */

const i18n = {
  currentLocale: 'zh-TW',
  fallbackLocale: 'en',
  
  // 語言資源
  resources: {
    'zh-TW': {
      // 導航
      nav: {
        experiences: '體驗',
        immersion: '閱讀殿堂',
        curation: '私藏',
        concierge: '管家服務'
      },
      
      // 通用
      common: {
        loading: '載入中...',
        save: '儲存',
        cancel: '取消',
        confirm: '確定',
        close: '關閉',
        delete: '刪除',
        edit: '編輯',
        share: '分享',
        search: '搜尋',
        settings: '設定',
        bookmark: '書籤',
        next: '下一頁',
        previous: '上一頁'
      },
      
      // Hero 區塊
      hero: {
        eyebrow: '世界級閱讀美學',
        title: '喚醒靈感的新世代旗艦閱讀體驗',
        lead: '結合奢華工藝、感官演算法與專屬閱讀策展，將每一次翻閱，化為無可取代的私人盛典。',
        ctaPrimary: '立即啟用禮賓模式',
        ctaSecondary: '探索星級策展'
      },
      
      // 體驗區塊
      experiences: {
        eyebrow: 'Signature Experiences',
        title: '為菁英讀者打造的專屬場景',
        description: '每項功能皆由跨領域設計團隊親自操刀，結合藝術、聲學與智能科技，讓閱讀不只是閱讀。',
        theater: {
          title: '光譜劇院模式',
          description: '採用全景光譜投射與空間聲景，將文字化作多感官沉浸劇院，讓故事在你周圍環繞。'
        },
        zen: {
          title: '禪境專注引擎',
          description: '以心率與腦波節奏精準調和字距、光影與背景，打造超越靜心課程的專注閱讀狀態。'
        },
        curation: {
          title: '星級品味策展',
          description: '全球書庫私人管家，根據你的旅程與心情量身策劃，提供隱藏版限量內容與作者私訊。'
        }
      },
      
      // 沉浸區塊
      immersion: {
        eyebrow: 'Immersive Atelier',
        title: '專屬訂製的沉浸式閱讀殿堂',
        description: '立即預覽專屬面板，透過細緻的控制打造最貼近心境的閱讀儀式。',
        theme: '場景主題',
        fontSize: '字體比例',
        letterSpacing: '字距與呼吸',
        soundscape: '沉浸音場',
        saveRitual: '儲存閱讀儀式',
        shareExperience: '邀請共讀'
      },
      
      // 主題
      themes: {
        lumina: '晨光 Lumina',
        noir: '暮夜 Noir',
        aurum: '琥珀 Aurum'
      },
      
      // 音景
      soundscapes: {
        ocean: {
          name: '星海潮汐',
          description: '清晨海岸·波長 432Hz'
        },
        forest: {
          name: '松林霧徑',
          description: '靜心 Alpha·滲透率 64%'
        },
        city: {
          name: '夜幕都會',
          description: '城市律動·低頻馭化'
        }
      },
      
      // 管家服務
      concierge: {
        eyebrow: 'Concierge Intelligence',
        title: '私人閱讀管家，全天候待命',
        description: '無論你身在六星飯店頂樓、私人遊艇或空中艙房，ModernReader Royale 以全域雲端禮賓網絡為你安排每一場閱讀盛宴。',
        ctaPrimary: '安排私人導讀',
        ctaSecondary: '即時聯繫禮賓'
      },
      
      // 頁腳
      footer: {
        tagline: '重新定義閱讀奢華，打造你的專屬靈感宮殿。',
        privacy: '隱私條款',
        brand: '品牌誌',
        investors: '投資人',
        careers: '加入禮賓'
      },
      
      // 模態框
      modals: {
        booking: {
          title: '預約專屬導覽',
          intro: '填寫資訊，我們將為您安排一對一的產品體驗',
          name: '姓名',
          email: 'Email',
          date: '預約日期',
          time: '預約時間',
          message: '留言',
          submit: '確認預約',
          success: '預約成功！'
        },
        chat: {
          title: '即時聯繫',
          placeholder: '輸入您的問題...',
          send: '發送',
          botGreeting: '您好！我是 ModernReader 智能助手，有什麼可以幫助您的嗎？'
        }
      },
      
      // Toast 訊息
      toast: {
        saved: '已儲存',
        copied: '已複製到剪貼簿',
        shareSuccess: '分享成功',
        shareError: '分享失敗',
        bookmarkAdded: '已添加書籤',
        bookmarkRemoved: '已移除書籤'
      }
    },
    
    'en': {
      nav: {
        experiences: 'Experiences',
        immersion: 'Reading Hall',
        curation: 'Collection',
        concierge: 'Concierge'
      },
      
      common: {
        loading: 'Loading...',
        save: 'Save',
        cancel: 'Cancel',
        confirm: 'Confirm',
        close: 'Close',
        delete: 'Delete',
        edit: 'Edit',
        share: 'Share',
        search: 'Search',
        settings: 'Settings',
        bookmark: 'Bookmark',
        next: 'Next',
        previous: 'Previous'
      },
      
      hero: {
        eyebrow: 'World-Class Reading Aesthetics',
        title: 'Awakening Inspiration with Next-Gen Flagship Reading Experience',
        lead: 'Combining luxury craftsmanship, sensory algorithms, and exclusive reading curation, transforming every page into an irreplaceable private celebration.',
        ctaPrimary: 'Activate Concierge Mode',
        ctaSecondary: 'Explore Star Curation'
      },
      
      experiences: {
        eyebrow: 'Signature Experiences',
        title: 'Exclusive Scenes for Elite Readers',
        description: 'Each feature is crafted by cross-disciplinary design teams, combining art, acoustics, and intelligent technology.',
        theater: {
          title: 'Spectrum Theater Mode',
          description: 'Full-spectrum projection with spatial soundscape, transforming text into a multi-sensory immersive theater.'
        },
        zen: {
          title: 'Zen Focus Engine',
          description: 'Precisely harmonizing letter spacing, lighting, and background with heart rate and brainwave rhythms.'
        },
        curation: {
          title: 'Star-Rated Taste Curation',
          description: 'Global library personal butler, curating based on your journey and mood with exclusive limited content.'
        }
      },
      
      immersion: {
        eyebrow: 'Immersive Atelier',
        title: 'Custom Immersive Reading Hall',
        description: 'Preview your exclusive panel and create the reading ritual closest to your mood.',
        theme: 'Scene Theme',
        fontSize: 'Font Scale',
        letterSpacing: 'Letter Spacing',
        soundscape: 'Soundscape',
        saveRitual: 'Save Reading Ritual',
        shareExperience: 'Invite to Co-read'
      },
      
      themes: {
        lumina: 'Dawn Lumina',
        noir: 'Twilight Noir',
        aurum: 'Amber Aurum'
      },
      
      soundscapes: {
        ocean: {
          name: 'Star Ocean Tide',
          description: 'Morning Coast · 432Hz'
        },
        forest: {
          name: 'Pine Forest Path',
          description: 'Alpha Meditation · 64%'
        },
        city: {
          name: 'Night Metropolis',
          description: 'Urban Rhythm · Low Frequency'
        }
      },
      
      concierge: {
        eyebrow: 'Concierge Intelligence',
        title: 'Personal Reading Butler, Available 24/7',
        description: 'Whether you\'re in a six-star hotel penthouse, private yacht, or air cabin, ModernReader Royale arranges every reading feast through global cloud concierge network.',
        ctaPrimary: 'Arrange Private Reading',
        ctaSecondary: 'Contact Concierge'
      },
      
      footer: {
        tagline: 'Redefining reading luxury, creating your exclusive inspiration palace.',
        privacy: 'Privacy Policy',
        brand: 'Brand Story',
        investors: 'Investors',
        careers: 'Join Concierge'
      },
      
      modals: {
        booking: {
          title: 'Book Exclusive Tour',
          intro: 'Fill in the information and we will arrange a one-on-one product experience',
          name: 'Name',
          email: 'Email',
          date: 'Booking Date',
          time: 'Booking Time',
          message: 'Message',
          submit: 'Confirm Booking',
          success: 'Booking Successful!'
        },
        chat: {
          title: 'Live Chat',
          placeholder: 'Enter your question...',
          send: 'Send',
          botGreeting: 'Hello! I am the ModernReader AI assistant. How can I help you?'
        }
      },
      
      toast: {
        saved: 'Saved',
        copied: 'Copied to clipboard',
        shareSuccess: 'Shared successfully',
        shareError: 'Share failed',
        bookmarkAdded: 'Bookmark added',
        bookmarkRemoved: 'Bookmark removed'
      }
    }
  },

  /**
   * 初始化 i18n
   * @param {string} locale - 初始語言
   */
  init(locale = null) {
    // 偵測語言優先順序：參數 > localStorage > 瀏覽器語言 > 預設
    if (locale) {
      this.currentLocale = locale;
    } else if (typeof Storage !== 'undefined') {
      const saved = localStorage.getItem('mr_locale');
      if (saved && this.resources[saved]) {
        this.currentLocale = saved;
      }
    } else if (navigator.language) {
      const browserLocale = navigator.language;
      if (this.resources[browserLocale]) {
        this.currentLocale = browserLocale;
      } else if (browserLocale.startsWith('zh')) {
        this.currentLocale = 'zh-TW';
      } else {
        this.currentLocale = 'en';
      }
    }
    
    console.log(`🌐 i18n initialized: ${this.currentLocale}`);
  },

  /**
   * 獲取翻譯文字
   * @param {string} key - 翻譯鍵 (支援點號分隔，如 'nav.experiences')
   * @param {object} params - 插值參數
   * @returns {string}
   */
  t(key, params = {}) {
    const keys = key.split('.');
    let value = this.resources[this.currentLocale];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // 嘗試 fallback 語言
        value = this.resources[this.fallbackLocale];
        for (const fk of keys) {
          if (value && typeof value === 'object' && fk in value) {
            value = value[fk];
          } else {
            return key; // 找不到翻譯，返回原始 key
          }
        }
        break;
      }
    }
    
    // 處理插值
    if (typeof value === 'string' && Object.keys(params).length > 0) {
      return value.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => {
        return params[paramKey] !== undefined ? params[paramKey] : `{{${paramKey}}}`;
      });
    }
    
    return typeof value === 'string' ? value : key;
  },

  /**
   * 切換語言
   * @param {string} locale - 目標語言
   */
  setLocale(locale) {
    if (!this.resources[locale]) {
      console.warn(`Locale "${locale}" not found`);
      return;
    }
    
    this.currentLocale = locale;
    
    // 儲存到 localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('mr_locale', locale);
    }
    
    // 觸發事件
    window.dispatchEvent(new CustomEvent('localeChange', { detail: { locale } }));
    
    // 記錄分析
    if (typeof Analytics !== 'undefined') {
      Analytics.track('locale_change', { locale });
    }
    
    console.log(`🌐 Locale changed to: ${locale}`);
  },

  /**
   * 獲取當前語言
   * @returns {string}
   */
  getLocale() {
    return this.currentLocale;
  },

  /**
   * 獲取可用語言列表
   * @returns {string[]}
   */
  getAvailableLocales() {
    return Object.keys(this.resources);
  },

  /**
   * 添加翻譯資源
   * @param {string} locale - 語言代碼
   * @param {object} resource - 翻譯資源
   */
  addResource(locale, resource) {
    if (this.resources[locale]) {
      this.resources[locale] = { ...this.resources[locale], ...resource };
    } else {
      this.resources[locale] = resource;
    }
  }
};

// 初始化
if (typeof window !== 'undefined') {
  i18n.init();
}

// 導出模組
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { i18n };
}

// 瀏覽器環境下掛載到 window
if (typeof window !== 'undefined') {
  window.i18n = i18n;
  window.t = (key, params) => i18n.t(key, params);
}
