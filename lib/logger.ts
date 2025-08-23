import { format } from 'date-fns'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, any>
  error?: Error
  userId?: string
  requestId?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isClient = typeof window !== 'undefined'
  
  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, context, error } = entry
    
    let logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`
    
    if (context && Object.keys(context).length > 0) {
      logMessage += `\nContext: ${JSON.stringify(context, null, 2)}`
    }
    
    if (error) {
      logMessage += `\nError: ${error.message}`
      if (error.stack) {
        logMessage += `\nStack: ${error.stack}`
      }
    }
    
    return logMessage
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true
    
    // In production, only log warnings and errors
    return level === 'warn' || level === 'error'
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS'),
      level,
      message,
      context,
      error,
      // Add request context if available
      requestId: this.isClient ? undefined : this.getRequestId(),
      userId: this.getCurrentUserId()
    }
  }

  private getRequestId(): string | undefined {
    // This would be set by middleware in a real application
    // For now, return undefined
    return undefined
  }

  private getCurrentUserId(): string | undefined {
    // This would get the current user ID from your auth system
    // For now, return undefined
    return undefined
  }

  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return

    const formattedMessage = this.formatLog(entry)

    // Console logging with appropriate method
    switch (entry.level) {
      case 'debug':
        console.debug(formattedMessage)
        break
      case 'info':
        console.info(formattedMessage)
        break
      case 'warn':
        console.warn(formattedMessage)
        break
      case 'error':
        console.error(formattedMessage)
        break
    }

    // In production, send to external logging service
    if (!this.isDevelopment && this.isClient) {
      this.sendToExternalService(entry)
    }
  }

  private sendToExternalService(entry: LogEntry): void {
    // This would send logs to your monitoring service
    // Example: DataDog, LogRocket, Sentry, etc.
    
    // Only use localStorage if we're in the browser
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return
    }
    
    // For now, we'll just store in localStorage for debugging
    try {
      const logs = JSON.parse(localStorage.getItem('care_collective_logs') || '[]')
      logs.push(entry)
      
      // Keep only last 100 logs to avoid storage bloat
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100)
      }
      
      localStorage.setItem('care_collective_logs', JSON.stringify(logs))
    } catch (e) {
      // Fail silently if localStorage is not available
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry('debug', message, context)
    this.log(entry)
  }

  info(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry('info', message, context)
    this.log(entry)
  }

  warn(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry('warn', message, context)
    this.log(entry)
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    const entry = this.createLogEntry('error', message, context, error)
    this.log(entry)
  }

  // Specialized logging methods for common scenarios
  userAction(action: string, userId?: string, context?: Record<string, any>): void {
    this.info(`User action: ${action}`, {
      ...context,
      userId,
      category: 'user_action'
    })
  }

  apiCall(method: string, url: string, statusCode?: number, duration?: number): void {
    const level = statusCode && statusCode >= 400 ? 'error' : 'info'
    const message = `API ${method} ${url}`
    
    this.log(this.createLogEntry(level, message, {
      method,
      url,
      statusCode,
      duration,
      category: 'api_call'
    }))
  }

  databaseOperation(operation: string, table?: string, success: boolean = true, error?: Error): void {
    const level = success ? 'info' : 'error'
    const message = `Database ${operation}${table ? ` on ${table}` : ''}`
    
    this.log(this.createLogEntry(level, message, {
      operation,
      table,
      success,
      category: 'database'
    }, error))
  }

  securityEvent(event: string, severity: 'low' | 'medium' | 'high', context?: Record<string, any>): void {
    this.warn(`Security event: ${event}`, {
      ...context,
      severity,
      category: 'security'
    })
  }

  performanceMetric(metric: string, value: number, unit: string = 'ms'): void {
    this.info(`Performance: ${metric}`, {
      metric,
      value,
      unit,
      category: 'performance'
    })
  }
}

// Export singleton instance
export const logger = new Logger()

// Export types for use in other modules
export type { LogEntry, LogLevel }