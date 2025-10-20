/**
 * @fileoverview Admin Privacy Dashboard Page
 * Administrative interface for monitoring privacy violations and security events
 */

import { ReactElement } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminPrivacyDashboard } from '@/components/admin/PrivacyDashboard';

// Force dynamic rendering for authentication
export const dynamic = 'force-dynamic';

async function getAdminUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Get user profile and verify admin status
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, is_admin, verification_status')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return null;
  }

  return {
    id: user.id,
    name: profile.name || user.email?.split('@')[0] || 'Admin',
    email: user.email || '',
    isAdmin: profile.is_admin
  };
}

export default async function AdminPrivacyPage(): Promise<ReactElement> {
  const user = await getAdminUser();

  if (!user) {
    redirect('/login?redirect=/admin/privacy');
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <AdminPrivacyDashboard adminUserId={user.id} />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Privacy Administration - Care Collective',
  description: 'Administrative dashboard for monitoring privacy violations and security events in the Care Collective platform'
};