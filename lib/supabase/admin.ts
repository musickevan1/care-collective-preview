import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

/**
 * Admin Supabase client with service role key
 *
 * IMPORTANT: This client bypasses Row Level Security (RLS)
 * - Only use for authentication/authorization checks
 * - Never expose to client-side code
 * - Never use for user data queries (use regular client for that)
 *
 * Use cases:
 * - Checking user verification status in middleware
 * - Fetching profile for auth decisions in auth callback
 * - Admin operations that need to bypass RLS
 *
 * EDGE RUNTIME COMPATIBLE: Uses standard Supabase client with service role
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase environment variables for admin client'
    )
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'X-Client-Info': 'care-collective-admin'
      }
    }
  })
}

/**
 * Get user profile with service role key (bypasses RLS)
 * Returns GUARANTEED accurate profile data
 */
export async function getProfileWithServiceRole(userId: string) {
  // ENHANCED DEBUG LOGGING - Track data flow
  console.log('[Service Role] INPUT userId:', userId)
  console.log('[Service Role] Env check:', {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasKey: !!process.env.SUPABASE_SERVICE_ROLE,
    urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL,
    timestamp: new Date().toISOString()
  })

  try {
    const admin = createAdminClient()

    const { data: profile, error } = await admin
      .from('profiles')
      .select('id, name, verification_status, is_admin, email_confirmed')
      .eq('id', userId)
      .single()

    // ENHANCED DEBUG LOGGING - Track query result
    console.log('[Service Role] RESULT:', {
      success: !!profile,
      profileId: profile?.id,
      profileName: profile?.name,
      profileStatus: profile?.verification_status,
      matchesInput: profile?.id === userId,
      mismatchDetected: profile && profile.id !== userId,
      error: error?.message,
      errorCode: error?.code,
      timestamp: new Date().toISOString()
    })

    if (error) {
      console.error('[Service Role] Profile query failed:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        userId
      })
      throw error
    }

    // CRITICAL: Verify profile ID matches input user ID
    if (profile.id !== userId) {
      console.error('[Service Role] 🚨 CRITICAL MISMATCH DETECTED:', {
        inputUserId: userId,
        returnedProfileId: profile.id,
        returnedProfileName: profile.name,
        THIS_SHOULD_NEVER_HAPPEN: true,
        timestamp: new Date().toISOString()
      })
    }

    return profile
  } catch (error) {
    console.error('[Service Role] CRITICAL: getProfileWithServiceRole failed:', {
      error,
      userId,
      errorMessage: error instanceof Error ? error.message : String(error)
    })
    throw error
  }
}

/**
 * Check if user has pending session invalidation
 * Returns true if user's session should be invalidated due to status change
 */
export async function hasPendingSessionInvalidation(userId: string): Promise<boolean> {
  try {
    const admin = createAdminClient()

    // Call RPC function with parameters
    // @ts-ignore - Type will be updated when database types are regenerated
    const { data, error } = await admin.rpc('has_pending_session_invalidation', {
      user_uuid: userId
    })

    if (error) {
      console.error('[Service Role] Failed to check pending session invalidation:', error)
      // On error, assume no pending invalidation (fail open for this check)
      return false
    }

    return data === true
  } catch (error) {
    console.error('[Service Role] Exception checking pending session invalidation:', error)
    return false
  }
}

/**
 * Mark user session as invalidated after successful sign out
 */
export async function markSessionInvalidated(userId: string): Promise<void> {
  try {
    const admin = createAdminClient()

    // Call RPC function with parameters
    // @ts-ignore - Type will be updated when database types are regenerated
    const { error } = await admin.rpc('mark_session_invalidated', {
      user_uuid: userId
    })

    if (error) {
      console.error('[Service Role] Failed to mark session as invalidated:', error)
    } else {
      console.log('[Service Role] Session marked as invalidated for user:', userId)
    }
  } catch (error) {
    console.error('[Service Role] Exception marking session as invalidated:', error)
  }
}
