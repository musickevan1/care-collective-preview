import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  // CRITICAL FIX: Trim any whitespace/newlines from environment variables
  // Vercel environment variables had literal \n characters causing WebSocket failures
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim()

  return createBrowserClient(
    url,
    key,
    {
      auth: {
        // Improve session persistence
        persistSession: true,
        // Disable auto-refresh to prevent cookie parsing issues in SSR contexts
        autoRefreshToken: false,
        // Store session in both localStorage and cookies for better persistence
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        // Reduce debug output to avoid console spam
        debug: false,
      },
      // Global error handling to reduce console noise
      global: {
        headers: {
          'User-Agent': 'CareCollective/1.0.0'
        }
      }
    }
  )
}