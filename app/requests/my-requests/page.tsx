/**
 * @fileoverview My Requests Page - User's Request History
 * Shows all of user's help requests with status filtering and modal detail view
 */

import { createClient } from '@/lib/supabase/server'
import { getProfileWithServiceRole } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PlatformLayout } from '@/components/layout/PlatformLayout'
import { RequestsListWithModal } from '@/components/help-requests/RequestsListWithModal'
import Link from 'next/link'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'

interface PageProps {
  searchParams: Promise<{
    status?: string;
  }>
}

type User = {
  id: string
  name: string
  email: string
  verification_status: string
  is_admin: boolean
}

async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  const profile = await getProfileWithServiceRole(user.id)

  if (profile.verification_status !== 'approved' && !profile.is_admin) {
    return null
  }

  return {
    id: user.id,
    name: profile?.name || user.email?.split('@')[0] || 'Unknown',
    email: user.email || '',
    verification_status: profile.verification_status,
    is_admin: profile.is_admin
  }
}

async function getMessagingData(userId: string) {
  const supabase = await createClient()

  try {
    const { count: unreadCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .is('read_at', null)

    const { data: conversations } = await supabase
      .from('conversations')
      .select(`
        id,
        conversation_participants!inner (user_id)
      `)
      .eq('conversation_participants.user_id', userId)
      .is('conversation_participants.left_at', null)

    return {
      unreadCount: unreadCount || 0,
      activeConversations: conversations?.length || 0
    }
  } catch (error) {
    return { unreadCount: 0, activeConversations: 0 }
  }
}

async function getUserRequests(userId: string, statusFilter: string = 'all') {
  const supabase = await createClient()

  try {
    let query = supabase
      .from('help_requests')
      .select('*')
      .eq('user_id', userId)

    // Apply status filter
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    query = query.order('created_at', { ascending: false })

    const { data: requests, error } = await query

    if (error) {
      console.error('[My Requests] Error fetching requests:', error)
      return []
    }

    if (!requests || requests.length === 0) {
      return []
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, location')
      .eq('id', userId)
      .single()

    // Get helper profiles if needed
    const helperIds = requests
      .filter(req => req.helper_id)
      .map(req => req.helper_id)
      .filter((id): id is string => id !== null)

    let helperProfiles = new Map()
    if (helperIds.length > 0) {
      const { data: helpers } = await supabase
        .from('profiles')
        .select('id, name, location')
        .in('id', helperIds)

      helpers?.forEach(helper => {
        helperProfiles.set(helper.id, helper)
      })
    }

    // Merge data
    return requests.map(req => ({
      ...req,
      profiles: profile || { name: 'Unknown User', location: null },
      helper: req.helper_id ? helperProfiles.get(req.helper_id) : null
    }))

  } catch (error) {
    console.error('[My Requests] Exception:', error)
    return []
  }
}

export default async function MyRequestsPage({ searchParams }: PageProps) {
  const user = await getUser()

  if (!user) {
    redirect('/login?redirect=/requests/my-requests')
  }

  const params = await searchParams
  const statusFilter = params.status || 'all'

  const messagingData = await getMessagingData(user.id)
  const requests = await getUserRequests(user.id, statusFilter)

  // Count by status
  const statusCounts = {
    all: requests.length,
    open: requests.filter(r => r.status === 'open').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
    cancelled: requests.filter(r => r.status === 'cancelled').length
  }

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'My Requests', href: '/requests/my-requests' }
  ]

  return (
    <PlatformLayout
      user={user}
      messagingData={messagingData}
      breadcrumbs={breadcrumbs}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-secondary">My Help Requests</h1>
            <p className="text-muted-foreground">View and manage all your help requests</p>
          </div>
          <Link href="/requests/new">
            <Button>Create New Request</Button>
          </Link>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Link href="/requests/my-requests">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
            >
              All ({statusCounts.all})
            </Button>
          </Link>
          <Link href="/requests/my-requests?status=open">
            <Button
              variant={statusFilter === 'open' ? 'default' : 'outline'}
              size="sm"
            >
              Open ({statusCounts.open})
            </Button>
          </Link>
          <Link href="/requests/my-requests?status=in_progress">
            <Button
              variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
              size="sm"
            >
              In Progress ({statusCounts.in_progress})
            </Button>
          </Link>
          <Link href="/requests/my-requests?status=completed">
            <Button
              variant={statusFilter === 'completed' ? 'default' : 'outline'}
              size="sm"
            >
              Completed ({statusCounts.completed})
            </Button>
          </Link>
          <Link href="/requests/my-requests?status=cancelled">
            <Button
              variant={statusFilter === 'cancelled' ? 'outline' : 'outline'}
              size="sm"
            >
              Cancelled ({statusCounts.cancelled})
            </Button>
          </Link>
        </div>

        {/* Requests List */}
        {requests.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {statusFilter === 'all'
                  ? "No Requests Yet"
                  : `No ${statusFilter.replace('_', ' ')} Requests`}
              </h3>
              <p className="text-muted-foreground mb-6">
                {statusFilter === 'all'
                  ? "You haven't created any help requests yet. Start by creating your first request!"
                  : `You don't have any ${statusFilter.replace('_', ' ')} requests.`}
              </p>
              {statusFilter === 'all' && (
                <Link href="/requests/new">
                  <Button>Create First Request</Button>
                </Link>
              )}
              {statusFilter !== 'all' && (
                <Link href="/requests/my-requests">
                  <Button variant="outline">View All Requests</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {requests.length} Request{requests.length !== 1 ? 's' : ''}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {statusFilter === 'all'
                    ? 'All your help requests'
                    : `Showing ${statusFilter.replace('_', ' ')} requests`}
                </p>
              </div>
            </div>

            <RequestsListWithModal
              requests={requests as any}
              currentUserId={user.id}
            />
          </div>
        )}
      </div>
    </PlatformLayout>
  )
}
