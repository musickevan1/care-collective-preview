/**
 * @fileoverview Main messaging page for Care Collective
 * Server-side rendered page with integrated platform layout
 */

import { ReactElement } from 'react';
import { createClient } from '@/lib/supabase/server';
import { PlatformLayout } from '@/components/layout/PlatformLayout';
import { redirect } from 'next/navigation';

// Force dynamic rendering for authentication
export const dynamic = 'force-dynamic';

interface MessagesPageProps {
  searchParams: { conversation?: string; help_request?: string };
}

async function getUser() {
  const supabase = createClient();
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
  const supabase = createClient();
  
  try {
    // Get user's conversations
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select(`
        id,
        help_request_id,
        last_message_at,
        created_at,
        conversation_participants!inner (
          user_id,
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
      .eq('conversation_participants.user_id', userId)
      .is('conversation_participants.left_at', null)
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
        // Get the other participant
        const otherParticipant = conv.conversation_participants.find(
          p => p.user_id !== userId
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
          last_message_at: conv.last_message_at,
          unread_count: convUnreadCount || 0,
          other_participant: {
            id: otherParticipant?.user_id || '',
            name: otherParticipant?.profiles?.name || 'Unknown',
            location: otherParticipant?.profiles?.location
          },
          help_request: conv.help_requests ? {
            id: conv.help_requests.id,
            title: conv.help_requests.title,
            category: conv.help_requests.category,
            urgency: conv.help_requests.urgency,
            status: conv.help_requests.status
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
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold text-secondary mb-4">Messaging System</h1>
          <p className="text-muted-foreground mb-6">
            Secure messaging feature is currently being redesigned for enhanced security.
          </p>
          <div className="bg-background border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Current Messaging Data</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Active Conversations:</strong> {activeConversations}
              </div>
              <div>
                <strong>Unread Messages:</strong> {unreadCount}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PlatformLayout>
  );
}

export const metadata = {
  title: 'Messages - Care Collective',
  description: 'Secure community messaging for mutual aid coordination'
};