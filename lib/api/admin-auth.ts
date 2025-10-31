/**
 * @fileoverview Admin API authorization utilities
 *
 * Provides consistent authorization checks for all admin API endpoints.
 * Ensures admins must be:
 * 1. Authenticated
 * 2. Have is_admin = true
 * 3. Have verification_status = 'approved'
 * 4. Have email_confirmed = true
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export interface AdminAuthResult {
  authorized: boolean
  user?: {
    id: string
    email?: string
    is_admin: boolean
    verification_status: string
    email_confirmed: boolean
  }
  error?: {
    message: string
    status: number
  }
}

/**
 * Check if the current user is an authorized admin
 *
 * @returns AdminAuthResult with authorization status and user data or error
 */
export async function checkAdminAuth(): Promise<AdminAuthResult> {
  const supabase = await createClient()

  // Step 1: Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      authorized: false,
      error: {
        message: 'Unauthorized',
        status: 401
      }
    }
  }

  // Step 2: Get profile with full authorization details
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin, verification_status, email_confirmed')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return {
      authorized: false,
      error: {
        message: 'Profile not found',
        status: 403
      }
    }
  }

  // Step 3: Verify admin status with full requirements
  if (!profile.is_admin ||
      profile.verification_status !== 'approved' ||
      !profile.email_confirmed) {
    return {
      authorized: false,
      error: {
        message: 'Admin access required',
        status: 403
      }
    }
  }

  // Success - user is fully authorized admin
  return {
    authorized: true,
    user: {
      id: user.id,
      email: user.email,
      is_admin: profile.is_admin,
      verification_status: profile.verification_status,
      email_confirmed: profile.email_confirmed
    }
  }
}

/**
 * Middleware-style function to check admin authorization
 * Returns error response if not authorized, otherwise returns null
 *
 * Usage:
 * ```typescript
 * const authError = await requireAdminAuth()
 * if (authError) return authError
 *
 * // Continue with admin logic...
 * ```
 */
export async function requireAdminAuth(): Promise<NextResponse | null> {
  const authResult = await checkAdminAuth()

  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.error?.message },
      { status: authResult.error?.status || 403 }
    )
  }

  return null
}

/**
 * Get the current admin user with full authorization check
 * Throws if not authorized
 */
export async function getAdminUser() {
  const authResult = await checkAdminAuth()

  if (!authResult.authorized || !authResult.user) {
    throw new Error(authResult.error?.message || 'Unauthorized')
  }

  return authResult.user
}
