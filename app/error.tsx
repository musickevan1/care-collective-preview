'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'
import { errorTracker } from '@/lib/error-tracking'
// REMOVED: logger import causes React Error #419 (module-level singleton)
// import { logger } from '@/lib/logger'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Capture error with comprehensive Care Collective context
    const errorId = errorTracker.captureError(error, {
      component: 'GlobalErrorBoundary',
      severity: 'high',
      url: window.location.href,
      action: 'page_render',
      tags: {
        digest: error.digest || 'unknown',
        platform: 'care-collective',
        environment: process.env.NODE_ENV || 'development'
      },
      extra: {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        hasDigest: !!error.digest,
        errorType: error.constructor.name
      }
    }, true)

    // Log the error for monitoring and debugging
    // REMOVED: logger causes React Error #419 (module-level singleton)
    // errorTracker already captures this error above, so logger is redundant
    // logger.error('Global error boundary triggered', error, {
    //   errorId,
    //   component: 'GlobalErrorBoundary',
    //   digest: error.digest,
    //   url: window.location.href,
    //   category: 'ui_error'
    // })

    // Add breadcrumb for error context
    errorTracker.addBreadcrumb({
      message: 'Global error boundary caught error',
      category: 'ui',
      level: 'error',
      data: {
        errorMessage: error.message,
        hasStack: !!error.stack,
        digest: error.digest
      }
    })
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="text-center max-w-lg mx-auto p-8 shadow-lg border-sage/20">
        {/* Care Collective Branding */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-3">
            <Image 
              src="/logo.png" 
              alt="Care Collective Logo" 
              width={32} 
              height={32}
              className="rounded"
            />
            <span className="text-lg font-bold text-foreground">CARE Collective</span>
          </div>
        </div>
        
        {/* Supportive visual with Care Collective colors */}
        <div className="text-6xl mb-6" role="img" aria-label="Care icon">
          <div className="w-16 h-16 mx-auto bg-sage/10 rounded-full flex items-center justify-center">
            <span className="text-sage text-3xl">💚</span>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-4">
          We&apos;re having a moment
        </h1>
        
        <p className="text-muted-foreground mb-6 leading-relaxed">
          Something unexpected happened, but it&apos;s not your fault. 
          Our team has been notified and we&apos;re working to fix this. 
          Your wellbeing is our priority.
        </p>
        
        {/* Primary actions with Care Collective styling */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <Button 
            onClick={reset} 
            className="min-w-[120px] bg-sage hover:bg-sage-dark"
          >
            Try again
          </Button>
          <Link href="/">
            <Button variant="outline" className="min-w-[120px] border-sage text-sage hover:bg-sage/5">
              Go home
            </Button>
          </Link>
        </div>

        {/* Support options with brand colors */}
        <div className="border-t border-sage/20 pt-6 mt-6">
          <p className="text-sm text-muted-foreground mb-4">
            Need support right now?
          </p>
          <div className="flex flex-col sm:flex-row gap-2 text-sm">
            <Link href="/help" className="flex-1">
              <Button variant="ghost" size="sm" className="text-sage hover:text-sage-dark hover:bg-sage/5 w-full">
                Contact our support team
              </Button>
            </Link>
            <Link href="/resources" className="flex-1">
              <Button variant="ghost" size="sm" className="text-dusty-rose hover:text-dusty-rose-dark hover:bg-dusty-rose/5 w-full">
                Crisis resources
              </Button>
            </Link>
          </div>
        </div>

        {/* Crisis support notice with Care Collective colors */}
        <div className="mt-6 p-4 bg-sage/5 border border-sage/20 rounded-lg text-sm">
          <p className="font-medium text-sage-dark mb-1">
            In crisis or need immediate help?
          </p>
          <p className="text-sage">
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