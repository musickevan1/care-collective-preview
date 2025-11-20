// Browse Requests Page - Cache cleared Session 5
import { createClient } from '@/lib/supabase/server'
import { getProfileWithServiceRole } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/StatusBadge'
import { FilterPanel } from '@/components/FilterPanel'
import { PlatformLayout } from '@/components/layout/PlatformLayout'
import { getOptimizedHelpRequests, type OptimizedHelpRequest } from '@/lib/queries/help-requests-optimized'
import { RequestsListWithModal } from '@/components/help-requests/RequestsListWithModal'
import { Handshake } from 'lucide-react'
import Link from 'next/link'

// Force dynamic rendering - no caching for authenticated pages
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'

type User = {
  id: string
  name: string
  email: string
  verification_status: string
  is_admin: boolean
}

// Use optimized type from our query module
type HelpRequest = OptimizedHelpRequest

const categoryColors = {
  groceries: 'default',
  transport: 'secondary',
  household: 'outline',
  medical: 'destructive',
  meals: 'default',
  childcare: 'secondary',
  petcare: 'outline',
  technology: 'secondary',
  companionship: 'default',
  respite: 'outline',
  emotional: 'default',
  other: 'outline'
} as const

const urgencyColors = {
  normal: 'outline',
  urgent: 'secondary',
  critical: 'destructive'
} as const

function formatTimeAgo(dateString: string) {
  const now = new Date()
  const date = new Date(dateString)
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  } else if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)}h ago`
  } else {
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }
}

interface PageProps {
  searchParams: Promise<{ 
    status?: string;
    category?: string;
    urgency?: string;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }>
}

async function getUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  // PRODUCTION DEBUG: Auth check
  console.log('[Browse Requests] Auth check:', {
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    error: error?.message,
    timestamp: new Date().toISOString()
  });

  if (error || !user) {
    return null;
  }

  // Get user profile with verification status
  // CRITICAL: Use service role to bypass RLS and get guaranteed accurate data
  let profile;
  try {
    profile = await getProfileWithServiceRole(user.id);

    // PRODUCTION DEBUG: Profile fetch
    console.log('[Browse Requests] Profile fetched (service role):', {
      profileId: profile.id,
      profileName: profile.name,
      verificationStatus: profile.verification_status,
      queryUserId: user.id,
      matchesAuthUser: profile.id === user.id,
      timestamp: new Date().toISOString()
    });

    // CRITICAL SECURITY: Validate profile ID matches authenticated user ID
    if (profile.id !== user.id) {
      console.error('[Browse Requests] SECURITY ALERT: Profile ID mismatch!', {
        authUserId: user.id,
        profileId: profile.id,
        authEmail: user.email,
        profileName: profile.name,
        timestamp: new Date().toISOString()
      });
      // This should never happen with service role - indicates serious bug
      // FORCE LOGOUT to clear the corrupted session
      await supabase.auth.signOut();
      redirect('/login?error=session_mismatch');
    }
  } catch (error) {
    console.error('[Browse Requests] Service role profile query failed:', error);
    // Sign out on error - secure by default
    await supabase.auth.signOut();
    redirect('/login?error=verification_failed');
  }

  // Check if user is approved or admin
  if (profile.verification_status !== 'approved' && !profile.is_admin) {
    console.log('[Browse Requests] User not approved:', {
      userId: user.id,
      verificationStatus: profile.verification_status,
      isAdmin: profile.is_admin
    });
    return null; // This will trigger redirect to login/waiting page
  }

  // Additional security check: Block rejected users explicitly
  if (profile.verification_status === 'rejected') {
    console.log('[Browse Requests] BLOCKING rejected user');
    return null;
  }

  return {
    id: user.id,
    name: profile?.name || user.email?.split('@')[0] || 'Unknown',
    email: user.email || '',
    verification_status: profile.verification_status,
    is_admin: profile.is_admin
  };
}

async function getMessagingData(userId: string) {
  const supabase = createClient();

  try {
    // Get unread count (catch individual errors to prevent page crash)
    let unreadCount = 0;
    try {
      const { count, error: unreadError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .is('read_at', null);

      if (unreadError) {
        console.warn('[Messaging Data] Unread count error (non-fatal):', unreadError.message);
      } else {
        unreadCount = count || 0;
      }
    } catch (err) {
      console.warn('[Messaging Data] Unread count exception (non-fatal):', err);
    }

    // Get active conversations count (catch individual errors to prevent page crash)
    let activeConversations = 0;
    try {
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

      if (conversationsError) {
        console.warn('[Messaging Data] Conversations error (non-fatal):', conversationsError.message);
      } else {
        activeConversations = conversations?.length || 0;
      }
    } catch (err) {
      console.warn('[Messaging Data] Conversations exception (non-fatal):', err);
    }

    return {
      unreadCount,
      activeConversations
    };
  } catch (error) {
    console.error('[Messaging Data] Fatal error:', error);
    // Return safe defaults instead of throwing
    return { unreadCount: 0, activeConversations: 0 };
  }
}

export default async function RequestsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const {
    status: statusFilter = 'all',
    category: categoryFilter = 'all',
    urgency: urgencyFilter = 'all',
    search: searchQuery = '',
    sort: sortBy = 'created_at',
    order: sortOrder = 'desc'
  } = params;
  
  const user = await getUser();

  if (!user) {
    // Check if there's an authenticated user with pending status
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (authUser) {
      // User is authenticated but not approved - redirect to dashboard/waiting page
      redirect('/dashboard?message=approval_required');
    } else {
      // User is not authenticated - redirect to login
      redirect('/login?redirect=/requests');
    }
  }

  // TEMPORARY FIX: Skip messaging data entirely to unblock page rendering
  // The messaging RLS policies have issues that need to be fixed separately
  const messagingData = { unreadCount: 0, activeConversations: 0 };

  // Use optimized query functions - Phase 3.1 Performance Enhancement
  let requests: OptimizedHelpRequest[] | null = null
  let queryError: any = null

  try {
    // DIAGNOSTIC: Log query start
    console.log('[BROWSE DEBUG] Starting query:', {
      userId: user.id,
      userName: user.name,
      verificationStatus: user.verification_status,
      filters: { statusFilter, categoryFilter, urgencyFilter, searchQuery, sortBy, sortOrder },
      timestamp: new Date().toISOString()
    })

    const queryResult = await getOptimizedHelpRequests({
      status: statusFilter,
      category: categoryFilter,
      urgency: urgencyFilter,
      search: searchQuery,
      sort: sortBy,
      order: sortOrder,
      limit: 100
    })

    // DIAGNOSTIC: Log query completion with detailed structure analysis
    console.log('[BROWSE DEBUG] Query completed:', {
      success: !queryResult.error,
      hasData: !!queryResult.data,
      dataLength: queryResult.data?.length,
      firstItemStructure: queryResult.data?.[0] ? {
        hasId: !!queryResult.data[0].id,
        hasTitle: !!queryResult.data[0].title,
        hasProfiles: !!queryResult.data[0].profiles,
        profileType: typeof queryResult.data[0].profiles,
        profileValue: queryResult.data[0].profiles,
        profileKeys: queryResult.data[0].profiles ? Object.keys(queryResult.data[0].profiles) : null,
        hasHelper: !!queryResult.data[0].helper,
        helperType: typeof queryResult.data[0].helper,
      } : null,
      errorMessage: queryResult.error?.message,
      errorCode: queryResult.error?.code,
      errorDetails: queryResult.error ? JSON.stringify(queryResult.error) : null,
      timestamp: new Date().toISOString()
    })

    requests = queryResult.data
    queryError = queryResult.error

    // Enhanced logging for debugging
    if (queryError) {
      console.error('[Browse Requests] Query error:', {
        error: queryError,
        userId: user.id,
        verificationStatus: user.verification_status,
        filters: { statusFilter, categoryFilter, urgencyFilter, searchQuery }
      })
    }

  } catch (error) {
    // DIAGNOSTIC: Capture detailed exception information
    console.error('[BROWSE DEBUG] EXCEPTION:', {
      name: error?.constructor?.name,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 10).join('\n') : undefined,
      fullError: error,
      timestamp: new Date().toISOString()
    })
    console.error('[Browse Requests] Unexpected error:', error)
    queryError = error
  }

  // Ensure requests is always an array with null checks for nested objects
  const safeRequests = (requests || []).map(req => ({
    ...req,
    profiles: req.profiles || { name: 'Unknown User', location: null },
    helper: req.helper_id && req.helper ? req.helper : null
  }));

  const breadcrumbs = [
    { label: 'Help Requests', href: '/requests' }
  ];

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
            <h1 className="text-2xl font-bold text-secondary">Help Requests</h1>
            <p className="text-muted-foreground">Browse community requests for help</p>
          </div>
          <Link href="/requests/new">
            <Button>
              Create Request
            </Button>
          </Link>
        </div>

        {/* Advanced Filtering Interface */}
        <FilterPanel
          className="mb-6"
          showAdvanced={false}
        />

        {queryError ? (
          <Card className="text-center py-12 border-destructive/20">
            <CardContent>
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Service Temporarily Unavailable</h3>
              <p className="text-muted-foreground mb-6">
                We&apos;re having trouble connecting to our database. This is usually temporary.
                Please try refreshing the page or check back in a few moments.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
                <Link href="/requests">
                  <Button className="bg-sage hover:bg-sage-dark">
                    Try Again
                  </Button>
                </Link>
                <Link href="/requests/new">
                  <Button variant="outline" className="border-sage text-sage hover:bg-sage/5">
                    Create Request Anyway
                  </Button>
                </Link>
              </div>
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-muted-foreground">
                    Error details (development only)
                  </summary>
                  <div className="mt-2 p-3 bg-muted rounded text-xs">
                    {String(queryError)}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        ) : !safeRequests || safeRequests.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex justify-center mb-4">
                <Handshake className="w-16 h-16 text-sage" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No Active Requests</h3>
              <p className="text-muted-foreground mb-6">
                We couldn&apos;t find any requests matching your criteria. Check back soon or create your own request.
              </p>
              <Link href="/requests/new">
                <Button>
                  Create First Request
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {safeRequests.length} Request{safeRequests.length !== 1 ? 's' : ''} Found
                </h2>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? `Results for "${searchQuery}"` : 
                   statusFilter !== 'all' || categoryFilter !== 'all' || urgencyFilter !== 'all' ? 
                   'Filtered results' : 
                   'People in your community who need help'}
                </p>
              </div>
            </div>

            <RequestsListWithModal
              requests={safeRequests as any}
              currentUserId={user.id}
            />
          </div>
        )}
      </div>
    </PlatformLayout>
  )
}
