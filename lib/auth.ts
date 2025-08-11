import { createClient } from '@/lib/supabase/client'

export async function signOut() {
  const supabase = createClient()
  
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Sign out error:', error)
      throw error
    }
    
    // Redirect to home page after successful logout
    window.location.href = window.location.origin + '/'
  } catch (error) {
    console.error('Failed to sign out:', error)
    throw error
  }
}