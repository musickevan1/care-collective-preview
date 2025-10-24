/**
 * DEBUG ENDPOINT - Check current user's profile and verification status
 * GET /api/debug/my-profile
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        authenticated: false,
        error: authError?.message || 'Not authenticated'
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Try to fetch help requests to see RLS in action
    const { data: helpRequests, error: hlpError } = await supabase
      .from('help_requests')
      .select('id, title, status')
      .limit(5);

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      profile: profile || null,
      profileError: profileError?.message || null,
      canViewHelpRequests: !hlpError && helpRequests && helpRequests.length > 0,
      helpRequestsError: hlpError?.message || null,
      helpRequestsSample: helpRequests?.slice(0, 3) || [],
      diagnosis: {
        hasProfile: !!profile,
        verificationStatus: profile?.verification_status || 'UNKNOWN',
        emailConfirmed: profile?.email_confirmed || false,
        isAdmin: profile?.is_admin || false,
        shouldSeeHelpRequests: profile?.verification_status === 'approved' || profile?.is_admin
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
