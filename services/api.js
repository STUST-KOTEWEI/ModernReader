/**
 * ModernReader - API Service Layer
 * API 服務層，用於與後端 H.O.L.O. 整合
 */

const API = {
  baseUrl: 'https://api.modernreader.io',
  timeout: 10000,
  
  /**
   * 設定 API 基礎 URL
   * @param {string} url
   */
  setBaseUrl(url) {
    this.baseUrl = url;
  },

  /**
   * 發送請求
   * @param {string} endpoint - API 端點
   * @param {object} options - 請求選項
   * @returns {Promise<any>}
   */
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      body = null,
      headers = {},
      timeout = this.timeout
    } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: body ? JSON.stringify(body) : null,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  },

  /**
   * GET 請求
   */
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  },

  /**
   * POST 請求
   */
  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  },

  /**
   * PUT 請求
   */
  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  },

  /**
   * DELETE 請求
   */
  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
};

/**
 * 書籍服務
 */
const BookService = {
  /**
   * 獲取所有書籍
   * @param {object} params - 查詢參數
   * @returns {Promise<Array>}
   */
  async getAll(params = {}) {
    try {
      return await API.get('/books', { params });
    } catch (error) {
      console.warn('API unavailable, using local data');
      return this.getLocalBooks();
    }
  },

  /**
   * 獲取單本書籍
   * @param {string} id - 書籍 ID
   * @returns {Promise<object>}
   */
  async getById(id) {
    try {
      return await API.get(`/books/${id}`);
    } catch (error) {
      console.warn('API unavailable, using local data');
      const books = await this.getLocalBooks();
      return books.find(b => b.id === id);
    }
  },

  /**
   * 搜尋書籍
   * @param {string} query - 搜尋關鍵字
   * @returns {Promise<Array>}
   */
  async search(query) {
    try {
      return await API.get(`/books/search?q=${encodeURIComponent(query)}`);
    } catch (error) {
      const books = await this.getLocalBooks();
      const lowerQuery = query.toLowerCase();
      return books.filter(b => 
        b.title.toLowerCase().includes(lowerQuery) ||
        b.author.toLowerCase().includes(lowerQuery)
      );
    }
  },

  /**
   * 獲取本地書籍資料
   * @returns {Promise<Array>}
   */
  async getLocalBooks() {
    try {
      const response = await fetch('./data/books.json');
      const data = await response.json();
      return data.books || [];
    } catch (error) {
      console.error('Failed to load local books:', error);
      return [];
    }
  },

  /**
   * 獲取推薦書籍
   * @param {object} preferences - 用戶偏好
   * @returns {Promise<Array>}
   */
  async getRecommendations(preferences = {}) {
    try {
      return await API.post('/books/recommendations', preferences);
    } catch (error) {
      // 簡單的本地推薦邏輯
      const books = await this.getLocalBooks();
      return books.slice(0, 5);
    }
  }
};

/**
 * 閱讀服務
 */
const ReadingService = {
  /**
   * 同步閱讀進度到雲端
   * @param {string} bookId - 書籍 ID
   * @param {object} progress - 進度資料
   */
  async syncProgress(bookId, progress) {
    try {
      await API.post(`/reading/${bookId}/progress`, progress);
    } catch (error) {
      console.warn('Progress sync failed, saved locally');
      if (typeof ReadingProgress !== 'undefined') {
        ReadingProgress.save(bookId, progress.percentage, progress.chapter);
      }
    }
  },

  /**
   * 獲取閱讀統計
   * @returns {Promise<object>}
   */
  async getStats() {
    try {
      return await API.get('/reading/stats');
    } catch (error) {
      // 返回本地統計
      return {
        totalBooks: 0,
        totalTime: 0,
        averageSpeed: 0,
        streak: 0
      };
    }
  }
};

/**
 * H.O.L.O. AI 服務
 * 與 Project H.O.L.O. 後端整合
 */
const HOLOService = {
  /**
   * 分析文本情緒
   * @param {string} text - 文本內容
   * @returns {Promise<object>}
   */
  async analyzeEmotion(text) {
    try {
      return await API.post('/holo/analyze/emotion', { text });
    } catch (error) {
      // 模擬分析結果
      return {
        sentiment: 'positive',
        emotion: 'joy',
        confidence: 0.85
      };
    }
  },

  /**
   * 生成音景建議
   * @param {object} context - 上下文資訊
   * @returns {Promise<object>}
   */
  async suggestSoundscape(context) {
    try {
      return await API.post('/holo/suggest/soundscape', context);
    } catch (error) {
      return {
        recommended: 'ocean',
        alternatives: ['forest', 'city']
      };
    }
  },

  /**
   * 獲取閱讀建議
   * @param {object} userProfile - 用戶資料
   * @returns {Promise<Array>}
   */
  async getReadingSuggestions(userProfile) {
    try {
      return await API.post('/holo/suggestions', userProfile);
    } catch (error) {
      return [];
    }
  },

  /**
   * 文字轉語音
   * @param {string} text - 文本
   * @param {object} options - 選項
   * @returns {Promise<Blob>}
   */
  async textToSpeech(text, options = {}) {
    try {
      const response = await fetch(`${API.baseUrl}/holo/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, ...options })
      });
      return await response.blob();
    } catch (error) {
      // 使用瀏覽器內建 TTS
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        speechSynthesis.speak(utterance);
      }
      return null;
    }
  }
};

/**
 * 用戶服務
 */
const UserService = {
  /**
   * 登入
   * @param {object} credentials - 登入資訊
   * @returns {Promise<object>}
   */
  async login(credentials) {
    return await API.post('/auth/login', credentials);
  },

  /**
   * 註冊
   * @param {object} userData - 用戶資料
   * @returns {Promise<object>}
   */
  async register(userData) {
    return await API.post('/auth/register', userData);
  },

  /**
   * 獲取用戶資料
   * @returns {Promise<object>}
   */
  async getProfile() {
    return await API.get('/user/profile');
  },

  /**
   * 更新用戶資料
   * @param {object} data - 更新資料
   * @returns {Promise<object>}
   */
  async updateProfile(data) {
    return await API.put('/user/profile', data);
  }
};

// 導出模組
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API, BookService, ReadingService, HOLOService, UserService };
}

// 瀏覽器環境下掛載到 window
if (typeof window !== 'undefined') {
  window.API = API;
  window.BookService = BookService;
  window.ReadingService = ReadingService;
  window.HOLOService = HOLOService;
  window.UserService = UserService;
}
