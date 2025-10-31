'use client'

import { lazy, Suspense } from 'react'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'

// Dynamically import admin components to reduce bundle size
const AdminReportingDashboard = lazy(() => import('./AdminReportingDashboard').then(m => ({ default: m.AdminReportingDashboard })))
const ModerationDashboard = lazy(() => import('./ModerationDashboard').then(m => ({ default: m.ModerationDashboard })))
const AdminPrivacyDashboard = lazy(() => import('./PrivacyDashboard').then(m => ({ default: m.AdminPrivacyDashboard })))
const BulkUserActions = lazy(() => import('./BulkUserActions').then(m => ({ default: m.BulkUserActions })))
const UserDetailModal = lazy(() => import('./UserDetailModal').then(m => ({ default: m.UserDetailModal })))
const UserActivityTimeline = lazy(() => import('./UserActivityTimeline').then(m => ({ default: m.UserActivityTimeline })))

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
        return <AdminPrivacyDashboard {...props} />
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
        type="card"
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
export const LazyAdminReporting = lazy(() => import('./AdminReportingDashboard').then(m => ({ default: m.AdminReportingDashboard })))
export const LazyModerationDashboard = lazy(() => import('./ModerationDashboard').then(m => ({ default: m.ModerationDashboard })))
export const LazyPrivacyDashboard = lazy(() => import('./PrivacyDashboard').then(m => ({ default: m.AdminPrivacyDashboard })))
export const LazyBulkUserActions = lazy(() => import('./BulkUserActions').then(m => ({ default: m.BulkUserActions })))
export const LazyUserDetailModal = lazy(() => import('./UserDetailModal').then(m => ({ default: m.UserDetailModal })))
export const LazyUserActivityTimeline = lazy(() => import('./UserActivityTimeline').then(m => ({ default: m.UserActivityTimeline })))