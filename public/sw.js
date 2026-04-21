// RecDex Service Worker v2 — adds timer notification scheduling
const CACHE_NAME = 'recdex-v2';

// ===== Timer notification scheduling =====
// Cook mode posts { type: 'recdex-timer-schedule', fireAt, title, body } when
// a timer starts. We setTimeout inside the SW to fire showNotification at the
// target wall-clock time. This keeps firing even when the tab is backgrounded
// or the screen is locked (PWA context). On iOS Safari this works when the
// PWA is installed to the home screen.
const scheduledTimers = new Map(); // key: fireAt -> { timeoutId }

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'recdex-timer-schedule') {
    const { fireAt, title, body } = data;
    if (typeof fireAt !== 'number' || !title) return;
    const ms = Math.max(0, fireAt - Date.now());
    // SWs can be evicted during long sleeps, but for most kitchen timers (< 1h)
    // this is reliable on installed PWAs.
    const timeoutId = setTimeout(() => {
      self.registration.showNotification(title, {
        body: body || '',
        tag: 'recdex-timer',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200],
      });
      scheduledTimers.delete(fireAt);
    }, ms);
    scheduledTimers.set(fireAt, { timeoutId });
  } else if (data.type === 'recdex-timer-cancel') {
    // Cancel all pending (cheap — rarely more than a few)
    for (const [k, v] of scheduledTimers.entries()) {
      clearTimeout(v.timeoutId);
      scheduledTimers.delete(k);
    }
  }
});

// Clicking a timer notification focuses (or opens) cook mode
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = clients.find((c) => c.url.includes('/cook'));
    if (existing) { existing.focus(); return; }
    if (clients[0]) { clients[0].focus(); return; }
    await self.clients.openWindow('/');
  })());
});

const APP_SHELL = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install: cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: route requests through caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // API calls: network-first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets (fonts, icons, images): cache-first
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(woff2?|ttf|otf|ico|png|jpg|jpeg|svg|webp)$/)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML pages (recipe pages, etc.): network-first so they're fresh,
  // but cached for offline use
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Everything else: network-first
  event.respondWith(networkFirst(request));
});

// Strategy: cache-first (static assets)
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 408, statusText: 'Offline' });
  }
}

// Strategy: network-first (API calls, general)
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('', { status: 408, statusText: 'Offline' });
  }
}

// Strategy: network-first with offline.html fallback (HTML pages)
async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match('/offline.html');
  }
}
