'use client'

import { useEffect, useState } from 'react'
import { ReactElement } from 'react'

/**
 * Service Worker Registration and Update Notification
 * Detects when a new version is available and prompts user to refresh
 * CRITICAL: Ensures users see latest features and fixes in crisis situations
 */
export function ServiceWorkerRegistration(): ReactElement | null {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    // Only run in browser environment with service worker support
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator)
    ) {
      return
    }

    // Monitor online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)

    let interval: NodeJS.Timeout

    // Register service worker
    navigator.serviceWorker
      .register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      })
      .then((reg) => {
        console.log('[App] Service Worker registered successfully:', reg.scope)
        setRegistration(reg)

        // Check for updates every 60 seconds when page is visible
        interval = setInterval(() => {
          if (document.visibilityState === 'visible') {
            reg.update().catch(console.warn)
          }
        }, 60000)

        // Listen for new service worker installation
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[App] New version available')
                setUpdateAvailable(true)
              }
            })
          }
        })

        // Listen for service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'CACHE_UPDATED') {
            console.log('[App] Cache updated by service worker')
          }
        })
      })
      .catch((error) => {
        console.warn('[App] Service Worker registration failed:', error)
      })

    return () => {
      if (interval) clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleUpdate = () => {
    if (registration?.waiting) {
      // Tell the service worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })

      // Listen for controlling service worker change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    }
  }

  // Render update notification when available
  if (!updateAvailable) {
    return null
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg bg-sage p-4 shadow-lg"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">
            Update Available
          </h3>
          <p className="mt-1 text-sm text-white/90">
            A new version of Care Collective is available. Refresh to get the latest features and fixes.
          </p>
        </div>
        <button
          onClick={() => setUpdateAvailable(false)}
          className="text-white/90 hover:text-white focus:outline-none focus:ring-2 focus:ring-white rounded"
          aria-label="Dismiss update notification"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleUpdate}
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-sage hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-sage min-h-[44px]"
          aria-label="Update now and reload page"
        >
          Update Now
        </button>
        <button
          onClick={() => setUpdateAvailable(false)}
          className="rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-sage min-h-[44px]"
          aria-label="Update later"
        >
          Later
        </button>
      </div>
    </div>
  )
}

// Export hook for service worker status
export function useServiceWorkerStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    setIsOnline(navigator.onLine)
    setIsInstalled('serviceWorker' in navigator && !!navigator.serviceWorker.controller)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, isInstalled }
}