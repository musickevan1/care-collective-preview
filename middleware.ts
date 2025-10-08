import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware-edge'

export async function middleware(request: NextRequest) {
  // CRITICAL DEBUG: Verify middleware executes
  console.log('[Middleware] 🎯 ENTRY POINT - Path:', request.nextUrl.pathname)

  try {
    const result = await updateSession(request)
    console.log('[Middleware] ✅ EXIT - Returning response for:', request.nextUrl.pathname)
    return result
  } catch (error) {
    console.error('[Middleware] CRITICAL ERROR - Blocking request for security:', error)

    // SECURITY: In production, block all requests if middleware fails
    // This prevents auth bypass if service role client or other critical code fails
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
      // Block access and redirect to login
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('error', 'system_error')
      return NextResponse.redirect(redirectUrl)
    }

    // Development: Allow through with warning
    console.warn('[Middleware] Development mode - allowing request despite error')
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

     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}