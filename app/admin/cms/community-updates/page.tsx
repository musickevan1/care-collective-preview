import { ReactElement } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CommunityUpdatesManager } from '@/components/admin/cms/CommunityUpdatesManager';

export const dynamic = 'force-dynamic';

async function getAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, is_admin, verification_status, email_confirmed')
    .eq('id', user.id)
    .single();

  if (
    !profile?.is_admin ||
    profile.verification_status !== 'approved' ||
    !profile.email_confirmed
  ) {
    return null;
  }

  return { id: user.id, name: profile.name };
}

export default async function CommunityUpdatesPage(): Promise<ReactElement> {
  const user = await getAdminUser();
  if (!user) redirect('/login?redirect=/admin/cms/community-updates');

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Community Updates</h1>
        <p className="text-muted-foreground">
          Manage community updates and stats displayed on the home page
        </p>
      </div>

      <CommunityUpdatesManager adminUserId={user.id} />
    </div>
  );
}
