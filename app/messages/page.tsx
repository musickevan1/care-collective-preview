/**
 * @fileoverview Main messaging page for Care Collective
 * Server-side rendered page with integrated platform layout
 */

import { ReactElement } from 'react';
import { createClient } from '@/lib/supabase/server';
import { MessagingDashboard } from '@/components/messaging/MessagingDashboard';
import { PlatformLayout } from '@/components/layout/PlatformLayout';
import { redirect } from 'next/navigation';
import { isMessagingV2Enabled } from '@/lib/features';
import { messagingServiceV2 } from '@/lib/messaging/service-v2';

// Force dynamic rendering for authentication
export const dynamic = 'force-dynamic';

interface MessagesPageProps {
  searchParams: { conversation?: string; help_request?: string };
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
  const useV2 = isMessagingV2Enabled();

  if (useV2) {
    // V2: Use atomic RPC function to list conversations
    try {
      const result = await messagingServiceV2.listConversations(userId);

      if (!result.success) {
        console.error('[MessagesPage] V2 list conversations failed:', result.error);
        return { conversations: [], unreadCount: 0, activeConversations: 0 };
      }

      const conversations = (result.conversations || []).map((conv: any) => ({
        id: conv.id,
        help_request_id: conv.help_request_id,
        created_by: conv.requester_id,
        title: conv.help_request?.title || 'Conversation',
        status: conv.status,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        last_message_at: conv.last_message_at,
        unread_count: 0, // V2 doesn't have read tracking yet
        // Transform other_participant into participants array for component compatibility
        participants: [
          {
            user_id: conv.other_participant.id,
            name: conv.other_participant.name || 'Unknown',
            location: conv.other_participant.location,
            role: 'member' as const
          }
        ],
        help_request: conv.help_request,
        last_message: conv.last_message ? {
          ...conv.last_message,
          sender_name: conv.last_message.sender_id === userId ? 'You' : conv.other_participant.name
        } : undefined
      }));

      return {
        conversations,
        unreadCount: 0, // V2 doesn't have read tracking yet
        activeConversations: conversations.length
      };
    } catch (error) {
      console.error('[MessagesPage] V2 error:', error);
      return { conversations: [], unreadCount: 0, activeConversations: 0 };
    }
  }

  // V1: Legacy implementation
  const supabase = await createClient();

  try {
    // First, get conversation IDs where user is a participant
    const { data: userConversations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId)
      .is('left_at', null);

    const conversationIds = userConversations?.map(uc => uc.conversation_id) || [];

    if (conversationIds.length === 0) {
      return { conversations: [], unreadCount: 0, activeConversations: 0 };
    }

    // Now get full conversation data with ALL participants
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select(`
        id,
        help_request_id,
        last_message_at,
        created_at,
        conversation_participants (
          user_id,
          left_at,
          profiles (
            id,
            name,
            location
          )
        ),
        help_requests (
          id,
          title,
          category,
          urgency,
          status
        )
      `)
      .in('id', conversationIds)
      .order('last_message_at', { ascending: false });

    if (conversationsError) {
      console.error('Error fetching conversations:', conversationsError);
      return { conversations: [], unreadCount: 0, activeConversations: 0 };
    }

    // Get unread count
    const { count: unreadCount, error: unreadError } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('recipient_id', userId)
      .is('read_at', null);

    if (unreadError) {
      console.error('Error fetching unread count:', unreadError);
    }

    // Transform conversations for display
    const formattedConversations = await Promise.all(
      (conversations || []).map(async (conv) => {
        // Get the other participant (exclude current user and those who left)
        const otherParticipant = conv.conversation_participants.find(
          p => p.user_id !== userId && !p.left_at
        );

        // Get last message
        const { data: lastMessage } = await supabase
          .from('messages')
          .select(`
            content,
            sender_id,
            created_at
          `)
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get unread count for this conversation
        const { count: convUnreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact' })
          .eq('conversation_id', conv.id)
          .eq('recipient_id', userId)
          .is('read_at', null);

        return {
          id: conv.id,
          help_request_id: conv.help_request_id,
          created_by: (conv as any).requester_id || '',
          status: (conv as any).status || 'active',
          created_at: conv.created_at,
          updated_at: (conv as any).updated_at || conv.created_at,
          last_message_at: conv.last_message_at,
          unread_count: convUnreadCount || 0,
          participants: [{
            user_id: otherParticipant?.user_id || '',
            name: Array.isArray(otherParticipant?.profiles) ? (otherParticipant.profiles[0] as any)?.name || 'Unknown' : (otherParticipant?.profiles as any)?.name || 'Unknown',
            location: Array.isArray(otherParticipant?.profiles) ? (otherParticipant.profiles[0] as any)?.location : (otherParticipant?.profiles as any)?.location,
            role: 'member' as const
          }],
          other_participant: {
            id: otherParticipant?.user_id || '',
            name: Array.isArray(otherParticipant?.profiles) ? (otherParticipant.profiles[0] as any)?.name || 'Unknown' : (otherParticipant?.profiles as any)?.name || 'Unknown',
            location: Array.isArray(otherParticipant?.profiles) ? (otherParticipant.profiles[0] as any)?.location : (otherParticipant?.profiles as any)?.location
          },
          help_request: conv.help_requests ? {
            id: (conv.help_requests as any).id,
            title: (conv.help_requests as any).title,
            category: (conv.help_requests as any).category,
            urgency: (conv.help_requests as any).urgency,
            status: (conv.help_requests as any).status
          } : undefined,
          last_message: lastMessage ? {
            content: lastMessage.content,
            sender_id: lastMessage.sender_id,
            created_at: lastMessage.created_at
          } : undefined
        };
      })
    );

    return {
      conversations: formattedConversations,
      unreadCount: unreadCount || 0,
      activeConversations: formattedConversations.length
    };

  } catch (error) {
    console.error('Error fetching messaging data:', error);
    return { conversations: [], unreadCount: 0, activeConversations: 0 };
  }
}

export default async function MessagesPage({ searchParams }: MessagesPageProps): Promise<ReactElement> {
  const user = await getUser();
  
  if (!user) {
    redirect('/login?redirect=/messages');
  }

  const { conversations, unreadCount, activeConversations } = await getMessagingData(user.id);
  
  const messagingData = {
    unreadCount,
    activeConversations
  };

  const breadcrumbs = [
    { label: 'Messages', href: '/messages' }
  ];

  return (
    <PlatformLayout 
      user={user} 
      messagingData={messagingData}
      showMessagingContext={true}
      breadcrumbs={breadcrumbs}
    >
      <div className="h-[calc(100vh-64px)] overflow-hidden">
        <MessagingDashboard
          initialConversations={conversations as any}
          userId={user.id}
          selectedConversationId={searchParams.conversation}
          enableRealtime={true}
        />
      </div>
    </PlatformLayout>
  );
}

export const metadata = {
  title: 'Messages - Care Collective',
  description: 'Secure community messaging for mutual aid coordination'
};