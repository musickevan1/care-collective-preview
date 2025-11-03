import { createClient } from '@/lib/supabase/client'

export async function signOut() {
  const supabase = createClient()

  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Sign out error:', error)
      throw error
    }

    // Redirect handled by LogoutButton component after this completes
    // This allows loading state to be properly cleaned up before navigation
  } catch (error) {
    console.error('Failed to sign out:', error)
    throw error
  }
}