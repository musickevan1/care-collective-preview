import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { logSecurityEvent } from '@/lib/security/middleware'

// Validation schema for profile completion request
const completeProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  location: z.string().min(1, 'Location is required').max(100, 'Location too long'),
  application_reason: z.string().min(10, 'Please provide a bit more detail').max(500, 'Reason too long'),
  terms_accepted: z.literal(true, { message: 'You must accept the terms' }),
})

/**
 * POST /api/auth/complete-profile
 *
 * Complete profile for OAuth users
 * Updates name, location, and application reason for pending users
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validation = completeProfileSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Please fill in all required fields correctly',
          errors: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { name, location, application_reason } = validation.data

    // Create Supabase client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name: cookieName, value, options }) => {
              cookieStore.set(cookieName, value, options)
            })
          },
        },
      }
    )

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      logSecurityEvent('complete_profile_unauthorized', request, {
        reason: 'No authenticated user',
      })
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'You must be logged in to complete your profile',
        },
        { status: 401 }
      )
    }

    // Check if user has a pending profile
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, verification_status, location')
      .eq('id', user.id)
      .single()

    if (profileError || !existingProfile) {
      console.error('[Complete Profile] Profile not found:', profileError)
      return NextResponse.json(
        {
          error: 'Profile Not Found',
          message: 'Could not find your profile. Please try signing up again.',
        },
        { status: 404 }
      )
    }

    // Ensure user is in pending status
    if (existingProfile.verification_status !== 'pending') {
      return NextResponse.json(
        {
          error: 'Invalid Status',
          message: 'Your profile has already been processed',
        },
        { status: 400 }
      )
    }

    // Update the profile with the additional information
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        name,
        location,
        application_reason,
        terms_accepted_at: new Date().toISOString(),
        terms_version: '1.0',
        applied_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('[Complete Profile] Failed to update profile:', updateError)
      return NextResponse.json(
        {
          error: 'Update Failed',
          message: 'Failed to update your profile. Please try again.',
        },
        { status: 500 }
      )
    }

    // Log the successful profile completion
    logSecurityEvent('profile_completed', request, {
      userId: user.id,
      provider: user.app_metadata?.provider || 'unknown',
    })

    // Send notification about new application (non-blocking)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'new_application',
          userId: user.id,
        }),
      })
    } catch (notifyError) {
      console.warn('[Complete Profile] Failed to send notification:', notifyError)
      // Don't fail the request if notification fails
    }

    console.log('[Complete Profile] Profile completed successfully:', {
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: 'Profile completed successfully',
      redirect: '/waitlist',
    })
  } catch (error) {
    console.error('[Complete Profile] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Server Error',
        message: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    )
  }
}
