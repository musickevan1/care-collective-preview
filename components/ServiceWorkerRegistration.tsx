'use client'

import { useEffect, useState } from 'react'

/**
 * ServiceWorkerRegistration - Registers the service worker for offline caching
 * Only runs in production to avoid development issues
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Only register in production and if service workers are supported
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      navigator.serviceWorker
        .register('/sw.js', {
          scope: '/',
        })
        .then((registration) => {
          console.log('SW: Service Worker registered:', registration.scope)
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New version available
                  console.log('SW: New version available')
                  // You could show a notification to user here
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('SW: Service Worker registration failed:', error)
        })

      // Listen for messages from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'CACHE_UPDATED') {
          console.log('SW: Cache updated for:', event.data.url)
        }
      })

      // Handle connection status changes
      const handleOnline = () => {
        console.log('SW: Connection restored')
        // You could show a toast notification here
      }

      const handleOffline = () => {
        console.log('SW: Connection lost')
        // You could show a toast notification here
      }

      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  // This component doesn't render anything
  return null
}

/**
 * Hook to check if the app is running offline
 */
export function useOfflineStatus() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    setIsOffline(!navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOffline
}