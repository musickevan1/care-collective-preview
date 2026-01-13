import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { logSecurityEvent } from '@/lib/security/middleware'
import { createWelcomeConversation } from '@/lib/messaging/welcome-service'

// Waiver signature schema
const waiverSignatureSchema = z.object({
  signedName: z.string().min(1, 'Signed name required'),
  signedAt: z.string(),
  documentVersion: z.string(),
  userAgent: z.string(),
  namesMatch: z.literal(true),
  recordId: z.string(),
})

// Validation schema for profile completion request
const completeProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  location: z.string().min(1, 'Location is required').max(100, 'Location too long'),
  application_reason: z.string().min(10, 'Please provide a bit more detail').max(500, 'Reason too long'),
  caregiving_situation: z.string().min(1, 'Caregiving situation is required').max(500, 'Caregiving situation too long'),
  terms_accepted: z.literal(true, { message: 'You must accept the terms' }),
  waiver_signature: waiverSignatureSchema,
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

    console.log('[Complete Profile] Received request:', {
      hasName: !!body.name,
      nameLength: body.name?.length || 0,
      hasLocation: !!body.location,
      locationLength: body.location?.length || 0,
      hasReason: !!body.application_reason,
      reasonLength: body.application_reason?.length || 0,
      termsAccepted: body.terms_accepted,
      timestamp: new Date().toISOString(),
    })

    const validation = completeProfileSchema.safeParse(body)

    if (!validation.success) {
      console.log('[Complete Profile] Validation failed:', {
        issues: validation.error.issues,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Please fill in all required fields correctly',
          errors: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { name, location, application_reason, caregiving_situation, waiver_signature } = validation.data

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
        caregiving_situation: caregiving_situation || null,
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

    // Save waiver signature to database
    const { error: waiverError } = await supabase
      .from('signed_waivers')
      .insert({
        user_id: user.id,
        document_version: waiver_signature.documentVersion,
        signed_name: waiver_signature.signedName,
        signed_at: waiver_signature.signedAt,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        user_agent: waiver_signature.userAgent,
        record_id: waiver_signature.recordId,
      })

    if (waiverError) {
      console.error('[Complete Profile] Failed to save waiver signature:', waiverError)
      // Continue anyway - profile completion shouldn't fail due to waiver storage issues
    } else {
      console.log('[Complete Profile] Waiver signature saved:', {
        userId: user.id,
        recordId: waiver_signature.recordId,
      })
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

    // Create welcome message from CARE Team (non-blocking)
    try {
      const welcomeResult = await createWelcomeConversation(user.id)
      if (welcomeResult.success) {
        console.log('[Complete Profile] Welcome message created:', welcomeResult.conversationId)
      } else {
        console.warn('[Complete Profile] Failed to create welcome message:', welcomeResult.error)
      }
    } catch (welcomeError) {
      console.warn('[Complete Profile] Failed to create welcome message:', welcomeError)
      // Don't fail the request if welcome message fails
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
