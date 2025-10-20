import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { authRateLimiter } from '@/lib/security/rate-limiter'
import { addSecurityHeaders, createSuccessResponse, logSecurityEvent } from '@/lib/security/middleware'

async function handleLogout(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await authRateLimiter.middleware(request)
  if (rateLimitResponse) {
    logSecurityEvent('rate_limit_exceeded', request, { endpoint: 'logout' })
    return rateLimitResponse
  }

  try {
    const supabase = createClient()

    // Sign out the user
    const { error } = await supabase.auth.signOut()

    if (error) {
      logSecurityEvent('logout_error', request, { error: error.message })
      // Even if there's an error, still redirect to home to avoid getting stuck
      console.error('Logout error:', error.message)
    } else {
      logSecurityEvent('logout_success', request)
    }

    // Get the origin from the request to handle both local and production
    const origin = new URL(request.url).origin

    // Add cache-busting timestamp to prevent browser caching of redirect
    const response = NextResponse.redirect(new URL(`/?t=${Date.now()}`, origin), {
      status: 303 // Use 303 See Other for POST->GET redirect
    })

    // BUG #4 FIX: Clear ALL Supabase cookies (not just hardcoded names)
    // Supabase uses project-specific cookie names like: sb-{project-ref}-auth-token
    // The old code only deleted 'sb-access-token' and 'sb-refresh-token' which don't exist!
    const allCookies = request.cookies.getAll()
    const clearedCookies: string[] = []

    console.log('[Logout] Cookies before clear:', allCookies.map(c => c.name))

    allCookies.forEach(cookie => {
      if (cookie.name.startsWith('sb-')) {
        response.cookies.delete(cookie.name)
        clearedCookies.push(cookie.name)
      }
    })

    console.log('[Logout] Cleared Supabase cookies:', clearedCookies)

    // Add security headers
    addSecurityHeaders(response)

    return response
  } catch (error) {
    logSecurityEvent('logout_exception', request, { error: String(error) })
    // Even on error, redirect to home to avoid getting stuck
    const origin = new URL(request.url).origin
    const response = NextResponse.redirect(new URL(`/?t=${Date.now()}`, origin), {
      status: 303
    })

    // BUG #4 FIX: Clear ALL Supabase cookies even on error
    const allCookies = request.cookies.getAll()
    allCookies.forEach(cookie => {
      if (cookie.name.startsWith('sb-')) {
        response.cookies.delete(cookie.name)
      }
    })

    addSecurityHeaders(response)
    return response
  }
}

// Handle both POST (form submission) and GET (direct navigation) methods
export async function POST(request: NextRequest) {
  return handleLogout(request)
}

export async function GET(request: NextRequest) {
  return handleLogout(request)
}