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

/**
 * Create a profile for OAuth users (Google, etc.)
 * Called when a user signs in via OAuth for the first time
 *
 * @param userId - The Supabase auth user ID
 * @param metadata - User metadata from OAuth provider
 * @returns The created profile
 */
export async function createOAuthProfile(userId: string, metadata: {
  name?: string;
  email?: string;
  avatarUrl?: string;
}): Promise<ProfileWithServiceRole> {
  Logger.getInstance().info('[Service Role] Creating OAuth profile', {
    userId,
    hasName: !!metadata.name,
    hasEmail: !!metadata.email,
    category: 'service_role'
  })

  try {
    const admin = createAdminClient()

    // Generate a display name from available metadata
    const displayName = metadata.name
      || metadata.email?.split('@')[0]
      || 'User'

    // Insert profile data using any-typed approach due to Supabase type inference issues
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profilesTable = admin.from('profiles') as any
    const { data, error } = await profilesTable
      .insert({
        id: userId,
        name: displayName,
        verification_status: 'pending',
        is_admin: false,
        email_confirmed: true,
        avatar_url: metadata.avatarUrl || null,
        location: null,
      })
      .select('id, name, verification_status, is_admin, email_confirmed, location, created_at, avatar_url, caregiving_situation')
      .single()

    if (error) {
      Logger.getInstance().error('[Service Role] Failed to create OAuth profile', error, {
        userId,
        code: error.code,
        details: error.details,
        category: 'service_role'
      })
      throw error
    }

    if (!data) {
      throw new Error(`Failed to create profile for user ${userId}`)
    }

    Logger.getInstance().info('[Service Role] OAuth profile created successfully', {
      userId,
      profileName: data.name,
      category: 'service_role'
    })

    return data as ProfileWithServiceRole
  } catch (error) {
    Logger.getInstance().error('[Service Role] Exception creating OAuth profile', error as Error, {
      userId,
      category: 'service_role',
      severity: 'critical'
    })
    throw error
  }
}

/**
 * Check if a profile needs completion (missing required fields for approval)
 * OAuth users need to fill in location and caregiving_situation
 */
export async function profileNeedsCompletion(userId: string): Promise<boolean> {
  try {
    const profile = await getProfileWithServiceRole(userId)

    // Profile needs completion if location is missing
    // This is required for the approval workflow
    return !profile.location
  } catch {
    // If we can't get the profile, assume it doesn't need completion
    // (the callback will handle missing profiles separately)
    return false
  }
}

/**
 * Sync email confirmation status from auth.users to profiles table
 *
 * Called during auth callback to ensure profiles.email_confirmed stays in sync
 * with Supabase's native auth.users.email_confirmed_at field.
 *
 * This is needed because database triggers on auth.users don't reliably fire
 * when Supabase confirms emails through their built-in flow.
 *
 * @param userId - The user ID to sync
 * @returns true if sync was performed, false if already in sync
 */
export async function syncEmailConfirmationStatus(userId: string): Promise<boolean> {
  try {
    const admin = createAdminClient()

    // Use admin API to get user's email confirmation status from auth.users
    const { data: { user }, error: userError } = await admin.auth.admin.getUserById(userId)

    if (userError || !user) {
      Logger.getInstance().error('[Email Sync] Failed to get auth user', userError || new Error('User not found'), {
        userId,
        category: 'email_sync'
      })
      return false
    }

    if (!user.email_confirmed_at) {
      // User hasn't confirmed email yet, nothing to sync
      return false
    }

    // Check if profiles table is already in sync
    // Use any-typed approach due to Supabase type generation quirks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profilesTable = admin.from('profiles') as any
    const { data: profile, error: profileError } = await profilesTable
      .select('email_confirmed, email_confirmed_at')
      .eq('id', userId)
      .single()

    if (profileError) {
      Logger.getInstance().error('[Email Sync] Failed to get profile', profileError, {
        userId,
        category: 'email_sync'
      })
      return false
    }

    // If already synced, skip update
    if (profile?.email_confirmed === true) {
      return false
    }

    // Update profiles table
    const { error: updateError } = await profilesTable
      .update({
        email_confirmed: true,
        email_confirmed_at: user.email_confirmed_at
      })
      .eq('id', userId)

    if (updateError) {
      Logger.getInstance().error('[Email Sync] Failed to update profile', updateError, {
        userId,
        category: 'email_sync'
      })
      return false
    }

    Logger.getInstance().info('[Email Sync] Synced email confirmation status', {
      userId,
      emailConfirmedAt: user.email_confirmed_at,
      category: 'email_sync'
    })

    return true
  } catch (error) {
    Logger.getInstance().error('[Email Sync] Exception during sync', error as Error, {
      userId,
      category: 'email_sync'
    })
    return false
  }
}
