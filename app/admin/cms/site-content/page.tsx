import { ReactElement } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SiteContentManager } from '@/components/admin/cms/SiteContentManager';

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

export default async function SiteContentPage(): Promise<ReactElement> {
  const user = await getAdminUser();
  if (!user) redirect('/login?redirect=/admin/cms/site-content');

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Site Content</h1>
        <p className="text-muted-foreground">
          Manage content sections displayed on the website
        </p>
      </div>

      <SiteContentManager adminUserId={user.id} />
    </div>
  );
}
