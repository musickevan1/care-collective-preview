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
      auth: {
        // Disable auto-refresh in middleware to prevent cookie parsing issues
        autoRefreshToken: false,
        persistSession: false,
        // Disable debug mode to reduce noise
        debug: false,
      },
      cookies: {
        getAll() {
          try {
            const cookies = request.cookies.getAll()
            // Filter out any cookies with undefined values
            return (cookies || []).filter(cookie => 
              cookie && 
              cookie.name && 
              typeof cookie.name === 'string' && 
              cookie.value !== undefined &&
              cookie.value !== null &&
              typeof cookie.value === 'string'
            )
          } catch (error) {
            console.warn('[Middleware] Cookie parsing error:', error)
            return []
          }
        },
        setAll(cookiesToSet) {
          try {
            // Filter out invalid cookies with strict validation
            const validCookies = (cookiesToSet || []).filter(cookie => 
              cookie && 
              cookie.name && 
              typeof cookie.name === 'string' &&
              cookie.value !== undefined && 
              cookie.value !== null &&
              typeof cookie.value === 'string'
            )
            
            validCookies.forEach(({ name, value }) => {
              try {
                if (name && typeof name === 'string' && value !== undefined && typeof value === 'string') {
                  request.cookies.set(name, value)
                }
              } catch (setCookieError) {
                // Individual cookie setting may fail, continue with others
                if (process.env.NODE_ENV === 'development') {
                  console.warn('[Middleware] Individual cookie set failed:', name, setCookieError)
                }
              }
            })
            
            supabaseResponse = NextResponse.next({
              request,
            })
            
            validCookies.forEach(({ name, value, options }) => {
              try {
                if (name && typeof name === 'string' && value !== undefined && typeof value === 'string') {
                  supabaseResponse.cookies.set(name, value, {
                    ...(options || {}),
                    path: '/', // Ensure cookies are available for all paths
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    // Let Supabase handle cookie expiration and httpOnly settings
                  })
                }
              } catch (setResponseCookieError) {
                // Individual cookie setting may fail, continue with others
                if (process.env.NODE_ENV === 'development') {
                  console.warn('[Middleware] Response cookie set failed:', name, setResponseCookieError)
                }
              }
            })
            
            // Debug logging for cookie operations
            if (process.env.NODE_ENV === 'development' && validCookies.length > 0) {
              console.log('[Middleware] Setting cookies:', validCookies.map(c => c.name))
            }
          } catch (error) {
            console.warn('[Middleware] Cookie setting error:', error)
          }
        },
      },
    }
  )

  try {
    // Simple auth check - trust Supabase's session management
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      // Log once per error type to avoid spam
      if (process.env.NODE_ENV === 'development' && !authError.message?.includes('JWT')) {
        console.warn('[Middleware] Auth error:', authError.message)
      }
      // Don't force logout on auth errors - let client handle it
    }

    // Debug logging for authentication issues (reduced verbosity)
    if (process.env.NODE_ENV === 'development' && !authError?.message?.includes('Auth session missing')) {
      console.log('[Middleware] Auth state:', { 
        path: request.nextUrl.pathname,
        hasUser: !!user, 
        userId: user?.id,
        cookieCount: request.cookies.getAll().length,
        authError: authError?.message 
      })
    }

    // Define protected paths that require verification
    const protectedPaths = ['/dashboard', '/requests', '/admin']
    const isProtectedPath = protectedPaths.some(path => 
      request.nextUrl.pathname.startsWith(path)
    )

    // Allow access to public and auth pages without additional checks
    const publicPaths = ['/login', '/signup', '/auth', '/', '/design-system', '/help', '/api']
    const isPublicPath = publicPaths.some(path => 
      request.nextUrl.pathname.startsWith(path)
    )
    
    // Waitlist requires authentication but not necessarily verification
    const waitlistPath = request.nextUrl.pathname.startsWith('/waitlist')

    // Handle waitlist page - requires authentication
    if (waitlistPath) {
      if (!user) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Middleware] Redirecting to login for waitlist')
        }
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }
      // Authenticated user can access waitlist regardless of verification status
      return supabaseResponse
    }

    if (isProtectedPath) {
      // First check if user is authenticated
      if (!user) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Middleware] Redirecting to login for protected route')
        }
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }

      // Check user verification status for protected routes
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('verification_status, is_admin')
          .eq('id', user.id)
          .single()

        if (profileError) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[Middleware] Profile query error:', profileError.message)
          }
          // If we can't determine status, allow through (graceful degradation)
          return supabaseResponse
        }

        // Check admin routes specifically (both UI and API)
        if (request.nextUrl.pathname.startsWith('/admin') || 
            request.nextUrl.pathname.startsWith('/api/admin')) {
          if (!profile.is_admin || profile.verification_status !== 'approved') {
            if (process.env.NODE_ENV === 'development') {
              console.log('[Middleware] Blocking admin access - not admin or not approved')
            }
            
            // For API routes, return JSON error
            if (request.nextUrl.pathname.startsWith('/api/admin')) {
              return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
            }
            
            // For UI routes, redirect to dashboard
            const redirectUrl = new URL('/dashboard', request.url)
            redirectUrl.searchParams.set('error', 'admin_required')
            return NextResponse.redirect(redirectUrl)
          }
        }

        // Check verification status for all protected routes
        if (profile.verification_status !== 'approved') {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Middleware] Redirecting to dashboard - not approved')
          }
          const redirectUrl = new URL('/dashboard', request.url)
          redirectUrl.searchParams.set('message', 'approval_required')
          return NextResponse.redirect(redirectUrl)
        }

        // User is approved, allow access
        if (process.env.NODE_ENV === 'development') {
          console.log('[Middleware] User approved, allowing access to:', request.nextUrl.pathname)
        }
        
      } catch (error) {
        console.error('[Middleware] Verification check error:', error)
        // Graceful degradation - allow access if verification check fails
      }
    }

  } catch (error) {
    console.error('[Middleware] Auth error:', error)
    
    // For auth errors, let the application handle gracefully
    // instead of blocking requests in middleware
    if (process.env.NODE_ENV === 'development') {
      console.log('[Middleware] Auth error occurred, allowing request to proceed')
    }
    
    // Continue without blocking - let client-side handle auth errors
  }

  // Add basic security headers
  supabaseResponse.headers.set('X-Frame-Options', 'DENY')
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return supabaseResponse
}
