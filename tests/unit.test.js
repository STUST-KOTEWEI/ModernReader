/**
 * ModernReader - Unit Tests
 * 單元測試
 */

// 簡單的測試框架
const TestRunner = {
  tests: [],
  passed: 0,
  failed: 0,

  describe(name, fn) {
    console.group(`📦 ${name}`);
    fn();
    console.groupEnd();
  },

  it(description, fn) {
    try {
      fn();
      this.passed++;
      console.log(`  ✅ ${description}`);
    } catch (error) {
      this.failed++;
      console.error(`  ❌ ${description}`);
      console.error(`     ${error.message}`);
    }
  },

  expect(actual) {
    return {
      toBe(expected) {
        if (actual !== expected) {
          throw new Error(`Expected ${expected}, but got ${actual}`);
        }
      },
      toEqual(expected) {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
        }
      },
      toBeTruthy() {
        if (!actual) {
          throw new Error(`Expected truthy value, but got ${actual}`);
        }
      },
      toBeFalsy() {
        if (actual) {
          throw new Error(`Expected falsy value, but got ${actual}`);
        }
      },
      toContain(item) {
        if (!actual.includes(item)) {
          throw new Error(`Expected ${actual} to contain ${item}`);
        }
      },
      toBeInstanceOf(type) {
        if (!(actual instanceof type)) {
          throw new Error(`Expected instance of ${type.name}`);
        }
      },
      toThrow() {
        let threw = false;
        try {
          actual();
        } catch {
          threw = true;
        }
        if (!threw) {
          throw new Error('Expected function to throw');
        }
      }
    };
  },

  summary() {
    console.log('\n📊 Test Summary:');
    console.log(`   Passed: ${this.passed}`);
    console.log(`   Failed: ${this.failed}`);
    console.log(`   Total: ${this.passed + this.failed}`);
    return this.failed === 0;
  }
};

const { describe, it, expect } = TestRunner;

// ============ Storage Tests ============
describe('Storage Module', () => {
  it('should save and retrieve data', () => {
    if (typeof Storage !== 'undefined') {
      Storage.set('test_key', { foo: 'bar' });
      const result = Storage.get('test_key');
      expect(result.foo).toBe('bar');
      Storage.remove('test_key');
    }
  });

  it('should return default value for missing key', () => {
    if (typeof Storage !== 'undefined') {
      const result = Storage.get('nonexistent_key', 'default');
      expect(result).toBe('default');
    }
  });
});

// ============ UserPreferences Tests ============
describe('UserPreferences Module', () => {
  it('should have default preferences', () => {
    if (typeof UserPreferences !== 'undefined') {
      const prefs = UserPreferences.get();
      expect(prefs).toBeTruthy();
      expect(typeof prefs.theme).toBe('string');
    }
  });

  it('should save preferences', () => {
    if (typeof UserPreferences !== 'undefined') {
      UserPreferences.save({ theme: 'noir' });
      const prefs = UserPreferences.get();
      expect(prefs.theme).toBe('noir');
      // Reset
      UserPreferences.save({ theme: 'lumina' });
    }
  });
});

// ============ ReadingProgress Tests ============
describe('ReadingProgress Module', () => {
  it('should save reading progress', () => {
    if (typeof ReadingProgress !== 'undefined') {
      ReadingProgress.save('test_book', 50, 'Chapter 1');
      const progress = ReadingProgress.get('test_book');
      expect(progress.progress).toBe(50);
      expect(progress.chapter).toBe('Chapter 1');
    }
  });

  it('should return null for unread book', () => {
    if (typeof ReadingProgress !== 'undefined') {
      const progress = ReadingProgress.get('unread_book_xyz');
      expect(progress).toBe(null);
    }
  });
});

// ============ Bookmarks Tests ============
describe('Bookmarks Module', () => {
  it('should add bookmark', () => {
    if (typeof Bookmarks !== 'undefined') {
      Bookmarks.add('test_book', { chapter: 'Ch1', note: 'Test note' });
      const bookmarks = Bookmarks.getByBook('test_book');
      expect(bookmarks.length).toBe(1);
      expect(bookmarks[0].chapter).toBe('Ch1');
    }
  });

  it('should return empty array for book without bookmarks', () => {
    if (typeof Bookmarks !== 'undefined') {
      const bookmarks = Bookmarks.getByBook('no_bookmarks_book');
      expect(bookmarks).toEqual([]);
    }
  });
});

// ============ Analytics Tests ============
describe('Analytics Module', () => {
  it('should track events', () => {
    if (typeof Analytics !== 'undefined') {
      const initialCount = Analytics.events.length;
      Analytics.track('test_event', { data: 'test' });
      expect(Analytics.events.length).toBe(initialCount + 1);
    }
  });

  it('should get session stats', () => {
    if (typeof Analytics !== 'undefined') {
      const stats = Analytics.getSessionStats();
      expect(typeof stats.totalEvents).toBe('number');
    }
  });
});

// ============ i18n Tests ============
describe('i18n Module', () => {
  it('should return translation for valid key', () => {
    if (typeof i18n !== 'undefined') {
      const text = i18n.t('common.loading');
      expect(text).toBeTruthy();
      expect(text).not.toBe('common.loading');
    }
  });

  it('should return key for invalid translation', () => {
    if (typeof i18n !== 'undefined') {
      const text = i18n.t('invalid.key.path');
      expect(text).toBe('invalid.key.path');
    }
  });

  it('should switch locale', () => {
    if (typeof i18n !== 'undefined') {
      const original = i18n.getLocale();
      i18n.setLocale('en');
      expect(i18n.getLocale()).toBe('en');
      i18n.setLocale(original);
    }
  });
});

// ============ Settings Tests ============
describe('Settings Module', () => {
  it('should have app configuration', () => {
    if (typeof Settings !== 'undefined') {
      expect(Settings.app).toBeTruthy();
      expect(Settings.app.name).toBe('ModernReader Royale');
    }
  });

  it('should have theme configurations', () => {
    if (typeof Settings !== 'undefined') {
      expect(Settings.themes).toBeTruthy();
      expect(Settings.themes.lumina).toBeTruthy();
      expect(Settings.themes.noir).toBeTruthy();
    }
  });
});

// ============ Toast Tests ============
describe('Toast Module', () => {
  it('should create toast container on init', () => {
    if (typeof Toast !== 'undefined') {
      Toast.init();
      const container = document.getElementById('toast-container');
      expect(container).toBeTruthy();
    }
  });
});

// ============ Modal Tests ============
describe('Modal Module', () => {
  it('should track active modals', () => {
    if (typeof Modal !== 'undefined') {
      expect(Array.isArray(Modal.activeModals)).toBe(true);
    }
  });

  it('should create dynamic modal', () => {
    if (typeof Modal !== 'undefined') {
      const modal = Modal.create({
        title: 'Test Modal',
        content: 'Test content'
      });
      expect(modal).toBeTruthy();
      expect(modal.id).toBeTruthy();
      modal.remove();
    }
  });
});

// ============ Keyboard Tests ============
describe('Keyboard Module', () => {
  it('should register shortcuts', () => {
    if (typeof Keyboard !== 'undefined') {
      Keyboard.register('ctrl+test', () => {}, 'Test shortcut');
      const all = Keyboard.getAll();
      const found = all.find(s => s.combo === 'ctrl+test');
      expect(found).toBeTruthy();
      Keyboard.unregister('ctrl+test');
    }
  });

  it('should enable/disable shortcuts', () => {
    if (typeof Keyboard !== 'undefined') {
      Keyboard.setEnabled(false);
      expect(Keyboard.enabled).toBe(false);
      Keyboard.setEnabled(true);
      expect(Keyboard.enabled).toBe(true);
    }
  });
});

// ============ Share Tests ============
describe('Share Module', () => {
  it('should have share methods', () => {
    if (typeof Share !== 'undefined') {
      expect(typeof Share.share).toBe('function');
      expect(typeof Share.copyToClipboard).toBe('function');
    }
  });
});

// ============ Loader Tests ============
describe('Loader Module', () => {
  it('should show and hide loader', () => {
    if (typeof Loader !== 'undefined') {
      const id = Loader.show({ text: 'Test loading' });
      expect(Loader.activeLoaders.has(id)).toBe(true);
      Loader.hide(id);
    }
  });

  it('should create inline loader', () => {
    if (typeof Loader !== 'undefined') {
      const loader = Loader.createInline();
      expect(loader).toBeTruthy();
      expect(loader.classList.contains('loader-inline')).toBe(true);
    }
  });
});

// Run tests
function runTests() {
  console.log('🧪 Running ModernReader Tests...\n');
  TestRunner.summary();
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TestRunner, runTests };
}

// Auto-run in browser
if (typeof window !== 'undefined') {
  window.runTests = runTests;
}
