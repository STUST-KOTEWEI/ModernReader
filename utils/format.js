/**
 * ModernReader - Format Utilities
 * 日期/數字格式化工具
 */

const Format = {
  /**
   * 格式化日期
   * @param {Date|string|number} date - 日期
   * @param {string} format - 格式字串
   * @returns {string}
   */
  date(date, format = 'YYYY-MM-DD') {
    const d = date instanceof Date ? date : new Date(date);
    
    if (isNaN(d.getTime())) {
      return 'Invalid Date';
    }

    const tokens = {
      YYYY: d.getFullYear(),
      YY: String(d.getFullYear()).slice(-2),
      MM: String(d.getMonth() + 1).padStart(2, '0'),
      M: d.getMonth() + 1,
      DD: String(d.getDate()).padStart(2, '0'),
      D: d.getDate(),
      HH: String(d.getHours()).padStart(2, '0'),
      H: d.getHours(),
      hh: String(d.getHours() % 12 || 12).padStart(2, '0'),
      h: d.getHours() % 12 || 12,
      mm: String(d.getMinutes()).padStart(2, '0'),
      m: d.getMinutes(),
      ss: String(d.getSeconds()).padStart(2, '0'),
      s: d.getSeconds(),
      A: d.getHours() < 12 ? 'AM' : 'PM',
      a: d.getHours() < 12 ? 'am' : 'pm'
    };

    return format.replace(/YYYY|YY|MM|M|DD|D|HH|H|hh|h|mm|m|ss|s|A|a/g, match => tokens[match]);
  },

  /**
   * 相對時間 (如：3 分鐘前)
   * @param {Date|string|number} date
   * @param {string} locale - 語言 ('zh-TW' | 'en')
   * @returns {string}
   */
  relativeTime(date, locale = 'zh-TW') {
    const d = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diff = now - d;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    const i18n = {
      'zh-TW': {
        now: '剛剛',
        seconds: n => `${n} 秒前`,
        minutes: n => `${n} 分鐘前`,
        hours: n => `${n} 小時前`,
        days: n => `${n} 天前`,
        weeks: n => `${n} 週前`,
        months: n => `${n} 個月前`,
        years: n => `${n} 年前`
      },
      'en': {
        now: 'just now',
        seconds: n => `${n} second${n > 1 ? 's' : ''} ago`,
        minutes: n => `${n} minute${n > 1 ? 's' : ''} ago`,
        hours: n => `${n} hour${n > 1 ? 's' : ''} ago`,
        days: n => `${n} day${n > 1 ? 's' : ''} ago`,
        weeks: n => `${n} week${n > 1 ? 's' : ''} ago`,
        months: n => `${n} month${n > 1 ? 's' : ''} ago`,
        years: n => `${n} year${n > 1 ? 's' : ''} ago`
      }
    };

    const t = i18n[locale] || i18n['zh-TW'];

    if (seconds < 10) return t.now;
    if (seconds < 60) return t.seconds(seconds);
    if (minutes < 60) return t.minutes(minutes);
    if (hours < 24) return t.hours(hours);
    if (days < 7) return t.days(days);
    if (weeks < 4) return t.weeks(weeks);
    if (months < 12) return t.months(months);
    return t.years(years);
  },

  /**
   * 格式化數字
   * @param {number} number
   * @param {object} options
   * @returns {string}
   */
  number(number, options = {}) {
    const {
      decimals = 0,
      thousandsSeparator = ',',
      decimalSeparator = '.'
    } = options;

    const fixed = Number(number).toFixed(decimals);
    const [intPart, decPart] = fixed.split('.');
    
    const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
    
    return decPart ? `${formatted}${decimalSeparator}${decPart}` : formatted;
  },

  /**
   * 格式化貨幣
   * @param {number} amount
   * @param {string} currency - 貨幣代碼
   * @param {string} locale
   * @returns {string}
   */
  currency(amount, currency = 'TWD', locale = 'zh-TW') {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency
      }).format(amount);
    } catch {
      const symbols = { USD: '$', TWD: 'NT$', EUR: '€', JPY: '¥', GBP: '£' };
      return `${symbols[currency] || currency} ${this.number(amount, { decimals: 2 })}`;
    }
  },

  /**
   * 格式化百分比
   * @param {number} value - 小數值 (0.5 = 50%)
   * @param {number} decimals
   * @returns {string}
   */
  percent(value, decimals = 0) {
    return `${(value * 100).toFixed(decimals)}%`;
  },

  /**
   * 格式化檔案大小
   * @param {number} bytes
   * @param {number} decimals
   * @returns {string}
   */
  fileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
  },

  /**
   * 格式化時間長度
   * @param {number} seconds
   * @param {string} format - 'short' | 'long'
   * @returns {string}
   */
  duration(seconds, format = 'short') {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (format === 'short') {
      if (h > 0) {
        return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      }
      return `${m}:${String(s).padStart(2, '0')}`;
    }

    const parts = [];
    if (h > 0) parts.push(`${h} 小時`);
    if (m > 0) parts.push(`${m} 分鐘`);
    if (s > 0 || parts.length === 0) parts.push(`${s} 秒`);

    return parts.join(' ');
  },

  /**
   * 縮短數字 (如：1.2K, 3.5M)
   * @param {number} number
   * @param {number} decimals
   * @returns {string}
   */
  compact(number, decimals = 1) {
    const suffixes = ['', 'K', 'M', 'B', 'T'];
    const tier = Math.floor(Math.log10(Math.abs(number)) / 3);
    
    if (tier === 0) return String(number);
    
    const suffix = suffixes[tier];
    const scale = Math.pow(10, tier * 3);
    const scaled = number / scale;
    
    return scaled.toFixed(decimals).replace(/\.0+$/, '') + suffix;
  },

  /**
   * 格式化電話號碼
   * @param {string} phone
   * @param {string} format - 格式模板
   * @returns {string}
   */
  phone(phone, format = '####-###-###') {
    const digits = phone.replace(/\D/g, '');
    let result = '';
    let digitIndex = 0;

    for (const char of format) {
      if (digitIndex >= digits.length) break;
      if (char === '#') {
        result += digits[digitIndex++];
      } else {
        result += char;
      }
    }

    return result;
  },

  /**
   * 截斷文字
   * @param {string} text
   * @param {number} maxLength
   * @param {string} suffix
   * @returns {string}
   */
  truncate(text, maxLength = 100, suffix = '...') {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - suffix.length).trim() + suffix;
  },

  /**
   * 首字母大寫
   * @param {string} text
   * @returns {string}
   */
  capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  /**
   * 轉換為標題格式
   * @param {string} text
   * @returns {string}
   */
  titleCase(text) {
    return text.replace(/\w\S*/g, txt => 
      txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
    );
  },

  /**
   * 轉換為 slug 格式
   * @param {string} text
   * @returns {string}
   */
  slug(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  },

  /**
   * 遮罩敏感資料
   * @param {string} text
   * @param {number} visibleStart - 開頭可見字數
   * @param {number} visibleEnd - 結尾可見字數
   * @param {string} maskChar
   * @returns {string}
   */
  mask(text, visibleStart = 2, visibleEnd = 2, maskChar = '*') {
    if (text.length <= visibleStart + visibleEnd) return text;
    
    const start = text.slice(0, visibleStart);
    const end = text.slice(-visibleEnd);
    const middle = maskChar.repeat(text.length - visibleStart - visibleEnd);
    
    return start + middle + end;
  }
};

// 導出模組
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Format };
}

if (typeof window !== 'undefined') {
  window.Format = Format;
}
