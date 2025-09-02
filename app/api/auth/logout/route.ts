import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { authRateLimiter } from '@/lib/security/rate-limiter'
import { addSecurityHeaders, createSuccessResponse, logSecurityEvent } from '@/lib/security/middleware'

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await authRateLimiter.middleware(request)
  if (rateLimitResponse) {
    logSecurityEvent('rate_limit_exceeded', request, { endpoint: 'logout' })
    return rateLimitResponse
  }

  try {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      logSecurityEvent('logout_error', request, { error: error.message })
      return NextResponse.json(
        { error: 'Logout failed', message: error.message },
        { status: 400 }
      )
    }

    logSecurityEvent('logout_success', request)

    // Get the origin from the request to handle both local and production
    const origin = new URL(request.url).origin
    const response = NextResponse.redirect(new URL('/', origin))
    
    // Add security headers
    addSecurityHeaders(response)
    
    return response
  } catch (error) {
    logSecurityEvent('logout_exception', request, { error: String(error) })
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}