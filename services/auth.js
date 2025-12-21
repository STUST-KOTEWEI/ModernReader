/**
 * ModernReader - Authentication Service
 * 用戶認證服務
 */

const AuthService = {
  currentUser: null,
  TOKEN_KEY: 'mr_auth_token',
  USER_KEY: 'mr_user',

  /**
   * 初始化認證服務
   */
  init() {
    // 從 localStorage 恢復登入狀態
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userStr = localStorage.getItem(this.USER_KEY);
    
    if (token && userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
        console.log('🔐 Auth restored for:', this.currentUser.email);
      } catch (e) {
        this.logout();
      }
    }
  },

  /**
   * 登入
   * @param {object} credentials - { email, password }
   * @returns {Promise<object>}
   */
  async login(credentials) {
    const { email, password } = credentials;

    // 模擬 API 請求
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 模擬驗證 (實際應該呼叫後端 API)
        if (email && password.length >= 6) {
          const user = {
            id: `user_${Date.now()}`,
            email,
            name: email.split('@')[0],
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
            createdAt: new Date().toISOString(),
            preferences: {
              theme: 'lumina',
              language: 'zh-TW'
            }
          };

          const token = btoa(JSON.stringify({ userId: user.id, exp: Date.now() + 86400000 }));

          localStorage.setItem(this.TOKEN_KEY, token);
          localStorage.setItem(this.USER_KEY, JSON.stringify(user));
          this.currentUser = user;

          if (typeof Analytics !== 'undefined') {
            Analytics.track('login', { method: 'email' });
          }

          resolve({ success: true, user, token });
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 500);
    });
  },

  /**
   * 註冊
   * @param {object} userData - { email, password, name }
   * @returns {Promise<object>}
   */
  async register(userData) {
    const { email, password, name } = userData;

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!email || !password || password.length < 6) {
          reject(new Error('Invalid registration data'));
          return;
        }

        const user = {
          id: `user_${Date.now()}`,
          email,
          name: name || email.split('@')[0],
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          createdAt: new Date().toISOString(),
          preferences: {
            theme: 'lumina',
            language: 'zh-TW'
          }
        };

        const token = btoa(JSON.stringify({ userId: user.id, exp: Date.now() + 86400000 }));

        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUser = user;

        if (typeof Analytics !== 'undefined') {
          Analytics.track('register', { method: 'email' });
        }

        resolve({ success: true, user, token });
      }, 500);
    });
  },

  /**
   * 登出
   */
  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser = null;

    if (typeof Analytics !== 'undefined') {
      Analytics.track('logout');
    }

    // 觸發登出事件
    window.dispatchEvent(new CustomEvent('auth:logout'));
  },

  /**
   * 檢查是否已登入
   * @returns {boolean}
   */
  isAuthenticated() {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token));
      return payload.exp > Date.now();
    } catch {
      return false;
    }
  },

  /**
   * 獲取當前用戶
   * @returns {object|null}
   */
  getUser() {
    return this.currentUser;
  },

  /**
   * 獲取 Token
   * @returns {string|null}
   */
  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  /**
   * 更新用戶資料
   * @param {object} data
   * @returns {Promise<object>}
   */
  async updateProfile(data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (this.currentUser) {
          this.currentUser = { ...this.currentUser, ...data };
          localStorage.setItem(this.USER_KEY, JSON.stringify(this.currentUser));
          resolve({ success: true, user: this.currentUser });
        }
      }, 300);
    });
  },

  /**
   * 修改密碼
   * @param {string} currentPassword
   * @param {string} newPassword
   * @returns {Promise<object>}
   */
  async changePassword(currentPassword, newPassword) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (newPassword.length >= 6) {
          resolve({ success: true, message: 'Password updated' });
        } else {
          reject(new Error('Password too short'));
        }
      }, 300);
    });
  },

  /**
   * 忘記密碼
   * @param {string} email
   * @returns {Promise<object>}
   */
  async forgotPassword(email) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: 'Reset link sent' });
      }, 300);
    });
  },

  /**
   * 社群登入
   * @param {string} provider - 'google' | 'facebook' | 'apple'
   * @returns {Promise<object>}
   */
  async socialLogin(provider) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = {
          id: `user_${Date.now()}`,
          email: `user@${provider}.com`,
          name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider}`,
          provider,
          createdAt: new Date().toISOString()
        };

        const token = btoa(JSON.stringify({ userId: user.id, exp: Date.now() + 86400000 }));

        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUser = user;

        if (typeof Analytics !== 'undefined') {
          Analytics.track('login', { method: provider });
        }

        resolve({ success: true, user, token });
      }, 500);
    });
  }
};

// 初始化
if (typeof window !== 'undefined') {
  AuthService.init();
}

// 導出模組
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AuthService };
}

if (typeof window !== 'undefined') {
  window.AuthService = AuthService;
}
