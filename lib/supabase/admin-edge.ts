import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

/**
 * Edge Runtime compatible admin client
 * 
 * This file is specifically designed for use in Next.js middleware (Edge Runtime).
 * It avoids importing modules that are incompatible with Edge Runtime, such as:
 * - Logger (which imports date-fns)
 * - Any modules using CommonJS require/exports
 * 
 * For server-side routes (API routes, Server Components), use @/lib/supabase/admin instead.
 */

/**
 * Edge Runtime compatible storage adapter
 * Provides no-op storage that returns null instead of using localStorage
 */
const edgeStorageAdapter = {
  getItem: async (): Promise<string | null> => null,
  setItem: async (): Promise<void> => {},
  removeItem: async (): Promise<void> => {},
}

/**
 * Admin Supabase client with service role key (Edge Runtime compatible)
 *
 * IMPORTANT: This client bypasses Row Level Security (RLS)
 * - Only use for authentication/authorization checks in middleware
 * - Never expose to client-side code
 * - Never use for user data queries (use regular client for that)
 *
 * Use cases:
 * - Checking user verification status in middleware
 * - Admin operations that need to bypass RLS in Edge Runtime
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
        'X-Client-Info': 'care-collective-admin-edge'
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
 * 
 * Edge Runtime compatible - uses console.log instead of Logger
 */
export async function getProfileWithServiceRole(userId: string): Promise<ProfileWithServiceRole> {
  // Debug logging for Edge Runtime
  if (process.env.NODE_ENV === 'development') {
    console.log('[Service Role Edge] INPUT userId:', userId)
  }

  try {
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('profiles')
      .select('id, name, verification_status, is_admin, email_confirmed, location, created_at, avatar_url, caregiving_situation')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('[Service Role Edge] Profile query failed:', {
        code: error.code,
        message: error.message,
        userId,
      })
      throw error
    }

    if (!data) {
      console.error('[Service Role Edge] Profile not found:', { userId })
      throw new Error('Profile not found')
    }

    // Cast to our expected type
    const profile = data as ProfileWithServiceRole

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('[Service Role Edge] RESULT:', {
        success: true,
        profileId: profile.id,
        profileStatus: profile.verification_status,
        matchesInput: profile.id === userId,
      })
    }

    // Verify profile ID matches input user ID
    if (profile.id !== userId) {
      console.error('[Service Role Edge] CRITICAL MISMATCH DETECTED:', {
        inputUserId: userId,
        returnedProfileId: profile.id,
      })
    }

    return profile
  } catch (error) {
    console.error('[Service Role Edge] CRITICAL: getProfileWithServiceRole failed:', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}

/**
 * Check if user has pending session invalidation
 * Returns true if user's session should be invalidated due to status change
 * 
 * Edge Runtime compatible - uses console.log instead of Logger
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
      console.error('[Service Role Edge] Failed to check pending session invalidation:', {
        userId,
        error: error.message,
      })
      // On error, assume no pending invalidation (fail open for this check)
      return false
    }

    return data === true
  } catch (error) {
    console.error('[Service Role Edge] Exception checking pending session invalidation:', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return false
  }
}

/**
 * Mark user session as invalidated after successful sign out
 * 
 * Edge Runtime compatible - uses console.log instead of Logger
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
      console.error('[Service Role Edge] Failed to mark session as invalidated:', {
        userId,
        error: error.message,
      })
    } else if (process.env.NODE_ENV === 'development') {
      console.log('[Service Role Edge] Session marked as invalidated:', { userId })
    }
  } catch (error) {
    console.error('[Service Role Edge] Exception marking session as invalidated:', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
