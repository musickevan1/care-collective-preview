import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'
import type { Database } from '@/lib/database.types'

// Security utility functions
function sanitize(input: string): string {
  if (!input || typeof input !== 'string') return ''
  
  // Remove potentially dangerous characters and normalize
  return input
    .replace(/[<>'"&]/g, '') // Remove HTML/XSS characters
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim()
    .slice(0, 1000) // Reasonable length limit
}

// Security constants
const SECURE_COOKIE_OPTIONS = {
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  httpOnly: true,
}

// Cache the client creation for performance while maintaining security
const createServerClient_cached = cache(async () => {
  const cookieStore = await cookies()

  const client = createServerClient<Database>(
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
            const allCookies = cookieStore.getAll()
            
            // Filter to only return valid, secure cookies
            const validCookies = allCookies.filter(cookie => {
              if (!cookie || !cookie.name || cookie.value === undefined) {
                return false
              }
              
              // Only process Supabase auth cookies for security
              if (!cookie.name.startsWith('sb-')) {
                return false
              }
              
              // Validate cookie value is not empty or malformed
              if (typeof cookie.value !== 'string' || cookie.value.length === 0) {
                return false
              }
              
              return true
            })
            
            // Security: Only log cookie names in development, never values
            if (process.env.NODE_ENV === 'development' && validCookies.length > 0) {
              console.log('[Server] Valid auth cookies found:', validCookies.map(c => c.name))
            }
            
            return validCookies
          } catch (error) {
            console.error('[Server] Critical cookie parsing error:', error)
            return []
          }
        },
        
        setAll(cookiesToSet) {
          try {
            const validCookies = (cookiesToSet || []).filter(({ name, value }) => {
              return name && 
                     typeof name === 'string' && 
                     value !== undefined && 
                     typeof value === 'string' &&
                     name.startsWith('sb-') // Security: Only set Supabase cookies
            })
            
            validCookies.forEach(({ name, value, options }) => {
              try {
                cookieStore.set(name, value, {
                  ...SECURE_COOKIE_OPTIONS,
                  ...options,
                })
              } catch (setCookieError) {
                // Individual cookie failures are expected in read-only server components
                if (process.env.NODE_ENV === 'development') {
                  console.log('[Server] Cookie set skipped (read-only context):', name)
                }
              }
            })
            
            if (process.env.NODE_ENV === 'development' && validCookies.length > 0) {
              console.log('[Server] Processed cookies:', validCookies.length)
            }
          } catch (error) {
            console.warn('[Server] Cookie operations not available in this context')
          }
        },
      },
    }
  )

  return client
})

// Primary export - cached client
export const createClient = createServerClient_cached

// Secure user verification function with proper error handling
export async function getAuthenticatedUser() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.warn('[Server] Authentication error:', authError.message)
      return { user: null, error: authError }
    }
    
    if (!user) {
      return { user: null, error: null }
    }
    
    // Verify user exists in profiles table and get verification status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, verification_status, is_admin, location, created_at')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      console.error('[Server] Profile fetch error:', profileError.message)
      return { user: null, error: profileError }
    }
    
    if (!profile) {
      console.error('[Server] Profile not found for user:', user.id)
      return { user: null, error: new Error('Profile not found') }
    }
    
    // Return combined user data with profile info
    return {
      user: {
        id: user.id,
        email: user.email,
        ...profile
      },
      error: null
    }
  } catch (error) {
    console.error('[Server] Critical authentication error:', error)
    return { user: null, error: error as Error }
  }
}

// Admin verification function
export async function getAuthenticatedAdmin() {
  const { user, error } = await getAuthenticatedUser()
  
  if (error || !user) {
    return { user: null, error: error || new Error('Authentication required') }
  }
  
  if (!user.is_admin || user.verification_status !== 'approved') {
    return { user: null, error: new Error('Admin privileges required') }
  }
  
  return { user, error: null }
}

// Secure database query wrapper with proper error handling
export async function withAuth<T>(
  queryFn: (supabase: ReturnType<typeof createServerClient<Database>>, userId: string) => Promise<T>
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const { user, error } = await getAuthenticatedUser()
    
    if (error || !user) {
      return { data: null, error: error || new Error('Authentication required') }
    }
    
    const supabase = await createClient()
    const data = await queryFn(supabase, user.id)
    
    return { data, error: null }
  } catch (error) {
    console.error('[Server] Query execution error:', error)
    return { data: null, error: error as Error }
  }
}