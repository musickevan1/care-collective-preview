'use client'

import { lazy, Suspense } from 'react'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'

// Dynamically import admin components to reduce bundle size
const AdminReportingDashboard = lazy(() => import('./AdminReportingDashboard'))
const ModerationDashboard = lazy(() => import('./ModerationDashboard'))
const PrivacyDashboard = lazy(() => import('./PrivacyDashboard'))
const BulkUserActions = lazy(() => import('./BulkUserActions'))
const UserDetailModal = lazy(() => import('./UserDetailModal'))
const UserActivityTimeline = lazy(() => import('./UserActivityTimeline'))

interface AdminComponentProps {
  component: 'reporting' | 'moderation' | 'privacy' | 'bulk-actions' | 'user-detail' | 'user-activity'
  [key: string]: any
}

export function AdminDashboardDynamic({ component, ...props }: AdminComponentProps) {
  const renderComponent = () => {
    switch (component) {
      case 'reporting':
        return <AdminReportingDashboard {...props} />
      case 'moderation':
        return <ModerationDashboard {...props} />
      case 'privacy':
        return <PrivacyDashboard {...props} />
      case 'bulk-actions':
        return <BulkUserActions {...props} />
      case 'user-detail':
        return <UserDetailModal {...props} />
      case 'user-activity':
        return <UserActivityTimeline {...props} />
      default:
        return <div>Unknown admin component</div>
    }
  }

  return (
    <Suspense fallback={
      <LoadingSkeleton
        lines={6}
        className="space-y-4"
        aria-label="Loading admin dashboard component"
      />
    }>
      {renderComponent()}
    </Suspense>
  )
}

// Export individual lazy components for direct use
export const LazyAdminReporting = lazy(() => import('./AdminReportingDashboard'))
export const LazyModerationDashboard = lazy(() => import('./ModerationDashboard'))
export const LazyPrivacyDashboard = lazy(() => import('./PrivacyDashboard'))
export const LazyBulkUserActions = lazy(() => import('./BulkUserActions'))
export const LazyUserDetailModal = lazy(() => import('./UserDetailModal'))
export const LazyUserActivityTimeline = lazy(() => import('./UserActivityTimeline'))