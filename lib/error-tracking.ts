import { Logger } from './logger'

export interface ErrorContext {
  userId?: string
  sessionId?: string
  userAgent?: string
  url?: string
  component?: string
  action?: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
  tags?: Record<string, string>
  extra?: Record<string, any>
}

export interface ErrorEvent {
  id: string
  timestamp: string
  message: string
  stack?: string
  level: 'error' | 'warning' | 'info'
  context: ErrorContext
  fingerprint?: string
  handled: boolean
}

class ErrorTracker {
  private isInitialized = false
  private isClient = typeof window !== 'undefined'
  private queue: ErrorEvent[] = []
  
  constructor() {
    if (this.isClient) {
      this.setupGlobalErrorHandlers()
    }
  }

  private setupGlobalErrorHandlers(): void {
    // Unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        url: event.filename,
        extra: {
          lineno: event.lineno,
          colno: event.colno,
          source: 'window.error'
        }
      }, false)
    })

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
      this.captureError(error, {
        extra: { source: 'unhandledrejection' }
      }, false)
    })

    // React error boundary errors are handled by the ErrorBoundary component
  }

  private generateErrorId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  private generateFingerprint(error: Error, context: ErrorContext): string {
    // Create a fingerprint for error grouping
    const parts = [
      error.name,
      error.message.replace(/\d+/g, 'N'), // Replace numbers with N for grouping
      context.component || 'unknown',
      context.url?.split('?')[0] || 'unknown' // Remove query params
    ]
    
    return btoa(parts.join('|')).substring(0, 16)
  }

  captureError(
    error: Error, 
    context: ErrorContext = {}, 
    handled: boolean = true
  ): string {
    const errorId = this.generateErrorId()
    
    const errorEvent: ErrorEvent = {
      id: errorId,
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      level: 'error',
      context: {
        ...context,
        userAgent: this.isClient ? navigator.userAgent : undefined,
        url: this.isClient ? window.location.href : context.url
      },
      fingerprint: this.generateFingerprint(error, context),
      handled
    }

    // Log the error
    Logger.getInstance().error(`Error tracked: ${error.message}`, error, {
      errorId,
      context,
      handled
    })

    // Store in queue for potential sending to external service
    this.queue.push(errorEvent)
    this.processQueue()

    return errorId
  }

  captureWarning(
    message: string,
    context: ErrorContext = {}
  ): string {
    const errorId = this.generateErrorId()
    
    const warningEvent: ErrorEvent = {
      id: errorId,
      timestamp: new Date().toISOString(),
      message,
      level: 'warning',
      context: {
        ...context,
        userAgent: this.isClient ? navigator.userAgent : undefined,
        url: this.isClient ? window.location.href : context.url
      },
      handled: true
    }

    Logger.getInstance().warn(`Warning tracked: ${message}`, {
      warningId: errorId,
      context
    })

    this.queue.push(warningEvent)
    this.processQueue()

    return errorId
  }

  captureInfo(
    message: string,
    context: ErrorContext = {}
  ): string {
    const errorId = this.generateErrorId()
    
    const infoEvent: ErrorEvent = {
      id: errorId,
      timestamp: new Date().toISOString(),
      message,
      level: 'info',
      context: {
        ...context,
        userAgent: this.isClient ? navigator.userAgent : undefined,
        url: this.isClient ? window.location.href : context.url
      },
      handled: true
    }

    Logger.getInstance().info(`Info tracked: ${message}`, {
      infoId: errorId,
      context
    })

    this.queue.push(infoEvent)
    this.processQueue()

    return errorId
  }

  private processQueue(): void {
    // In a real implementation, this would send to Sentry, LogRocket, Datadog, etc.
    // For now, we'll store in localStorage and optionally send to our own endpoint
    
    if (!this.isClient) return

    try {
      // Store recent errors in localStorage for debugging
      const recentErrors = this.queue.slice(-50) // Keep last 50 errors
      localStorage.setItem('care_collective_errors', JSON.stringify(recentErrors))
      
      // In production, send to external error tracking service
      if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_ERROR_TRACKING_ENDPOINT) {
        this.sendToExternalService()
      }
    } catch (e) {
      // Fail silently to avoid recursive errors
      console.warn('Failed to process error tracking queue:', e)
    }
  }

  private async sendToExternalService(): Promise<void> {
    if (this.queue.length === 0) return

    try {
      // Import here to avoid circular dependency issues
      const { careCollectiveErrorConfig } = await import('@/lib/config/error-tracking')

      if (!careCollectiveErrorConfig.isEnabled()) {
        return
      }

      const serviceConfig = careCollectiveErrorConfig.getServiceConfig()
      let endpoint: string | null = null

      if (serviceConfig.type === 'sentry' && serviceConfig.dsn) {
        // For Sentry, we would use their SDK instead of raw HTTP
        // This is a simplified version - in production use @sentry/nextjs
        endpoint = serviceConfig.dsn
      } else if (serviceConfig.type === 'custom' && serviceConfig.endpoint) {
        endpoint = serviceConfig.endpoint
      } else if (serviceConfig.type === 'development') {
        // Use our local error tracking endpoint for testing
        endpoint = `${window.location.origin}/api/error-tracking`
      }

      if (!endpoint) return

      const eventsToSend = this.queue.splice(0, 10) // Send up to 10 at a time

      // Sanitize events before sending
      const sanitizedEvents = eventsToSend.map(event => ({
        ...event,
        context: careCollectiveErrorConfig.sanitizeContext(event.context)
      }))

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      // Add API key if available
      if (serviceConfig.type === 'custom' && serviceConfig.apiKey) {
        headers['Authorization'] = `Bearer ${serviceConfig.apiKey}`
      }

      await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ events: sanitizedEvents })
      })
    } catch (error) {
      // Put events back in queue if sending failed
      const eventsToRequeue = arguments[0] as ErrorEvent[]
      if (eventsToRequeue) {
        this.queue.unshift(...eventsToRequeue)
      }
      console.warn('Failed to send errors to tracking service:', error)
    }
  }

  // Sentry-compatible interface
  setUser(user: { id?: string; email?: string; username?: string }): void {
    // Store user context for future error events
    if (this.isClient) {
      sessionStorage.setItem('error_tracking_user', JSON.stringify(user))
    }
  }

  setTag(key: string, value: string): void {
    // Store global tags
    if (this.isClient) {
      const tags = JSON.parse(sessionStorage.getItem('error_tracking_tags') || '{}')
      tags[key] = value
      sessionStorage.setItem('error_tracking_tags', JSON.stringify(tags))
    }
  }

  setContext(key: string, context: any): void {
    // Store global context
    if (this.isClient) {
      const contexts = JSON.parse(sessionStorage.getItem('error_tracking_contexts') || '{}')
      contexts[key] = context
      sessionStorage.setItem('error_tracking_contexts', JSON.stringify(contexts))
    }
  }

  addBreadcrumb(breadcrumb: {
    message: string
    category?: string
    level?: 'info' | 'warning' | 'error'
    data?: any
  }): void {
    if (!this.isClient) return

    try {
      const breadcrumbs = JSON.parse(sessionStorage.getItem('error_tracking_breadcrumbs') || '[]')
      breadcrumbs.push({
        ...breadcrumb,
        timestamp: new Date().toISOString()
      })

      // Keep only last 20 breadcrumbs
      if (breadcrumbs.length > 20) {
        breadcrumbs.splice(0, breadcrumbs.length - 20)
      }

      sessionStorage.setItem('error_tracking_breadcrumbs', JSON.stringify(breadcrumbs))
    } catch (e) {
      // Fail silently
    }
  }

  // Get stored user context
  private getUserContext(): any {
    if (!this.isClient) return {}
    
    try {
      return JSON.parse(sessionStorage.getItem('error_tracking_user') || '{}')
    } catch {
      return {}
    }
  }

  // Get stored tags
  private getTags(): Record<string, string> {
    if (!this.isClient) return {}
    
    try {
      return JSON.parse(sessionStorage.getItem('error_tracking_tags') || '{}')
    } catch {
      return {}
    }
  }

  // Utility method for React components
  withErrorTracking<T>(
    operation: () => T,
    context: ErrorContext = {}
  ): T | null {
    try {
      return operation()
    } catch (error) {
      this.captureError(error as Error, context, true)
      return null
    }
  }

  // Async version
  async withErrorTrackingAsync<T>(
    operation: () => Promise<T>,
    context: ErrorContext = {}
  ): Promise<T | null> {
    try {
      return await operation()
    } catch (error) {
      this.captureError(error as Error, context, true)
      return null
    }
  }
}

// Lazy singleton instance - only create when needed and in browser environment
let _errorTracker: ErrorTracker | null = null

function getErrorTracker(): ErrorTracker | null {
  if (typeof window === 'undefined') return null
  if (!_errorTracker) {
    _errorTracker = new ErrorTracker()
  }
  return _errorTracker
}

// Create a proxy object that safely delegates to the tracker
export const errorTracker = {
  captureError: (error: Error, context?: ErrorContext, handled = true) => {
    const tracker = getErrorTracker()
    if (tracker) return tracker.captureError(error, context, handled)
  },
  captureWarning: (message: string, context?: ErrorContext) => {
    const tracker = getErrorTracker()
    if (tracker) return tracker.captureWarning(message, context)
  },
  captureInfo: (message: string, context?: ErrorContext) => {
    const tracker = getErrorTracker()
    if (tracker) return tracker.captureInfo(message, context)
  },
  addBreadcrumb: (breadcrumb: any) => {
    const tracker = getErrorTracker()
    if (tracker) return tracker.addBreadcrumb(breadcrumb)
  },
  setUser: (user: any) => {
    const tracker = getErrorTracker()
    if (tracker) return tracker.setUser(user)
  },
  setTag: (key: string, value: string) => {
    const tracker = getErrorTracker()
    if (tracker) return tracker.setTag(key, value)
  },
  withErrorTracking: <T>(operation: () => T, context?: ErrorContext): T | null => {
    const tracker = getErrorTracker()
    if (tracker) return tracker.withErrorTracking(operation, context)
    return null
  },
  withErrorTrackingAsync: <T>(operation: () => Promise<T>, context?: ErrorContext): Promise<T | null> => {
    const tracker = getErrorTracker()
    if (tracker) return tracker.withErrorTrackingAsync(operation, context)
    return Promise.resolve(null)
  }
}

// Helper functions for easier usage with null checks
export const captureError = (error: Error, context?: ErrorContext) => {
  if (typeof window === 'undefined') return
  const tracker = getErrorTracker()
  if (tracker) tracker.captureError(error, context, true)
}

export const captureWarning = (message: string, context?: ErrorContext) => {
  if (typeof window === 'undefined') return
  const tracker = getErrorTracker()
  if (tracker) tracker.captureWarning(message, context)
}

export const captureInfo = (message: string, context?: ErrorContext) => {
  if (typeof window === 'undefined') return
  const tracker = getErrorTracker()
  if (tracker) tracker.captureInfo(message, context)
}

export const addBreadcrumb = (breadcrumb: {
  message: string
  category?: string
  level?: 'info' | 'warning' | 'error'
  data?: any
}) => {
  if (typeof window === 'undefined') return
  const tracker = getErrorTracker()
  if (tracker) tracker.addBreadcrumb(breadcrumb)
}

export const setUser = (user: { id?: string; email?: string; username?: string }) => {
  if (typeof window === 'undefined') return
  const tracker = getErrorTracker()
  if (tracker) tracker.setUser(user)
}

export const setTag = (key: string, value: string) => {
  if (typeof window === 'undefined') return
  const tracker = getErrorTracker()
  if (tracker) tracker.setTag(key, value)
}

export const withErrorTracking = <T>(
  operation: () => T,
  context?: ErrorContext
): T | null => {
  if (typeof window === 'undefined') return null
  const tracker = getErrorTracker()
  return tracker ? tracker.withErrorTracking(operation, context) : null
}

export const withErrorTrackingAsync = <T>(
  operation: () => Promise<T>,
  context?: ErrorContext
): Promise<T | null> => {
  if (typeof window === 'undefined') return Promise.resolve(null)
  const tracker = getErrorTracker()
  return tracker ? tracker.withErrorTrackingAsync(operation, context) : Promise.resolve(null)
}