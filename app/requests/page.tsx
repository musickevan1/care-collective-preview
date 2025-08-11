import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/StatusBadge'
import Link from 'next/link'

type HelpRequest = {
  id: string
  title: string
  description: string | null
  category: string
  urgency: string
  status: string
  created_at: string
  helper_id: string | null
  profiles: {
    name: string
    location: string | null
  } | null
  helper: {
    name: string
    location: string | null
  } | null
}

const categoryColors = {
  groceries: 'default',
  transport: 'secondary',
  household: 'outline',
  medical: 'destructive',
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
  searchParams: Promise<{ status?: string }>
}

export default async function RequestsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const statusFilter = params.status || 'all'
  
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }

  let query = supabase
    .from('help_requests')
    .select(`
      *,
      profiles!user_id (name, location),
      helper:profiles!helper_id (name, location)
    `)
    
  // Apply status filter
  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }
  
  const { data: requests } = await query
    .order('urgency', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-secondary text-secondary-foreground shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  ← Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Help Requests</h1>
                <p className="text-sm text-secondary-foreground/70">Browse community requests for help</p>
              </div>
            </div>
            <Link href="/requests/new">
              <Button>
                Create Request
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Status Filter Tabs */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <Link href="/requests">
            <Button 
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
            >
              All Requests
            </Button>
          </Link>
          <Link href="/requests?status=open">
            <Button 
              variant={statusFilter === 'open' ? 'default' : 'outline'}
              size="sm"
            >
              Open
            </Button>
          </Link>
          <Link href="/requests?status=in_progress">
            <Button 
              variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
              size="sm"
            >
              In Progress
            </Button>
          </Link>
          <Link href="/requests?status=completed">
            <Button 
              variant={statusFilter === 'completed' ? 'default' : 'outline'}
              size="sm"
            >
              Completed
            </Button>
          </Link>
        </div>

        {!requests || requests.length === 0 ? (
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
                  {requests.length} Active Request{requests.length !== 1 ? 's' : ''}
                </h2>
                <p className="text-sm text-muted-foreground">People in your community who need help</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requests.map((request: HelpRequest) => (
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
    </main>
  )
}