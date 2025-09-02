import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Basic security checks without importing heavy modules
  const userAgent = request.headers.get('user-agent') || ''
  if (!userAgent && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/', // Ensure cookies are available for all paths
            })
          })
          
          // Debug logging for cookie operations
          if (process.env.NODE_ENV === 'development' && cookiesToSet.length > 0) {
            console.log('[Middleware] Setting cookies:', cookiesToSet.map(c => c.name))
          }
        },
      },
    }
  )

  try {
    // Get user session and refresh if needed
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // If we have a user, refresh the session to ensure it's up to date
    if (user) {
      const { error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError && process.env.NODE_ENV === 'development') {
        console.warn('[Middleware] Session refresh warning:', refreshError.message)
      }
    }

    // Debug logging for authentication issues
    if (process.env.NODE_ENV === 'development') {
      console.log('[Middleware] Auth state:', { 
        path: request.nextUrl.pathname,
        hasUser: !!user, 
        userId: user?.id,
        cookieCount: request.cookies.getAll().length,
        authError: authError?.message 
      })
    }

    // Check if accessing admin routes
    if (request.nextUrl.pathname.startsWith('/admin')) {
      if (!user) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Middleware] Redirecting to login for admin route')
        }
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }
    }

    // Check if accessing protected routes
    const protectedPaths = ['/dashboard', '/requests']
    const isProtectedPath = protectedPaths.some(path => 
      request.nextUrl.pathname.startsWith(path)
    )

    if (isProtectedPath && !user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Middleware] Redirecting to login for protected route')
      }
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

  } catch (error) {
    console.error('Auth middleware error:', error)
    // Continue without blocking the request
  }

  // Add basic security headers
  supabaseResponse.headers.set('X-Frame-Options', 'DENY')
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return supabaseResponse
}