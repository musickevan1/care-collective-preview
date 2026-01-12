import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { logSecurityEvent } from '@/lib/security/middleware'
import { createWelcomeConversation } from '@/lib/messaging/welcome-service'

// Waiver signature schema - matches TypedSignatureField output
const waiverSignatureSchema = z.object({
  signedName: z.string().min(1, 'Signed name required'),
  signedAt: z.string(),
  documentVersion: z.string(),
  userAgent: z.string(),
  namesMatch: z.literal(true),
  recordId: z.string(),
})

// Request body schema
const saveWaiverSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  signature: waiverSignatureSchema,
})

/**
 * POST /api/auth/save-waiver
 *
 * Save waiver signature for normal signup flow.
 * Called after signUp() + signInWithPassword() succeeds.
 * Also creates welcome message for parity with Google OAuth flow.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('[Save Waiver] Received request:', {
      hasUserId: !!body.userId,
      hasSignature: !!body.signature,
      timestamp: new Date().toISOString(),
    })

    const validation = saveWaiverSchema.safeParse(body)

    if (!validation.success) {
      console.log('[Save Waiver] Validation failed:', {
        issues: validation.error.issues,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid waiver signature data',
          errors: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { userId, signature } = validation.data

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

    // Verify authenticated user matches userId
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      logSecurityEvent('save_waiver_unauthorized', request, {
        reason: 'No authenticated user',
        attemptedUserId: userId,
      })
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'You must be logged in to save waiver signature',
        },
        { status: 401 }
      )
    }

    // Security check: user can only save their own waiver
    if (user.id !== userId) {
      logSecurityEvent('save_waiver_forbidden', request, {
        reason: 'User ID mismatch',
        authenticatedUserId: user.id,
        attemptedUserId: userId,
      })
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Cannot save waiver for another user',
        },
        { status: 403 }
      )
    }

    // Generate proper recordId using real user ID
    const recordId = `CC-${userId.substring(0, 8).toUpperCase()}`

    // Save waiver signature to database
    const { error: waiverError } = await supabase
      .from('signed_waivers')
      .insert({
        user_id: userId,
        document_version: signature.documentVersion,
        signed_name: signature.signedName,
        signed_at: signature.signedAt,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        user_agent: signature.userAgent,
        record_id: recordId,
      })

    if (waiverError) {
      console.error('[Save Waiver] Failed to save waiver signature:', waiverError)
      // Log but don't fail - profile creation shouldn't fail due to waiver storage
      logSecurityEvent('save_waiver_db_error', request, {
        userId,
        error: waiverError.message,
      })
    } else {
      console.log('[Save Waiver] Waiver signature saved:', {
        userId,
        recordId,
        documentVersion: signature.documentVersion,
      })
    }

    // Create welcome message from CARE Team (parity with complete-profile flow)
    try {
      const welcomeResult = await createWelcomeConversation(userId)
      if (welcomeResult.success) {
        console.log('[Save Waiver] Welcome message created:', welcomeResult.conversationId)
      } else {
        console.warn('[Save Waiver] Failed to create welcome message:', welcomeResult.error)
      }
    } catch (welcomeError) {
      console.warn('[Save Waiver] Failed to create welcome message:', welcomeError)
      // Don't fail the request if welcome message fails
    }

    // Log successful waiver save
    logSecurityEvent('waiver_saved', request, {
      userId,
      recordId,
      provider: 'email',
    })

    return NextResponse.json({
      success: true,
      message: 'Waiver signature saved successfully',
      recordId,
    })
  } catch (error) {
    console.error('[Save Waiver] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Server Error',
        message: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    )
  }
}
