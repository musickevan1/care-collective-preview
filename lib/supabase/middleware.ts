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

  // Check if accessing waitlist route - allow pending users without email confirmation
  if (request.nextUrl.pathname.startsWith('/waitlist')) {
    // If not authenticated, redirect to login
    if (!user) {
      logSecurityEvent('waitlist_access_denied', request, { reason: 'not_authenticated' })
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Validate user ID
    if (!validateUUID(user.id)) {
      logSecurityEvent('invalid_user_id', request, { userId: user.id })
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    // Get user profile to check verification status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('verification_status, email_confirmed')
      .eq('id', user.id)
      .single()

    if (profileError) {
      logSecurityEvent('profile_check_error', request, { error: profileError.message })
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Allow access to waitlist for pending users (no email confirmation required)
    // If user is approved, redirect them to dashboard
    if (profile?.verification_status === 'approved') {
      const redirectUrl = new URL('/dashboard', request.url)
      return NextResponse.redirect(redirectUrl)
    }
    
    // Allow pending and rejected users to access waitlist
    // (rejected users can reapply, pending users can check status)
  }

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

    // Check if user is admin and email is confirmed
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin, verification_status, email_confirmed')
      .eq('id', user.id)
      .single()

    if (profileError) {
      logSecurityEvent('admin_check_error', request, { error: profileError.message })
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // If not admin or email not confirmed, redirect appropriately
    if (!profile?.is_admin || profile?.verification_status !== 'approved' || !profile?.email_confirmed) {
      logSecurityEvent('admin_access_denied', request, { 
        reason: profile?.is_admin ? 'email_not_confirmed' : 'not_admin', 
        userId: user.id 
      })
      
      // Redirect based on verification status
      if (profile?.verification_status === 'pending') {
        const redirectUrl = new URL('/waitlist', request.url)
        return NextResponse.redirect(redirectUrl)
      } else if (profile?.verification_status === 'approved' && !profile?.email_confirmed) {
        const redirectUrl = new URL('/verify-email', request.url)
        return NextResponse.redirect(redirectUrl)
      } else {
        const redirectUrl = new URL('/dashboard', request.url)
        redirectUrl.searchParams.set('error', 'admin_required')
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  // Check if accessing protected routes (dashboard, requests) without proper verification
  const protectedPaths = ['/dashboard', '/requests']
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath) {
    // If not authenticated, redirect to login
    if (!user) {
      logSecurityEvent('protected_access_denied', request, { path: request.nextUrl.pathname })
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Validate user ID
    if (!validateUUID(user.id)) {
      logSecurityEvent('invalid_user_id', request, { userId: user.id })
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    // Get user profile to check verification and email confirmation status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('verification_status, email_confirmed')
      .eq('id', user.id)
      .single()

    if (profileError) {
      logSecurityEvent('profile_check_error', request, { error: profileError.message })
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Redirect based on user status
    if (profile?.verification_status === 'pending') {
      // Pending users should use the waitlist
      const redirectUrl = new URL('/waitlist', request.url)
      return NextResponse.redirect(redirectUrl)
    } else if (profile?.verification_status === 'rejected') {
      // Rejected users should go to waitlist to reapply
      const redirectUrl = new URL('/waitlist', request.url)
      return NextResponse.redirect(redirectUrl)
    } else if (profile?.verification_status === 'approved' && !profile?.email_confirmed) {
      // Approved users need email confirmation for protected routes
      logSecurityEvent('protected_access_denied', request, { 
        reason: 'email_not_confirmed',
        path: request.nextUrl.pathname 
      })
      const redirectUrl = new URL('/verify-email', request.url)
      redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
    
    // If verification_status is approved and email_confirmed is true, allow access
  }

  // Add security headers to response
  addSecurityHeaders(supabaseResponse)

  return supabaseResponse
}