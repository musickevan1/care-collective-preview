// Care Collective Service Worker
// Provides offline functionality for help requests and core features

const CACHE_NAME = 'care-collective-v1'
const OFFLINE_CACHE = 'care-collective-offline-v1'

// Core files to cache for offline access
const CORE_ASSETS = [
  '/',
  '/dashboard',
  '/requests',
  '/logo.png',
  '/manifest.json'
]

// Help request pages that should be available offline
const HELP_REQUEST_PATTERN = /^\/requests\/[^/]+$/

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching core assets')
        return cache.addAll(CORE_ASSETS)
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Cache installation failed:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        // Claim all clients to start controlling them immediately
        return self.clients.claim()
      })
  )
})

// Fetch event - implement caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip external requests
  if (url.origin !== location.origin) {
    return
  }

  // Special handling for API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
    return
  }

  // Special handling for help request pages
  if (HELP_REQUEST_PATTERN.test(url.pathname)) {
    event.respondWith(handleHelpRequestPage(request))
    return
  }

  // Default strategy: cache first, then network
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          // Return cached version
          return response
        }

        // Fetch from network and cache
        return fetch(request)
          .then((networkResponse) => {
            // Don't cache non-successful responses
            if (!networkResponse.ok) {
              return networkResponse
            }

            // Clone response for caching
            const responseClone = networkResponse.clone()

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseClone)
              })
              .catch(console.warn)

            return networkResponse
          })
          .catch(() => {
            // Network failed, try to serve offline page
            if (request.mode === 'navigate') {
              return caches.match('/offline.html') ||
                     caches.match('/') ||
                     new Response('Offline - Please check your connection', {
                       status: 503,
                       statusText: 'Service Unavailable'
                     })
            }
            throw new Error('Network unavailable')
          })
      })
  )
})

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  try {
    // Try network first for API requests
    const networkResponse = await fetch(request)

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(OFFLINE_CACHE)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Return error response
    return new Response(JSON.stringify({
      error: 'Offline - Request failed',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Handle help request pages with cache-first for offline viewing
async function handleHelpRequestPage(request) {
  try {
    // Check cache first for help request pages
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Fetch from network
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    // Serve generic offline page if specific page not cached
    return caches.match('/') || new Response('Request details unavailable offline', {
      status: 503,
      statusText: 'Service Unavailable'
    })
  }
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'help-request-sync') {
    event.waitUntil(syncHelpRequests())
  }
})

// Sync help requests when back online
async function syncHelpRequests() {
  try {
    // This would sync any pending help requests created while offline
    console.log('Syncing help requests...')
    // Implementation would depend on offline storage strategy
  } catch (error) {
    console.error('Help request sync failed:', error)
  }
}

console.log('Care Collective Service Worker loaded')