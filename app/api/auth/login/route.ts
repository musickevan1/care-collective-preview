import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { authRateLimiter } from '@/lib/security/rate-limiter'
import { addSecurityHeaders, createErrorResponse, createSuccessResponse, logSecurityEvent } from '@/lib/security/middleware'
import { z } from 'zod'

// Validation schema for login request
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

/**
 * POST /api/auth/login
 *
 * Rate-limited login endpoint with verification status checking
 *
 * Security features:
 * - Rate limiting: 5 attempts per 15 minutes per IP
 * - Email validation
 * - Verification status checking before allowing access
 * - Security event logging
 * - Automatic rejection of blocked users
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting (5 attempts per 15 minutes)
  const rateLimitResponse = await authRateLimiter.middleware(request)
  if (rateLimitResponse) {
    logSecurityEvent('rate_limit_exceeded', request, {
      endpoint: 'login',
      reason: 'Too many login attempts'
    })
    return rateLimitResponse
  }

  try {
    // Parse and validate request body
    const body = await request.json()
    const validation = loginSchema.safeParse(body)

    if (!validation.success) {
      logSecurityEvent('login_validation_failed', request, {
        errors: validation.error.issues
      })
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid login credentials format',
          errors: validation.error.issues,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    // Create Supabase client
    const supabase = await createClient()

    // Attempt login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      logSecurityEvent('login_failed', request, {
        email,
        error: authError.message
      })
      return createErrorResponse(
        authError.message,
        401
      )
    }

    if (!authData?.user) {
      logSecurityEvent('login_failed_no_user', request, { email })
      return createErrorResponse(
        'Authentication failed',
        401
      )
    }

    // SECURITY: Check verification status BEFORE allowing access
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('verification_status, name')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      logSecurityEvent('login_profile_fetch_failed', request, {
        userId: authData.user.id,
        error: profileError.message
      })
      // Sign out user if we can't verify their status
      await supabase.auth.signOut()
      return createErrorResponse(
        'Unable to verify account status',
        500
      )
    }

    // Log successful authentication with status
    logSecurityEvent('login_authenticated', request, {
      userId: authData.user.id,
      email: authData.user.email,
      verificationStatus: profile.verification_status
    })

    // Handle different verification statuses
    if (profile.verification_status === 'rejected') {
      // Rejected users: sign out immediately
      await supabase.auth.signOut()
      logSecurityEvent('login_blocked_rejected', request, {
        userId: authData.user.id,
        email: authData.user.email
      })
      return createSuccessResponse({
        status: 'rejected',
        redirect: '/access-denied?reason=rejected',
        message: 'Access denied: Account has been rejected'
      })
    }

    if (profile.verification_status === 'pending') {
      logSecurityEvent('login_success_pending', request, {
        userId: authData.user.id,
        email: authData.user.email
      })
      return createSuccessResponse({
        status: 'pending',
        redirect: '/waitlist',
        message: 'Account pending approval'
      })
    }

    if (profile.verification_status === 'approved') {
      logSecurityEvent('login_success_approved', request, {
        userId: authData.user.id,
        email: authData.user.email
      })
      return createSuccessResponse({
        status: 'approved',
        redirect: '/dashboard',
        message: 'Login successful'
      })
    }

    // Unknown status: treat as pending for safety
    logSecurityEvent('login_unknown_status', request, {
      userId: authData.user.id,
      email: authData.user.email,
      verificationStatus: profile.verification_status
    })
    return createSuccessResponse({
      status: 'unknown',
      redirect: '/waitlist',
      message: 'Account verification pending'
    })

  } catch (error) {
    logSecurityEvent('login_exception', request, {
      error: String(error)
    })
    console.error('[Login API] Unexpected error:', error)
    return createErrorResponse(
      'An unexpected error occurred during login',
      500
    )
  }
}
