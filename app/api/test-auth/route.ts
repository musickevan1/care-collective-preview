import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProfileWithServiceRole } from '@/lib/supabase/admin'

/**
 * Diagnostic endpoint to test authentication and RLS behavior
 *
 * Tests:
 * 1. Service role profile fetch (bypasses RLS)
 * 2. Regular client profile fetch (uses RLS)
 * 3. Compares results to identify mismatches
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
        authError: authError?.message
      }, { status: 401 })
    }

    console.log('[Test Auth] Testing for user:', {
      userId: user.id,
      email: user.email
    })

    // TEST 1: Fetch profile with service role (bypasses RLS)
    let serviceRoleProfile = null
    let serviceRoleError = null
    try {
      serviceRoleProfile = await getProfileWithServiceRole(user.id)
    } catch (error) {
      serviceRoleError = error instanceof Error ? error.message : String(error)
    }

    // TEST 2: Fetch profile with regular client (uses RLS)
    const { data: rlsProfile, error: rlsError } = await supabase
      .from('profiles')
      .select('id, name, verification_status, is_admin, email_confirmed')
      .eq('id', user.id)
      .single()

    // TEST 3: Compare results
    const mismatch =
      serviceRoleProfile &&
      rlsProfile &&
      (serviceRoleProfile.name !== rlsProfile.name ||
       serviceRoleProfile.verification_status !== rlsProfile.verification_status)

    const result = {
      success: true,
      userId: user.id,
      userEmail: user.email,
      tests: {
        serviceRole: {
          success: !!serviceRoleProfile,
          error: serviceRoleError,
          profile: serviceRoleProfile ? {
            id: serviceRoleProfile.id,
            name: serviceRoleProfile.name,
            status: serviceRoleProfile.verification_status,
            isAdmin: serviceRoleProfile.is_admin
          } : null
        },
        rlsClient: {
          success: !!rlsProfile,
          error: rlsError?.message,
          profile: rlsProfile ? {
            id: rlsProfile.id,
            name: rlsProfile.name,
            status: rlsProfile.verification_status,
            isAdmin: rlsProfile.is_admin
          } : null
        },
        comparison: {
          mismatch,
          details: mismatch ? {
            nameMatch: serviceRoleProfile?.name === rlsProfile?.name,
            statusMatch: serviceRoleProfile?.verification_status === rlsProfile?.verification_status,
            serviceRoleName: serviceRoleProfile?.name,
            rlsName: rlsProfile?.name,
            serviceRoleStatus: serviceRoleProfile?.verification_status,
            rlsStatus: rlsProfile?.verification_status
          } : null
        }
      },
      diagnosis: mismatch
        ? '🚨 CRITICAL: RLS policy returns WRONG user data!'
        : serviceRoleProfile && rlsProfile
        ? '✅ Both methods return correct user data'
        : '⚠️ One or both methods failed'
    }

    console.log('[Test Auth] Results:', result)

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    })

  } catch (error) {
    console.error('[Test Auth] Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
