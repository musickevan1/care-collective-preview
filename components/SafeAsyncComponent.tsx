'use client'

import { ReactNode, useEffect, useState } from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import { LoadingErrorState, NetworkErrorState } from './ErrorState'
import { useAsyncErrorHandler } from '@/hooks/useErrorHandler'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

interface SafeAsyncComponentProps<T> {
  asyncOperation: () => Promise<T>
  children: (data: T) => ReactNode
  loadingComponent?: ReactNode
  errorComponent?: ReactNode
  onError?: (error: Error) => void
  retry?: boolean
  retryCount?: number
  componentName?: string
  dependencies?: any[]
}

export function SafeAsyncComponent<T>({
  asyncOperation,
  children,
  loadingComponent,
  errorComponent,
  onError,
  retry = true,
  retryCount = 3,
  componentName = 'AsyncComponent',
  dependencies = []
}: SafeAsyncComponentProps<T>) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null
  })
  const [attemptCount, setAttemptCount] = useState(0)
  
  const { executeAsync, isError, error: handlerError, clearError } = useAsyncErrorHandler(componentName)

  const executeOperation = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    clearError()

    const result = await executeAsync(asyncOperation, `${componentName} data fetch`)
    
    if (result !== null) {
      setState({
        data: result,
        loading: false,
        error: null
      })
      setAttemptCount(0)
    } else {
      const finalError = handlerError || new Error('Operation failed')
      setState(prev => ({
        ...prev,
        loading: false,
        error: finalError
      }))
      
      if (onError) {
        onError(finalError)
      }
    }
  }

  const handleRetry = async () => {
    if (attemptCount < retryCount) {
      setAttemptCount(prev => prev + 1)
      await executeOperation()
    }
  }

  useEffect(() => {
    executeOperation()
  }, [executeOperation, ...dependencies])

  // Loading state
  if (state.loading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>
    }
    
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (state.error || isError) {
    if (errorComponent) {
      return <>{errorComponent}</>
    }

    // Determine error type for appropriate messaging
    const currentError = state.error || handlerError
    const errorMessage = currentError?.message || ''
    const isNetworkError = errorMessage.toLowerCase().includes('network') ||
                          errorMessage.toLowerCase().includes('fetch')

    if (isNetworkError) {
      return (
        <NetworkErrorState
          onRetry={retry && attemptCount < retryCount ? handleRetry : undefined}
          error={currentError || undefined}
        />
      )
    }

    return (
      <LoadingErrorState
        onRetry={retry && attemptCount < retryCount ? handleRetry : undefined}
        error={currentError || undefined}
        resourceName={componentName}
      />
    )
  }

  // Success state
  if (state.data) {
    return (
      <ErrorBoundary>
        {children(state.data)}
      </ErrorBoundary>
    )
  }

  // Fallback - should not reach here
  return (
    <LoadingErrorState
      onRetry={handleRetry}
      error={new Error('No data available')}
      resourceName={componentName}
    />
  )
}

// Specialized async component for API data fetching
interface SafeApiComponentProps<T> {
  endpoint: string
  children: (data: T) => ReactNode
  loadingComponent?: ReactNode
  errorComponent?: ReactNode
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: any
  headers?: Record<string, string>
  retry?: boolean
  dependencies?: any[]
}

export function SafeApiComponent<T>({
  endpoint,
  children,
  loadingComponent,
  errorComponent,
  method = 'GET',
  body,
  headers = {},
  retry = true,
  dependencies = []
}: SafeApiComponentProps<T>) {
  const asyncOperation = async (): Promise<T> => {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(endpoint, options)
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  return (
    <SafeAsyncComponent
      asyncOperation={asyncOperation}
      componentName={`API: ${endpoint}`}
      loadingComponent={loadingComponent}
      errorComponent={errorComponent}
      retry={retry}
      dependencies={[endpoint, method, body, ...dependencies]}
    >
      {children}
    </SafeAsyncComponent>
  )
}

// Hook for managing async state manually
export function useAsyncState<T>(
  asyncOperation: () => Promise<T>,
  dependencies: any[] = [],
  options: {
    immediate?: boolean
    retry?: boolean
    retryCount?: number
    componentName?: string
  } = {}
) {
  const {
    immediate = true,
    retry = true,
    retryCount = 3,
    componentName = 'useAsyncState'
  } = options

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null
  })
  const [attemptCount, setAttemptCount] = useState(0)
  
  const { executeAsync, isError, error: handlerError, clearError } = useAsyncErrorHandler(componentName)

  const execute = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    clearError()

    const result = await executeAsync(asyncOperation, `${componentName} operation`)
    
    if (result !== null) {
      setState({
        data: result,
        loading: false,
        error: null
      })
      setAttemptCount(0)
      return result
    } else {
      const finalError = handlerError || new Error('Operation failed')
      setState(prev => ({
        ...prev,
        loading: false,
        error: finalError
      }))
      throw finalError
    }
  }

  const retryOperation = async () => {
    if (retry && attemptCount < retryCount) {
      setAttemptCount(prev => prev + 1)
      return execute()
    }
  }

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [execute, immediate, ...dependencies])

  return {
    ...state,
    execute,
    retry: retryOperation,
    canRetry: retry && attemptCount < retryCount,
    attemptCount
  }
}