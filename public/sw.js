/**
 * Service Worker for O3Measure
 * Provides offline capabilities and performance optimization for Meta Quest devices
 */

const CACHE_NAME = 'o3measure-v0.1.0';
const RUNTIME_CACHE = 'o3measure-runtime-v0.1.0';

// Core files to cache for offline functionality
const CORE_CACHE_FILES = [
  '/',
  '/index.html',
  '/src/main.js',
  '/src/styles/main.css',
  '/manifest.webmanifest'
];

// External resources (CDN)
const EXTERNAL_CACHE_FILES = [
  'https://aframe.io/releases/1.7.0/aframe.min.js'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching core assets');
        return cache.addAll(CORE_CACHE_FILES);
      })
      .then(() => {
        // Cache external resources separately (they might fail)
        return caches.open(CACHE_NAME)
          .then(cache => {
            return Promise.allSettled(
              EXTERNAL_CACHE_FILES.map(url =>
                cache.add(url).catch(err => {
                  console.warn('[Service Worker] Failed to cache:', url, err);
                })
              )
            );
          });
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
            })
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Chrome extensions and other schemes
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Network-first strategy for API calls or dynamic content
  if (url.pathname.includes('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(cacheFirst(request));
});

/**
 * Cache-first strategy: Try cache first, fall back to network
 * Best for static assets that don't change often
 */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    console.log('[Service Worker] Serving from cache:', request.url);
    return cachedResponse;
  }

  try {
    console.log('[Service Worker] Fetching from network:', request.url);
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const runtimeCache = await caches.open(RUNTIME_CACHE);
      await runtimeCache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Fetch failed:', error);

    // Return a fallback response for navigation requests
    if (request.destination === 'document') {
      const fallbackResponse = await cache.match('/index.html');
      if (fallbackResponse) {
        return fallbackResponse;
      }
    }

    throw error;
  }
}

/**
 * Network-first strategy: Try network first, fall back to cache
 * Best for dynamic content that should be fresh
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

// Handle service worker messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});
