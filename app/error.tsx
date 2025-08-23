'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { captureError } from '@/lib/error-tracking'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Track the error with our error tracking system
    captureError(error, {
      component: 'GlobalErrorBoundary',
      severity: 'high',
      extra: { digest: error.digest }
    })
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="text-center max-w-lg mx-auto p-8">
        {/* Supportive visual - heart instead of warning */}
        <div className="text-6xl mb-6">💙</div>
        
        <h1 className="text-2xl font-bold text-foreground mb-4">
          We&apos;re having a moment
        </h1>
        
        <p className="text-muted-foreground mb-6 leading-relaxed">
          Something unexpected happened, but it&apos;s not your fault. 
          Our team has been notified and we&apos;re working to fix this. 
          Your wellbeing is our priority.
        </p>
        
        {/* Primary actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <Button onClick={reset} className="min-w-[120px]">
            Try again
          </Button>
          <Link href="/">
            <Button variant="outline" className="min-w-[120px]">
              Go home
            </Button>
          </Link>
        </div>

        {/* Support options */}
        <div className="border-t pt-6 mt-6">
          <p className="text-sm text-muted-foreground mb-4">
            Need support right now?
          </p>
          <div className="flex flex-col sm:flex-row gap-2 text-sm">
            <Link href="/help">
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                Contact our support team
              </Button>
            </Link>
            <Link href="/resources">
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                Crisis resources
              </Button>
            </Link>
          </div>
        </div>

        {/* Crisis support notice */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
          <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
            In crisis or need immediate help?
          </p>
          <p className="text-blue-700 dark:text-blue-300">
            Please reach out to local emergency services or crisis hotlines in your area. 
            Your safety and wellbeing matter.
          </p>
        </div>
        
        {/* Development error details */}
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
      </Card>
    </div>
  )
}