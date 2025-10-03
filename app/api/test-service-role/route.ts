import { getProfileWithServiceRole } from '@/lib/supabase/admin'
import { NextRequest } from 'next/server'

// Force Edge Runtime to test service role compatibility
export const runtime = 'edge'

/**
 * Test endpoint to verify service role client works in Edge Runtime
 *
 * Usage: GET /api/test-service-role?userId=<uuid>
 *
 * Default userId: 93b0b7b4-7cd3-4ffc-8f02-3777f29da4fb (rejected user)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId') || '93b0b7b4-7cd3-4ffc-8f02-3777f29da4fb'

  console.log('[Test Service Role] Testing service role in Edge Runtime for user:', userId)

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
