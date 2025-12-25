/**
 * ModernReader - Validation Utilities
 * 表單驗證工具
 */

const Validation = {
  /**
   * 驗證規則
   */
  rules: {
    required: {
      validate: value => value !== null && value !== undefined && value.toString().trim() !== '',
      message: '此欄位為必填'
    },
    email: {
      validate: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: '請輸入有效的電子郵件'
    },
    minLength: (min) => ({
      validate: value => value.length >= min,
      message: `長度不得少於 ${min} 個字元`
    }),
    maxLength: (max) => ({
      validate: value => value.length <= max,
      message: `長度不得超過 ${max} 個字元`
    }),
    min: (min) => ({
      validate: value => Number(value) >= min,
      message: `數值不得小於 ${min}`
    }),
    max: (max) => ({
      validate: value => Number(value) <= max,
      message: `數值不得大於 ${max}`
    }),
    pattern: (regex, msg) => ({
      validate: value => regex.test(value),
      message: msg || '格式不正確'
    }),
    url: {
      validate: value => {
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      message: '請輸入有效的網址'
    },
    phone: {
      validate: value => /^[\d\s\-+()]{7,20}$/.test(value),
      message: '請輸入有效的電話號碼'
    },
    numeric: {
      validate: value => /^\d+$/.test(value),
      message: '請輸入數字'
    },
    alphanumeric: {
      validate: value => /^[a-zA-Z0-9]+$/.test(value),
      message: '只能包含英文字母和數字'
    },
    date: {
      validate: value => !isNaN(Date.parse(value)),
      message: '請輸入有效的日期'
    },
    creditCard: {
      validate: value => {
        const cleaned = value.replace(/\s/g, '');
        if (!/^\d{13,19}$/.test(cleaned)) return false;
        // Luhn 算法
        let sum = 0;
        let isEven = false;
        for (let i = cleaned.length - 1; i >= 0; i--) {
          let digit = parseInt(cleaned[i], 10);
          if (isEven) {
            digit *= 2;
            if (digit > 9) digit -= 9;
          }
          sum += digit;
          isEven = !isEven;
        }
        return sum % 10 === 0;
      },
      message: '請輸入有效的信用卡號'
    },
    match: (fieldName, getValue) => ({
      validate: value => value === getValue(),
      message: `必須與${fieldName}相符`
    }),
    custom: (validateFn, message) => ({
      validate: validateFn,
      message
    })
  },

  /**
   * 驗證單一值
   * @param {*} value - 要驗證的值
   * @param {Array} rules - 驗證規則陣列
   * @returns {object} { valid: boolean, errors: string[] }
   */
  validate(value, rules) {
    const errors = [];

    for (const rule of rules) {
      const ruleObj = typeof rule === 'string' ? this.rules[rule] : rule;
      
      if (!ruleObj) {
        console.warn(`Unknown validation rule: ${rule}`);
        continue;
      }

      if (!ruleObj.validate(value)) {
        errors.push(ruleObj.message);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * 驗證表單
   * @param {object} data - 表單資料
   * @param {object} schema - 驗證架構
   * @returns {object} { valid: boolean, errors: object }
   */
  validateForm(data, schema) {
    const errors = {};
    let valid = true;

    for (const [field, rules] of Object.entries(schema)) {
      const result = this.validate(data[field], rules);
      if (!result.valid) {
        valid = false;
        errors[field] = result.errors;
      }
    }

    return { valid, errors };
  },

  /**
   * 創建表單驗證器
   * @param {HTMLFormElement} form - 表單元素
   * @param {object} schema - 驗證架構
   * @param {object} options - 選項
   * @returns {object} 驗證器
   */
  createValidator(form, schema, options = {}) {
    const {
      onSubmit,
      onError,
      validateOnBlur = true,
      validateOnInput = false,
      errorClass = 'field-error',
      errorMessageClass = 'error-message'
    } = options;

    const showError = (field, messages) => {
      const input = form.querySelector(`[name="${field}"]`);
      if (!input) return;

      input.classList.add(errorClass);
      
      // 移除舊的錯誤訊息
      const existingMsg = input.parentNode.querySelector(`.${errorMessageClass}`);
      if (existingMsg) existingMsg.remove();

      // 添加錯誤訊息
      const errorEl = document.createElement('span');
      errorEl.className = errorMessageClass;
      errorEl.textContent = messages[0];
      errorEl.style.cssText = 'color: #ef4444; font-size: 12px; margin-top: 4px; display: block;';
      input.parentNode.appendChild(errorEl);
    };

    const clearError = (field) => {
      const input = form.querySelector(`[name="${field}"]`);
      if (!input) return;

      input.classList.remove(errorClass);
      const existingMsg = input.parentNode.querySelector(`.${errorMessageClass}`);
      if (existingMsg) existingMsg.remove();
    };

    const validateField = (field) => {
      const input = form.querySelector(`[name="${field}"]`);
      if (!input || !schema[field]) return true;

      const result = this.validate(input.value, schema[field]);
      if (!result.valid) {
        showError(field, result.errors);
      } else {
        clearError(field);
      }
      return result.valid;
    };

    // 綁定事件
    Object.keys(schema).forEach(field => {
      const input = form.querySelector(`[name="${field}"]`);
      if (!input) return;

      if (validateOnBlur) {
        input.addEventListener('blur', () => validateField(field));
      }

      if (validateOnInput) {
        input.addEventListener('input', () => validateField(field));
      }
    });

    // 表單提交
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      const result = this.validateForm(data, schema);

      if (result.valid) {
        if (onSubmit) onSubmit(data);
      } else {
        Object.entries(result.errors).forEach(([field, messages]) => {
          showError(field, messages);
        });
        if (onError) onError(result.errors);
      }
    });

    return {
      validate: () => {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        return this.validateForm(data, schema);
      },
      validateField,
      clearError,
      clearAllErrors: () => Object.keys(schema).forEach(clearError)
    };
  },

  /**
   * 密碼強度檢查
   * @param {string} password
   * @returns {object} { score: number, level: string, suggestions: string[] }
   */
  checkPasswordStrength(password) {
    let score = 0;
    const suggestions = [];

    if (password.length >= 8) score++;
    else suggestions.push('至少 8 個字元');

    if (password.length >= 12) score++;

    if (/[a-z]/.test(password)) score++;
    else suggestions.push('包含小寫字母');

    if (/[A-Z]/.test(password)) score++;
    else suggestions.push('包含大寫字母');

    if (/\d/.test(password)) score++;
    else suggestions.push('包含數字');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    else suggestions.push('包含特殊字元');

    const levels = ['極弱', '弱', '普通', '強', '很強', '極強'];
    const level = levels[Math.min(score, levels.length - 1)];

    return { score, level, suggestions };
  }
};

// 導出模組
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Validation };
}

if (typeof window !== 'undefined') {
  window.Validation = Validation;
}
