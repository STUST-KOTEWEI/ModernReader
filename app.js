// 在 app.js 最上方加入 Google Sheet API URL
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbxn7bJVcz8pukPxtRMuHhYscGwrXdnQ06G3unFT1qMf0R6vbGscGv4sa2iWZoRAEZ9Q.../exec';

const themeButtons = document.querySelectorAll('[data-control="theme"] .chip');
const livePreview = document.getElementById('livePreview');
const fontSizeControl = document.getElementById('fontSize');
const letterSpacingControl = document.getElementById('letterSpacing');
const soundCards = document.querySelectorAll('.sound-card');
const previewProgress = document.querySelector('.preview-progress');
const progressBar = document.getElementById('progressBar');
const collectionTrack = document.getElementById('collectionTrack');
const scrollLeftBtn = document.getElementById('scrollLeft');
const scrollRightBtn = document.getElementById('scrollRight');
const saveRitualBtn = document.getElementById('saveRitual');
const shareExperienceBtn = document.getElementById('shareExperience');

const themeMeta = {
  lumina: {
    label: '晨光 Lumina',
    progress: 0.72,
    accent: 'linear-gradient(120deg, #ffd166, #ff9a8b)'
  },
  noir: {
    label: '暮夜 Noir',
    progress: 0.54,
    accent: 'linear-gradient(120deg, #8ec5fc, #e0c3fc)'
  },
  aurum: {
    label: '琥珀 Aurum',
    progress: 0.88,
    accent: 'linear-gradient(120deg, #f6d365, #fda085)'
  }
};

function updateTheme(theme) {
  if (!livePreview) return;
  livePreview.dataset.theme = theme;
  const meta = themeMeta[theme];
  if (!meta || !previewProgress || !progressBar) return;
  previewProgress.textContent = `當前節奏：${meta.label} ${(meta.progress * 100).toFixed(0)}%`;
  progressBar.style.width = `${meta.progress * 100}%`;
  progressBar.style.backgroundImage = meta.accent;
}

themeButtons.forEach((chip) => {
  chip.addEventListener('click', () => {
    themeButtons.forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    updateTheme(chip.dataset.value);
  });
});

function updateTypography() {
  const scale = parseFloat(fontSizeControl.value);
  const spacing = parseFloat(letterSpacingControl.value);
  if (!livePreview) return;
  livePreview.style.setProperty('--preview-scale', scale);
  livePreview.style.fontSize = `${scale}rem`;
  livePreview.style.letterSpacing = `${spacing}em`;
}

if (fontSizeControl) {
  fontSizeControl.addEventListener('input', updateTypography);
}

if (letterSpacingControl) {
  letterSpacingControl.addEventListener('input', updateTypography);
}

updateTypography();

soundCards.forEach((card) => {
  card.addEventListener('click', () => {
    soundCards.forEach((c) => c.classList.remove('active'));
    card.classList.add('active');
    const track = card.dataset.sound;
    if (previewProgress) {
      previewProgress.textContent = `當前節奏：${card.dataset.label}`;
    }
    if (livePreview) {
      livePreview.animate(
        [
          { transform: 'translateY(0px)' },
          { transform: 'translateY(-8px)' },
          { transform: 'translateY(0px)' }
        ],
        {
          duration: 800,
          easing: 'ease-out'
        }
      );
      livePreview.dataset.soundscape = track;
    }
    if (progressBar) {
      progressBar.animate(
        [
          { transform: 'scaleX(0.96)', opacity: 0.6 },
          { transform: 'scaleX(1)', opacity: 1 }
        ],
        {
          duration: 600,
          easing: 'ease-out'
        }
      );
    }
  });
});

function scrollCollection(offset) {
  if (!collectionTrack) return;
  collectionTrack.scrollBy({ left: offset, behavior: 'smooth' });
}

if (scrollLeftBtn && scrollRightBtn) {
  scrollLeftBtn.addEventListener('click', () => scrollCollection(-260));
  scrollRightBtn.addEventListener('click', () => scrollCollection(260));
}

function createPulse(button, message) {
  const pulse = document.createElement('span');
  pulse.className = 'pulse';
  pulse.textContent = message;
  button.appendChild(pulse);
  pulse.addEventListener('animationend', () => pulse.remove());
}

if (saveRitualBtn) {
  saveRitualBtn.addEventListener('click', () => {
    createPulse(saveRitualBtn, '已儲存');
    saveRitualBtn.classList.add('active');
    setTimeout(() => saveRitualBtn.classList.remove('active'), 600);
  });
}

if (shareExperienceBtn) {
  shareExperienceBtn.addEventListener('click', () => {
    createPulse(shareExperienceBtn, '邀請已送出');
    shareExperienceBtn.classList.add('active');
    setTimeout(() => shareExperienceBtn.classList.remove('active'), 600);
  });
}

function animateHeroCards() {
  const cards = document.querySelectorAll('.experience-card');
  if (!('IntersectionObserver' in window)) {
    cards.forEach((card) => card.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.35 }
  );

  cards.forEach((card) => observer.observe(card));
}

animateHeroCards();

window.addEventListener('load', () => {
  const initialTheme = document.querySelector('[data-control="theme"] .chip.active');
  if (initialTheme) updateTheme(initialTheme.dataset.value);
});

// ========================================
// Enhanced Interactions & Animations
// ========================================

// Parallax scroll effect for hero section
function initParallaxEffect() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const rate = scrolled * 0.5;
    hero.style.transform = `translate3d(0, ${rate}px, 0)`;
  });
}

// Smooth scroll for navigation links
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// Interactive card hover effects
function enhanceCardInteractions() {
  const cards = document.querySelectorAll('.experience-card, .sound-card');
  
  cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-8px) scale(1.02)';
      this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
    });
  });
}

// Add ripple effect to buttons
function addRippleEffect() {
  const buttons = document.querySelectorAll('button, .chip, .cta');
  
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.classList.add('ripple-effect');
      
      this.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
    });
  });
}

// Animate elements on scroll
function animateOnScroll() {
  const elements = document.querySelectorAll('.fade-in, section');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  });
  
  elements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
}

// Mock API integration layer
const ModernReaderAPI = {
  async analyzeText(text) {
    // Simulate API call to H.O.L.O. backend
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          sentiment: 'positive',
          emotion: 'joy',
          tone: 'inspirational',
          readability: 0.82
        });
      }, 1000);
    });
  },
  
  async generateSoundscape(mood) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          track: 'ambient_' + mood,
          duration: 180,
          frequency: '432Hz'
        });
      }, 800);
    });
  },
  
  async getSuggestions(context) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { title: '《星際旅人》', author: '劉慈欣', match: 0.92 },
          { title: '《三體》', author: '劉慈欣', match: 0.88 },
          { title: '《流浪地球》', author: '劉慈欣', match: 0.85 }
        ]);
      }, 1200);
    });
  }
};

// Initialize enhanced features
function initEnhancedFeatures() {
  initParallaxEffect();
  initSmoothScroll();
  enhanceCardInteractions();
  addRippleEffect();
  animateOnScroll();
  
  console.log('✨ ModernReader Enhanced Features Loaded');
  console.log('🔗 Connected to Project H.O.L.O. API Layer');
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEnhancedFeatures);
} else {
  initEnhancedFeatures();
}

// ===== ADVANCED INTERACTIVE FEATURES =====

// 1. Cursor Glow Effect
function initCursorGlow() {
    const cursor = document.createElement('div');
    cursor.className = 'cursor-glow';
    document.body.appendChild(cursor);
    
    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    function animate() {
        cursorX += (mouseX - cursorX) * 0.1;
        cursorY += (mouseY - cursorY) * 0.1;
        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';
        requestAnimationFrame(animate);
    }
    animate();
}

// 2. Scroll-Triggered Animations
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.feature-card, .book-card, section > *').forEach(el => {
        el.classList.add('animate-on-scroll');
        observer.observe(el);
    });
}

// 3. Counter Animation
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        
        if (element.dataset.format === 'percent') {
            element.textContent = current.toFixed(1) + '%';
        } else if (element.dataset.format === 'plus') {
            element.textContent = Math.floor(current) + '+';
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

function initCounterAnimations() {
    const counters = [
        { selector: '.stat-24', target: 24, format: '' },
        { selector: '.stat-180', target: 180, format: 'plus' },
        { selector: '.stat-99', target: 99.8, format: 'percent' }
    ];
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.animated) {
                const counter = counters.find(c => entry.target.matches(c.selector));
                if (counter) {
                    entry.target.dataset.format = counter.format;
                    animateCounter(entry.target, counter.target);
                    entry.target.dataset.animated = 'true';
                }
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(c => {
        const element = document.querySelector(c.selector);
        if (element) observer.observe(element);
    });
}

// 4. 3D Card Flip Effect
function init3DCardFlip() {
    document.querySelectorAll('.book-card, .feature-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'perspective(1000px) rotateY(5deg) translateZ(10px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'perspective(1000px) rotateY(0deg) translateZ(0px)';
        });
        
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        });
    });
}

// 5. Gradient Background Animation
function initGradientAnimation() {
    const hero = document.querySelector('.hero, header');
    if (!hero) return;
    
    let angle = 0;
    setInterval(() => {
        angle = (angle + 1) % 360;
        hero.style.background = `linear-gradient(${angle}deg, rgba(132, 94, 247, 0.3), rgba(5, 1, 15, 0.92))`;
    }, 50);
}

// 6. Floating Elements
function initFloatingElements() {
    document.querySelectorAll('.floating-card, .aurora').forEach((el, index) => {
        let direction = index % 2 === 0 ? 1 : -1;
        let position = 0;
        
        setInterval(() => {
            position += direction * 0.5;
            if (Math.abs(position) > 10) direction *= -1;
            el.style.transform = `translateY(${position}px)`;
        }, 50);
    });
}

// Update the initialization function
function initAllEnhancements() {
    initParallaxEffect();
    initSmoothScroll();
    enhanceCardInteractions();
    addRippleEffect();
    animateOnScroll();
    
    // New enhancements
    initCursorGlow();
    initScrollAnimations();
    initCounterAnimations();
    init3DCardFlip();
    initGradientAnimation();
    initFloatingElements();
    
    console.log('✨ All Enhanced Features Loaded');
    console.log('🚀 Connected to Project H.O.L.O. API Layer');
}

// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllEnhancements);
} else {
    initAllEnhancements();
}

// ===== MODAL & LLM INTEGRATION SYSTEM =====

// Modal Management
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        modal.classList.add('modal-enter');
        setTimeout(() => modal.classList.remove('modal-enter'), 300);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('modal-exit');
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('modal-exit');
            document.body.style.overflow = 'auto';
        }, 300);
    }
}

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
        closeModal(event.target.id);
    }
});

// LLM-Powered Chat System
const chatContext = [];
const LLM_CONFIG = {
    model: 'gpt-4',
    temperature: 0.7,
    systemPrompt: `你是 ModernReader Royale 的智能閱讀助手。你的專長包括：
    1. 推薦適合的書籍和閱讀材料
    2. 解答閱讀相關問題
    3. 提供個性化閱讀建議
    4. 協助用戶優化閱讀體驗
    請用友善、專業的語氣回答問題。`
};

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addChatMessage(message, 'user');
    chatContext.push({ role: 'user', content: message });
    input.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Call LLM API (placeholder - needs real API)
        const response = await callLLM(message);
        removeTypingIndicator();
        addChatMessage(response, 'bot');
        chatContext.push({ role: 'assistant', content: response });
    } catch (error) {
        removeTypingIndicator();
        addChatMessage('抱歉，我現在無法回應。請稍後再試。', 'bot');
        console.error('LLM Error:', error);
    }
}

async function callLLM(userMessage) {
    // Simulated LLM response with intelligent book recommendations
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const responses = {
        '推薦': '根據您的閱讀偏好，我推薦《星際旅人》和《時間熱鍵師》。這兩本書都結合了科幻元素和深刻的人性探討。',
        '閱讀': 'ModernReader 提供沉浸式閱讀體驗，包括自適應字體、情境音效和 AI 驅動的閱讀建議。您想了解哪個功能的細節？',
        '主題': '我們有三種精心設計的主題：晨光 LUMINA（溫暖明亮）、暮夜 NOIR（深邃優雅）和琥珀 AURUM（復古奢華）。您可以在閱讀時隨時切換。',
        '功能': 'ModernReader Royale 的核心功能包括：\n• AI 智能閱讀調整\n• 光譜劇院模式\n• 禪境專注引擎\n• 星級品味策展\n• 私人閱讀管家服務',
        '預約': '太好了！請點擊上方的「預約專屬導覽」按鈕，我們的團隊會為您安排一對一的產品介紹。',
        'hello': 'Hello! I can help you in both Chinese and English. How can I assist you today?',
        'hi': '您好！我是 ModernReader 智能助手。有什麼可以幫助您的嗎？'
    };
    
    // Simple keyword matching (replace with real LLM API)
    for (const [keyword, response] of Object.entries(responses)) {
        if (userMessage.toLowerCase().includes(keyword)) {
            return response;
        }
    }
    
    return '我理解您的問題。ModernReader Royale 致力於提供最優質的閱讀體驗。您想了解我們的哪些功能呢？您可以問我關於書籍推薦、閱讀主題、或預約導覽等問題。';
}

function addChatMessage(message, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    messageDiv.innerHTML = `<p>${message.replace(/\n/g, '<br>')}</p>`;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    const indicator = document.createElement('div');
    indicator.className = 'chat-message bot typing-indicator';
    indicator.id = 'typing';
    indicator.innerHTML = '<p><span></span><span></span><span></span></p>';
    messagesContainer.appendChild(indicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typing');
    if (indicator) indicator.remove();
}

function handleChatKey(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// Booking Form Handler
function handleBooking(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const booking = {
        name: formData.get('name'),
        email: formData.get('email'),
        date: formData.get('date'),
        time: formData.get('time'),
        message: formData.get('message')
    };
    
    console.log('📌 Booking submitted:', booking);
    
    // Show success animation
    showNotification('success', `預約成功！\n\n您的專屬導覽已安排在：\n${booking.date} ${booking.time}\n\n我們將通過 Email 發送確認信給 ${booking.email}`);
    
    closeModal('bookingModal');
    event.target.reset();
    
    return false;
}

// Demo Mode
function startDemo() {
    closeModal('demoModal');
    
    showNotification('demo', '🌟 體驗模式已啟動\n\n正在加載智能功能...');
    
    setTimeout(() => {
        showNotification('success', '🎉 歡迎進入 ModernReader 沉浸式體驗！\n\n所有增強功能已啟用：\n• 智能閱讀調整\n• 動態主題切換\n• 沉浸式音效\n\n現在您可以開始探索了！');
    }, 2000);
}

// Notification System
function showNotification(type, message) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `<p>${message.replace(/\n/g, '<br>')}</p>`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'notificationExit 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, type === 'demo' ? 1800 : 4000);
}

// Initialize Button Handlers
function initButtonHandlers() {
  const buttons = document.querySelectorAll('button, .btn, .cta');    
    buttons.forEach(button => {
        const text = button.textContent.trim();
        
        if (text.includes('預約') || text.includes('導覽') || text.includes('安排') || text.includes('導讀')) {
            button.onclick = (e) => {
                e.preventDefault();
                openModal('bookingModal');
            };
        }
        
        if (text.includes('體驗') || text.includes('啟用')) {
            button.onclick = (e) => {
                e.preventDefault();
                openModal('demoModal');
            };
        }
    });
}

// Keyboard Shortcuts
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        const openModals = document.querySelectorAll('.modal[style*="display: flex"]');
        openModals.forEach(modal => closeModal(modal.id));
    }
    
    if (event.key === 'c' && event.ctrlKey) {
        event.preventDefault();
        openModal('chatModal');
    }
});

// Update initialization
const originalInit = initAllEnhancements;
initAllEnhancements = function() {
    originalInit();
    initButtonHandlers();
    initThemeToggle();
    initPreferencePersistence();
    console.log('💬 LLM Chat System Ready');
    console.log('🎯 Modal System Initialized');
};

console.log('🚀 Advanced Features Loaded!');

// ===== THEME TOGGLE & PERSISTENCE =====

/**
 * 初始化主題切換功能
 */
function initThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    
    // 檢查已保存的主題偏好
    const savedTheme = UserPreferences ? UserPreferences.get().darkMode : null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // 如果用戶之前選擇了淺色模式，則應用它
    if (savedTheme === false) {
        document.body.classList.add('light-mode');
        toggle.querySelector('.theme-icon').textContent = '☀️';
    }
    
    toggle.addEventListener('click', () => {
        const isLightMode = document.body.classList.toggle('light-mode');
        const icon = toggle.querySelector('.theme-icon');
        
        // 更新圖標
        icon.textContent = isLightMode ? '☀️' : '🌙';
        
        // 添加動畫效果
        icon.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            icon.style.transform = 'rotate(0deg)';
        }, 300);
        
        // 保存偏好設置
        if (typeof UserPreferences !== 'undefined') {
            UserPreferences.save({ darkMode: !isLightMode });
        }
        
        // 記錄分析事件
        if (typeof Analytics !== 'undefined') {
            Analytics.featureUsed('theme_toggle');
            Analytics.track('theme_change', { mode: isLightMode ? 'light' : 'dark' });
        }
        
        // 顯示 Toast 通知
        if (typeof Toast !== 'undefined') {
            Toast.info(isLightMode ? '已切換至淺色模式' : '已切換至深色模式', { duration: 2000 });
        }
    });
}

/**
 * 初始化用戶偏好設置持久化
 */
function initPreferencePersistence() {
    if (typeof UserPreferences === 'undefined') return;
    
    const prefs = UserPreferences.get();
    
    // 應用已保存的主題設置
    if (prefs.theme && livePreview) {
        updateTheme(prefs.theme);
        const activeChip = document.querySelector(`[data-value="${prefs.theme}"]`);
        if (activeChip) {
            document.querySelectorAll('[data-control="theme"] .chip').forEach(c => c.classList.remove('active'));
            activeChip.classList.add('active');
        }
    }
    
    // 應用已保存的字體大小
    if (prefs.fontSize && fontSizeControl) {
        fontSizeControl.value = prefs.fontSize;
    }
    
    // 應用已保存的字距
    if (prefs.letterSpacing && letterSpacingControl) {
        letterSpacingControl.value = prefs.letterSpacing;
    }
    
    // 應用已保存的音景設置
    if (prefs.soundscape) {
        const soundCard = document.querySelector(`[data-sound="${prefs.soundscape}"]`);
        if (soundCard) {
            soundCards.forEach(c => c.classList.remove('active'));
            soundCard.classList.add('active');
        }
    }
    
    // 監聽設置變更並保存
    if (fontSizeControl) {
        fontSizeControl.addEventListener('change', () => {
            UserPreferences.save({ fontSize: parseFloat(fontSizeControl.value) });
        });
    }
    
    if (letterSpacingControl) {
        letterSpacingControl.addEventListener('change', () => {
            UserPreferences.save({ letterSpacing: parseFloat(letterSpacingControl.value) });
        });
    }
    
    // 監聽主題變更
    themeButtons.forEach(chip => {
        chip.addEventListener('click', () => {
            UserPreferences.save({ theme: chip.dataset.value });
        });
    });
    
    // 監聽音景變更
    soundCards.forEach(card => {
        card.addEventListener('click', () => {
            UserPreferences.save({ soundscape: card.dataset.sound });
        });
    });
    
    console.log('💾 User preferences loaded and persistence enabled');
}

// ===== BOOKMARK FUNCTIONALITY =====

/**
 * 添加書籤
 * @param {string} bookTitle - 書籍標題
 * @param {string} chapter - 章節
 * @param {string} note - 備註
 */
function addBookmark(bookTitle, chapter, note = '') {
    if (typeof Bookmarks === 'undefined') {
        console.warn('Bookmarks module not loaded');
        return;
    }
    
    const bookId = bookTitle.replace(/\s+/g, '_').toLowerCase();
    Bookmarks.add(bookId, {
        chapter,
        note,
        position: window.scrollY
    });
    
    if (typeof Toast !== 'undefined') {
        Toast.success(`已添加書籤：${chapter}`, { duration: 2500 });
    }
    
    if (typeof Analytics !== 'undefined') {
        Analytics.featureUsed('bookmark_add');
    }
}

/**
 * 獲取書籍的所有書籤
 * @param {string} bookTitle - 書籍標題
 * @returns {array} 書籤列表
 */
function getBookmarks(bookTitle) {
    if (typeof Bookmarks === 'undefined') return [];
    
    const bookId = bookTitle.replace(/\s+/g, '_').toLowerCase();
    return Bookmarks.getByBook(bookId);
}

// ===== READING PROGRESS TRACKING =====

/**
 * 自動保存閱讀進度
 */
function initAutoSaveProgress() {
    if (typeof ReadingProgress === 'undefined') return;
    
    // 從頁面元素或 URL 參數獲取當前書籍名稱
    const bookTitleElement = document.querySelector('#livePreview .preview-header span:first-child');
    const currentBook = bookTitleElement ? bookTitleElement.textContent.replace(/[《》]/g, '') : 'default';
    let lastSaveTime = Date.now();
    
    // 監聽滾動事件
    window.addEventListener('scroll', () => {
        const now = Date.now();
        if (now - lastSaveTime < 5000) return; // 每 5 秒最多保存一次
        
        const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        ReadingProgress.save(currentBook, scrollPercent);
        lastSaveTime = now;
    });
    
    console.log('📖 Auto-save reading progress enabled');
}

// 在頁面完全加載後初始化自動保存
window.addEventListener('load', () => {
    setTimeout(initAutoSaveProgress, 1000);
});


