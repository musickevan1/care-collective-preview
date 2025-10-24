// Care Collective Service Worker
// Provides offline functionality for help requests and core features

// Use timestamp-based cache versioning to ensure fresh content on deployments
// This version number should be updated on each deployment
const CACHE_VERSION = '2025-10-24-154' // Update this on each deployment
const CACHE_NAME = `care-collective-v${CACHE_VERSION}`
const OFFLINE_CACHE = `care-collective-offline-v${CACHE_VERSION}`

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

  // NETWORK-FIRST strategy for HTML/navigation requests
  // This ensures users always see the latest deployment
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(handleNavigationRequest(request))
    return
  }

  // Cache-first for static assets (JS, CSS, images)
  // These have content hashes in filenames, so cache-first is safe
  if (url.pathname.startsWith('/_next/static/') || url.pathname.match(/\.(js|css|woff2?|png|jpg|jpeg|gif|svg|ico)$/)) {
    event.respondWith(handleStaticAsset(request))
    return
  }

  // Default: network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Cache successful responses
        if (networkResponse.ok) {
          const responseClone = networkResponse.clone()
          caches.open(CACHE_NAME)
            .then((cache) => cache.put(request, responseClone))
            .catch(console.warn)
        }
        return networkResponse
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }
          // No cache available
          return new Response('Offline - Please check your connection', {
            status: 503,
            statusText: 'Service Unavailable'
          })
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

// Handle navigation requests with network-first strategy
// This ensures users always see the latest deployment
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      // Cache the response for offline access
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // No cache, serve fallback
    return caches.match('/') || new Response('Offline - Please check your connection', {
      status: 503,
      statusText: 'Service Unavailable'
    })
  }
}

// Handle help request pages with network-first for fresh content
async function handleHelpRequestPage(request) {
  return handleNavigationRequest(request)
}

// Handle static assets with cache-first (these have content hashes)
async function handleStaticAsset(request) {
  try {
    // Check cache first for static assets
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Fetch from network and cache
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    // Try cache as final fallback
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    throw error
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