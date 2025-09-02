import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/StatusBadge'
import { DynamicAdminRequestActions } from '@/components/DynamicComponents'
import Link from 'next/link'
import Image from 'next/image'

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
  const supabase = createClient()

  const { data: helpRequests, error } = await supabase
    .from('help_requests')
    .select(`
      *,
      profiles!user_id (
        name,
        location
      ),
      helper:profiles!helper_id (
        name,
        location
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching help requests:', error)
  }

  // Get stats with new statuses
  const [
    { count: totalRequests },
    { count: openRequests },
    { count: inProgressRequests },
    { count: completedRequests },
  ] = await Promise.all([
    supabase.from('help_requests').select('*', { count: 'exact', head: true }),
    supabase.from('help_requests').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('help_requests').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
    supabase.from('help_requests').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
  ])

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-secondary text-secondary-foreground shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <Link href="/admin" className="inline-block">
              <Button variant="ghost" size="sm">
                ← Back
              </Button>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <Image 
                src="/logo.png" 
                alt="Care Collective Logo" 
                width={24} 
                height={24}
                className="rounded flex-shrink-0"
              />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold">Help Requests</h1>
                <p className="text-xs sm:text-sm text-secondary-foreground/70 hidden sm:block">Manage and moderate community help requests</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Admin Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-8">
          <h2 className="text-base sm:text-lg font-semibold text-green-900 mb-1 sm:mb-2">🛡️ Admin Panel</h2>
          <p className="text-sm sm:text-base text-green-800">
            Full administrative capabilities: change request status, assign helpers, and maintain audit logs.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                📋 Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRequests || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                🟢 Open
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{openRequests || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                🔵 In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{inProgressRequests || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                ✅ Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{completedRequests || 0}</div>
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
                    className="flex flex-col sm:flex-row sm:items-start sm:justify-between p-3 sm:p-4 bg-muted rounded-lg gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant={categoryColors[request.category as keyof typeof categoryColors]} className="text-xs">
                          {request.category}
                        </Badge>
                        
                        <Badge variant={urgencyColors[request.urgency as keyof typeof urgencyColors]} className="text-xs">
                          {request.urgency}
                        </Badge>
                        
                        <StatusBadge status={request.status} />
                      </div>
                      
                      <h3 className="font-medium text-foreground mb-1 text-sm sm:text-base">
                        {request.title}
                      </h3>
                      
                      {request.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">
                          {request.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                        <span className="whitespace-nowrap">
                          👤 {request.profiles?.name || 'Anonymous'}
                        </span>
                        {request.profiles?.location && (
                          <span className="whitespace-nowrap">📍 {request.profiles.location}</span>
                        )}
                        {request.helper && (
                          <span className="whitespace-nowrap">🤝 {request.helper.name}</span>
                        )}
                        <span className="whitespace-nowrap">
                          🕒 {formatTimeAgo(request.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex sm:block">
                      <DynamicAdminRequestActions request={request} />
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