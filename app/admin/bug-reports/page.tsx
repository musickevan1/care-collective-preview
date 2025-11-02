import { ReactElement } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BugReportsList } from '@/components/admin/BugReportsList';

export default async function BugReportsPage(): Promise<ReactElement> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login?redirectTo=/admin/bug-reports');
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary mb-2">
            Bug Reports Management
          </h1>
          <p className="text-text/70">
            View and manage bug reports submitted by users and beta testers
          </p>
        </div>

        <BugReportsList />
      </div>
    </div>
  );
}
