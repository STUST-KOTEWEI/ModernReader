# ModernReader API 文檔

> 完整的 ModernReader Royale API 參考文檔

## 目錄

- [Storage](#storage)
- [Analytics](#analytics)
- [i18n](#i18n)
- [Keyboard](#keyboard)
- [Share](#share)
- [Audio](#audio)
- [Animation](#animation)
- [Validation](#validation)
- [Format](#format)
- [Components](#components)
- [Services](#services)

---

## Storage

本地存儲工具模組。

### Storage

```javascript
// 儲存資料
Storage.set('key', { foo: 'bar' });

// 讀取資料
const data = Storage.get('key');
const data = Storage.get('key', defaultValue);

// 刪除資料
Storage.remove('key');

// 清除所有
Storage.clear();
```

### ReadingProgress

```javascript
// 儲存閱讀進度
ReadingProgress.save('book-id', 75, 'Chapter 5');

// 獲取進度
const progress = ReadingProgress.get('book-id');
// { bookId, progress, chapter, lastRead }

// 獲取所有進度
const all = ReadingProgress.getAll();
```

### Bookmarks

```javascript
// 添加書籤
Bookmarks.add('book-id', { chapter: 'Ch1', note: 'Important!' });

// 獲取書籍的書籤
const bookmarks = Bookmarks.getByBook('book-id');

// 移除書籤
Bookmarks.remove('bookmark-id');

// 獲取所有書籤
const all = Bookmarks.getAll();
```

### UserPreferences

```javascript
// 儲存偏好
UserPreferences.save({ theme: 'noir', fontSize: 1.2 });

// 獲取偏好
const prefs = UserPreferences.get();

// 重置偏好
UserPreferences.reset();
```

---

## Analytics

事件追蹤工具。

```javascript
// 追蹤事件
Analytics.track('event_name', { key: 'value' });

// 追蹤頁面瀏覽
Analytics.pageView('/page-path');

// 追蹤功能使用
Analytics.featureUsed('feature_name');

// 追蹤錯誤
Analytics.error('Error message', { context: 'info' });

// 獲取會話統計
const stats = Analytics.getSessionStats();

// 匯出事件
const events = Analytics.exportEvents();
```

---

## i18n

國際化多語言支援。

```javascript
// 獲取翻譯
const text = i18n.t('common.loading');  // "載入中..."
const text = t('common.save');  // 簡寫函數

// 帶參數的翻譯
const text = i18n.t('greeting', { name: 'John' });

// 切換語言
i18n.setLocale('en');

// 獲取當前語言
const locale = i18n.getLocale();

// 獲取可用語言
const locales = i18n.getAvailableLocales();  // ['zh-TW', 'en']

// 添加翻譯資源
i18n.addResource('ja', { common: { hello: 'こんにちは' } });
```

---

## Keyboard

鍵盤快捷鍵支援。

```javascript
// 註冊快捷鍵
Keyboard.register('ctrl+s', () => save(), '儲存');
Keyboard.register('escape', () => close(), '關閉');

// 取消註冊
Keyboard.unregister('ctrl+s');

// 顯示快捷鍵說明
Keyboard.showHelp();

// 啟用/禁用
Keyboard.setEnabled(false);

// 獲取所有快捷鍵
const shortcuts = Keyboard.getAll();
```

### 預設快捷鍵

| 按鍵 | 功能 |
|------|------|
| `←` `→` | 上/下一頁 |
| `Escape` | 關閉視窗 |
| `T` | 切換主題 |
| `?` | 顯示快捷鍵說明 |
| `H` | 回到頂部 |
| `J` `K` | 上/下滾動 |
| `1-4` | 導航到區塊 |
| `Ctrl+S` | 儲存 |
| `Ctrl+B` | 添加書籤 |

---

## Share

社群分享功能。

```javascript
// 分享內容
await Share.share({
  title: 'ModernReader',
  text: '來看看這本書！',
  url: 'https://example.com'
});

// 分享閱讀進度
await Share.shareReading({
  title: '《星海序章》',
  chapter: '第三章',
  progress: 75
});

// 複製到剪貼簿
await Share.copyToClipboard('Text to copy');

// 生成分享圖片
const blob = await Share.generateShareImage({
  title: 'Book Title',
  subtitle: 'Chapter 1'
});
```

---

## Audio

音效播放引擎。

```javascript
// 預載音效
await Audio.preload('click', 'assets/sounds/click.mp3');

// 播放音效
Audio.play('click', { volume: 0.5 });

// 播放背景音樂
Audio.playBGM('ambient', { volume: 0.3 });

// 停止背景音樂
Audio.stopBGM();

// 淡入/淡出
Audio.fadeIn(audioElement, 1000);
Audio.fadeOut(audioElement, 1000);

// 播放 UI 音效
Audio.playUI('click');  // click, hover, success, error

// 設定音量
Audio.setVolume(0.7);

// 開啟/關閉音效
Audio.setEnabled(false);

// 生成音調
Audio.beep(440, 100, 'sine');
```

---

## Animation

動畫工具函數。

```javascript
// 基礎動畫
Animation.animate({
  from: 0,
  to: 100,
  duration: 300,
  easing: 'easeOutQuad',
  onUpdate: (value) => console.log(value),
  onComplete: () => console.log('Done!')
});

// 淡入/淡出
await Animation.fadeIn(element, 300);
await Animation.fadeOut(element, 300);

// 滑入
await Animation.slideIn(element, 'up', 300);

// 縮放
await Animation.scale(element, 0.8, 1, 300);

// 搖晃
await Animation.shake(element, 10, 500);

// 脈衝
await Animation.pulse(element, 1.1, 200);

// 打字機效果
await Animation.typewriter(element, 'Hello!', 50);

// 數字計數
await Animation.countUp(element, 0, 100, 1000, 'number');

// 序列動畫
await Animation.stagger(elements, (el) => Animation.fadeIn(el), 100);
```

### 緩動函數

- `linear`
- `easeInQuad`, `easeOutQuad`, `easeInOutQuad`
- `easeInCubic`, `easeOutCubic`, `easeInOutCubic`
- `easeOutElastic`
- `easeOutBounce`

---

## Validation

表單驗證工具。

```javascript
// 驗證單一值
const result = Validation.validate(email, ['required', Validation.rules.email]);
// { valid: true/false, errors: [] }

// 驗證表單
const result = Validation.validateForm(data, {
  email: ['required', Validation.rules.email],
  password: ['required', Validation.rules.minLength(8)]
});

// 創建表單驗證器
const validator = Validation.createValidator(form, schema, {
  onSubmit: (data) => console.log(data),
  onError: (errors) => console.log(errors),
  validateOnBlur: true
});

// 密碼強度檢查
const strength = Validation.checkPasswordStrength('myPassword123');
// { score: 4, level: '很強', suggestions: [] }
```

### 內建規則

- `required` - 必填
- `email` - Email 格式
- `url` - URL 格式
- `phone` - 電話格式
- `numeric` - 純數字
- `alphanumeric` - 英數混合
- `date` - 日期格式
- `creditCard` - 信用卡號
- `minLength(n)` - 最小長度
- `maxLength(n)` - 最大長度
- `min(n)` - 最小值
- `max(n)` - 最大值
- `pattern(regex, msg)` - 正規表達式
- `match(field, getValue)` - 欄位匹配

---

## Format

格式化工具。

```javascript
// 日期格式化
Format.date(new Date(), 'YYYY-MM-DD');      // "2024-03-15"
Format.date(new Date(), 'YYYY/MM/DD HH:mm'); // "2024/03/15 14:30"

// 相對時間
Format.relativeTime(date);  // "3 分鐘前"
Format.relativeTime(date, 'en');  // "3 minutes ago"

// 數字格式化
Format.number(1234567, { decimals: 2 });  // "1,234,567.00"

// 貨幣
Format.currency(1000, 'TWD');  // "NT$1,000"
Format.currency(99.99, 'USD');  // "$99.99"

// 百分比
Format.percent(0.856, 1);  // "85.6%"

// 檔案大小
Format.fileSize(1536);     // "1.5 KB"
Format.fileSize(1073741824);  // "1 GB"

// 時間長度
Format.duration(3661);     // "1:01:01"
Format.duration(3661, 'long');  // "1 小時 1 分鐘 1 秒"

// 縮短數字
Format.compact(1500);      // "1.5K"
Format.compact(1500000);   // "1.5M"

// 電話號碼
Format.phone('0912345678', '####-###-###');  // "0912-345-678"

// 文字處理
Format.truncate('Long text...', 10);  // "Long te..."
Format.capitalize('hello');  // "Hello"
Format.titleCase('hello world');  // "Hello World"
Format.slug('Hello World!');  // "hello-world"
Format.mask('1234567890', 2, 2);  // "12******90"
```

---

## Components

### Toast

```javascript
Toast.success('Success message');
Toast.error('Error message');
Toast.warning('Warning message');
Toast.info('Info message');

Toast.show('Custom message', {
  type: 'success',
  duration: 5000,
  position: 'top-right'
});
```

### Modal

```javascript
// 開啟/關閉
Modal.open('modalId');
Modal.close('modalId');

// 確認對話框
const confirmed = await Modal.confirm('Are you sure?', {
  title: '確認',
  confirmText: '確定',
  cancelText: '取消'
});

// 提示對話框
await Modal.alert('Hello!', { title: '提示' });

// 創建動態模態框
const modal = Modal.create({
  title: 'Title',
  content: '<p>Content</p>',
  buttons: [
    { text: 'Cancel', onClick: (m) => Modal.close(m.id) },
    { text: 'OK', primary: true, onClick: handleOK }
  ]
});
Modal.open(modal.id);
```

### Loader

```javascript
// 全頁載入
const loaderId = Loader.show({ text: '載入中...', showProgress: true });
Loader.setProgress(loaderId, 50, '處理中...');
Loader.hide(loaderId);

// 行內載入
const inlineLoader = Loader.createInline();

// 按鈕載入狀態
Loader.setButtonLoading(button, true);
Loader.setButtonLoading(button, false);

// 骨架屏
const skeleton = Loader.createSkeleton('text', 3);
```

### Tooltip

```html
<button data-tooltip="提示內容" data-tooltip-placement="top">
  Hover me
</button>
```

```javascript
// 程式化顯示
Tooltip.create(element, 'Tooltip content', {
  placement: 'top',
  duration: 3000
});
```

### Dropdown

```javascript
const dropdown = Dropdown.create(container, {
  trigger: 'Select an option',
  items: [
    { label: 'Option 1', icon: '📝', onClick: () => {} },
    { type: 'divider' },
    { label: 'Option 2', active: true }
  ],
  onSelect: (item) => console.log(item)
});

dropdown.open();
dropdown.close();
dropdown.setItems(newItems);
```

### Carousel

```javascript
const carousel = Carousel.create(container, {
  slides: [
    { html: '<div>Slide 1</div>' },
    { image: 'image.jpg', alt: 'Description' }
  ],
  autoPlay: true,
  autoPlayInterval: 5000,
  loop: true,
  showNav: true,
  showDots: true,
  effect: 'slide',  // 'slide' | 'fade'
  onChange: (index) => console.log(index)
});

carousel.next();
carousel.prev();
carousel.goTo(2);
carousel.destroy();
```

---

## Services

### AuthService

```javascript
// 登入
const result = await AuthService.login({ email, password });

// 註冊
const result = await AuthService.register({ email, password, name });

// 登出
AuthService.logout();

// 檢查登入狀態
const isLoggedIn = AuthService.isAuthenticated();

// 獲取用戶
const user = AuthService.getUser();

// 社群登入
await AuthService.socialLogin('google');
```

### SyncService

```javascript
// 添加到同步佇列
SyncService.queue('reading_progress', { bookId, progress });

// 強制同步
await SyncService.forceSync();

// 獲取同步狀態
const status = SyncService.getStatus();

// 監聽同步事件
window.addEventListener('sync:complete', (e) => {
  console.log(e.detail);
});
```

### API

```javascript
// 基本請求
const data = await API.get('/endpoint');
const data = await API.post('/endpoint', body);
const data = await API.put('/endpoint', body);
await API.delete('/endpoint');

// 書籍服務
const books = await BookService.getAll();
const book = await BookService.getById('book-id');
const results = await BookService.search('keyword');
const recommendations = await BookService.getRecommendations(preferences);

// H.O.L.O. 服務
const emotion = await HOLOService.analyzeEmotion(text);
const suggestion = await HOLOService.suggestSoundscape(context);
```

---

## 授權

MIT License
