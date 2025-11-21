'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'

interface Profile {
  id: string
  name: string | null
  location: string | null
  is_admin: boolean
  created_at: string
}

export interface AuthNavigationState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  displayName: string | null
}

// Cache for profile requests to prevent duplicate fetching
let profileCache: { [userId: string]: Promise<Profile | null> } = {}
let profileData: { [userId: string]: Profile | null } = {}

async function fetchProfile(userId: string): Promise<Profile | null> {
  // Return cached data if available
  if (profileData[userId]) {
    return profileData[userId]
  }

  // Return in-flight request if exists
  if (profileCache[userId]) {
    return profileCache[userId]
  }

  // Create new request
  const supabase = createClient()
  profileCache[userId] = (async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Profile query error:', error.message)
        return null
      }

      profileData[userId] = data
      return data
    } catch (error) {
      console.error('Profile fetch failed:', error)
      return null
    } finally {
      // Clear cache after request completes
      delete profileCache[userId]
    }
  })()

  return profileCache[userId]
}

export function useAuthNavigation(): AuthNavigationState {
  // Use AuthProvider's auth state instead of duplicating
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setProfileLoading(false)
      return
    }

    // Fetch profile when user changes
    setProfileLoading(true)
    fetchProfile(user.id)
      .then(data => {
        setProfile(data)
      })
      .finally(() => {
        setProfileLoading(false)
      })
  }, [user?.id])

  // Combined loading state: loading if either auth or profile is loading
  const isLoading = authLoading || profileLoading

  return {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: profile?.is_admin || false,
    displayName: profile?.name || user?.email || null,
  }
}