import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
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

// ContactExchange must be client-only (ssr: false) because it calls createClient()
// at the module level (outside useEffect), which uses browser APIs
const ContactExchange = dynamic(() =>
  import('@/components/ContactExchange').then(mod => ({ default: mod.ContactExchange })),
  {
    loading: () => <div className="p-4 text-center text-muted-foreground">Loading contact exchange...</div>,
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
  try {
    const supabase = await createClient();
    
    // Enhanced auth call with proper error handling
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.warn('[User Auth] Auth error:', error.message);
      if (!error.message?.includes('Auth session missing')) {
        console.error('[User Auth] Unexpected auth error:', error);
      }
      return null;
    }
    
    if (!user) {
      return null;
    }

    // Get user profile with retry mechanism
    let profile = null;
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries && !profile) {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, location')
          .eq('id', user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        profile = profileData;
        break;

      } catch (profileError) {
        retryCount++;
        console.warn(`[User Auth] Profile fetch attempt ${retryCount} failed:`, profileError);
        
        if (retryCount <= maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    return {
      id: user.id,
      name: profile?.name || user.email?.split('@')[0] || 'Unknown',
      email: user.email || ''
    };

  } catch (error) {
    console.error('[User Auth] Critical auth error:', error);
    return null;
  }
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

    if (unreadError) {
      console.error('[Messaging Data] Error fetching unread count:', {
        userId,
        error: unreadError.message,
        code: unreadError.code,
        timestamp: new Date().toISOString(),
      });
    }

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

    if (conversationsError) {
      console.error('[Messaging Data] Error fetching conversations:', {
        userId,
        error: conversationsError.message,
        code: conversationsError.code,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      unreadCount: unreadCount || 0,
      activeConversations: conversations?.length || 0
    };
  } catch (error) {
    console.error('[Messaging Data] Unexpected error:', {
      userId,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
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
      console.error('[Help Request Messaging] Error fetching conversations:', {
        requestId,
        userId,
        error: conversationsError.message,
        code: conversationsError.code,
        timestamp: new Date().toISOString(),
      });
      throw conversationsError;
    }

    // Get unread count for this help request's conversations
    let unreadCount = 0;
    if (conversations && conversations.length > 0) {
      const conversationIds = conversations.map(c => c.id);
      const { count, error: messagesError } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .in('conversation_id', conversationIds)
        .eq('recipient_id', userId)
        .is('read_at', null);
      
      if (messagesError) {
        console.error('[Help Request Messaging] Error fetching message count:', {
          requestId,
          userId,
          conversationIds,
          error: messagesError.message,
          code: messagesError.code,
          timestamp: new Date().toISOString(),
        });
      }
      
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
    console.error('[Help Request Messaging] Unexpected error:', {
      requestId,
      userId,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
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
  
  let messagingData;
  try {
    messagingData = await getMessagingData(user.id);
  } catch (messagingError) {
    console.error('[Help Request] Messaging data fetch failed:', messagingError);
    messagingData = { unreadCount: 0, activeConversations: 0 };
  }

  // Enhanced database query with proper error handling
  // NOTE: Using separate queries instead of foreign key joins to work around RLS limitations
  // Foreign key joins with RLS policies can fail even with correct policies
  let request = null;
  let requestError = null;

  try {
    // Step 1: Fetch the help request without joins
    const { data: requestData, error: requestQueryError } = await supabase
      .from('help_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (requestQueryError) {
      requestError = requestQueryError;
    } else if (requestData) {
      // Step 2: Fetch requester profile separately
      const { data: requesterProfile } = await supabase
        .from('profiles')
        .select('id, name, location')
        .eq('id', requestData.user_id)
        .single();

      // Step 3: Fetch helper profile separately (if exists)
      let helperProfile = null;
      if (requestData.helper_id) {
        const { data: helperData } = await supabase
          .from('profiles')
          .select('id, name, location')
          .eq('id', requestData.helper_id)
          .single();
        helperProfile = helperData;
      }

      // Combine the data with fallback for profiles
      request = {
        ...requestData,
        profiles: requesterProfile || {
          id: requestData.user_id,
          name: 'Unknown User',
          location: null
        },
        helper: helperProfile
      };
    }
  } catch (error) {
    console.error('[Help Request] Unexpected error:', error);
    requestError = {
      message: 'Failed to fetch help request',
      code: 'QUERY_FAILED',
      details: error instanceof Error ? error.message : String(error)
    };
  }

  // Enhanced error handling with proper logging
  if (requestError) {
    console.error('[Help Request Error]', {
      requestId: id,
      error: requestError.message,
      code: requestError.code,
      details: requestError.details,
      hint: requestError.hint,
      timestamp: new Date().toISOString(),
    });

    // Distinguish between different error types
    if (requestError.code === 'PGRST116') {
      // No rows returned - request not found
      console.info(`[Help Request] Request not found: ${id}`);
      notFound();
    } else {
      // Database connection or other errors
      console.error(`[Help Request] Database error for request ${id}:`, requestError);
      throw new Error(`Database error: ${requestError.message}`);
    }
  }

  if (!request) {
    console.warn(`[Help Request] No request data returned for ID: ${id}`);
    notFound();
  }

  let helpRequestMessagingStatus;
  try {
    helpRequestMessagingStatus = await getHelpRequestMessagingStatus(id, user.id);
  } catch (messagingStatusError) {
    console.error('[Help Request] Messaging status fetch failed:', messagingStatusError);
    helpRequestMessagingStatus = {
      conversationCount: 0,
      unreadCount: 0,
      hasActiveConversations: false
    };
  }

  const isOwner = request.user_id === user.id
  const isHelper = request.helper_id === user.id
  const canHelp = !isOwner && !request.helper_id && request.status === 'open'
  const canUpdateStatus = isOwner || isHelper

  // MINIMAL PAGE TEST - Bug #7 Test #4
  // Testing if error is in PlatformLayout or components
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{request.title}</h1>
      <p className="mb-4">{request.description || 'No description'}</p>
      <p className="mb-2"><strong>Status:</strong> {request.status}</p>
      <p className="mb-2"><strong>Category:</strong> {request.category}</p>
      <p className="mb-2"><strong>Urgency:</strong> {request.urgency}</p>
      <p className="mb-2"><strong>Requester:</strong> {request.profiles?.name || 'Unknown'}</p>
      <p className="text-sm text-muted-foreground mt-4">
        Test #4: Minimal page to isolate error location
      </p>
    </div>
  )
}