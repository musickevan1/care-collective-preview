import { NextResponse } from 'next/server'
import { logger } from './logger'
import { ZodError } from 'zod'

// Standard error codes for the Care Collective
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Resources
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  RESOURCE_UNAVAILABLE = 'RESOURCE_UNAVAILABLE',
  
  // Operations
  OPERATION_FAILED = 'OPERATION_FAILED',
  CONCURRENT_MODIFICATION = 'CONCURRENT_MODIFICATION',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // External Services
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // Server
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE'
}

export interface ApiError {
  code: ErrorCode
  message: string
  details?: any
  field?: string
  timestamp: string
  requestId?: string
  supportMessage?: string
}

export interface ApiErrorResponse {
  error: ApiError
  success: false
}

export interface ApiSuccessResponse<T = any> {
  data: T
  success: true
  message?: string
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse

// User-friendly messages for different error codes
const ERROR_MESSAGES: Record<ErrorCode, { user: string; support: string }> = {
  [ErrorCode.UNAUTHORIZED]: {
    user: "Please sign in to access this feature.",
    support: "If you're having trouble signing in, we're here to help."
  },
  [ErrorCode.FORBIDDEN]: {
    user: "You don't have permission to access this resource.",
    support: "If you believe this is an error, please contact our support team."
  },
  [ErrorCode.SESSION_EXPIRED]: {
    user: "Your session has expired. Please sign in again.",
    support: "For security, sessions automatically expire after a period of inactivity."
  },
  [ErrorCode.VALIDATION_ERROR]: {
    user: "Some information needs to be corrected.",
    support: "Please check the highlighted fields and try again."
  },
  [ErrorCode.MISSING_REQUIRED_FIELD]: {
    user: "Please fill in all required fields.",
    support: "All required information helps us better support our community."
  },
  [ErrorCode.INVALID_INPUT]: {
    user: "Please check your input and try again.",
    support: "Make sure all fields are filled out correctly."
  },
  [ErrorCode.NOT_FOUND]: {
    user: "We couldn't find what you're looking for.",
    support: "The resource may have been moved or is no longer available."
  },
  [ErrorCode.ALREADY_EXISTS]: {
    user: "This already exists in our system.",
    support: "You might be trying to create something that already exists."
  },
  [ErrorCode.RESOURCE_UNAVAILABLE]: {
    user: "This resource is temporarily unavailable.",
    support: "Please try again in a few moments."
  },
  [ErrorCode.OPERATION_FAILED]: {
    user: "We couldn't complete that action right now.",
    support: "Please try again. If the problem continues, we're here to help."
  },
  [ErrorCode.CONCURRENT_MODIFICATION]: {
    user: "Someone else made changes while you were working.",
    support: "Please refresh and try your changes again."
  },
  [ErrorCode.RATE_LIMIT_EXCEEDED]: {
    user: "You're doing that too frequently. Please wait a moment.",
    support: "This helps us keep our service stable for everyone."
  },
  [ErrorCode.DATABASE_ERROR]: {
    user: "We're having technical difficulties.",
    support: "Our team has been notified and is working to fix this."
  },
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: {
    user: "We're having trouble connecting to an external service.",
    support: "This is usually temporary. Please try again soon."
  },
  [ErrorCode.NETWORK_ERROR]: {
    user: "There seems to be a connection problem.",
    support: "Please check your internet connection and try again."
  },
  [ErrorCode.INTERNAL_SERVER_ERROR]: {
    user: "Something unexpected happened on our end.",
    support: "We've been notified and are looking into it. Please try again later."
  },
  [ErrorCode.SERVICE_UNAVAILABLE]: {
    user: "Our service is temporarily unavailable.",
    support: "We're working to restore service as quickly as possible."
  },
  [ErrorCode.MAINTENANCE_MODE]: {
    user: "We're currently performing maintenance.",
    support: "Service will be restored shortly. Thank you for your patience."
  }
}

export class CareCollectiveError extends Error {
  public readonly code: ErrorCode
  public readonly details?: any
  public readonly field?: string
  public readonly statusCode: number

  constructor(
    code: ErrorCode,
    message?: string,
    details?: any,
    field?: string,
    statusCode?: number
  ) {
    const errorMessage = message || ERROR_MESSAGES[code]?.user || 'An error occurred'
    super(errorMessage)
    
    this.name = 'CareCollectiveError'
    this.code = code
    this.details = details
    this.field = field
    this.statusCode = statusCode || this.getDefaultStatusCode(code)
  }

  private getDefaultStatusCode(code: ErrorCode): number {
    switch (code) {
      case ErrorCode.UNAUTHORIZED:
      case ErrorCode.SESSION_EXPIRED:
        return 401
      case ErrorCode.FORBIDDEN:
        return 403
      case ErrorCode.NOT_FOUND:
        return 404
      case ErrorCode.ALREADY_EXISTS:
        return 409
      case ErrorCode.VALIDATION_ERROR:
      case ErrorCode.MISSING_REQUIRED_FIELD:
      case ErrorCode.INVALID_INPUT:
        return 400
      case ErrorCode.RATE_LIMIT_EXCEEDED:
        return 429
      case ErrorCode.SERVICE_UNAVAILABLE:
      case ErrorCode.MAINTENANCE_MODE:
        return 503
      case ErrorCode.INTERNAL_SERVER_ERROR:
      case ErrorCode.DATABASE_ERROR:
      case ErrorCode.EXTERNAL_SERVICE_ERROR:
      default:
        return 500
    }
  }

  toApiError(requestId?: string): ApiError {
    const messages = ERROR_MESSAGES[this.code]
    
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      field: this.field,
      timestamp: new Date().toISOString(),
      requestId,
      supportMessage: messages?.support
    }
  }
}

// Helper function to create error responses
export function createErrorResponse(
  error: CareCollectiveError | Error | ZodError,
  requestId?: string
): NextResponse<ApiErrorResponse> {
  let careError: CareCollectiveError

  if (error instanceof CareCollectiveError) {
    careError = error
  } else if (error instanceof ZodError) {
    // Handle Zod validation errors
    const firstIssue = error.issues[0]
    careError = new CareCollectiveError(
      ErrorCode.VALIDATION_ERROR,
      `Invalid ${firstIssue?.path?.join('.')}: ${firstIssue?.message}`,
      error.issues,
      firstIssue?.path?.join('.')
    )
  } else {
    // Handle generic errors
    careError = new CareCollectiveError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      error.message || 'An unexpected error occurred'
    )
  }

  // Log the error
  logger.error(
    `API Error: ${careError.code}`,
    careError,
    {
      requestId,
      statusCode: careError.statusCode,
      details: careError.details
    }
  )

  const apiError = careError.toApiError(requestId)
  
  return NextResponse.json(
    { error: apiError, success: false },
    { status: careError.statusCode }
  )
}

// Helper function to create success responses
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    { data, success: true, message },
    { status }
  )
}

// Type guards for API responses
export function isApiError(response: any): response is ApiErrorResponse {
  return response && !response.success && response.error
}

export function isApiSuccess<T>(response: any): response is ApiSuccessResponse<T> {
  return response && response.success && response.data !== undefined
}

// Helper to throw specific errors
export const throwError = {
  unauthorized: (message?: string) => {
    throw new CareCollectiveError(ErrorCode.UNAUTHORIZED, message)
  },
  
  forbidden: (message?: string) => {
    throw new CareCollectiveError(ErrorCode.FORBIDDEN, message)
  },
  
  notFound: (resource?: string) => {
    const message = resource ? `${resource} not found` : undefined
    throw new CareCollectiveError(ErrorCode.NOT_FOUND, message)
  },
  
  validation: (message: string, field?: string) => {
    throw new CareCollectiveError(ErrorCode.VALIDATION_ERROR, message, undefined, field)
  },
  
  conflict: (message?: string) => {
    throw new CareCollectiveError(ErrorCode.ALREADY_EXISTS, message)
  },
  
  database: (error: Error) => {
    throw new CareCollectiveError(
      ErrorCode.DATABASE_ERROR,
      undefined,
      { originalError: error.message }
    )
  },
  
  rateLimit: () => {
    throw new CareCollectiveError(ErrorCode.RATE_LIMIT_EXCEEDED)
  }
}