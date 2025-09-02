import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/StatusBadge'
import Link from 'next/link'
import { RequestActions } from './RequestActions'
import dynamic from 'next/dynamic'

const ContactExchange = dynamic(() => 
  import('@/components/ContactExchange').then(mod => ({ default: mod.ContactExchange })),
  { 
    loading: () => <div className="p-4">Loading contact exchange...</div>,
    ssr: false 
  }
)

interface PageProps {
  params: Promise<{ id: string }>
}

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

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

export default async function RequestDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }

  const { data: request, error: requestError } = await supabase
    .from('help_requests')
    .select(`
      *,
      profiles!user_id (id, name, location),
      helper:profiles!helper_id (id, name, location)
    `)
    .eq('id', id)
    .single()

  if (requestError || !request) {
    redirect('/requests')
  }

  const isOwner = request.user_id === user.id
  const isHelper = request.helper_id === user.id
  const canHelp = !isOwner && !request.helper_id && request.status === 'open'
  const canUpdateStatus = isOwner || isHelper

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-secondary text-secondary-foreground shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/requests">
              <Button variant="ghost" size="sm">
                ← Back to Requests
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Request Details</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">
                  {request.title}
                </CardTitle>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>By {request.profiles?.name || 'Anonymous'}</span>
                  {request.profiles?.location && (
                    <>
                      <span>•</span>
                      <span>{request.profiles.location}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{formatDate(request.created_at)}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <StatusBadge status={request.status} />
                <Badge variant={urgencyColors[request.urgency as keyof typeof urgencyColors]}>
                  {request.urgency}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {request.description || 'No description provided.'}
              </p>
            </div>

            {/* Category */}
            <div>
              <h3 className="font-semibold mb-2">Category</h3>
              <Badge variant={categoryColors[request.category as keyof typeof categoryColors]}>
                {request.category}
              </Badge>
            </div>

            {/* Contact Exchange - Show when someone is helping */}
            {request.helper_id && (isOwner || isHelper) && (
              <ContactExchange
                requestId={request.id}
                helperId={request.helper_id}
                requesterId={request.user_id}
                isHelper={isHelper}
                isRequester={isOwner}
              />
            )}

            {/* Helper Information */}
            {request.helper_id && (
              <div className="p-4 bg-secondary/20 rounded-lg">
                <h3 className="font-semibold mb-2">Helper Information</h3>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">Helper:</span>{' '}
                    <span className="font-medium">{request.helper?.name || 'Anonymous'}</span>
                  </p>
                  {request.helper?.location && (
                    <p>
                      <span className="text-muted-foreground">Location:</span>{' '}
                      {request.helper.location}
                    </p>
                  )}
                  {request.helped_at && (
                    <p>
                      <span className="text-muted-foreground">Started helping:</span>{' '}
                      {formatDate(request.helped_at)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Status History */}
            {(request.completed_at || request.cancelled_at) && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold mb-2">Status History</h3>
                <div className="text-sm space-y-1">
                  {request.completed_at && (
                    <p>
                      <span className="text-muted-foreground">Completed:</span>{' '}
                      {formatDate(request.completed_at)}
                    </p>
                  )}
                  {request.cancelled_at && (
                    <>
                      <p>
                        <span className="text-muted-foreground">Cancelled:</span>{' '}
                        {formatDate(request.cancelled_at)}
                      </p>
                      {request.cancel_reason && (
                        <p>
                          <span className="text-muted-foreground">Reason:</span>{' '}
                          {request.cancel_reason}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <RequestActions
              request={request}
              userId={user.id}
              isOwner={isOwner}
              isHelper={isHelper}
              canHelp={canHelp}
              canUpdateStatus={canUpdateStatus}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}