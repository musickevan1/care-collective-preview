import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/StatusBadge'
import { FilterPanel, FilterOptions } from '@/components/FilterPanel'
import { PlatformLayout } from '@/components/layout/PlatformLayout'
import { getOptimizedHelpRequests, type OptimizedHelpRequest } from '@/lib/queries/help-requests-optimized'
import Link from 'next/link'

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
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Get user profile with verification status
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, location, verification_status, is_admin')
    .eq('id', user.id)
    .single();

  // Check if user is approved or admin
  if (!profile || (profile.verification_status !== 'approved' && !profile.is_admin)) {
    return null; // This will trigger redirect to login/waiting page
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
  const supabase = await createClient();
  
  try {
    // Get unread count
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

    return {
      unreadCount: unreadCount || 0,
      activeConversations: conversations?.length || 0
    };
  } catch (error) {
    console.error('Error fetching messaging data:', error);
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
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (authUser) {
      // User is authenticated but not approved - redirect to dashboard/waiting page
      redirect('/dashboard?message=approval_required');
    } else {
      // User is not authenticated - redirect to login
      redirect('/login?redirect=/requests');
    }
  }

  const supabase = await createClient();
  const messagingData = await getMessagingData(user.id);

  // Use optimized query functions - Phase 3.1 Performance Enhancement
  const { data: requests, error: queryError } = await getOptimizedHelpRequests({
    status: statusFilter,
    category: categoryFilter,
    urgency: urgencyFilter,
    search: searchQuery,
    sort: sortBy,
    order: sortOrder,
    limit: 100
  });

  // Ensure requests is always an array
  const safeRequests = requests || [];

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
          onFilterChange={() => {
            // Filter changes are handled via URL navigation
            // This is a server component so we don't need to handle state here
          }}
          className="mb-6"
          showAdvanced={false}
        />

        {queryError ? (
          <Card className="text-center py-12 border-destructive/20">
            <CardContent>
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Service Temporarily Unavailable</h3>
              <p className="text-muted-foreground mb-6">
                We're having trouble connecting to our database. This is usually temporary.
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
              <div className="text-6xl mb-4">🤝</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No Active Requests</h3>
              <p className="text-muted-foreground mb-6">
                There are no active help requests at the moment. Check back soon or create your own request.
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {safeRequests.map((request: HelpRequest) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="text-lg line-clamp-2">
                        {request.title}
                      </CardTitle>
                      <Badge variant={urgencyColors[request.urgency as keyof typeof urgencyColors]} className="text-xs whitespace-nowrap">
                        {request.urgency}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{request.profiles?.name || 'Anonymous'}</span>
                      {request.profiles?.location && (
                        <>
                          <span>•</span>
                          <span>{request.profiles.location}</span>
                        </>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {request.description && (
                      <CardDescription className="mb-4 line-clamp-3">
                        {request.description}
                      </CardDescription>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Badge variant={categoryColors[request.category as keyof typeof categoryColors]} className="text-xs">
                          {request.category}
                        </Badge>
                        <StatusBadge status={request.status as any} />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(request.created_at)}
                      </span>
                    </div>
                    {request.helper && request.status === 'in_progress' && (
                      <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                        Being helped by {request.helper.name}
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t">
                      <Link href={`/requests/${request.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          View Details {request.status === 'open' && '& Offer Help'}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </PlatformLayout>
  )
}