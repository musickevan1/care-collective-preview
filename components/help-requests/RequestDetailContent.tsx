/**
 * @fileoverview Request Detail Content Component
 * Displays full help request details including messaging, actions, and timeline
 * Used in both modal and standalone views
 */

'use client'

import { ReactElement } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { HelpRequestCardWithMessaging } from '@/components/help-requests/HelpRequestCardWithMessaging'
import { MessagingStatusIndicator } from '@/components/messaging/MessagingStatusIndicator'
import { ClientOnly } from '@/components/ClientOnly'
import Link from 'next/link'
import { format } from 'date-fns'

// Import RequestActions dynamically as it's a client component
const RequestActions = dynamic(
  () => import('@/app/requests/[id]/RequestActions').then(mod => ({ default: mod.RequestActions })),
  {
    ssr: false,
    loading: () => <div className="p-4 text-center text-muted-foreground">Loading actions...</div>
  }
)

// ContactExchange must be client-only (ssr: false) because it calls createClient()
// at the module level (outside useEffect), which uses browser APIs
const ContactExchange = dynamic(() =>
  import('@/components/ContactExchange').then(mod => ({ default: mod.ContactExchange })),
  {
    loading: () => <div className="p-4 text-center text-muted-foreground">Loading contact exchange...</div>,
    ssr: false
  }
)

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

function formatDate(dateString: string) {
  return format(new Date(dateString), 'MMMM d, yyyy h:mm a')
}

interface RequestDetailContentProps {
  request: any // Full request object with nested profiles
  currentUserId: string
  helpRequestMessagingStatus?: {
    conversationCount: number
    unreadCount: number
    hasActiveConversations: boolean
  }
}

export function RequestDetailContent({
  request,
  currentUserId,
  helpRequestMessagingStatus = {
    conversationCount: 0,
    unreadCount: 0,
    hasActiveConversations: false
  }
}: RequestDetailContentProps): ReactElement {
  const isOwner = request.user_id === currentUserId
  const isHelper = request.helper_id === currentUserId
  const canHelp = !isOwner && !request.helper_id && request.status === 'open'
  const canUpdateStatus = isOwner || isHelper

  // Transform request for HelpRequestCardWithMessaging with defensive null checks
  const transformedRequest = {
    id: request.id,
    user_id: request.user_id,
    title: request.title,
    description: request.description || undefined,
    category: request.category,
    urgency: request.urgency as 'normal' | 'urgent' | 'critical',
    status: request.status as 'open' | 'in_progress' | 'closed',
    created_at: request.created_at,
    profiles: {
      id: request.profiles?.id || request.user_id,
      name: request.profiles?.name || 'Anonymous',
      location: request.profiles?.location || null
    }
  }

  // Transform request for ContactExchange with all required fields
  // Only create this if there's actually a helper assigned
  const contactExchangeRequest = request.helper_id ? {
    id: request.id,
    title: request.title,
    description: request.description || '',
    category: request.category,
    urgency: request.urgency,
    status: request.status,
    user_id: request.user_id,
    helper_id: request.helper_id,
    created_at: request.created_at,
    profiles: {
      id: request.profiles?.id || request.user_id,
      name: request.profiles?.name || 'Anonymous',
      email: request.profiles?.email || null,
      phone: request.profiles?.phone || null,
      location: request.profiles?.location || null
    }
  } : null

  return (
    <div className="space-y-6">
      {/* Messaging Status */}
      {helpRequestMessagingStatus.conversationCount > 0 && (
        <div>
          <MessagingStatusIndicator
            helpRequestId={request.id}
            status={helpRequestMessagingStatus}
            isOwnRequest={isOwner}
            size="lg"
            showDetails={true}
          />
        </div>
      )}

      {/* Main Request Card with Messaging */}
      <HelpRequestCardWithMessaging
        request={transformedRequest}
        currentUserId={currentUserId}
      />

      {/* Additional Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Full Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {request.description || 'No additional description provided.'}
            </p>
          </div>

          {/* Category */}
          <div>
            <h3 className="font-semibold mb-2">Category</h3>
            <Badge variant={categoryColors[request.category as keyof typeof categoryColors]}>
              {request.category}
            </Badge>
          </div>

          {/* Request Timeline - wrapped in ClientOnly to prevent hydration issues */}
          <div>
            <h3 className="font-semibold mb-2">Timeline</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <ClientOnly fallback={<span className="text-muted-foreground">Loading...</span>}>
                  <span>{formatDate(request.created_at)}</span>
                </ClientOnly>
              </div>
              {request.helped_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Help started:</span>
                  <ClientOnly fallback={<span className="text-muted-foreground">Loading...</span>}>
                    <span>{formatDate(request.helped_at)}</span>
                  </ClientOnly>
                </div>
              )}
              {request.completed_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed:</span>
                  <ClientOnly fallback={<span className="text-muted-foreground">Loading...</span>}>
                    <span>{formatDate(request.completed_at)}</span>
                  </ClientOnly>
                </div>
              )}
              {request.cancelled_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cancelled:</span>
                  <ClientOnly fallback={<span className="text-muted-foreground">Loading...</span>}>
                    <span>{formatDate(request.cancelled_at)}</span>
                  </ClientOnly>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messaging and Communication */}
      {(isOwner || isHelper) && (
        <Card>
          <CardHeader>
            <CardTitle>Communication</CardTitle>
            <CardDescription>
              {isOwner
                ? "Manage conversations with people offering help"
                : "Communicate with the person who needs help"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {helpRequestMessagingStatus.conversationCount > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-sage/5 rounded-lg border">
                  <div>
                    <h4 className="font-medium text-secondary">
                      {helpRequestMessagingStatus.conversationCount} active conversation{helpRequestMessagingStatus.conversationCount !== 1 ? 's' : ''}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {helpRequestMessagingStatus.unreadCount > 0
                        ? `${helpRequestMessagingStatus.unreadCount} unread message${helpRequestMessagingStatus.unreadCount !== 1 ? 's' : ''}`
                        : 'All messages read'
                      }
                    </p>
                  </div>
                  <Button asChild>
                    <Link href={`/messages?help_request=${request.id}`}>
                      View Messages
                    </Link>
                  </Button>
                </div>

                {/* Contact Exchange - Show when someone is helping */}
                {contactExchangeRequest && (isOwner || isHelper) && (
                  <ContactExchange
                    helpRequest={contactExchangeRequest}
                  />
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">
                  {isOwner
                    ? "No one has offered help yet. Share this request to get more visibility."
                    : "Start a conversation to offer help and coordinate assistance."
                  }
                </p>
                {!isOwner && canHelp && (
                  <p className="text-sm text-muted-foreground">
                    Use the "Offer Help" button above to start messaging.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Request Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Request Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <RequestActions
            request={request}
            userId={currentUserId}
            isOwner={isOwner}
            isHelper={isHelper}
            canHelp={canHelp}
            canUpdateStatus={canUpdateStatus}
          />
        </CardContent>
      </Card>
    </div>
  )
}
