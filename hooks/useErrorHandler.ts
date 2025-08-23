'use client'

import { useCallback, useState } from 'react'
import { captureError, addBreadcrumb } from '@/lib/error-tracking'
import { CareCollectiveError, ErrorCode } from '@/lib/api-error'

interface ErrorState {
  error: Error | null
  isError: boolean
  errorCode?: ErrorCode
  errorMessage?: string
  supportMessage?: string
}

interface ErrorHandlerOptions {
  component?: string
  showToast?: boolean
  logError?: boolean
  trackError?: boolean
}

export function useErrorHandler(defaultOptions: ErrorHandlerOptions = {}) {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false
  })

  const handleError = useCallback((
    error: Error | CareCollectiveError,
    options: ErrorHandlerOptions = {}
  ) => {
    const mergedOptions = { ...defaultOptions, ...options }
    
    // Add breadcrumb for error tracking
    addBreadcrumb({
      message: `Error in ${mergedOptions.component || 'unknown component'}`,
      category: 'error',
      level: 'error',
      data: { error: error.message }
    })

    // Track error if enabled
    if (mergedOptions.trackError !== false) {
      captureError(error, {
        component: mergedOptions.component,
        severity: error instanceof CareCollectiveError ? 'medium' : 'high'
      })
    }

    // Update error state
    if (error instanceof CareCollectiveError) {
      setErrorState({
        error,
        isError: true,
        errorCode: error.code,
        errorMessage: error.message,
        supportMessage: error.toApiError().supportMessage
      })
    } else {
      setErrorState({
        error,
        isError: true,
        errorMessage: error.message
      })
    }

    // Log to console if enabled
    if (mergedOptions.logError !== false) {
      console.error(`Error in ${mergedOptions.component}:`, error)
    }
  }, [defaultOptions])

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false
    })
  }, [])

  const retry = useCallback((operation: () => void | Promise<void>) => {
    clearError()
    
    addBreadcrumb({
      message: 'User retrying after error',
      category: 'user_action',
      level: 'info'
    })

    try {
      const result = operation()
      if (result instanceof Promise) {
        result.catch(handleError)
      }
    } catch (error) {
      handleError(error as Error)
    }
  }, [handleError, clearError])

  return {
    ...errorState,
    handleError,
    clearError,
    retry
  }
}

// Specialized hooks for common error scenarios
export function useAsyncErrorHandler(component?: string) {
  const { handleError, ...rest } = useErrorHandler({ component })

  const executeAsync = useCallback(async <T>(
    operation: () => Promise<T>,
    errorContext?: string
  ): Promise<T | null> => {
    try {
      addBreadcrumb({
        message: `Starting async operation: ${errorContext || 'unknown'}`,
        category: 'async_operation',
        level: 'info'
      })

      const result = await operation()
      
      addBreadcrumb({
        message: `Async operation succeeded: ${errorContext || 'unknown'}`,
        category: 'async_operation',
        level: 'info'
      })

      return result
    } catch (error) {
      handleError(error as Error, { component })
      return null
    }
  }, [handleError, component])

  return {
    ...rest,
    executeAsync,
    handleError
  }
}

export function useFormErrorHandler(formName?: string) {
  const { handleError, ...rest } = useErrorHandler({ 
    component: `Form: ${formName || 'unknown'}` 
  })

  const handleSubmitError = useCallback((error: Error) => {
    addBreadcrumb({
      message: `Form submission failed: ${formName || 'unknown'}`,
      category: 'form_error',
      level: 'error',
      data: { form: formName, error: error.message }
    })

    handleError(error)
  }, [handleError, formName])

  const handleValidationError = useCallback((field: string, message: string) => {
    const validationError = new CareCollectiveError(
      ErrorCode.VALIDATION_ERROR,
      message,
      undefined,
      field
    )
    
    addBreadcrumb({
      message: `Validation error in ${formName || 'unknown'}: ${field}`,
      category: 'validation_error',
      level: 'warning',
      data: { form: formName, field, message }
    })

    handleError(validationError)
  }, [handleError, formName])

  return {
    ...rest,
    handleError,
    handleSubmitError,
    handleValidationError
  }
}

export function useApiErrorHandler(apiEndpoint?: string) {
  const { handleError, ...rest } = useErrorHandler({ 
    component: `API: ${apiEndpoint || 'unknown'}` 
  })

  const handleApiError = useCallback((error: Error, statusCode?: number) => {
    addBreadcrumb({
      message: `API error: ${apiEndpoint || 'unknown'}`,
      category: 'api_error',
      level: 'error',
      data: { endpoint: apiEndpoint, statusCode, error: error.message }
    })

    // Map common HTTP status codes to our error types
    let careError: CareCollectiveError
    
    if (statusCode === 401) {
      careError = new CareCollectiveError(ErrorCode.UNAUTHORIZED)
    } else if (statusCode === 403) {
      careError = new CareCollectiveError(ErrorCode.FORBIDDEN)
    } else if (statusCode === 404) {
      careError = new CareCollectiveError(ErrorCode.NOT_FOUND)
    } else if (statusCode === 429) {
      careError = new CareCollectiveError(ErrorCode.RATE_LIMIT_EXCEEDED)
    } else if (statusCode && statusCode >= 500) {
      careError = new CareCollectiveError(ErrorCode.INTERNAL_SERVER_ERROR)
    } else {
      careError = new CareCollectiveError(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        error.message
      )
    }

    handleError(careError)
  }, [handleError, apiEndpoint])

  const handleNetworkError = useCallback(() => {
    const networkError = new CareCollectiveError(ErrorCode.NETWORK_ERROR)
    
    addBreadcrumb({
      message: `Network error: ${apiEndpoint || 'unknown'}`,
      category: 'network_error',
      level: 'error',
      data: { endpoint: apiEndpoint }
    })

    handleError(networkError)
  }, [handleError, apiEndpoint])

  return {
    ...rest,
    handleError,
    handleApiError,
    handleNetworkError
  }
}