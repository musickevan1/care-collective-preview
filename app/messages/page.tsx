/**
 * @fileoverview Main messaging page for Care Collective
 * Server-side rendered page with messaging dashboard
 */

import { ReactElement } from 'react';

// Force dynamic rendering for authentication
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { MessagingDashboard } from '@/components/messaging/MessagingDashboard';
import { redirect } from 'next/navigation';

interface MessagesPageProps {
  searchParams: { conversation?: string; help_request?: string };
}

export default async function MessagesPage({ searchParams }: MessagesPageProps): Promise<ReactElement> {
  // For now, provide a simple messaging interface without server-side auth
  // This will be enhanced once the full messaging system is integrated
  
  return (
    <div className="h-screen overflow-hidden">
      <MessagingDashboard 
        initialConversations={[]}
        userId="demo-user"
      />
    </div>
  );
}

export const metadata = {
  title: 'Messages - Care Collective',
  description: 'Secure community messaging for mutual aid coordination'
};