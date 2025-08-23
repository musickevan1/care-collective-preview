// Care Collective Advanced Service Worker for Performance Optimization
const CACHE_VERSION = '2'
const CACHE_NAME = `care-collective-v${CACHE_VERSION}`
const STATIC_CACHE_NAME = `care-collective-static-v${CACHE_VERSION}`
const RUNTIME_CACHE_NAME = `care-collective-runtime-v${CACHE_VERSION}`
const API_CACHE_NAME = `care-collective-api-v${CACHE_VERSION}`

// URLs to cache on install
const STATIC_ASSETS = [
  '/',
  '/logo.png',
  '/offline.html',
  '/dashboard',
  '/login',
  '/signup'
]

// Cache strategies configuration
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first', 
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only'
}

// Cache durations (in milliseconds)
const CACHE_DURATIONS = {
  STATIC: 30 * 24 * 60 * 60 * 1000, // 30 days
  API: 5 * 60 * 1000, // 5 minutes
  RUNTIME: 24 * 60 * 60 * 1000, // 1 day
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('SW: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting()
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
              console.log('SW: Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        // Take control of all clients
        return self.clients.claim()
      })
  )
})

// Advanced fetch event with multiple caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return
  }

  // Handle different request types with appropriate strategies
  if (url.pathname.startsWith('/api/')) {
    // Stale-while-revalidate for API calls
    event.respondWith(handleApiRequest(request))
    return
  }

  if (isStaticAsset(url.pathname)) {
    // Cache-first strategy for static assets
    event.respondWith(handleStaticAsset(request))
    return
  }

  if (request.mode === 'navigate') {
    // Network-first with fallback for navigation
    event.respondWith(handleNavigation(request))
    return
  }

  // Default runtime caching
  event.respondWith(handleRuntimeRequest(request))
})

// Stale-while-revalidate strategy for API requests
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME)
  const cachedResponse = await cache.match(request)
  
  // Fetch fresh data in background
  const fetchPromise = fetch(request).then((response) => {
    if (response.status === 200 && request.method === 'GET') {
      cache.put(request, response.clone())
    }
    return response
  }).catch(() => null)

  // Return cached version immediately if available
  if (cachedResponse && !isExpired(cachedResponse, CACHE_DURATIONS.API)) {
    fetchPromise // Update cache in background
    return cachedResponse
  }

  // If no cache or expired, wait for network
  return fetchPromise || cachedResponse || new Response('API Offline', { status: 503 })
}

// Cache-first strategy for static assets
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE_NAME)
  const cachedResponse = await cache.match(request)

  if (cachedResponse && !isExpired(cachedResponse, CACHE_DURATIONS.STATIC)) {
    return cachedResponse
  }

  try {
    const response = await fetch(request)
    if (response.status === 200) {
      // Add timestamp for expiration checking
      const responseWithTimestamp = addTimestamp(response.clone())
      cache.put(request, responseWithTimestamp)
    }
    return response
  } catch (error) {
    return cachedResponse || new Response('Asset Offline', { status: 503 })
  }
}

// Network-first strategy for navigation
async function handleNavigation(request) {
  try {
    const response = await fetch(request)
    if (response.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    // Try cache fallback
    const cache = await caches.open(RUNTIME_CACHE_NAME)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page
    return caches.match('/offline.html') || new Response('Page Offline', {
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    })
  }
}

// Runtime caching for other requests
async function handleRuntimeRequest(request) {
  const cache = await caches.open(RUNTIME_CACHE_NAME)
  
  try {
    const response = await fetch(request)
    if (response.status === 200 && request.method === 'GET') {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    return cache.match(request) || new Response('Request Failed', { status: 503 })
  }
}

// Helper functions for cache management
function isStaticAsset(pathname) {
  return (
    pathname.includes('/_next/static/') ||
    pathname.includes('/logo.png') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.ttf') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.webp')
  )
}

// Check if cached response is expired
function isExpired(response, maxAge) {
  const cachedTime = response.headers.get('sw-cache-time')
  if (!cachedTime) return true
  
  const age = Date.now() - parseInt(cachedTime, 10)
  return age > maxAge
}

// Add timestamp to response for expiration checking
function addTimestamp(response) {
  const headers = new Headers(response.headers)
  headers.append('sw-cache-time', Date.now().toString())
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}

// Advanced cache cleanup
async function cleanupCaches() {
  const cacheNames = await caches.keys()
  const currentCaches = [CACHE_NAME, STATIC_CACHE_NAME, RUNTIME_CACHE_NAME, API_CACHE_NAME]
  
  // Delete old cache versions
  const deletePromises = cacheNames
    .filter(cacheName => !currentCaches.includes(cacheName))
    .map(cacheName => caches.delete(cacheName))
  
  await Promise.all(deletePromises)
  
  // Clean up expired entries in current caches
  for (const cacheName of currentCaches) {
    await cleanupExpiredEntries(cacheName)
  }
}

// Remove expired entries from a specific cache
async function cleanupExpiredEntries(cacheName) {
  const cache = await caches.open(cacheName)
  const requests = await cache.keys()
  
  for (const request of requests) {
    const response = await cache.match(request)
    if (response && isExpired(response, CACHE_DURATIONS.RUNTIME)) {
      await cache.delete(request)
    }
  }
}

// Enhanced background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync())
  } else if (event.tag === 'cache-cleanup') {
    event.waitUntil(cleanupCaches())
  }
})

// Background sync handler
async function handleBackgroundSync() {
  try {
    // Retry failed API requests stored in IndexedDB
    const failedRequests = await getFailedRequests()
    
    for (const requestData of failedRequests) {
      try {
        await fetch(requestData.url, requestData.options)
        await removeFailedRequest(requestData.id)
      } catch (error) {
        console.log('SW: Failed to sync request:', error)
      }
    }
  } catch (error) {
    console.log('SW: Background sync error:', error)
  }
}

// IndexedDB helpers (simplified)
async function getFailedRequests() {
  // In a real implementation, this would use IndexedDB
  return []
}

async function removeFailedRequest(id) {
  // In a real implementation, this would remove from IndexedDB
}

// Enhanced push notification handler
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    event.waitUntil(
      self.registration.showNotification(data.title || 'Care Collective', {
        body: data.body || 'You have a new notification',
        icon: '/logo.png',
        badge: '/logo.png',
        tag: data.tag || 'general',
        requireInteraction: data.requireInteraction || false,
        actions: data.actions || [],
        data: data.payload || {}
      })
    )
  }
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  const urlToOpen = event.notification.data?.url || '/'
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      
      // Open new window if app isn't open
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

// Periodic cache cleanup
setInterval(() => {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then((registration) => {
      return registration.sync.register('cache-cleanup')
    }).catch(() => {
      // Fallback to immediate cleanup
      cleanupCaches()
    })
  }
}, 24 * 60 * 60 * 1000) // Once per day