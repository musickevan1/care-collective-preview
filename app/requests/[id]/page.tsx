import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'

interface PageProps {
  params: { id: string }
}

export default async function RequestDetailPage({ params }: PageProps) {
  const { id } = params

  // Test 1: Just check auth
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/requests/' + id);
  }

  // Test 2: Fetch the request - nothing else
  const { data: request, error: dbError } = await supabase
    .from('help_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (dbError || !request) {
    notFound();
  }

  // Test 3: Render with zero components - just plain HTML
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">MINIMAL TEST PAGE</h1>
        <h2 className="text-xl mb-2">{request.title}</h2>
        <p className="mb-2">{request.description}</p>
        <p className="text-sm text-gray-600">Status: {request.status}</p>
        <p className="text-sm text-gray-600">Category: {request.category}</p>
        <p className="text-sm text-gray-600">Urgency: {request.urgency}</p>
        <div className="mt-4">
          <a href="/requests" className="text-blue-600 hover:underline">← Back to requests</a>
        </div>
      </div>
    </div>
  );
}
