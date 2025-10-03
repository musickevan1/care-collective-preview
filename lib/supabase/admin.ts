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
  try {
    const admin = createAdminClient()

    console.log('[Admin Client] Querying profile for user:', userId)

    const { data: profile, error } = await admin
      .from('profiles')
      .select('id, name, verification_status, is_admin, email_confirmed')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('[Admin Client] Profile query failed:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        userId
      })
      throw error
    }

    console.log('[Admin Client] Profile retrieved successfully:', {
      userId: profile.id,
      name: profile.name,
      verificationStatus: profile.verification_status,
      isAdmin: profile.is_admin
    })

    return profile
  } catch (error) {
    console.error('[Admin Client] CRITICAL: getProfileWithServiceRole failed:', {
      error,
      userId,
      errorMessage: error instanceof Error ? error.message : String(error)
    })
    throw error
  }
}
