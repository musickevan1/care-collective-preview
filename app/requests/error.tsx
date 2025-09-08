'use client'

import { useEffect, ReactElement } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, RotateCcw, Home } from 'lucide-react'

interface RequestErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function RequestError({ error, reset }: RequestErrorProps): ReactElement {
  useEffect(() => {
    // Enhanced error logging for request-specific errors
    console.error('[Request Error Boundary]', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      context: 'help-request-page'
    })

    // Log specific error types for better monitoring
    if (error.message.includes('Database error')) {
      console.error('[Request Error] Database connectivity issue detected')
    } else if (error.message.includes('Auth')) {
      console.error('[Request Error] Authentication issue detected')
    }
  }, [error])

  // Determine error type for better user messaging
  const isNetworkError = error.message.includes('fetch') || error.message.includes('network')
  const isDatabaseError = error.message.includes('Database error') || error.message.includes('Supabase')
  const isAuthError = error.message.includes('Auth') || error.message.includes('authentication')

  const getErrorTitle = (): string => {
    if (isDatabaseError) return 'Connection Issue'
    if (isAuthError) return 'Access Problem'
    if (isNetworkError) return 'Network Error'
    return 'Something Went Wrong'
  }

  const getErrorMessage = (): string => {
    if (isDatabaseError) {
      return 'We\'re having trouble connecting to our database. This is usually temporary.'
    }
    if (isAuthError) {
      return 'There seems to be an issue with your access permissions. You may need to sign in again.'
    }
    if (isNetworkError) {
      return 'We\'re having trouble reaching our servers. Please check your internet connection.'
    }
    return 'We encountered an unexpected error while loading this help request.'
  }

  const getRecoveryActions = (): ReactElement => {
    if (isAuthError) {
      return (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="bg-sage hover:bg-sage-dark">
            <Link href="/login" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Sign In Again
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-sage text-sage hover:bg-sage/5">
            <Link href="/requests" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Requests
            </Link>
          </Button>
        </div>
      )
    }

    return (
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button 
          onClick={reset} 
          className="bg-sage hover:bg-sage-dark flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Try Again
        </Button>
        <Button asChild variant="outline" className="border-sage text-sage hover:bg-sage/5">
          <Link href="/requests" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Browse Other Requests
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="text-center max-w-lg mx-auto shadow-lg border-sage/20">
        <CardHeader className="pb-4">
          {/* Error Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          
          <CardTitle className="text-2xl font-bold text-foreground">
            {getErrorTitle()}
          </CardTitle>
          
          <CardDescription className="text-base">
            {getErrorMessage()}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Recovery Actions */}
          {getRecoveryActions()}

          {/* Additional Help */}
          <div className="border-t border-sage/20 pt-6 mt-6">
            <p className="text-sm text-muted-foreground mb-4">
              Still having trouble?
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="ghost" size="sm" className="text-sage hover:text-sage-dark hover:bg-sage/5">
                <Link href="/dashboard">
                  Go to Dashboard
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="text-dusty-rose hover:text-dusty-rose-dark hover:bg-dusty-rose/5">
                <Link href="/help">
                  Contact Support
                </Link>
              </Button>
            </div>
          </div>

          {/* Emergency Support Notice */}
          <div className="mt-6 p-4 bg-sage/5 border border-sage/20 rounded-lg text-sm">
            <p className="font-medium text-sage-dark mb-1">
              Need urgent help right now?
            </p>
            <p className="text-sage">
              Don&apos;t wait for the app to work. Please reach out to local emergency services, friends, family, or community resources directly.
            </p>
          </div>

          {/* Development Error Details */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-sm text-muted-foreground font-medium">
                Error details (development only)
              </summary>
              <div className="mt-3 p-4 bg-muted rounded text-xs">
                <div className="mb-2">
                  <strong>Error:</strong> {error.message}
                </div>
                {error.digest && (
                  <div className="mb-2">
                    <strong>Digest:</strong> {error.digest}
                  </div>
                )}
                {error.stack && (
                  <div>
                    <strong>Stack trace:</strong>
                    <pre className="whitespace-pre-wrap mt-1 overflow-auto max-h-40">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  )
}