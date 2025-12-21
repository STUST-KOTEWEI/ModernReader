/**
 * ModernReader - Service Worker
 * PWA 離線支援
 */

const CACHE_NAME = 'modernreader-v1.0.0';
const RUNTIME_CACHE = 'modernreader-runtime';

// 需要預緩存的資源
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  // Config
  '/config/settings.js',
  // Utils
  '/utils/storage.js',
  '/utils/analytics.js',
  '/utils/i18n.js',
  '/utils/keyboard.js',
  '/utils/share.js',
  // Components
  '/components/toast.js',
  '/components/modal.js',
  '/components/loader.js',
  // Services
  '/services/api.js',
  // Data
  '/data/books.json',
  // Icons
  '/assets/icons/bookmark.svg',
  '/assets/icons/settings.svg',
  '/assets/icons/share.svg',
  '/assets/icons/sun.svg',
  '/assets/icons/moon.svg',
  '/assets/icons/menu.svg',
  '/assets/icons/close.svg',
  '/assets/icons/search.svg'
];

// 安裝事件 - 預緩存資源
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching resources');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Precaching complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Precaching failed:', error);
      })
  );
});

// 啟用事件 - 清理舊緩存
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activated');
        return self.clients.claim();
      })
  );
});

// 請求攔截 - 緩存策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 忽略非 HTTP(S) 請求
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API 請求 - Network First
  if (url.pathname.startsWith('/api/') || url.hostname !== location.hostname) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 靜態資源 - Cache First
  if (isStaticResource(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 其他請求 - Stale While Revalidate
  event.respondWith(staleWhileRevalidate(request));
});

/**
 * Cache First 策略
 * 優先從緩存獲取，緩存沒有再從網路獲取
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Network First 策略
 * 優先從網路獲取，網路失敗再從緩存獲取
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Stale While Revalidate 策略
 * 立即返回緩存，同時在背景更新
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

/**
 * 判斷是否為靜態資源
 */
function isStaticResource(pathname) {
  const staticExtensions = [
    '.css', '.js', '.json',
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp',
    '.woff', '.woff2', '.ttf', '.eot'
  ];
  return staticExtensions.some((ext) => pathname.endsWith(ext));
}

// 推送通知
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || '您有新的閱讀推薦',
    icon: '/assets/icons/icon-192.png',
    badge: '/assets/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: '開啟' },
      { action: 'close', title: '關閉' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'ModernReader', options)
  );
});

// 通知點擊
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 如果已有視窗，聚焦它
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // 否則開啟新視窗
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// 背景同步
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reading-progress') {
    event.waitUntil(syncReadingProgress());
  }
});

/**
 * 同步閱讀進度
 */
async function syncReadingProgress() {
  // 從 IndexedDB 獲取待同步的進度
  // 然後發送到伺服器
  console.log('[SW] Syncing reading progress...');
}

console.log('[SW] Service Worker loaded');
