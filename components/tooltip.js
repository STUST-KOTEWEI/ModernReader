/**
 * ModernReader - Tooltip Component
 * 工具提示組件
 */

const Tooltip = {
  activeTooltip: null,
  hideTimeout: null,

  /**
   * 初始化工具提示
   */
  init() {
    // 添加樣式
    if (!document.getElementById('tooltip-styles')) {
      const style = document.createElement('style');
      style.id = 'tooltip-styles';
      style.textContent = `
        .tooltip {
          position: fixed;
          z-index: 10005;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.9);
          color: white;
          font-size: 13px;
          border-radius: 6px;
          max-width: 300px;
          pointer-events: none;
          opacity: 0;
          transform: translateY(4px);
          transition: opacity 0.2s, transform 0.2s;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .tooltip.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .tooltip-arrow {
          position: absolute;
          width: 8px;
          height: 8px;
          background: rgba(0, 0, 0, 0.9);
          transform: rotate(45deg);
        }

        .tooltip[data-placement="top"] .tooltip-arrow {
          bottom: -4px;
          left: 50%;
          margin-left: -4px;
        }

        .tooltip[data-placement="bottom"] .tooltip-arrow {
          top: -4px;
          left: 50%;
          margin-left: -4px;
        }

        .tooltip[data-placement="left"] .tooltip-arrow {
          right: -4px;
          top: 50%;
          margin-top: -4px;
        }

        .tooltip[data-placement="right"] .tooltip-arrow {
          left: -4px;
          top: 50%;
          margin-top: -4px;
        }

        [data-tooltip] {
          cursor: help;
        }
      `;
      document.head.appendChild(style);
    }

    // 綁定全局事件
    document.addEventListener('mouseover', this.handleMouseOver.bind(this));
    document.addEventListener('mouseout', this.handleMouseOut.bind(this));
    document.addEventListener('scroll', () => this.hide(), true);

    console.log('💬 Tooltip initialized');
  },

  /**
   * 處理滑鼠進入
   */
  handleMouseOver(e) {
    const target = e.target.closest('[data-tooltip]');
    if (!target) return;

    clearTimeout(this.hideTimeout);
    
    const content = target.dataset.tooltip;
    const placement = target.dataset.tooltipPlacement || 'top';
    const delay = parseInt(target.dataset.tooltipDelay) || 200;

    setTimeout(() => {
      if (target.matches(':hover')) {
        this.show(target, content, placement);
      }
    }, delay);
  },

  /**
   * 處理滑鼠離開
   */
  handleMouseOut(e) {
    const target = e.target.closest('[data-tooltip]');
    if (!target) return;

    this.hideTimeout = setTimeout(() => this.hide(), 100);
  },

  /**
   * 顯示工具提示
   * @param {HTMLElement} target - 目標元素
   * @param {string} content - 提示內容
   * @param {string} placement - 位置
   */
  show(target, content, placement = 'top') {
    this.hide();

    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.dataset.placement = placement;
    tooltip.innerHTML = `
      ${content}
      <div class="tooltip-arrow"></div>
    `;

    document.body.appendChild(tooltip);
    this.activeTooltip = tooltip;

    // 計算位置
    this.position(tooltip, target, placement);

    // 顯示動畫
    requestAnimationFrame(() => {
      tooltip.classList.add('visible');
    });
  },

  /**
   * 計算並設置位置
   */
  position(tooltip, target, placement) {
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const gap = 8;

    let top, left;

    switch (placement) {
      case 'top':
        top = targetRect.top - tooltipRect.height - gap;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + gap;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.left - tooltipRect.width - gap;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.right + gap;
        break;
    }

    // 確保不超出視窗
    const padding = 10;
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  },

  /**
   * 隱藏工具提示
   */
  hide() {
    if (this.activeTooltip) {
      this.activeTooltip.classList.remove('visible');
      setTimeout(() => {
        if (this.activeTooltip) {
          this.activeTooltip.remove();
          this.activeTooltip = null;
        }
      }, 200);
    }
  },

  /**
   * 程式化顯示工具提示
   * @param {HTMLElement} target
   * @param {string} content
   * @param {object} options
   */
  create(target, content, options = {}) {
    const { placement = 'top', duration = 0 } = options;
    
    this.show(target, content, placement);

    if (duration > 0) {
      setTimeout(() => this.hide(), duration);
    }
  }
};

// 初始化
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    Tooltip.init();
  });
}

// 導出模組
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Tooltip };
}

if (typeof window !== 'undefined') {
  window.Tooltip = Tooltip;
}
