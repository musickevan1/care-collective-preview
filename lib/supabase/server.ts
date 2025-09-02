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
          const cookies = cookieStore.getAll()
          // Debug logging for authentication issues
          if (process.env.NODE_ENV === 'development') {
            console.log('[Server Client] Available cookies:', cookies.map(c => c.name))
          }
          return cookies
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

  // Add authentication state logging for debugging
  if (process.env.NODE_ENV === 'development') {
    try {
      const { data: { user }, error } = await client.auth.getUser()
      console.log('[Server Client] Auth state:', { 
        hasUser: !!user, 
        userId: user?.id, 
        error: error?.message 
      })
    } catch (authError) {
      console.error('[Server Client] Auth check failed:', authError)
    }
  }

  return client
}