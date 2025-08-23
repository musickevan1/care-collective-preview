import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { addSecurityHeaders, securityMiddleware, logSecurityEvent } from '@/lib/security/middleware'
import { validateUUID } from '@/lib/validations'

export async function updateSession(request: NextRequest) {
  // Apply security middleware first
  const securityCheck = securityMiddleware(request)
  if (securityCheck) {
    logSecurityEvent('request_blocked', request, { reason: 'security_middleware' })
    return securityCheck
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  // Configure secure cookie options
  const isProduction = process.env.NODE_ENV === 'production'
  const cookieOptions = {
    secure: isProduction, // Only send over HTTPS in production
    httpOnly: true, // Prevent XSS access to cookies
    sameSite: 'lax' as const, // CSRF protection
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
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
            // Apply secure cookie options
            const secureOptions = {
              ...options,
              ...cookieOptions,
              // Preserve essential Supabase options
              ...(options?.maxAge && { maxAge: options.maxAge }),
            }
            supabaseResponse.cookies.set(name, value, secureOptions)
          })
        },
      },
    }
  )

  // refreshing the auth token
  const { data: { user } } = await supabase.auth.getUser()

  // Check if accessing admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // If not authenticated, redirect to login
    if (!user) {
      logSecurityEvent('admin_access_denied', request, { reason: 'not_authenticated' })
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Validate user ID
    if (!validateUUID(user.id)) {
      logSecurityEvent('invalid_user_id', request, { userId: user.id })
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError) {
      logSecurityEvent('admin_check_error', request, { error: profileError.message })
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // If not admin, redirect to dashboard with error
    if (!profile?.is_admin) {
      logSecurityEvent('admin_access_denied', request, { 
        reason: 'not_admin', 
        userId: user.id 
      })
      const redirectUrl = new URL('/dashboard', request.url)
      redirectUrl.searchParams.set('error', 'admin_required')
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Check if accessing protected routes (dashboard, requests) without auth
  const protectedPaths = ['/dashboard', '/requests']
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath && !user) {
    logSecurityEvent('protected_access_denied', request, { path: request.nextUrl.pathname })
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Add security headers to response
  addSecurityHeaders(supabaseResponse)

  return supabaseResponse
}