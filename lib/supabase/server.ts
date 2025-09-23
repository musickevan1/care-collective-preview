import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Disable auto-refresh on server-side to prevent cookie parsing issues
        autoRefreshToken: false,
        persistSession: false,
        // Disable debug mode to reduce noise
        debug: false,
      },
      cookies: {
        getAll() {
          try {
            const cookies = cookieStore.getAll()
            // Debug logging for authentication issues (only when auth cookies present)
            if (process.env.NODE_ENV === 'development' && cookies.some(c => c.name.includes('sb-'))) {
              console.log('[Server Client] Auth cookies found:', cookies.filter(c => c.name.includes('sb-')).map(c => c.name))
            }
            // Enhanced cookie validation and sanitization
            return cookies.filter(cookie => {
              if (!cookie || typeof cookie.name !== 'string') {
                return false
              }
              // Ensure cookie value is defined and properly formatted
              if (cookie.value === undefined || cookie.value === null) {
                return false
              }
              // Convert value to string if it's not already
              if (typeof cookie.value !== 'string') {
                cookie.value = String(cookie.value)
              }
              return true
            })
          } catch (error) {
            console.warn('[Server Client] Cookie parsing error:', error)
            return []
          }
        },
        setAll(cookiesToSet) {
          try {
            // Validate and sanitize cookies before setting
            const validCookies = cookiesToSet.filter(cookie => {
              if (!cookie || typeof cookie.name !== 'string' || !cookie.name.trim()) {
                console.warn('[Server Client] Invalid cookie name:', cookie)
                return false
              }
              if (cookie.value === undefined || cookie.value === null) {
                console.warn('[Server Client] Invalid cookie value for:', cookie.name)
                return false
              }
              return true
            })

            validCookies.forEach(({ name, value, options }) => {
              // Ensure value is a string
              const stringValue = typeof value === 'string' ? value : String(value)
              cookieStore.set(name, stringValue, {
                ...options,
                path: '/', // Ensure cookies are available for all paths
              })
            })
            
            // Debug logging for cookie operations
            if (process.env.NODE_ENV === 'development' && validCookies.length > 0) {
              console.log('[Server Client] Setting cookies:', validCookies.map(c => c.name))
            }
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('[Server Client] Cookie setting failed (expected in server components):', error)
            }
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  // Add authentication state logging for debugging (reduced verbosity)
  if (process.env.NODE_ENV === 'development') {
    try {
      // Wrap auth check in timeout to prevent hanging
      const authCheckPromise = client.auth.getUser()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth check timeout')), 2000)
      )
      
      const { data: { user }, error } = await Promise.race([authCheckPromise, timeoutPromise]) as any
      
      // Only log if there's an actual user or a non-session error
      if (user || (error && !error.message?.includes('Auth session missing'))) {
        console.log('[Server Client] Auth state:', { 
          hasUser: !!user, 
          userId: user?.id, 
          error: error?.message 
        })
      }
    } catch (authError) {
      // Handle different types of auth errors more gracefully
      const errorMessage = String(authError)
      if (!errorMessage.includes('Auth session missing') && 
          !errorMessage.includes('Auth check timeout') &&
          !errorMessage.includes('Cannot read properties of undefined')) {
        console.error('[Server Client] Auth check failed:', authError)
      } else if (errorMessage.includes('Auth check timeout')) {
        console.warn('[Server Client] Auth check timed out - this may indicate connection issues')
      }
    }
  }

  return client
}