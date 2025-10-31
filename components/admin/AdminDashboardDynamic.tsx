'use client'

import { lazy, Suspense } from 'react'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import type { Database } from '@/lib/database.types'

type User = Database['public']['Tables']['profiles']['Row']
type HelpRequest = Database['public']['Tables']['help_requests']['Row']
type ContactExchange = Database['public']['Tables']['contact_exchanges']['Row']
type Message = Database['public']['Tables']['messages']['Row']

// Dynamically import admin components to reduce bundle size
const AdminReportingDashboard = lazy(() => import('./AdminReportingDashboard').then(m => ({ default: m.AdminReportingDashboard })))
const ModerationDashboard = lazy(() => import('./ModerationDashboard').then(m => ({ default: m.ModerationDashboard })))
const AdminPrivacyDashboard = lazy(() => import('./PrivacyDashboard').then(m => ({ default: m.AdminPrivacyDashboard })))
const BulkUserActions = lazy(() => import('./BulkUserActions').then(m => ({ default: m.BulkUserActions })))
const UserDetailModal = lazy(() => import('./UserDetailModal').then(m => ({ default: m.UserDetailModal })))
const UserActivityTimeline = lazy(() => import('./UserActivityTimeline').then(m => ({ default: m.UserActivityTimeline })))

type AdminComponentProps =
  | { component: 'reporting' }
  | { component: 'moderation'; adminUserId: string; className?: string }
  | { component: 'privacy'; adminUserId: string; className?: string }
  | { component: 'bulk-actions'; selectedUsers: User[]; onClearSelection: () => void; onRefresh: () => void }
  | { component: 'user-detail'; userId: string | null; isOpen: boolean; onClose: () => void }
  | { component: 'user-activity'; helpRequestsCreated: HelpRequest[]; helpRequestsHelped: HelpRequest[]; contactExchanges: ContactExchange[]; messages: Message[] }

export function AdminDashboardDynamic(props: AdminComponentProps) {
  const renderComponent = () => {
    switch (props.component) {
      case 'reporting':
        return <AdminReportingDashboard />
      case 'moderation':
        return <ModerationDashboard adminUserId={props.adminUserId} className={props.className} />
      case 'privacy':
        return <AdminPrivacyDashboard adminUserId={props.adminUserId} className={props.className} />
      case 'bulk-actions':
        return <BulkUserActions selectedUsers={props.selectedUsers} onClearSelection={props.onClearSelection} onRefresh={props.onRefresh} />
      case 'user-detail':
        return <UserDetailModal userId={props.userId} isOpen={props.isOpen} onClose={props.onClose} />
      case 'user-activity':
        return <UserActivityTimeline helpRequestsCreated={props.helpRequestsCreated} helpRequestsHelped={props.helpRequestsHelped} contactExchanges={props.contactExchanges} messages={props.messages} />
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