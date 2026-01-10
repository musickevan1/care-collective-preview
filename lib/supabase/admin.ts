import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { Logger } from '@/lib/logger'

/**
 * Edge Runtime compatible storage adapter
 * Provides no-op storage that returns empty strings instead of undefined
 */
const edgeStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    return null
  },
  setItem: async (key: string, value: string): Promise<void> => {
    // No-op in Edge Runtime
  },
  removeItem: async (key: string): Promise<void> => {
    // No-op in Edge Runtime
  },
}

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
 * EDGE RUNTIME COMPATIBLE: Uses no-op storage adapter
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase environment variables for admin client'
    )
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      storage: edgeStorageAdapter,
    },
    global: {
      headers: {
        'X-Client-Info': 'care-collective-admin'
      }
    }
  })
}

/**
 * Profile type returned by getProfileWithServiceRole
 */
type ProfileWithServiceRole = {
  id: string
  name: string
  verification_status: string | null
  is_admin: boolean | null
  email_confirmed: boolean | null
  location: string | null
  created_at: string | null
  avatar_url: string | null
  caregiving_situation: string | null
}

/**
 * Get user profile with service role key (bypasses RLS)
 * Returns GUARANTEED accurate profile data
 */
export async function getProfileWithServiceRole(userId: string): Promise<ProfileWithServiceRole> {
  // ENHANCED DEBUG LOGGING - Track data flow
  Logger.getInstance().debug('[Service Role] INPUT userId', { userId })
  Logger.getInstance().debug('[Service Role] Env check', {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL,
    category: 'service_role'
  })

  try {
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('profiles')
      .select('id, name, verification_status, is_admin, email_confirmed, location, created_at, avatar_url, caregiving_situation')
      .eq('id', userId)
      .single()

    // Cast to expected type - Supabase can't infer from string-based select
    const profile = data as ProfileWithServiceRole | null

    // ENHANCED DEBUG LOGGING - Track query result
    Logger.getInstance().debug('[Service Role] RESULT', {
      success: !!profile,
      profileId: profile?.id,
      profileName: profile?.name,
      profileStatus: profile?.verification_status,
      matchesInput: profile?.id === userId,
      mismatchDetected: profile && profile.id !== userId,
      error: error?.message,
      errorCode: error?.code,
      category: 'service_role'
    })

    if (error) {
      Logger.getInstance().error('[Service Role] Profile query failed', error, {
        code: error.code,
        details: error.details,
        hint: error.hint,
        userId,
        category: 'service_role'
      })
      throw error
    }

    if (!profile) {
      throw new Error(`Profile not found for user ${userId}`)
    }

    // CRITICAL: Verify profile ID matches input user ID
    if (profile.id !== userId) {
      Logger.getInstance().error('[Service Role] CRITICAL MISMATCH DETECTED', undefined, {
        inputUserId: userId,
        returnedProfileId: profile.id,
        returnedProfileName: profile.name,
        THIS_SHOULD_NEVER_HAPPEN: true,
        category: 'service_role',
        severity: 'critical'
      })
    }

    return profile as ProfileWithServiceRole
  } catch (error) {
    Logger.getInstance().error('[Service Role] CRITICAL: getProfileWithServiceRole failed', error as Error, {
      userId,
      category: 'service_role',
      severity: 'critical'
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
      Logger.getInstance().error('[Service Role] Failed to check pending session invalidation', error, {
        userId,
        category: 'service_role'
      })
      // On error, assume no pending invalidation (fail open for this check)
      return false
    }

    return data === true
  } catch (error) {
    Logger.getInstance().error('[Service Role] Exception checking pending session invalidation', error as Error, {
      userId,
      category: 'service_role'
    })
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
      Logger.getInstance().error('[Service Role] Failed to mark session as invalidated', error, {
        userId,
        category: 'service_role'
      })
    } else {
      Logger.getInstance().info('[Service Role] Session marked as invalidated', {
        userId,
        category: 'service_role'
      })
    }
  } catch (error) {
    Logger.getInstance().error('[Service Role] Exception marking session as invalidated', error as Error, {
      userId,
      category: 'service_role'
    })
  }
}
