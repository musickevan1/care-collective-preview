import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { authRateLimiter } from '@/lib/security/rate-limiter'
import { logSecurityEvent } from '@/lib/security/middleware'
import { z } from 'zod'

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

/**
 * POST /api/auth/forgot-password
 *
 * Sends a password reset email to the user
 *
 * Security features:
 * - Rate limiting: Uses auth rate limiter (100 per 15 min)
 * - Email validation
 * - No indication of whether email exists (prevents enumeration)
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await authRateLimiter.middleware(request)
  if (rateLimitResponse) {
    logSecurityEvent('rate_limit_exceeded', request, {
      endpoint: 'forgot-password',
      reason: 'Too many password reset attempts'
    })
    return rateLimitResponse
  }

  try {
    // Parse and validate request body
    const body = await request.json()
    const validation = forgotPasswordSchema.safeParse(body)

    if (!validation.success) {
      logSecurityEvent('forgot_password_validation_failed', request, {
        errors: validation.error.issues
      })
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Please enter a valid email address',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    const { email } = validation.data

    // Get the site URL for the redirect
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ||
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                    'http://localhost:3000'

    const supabase = await createClient()

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?type=recovery`,
    })

    if (error) {
      // Log the error but don't reveal to user (prevents email enumeration)
      logSecurityEvent('forgot_password_error', request, {
        email,
        error: error.message
      })
      console.error('[Forgot Password] Supabase error:', error.message)
    } else {
      logSecurityEvent('forgot_password_sent', request, { email })
    }

    // Always return success to prevent email enumeration
    // If the email doesn't exist, Supabase simply won't send an email
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, you will receive a password reset link.',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logSecurityEvent('forgot_password_exception', request, {
      error: String(error)
    })
    console.error('[Forgot Password] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Server Error',
        message: 'An unexpected error occurred. Please try again.',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
