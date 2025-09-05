import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Improve session persistence
        persistSession: true,
        autoRefreshToken: true,
        // Store session in both localStorage and cookies for better persistence
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    }
  )