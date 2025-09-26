'use client'

import { useEffect, useState } from 'react'

export function ServiceWorkerRegistration() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    // Only run in browser environment with service worker support
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      process.env.NODE_ENV !== 'production'
    ) {
      return
    }

    // Monitor online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)

    // Register service worker
    navigator.serviceWorker
      .register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      })
      .then((reg) => {
        console.log('Service Worker registered successfully:', reg.scope)
        setRegistration(reg)

        // Check for updates
        const checkForUpdates = () => {
          reg.update().catch(console.warn)
        }

        // Check for updates every 60 seconds when page is visible
        const interval = setInterval(() => {
          if (document.visibilityState === 'visible') {
            checkForUpdates()
          }
        }, 60000)

        // Listen for new service worker installation
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true)
              }
            })
          }
        })

        // Listen for service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'CACHE_UPDATED') {
            console.log('Cache updated by service worker')
          }
        })

        return () => clearInterval(interval)
      })
      .catch((error) => {
        console.warn('Service Worker registration failed:', error)
      })

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Auto-refresh when update is available (for Care Collective critical updates)
  useEffect(() => {
    if (updateAvailable && registration) {
      // For critical community platform, auto-refresh after a short delay
      const timer = setTimeout(() => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
          window.location.reload()
        }
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [updateAvailable, registration])

  // No visible UI needed - service worker works in background
  // This component handles registration and update logic only
  return null
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