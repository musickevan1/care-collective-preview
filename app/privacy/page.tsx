/**
 * @fileoverview Privacy Settings Page
 * Main page for users to manage their privacy settings and data controls
 */

import { ReactElement } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PrivacyDashboard } from '@/components/privacy/PrivacyDashboard';

// Force dynamic rendering for authentication
export const dynamic = 'force-dynamic';

async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, location, verification_status')
    .eq('id', user.id)
    .single();

  return {
    id: user.id,
    name: profile?.name || user.email?.split('@')[0] || 'Unknown',
    email: user.email || '',
    verificationStatus: profile?.verification_status || 'pending'
  };
}

export default async function PrivacyPage(): Promise<ReactElement> {
  const user = await getUser();

  if (!user) {
    redirect('/login?redirect=/privacy');
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <PrivacyDashboard userId={user.id} />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Privacy Settings - CARE Collective',
  description: 'Manage your privacy settings and control how your data is shared in the CARE Collective community'
};