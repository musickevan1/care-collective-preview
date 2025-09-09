import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Enhanced security checks
  const userAgent = request.headers.get('user-agent') || ''
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  
  // Block requests without user agent in production
  if (!userAgent && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // Basic bot detection
  const suspiciousPaths = ['/admin', '/api/admin']
  const isSuspiciousPath = suspiciousPaths.some(path => request.nextUrl.pathname.startsWith(path))
  
  if (isSuspiciousPath && process.env.NODE_ENV === 'production') {
    const isBot = /bot|crawl|spider|scrape/i.test(userAgent)
    if (isBot) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
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
            // Security: Only return Supabase auth cookies and validate them
            return (cookies || []).filter(cookie => {
              if (!cookie || !cookie.name || cookie.value === undefined) {
                return false
              }
              
              // Only process Supabase auth cookies for security
              if (!cookie.name.startsWith('sb-')) {
                return false
              }
              
              // Validate cookie structure
              if (typeof cookie.name !== 'string' || typeof cookie.value !== 'string') {
                return false
              }
              
              // Check for malicious patterns in cookie values
              if (cookie.value.includes('<script>') || cookie.value.includes('javascript:')) {
                console.warn('[Middleware] Malicious cookie detected:', cookie.name)
                return false
              }
              
              return true
            })
          } catch (error) {
            console.error('[Middleware] Critical cookie parsing error:', error)
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
    // Secure authentication check with proper error handling
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      // Log authentication errors securely (no sensitive data)
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Middleware] Auth error:', {
          message: authError.message,
          path: request.nextUrl.pathname,
          hasJWTError: authError.message?.includes('JWT')
        })
      }
      
      // For JWT errors or invalid tokens, clear auth state and redirect
      if (authError.message?.includes('JWT') || 
          authError.message?.includes('invalid') || 
          authError.message?.includes('expired')) {
        const loginUrl = new URL('/login', request.url)
        const response = NextResponse.redirect(loginUrl)
        
        // Clear potentially corrupted auth cookies
        response.cookies.delete('sb-access-token')
        response.cookies.delete('sb-refresh-token')
        
        return response
      }
    }

    // Secure debug logging (development only, no sensitive data)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Middleware] Auth state:', { 
        path: request.nextUrl.pathname,
        hasUser: !!user, 
        userIdLength: user?.id ? user.id.length : 0, // Length only, not actual ID
        authCookiesCount: request.cookies.getAll().filter(c => c.name.startsWith('sb-')).length,
        hasAuthError: !!authError
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
            console.log('[Middleware] Redirecting to waitlist - not approved')
          }
          return NextResponse.redirect(new URL('/waitlist', request.url))
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