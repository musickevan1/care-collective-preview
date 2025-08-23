'use client'

import { useEffect, useState } from 'react'

/**
 * Web Vitals monitoring component
 * Tracks Core Web Vitals metrics and logs them for optimization
 */
export function WebVitals() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return

    // Dynamic import to avoid bundle size impact
    import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
      // Log Core Web Vitals metrics
      onCLS((metric) => {
        console.log('CLS (Cumulative Layout Shift):', metric)
        // In production, send to analytics
        if (process.env.NODE_ENV === 'production') {
          sendToAnalytics('CLS', metric)
        }
      })

      onFID((metric) => {
        console.log('FID (First Input Delay):', metric)
        if (process.env.NODE_ENV === 'production') {
          sendToAnalytics('FID', metric)
        }
      })

      onFCP((metric) => {
        console.log('FCP (First Contentful Paint):', metric)
        if (process.env.NODE_ENV === 'production') {
          sendToAnalytics('FCP', metric)
        }
      })

      onLCP((metric) => {
        console.log('LCP (Largest Contentful Paint):', metric)
        if (process.env.NODE_ENV === 'production') {
          sendToAnalytics('LCP', metric)
        }
      })

      onTTFB((metric) => {
        console.log('TTFB (Time to First Byte):', metric)
        if (process.env.NODE_ENV === 'production') {
          sendToAnalytics('TTFB', metric)
        }
      })
    }).catch((error) => {
      console.warn('Failed to load web-vitals:', error)
    })

    // Additional performance monitoring
    if ('PerformanceObserver' in window) {
      // Monitor long tasks
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > 50) {
              console.warn('Long task detected:', entry.duration + 'ms')
              if (process.env.NODE_ENV === 'production') {
                sendToAnalytics('LongTask', { duration: entry.duration })
              }
            }
          })
        })
        longTaskObserver.observe({ entryTypes: ['longtask'] })
      } catch (error) {
        console.warn('Long task observer not supported')
      }

      // Monitor layout shifts
      try {
        const layoutShiftObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.value > 0.1) {
              console.warn('Significant layout shift:', entry.value)
            }
          })
        })
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] })
      } catch (error) {
        console.warn('Layout shift observer not supported')
      }
    }

    // Monitor network connection
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      console.log('Network info:', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      })

      const handleConnectionChange = () => {
        console.log('Connection changed:', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink
        })
      }

      connection.addEventListener('change', handleConnectionChange)
      return () => {
        connection.removeEventListener('change', handleConnectionChange)
      }
    }
  }, [])

  return null
}

/**
 * Send metrics to analytics service
 */
function sendToAnalytics(metricName: string, metric: any) {
  // This would integrate with your analytics service
  // Example: Google Analytics, Vercel Analytics, etc.
  
  // For now, we'll just log it
  console.log(`Analytics: ${metricName}`, metric)
  
  // Example implementation:
  // gtag('event', metricName, {
  //   value: Math.round(metric.value),
  //   custom_parameter: metric.id,
  // })
}

/**
 * Hook to get current performance metrics
 */
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<Record<string, number>>({})

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Get navigation timing metrics
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    if (navigation) {
      setMetrics({
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        loadComplete: navigation.loadEventEnd - navigation.navigationStart,
        firstByte: navigation.responseStart - navigation.navigationStart,
        domInteractive: navigation.domInteractive - navigation.navigationStart,
      })
    }

    // Update metrics when page loads
    const handleLoad = () => {
      setTimeout(() => {
        const updatedNavigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (updatedNavigation) {
          setMetrics({
            domContentLoaded: updatedNavigation.domContentLoadedEventEnd - updatedNavigation.navigationStart,
            loadComplete: updatedNavigation.loadEventEnd - updatedNavigation.navigationStart,
            firstByte: updatedNavigation.responseStart - updatedNavigation.navigationStart,
            domInteractive: updatedNavigation.domInteractive - updatedNavigation.navigationStart,
          })
        }
      }, 100)
    }

    if (document.readyState === 'complete') {
      handleLoad()
    } else {
      window.addEventListener('load', handleLoad)
      return () => window.removeEventListener('load', handleLoad)
    }
  }, [])

  return metrics
}