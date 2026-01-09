import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware-edge'
import { Logger } from '@/lib/logger'

export async function middleware(request: NextRequest) {
  // CRITICAL DEBUG: Verify middleware executes
  Logger.getInstance().debug('[Middleware] ENTRY POINT', {
    path: request.nextUrl.pathname,
    category: 'middleware'
  })

  try {
    const result = await updateSession(request)
    Logger.getInstance().debug('[Middleware] EXIT - Returning response', {
      path: request.nextUrl.pathname,
      category: 'middleware'
    })
    return result
  } catch (error) {
    Logger.getInstance().error('[Middleware] CRITICAL ERROR - Blocking request for security', error as Error, {
      path: request.nextUrl.pathname,
      category: 'middleware',
      severity: 'critical'
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
    Logger.getInstance().warn('[Middleware] Development mode - allowing request despite error', {
      path: request.nextUrl.pathname,
      category: 'middleware'
    })
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