/**
 * @fileoverview Requests List with Modal Integration
 * Client component that wraps the requests list and handles modal state
 * Reads URL params to show request details in a modal
 */

'use client'

import { ReactElement, useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/StatusBadge'
import { RequestDetailModal } from '@/components/help-requests/RequestDetailModal'
import Link from 'next/link'

interface HelpRequest {
  id: string
  user_id: string
  title: string
  description?: string
  category: string
  urgency: string
  status: string
  created_at: string
  profiles: {
    name: string
    location: string | null
  }
  helper?: {
    name: string
  } | null
}

// Helper function moved into client component
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

interface RequestsListWithModalProps {
  requests: HelpRequest[]
  currentUserId: string
}

// Category and urgency colors defined in client component
const categoryColors: Record<string, string> = {
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
}

const urgencyColors: Record<string, string> = {
  normal: 'outline',
  urgent: 'secondary',
  critical: 'destructive'
}

export function RequestsListWithModal({
  requests,
  currentUserId
}: RequestsListWithModalProps): ReactElement {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestId = searchParams.get('id')

  const [selectedRequest, setSelectedRequest] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  // Wait for hydration before any state updates
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Fetch request details when ID in URL (after hydration)
  useEffect(() => {
    // Don't update state during hydration
    if (!isHydrated) return

    if (requestId) {
      setLoading(true)
      setError(null)

      fetch(`/api/requests/${requestId}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to fetch request')
          }
          return res.json()
        })
        .then(data => {
          setSelectedRequest(data)
          setLoading(false)
        })
        .catch(err => {
          console.error('Error fetching request:', err)
          setError('Failed to load request details')
          setLoading(false)
          // Clear the invalid ID from URL
          router.push('/requests')
        })
    } else {
      setSelectedRequest(null)
    }
  }, [requestId, router, isHydrated])

  const handleRequestClick = (id: string) => {
    router.push(`/requests?id=${id}`)
  }

  const handleCloseModal = () => {
    router.push('/requests')
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {requests.map((request: HelpRequest) => {
          // Defensive null checks for rendering
          const title = request.title || 'Untitled Request'
          const urgency = request.urgency || 'normal'
          const profileName = request.profiles?.name || 'Anonymous'
          const profileLocation = request.profiles?.location

          return (
            <Card
              key={request.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleRequestClick(request.id)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-lg font-semibold line-clamp-2">
                    {title}
                  </h3>
                  <Badge variant={(urgencyColors as any)[urgency] || 'outline'} className="text-xs whitespace-nowrap">
                    {urgency}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <span>{profileName}</span>
                  {profileLocation && (
                    <>
                      <span>•</span>
                      <span>{profileLocation}</span>
                    </>
                  )}
                </div>
                {request.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {request.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Badge variant={(categoryColors as any)[request.category] || 'outline'} className="text-xs">
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation() // Prevent card click
                      handleRequestClick(request.id)
                    }}
                  >
                    View Details {request.status === 'open' && '& Offer Help'}
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Request Detail Modal - wrapped in Suspense to prevent hydration errors */}
      <Suspense fallback={null}>
        {selectedRequest && !loading && !error && (
          <RequestDetailModal
            request={selectedRequest}
            currentUserId={currentUserId}
            open={!!selectedRequest}
            onClose={handleCloseModal}
          />
        )}
      </Suspense>

      {/* Loading state */}
      {loading && requestId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg">
            <p>Loading request details...</p>
          </div>
        </div>
      )}
    </>
  )
}
