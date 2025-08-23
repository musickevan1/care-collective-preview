'use client'

import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ReactNode } from 'react'

interface PageErrorBoundaryProps {
  children: ReactNode
  pageName?: string
}

export function PageErrorBoundary({ children, pageName }: PageErrorBoundaryProps) {
  const fallback = (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="p-8 text-center max-w-md">
        <div className="text-4xl mb-4">💙</div>
        <h1 className="text-2xl font-bold mb-3">
          Something went wrong{pageName ? ` on ${pageName}` : ''}
        </h1>
        <p className="text-muted-foreground mb-6">
          We know this is frustrating. Our community is here to support you, 
          and we&apos;re working to fix this issue.
        </p>
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => window.location.reload()} className="flex-1">
              Refresh page
            </Button>
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">
                Go home
              </Button>
            </Link>
          </div>
          <Link href="/help" className="block">
            <Button variant="ghost" className="w-full text-sm">
              Contact support
            </Button>
          </Link>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
          <p className="font-medium mb-1">Need immediate support?</p>
          <p>
            If you&apos;re in crisis or need urgent help, please reach out to local 
            emergency services or crisis hotlines in your area.
          </p>
        </div>
      </Card>
    </div>
  )

  return (
    <ErrorBoundary fallback={fallback}>
      {children}
    </ErrorBoundary>
  )
}