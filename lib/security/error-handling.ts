/**
 * Secure Error Handling System
 * Prevents information leakage while maintaining debuggability
 */

// Security-focused error types
export enum ErrorType {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION', 
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  SECURITY = 'SECURITY',
  UNKNOWN = 'UNKNOWN',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM', 
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Secure error class that sanitizes sensitive information
export class SecureError extends Error {
  public readonly type: ErrorType
  public readonly severity: ErrorSeverity
  public readonly userMessage: string
  public readonly internalMessage: string
  public readonly context?: Record<string, any>
  public readonly timestamp: Date
  public readonly id: string

  constructor(
    type: ErrorType,
    severity: ErrorSeverity,
    userMessage: string,
    internalMessage: string,
    context?: Record<string, any>
  ) {
    super(userMessage)
    this.name = 'SecureError'
    this.type = type
    this.severity = severity
    this.userMessage = userMessage
    this.internalMessage = internalMessage
    this.context = context ? sanitizeContext(context) : undefined
    this.timestamp = new Date()
    this.id = generateErrorId()
  }

  // Get user-safe error message
  getUserMessage(): string {
    // Never expose internal details to users
    switch (this.type) {
      case ErrorType.AUTHENTICATION:
        return 'Authentication failed. Please try logging in again.'
      case ErrorType.AUTHORIZATION:
        return 'You do not have permission to perform this action.'
      case ErrorType.VALIDATION:
        return this.userMessage // Already sanitized
      case ErrorType.NOT_FOUND:
        return 'The requested resource was not found.'
      case ErrorType.RATE_LIMIT:
        return 'Too many requests. Please try again later.'
      case ErrorType.DATABASE:
        return 'A system error occurred. Please try again later.'
      case ErrorType.NETWORK:
        return 'Network error. Please check your connection and try again.'
      case ErrorType.SECURITY:
        return 'A security error occurred. Please contact support.'
      default:
        return 'An unexpected error occurred. Please try again later.'
    }
  }

  // Get detailed message for logging (sanitized)
  getLogMessage(): string {
    return `[${this.type}:${this.severity}:${this.id}] ${this.internalMessage}`
  }

  // Get safe context for logging
  getLogContext(): Record<string, any> {
    return {
      id: this.id,
      type: this.type,
      severity: this.severity,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
    }
  }
}

// Sensitive data patterns to remove from logs
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /key/i,
  /auth/i,
  /session/i,
  /cookie/i,
  /email/i,
  /phone/i,
  /address/i,
  /ssn/i,
  /credit/i,
  /card/i,
] as const

// Sensitive data values to redact
const SENSITIVE_VALUES = [
  // Common auth headers
  'authorization',
  'x-auth-token',
  'x-api-key',
  // Supabase specific
  'sb-access-token',
  'sb-refresh-token',
  // General sensitive keys
  'password',
  'secret',
  'private_key',
] as const

// Sanitize context object to remove sensitive information
function sanitizeContext(context: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(context)) {
    const lowerKey = key.toLowerCase()
    
    // Check if key contains sensitive patterns
    const isSensitiveKey = SENSITIVE_PATTERNS.some(pattern => pattern.test(key)) ||
                          SENSITIVE_VALUES.some(sensitiveKey => lowerKey.includes(sensitiveKey))
    
    if (isSensitiveKey) {
      sanitized[key] = '[REDACTED]'
      continue
    }
    
    // Recursively sanitize nested objects
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeContext(value)
      continue
    }
    
    // Sanitize arrays
    if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'object' && item !== null ? sanitizeContext(item) : item
      )
      continue
    }
    
    // Check if value looks sensitive (basic patterns)
    if (typeof value === 'string') {
      // JWT tokens
      if (value.startsWith('ey') && value.includes('.')) {
        sanitized[key] = '[JWT_TOKEN_REDACTED]'
        continue
      }
      
      // Long alphanumeric strings that might be tokens/keys
      if (value.length > 20 && /^[A-Za-z0-9+/=_-]+$/.test(value)) {
        sanitized[key] = '[POSSIBLE_TOKEN_REDACTED]'
        continue
      }
      
      // Email addresses
      if (value.includes('@') && value.includes('.')) {
        const domain = value.substring(value.indexOf('@'))
        sanitized[key] = `[USER]${domain}`
        continue
      }
    }
    
    // Safe to include
    sanitized[key] = value
  }
  
  return sanitized
}

// Generate unique error ID for tracking
function generateErrorId(): string {
  return `err_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`
}

// Error factory functions for common scenarios
export const SecurityErrors = {
  authenticationFailed: (internalReason?: string, context?: Record<string, any>) =>
    new SecureError(
      ErrorType.AUTHENTICATION,
      ErrorSeverity.MEDIUM,
      'Authentication failed',
      internalReason || 'Authentication failed',
      context
    ),

  authorizationFailed: (resource: string, action: string, context?: Record<string, any>) =>
    new SecureError(
      ErrorType.AUTHORIZATION,
      ErrorSeverity.MEDIUM,
      'Access denied',
      `Access denied to ${resource} for action ${action}`,
      context
    ),

  validationFailed: (field: string, reason: string, context?: Record<string, any>) =>
    new SecureError(
      ErrorType.VALIDATION,
      ErrorSeverity.LOW,
      `Validation failed: ${reason}`,
      `Validation failed for field '${field}': ${reason}`,
      context
    ),

  notFound: (resource: string, context?: Record<string, any>) =>
    new SecureError(
      ErrorType.NOT_FOUND,
      ErrorSeverity.LOW,
      'Resource not found',
      `Resource not found: ${resource}`,
      context
    ),

  rateLimitExceeded: (limit: string, context?: Record<string, any>) =>
    new SecureError(
      ErrorType.RATE_LIMIT,
      ErrorSeverity.MEDIUM,
      'Rate limit exceeded',
      `Rate limit exceeded: ${limit}`,
      context
    ),

  databaseError: (operation: string, internalError?: string, context?: Record<string, any>) =>
    new SecureError(
      ErrorType.DATABASE,
      ErrorSeverity.HIGH,
      'Database error occurred',
      `Database error during ${operation}: ${internalError || 'unknown'}`,
      context
    ),

  securityViolation: (violation: string, context?: Record<string, any>) =>
    new SecureError(
      ErrorType.SECURITY,
      ErrorSeverity.CRITICAL,
      'Security violation detected',
      `Security violation: ${violation}`,
      context
    ),
}

// Secure logging function
export function logError(error: SecureError | Error, additionalContext?: Record<string, any>) {
  const timestamp = new Date().toISOString()
  
  if (error instanceof SecureError) {
    const logData = {
      ...error.getLogContext(),
      message: error.getLogMessage(),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      ...sanitizeContext(additionalContext || {}),
    }
    
    // Log based on severity
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        console.error(`[CRITICAL ERROR] ${timestamp}`, logData)
        break
      case ErrorSeverity.HIGH:
        console.error(`[ERROR] ${timestamp}`, logData)
        break
      case ErrorSeverity.MEDIUM:
        console.warn(`[WARNING] ${timestamp}`, logData)
        break
      case ErrorSeverity.LOW:
        console.log(`[INFO] ${timestamp}`, logData)
        break
    }
    
    // In production, send critical and high severity errors to monitoring service
    if (process.env.NODE_ENV === 'production' && 
        (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH)) {
      // TODO: Integrate with error monitoring service (Sentry, etc.)
      console.error('[MONITORING] Would send to error service:', logData)
    }
  } else {
    // Handle regular errors
    const sanitizedContext = sanitizeContext(additionalContext || {})
    const errorId = generateErrorId()
    
    console.error(`[UNKNOWN ERROR] ${timestamp}`, {
      id: errorId,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      context: sanitizedContext,
    })
  }
}

// Error boundary component helper
export function getErrorBoundaryMessage(error: Error): string {
  if (error instanceof SecureError) {
    return error.getUserMessage()
  }
  
  // Generic message for unknown errors
  return 'An unexpected error occurred. Please try again later.'
}

// API error response helper
export function createErrorResponse(error: SecureError | Error, statusCode?: number) {
  if (error instanceof SecureError) {
    const code = statusCode || getStatusCodeForErrorType(error.type)
    
    return {
      status: code,
      body: {
        error: {
          type: error.type,
          message: error.getUserMessage(),
          id: error.id,
          timestamp: error.timestamp.toISOString(),
        },
      },
    }
  }
  
  // Generic response for unknown errors
  return {
    status: statusCode || 500,
    body: {
      error: {
        type: ErrorType.UNKNOWN,
        message: 'An unexpected error occurred',
        id: generateErrorId(),
        timestamp: new Date().toISOString(),
      },
    },
  }
}

// Map error types to HTTP status codes
function getStatusCodeForErrorType(type: ErrorType): number {
  switch (type) {
    case ErrorType.AUTHENTICATION:
      return 401
    case ErrorType.AUTHORIZATION:
      return 403
    case ErrorType.VALIDATION:
      return 400
    case ErrorType.NOT_FOUND:
      return 404
    case ErrorType.RATE_LIMIT:
      return 429
    case ErrorType.DATABASE:
    case ErrorType.NETWORK:
    case ErrorType.SECURITY:
    case ErrorType.UNKNOWN:
    default:
      return 500
  }
}

// Utility to wrap async functions with error handling
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  errorContext?: string
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      if (error instanceof SecureError) {
        logError(error, { context: errorContext, args: sanitizeContext({ args }) })
        throw error
      }
      
      // Convert unknown errors to SecureError
      const secureError = new SecureError(
        ErrorType.UNKNOWN,
        ErrorSeverity.HIGH,
        'An unexpected error occurred',
        error instanceof Error ? error.message : 'Unknown error',
        { originalError: error, context: errorContext }
      )
      
      logError(secureError)
      throw secureError
    }
  }
}

// Type exports for TypeScript
export type ErrorContext = Record<string, any>
export type ErrorHandler<T> = (error: SecureError) => T