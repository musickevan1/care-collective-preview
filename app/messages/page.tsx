/**
 * @fileoverview Main messaging page for Care Collective
 * Server-side rendered page with messaging dashboard
 */

import { ReactElement } from 'react';
import { createClient } from '@/lib/supabase/server';
import { MessagingDashboard } from '@/components/messaging/MessagingDashboard';
import { redirect } from 'next/navigation';
import { messagingClient } from '@/lib/messaging/client';

interface MessagesPageProps {
  searchParams: { conversation?: string; help_request?: string };
}

export default async function MessagesPage({ searchParams }: MessagesPageProps): Promise<ReactElement> {
  const supabase = createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/auth/signin?redirect=/messages');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/auth/signup?redirect=/messages');
  }

  // Load initial conversations
  let initialConversations;
  try {
    const conversationsData = await messagingClient.getConversations(user.id, { limit: 20 });
    initialConversations = conversationsData.conversations;
  } catch (error) {
    console.error('Failed to load conversations:', error);
    initialConversations = [];
  }

  return (
    <div className=\"h-screen overflow-hidden\">
      <MessagingDashboard 
        initialConversations={initialConversations}
        userId={user.id}
      />
    </div>
  );
}

export const metadata = {
  title: 'Messages - Care Collective',
  description: 'Secure community messaging for mutual aid coordination'
};