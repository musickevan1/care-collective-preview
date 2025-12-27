import { createClient } from '@/lib/supabase/server'
import { getProfileWithServiceRole } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PlatformLayout } from '@/components/layout/PlatformLayout'
// LAUNCH: Disabled beta testing - commented out import
// import { BetaBannerWithModal } from '@/components/dashboard/BetaBannerWithModal'
import { FormattedDate } from '@/components/FormattedDate'
import Link from 'next/link'
import { HandHeart, Handshake, Sparkles } from 'lucide-react'

// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs' // Ensure server-side rendering

// CRITICAL: Prevent ANY caching of this authenticated page
export async function generateMetadata() {
  return {
    other: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, private, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  }
}

interface DashboardPageProps {
  searchParams: Promise<{ error?: string }>
}

interface DashboardUser {
  id: string
  name: string
  email: string
  isAdmin: boolean
  verificationStatus: string
  profile: any
}

async function getUser(): Promise<DashboardUser | null> {
  const supabase = await createClient();

  // Force session refresh to ensure we have the latest auth state
  const { error: refreshError } = await supabase.auth.refreshSession();

  if (refreshError) {
    // Continue anyway - refreshSession may fail if no session exists yet
  }

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Get user profile with verification status using service role to bypass RLS
  let profile;
  try {
    profile = await getProfileWithServiceRole(user.id);

    // CRITICAL SECURITY: Validate profile ID matches authenticated user ID
    if (profile.id !== user.id) {
      await supabase.auth.signOut();
      redirect('/login?error=session_mismatch');
    }
  } catch {
    await supabase.auth.signOut();
    redirect('/login?error=verification_failed');
  }

  return {
    id: user.id,
    name: profile?.name || user.email?.split('@')[0] || 'Unknown',
    email: user.email || '',
    isAdmin: profile?.is_admin || false,
    verificationStatus: profile?.verification_status,
    profile,
  };
}

async function getDashboardData(userId: string) {
  const supabase = await createClient();

  try {
    // Run all queries in parallel for better performance
    const [
      userRequestsResult,
      unreadResult,
      conversationsResult,
      helpedResult,
      recentRequestsResult,
      userRequestsDataResult
    ] = await Promise.all([
      // User's help requests count (excluding cancelled and closed)
      supabase
        .from('help_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .neq('status', 'closed')
        .neq('status', 'cancelled'),

      // Unread messages count
      supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .is('read_at', null),

      // Active conversations count (using count instead of fetching all data)
      supabase
        .from('conversation_participants')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('left_at', null),

      // Number of people helped
      supabase
        .from('help_requests')
        .select('*', { count: 'exact', head: true })
        .eq('helper_id', userId)
        .eq('status', 'completed'),

      // Recent community activity (exclude cancelled)
      supabase
        .from('help_requests')
        .select('id, title, status, urgency, created_at, profiles!user_id (name)')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(5),

      // User's own help requests (exclude cancelled)
      supabase
        .from('help_requests')
        .select('id, title, status, urgency, category, created_at')
        .eq('user_id', userId)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(5)
    ]);

    return {
      userRequestsCount: userRequestsResult.count || 0,
      unreadCount: unreadResult.count || 0,
      activeConversations: conversationsResult.count || 0,
      helpedCount: helpedResult.count || 0,
      recentRequests: recentRequestsResult.data || [],
      userRequests: userRequestsDataResult.data || []
    };
  } catch {
    return {
      userRequestsCount: 0,
      unreadCount: 0,
      activeConversations: 0,
      helpedCount: 0,
      recentRequests: [],
      userRequests: []
    };
  }
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  console.log('[Dashboard] Page load started:', {
    timestamp: new Date().toISOString()
  })

  const user = await getUser();

  console.log('[Dashboard] User check:', {
    hasUser: !!user,
    userId: user?.id,
    verificationStatus: user?.verificationStatus,
    timestamp: new Date().toISOString()
  })

  if (!user) {
    console.log('[Dashboard] Redirecting to login - no user found')
    redirect('/login?redirect=/dashboard');
  }

  // Security: Block rejected users
  if (user.verificationStatus === 'rejected') {
    console.log('[Dashboard] Blocking rejected user, redirecting to access-denied')
    redirect('/access-denied?reason=rejected');
  }

  // Redirect pending users to waitlist page
  if (user.verificationStatus === 'pending') {
    console.log('[Dashboard] Redirecting pending user to waitlist')
    redirect('/waitlist');
  }

  // Only approved users past this point
  if (user.verificationStatus !== 'approved') {
    console.log('[Dashboard] User not approved, redirecting to waitlist')
    redirect('/waitlist?message=approval_required');
  }

  console.log('[Dashboard] Approved user, rendering dashboard')

  const resolvedSearchParams = await searchParams;
  const hasAdminError = resolvedSearchParams.error === 'admin_required';
  
  const dashboardData = await getDashboardData(user.id);
  const messagingData = {
    unreadCount: dashboardData.unreadCount,
    activeConversations: dashboardData.activeConversations
  };

  return (
    <PlatformLayout
      user={user}
      messagingData={messagingData}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Error Messages */}
        {hasAdminError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-destructive mb-2">Access Denied</h3>
            <p className="text-destructive/80">
              You don&apos;t have admin privileges to access the admin panel. Contact an administrator if you believe this is an error.
            </p>
          </div>
        )}

        {/* LAUNCH: Disabled beta testing - BetaBannerWithModal commented out */}
        {/* Beta Testing Notice with Modal Control - Shows to beta testers only */}
        {/* <BetaBannerWithModal /> */}
        
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary">
            Welcome back, {user.name}!
            {user.isAdmin && <Badge variant="secondary" className="ml-2">Admin</Badge>}
          </h1>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="flex justify-center">
                  <HandHeart className="w-6 h-6 text-primary fill-primary" aria-label="Need help" />
                </div>
                Need Help?
              </CardTitle>
              <CardDescription className="text-sm">
                Post a request and let the community help you out
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Link href="/requests/new">
                <Button className="w-full min-h-[44px]">
                  Create Help Request
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="flex justify-center">
                  <Handshake className="w-6 h-6 text-sage-dark" aria-label="Want to help" />
                </div>
                Want to Help?
              </CardTitle>
              <CardDescription className="text-sm">
                Browse requests from people who need assistance
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Link href="/requests">
                <Button variant="secondary" className="w-full min-h-[44px]">
                  Browse Requests
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="text-xl">💬</span>
                Messages
                {dashboardData.unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-1 text-xs">
                    {dashboardData.unreadCount}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-sm">
                Connect and communicate with community members
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Link href="/messages">
                <Button variant="sage" className="w-full min-h-[44px]">
                  Open Messages
                  {dashboardData.unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {dashboardData.unreadCount} unread
                    </Badge>
                  )}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Link href="/requests">
            <Card className="hover:bg-muted/50 hover:shadow-md transition-all cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-muted-foreground">Your Requests</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-4xl font-bold text-primary mb-1">{dashboardData.userRequestsCount}</div>
                <p className="text-sm text-muted-foreground">Active help requests</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/messages">
            <Card className="hover:bg-muted/50 hover:shadow-md transition-all cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-muted-foreground">Messages</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-4xl font-bold text-sage mb-1">{dashboardData.unreadCount}</div>
                <p className="text-sm text-muted-foreground">Unread messages</p>
                <div className="text-xs text-muted-foreground mt-1">
                  {dashboardData.activeConversations} active conversation{dashboardData.activeConversations !== 1 ? 's' : ''}
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-muted-foreground">Community Impact</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-4xl font-bold text-accent mb-1">{dashboardData.helpedCount}</div>
              <p className="text-sm text-muted-foreground">People helped</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {/* User's Activity */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Your Activity</CardTitle>
              <CardDescription className="text-sm">
                Your recent help requests and their status
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {dashboardData.userRequests.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.userRequests.map((request: any) => (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-secondary truncate">{request.title}</h4>
                          <Badge
                            variant={request.status === 'open' ? 'default' :
                                    request.status === 'in_progress' ? 'secondary' : 'outline'}
                            className="text-xs flex-shrink-0"
                          >
                            {request.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {request.category} • <FormattedDate date={request.created_at} />
                        </p>
                      </div>
                      <Link href={`/requests/my-requests?id=${request.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </div>
                  ))}
                  <div className="text-center pt-2">
                    <Link href="/requests/my-requests">
                      <Button variant="outline" size="sm">View All Your Requests</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-3">You haven&apos;t created any requests yet</p>
                  <Link href="/requests/new">
                    <Button size="sm">Create Your First Request</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Community Activity */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Recent Community Activity</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {dashboardData.recentRequests.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.recentRequests.map((request: any) => (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-secondary">{request.title}</h4>
                          <Badge
                            variant={request.urgency === 'critical' ? 'destructive' :
                                    request.urgency === 'urgent' ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {request.urgency}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          by {request.profiles?.name || 'Anonymous'} • <FormattedDate date={request.created_at} />
                        </p>
                      </div>
                      <Link href={`/requests/${request.id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                    </div>
                  ))}
                  <div className="text-center pt-4">
                    <Link href="/requests">
                      <Button variant="outline">View All Requests</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="flex justify-center mb-4">
                    <Sparkles className="w-12 h-12 text-accent" aria-label="Welcome" />
                  </div>
                  <h3 className="text-lg font-medium text-secondary mb-2">Welcome to CARE Collective!</h3>
                  <p className="text-muted-foreground mb-4">
                    You&apos;re all set up. Start by creating your first help request or browse what others need.
                  </p>
                  <div className="flex gap-2 justify-center mb-4">
                    <Badge variant="default">New Member</Badge>
                    <Badge variant="secondary">Community Builder</Badge>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Link href="/requests/new">
                      <Button>Create Request</Button>
                    </Link>
                    <Link href="/requests">
                      <Button variant="outline">Browse Requests</Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PlatformLayout>
  )
}