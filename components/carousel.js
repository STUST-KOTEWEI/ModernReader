/**
 * ModernReader - Carousel Component
 * 輪播組件
 */

const Carousel = {
  instances: new Map(),

  /**
   * 初始化輪播樣式
   */
  init() {
    if (!document.getElementById('carousel-styles')) {
      const style = document.createElement('style');
      style.id = 'carousel-styles';
      style.textContent = `
        .carousel {
          position: relative;
          overflow: hidden;
          border-radius: 16px;
        }

        .carousel-track {
          display: flex;
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .carousel-slide {
          flex: 0 0 100%;
          width: 100%;
        }

        .carousel-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 44px;
          height: 44px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          backdrop-filter: blur(10px);
          z-index: 10;
        }

        .carousel-nav:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .carousel-nav:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .carousel-nav-prev {
          left: 16px;
        }

        .carousel-nav-next {
          right: 16px;
        }

        .carousel-dots {
          display: flex;
          justify-content: center;
          gap: 8px;
          padding: 16px;
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
        }

        .carousel-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .carousel-dot.active {
          background: #845ef7;
          width: 24px;
          border-radius: 4px;
        }

        .carousel-dot:hover {
          background: rgba(255, 255, 255, 0.5);
        }

        .carousel-dot.active:hover {
          background: #845ef7;
        }

        /* 淡入淡出效果 */
        .carousel.fade .carousel-track {
          position: relative;
        }

        .carousel.fade .carousel-slide {
          position: absolute;
          top: 0;
          left: 0;
          opacity: 0;
          transition: opacity 0.5s;
        }

        .carousel.fade .carousel-slide.active {
          position: relative;
          opacity: 1;
        }
      `;
      document.head.appendChild(style);
    }

    console.log('🎠 Carousel initialized');
  },

  /**
   * 創建輪播
   * @param {HTMLElement} container - 容器元素
   * @param {object} options - 配置選項
   * @returns {object} 輪播控制器
   */
  create(container, options = {}) {
    const {
      slides = [],
      autoPlay = false,
      autoPlayInterval = 5000,
      loop = true,
      showNav = true,
      showDots = true,
      effect = 'slide', // 'slide' | 'fade'
      onChange
    } = options;

    const id = `carousel-${Date.now()}`;
    let currentIndex = 0;
    let autoPlayTimer = null;

    container.classList.add('carousel');
    if (effect === 'fade') container.classList.add('fade');

    // 創建軌道
    const track = document.createElement('div');
    track.className = 'carousel-track';

    // 創建幻燈片
    slides.forEach((slide, index) => {
      const slideEl = document.createElement('div');
      slideEl.className = 'carousel-slide';
      if (index === 0) slideEl.classList.add('active');
      
      if (typeof slide === 'string') {
        slideEl.innerHTML = slide;
      } else if (slide instanceof HTMLElement) {
        slideEl.appendChild(slide);
      } else if (slide.html) {
        slideEl.innerHTML = slide.html;
      } else if (slide.image) {
        slideEl.innerHTML = `<img src="${slide.image}" alt="${slide.alt || ''}" style="width: 100%; height: 100%; object-fit: cover;">`;
      }

      track.appendChild(slideEl);
    });

    container.appendChild(track);

    // 創建導航按鈕
    if (showNav && slides.length > 1) {
      const prevBtn = document.createElement('button');
      prevBtn.className = 'carousel-nav carousel-nav-prev';
      prevBtn.innerHTML = '◀';
      prevBtn.addEventListener('click', () => prev());

      const nextBtn = document.createElement('button');
      nextBtn.className = 'carousel-nav carousel-nav-next';
      nextBtn.innerHTML = '▶';
      nextBtn.addEventListener('click', () => next());

      container.appendChild(prevBtn);
      container.appendChild(nextBtn);
    }

    // 創建指示點
    let dots = [];
    if (showDots && slides.length > 1) {
      const dotsContainer = document.createElement('div');
      dotsContainer.className = 'carousel-dots';

      slides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot';
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goTo(index));
        dotsContainer.appendChild(dot);
        dots.push(dot);
      });

      container.appendChild(dotsContainer);
    }

    // 更新顯示
    const updateDisplay = () => {
      if (effect === 'slide') {
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
      } else {
        Array.from(track.children).forEach((slide, index) => {
          slide.classList.toggle('active', index === currentIndex);
        });
      }

      dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentIndex);
      });

      if (onChange) onChange(currentIndex);
    };

    // 導航方法
    const goTo = (index) => {
      if (loop) {
        currentIndex = (index + slides.length) % slides.length;
      } else {
        currentIndex = Math.max(0, Math.min(index, slides.length - 1));
      }
      updateDisplay();
      resetAutoPlay();
    };

    const next = () => goTo(currentIndex + 1);
    const prev = () => goTo(currentIndex - 1);

    // 自動播放
    const startAutoPlay = () => {
      if (autoPlay && slides.length > 1) {
        autoPlayTimer = setInterval(next, autoPlayInterval);
      }
    };

    const stopAutoPlay = () => {
      if (autoPlayTimer) {
        clearInterval(autoPlayTimer);
        autoPlayTimer = null;
      }
    };

    const resetAutoPlay = () => {
      stopAutoPlay();
      startAutoPlay();
    };

    // 滑鼠懸停暫停
    container.addEventListener('mouseenter', stopAutoPlay);
    container.addEventListener('mouseleave', startAutoPlay);

    // 觸控支援
    let touchStartX = 0;
    container.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;

      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          next();
        } else {
          prev();
        }
      }
    }, { passive: true });

    // 啟動自動播放
    startAutoPlay();

    // 儲存實例
    const instance = {
      goTo,
      next,
      prev,
      getCurrentIndex: () => currentIndex,
      destroy: () => {
        stopAutoPlay();
        this.instances.delete(id);
      }
    };

    this.instances.set(id, instance);
    return instance;
  }
};

// 初始化
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    Carousel.init();
  });
}

// 導出模組
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Carousel };
}

if (typeof window !== 'undefined') {
  window.Carousel = Carousel;
}
