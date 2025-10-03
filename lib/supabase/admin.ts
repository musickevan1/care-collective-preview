import { createClient } from '@supabase/supabase-js'
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
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase environment variables for admin client'
    )
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * Get user profile with service role key (bypasses RLS)
 * Returns GUARANTEED accurate profile data
 */
export async function getProfileWithServiceRole(userId: string) {
  const admin = createAdminClient()

  const { data: profile, error } = await admin
    .from('profiles')
    .select('id, name, verification_status, is_admin, email_confirmed')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('[Admin Client] Profile query failed:', error)
    throw error
  }

  return profile
}
