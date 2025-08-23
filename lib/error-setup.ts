'use client'

import { errorTracker, setUser, setTag } from './error-tracking'
import { logger } from './logger'

/**
 * Initialize error handling and monitoring for the Care Collective
 * This should be called once when the app starts
 */
export function initializeErrorHandling() {
  // Set global context
  setTag('environment', process.env.NODE_ENV || 'development')
  setTag('version', '1.0.0-preview')
  setTag('service', 'care-collective-preview')

  // Log initialization
  logger.info('Error handling initialized', {
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  })

  // Set up user context when available
  // This would typically be called after user authentication
  if (typeof window !== 'undefined') {
    // Check for existing user data in session/local storage
    try {
      const userData = sessionStorage.getItem('user_data')
      if (userData) {
        const user = JSON.parse(userData)
        setUser({
          id: user.id,
          email: user.email
        })
      }
    } catch (e) {
      // Fail silently
    }
  }
}

/**
 * Set user context for error tracking
 * Call this after user login/authentication
 */
export function setUserContext(user: {
  id: string
  email?: string
  role?: string
}) {
  setUser(user)
  setTag('user_role', user.role || 'user')
  
  logger.info('User context set for error tracking', {
    userId: user.id,
    userRole: user.role
  })
}

/**
 * Clear user context for error tracking
 * Call this after user logout
 */
export function clearUserContext() {
  setUser({})
  setTag('user_role', 'anonymous')
  
  logger.info('User context cleared from error tracking')
}

/**
 * Set up performance monitoring
 * Only runs client-side with proper guards
 */
export function setupPerformanceMonitoring() {
  // Multiple safety checks for server-side rendering
  if (typeof window === 'undefined' || 
      typeof document === 'undefined' || 
      typeof performance === 'undefined') {
    return
  }

  try {
    // Monitor page load times
    window.addEventListener('load', () => {
      try {
        const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (navigationTiming) {
          const pageLoadTime = navigationTiming.loadEventEnd - navigationTiming.fetchStart
          logger.performanceMetric('page_load_time', pageLoadTime)
        }
      } catch (error) {
        // Performance API might not be available
        logger.warn('Performance monitoring failed:', error)
      }
    })

    // Monitor Core Web Vitals - disabled to prevent build issues
    // if ('web-vital' in window) {
    //   // This would require the web-vitals library
    //   // import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'
    //   
    //   // getCLS(metric => logger.performanceMetric('cls', metric.value))
    //   // getFID(metric => logger.performanceMetric('fid', metric.value))
    //   // getFCP(metric => logger.performanceMetric('fcp', metric.value))
    //   // getLCP(metric => logger.performanceMetric('lcp', metric.value))
    //   // getTTFB(metric => logger.performanceMetric('ttfb', metric.value))
    // }

    // Monitor long tasks - with additional safety checks
    if (typeof PerformanceObserver !== 'undefined' && 
        'PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > 50) { // Tasks longer than 50ms
              logger.performanceMetric('long_task', entry.duration)
            }
          })
        })
        observer.observe({ entryTypes: ['longtask'] })
      } catch (e) {
        // PerformanceObserver not supported or failed
        logger.warn('PerformanceObserver setup failed:', e)
      }
    }
  } catch (error) {
    // Entire performance monitoring setup failed
    logger.warn('Performance monitoring setup failed:', error)
  }
}

/**
 * Monitor API responses and automatically track errors
 */
export function setupApiMonitoring() {
  // Multiple safety checks for server-side rendering
  if (typeof window === 'undefined' || 
      typeof fetch === 'undefined') {
    return
  }

  try {
    // Intercept fetch requests
    const originalFetch = window.fetch
  window.fetch = async (...args) => {
    const [resource, config] = args
    const url = typeof resource === 'string' ? resource : resource.url
    const method = config?.method || 'GET'
    const startTime = Date.now()

    try {
      const response = await originalFetch(...args)
      const duration = Date.now() - startTime
      
      logger.apiCall(method, url, response.status, duration)
      
      // Track API errors
      if (!response.ok) {
        logger.error(`API Error: ${method} ${url}`, new Error(`${response.status} ${response.statusText}`), {
          statusCode: response.status,
          duration,
          url,
          method
        })
      }
      
      return response
    } catch (error) {
      const duration = Date.now() - startTime
      logger.error(`API Network Error: ${method} ${url}`, error as Error, {
        duration,
        url,
        method
      })
      throw error
    }
  }
  } catch (error) {
    // API monitoring setup failed
    logger.warn('API monitoring setup failed:', error)
  }
}

/**
 * Monitor console errors and warnings
 */
export function setupConsoleMonitoring() {
  // Multiple safety checks for server-side rendering
  if (typeof window === 'undefined' || 
      typeof console === 'undefined') {
    return
  }

  try {
    // Intercept console.error
    const originalError = console.error
  console.error = (...args) => {
    // Still call original console.error
    originalError(...args)
    
    // Track as error if it looks like an error object
    const firstArg = args[0]
    if (firstArg instanceof Error) {
      errorTracker.captureError(firstArg, {
        component: 'Console',
        severity: 'medium',
        extra: { consoleArgs: args.slice(1) }
      })
    } else if (typeof firstArg === 'string') {
      errorTracker.captureWarning(`Console Error: ${firstArg}`, {
        component: 'Console',
        extra: { consoleArgs: args }
      })
    }
  }

  // Intercept console.warn
  const originalWarn = console.warn
  console.warn = (...args) => {
    originalWarn(...args)
    
    const firstArg = args[0]
    if (typeof firstArg === 'string') {
      errorTracker.captureWarning(`Console Warning: ${firstArg}`, {
        component: 'Console',
        severity: 'low',
        extra: { consoleArgs: args }
      })
    }
  }
  } catch (error) {
    // Console monitoring setup failed
    logger.warn('Console monitoring setup failed:', error)
  }
}

/**
 * Setup all monitoring in one call
 * This is the main function to call from your app initialization
 */
export function setupErrorHandlingAndMonitoring() {
  initializeErrorHandling()
  setupPerformanceMonitoring()
  setupApiMonitoring()
  setupConsoleMonitoring()
  
  logger.info('All error handling and monitoring systems initialized')
}

/**
 * Helper function to check if error handling is working
 * Only use this for testing/debugging
 */
export function testErrorHandling() {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('testErrorHandling should only be used in development')
    return
  }

  console.log('Testing error handling systems...')
  
  // Test logger
  logger.info('Test info message')
  logger.warn('Test warning message')
  logger.error('Test error message', new Error('Test error'))
  
  // Test error tracker
  errorTracker.captureInfo('Test info tracking')
  errorTracker.captureWarning('Test warning tracking')
  errorTracker.captureError(new Error('Test error tracking'))
  
  console.log('Error handling test completed. Check browser console and network tab.')
}