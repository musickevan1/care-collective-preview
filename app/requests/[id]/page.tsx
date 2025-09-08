import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/StatusBadge'
import { PlatformLayout } from '@/components/layout/PlatformLayout'
import { HelpRequestCardWithMessaging } from '@/components/help-requests/HelpRequestCardWithMessaging'
import { MessagingStatusIndicator } from '@/components/messaging/MessagingStatusIndicator'
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

async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, location')
    .eq('id', user.id)
    .single();

  return {
    id: user.id,
    name: profile?.name || user.email?.split('@')[0] || 'Unknown',
    email: user.email || ''
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

async function getHelpRequestMessagingStatus(requestId: string, userId: string) {
  const supabase = await createClient();
  
  try {
    // Get conversations for this help request
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select(`
        id,
        last_message_at,
        conversation_participants!inner (
          user_id
        )
      `)
      .eq('help_request_id', requestId)
      .eq('conversation_participants.user_id', userId)
      .is('conversation_participants.left_at', null);

    if (conversationsError) {
      throw conversationsError;
    }

    // Get unread count for this help request's conversations
    let unreadCount = 0;
    if (conversations && conversations.length > 0) {
      const conversationIds = conversations.map(c => c.id);
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .in('conversation_id', conversationIds)
        .eq('recipient_id', userId)
        .is('read_at', null);
      
      unreadCount = count || 0;
    }

    return {
      conversationCount: conversations?.length || 0,
      unreadCount,
      hasActiveConversations: conversations ? conversations.some(conv => 
        conv.last_message_at && 
        new Date(conv.last_message_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ) : false,
      lastMessageTime: conversations?.[0]?.last_message_at
    };
  } catch (error) {
    console.error('Error fetching help request messaging status:', error);
    return {
      conversationCount: 0,
      unreadCount: 0,
      hasActiveConversations: false
    };
  }
}

export default async function RequestDetailPage({ params }: PageProps) {
  const { id } = await params
  
  const user = await getUser();
  
  if (!user) {
    redirect('/login?redirect=/requests/' + id);
  }

  const supabase = await createClient();
  const messagingData = await getMessagingData(user.id);

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

  const helpRequestMessagingStatus = await getHelpRequestMessagingStatus(id, user.id);

  const isOwner = request.user_id === user.id
  const isHelper = request.helper_id === user.id
  const canHelp = !isOwner && !request.helper_id && request.status === 'open'
  const canUpdateStatus = isOwner || isHelper

  const breadcrumbs = [
    { label: 'Help Requests', href: '/requests' },
    { label: request.title }
  ];

  // Transform request for HelpRequestCardWithMessaging
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
      location: request.profiles?.location
    }
  };

  return (
    <PlatformLayout 
      user={user} 
      messagingData={messagingData}
      breadcrumbs={breadcrumbs}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Messaging Status */}
        {helpRequestMessagingStatus.conversationCount > 0 && (
          <div className="mb-6">
            <MessagingStatusIndicator
              helpRequestId={id}
              status={helpRequestMessagingStatus}
              isOwnRequest={isOwner}
              size="lg"
              showDetails={true}
            />
          </div>
        )}

        <div className="space-y-6">
          {/* Use HelpRequestCardWithMessaging for consistent experience */}
          <HelpRequestCardWithMessaging
            request={transformedRequest}
            currentUserId={user.id}
            onConversationStarted={(conversationId) => {
              // Could redirect to messages or show success state
              console.log('Conversation started:', conversationId);
            }}
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

              {/* Request Timeline */}
              <div>
                <h3 className="font-semibold mb-2">Timeline</h3>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{formatDate(request.created_at)}</span>
                  </div>
                  {request.helped_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Help started:</span>
                      <span>{formatDate(request.helped_at)}</span>
                    </div>
                  )}
                  {request.completed_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completed:</span>
                      <span>{formatDate(request.completed_at)}</span>
                    </div>
                  )}
                  {request.cancelled_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cancelled:</span>
                      <span>{formatDate(request.cancelled_at)}</span>
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
                        <Link href={`/messages?help_request=${id}`}>
                          View Messages
                        </Link>
                      </Button>
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

          {/* Legacy Actions (for compatibility) */}
          <Card>
            <CardHeader>
              <CardTitle>Request Actions</CardTitle>
            </CardHeader>
            <CardContent>
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
      </div>
    </PlatformLayout>
  )
}