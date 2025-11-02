/**
 * @fileoverview Main messaging page for Care Collective
 * Server-side rendered page with integrated platform layout
 */

import { ReactElement } from 'react';
import { createClient } from '@/lib/supabase/server';
import { MessagingDashboard } from '@/components/messaging/MessagingDashboard';
import { PlatformLayout } from '@/components/layout/PlatformLayout';
import { redirect } from 'next/navigation';

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
  // V1: Use tables with read tracking enabled
  try {
    const supabase = await createClient();

    // Get total unread count using database function
    const { data: unreadData, error: unreadError } = await supabase
      .rpc('get_unread_message_count', { user_uuid: userId });

    if (unreadError) {
      console.error('[MessagesPage] Error getting unread count:', unreadError);
    }

    const totalUnreadCount = unreadData || 0;

    // Get user's conversations with participants and messages
    const { data: conversationsData, error: conversationsError } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        conversations!inner (
          id,
          help_request_id,
          created_by,
          title,
          status,
          created_at,
          updated_at,
          last_message_at,
          help_requests (
            id,
            title,
            category,
            urgency,
            status
          )
        )
      `)
      .eq('user_id', userId)
      .is('left_at', null)
      .eq('conversations.status', 'active')
      .order('conversations.last_message_at', { ascending: false });

    if (conversationsError) {
      console.error('[MessagesPage] Error loading conversations:', conversationsError);
      return { conversations: [], unreadCount: totalUnreadCount, activeConversations: 0 };
    }

    // Get per-conversation unread counts and format conversations
    const conversations = await Promise.all(
      (conversationsData || []).map(async (item: any) => {
        const conv = item.conversations;

        // Get unread count for this conversation
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('recipient_id', userId)
          .is('read_at', null);

        // Get other participants
        const { data: otherParticipants } = await supabase
          .from('conversation_participants')
          .select('user_id, profiles!inner(name, location)')
          .eq('conversation_id', conv.id)
          .neq('user_id', userId)
          .is('left_at', null);

        // Get last message
        const { data: lastMessages } = await supabase
          .from('messages')
          .select('id, content, sender_id, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const lastMessage = lastMessages?.[0];
        const otherParticipant = otherParticipants?.[0];

        return {
          id: conv.id,
          help_request_id: conv.help_request_id,
          created_by: conv.created_by,
          title: conv.help_requests?.title || conv.title || 'Conversation',
          status: conv.status,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          last_message_at: conv.last_message_at || conv.created_at,
          unread_count: unreadCount || 0,
          participants: otherParticipants?.map((p: any) => ({
            user_id: p.user_id,
            name: p.profiles?.name || 'Unknown',
            location: p.profiles?.location,
            role: 'member' as const
          })) || [],
          help_request: conv.help_requests,
          last_message: lastMessage ? {
            ...lastMessage,
            sender_name: lastMessage.sender_id === userId
              ? 'You'
              : ((otherParticipant as any)?.profiles?.name || 'Unknown')
          } : undefined
        };
      })
    );

    return {
      conversations,
      unreadCount: totalUnreadCount,
      activeConversations: conversations.length
    };
  } catch (error) {
    console.error('[MessagesPage] Error:', error);
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
      <div className="messaging-page-container overflow-hidden">
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