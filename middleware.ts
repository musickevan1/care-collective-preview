import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware-edge'

// Note: Logger removed - date-fns import causes Edge Runtime issues locally
// Using console.log for Edge Runtime compatibility

export async function middleware(request: NextRequest) {
  // CRITICAL DEBUG: Verify middleware executes
  if (process.env.NODE_ENV === 'development') {
    console.log('[Middleware] ENTRY POINT:', request.nextUrl.pathname)
  }

  // Handle Supabase auth errors (e.g., expired password reset links)
  // Supabase redirects to Site URL with error params when tokens are invalid/expired
  const errorCode = request.nextUrl.searchParams.get('error_code')
  const error = request.nextUrl.searchParams.get('error')

  if (error === 'access_denied' && errorCode) {
    const redirectUrl = new URL('/forgot-password', request.url)

    // Map Supabase error codes to user-friendly messages
    if (errorCode === 'otp_expired') {
      redirectUrl.searchParams.set('error', 'link_expired')
    } else {
      redirectUrl.searchParams.set('error', 'invalid_link')
    }

    console.log('[Middleware] Auth error detected, redirecting:', { error, errorCode })
    return NextResponse.redirect(redirectUrl)
  }

  try {
    const result = await updateSession(request)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Middleware] EXIT - Returning response:', request.nextUrl.pathname)
    }
    return result
  } catch (error) {
    console.error('[Middleware] CRITICAL ERROR - Blocking request for security', {
      path: request.nextUrl.pathname,
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    // SECURITY: In production, block all requests if middleware fails
    // This prevents auth bypass if service role client or other critical code fails
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
      // Block access and redirect to login
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('error', 'system_error')
      return NextResponse.redirect(redirectUrl)
    }

    // Development: Allow through with warning
    console.warn('[Middleware] Development mode - allowing request despite error:', request.nextUrl.pathname)
    const response = NextResponse.next()

    // Add basic security headers even when middleware fails
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - waiver-preview (preview page for development)

     */
    '/((?!_next/static|_next/image|favicon.ico|waiver-preview|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}