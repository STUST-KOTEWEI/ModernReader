/**
 * ModernReader - Animation Utilities
 * 動畫工具函數
 */

const Animation = {
  /**
   * 緩動函數集合
   */
  easing: {
    linear: t => t,
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: t => t * t * t,
    easeOutCubic: t => (--t) * t * t + 1,
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeInQuart: t => t * t * t * t,
    easeOutQuart: t => 1 - (--t) * t * t * t,
    easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
    easeOutElastic: t => {
      const p = 0.3;
      return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
    },
    easeOutBounce: t => {
      if (t < 1 / 2.75) {
        return 7.5625 * t * t;
      } else if (t < 2 / 2.75) {
        return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
      } else if (t < 2.5 / 2.75) {
        return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
      } else {
        return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
      }
    }
  },

  /**
   * 動畫執行
   * @param {object} options - 動畫配置
   * @returns {object} 動畫控制器
   */
  animate(options) {
    const {
      from = 0,
      to = 1,
      duration = 300,
      easing = 'easeOutQuad',
      onUpdate,
      onComplete
    } = options;

    const easingFn = typeof easing === 'function' ? easing : this.easing[easing];
    const startTime = performance.now();
    let animationId;
    let cancelled = false;

    const tick = (currentTime) => {
      if (cancelled) return;

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFn(progress);
      const currentValue = from + (to - from) * easedProgress;

      if (onUpdate) {
        onUpdate(currentValue, progress);
      }

      if (progress < 1) {
        animationId = requestAnimationFrame(tick);
      } else if (onComplete) {
        onComplete();
      }
    };

    animationId = requestAnimationFrame(tick);

    return {
      cancel: () => {
        cancelled = true;
        cancelAnimationFrame(animationId);
      }
    };
  },

  /**
   * 淡入動畫
   * @param {HTMLElement} element
   * @param {number} duration
   * @returns {Promise}
   */
  fadeIn(element, duration = 300) {
    return new Promise(resolve => {
      element.style.opacity = '0';
      element.style.display = '';

      this.animate({
        from: 0,
        to: 1,
        duration,
        onUpdate: value => {
          element.style.opacity = value;
        },
        onComplete: resolve
      });
    });
  },

  /**
   * 淡出動畫
   * @param {HTMLElement} element
   * @param {number} duration
   * @returns {Promise}
   */
  fadeOut(element, duration = 300) {
    return new Promise(resolve => {
      this.animate({
        from: 1,
        to: 0,
        duration,
        onUpdate: value => {
          element.style.opacity = value;
        },
        onComplete: () => {
          element.style.display = 'none';
          resolve();
        }
      });
    });
  },

  /**
   * 滑入動畫
   * @param {HTMLElement} element
   * @param {string} direction - 方向 (up, down, left, right)
   * @param {number} duration
   * @returns {Promise}
   */
  slideIn(element, direction = 'up', duration = 300) {
    return new Promise(resolve => {
      const transforms = {
        up: 'translateY(20px)',
        down: 'translateY(-20px)',
        left: 'translateX(20px)',
        right: 'translateX(-20px)'
      };

      element.style.opacity = '0';
      element.style.transform = transforms[direction];
      element.style.display = '';

      this.animate({
        from: 0,
        to: 1,
        duration,
        easing: 'easeOutCubic',
        onUpdate: value => {
          element.style.opacity = value;
          const translate = 20 * (1 - value);
          const axis = direction === 'up' || direction === 'down' ? 'Y' : 'X';
          const sign = direction === 'up' || direction === 'left' ? 1 : -1;
          element.style.transform = `translate${axis}(${translate * sign}px)`;
        },
        onComplete: () => {
          element.style.transform = '';
          resolve();
        }
      });
    });
  },

  /**
   * 縮放動畫
   * @param {HTMLElement} element
   * @param {number} from
   * @param {number} to
   * @param {number} duration
   * @returns {Promise}
   */
  scale(element, from = 0.8, to = 1, duration = 300) {
    return new Promise(resolve => {
      element.style.transform = `scale(${from})`;

      this.animate({
        from,
        to,
        duration,
        easing: 'easeOutElastic',
        onUpdate: value => {
          element.style.transform = `scale(${value})`;
        },
        onComplete: () => {
          element.style.transform = '';
          resolve();
        }
      });
    });
  },

  /**
   * 搖晃動畫
   * @param {HTMLElement} element
   * @param {number} intensity
   * @param {number} duration
   * @returns {Promise}
   */
  shake(element, intensity = 10, duration = 500) {
    return new Promise(resolve => {
      const startTime = performance.now();

      const tick = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = elapsed / duration;

        if (progress < 1) {
          const decay = 1 - progress;
          const x = Math.sin(progress * Math.PI * 10) * intensity * decay;
          element.style.transform = `translateX(${x}px)`;
          requestAnimationFrame(tick);
        } else {
          element.style.transform = '';
          resolve();
        }
      };

      requestAnimationFrame(tick);
    });
  },

  /**
   * 脈衝動畫
   * @param {HTMLElement} element
   * @param {number} scale
   * @param {number} duration
   * @returns {Promise}
   */
  pulse(element, scale = 1.1, duration = 200) {
    return new Promise(resolve => {
      this.animate({
        from: 1,
        to: scale,
        duration: duration / 2,
        easing: 'easeOutQuad',
        onUpdate: value => {
          element.style.transform = `scale(${value})`;
        },
        onComplete: () => {
          this.animate({
            from: scale,
            to: 1,
            duration: duration / 2,
            easing: 'easeInQuad',
            onUpdate: value => {
              element.style.transform = `scale(${value})`;
            },
            onComplete: () => {
              element.style.transform = '';
              resolve();
            }
          });
        }
      });
    });
  },

  /**
   * 打字機效果
   * @param {HTMLElement} element
   * @param {string} text
   * @param {number} speed - 每字元毫秒
   * @returns {Promise}
   */
  typewriter(element, text, speed = 50) {
    return new Promise(resolve => {
      element.textContent = '';
      let index = 0;

      const type = () => {
        if (index < text.length) {
          element.textContent += text.charAt(index);
          index++;
          setTimeout(type, speed);
        } else {
          resolve();
        }
      };

      type();
    });
  },

  /**
   * 數字計數動畫
   * @param {HTMLElement} element
   * @param {number} from
   * @param {number} to
   * @param {number} duration
   * @param {string} format - 格式化函數名 ('number', 'percent', 'currency')
   * @returns {Promise}
   */
  countUp(element, from, to, duration = 1000, format = 'number') {
    return new Promise(resolve => {
      const formatters = {
        number: v => Math.round(v).toLocaleString(),
        percent: v => `${v.toFixed(1)}%`,
        currency: v => `$${v.toFixed(2)}`
      };

      const formatter = formatters[format] || formatters.number;

      this.animate({
        from,
        to,
        duration,
        easing: 'easeOutQuad',
        onUpdate: value => {
          element.textContent = formatter(value);
        },
        onComplete: resolve
      });
    });
  },

  /**
   * 序列動畫
   * @param {HTMLElement[]} elements
   * @param {Function} animateFn
   * @param {number} stagger - 間隔時間
   * @returns {Promise}
   */
  stagger(elements, animateFn, stagger = 100) {
    return new Promise(resolve => {
      const promises = Array.from(elements).map((el, i) => {
        return new Promise(res => {
          setTimeout(() => {
            animateFn(el).then(res);
          }, i * stagger);
        });
      });

      Promise.all(promises).then(resolve);
    });
  }
};

// 導出模組
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Animation };
}

if (typeof window !== 'undefined') {
  window.Animation = Animation;
}
