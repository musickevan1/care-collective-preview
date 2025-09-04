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
    const supabase = await createClient()
    
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
    const response = NextResponse.redirect(new URL('/', origin), {
      status: 303 // Use 303 See Other for POST->GET redirect
    })
    
    // Clear auth cookies explicitly
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')
    
    // Add security headers
    addSecurityHeaders(response)
    
    return response
  } catch (error) {
    logSecurityEvent('logout_exception', request, { error: String(error) })
    // Even on error, redirect to home to avoid getting stuck
    const origin = new URL(request.url).origin
    const response = NextResponse.redirect(new URL('/', origin), {
      status: 303
    })
    
    // Clear cookies even on error
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')
    
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