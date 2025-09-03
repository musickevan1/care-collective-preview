/**
 * @fileoverview Structured Logging Utility
 * 
 * Addresses Issue #12 from TESTING_ISSUES_AND_FIXES.md - Console Warnings in Development
 * Provides configurable logging with levels and structured output
 */

// Log levels in order of severity
export const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
} as const

export type LogLevel = keyof typeof LOG_LEVELS
export type LogLevelValue = typeof LOG_LEVELS[LogLevel]

// Log context for structured logging
export interface LogContext {
  component?: string
  userId?: string
  requestId?: string
  sessionId?: string
  action?: string
  [key: string]: any
}

// Log entry structure
export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: LogContext
  error?: Error
}

/**
 * Main Logger class with configurable levels and output
 */
class Logger {
  private level: LogLevelValue
  private isDevelopment: boolean
  private isTest: boolean
  
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
    this.isTest = process.env.NODE_ENV === 'test'
    
    // Determine log level from environment
    const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel
    
    if (envLevel && envLevel in LOG_LEVELS) {
      this.level = LOG_LEVELS[envLevel]
    } else if (this.isTest) {
      this.level = LOG_LEVELS.error // Only errors in tests
    } else if (this.isDevelopment) {
      this.level = LOG_LEVELS.debug // All logs in development
    } else {
      this.level = LOG_LEVELS.warn // Warnings and errors in production
    }
  }
  
  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] <= this.level
  }
  
  /**
   * Format log entry for output
   */
  private formatLogEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp
    const level = entry.level.toUpperCase().padEnd(5)
    
    let formatted = `[${timestamp}] ${level} ${entry.message}`
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      const contextStr = Object.entries(entry.context)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(' ')
      formatted += ` {${contextStr}}`
    }
    
    return formatted
  }
  
  /**
   * Get appropriate console method for log level
   */
  private getConsoleMethod(level: LogLevel): Console[keyof Console] {
    switch (level) {
      case 'error':
        return console.error
      case 'warn':
        return console.warn
      case 'info':
        return console.info
      case 'debug':
        return console.log
      default:
        return console.log
    }
  }
  
  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) {
      return
    }
    
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    }
    
    const consoleMethod = this.getConsoleMethod(level)
    const formatted = this.formatLogEntry(entry)
    
    if (error) {
      consoleMethod(formatted, error)
    } else {
      consoleMethod(formatted)
    }
    
    // In production, send to monitoring service
    if (!this.isDevelopment && !this.isTest && level === 'error') {
      this.sendToMonitoringService(entry).catch(() => {
        // Silently fail monitoring to not break application
      })
    }
  }
  
  /**
   * Send error logs to monitoring service
   */
  private async sendToMonitoringService(entry: LogEntry): Promise<void> {
    try {
      // Example implementation - replace with your monitoring service
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry),
      // })
      console.log('[Logger] Would send to monitoring:', entry)
    } catch (error) {
      // Silent fail - don't break application for logging issues
    }
  }
  
  /**
   * Error level logging
   */
  error(message: string, context?: LogContext, error?: Error): void {
    this.log('error', message, context, error)
  }
  
  /**
   * Warning level logging
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context)
  }
  
  /**
   * Info level logging
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context)
  }
  
  /**
   * Debug level logging
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context)
  }
  
  /**
   * Set log level dynamically
   */
  setLevel(level: LogLevel): void {
    this.level = LOG_LEVELS[level]
  }
  
  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return Object.keys(LOG_LEVELS).find(
      key => LOG_LEVELS[key as LogLevel] === this.level
    ) as LogLevel
  }
  
  /**
   * Create a child logger with default context
   */
  child(defaultContext: LogContext): Logger {
    const childLogger = new Logger()
    
    // Override logging methods to include default context
    const originalLog = childLogger.log.bind(childLogger)
    childLogger.log = (level: LogLevel, message: string, context?: LogContext, error?: Error) => {
      const mergedContext = { ...defaultContext, ...context }
      originalLog(level, message, mergedContext, error)
    }
    
    return childLogger
  }
}

// Create and export default logger instance
export const logger = new Logger()

/**
 * Component-specific loggers for better organization
 */
export const authLogger = logger.child({ component: 'auth' })
export const dbLogger = logger.child({ component: 'database' })
export const apiLogger = logger.child({ component: 'api' })
export const uiLogger = logger.child({ component: 'ui' })

/**
 * Utility functions for common logging patterns
 */

/**
 * Log user actions for analytics and debugging
 */
export function logUserAction(
  action: string,
  userId?: string,
  metadata?: Record<string, any>
): void {
  logger.info('User action', {
    action,
    userId,
    ...metadata,
  })
}

/**
 * Log API requests and responses
 */
export function logApiCall(
  method: string,
  url: string,
  statusCode?: number,
  duration?: number,
  error?: Error
): void {
  const level = error ? 'error' : statusCode && statusCode >= 400 ? 'warn' : 'info'
  const message = `${method} ${url} ${statusCode || 'pending'}`
  
  logger[level](message, {
    method,
    url,
    statusCode,
    duration,
  }, error)
}

/**
 * Log database operations
 */
export function logDatabaseOperation(
  operation: string,
  table: string,
  duration?: number,
  recordCount?: number,
  error?: Error
): void {
  const level = error ? 'error' : 'debug'
  const message = `Database ${operation} on ${table}`
  
  dbLogger[level](message, {
    operation,
    table,
    duration,
    recordCount,
  }, error)
}

/**
 * Log authentication events
 */
export function logAuthEvent(
  event: 'login' | 'logout' | 'signup' | 'refresh' | 'error',
  userId?: string,
  error?: Error
): void {
  const level = error || event === 'error' ? 'error' : 'info'
  const message = `Authentication ${event}`
  
  authLogger[level](message, {
    event,
    userId,
  }, error)
}

/**
 * Log component lifecycle events (development only)
 */
export function logComponentEvent(
  component: string,
  event: 'mount' | 'unmount' | 'render' | 'error',
  props?: Record<string, any>,
  error?: Error
): void {
  if (process.env.NODE_ENV === 'production') {
    return
  }
  
  const level = error ? 'error' : 'debug'
  const message = `Component ${component} ${event}`
  
  uiLogger[level](message, {
    component,
    event,
    props,
  }, error)
}

/**
 * Performance logging
 */
export function logPerformance(
  metric: string,
  value: number,
  unit: 'ms' | 'bytes' | 'count' = 'ms',
  context?: LogContext
): void {
  logger.info(`Performance: ${metric}`, {
    metric,
    value,
    unit,
    ...context,
  })
}

/**
 * Security event logging
 */
export function logSecurityEvent(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  userId?: string,
  details?: Record<string, any>
): void {
  const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn'
  
  logger[level](`Security event: ${event}`, {
    securityEvent: event,
    severity,
    userId,
    ...details,
  })
}

/**
 * Debug helper for development
 */
export function debugLog(message: string, data?: any): void {
  if (process.env.NODE_ENV === 'development') {
    logger.debug(message, { debugData: data })
  }
}

/**
 * Create a logger for a specific feature or module
 */
export function createFeatureLogger(feature: string): Logger {
  return logger.child({ feature })
}

/**
 * Middleware for request logging
 */
export function createRequestLogger(requestId: string, userId?: string): Logger {
  return logger.child({ requestId, userId })
}

/**
 * Error boundary logging helper
 */
export function logErrorBoundary(
  error: Error,
  errorInfo: { componentStack: string },
  component?: string
): void {
  logger.error('React Error Boundary', {
    component: component || 'Unknown',
    componentStack: errorInfo.componentStack,
  }, error)
}

/**
 * Utility to suppress console warnings in tests
 */
export function suppressConsoleWarnings(): () => void {
  const originalWarn = console.warn
  console.warn = (...args: any[]) => {
    // Only suppress React warnings and other known noisy warnings
    const message = args[0]
    if (
      typeof message === 'string' &&
      (message.includes('React') ||
       message.includes('Warning:') ||
       message.includes('deprecated'))
    ) {
      return
    }
    originalWarn(...args)
  }
  
  // Return cleanup function
  return () => {
    console.warn = originalWarn
  }
}

// Export types for external use
export type { LogLevel, LogContext, LogEntry }