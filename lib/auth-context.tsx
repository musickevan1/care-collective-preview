'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    let retryCount = 0
    const maxRetries = 3

    const getInitialSession = async () => {
      try {
        // Add small delay for session to settle
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.warn('Initial session error:', error.message)
          
          // Retry on JWT errors
          if (error.message.includes('JWT') && retryCount < maxRetries) {
            retryCount++
            setTimeout(() => getInitialSession(), 1000 * retryCount)
            return
          }
        }

        setSession(initialSession)
        setUser(initialSession?.user ?? null)
        setLoading(false)
      } catch (error) {
        console.error('Failed to get initial session:', error)
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, !!session?.user)
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Handle session refresh
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signOut = async () => {
    try {
      setLoading(true)
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}