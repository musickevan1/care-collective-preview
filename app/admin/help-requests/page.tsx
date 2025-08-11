import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

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

export default async function AdminHelpRequestsPage() {
  const supabase = await createClient()

  const { data: helpRequests, error } = await supabase
    .from('help_requests')
    .select(`
      *,
      profiles (
        name,
        location
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching help requests:', error)
  }

  // Get stats
  const [
    { count: totalRequests },
    { count: openRequests },
    { count: closedRequests },
  ] = await Promise.all([
    supabase.from('help_requests').select('*', { count: 'exact', head: true }),
    supabase.from('help_requests').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('help_requests').select('*', { count: 'exact', head: true }).eq('status', 'closed'),
  ])

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-secondary text-secondary-foreground shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  ← Admin Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Help Request Management</h1>
                <p className="text-sm text-secondary-foreground/70">Review community help requests (Preview - Read Only)</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Preview Notice */}
        <div className="bg-accent/20 border border-accent/30 rounded-lg p-4 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-2">🔍 Preview Mode - Read Only</h2>
          <p className="text-muted-foreground">
            This page shows help request data in read-only mode for demonstration purposes.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                📋 Total Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRequests || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                ✅ Open
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{openRequests || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                ❌ Closed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{closedRequests || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Help Requests List */}
        <Card>
          <CardHeader>
            <CardTitle>Help Requests ({helpRequests?.length || 0})</CardTitle>
            <CardDescription>
              All help requests from community members
            </CardDescription>
          </CardHeader>
          <CardContent>
            {helpRequests && helpRequests.length > 0 ? (
              <div className="space-y-4">
                {helpRequests.map((request: any) => (
                  <div
                    key={request.id}
                    className="flex items-start justify-between p-4 bg-muted rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={categoryColors[request.category as keyof typeof categoryColors]}>
                          {request.category}
                        </Badge>
                        
                        <Badge variant={urgencyColors[request.urgency as keyof typeof urgencyColors]}>
                          {request.urgency}
                        </Badge>
                        
                        <Badge variant={request.status === 'open' ? 'default' : 'outline'}>
                          {request.status}
                        </Badge>
                      </div>
                      
                      <h3 className="font-medium text-foreground mb-1">
                        {request.title}
                      </h3>
                      
                      {request.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {request.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          👤 {request.profiles?.name || 'Anonymous'}
                        </span>
                        {request.profiles?.location && (
                          <span>📍 {request.profiles.location}</span>
                        )}
                        <span>
                          🕒 {formatTimeAgo(request.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="outline" size="sm" disabled>
                        View (Preview)
                      </Button>
                      
                      <Button 
                        variant="destructive" 
                        size="sm"
                        disabled
                      >
                        Remove (Preview)
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No help requests found
                </h3>
                <p className="text-muted-foreground">
                  No help requests have been posted yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}