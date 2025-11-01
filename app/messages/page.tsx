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
  // V2: Always use atomic RPC function to list conversations (V1 removed)
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