import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          try {
            const cookies = cookieStore.getAll()
            // Debug logging for authentication issues (only when auth cookies present)
            if (process.env.NODE_ENV === 'development' && cookies.some(c => c.name.includes('sb-'))) {
              console.log('[Server Client] Auth cookies found:', cookies.filter(c => c.name.includes('sb-')).map(c => c.name))
            }
            return cookies.filter(cookie => cookie && cookie.name && cookie.value !== undefined)
          } catch (error) {
            console.warn('[Server Client] Cookie parsing error:', error)
            return []
          }
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                path: '/', // Ensure cookies are available for all paths
              })
            )
            // Debug logging for cookie operations
            if (process.env.NODE_ENV === 'development' && cookiesToSet.length > 0) {
              console.log('[Server Client] Setting cookies:', cookiesToSet.map(c => c.name))
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
      const { data: { user }, error } = await client.auth.getUser()
      // Only log if there's an actual user or a non-session error
      if (user || (error && !error.message?.includes('Auth session missing'))) {
        console.log('[Server Client] Auth state:', { 
          hasUser: !!user, 
          userId: user?.id, 
          error: error?.message 
        })
      }
    } catch (authError) {
      // Only log actual errors, not expected auth state
      if (!String(authError).includes('Auth session missing')) {
        console.error('[Server Client] Auth check failed:', authError)
      }
    }
  }

  return client
}