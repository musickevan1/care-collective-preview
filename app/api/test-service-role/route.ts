import { getProfileWithServiceRole } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Force Edge Runtime to test service role compatibility
export const runtime = 'edge'

/**
 * SECURITY: Test endpoint for service role verification
 *
 * Access Requirements:
 * - Production: Requires ENABLE_TEST_ENDPOINTS=true environment variable
 * - All environments: Requires authenticated admin user with approved status
 *
 * Usage: GET /api/test-service-role?userId=<uuid>
 *
 * Default userId: 93b0b7b4-7cd3-4ffc-8f02-3777f29da4fb (rejected user)
 */
export async function GET(request: NextRequest) {
  // SECURITY CHECK 1: Feature flag gating
  // In production, only allow access when explicitly enabled
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_TEST_ENDPOINTS !== 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // SECURITY CHECK 2: Require authentication
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // SECURITY CHECK 3: Require admin with full verification
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, verification_status, email_confirmed')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin ||
      profile.verification_status !== 'approved' ||
      !profile.email_confirmed) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  // After security checks, proceed with test logic
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId') || '93b0b7b4-7cd3-4ffc-8f02-3777f29da4fb'

  console.log('[Test Service Role] Testing service role in Edge Runtime for user:', userId, 'by admin:', user.id)

  try {
    const profile = await getProfileWithServiceRole(userId)

    console.log('[Test Service Role] SUCCESS - Service role works in Edge Runtime!', {
      profileId: profile.id,
      profileName: profile.name,
      verificationStatus: profile.verification_status,
      isAdmin: profile.is_admin
    })

    return Response.json({
      success: true,
      runtime: 'edge',
      profile: {
        id: profile.id,
        name: profile.name,
        verification_status: profile.verification_status,
        is_admin: profile.is_admin,
        email_confirmed: profile.email_confirmed
      },
      message: '✅ Service role works in Edge Runtime!',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Test Service Role] FAILED - Service role NOT working in Edge Runtime:', {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      userId
    })

    return Response.json({
      success: false,
      runtime: 'edge',
      error: error instanceof Error ? error.message : String(error),
      message: '❌ Service role NOT working in Edge Runtime',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
