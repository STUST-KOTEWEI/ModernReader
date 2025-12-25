/**
 * ModernReader - Dropdown Component
 * 下拉選單組件
 */

const Dropdown = {
  activeDropdown: null,

  /**
   * 初始化下拉選單
   */
  init() {
    // 添加樣式
    if (!document.getElementById('dropdown-styles')) {
      const style = document.createElement('style');
      style.id = 'dropdown-styles';
      style.textContent = `
        .dropdown {
          position: relative;
          display: inline-block;
        }

        .dropdown-trigger {
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .dropdown-trigger::after {
          content: '';
          border: 4px solid transparent;
          border-top-color: currentColor;
          margin-left: 4px;
          transition: transform 0.2s;
        }

        .dropdown.open .dropdown-trigger::after {
          transform: rotate(180deg);
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          z-index: 1000;
          min-width: 180px;
          padding: 8px 0;
          margin-top: 4px;
          background: rgba(20, 10, 40, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(20px);
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.2s ease;
        }

        .dropdown.open .dropdown-menu {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .dropdown-menu.right {
          left: auto;
          right: 0;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          color: rgba(255, 255, 255, 0.85);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .dropdown-item:hover {
          background: rgba(132, 94, 247, 0.2);
          color: white;
        }

        .dropdown-item.active {
          background: rgba(132, 94, 247, 0.3);
          color: #845ef7;
        }

        .dropdown-item.disabled {
          opacity: 0.5;
          pointer-events: none;
        }

        .dropdown-item-icon {
          width: 18px;
          height: 18px;
          opacity: 0.7;
        }

        .dropdown-divider {
          height: 1px;
          margin: 8px 0;
          background: rgba(255, 255, 255, 0.1);
        }

        .dropdown-header {
          padding: 8px 16px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: rgba(255, 255, 255, 0.5);
        }
      `;
      document.head.appendChild(style);
    }

    // 點擊外部關閉
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown')) {
        this.closeAll();
      }
    });

    // 按 Escape 關閉
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAll();
      }
    });

    console.log('📋 Dropdown initialized');
  },

  /**
   * 創建下拉選單
   * @param {HTMLElement} container - 容器元素
   * @param {object} options - 配置選項
   * @returns {object} 下拉選單控制器
   */
  create(container, options = {}) {
    const {
      trigger,
      items = [],
      align = 'left',
      onSelect
    } = options;

    container.classList.add('dropdown');

    // 創建觸發器
    const triggerEl = document.createElement('div');
    triggerEl.className = 'dropdown-trigger';
    triggerEl.innerHTML = trigger || 'Select';

    // 創建選單
    const menu = document.createElement('div');
    menu.className = `dropdown-menu ${align === 'right' ? 'right' : ''}`;

    // 渲染選項
    const renderItems = (itemList) => {
      menu.innerHTML = '';
      
      itemList.forEach(item => {
        if (item.type === 'divider') {
          const divider = document.createElement('div');
          divider.className = 'dropdown-divider';
          menu.appendChild(divider);
        } else if (item.type === 'header') {
          const header = document.createElement('div');
          header.className = 'dropdown-header';
          header.textContent = item.label;
          menu.appendChild(header);
        } else {
          const itemEl = document.createElement('div');
          itemEl.className = 'dropdown-item';
          if (item.active) itemEl.classList.add('active');
          if (item.disabled) itemEl.classList.add('disabled');

          if (item.icon) {
            itemEl.innerHTML = `<span class="dropdown-item-icon">${item.icon}</span>`;
          }
          
          const label = document.createElement('span');
          label.textContent = item.label;
          itemEl.appendChild(label);

          itemEl.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!item.disabled) {
              if (onSelect) onSelect(item);
              if (item.onClick) item.onClick(item);
              this.close(container);
            }
          });

          menu.appendChild(itemEl);
        }
      });
    };

    renderItems(items);

    // 觸發器點擊事件
    triggerEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle(container);
    });

    container.appendChild(triggerEl);
    container.appendChild(menu);

    return {
      open: () => this.open(container),
      close: () => this.close(container),
      toggle: () => this.toggle(container),
      setItems: (newItems) => renderItems(newItems),
      setTrigger: (html) => { triggerEl.innerHTML = html; }
    };
  },

  /**
   * 開啟下拉選單
   * @param {HTMLElement} dropdown
   */
  open(dropdown) {
    this.closeAll();
    dropdown.classList.add('open');
    this.activeDropdown = dropdown;
  },

  /**
   * 關閉下拉選單
   * @param {HTMLElement} dropdown
   */
  close(dropdown) {
    dropdown.classList.remove('open');
    if (this.activeDropdown === dropdown) {
      this.activeDropdown = null;
    }
  },

  /**
   * 切換下拉選單
   * @param {HTMLElement} dropdown
   */
  toggle(dropdown) {
    if (dropdown.classList.contains('open')) {
      this.close(dropdown);
    } else {
      this.open(dropdown);
    }
  },

  /**
   * 關閉所有下拉選單
   */
  closeAll() {
    document.querySelectorAll('.dropdown.open').forEach(d => {
      d.classList.remove('open');
    });
    this.activeDropdown = null;
  }
};

// 初始化
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    Dropdown.init();
  });
}

// 導出模組
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Dropdown };
}

if (typeof window !== 'undefined') {
  window.Dropdown = Dropdown;
}
