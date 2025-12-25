/**
 * ModernReader - Audio Engine
 * 音效播放引擎
 */

const Audio = {
  sounds: new Map(),
  enabled: true,
  volume: 0.5,
  currentBGM: null,

  /**
   * 初始化音效系統
   */
  init() {
    // 從設定載入音效狀態
    if (typeof UserPreferences !== 'undefined') {
      const prefs = UserPreferences.get();
      this.enabled = prefs.soundEnabled !== false;
      this.volume = prefs.soundVolume || 0.5;
    }
    console.log('🔊 Audio engine initialized');
  },

  /**
   * 預載音效
   * @param {string} name - 音效名稱
   * @param {string} src - 音效來源 URL
   * @returns {Promise}
   */
  preload(name, src) {
    return new Promise((resolve, reject) => {
      const audio = new window.Audio();
      audio.src = src;
      audio.preload = 'auto';
      
      audio.addEventListener('canplaythrough', () => {
        this.sounds.set(name, audio);
        resolve(audio);
      });
      
      audio.addEventListener('error', (e) => {
        console.warn(`Failed to load audio: ${name}`, e);
        reject(e);
      });
    });
  },

  /**
   * 播放音效
   * @param {string} name - 音效名稱
   * @param {object} options - 播放選項
   */
  play(name, options = {}) {
    if (!this.enabled) return;

    const {
      volume = this.volume,
      loop = false,
      onEnd = null
    } = options;

    const audio = this.sounds.get(name);
    if (!audio) {
      console.warn(`Audio not found: ${name}`);
      return;
    }

    const clone = audio.cloneNode();
    clone.volume = volume;
    clone.loop = loop;

    if (onEnd) {
      clone.addEventListener('ended', onEnd);
    }

    clone.play().catch(e => {
      console.warn('Audio play failed:', e);
    });

    return clone;
  },

  /**
   * 播放背景音樂
   * @param {string} name - 音樂名稱
   * @param {object} options - 播放選項
   */
  playBGM(name, options = {}) {
    this.stopBGM();
    this.currentBGM = this.play(name, { ...options, loop: true });
    return this.currentBGM;
  },

  /**
   * 停止背景音樂
   */
  stopBGM() {
    if (this.currentBGM) {
      this.currentBGM.pause();
      this.currentBGM.currentTime = 0;
      this.currentBGM = null;
    }
  },

  /**
   * 播放 UI 音效
   * @param {string} type - 音效類型
   */
  playUI(type) {
    const uiSounds = {
      click: 'ui-click',
      hover: 'ui-hover',
      success: 'ui-success',
      error: 'ui-error',
      notification: 'ui-notification',
      pageFlip: 'page-flip'
    };

    const soundName = uiSounds[type];
    if (soundName && this.sounds.has(soundName)) {
      this.play(soundName, { volume: this.volume * 0.7 });
    }
  },

  /**
   * 設定音量
   * @param {number} value - 音量 (0-1)
   */
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.currentBGM) {
      this.currentBGM.volume = this.volume;
    }
    
    if (typeof UserPreferences !== 'undefined') {
      UserPreferences.save({ soundVolume: this.volume });
    }
  },

  /**
   * 切換音效開關
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopBGM();
    }
    
    if (typeof UserPreferences !== 'undefined') {
      UserPreferences.save({ soundEnabled: enabled });
    }
  },

  /**
   * 淡入音效
   * @param {HTMLAudioElement} audio
   * @param {number} duration - 淡入時長 (ms)
   */
  fadeIn(audio, duration = 1000) {
    if (!audio) return;
    
    audio.volume = 0;
    audio.play();
    
    const targetVolume = this.volume;
    const step = targetVolume / (duration / 50);
    
    const interval = setInterval(() => {
      if (audio.volume < targetVolume) {
        audio.volume = Math.min(audio.volume + step, targetVolume);
      } else {
        clearInterval(interval);
      }
    }, 50);
  },

  /**
   * 淡出音效
   * @param {HTMLAudioElement} audio
   * @param {number} duration - 淡出時長 (ms)
   */
  fadeOut(audio, duration = 1000) {
    if (!audio) return;
    
    const step = audio.volume / (duration / 50);
    
    const interval = setInterval(() => {
      if (audio.volume > step) {
        audio.volume -= step;
      } else {
        audio.pause();
        audio.volume = 0;
        clearInterval(interval);
      }
    }, 50);
  },

  /**
   * 生成音調 (用於無音效檔時)
   * @param {number} frequency - 頻率
   * @param {number} duration - 持續時間 (ms)
   * @param {string} type - 波形類型
   */
  beep(frequency = 440, duration = 100, type = 'sine') {
    if (!this.enabled) return;
    
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      gainNode.gain.value = this.volume * 0.3;
      
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, duration);
    } catch (e) {
      console.warn('Beep failed:', e);
    }
  }
};

// 初始化
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    Audio.init();
  });
}

// 導出模組
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Audio };
}

if (typeof window !== 'undefined') {
  window.Audio = Audio;
}
