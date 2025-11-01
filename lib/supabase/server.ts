import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Logger } from '@/lib/logger'

export function createClient() {
  const cookieStore = cookies()

  // CRITICAL FIX: Trim any whitespace/newlines from environment variables
  // Vercel environment variables had literal \n characters causing WebSocket failures
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim()

  const client = createServerClient(
    url,
    key,
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
              Logger.getInstance().debug('[Server Client] Auth cookies found', {
                authCookies: cookies.filter(c => c.name.includes('sb-')).map(c => c.name),
                category: 'server_client'
              })
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
            Logger.getInstance().warn('[Server Client] Cookie parsing error', {
              error: error instanceof Error ? error.message : String(error),
              category: 'server_client'
            })
            return []
          }
        },
        setAll(cookiesToSet) {
          try {
            // Validate and sanitize cookies before setting
            const validCookies = cookiesToSet.filter(cookie => {
              if (!cookie || typeof cookie.name !== 'string' || !cookie.name.trim()) {
                Logger.getInstance().warn('[Server Client] Invalid cookie name', {
                  cookie: cookie?.name,
                  category: 'server_client'
                })
                return false
              }
              if (cookie.value === undefined || cookie.value === null) {
                Logger.getInstance().warn('[Server Client] Invalid cookie value', {
                  cookieName: cookie.name,
                  category: 'server_client'
                })
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
              Logger.getInstance().debug('[Server Client] Setting cookies', {
                cookieNames: validCookies.map(c => c.name),
                category: 'server_client'
              })
            }
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              Logger.getInstance().warn('[Server Client] Cookie setting failed (expected in server components)', {
                error: error instanceof Error ? error.message : String(error),
                category: 'server_client'
              })
            }
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  return client
}