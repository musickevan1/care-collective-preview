/**
 * @fileoverview User Profile Page
 * Shows user information and their request history
 */

import { createClient } from '@/lib/supabase/server'
import { getProfileWithServiceRole } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PlatformLayout } from '@/components/layout/PlatformLayout'
import { RequestsListWithModal } from '@/components/help-requests/RequestsListWithModal'
import { ProfileAvatarSection } from '@/components/profile/profile-avatar-section'
import { CaregivingSituationEditor } from '@/components/profile/caregiving-situation-editor'
import { ProfileFieldEditor } from '@/components/profile/profile-field-editor'
import Link from 'next/link'
import { User, Mail, Calendar } from 'lucide-react'
import { format } from 'date-fns'

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

type UserProfile = {
  id: string
  name: string
  email: string
  location: string | null
  created_at: string
  verification_status: string
  is_admin: boolean
  avatar_url: string | null
  caregiving_situation: string | null
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
    location: profile?.location || null,
    created_at: profile?.created_at || '',
    verification_status: profile.verification_status,
    is_admin: profile.is_admin,
    avatar_url: profile?.avatar_url || null,
    caregiving_situation: profile?.caregiving_situation || null
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

    query = query.order('created_at', { ascending: false }).limit(5)

    const { data: requests, error } = await query

    if (error || !requests || requests.length === 0) {
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
    console.error('[Profile] Exception:', error)
    return []
  }
}

async function getRequestStats(userId: string) {
  const supabase = await createClient()

  try {
    const { count: totalCount } = await supabase
      .from('help_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    const { count: openCount } = await supabase
      .from('help_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'open')

    const { count: completedCount } = await supabase
      .from('help_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')

    return {
      total: totalCount || 0,
      open: openCount || 0,
      completed: completedCount || 0
    }
  } catch (error) {
    return { total: 0, open: 0, completed: 0 }
  }
}

export default async function ProfilePage({ searchParams }: PageProps) {
  const user = await getUser()

  if (!user) {
    redirect('/login?redirect=/profile')
  }

  const params = await searchParams
  const statusFilter = params.status || 'all'

  const messagingData = await getMessagingData(user.id)
  const recentRequests = await getUserRequests(user.id, statusFilter)
  const requestStats = await getRequestStats(user.id)

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Profile', href: '/profile' }
  ]

  return (
    <PlatformLayout
      user={user}
      messagingData={messagingData}
      breadcrumbs={breadcrumbs}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-secondary">My Profile</h1>
          <p className="text-muted-foreground">View and manage your account information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Info Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Avatar Section */}
                <ProfileAvatarSection
                  userId={user.id}
                  userName={user.name}
                  initialAvatarUrl={user.avatar_url}
                />

                {/* Editable Name Field */}
                <ProfileFieldEditor
                  userId={user.id}
                  field="name"
                  initialValue={user.name}
                  label="Name"
                  iconName="user"
                  placeholder="Enter your name"
                  maxLength={100}
                  required
                />

                {/* Email (read-only, managed by auth) */}
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Mail className="w-4 h-4" />
                    Email
                  </div>
                  <p className="text-secondary font-medium">{user.email}</p>
                </div>

                {/* Editable Location Field */}
                <ProfileFieldEditor
                  userId={user.id}
                  field="location"
                  initialValue={user.location}
                  label="Location"
                  iconName="map-pin"
                  placeholder="e.g., Springfield, MO"
                  maxLength={200}
                />

                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4" />
                    Member Since
                  </div>
                  <p className="text-secondary font-medium">
                    {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : 'N/A'}
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={user.verification_status === 'approved' ? 'default' : 'secondary'}>
                      {user.verification_status}
                    </Badge>
                  </div>
                  {user.is_admin && (
                    <Badge variant="secondary">Admin</Badge>
                  )}
                </div>

                {/* Caregiving Situation */}
                <div className="pt-4 border-t">
                  <CaregivingSituationEditor
                    userId={user.id}
                    initialValue={user.caregiving_situation}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Request Stats Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Request Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Requests</span>
                  <span className="font-semibold text-secondary">{requestStats.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Open Requests</span>
                  <span className="font-semibold text-sage">{requestStats.open}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <span className="font-semibold text-accent">{requestStats.completed}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* My Requests Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>My Help Requests</CardTitle>
                    <CardDescription>Recent requests you&apos;ve created</CardDescription>
                  </div>
                  <Link href="/requests/my-requests">
                    <Button variant="outline" size="sm">View All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {recentRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No Requests Yet
                    </h3>
                    <p className="text-muted-foreground">You haven&apos;t created any help requests yet.</p>
                    <Link href="/requests/new">
                      <Button>Create First Request</Button>
                    </Link>
                  </div>
                ) : (
                  <RequestsListWithModal
                    requests={recentRequests as any}
                    currentUserId={user.id}
                  />
                )}

                {recentRequests.length > 0 && (
                  <div className="text-center mt-6 pt-4 border-t">
                    <Link href="/requests/my-requests">
                      <Button variant="outline">View All My Requests</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PlatformLayout>
  )
}
