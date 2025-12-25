/**
 * ModernReader - Share Module
 * 社群分享功能模組
 */

const Share = {
  /**
   * 分享內容
   * @param {object} data - 分享資料
   * @returns {Promise<boolean>}
   */
  async share(data = {}) {
    const {
      title = 'ModernReader Royale',
      text = '探索世界級閱讀體驗',
      url = window.location.href
    } = data;

    // 優先使用 Web Share API
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        this.trackShare('native');
        return true;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Native share failed:', err);
        }
        return false;
      }
    }

    // Fallback: 顯示分享選項
    return this.showShareOptions({ title, text, url });
  },

  /**
   * 顯示分享選項模態框
   * @param {object} data - 分享資料
   * @returns {Promise<boolean>}
   */
  showShareOptions(data) {
    return new Promise((resolve) => {
      const { title, text, url } = data;
      const encodedUrl = encodeURIComponent(url);
      const encodedText = encodeURIComponent(text);
      const encodedTitle = encodeURIComponent(title);

      const platforms = [
        {
          name: 'Facebook',
          icon: '📘',
          url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        },
        {
          name: 'Twitter',
          icon: '🐦',
          url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
        },
        {
          name: 'LinkedIn',
          icon: '💼',
          url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
        },
        {
          name: 'LINE',
          icon: '💬',
          url: `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`
        },
        {
          name: 'WhatsApp',
          icon: '📱',
          url: `https://wa.me/?text=${encodedText}%20${encodedUrl}`
        },
        {
          name: 'Telegram',
          icon: '✈️',
          url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`
        },
        {
          name: 'Email',
          icon: '📧',
          url: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`
        }
      ];

      const content = `
        <div class="share-options">
          <p style="margin-bottom: 16px; color: rgba(255,255,255,0.7);">選擇分享平台：</p>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px;">
            ${platforms.map(p => `
              <button class="share-btn" data-platform="${p.name}" data-url="${p.url}" 
                style="display: flex; flex-direction: column; align-items: center; gap: 8px;
                       padding: 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
                       border-radius: 12px; cursor: pointer; transition: all 0.2s;">
                <span style="font-size: 24px;">${p.icon}</span>
                <span style="font-size: 12px; color: rgba(255,255,255,0.8);">${p.name}</span>
              </button>
            `).join('')}
          </div>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid rgba(255,255,255,0.1);">
          <div style="display: flex; gap: 8px;">
            <input type="text" value="${url}" readonly 
              style="flex: 1; padding: 12px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);
                     border-radius: 8px; color: white; font-size: 14px;" id="shareUrlInput">
            <button class="btn btn--primary" id="copyShareUrl" style="white-space: nowrap;">複製連結</button>
          </div>
        </div>
      `;

      if (typeof Modal !== 'undefined') {
        const modal = Modal.create({
          title: '📤 分享',
          content,
          size: 'medium'
        });

        // 綁定分享按鈕
        setTimeout(() => {
          modal.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const platform = btn.dataset.platform;
              const shareUrl = btn.dataset.url;
              window.open(shareUrl, '_blank', 'width=600,height=400');
              this.trackShare(platform);
              Modal.close(modal.id);
              resolve(true);
            });

            // 懸停效果
            btn.addEventListener('mouseenter', () => {
              btn.style.background = 'rgba(132, 94, 247, 0.2)';
              btn.style.borderColor = 'rgba(132, 94, 247, 0.5)';
            });
            btn.addEventListener('mouseleave', () => {
              btn.style.background = 'rgba(255,255,255,0.05)';
              btn.style.borderColor = 'rgba(255,255,255,0.1)';
            });
          });

          // 綁定複製按鈕
          const copyBtn = modal.querySelector('#copyShareUrl');
          const urlInput = modal.querySelector('#shareUrlInput');
          if (copyBtn && urlInput) {
            copyBtn.addEventListener('click', async () => {
              await this.copyToClipboard(urlInput.value);
              copyBtn.textContent = '已複製！';
              setTimeout(() => {
                copyBtn.textContent = '複製連結';
              }, 2000);
            });
          }
        }, 100);

        Modal.open(modal.id);
      } else {
        // 沒有 Modal，直接複製到剪貼簿
        this.copyToClipboard(url);
        resolve(true);
      }
    });
  },

  /**
   * 複製到剪貼簿
   * @param {string} text - 要複製的文字
   * @returns {Promise<boolean>}
   */
  async copyToClipboard(text) {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      if (typeof Toast !== 'undefined') {
        Toast.success('已複製到剪貼簿');
      }
      
      this.trackShare('copy');
      return true;
    } catch (err) {
      console.error('Copy failed:', err);
      if (typeof Toast !== 'undefined') {
        Toast.error('複製失敗');
      }
      return false;
    }
  },

  /**
   * 分享當前閱讀進度
   * @param {object} bookInfo - 書籍資訊
   */
  async shareReading(bookInfo = {}) {
    const {
      title = '《未知書籍》',
      chapter = '',
      progress = 0
    } = bookInfo;

    const text = `我正在閱讀 ${title}${chapter ? ` - ${chapter}` : ''} (${progress}% 完成)`;
    const url = window.location.href;

    return this.share({
      title: `ModernReader - ${title}`,
      text,
      url
    });
  },

  /**
   * 分享書籤
   * @param {object} bookmark - 書籤資訊
   */
  async shareBookmark(bookmark) {
    const { bookTitle, chapter, note } = bookmark;
    const text = `📚 ${bookTitle}\n📖 ${chapter}${note ? `\n💭 "${note}"` : ''}`;
    
    return this.share({
      title: `ModernReader 書籤 - ${bookTitle}`,
      text,
      url: window.location.href
    });
  },

  /**
   * 追蹤分享事件
   * @param {string} platform - 分享平台
   */
  trackShare(platform) {
    if (typeof Analytics !== 'undefined') {
      Analytics.track('share', { platform });
      Analytics.featureUsed('share');
    }
  },

  /**
   * 生成分享圖片 (Canvas-based)
   * @param {object} options - 選項
   * @returns {Promise<Blob>}
   */
  async generateShareImage(options = {}) {
    const {
      width = 1200,
      height = 630,
      title = 'ModernReader Royale',
      subtitle = '世界級閱讀體驗',
      bgColor = '#0a0118'
    } = options;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 背景
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // 漸層裝飾
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(132, 94, 247, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 107, 157, 0.3)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 標題
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px "Playfair Display", serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, height / 2 - 20);

    // 副標題
    ctx.font = '32px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(subtitle, width / 2, height / 2 + 40);

    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/png');
    });
  }
};

// 導出模組
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Share };
}

// 瀏覽器環境下掛載到 window
if (typeof window !== 'undefined') {
  window.Share = Share;
}
