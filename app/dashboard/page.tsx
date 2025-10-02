import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PlatformLayout } from '@/components/layout/PlatformLayout'
import Link from 'next/link'

// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic'

interface DashboardPageProps {
  searchParams: Promise<{ error?: string }>
}

async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Get user profile with verification status
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return {
    id: user.id,
    name: profile?.name || user.email?.split('@')[0] || 'Unknown',
    email: user.email || '',
    isAdmin: profile?.is_admin || false,
    verificationStatus: profile?.verification_status,
    profile
  };
}

async function getDashboardData(userId: string) {
  const supabase = await createClient();
  
  try {
    // Get user's help requests count
    const { count: userRequestsCount, error: requestsError } = await supabase
      .from('help_requests')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .neq('status', 'closed');

    // Get unread messages count
    const { count: unreadCount, error: unreadError } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('recipient_id', userId)
      .is('read_at', null);

    // Get active conversations count
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select(`
        id,
        conversation_participants!inner (
          user_id
        )
      `)
      .eq('conversation_participants.user_id', userId)
      .is('conversation_participants.left_at', null);

    // Get number of people helped
    const { count: helpedCount, error: helpedError } = await supabase
      .from('help_requests')
      .select('*', { count: 'exact' })
      .eq('helper_id', userId)
      .eq('status', 'completed');

    // Get recent activity - help requests and conversations
    const { data: recentRequests } = await supabase
      .from('help_requests')
      .select(`
        id,
        title,
        status,
        urgency,
        created_at,
        profiles!user_id (name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      userRequestsCount: userRequestsCount || 0,
      unreadCount: unreadCount || 0,
      activeConversations: conversations?.length || 0,
      helpedCount: helpedCount || 0,
      recentRequests: recentRequests || []
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      userRequestsCount: 0,
      unreadCount: 0,
      activeConversations: 0,
      helpedCount: 0,
      recentRequests: []
    };
  }
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await getUser();

  if (!user) {
    redirect('/login?redirect=/dashboard');
  }

  // CRITICAL SECURITY: Block rejected users (defensive check)
  if (user.verificationStatus === 'rejected') {
    redirect('/access-denied?reason=rejected');
  }

  // Redirect pending users to waitlist page
  if (user.verificationStatus === 'pending') {
    redirect('/waitlist');
  }

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

        {/* Preview Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 text-xl">ℹ️</div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Preview Mode</h3>
              <p className="text-blue-800 text-sm">
                This is a demonstration of the member portal functionality. In production, users will access this dashboard through your main Wix website after logging in.
              </p>
            </div>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary mb-2">
            Welcome back, {user.name}!
            {user.isAdmin && <Badge variant="secondary" className="ml-2">Admin</Badge>}
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening in your community today. 
            <Link href="/help/workflows" className="text-sage hover:text-sage-dark underline ml-1">
              Learn how it works
            </Link>
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🙋‍♀️</span>
                Need Help?
              </CardTitle>
              <CardDescription className="text-base">
                Post a request and let the community help you out
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/requests/new">
                <Button className="w-full">
                  Create Help Request
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🤝</span>
                Want to Help?
              </CardTitle>
              <CardDescription className="text-base">
                Browse requests from people who need assistance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/requests">
                <Button variant="secondary" className="w-full">
                  Browse Requests
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">💬</span>
                Messages
                {dashboardData.unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {dashboardData.unreadCount}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-base">
                Connect and communicate with community members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/messages">
                <Button variant="sage" className="w-full">
                  Open Messages
                  {dashboardData.unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {dashboardData.unreadCount} unread
                    </Badge>
                  )}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/requests">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Your Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary mb-2">{dashboardData.userRequestsCount}</div>
                <p className="text-sm text-muted-foreground">Active help requests</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/messages">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-sage mb-2">{dashboardData.unreadCount}</div>
                <p className="text-sm text-muted-foreground">Unread messages</p>
                <div className="text-xs text-muted-foreground mt-1">
                  {dashboardData.activeConversations} active conversation{dashboardData.activeConversations !== 1 ? 's' : ''}
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Community Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent mb-2">{dashboardData.helpedCount}</div>
              <p className="text-sm text-muted-foreground">People helped</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Community Activity</CardTitle>
            <CardDescription>
              Stay updated with what&apos;s happening in your community
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                        by {request.profiles?.name || 'Anonymous'} • {new Date(request.created_at).toLocaleDateString()}
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
                <div className="text-6xl mb-4">🌟</div>
                <h3 className="text-lg font-medium text-secondary mb-2">Welcome to Care Collective!</h3>
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
    </PlatformLayout>
  )
}