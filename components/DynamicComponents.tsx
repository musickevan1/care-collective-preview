'use client'

import dynamic from 'next/dynamic'
import { ComponentType, Suspense, ReactElement } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Loading component for dynamic imports
export function ComponentLoader({ title }: { title?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || 'Loading...'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
      </CardContent>
    </Card>
  )
}

// Dynamic import with error boundary
function withDynamicLoading<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  loadingComponent?: () => ReactElement,
  errorMessage?: string
) {
  return dynamic(importFn, {
    loading: loadingComponent || (() => <ComponentLoader />),
    ssr: false, // Disable SSR for dynamic components that may not be needed immediately
  })
}

// Admin Components - Heavy components that are only loaded when needed
export const DynamicAdminRequestActions = withDynamicLoading(
  () => import('@/app/admin/help-requests/AdminRequestActions'),
  () => <ComponentLoader title="Admin Actions" />
)

export const DynamicContactExchange = withDynamicLoading(
  () => import('@/components/ContactExchange'),
  () => <ComponentLoader title="Contact Exchange" />
)

export const DynamicRequestActions = withDynamicLoading(
  () => import('@/app/requests/[id]/RequestActions'),
  () => <ComponentLoader title="Request Actions" />
)

// Charts and Analytics (if added later)
export const DynamicChart = withDynamicLoading(
  () => Promise.resolve({ default: () => <div>Chart not available</div> }),
  () => <ComponentLoader title="Chart" />
)

// Mobile Navigation - Only load when needed
export const DynamicMobileNav = withDynamicLoading(
  () => import('@/components/MobileNav'),
  () => <div className="md:hidden">Loading menu...</div>
)

// Performance monitoring components (disabled for deployment)
// These components caused "self is not defined" errors during build
// Providing null placeholders to prevent import errors
export const DynamicWebVitals = () => null

export const DynamicServiceWorkerRegistration = () => null

// Form components that might be heavy
export const DynamicSafeFormWrapper = withDynamicLoading(
  () => import('@/components/SafeFormWrapper'),
  () => <div>Loading form...</div>
)

// Lazy section wrapper for below-the-fold content
export function DynamicLazySection({ 
  children, 
  fallback = <ComponentLoader />,
  threshold = 0.1 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode
  threshold?: number 
}) {
  const LazySection = dynamic(
    () => import('@/components/LazySection'),
    { ssr: false, loading: () => <>{fallback}</> }
  )
  
  return (
    <Suspense fallback={fallback}>
      <LazySection threshold={threshold}>
        {children}
      </LazySection>
    </Suspense>
  )
}

// Error boundary wrapper for dynamic components
export function DynamicErrorBoundary({ children }: { children: React.ReactNode }) {
  const ErrorBoundary = dynamic(
    () => import('@/components/ErrorBoundary'),
    { ssr: false, loading: () => <>{children}</> }
  )
  
  return <ErrorBoundary>{children}</ErrorBoundary>
}