const CACHE_NAME = 'offline-auth-v2';
// Add any other core assets you want to cache
const urlsToCache = [
  '/',
  '/index.html',
];

// 1. Install the service worker and cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. Clean up old caches on activation
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames.map((cacheName) => {
        if (!cacheWhitelist.includes(cacheName)) {
          return caches.delete(cacheName);
        }
      })
    ))
  );
});

// 3. Intercept fetch requests
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // For the sync API call, always go to the network.
  if (request.url.includes('/api/sync')) {
    event.respondWith(fetch(request));
    return;
  }

  // For all other requests, use a "Cache First" strategy
  // Only handle http/https requests, ignore others (like chrome-extension://)
  if (request.url.startsWith('http')) {
    event.respondWith(cacheFirst(request));
  }
});

// Cache-First Strategy
async function cacheFirst(request) {
  // 1. Try to get the response from the cache
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    // 2. If not in cache, fetch from the network
    const networkResponse = await fetch(request);
    
    // 3. Cache the new response for next time
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // If both cache and network fail (e.g., for an image not in cache while offline)
    console.log('Fetch failed; returning offline fallback.', error);
    // You could return a fallback image or page here if you wanted.
  }
}
