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
  // V2: Use conversations_v2 with RPC (Phase 2.2/2.3 migration)
  try {
    const supabase = await createClient();

    // Get conversations using the list_conversations_v2 RPC
    const { data: conversationsResponse, error: conversationsError } = await supabase
      .rpc('list_conversations_v2', {
        p_user_id: userId,
        p_status: 'active'
      });

    if (conversationsError) {
      console.error('[MessagesPage] Error loading conversations v2:', conversationsError);
      return { conversations: [], unreadCount: 0, activeConversations: 0 };
    }

    const result = conversationsResponse as {
      success: boolean;
      count: number;
      conversations: any[];
    } | null;

    if (!result?.success || !result?.conversations) {
      console.warn('[MessagesPage] RPC returned empty result');
      return { conversations: [], unreadCount: 0, activeConversations: 0 };
    }

    // Format conversations from RPC response
    const conversations = result.conversations.map((conv: any) => ({
      id: conv.id,
      help_request_id: conv.help_request_id,
      created_by: conv.requester_id,
      title: conv.title || 'Conversation',
      status: conv.status,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
      last_message_at: conv.last_message_at || conv.created_at,
      unread_count: conv.unread_count || 0,
      participants: conv.participants || [],
      help_request: conv.help_request || undefined,
      last_message: conv.last_message || undefined
    }));

    // Calculate total unread
    const unreadCount = conversations.reduce((sum: number, conv: any) => sum + (conv.unread_count || 0), 0);

    return {
      conversations,
      unreadCount,
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
  title: 'Messages - CARE Collective',
  description: 'Secure community messaging for mutual aid coordination'
};