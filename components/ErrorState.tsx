'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle, RefreshCw, Home, HelpCircle } from 'lucide-react'
import Link from 'next/link'

interface ErrorStateProps {
  title?: string
  message?: string
  error?: Error
  onRetry?: () => void
  showHomeButton?: boolean
  showHelpButton?: boolean
  variant?: 'error' | 'warning' | 'info'
  className?: string
}

export function ErrorState({
  title = "Something went wrong",
  message = "We encountered an unexpected issue. Please try again or contact support if the problem persists.",
  error,
  onRetry,
  showHomeButton = true,
  showHelpButton = true,
  variant = 'error',
  className = ''
}: ErrorStateProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          background: 'bg-yellow-50 dark:bg-yellow-950',
          text: 'text-yellow-800 dark:text-yellow-200',
          icon: '⚠️'
        }
      case 'info':
        return {
          background: 'bg-blue-50 dark:bg-blue-950',
          text: 'text-blue-800 dark:text-blue-200',
          icon: 'ℹ️'
        }
      default:
        return {
          background: 'bg-red-50 dark:bg-red-950',
          text: 'text-red-800 dark:text-red-200',
          icon: '💙'
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <Card className={`p-6 text-center ${className}`}>
      {/* Icon */}
      <div className="text-4xl mb-4">{styles.icon}</div>
      
      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>
      
      {/* Message */}
      <p className="text-muted-foreground mb-6 leading-relaxed">
        {message}
      </p>
      
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
        {onRetry && (
          <Button onClick={onRetry} variant="default" className="min-w-[120px]">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
          </Button>
        )}
        
        {showHomeButton && (
          <Link href="/">
            <Button variant="outline" className="min-w-[120px]">
              <Home className="w-4 h-4 mr-2" />
              Go home
            </Button>
          </Link>
        )}
        
        {showHelpButton && (
          <Link href="/help">
            <Button variant="ghost" className="min-w-[120px]">
              <HelpCircle className="w-4 h-4 mr-2" />
              Get help
            </Button>
          </Link>
        )}
      </div>
      
      {/* Support notice for errors */}
      {variant === 'error' && (
        <div className={`p-4 rounded-lg text-sm ${styles.background}`}>
          <p className={`font-medium mb-1 ${styles.text}`}>
            Need immediate support?
          </p>
          <p className={styles.text}>
            If you&apos;re in crisis or need urgent help, please reach out to local 
            emergency services or crisis hotlines in your area.
          </p>
        </div>
      )}
      
      {/* Development error details */}
      {process.env.NODE_ENV === 'development' && error && (
        <details className="mt-4 text-left">
          <summary className="cursor-pointer text-sm text-muted-foreground font-medium">
            Error details (development only)
          </summary>
          <div className="mt-2 p-3 bg-muted rounded text-xs">
            <div className="mb-2">
              <strong>Error:</strong> {error.message}
            </div>
            {error.stack && (
              <div>
                <strong>Stack trace:</strong>
                <pre className="whitespace-pre-wrap mt-1 overflow-auto max-h-32 text-xs">
                  {error.stack}
                </pre>
              </div>
            )}
          </div>
        </details>
      )}
    </Card>
  )
}

// Specific error state components for common scenarios
export function FormErrorState({ 
  onRetry, 
  error 
}: { 
  onRetry?: () => void
  error?: Error 
}) {
  return (
    <ErrorState
      title="Form submission failed"
      message="We couldn't process your request. Please check your information and try again."
      error={error}
      onRetry={onRetry}
      showHomeButton={false}
      variant="error"
    />
  )
}

export function LoadingErrorState({ 
  onRetry, 
  error,
  resourceName = "data"
}: { 
  onRetry?: () => void
  error?: Error
  resourceName?: string
}) {
  return (
    <ErrorState
      title={`Failed to load ${resourceName}`}
      message="We're having trouble loading this information. Please try refreshing the page."
      error={error}
      onRetry={onRetry}
      showHomeButton={false}
      variant="error"
    />
  )
}

export function NetworkErrorState({ 
  onRetry, 
  error 
}: { 
  onRetry?: () => void
  error?: Error 
}) {
  return (
    <ErrorState
      title="Connection problem"
      message="We're having trouble connecting to our servers. Please check your internet connection and try again."
      error={error}
      onRetry={onRetry}
      showHomeButton={false}
      variant="warning"
    />
  )
}

export function PermissionErrorState() {
  return (
    <ErrorState
      title="Access denied"
      message="You don't have permission to view this content. If you believe this is an error, please contact support."
      showHomeButton={true}
      showHelpButton={true}
      variant="warning"
    />
  )
}

export function MaintenanceErrorState() {
  return (
    <ErrorState
      title="Temporary maintenance"
      message="We're performing some maintenance to improve your experience. Please check back in a few minutes."
      showHomeButton={false}
      showHelpButton={false}
      variant="info"
    />
  )
}