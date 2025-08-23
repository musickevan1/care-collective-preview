'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // Log error for monitoring
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // This would integrate with your error tracking service
      // Example: Sentry.captureException(error, { extra: errorInfo })
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default supportive error UI
      return (
        <Card className="p-8 text-center max-w-lg mx-auto mt-8">
          <div className="text-4xl mb-4">🌱</div>
          <h2 className="text-xl font-semibold mb-3 text-foreground">
            We&apos;re having a moment
          </h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Something unexpected happened, but it&apos;s not your fault. 
            We&apos;re here to support you - please try again or reach out 
            if you need immediate assistance.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => this.setState({ hasError: false })}
              className="min-w-[120px]"
            >
              Try again
            </Button>
            <Link href="/">
              <Button variant="outline" className="min-w-[120px]">
                Go to home
              </Button>
            </Link>
            <Link href="/help">
              <Button variant="outline" className="min-w-[120px]">
                Get help
              </Button>
            </Link>
          </div>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-6 text-left bg-muted p-4 rounded">
              <summary className="cursor-pointer text-sm font-medium mb-2">
                Development Info
              </summary>
              <div className="text-xs space-y-2">
                <div>
                  <strong>Error:</strong> {this.state.error.message}
                </div>
                {this.state.error.stack && (
                  <div>
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap mt-1 text-xs">
                      {this.state.error.stack}
                    </pre>
                  </div>
                )}
                {this.state.errorInfo?.componentStack && (
                  <div>
                    <strong>Component Stack:</strong>
                    <pre className="whitespace-pre-wrap mt-1 text-xs">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </Card>
      )
    }

    return this.props.children
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}