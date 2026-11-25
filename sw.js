// 修改任何静态文件后请递增版本号，以便用户获取新版本
const CACHE = 'lunar-calendar-v3';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './lunar.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// 缓存优先，后台更新（stale-while-revalidate）
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(event.request, { ignoreSearch: true });
      const network = fetch(event.request)
        .then((res) => {
          if (res.ok && new URL(event.request.url).origin === self.location.origin) {
            cache.put(event.request, res.clone());
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
