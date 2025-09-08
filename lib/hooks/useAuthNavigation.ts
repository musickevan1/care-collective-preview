'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  id: string
  name: string | null
  location: string | null
  is_admin: boolean
  created_at: string
}

interface AuthNavigationState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  displayName: string | null
}

export function useAuthNavigation(): AuthNavigationState {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const getInitialSession = async () => {
      try {
        setIsLoading(true)
        
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Auth timeout')), 5000)
        })
        
        // Race between auth check and timeout
        const authPromise = supabase.auth.getSession()
        const { data: { session }, error: sessionError } = await Promise.race([
          authPromise,
          timeoutPromise
        ]) as any
        
        if (sessionError) {
          // Auth errors are common when not logged in - just log at debug level
          console.debug('Session error (expected when not authenticated):', sessionError.message)
          setUser(null)
          setProfile(null)
          return
        }

        if (session?.user) {
          setUser(session.user)
          
          // Fetch user profile with timeout
          const profilePromise = supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
            
          const profileTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Profile timeout')), 3000)
          })
          
          try {
            const { data: profileData, error: profileError } = await Promise.race([
              profilePromise,
              profileTimeoutPromise
            ]) as any
            
            if (!profileError && profileData) {
              setProfile(profileData)
            } else if (profileError) {
              console.debug('Profile query error:', profileError.message)
            }
          } catch (profileTimeoutError) {
            console.debug('Profile query timed out, continuing without profile data')
          }
        } else {
          setUser(null)
          setProfile(null)
        }
      } catch (error) {
        // Catch and handle auth-related errors gracefully
        console.debug('Auth initialization error (likely not authenticated):', error)
        setUser(null)
        setProfile(null)
      } finally {
        setIsLoading(false)
      }
    }

    // Get initial session
    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        
        if (session?.user) {
          setUser(session.user)
          
          // Fetch updated profile when user logs in
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
              
            if (!profileError && profileData) {
              setProfile(profileData)
            }
          }
        } else {
          setUser(null)
          setProfile(null)
        }
        
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: profile?.is_admin || false,
    displayName: profile?.name || user?.email || null,
  }
}