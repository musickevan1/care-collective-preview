import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { authRateLimiter } from '@/lib/security/rate-limiter'
import { addSecurityHeaders, createErrorResponse, createSuccessResponse, logSecurityEvent } from '@/lib/security/middleware'
import { z } from 'zod'
import { cookies } from 'next/headers'

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

    // CRITICAL FIX: Create a response object and Supabase client that sets cookies on it
    // This ensures session cookies are properly set in the API response
    const cookieStore = await cookies()
    let response = NextResponse.json({ success: false })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            // Set cookies on both the cookie store and the response object
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

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
      response = NextResponse.json(
        {
          success: false,
          error: authError.message,
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
      return response
    }

    if (!authData?.user) {
      logSecurityEvent('login_failed_no_user', request, { email })
      response = NextResponse.json(
        {
          success: false,
          error: 'Authentication failed',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
      return response
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
      response = NextResponse.json(
        {
          success: false,
          error: 'Unable to verify account status',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
      return response
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
      response = NextResponse.json({
        success: true,
        data: {
          status: 'rejected',
          redirect: '/access-denied?reason=rejected',
          message: 'Access denied: Account has been rejected'
        },
        timestamp: new Date().toISOString()
      })
      return response
    }

    if (profile.verification_status === 'pending') {
      logSecurityEvent('login_success_pending', request, {
        userId: authData.user.id,
        email: authData.user.email
      })
      response = NextResponse.json({
        success: true,
        data: {
          status: 'pending',
          redirect: '/waitlist',
          message: 'Account pending approval'
        },
        timestamp: new Date().toISOString()
      })
      return response
    }

    if (profile.verification_status === 'approved') {
      logSecurityEvent('login_success_approved', request, {
        userId: authData.user.id,
        email: authData.user.email
      })
      response = NextResponse.json({
        success: true,
        data: {
          status: 'approved',
          redirect: '/dashboard',
          message: 'Login successful'
        },
        timestamp: new Date().toISOString()
      })
      return response
    }

    // Unknown status: treat as pending for safety
    logSecurityEvent('login_unknown_status', request, {
      userId: authData.user.id,
      email: authData.user.email,
      verificationStatus: profile.verification_status
    })
    response = NextResponse.json({
      success: true,
      data: {
        status: 'unknown',
        redirect: '/waitlist',
        message: 'Account verification pending'
      },
      timestamp: new Date().toISOString()
    })
    return response

  } catch (error) {
    logSecurityEvent('login_exception', request, {
      error: String(error)
    })
    console.error('[Login API] Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred during login',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
