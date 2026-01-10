/**
 * @fileoverview Session Monitoring and Timeout Handling
 * 
 * Addresses Issue #7 from TESTING_ISSUES_AND_FIXES.md - Session Timeout Handling
 * Provides proactive session management with user-friendly warnings
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { refreshSession } from './session-sync'

interface SessionWarning {
  message: string
  action: string
  onAction: () => void
  onDismiss?: () => void
  timeLeft: number
}

interface SessionMonitorOptions {
  warningTimeMinutes?: number
  checkIntervalMinutes?: number
  onSessionExpired?: () => void
  onSessionWarning?: (warning: SessionWarning) => void
}

interface SessionMonitorState {
  sessionExpiry: Date | null
  isExpired: boolean
  isNearExpiry: boolean
  timeUntilExpiry: number | null
  warning: SessionWarning | null
}

/**
 * Hook for monitoring session expiry and handling timeouts
 */
export function useSessionMonitor(options: SessionMonitorOptions = {}) {
  const {
    warningTimeMinutes = 5,
    checkIntervalMinutes = 1,
    onSessionExpired,
    onSessionWarning,
  } = options
  
  const router = useRouter()
  const supabase = createClient()
  
  const [state, setState] = useState<SessionMonitorState>({
    sessionExpiry: null,
    isExpired: false,
    isNearExpiry: false,
    timeUntilExpiry: null,
    warning: null,
  })
  
  const checkSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.warn('[Session Monitor] Error checking session:', error.message)
        setState(prev => ({
          ...prev,
          isExpired: true,
          sessionExpiry: null,
          timeUntilExpiry: null,
        }))
        return
      }
      
      if (!session?.expires_at) {
        setState(prev => ({
          ...prev,
          sessionExpiry: null,
          isExpired: false,
          isNearExpiry: false,
          timeUntilExpiry: null,
        }))
        return
      }
      
      const expiryTime = new Date(session.expires_at * 1000)
      const now = new Date()
      const timeUntilExpiry = expiryTime.getTime() - now.getTime()
      const minutesUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60))
      
      const isExpired = timeUntilExpiry <= 0
      const isNearExpiry = !isExpired && minutesUntilExpiry <= warningTimeMinutes
      
      // Track if we need to trigger callbacks after state update
      let shouldTriggerExpired = false
      let shouldTriggerWarning = false

      setState(prev => {
        // Check transition states before updating
        shouldTriggerExpired = isExpired && !prev.isExpired
        shouldTriggerWarning = isNearExpiry && !prev.isNearExpiry && !prev.warning

        return {
          ...prev,
          sessionExpiry: expiryTime,
          isExpired,
          isNearExpiry,
          timeUntilExpiry: isExpired ? 0 : timeUntilExpiry,
        }
      })

      // Handle expired session
      if (shouldTriggerExpired) {
        console.log('[Session Monitor] Session expired')
        onSessionExpired?.()
      }

      // Handle near expiry warning
      if (shouldTriggerWarning) {
        const warning: SessionWarning = {
          message: `Your session will expire in ${minutesUntilExpiry} minute${minutesUntilExpiry !== 1 ? 's' : ''}`,
          action: 'Stay Logged In',
          timeLeft: minutesUntilExpiry,
          onAction: async () => {
            try {
              const result = await refreshSession()
              if (result.success) {
                setState(prev => ({ 
                  ...prev, 
                  warning: null,
                  isNearExpiry: false,
                }))
              } else {
                console.error('[Session Monitor] Failed to refresh session:', result.error)
                router.push('/login')
              }
            } catch (error) {
              console.error('[Session Monitor] Error refreshing session:', error)
              router.push('/login')
            }
          },
          onDismiss: () => {
            setState(prev => ({ ...prev, warning: null }))
          }
        }
        
        setState(prev => ({ ...prev, warning }))
        onSessionWarning?.(warning)
      }
      
    } catch (error) {
      console.error('[Session Monitor] Unexpected error:', error)
    }
  }, [warningTimeMinutes, onSessionExpired, onSessionWarning, supabase.auth, router])
  
  // Set up periodic session checking
  useEffect(() => {
    // Check immediately
    checkSession()
    
    // Set up interval
    const interval = setInterval(checkSession, checkIntervalMinutes * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [checkSession, checkIntervalMinutes])
  
  // Listen to auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          setState(prev => ({
            ...prev,
            sessionExpiry: null,
            isExpired: true,
            isNearExpiry: false,
            timeUntilExpiry: null,
            warning: null,
          }))
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Recheck session after sign in or token refresh
          checkSession()
        }
      }
    )
    
    return () => subscription.unsubscribe()
  }, [supabase.auth, checkSession])
  
  const extendSession = useCallback(async () => {
    try {
      const result = await refreshSession()
      if (result.success) {
        setState(prev => ({ 
          ...prev, 
          warning: null,
          isNearExpiry: false,
        }))
        return true
      } else {
        console.error('[Session Monitor] Failed to extend session:', result.error)
        return false
      }
    } catch (error) {
      console.error('[Session Monitor] Error extending session:', error)
      return false
    }
  }, [])
  
  const dismissWarning = useCallback(() => {
    setState(prev => ({ ...prev, warning: null }))
  }, [])
  
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('[Session Monitor] Error signing out:', error)
    }
  }, [supabase.auth, router])
  
  return {
    ...state,
    extendSession,
    dismissWarning,
    signOut,
    refreshSession: checkSession,
  }
}

/**
 * Utility to format time until expiry
 */
export function formatTimeUntilExpiry(timeUntilExpiry: number | null): string {
  if (!timeUntilExpiry || timeUntilExpiry <= 0) {
    return 'Expired'
  }
  
  const minutes = Math.floor(timeUntilExpiry / (1000 * 60))
  const seconds = Math.floor((timeUntilExpiry % (1000 * 60)) / 1000)
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  
  return `${seconds}s`
}

/**
 * Component hook for displaying session warnings
 */
export function useSessionWarningDisplay() {
  const [activeWarning, setActiveWarning] = useState<SessionWarning | null>(null)
  
  const showWarning = useCallback((warning: SessionWarning) => {
    setActiveWarning(warning)
  }, [])
  
  const hideWarning = useCallback(() => {
    setActiveWarning(null)
  }, [])
  
  return {
    activeWarning,
    showWarning,
    hideWarning,
  }
}

/**
 * Helper to check if session is valid with buffer time
 */
export function isSessionValidWithBuffer(
  sessionExpiry: Date | null, 
  bufferMinutes: number = 5
): boolean {
  if (!sessionExpiry) return false
  
  const now = new Date()
  const bufferTime = bufferMinutes * 60 * 1000
  
  return sessionExpiry.getTime() > (now.getTime() + bufferTime)
}

/**
 * Auto-refresh session before expiry
 */
export function useAutoSessionRefresh(
  refreshBeforeMinutes: number = 10
) {
  const supabase = createClient()
  
  useEffect(() => {
    const checkAndRefresh = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.expires_at) return
      
      const expiryTime = new Date(session.expires_at * 1000)
      const now = new Date()
      const minutesUntilExpiry = Math.floor(
        (expiryTime.getTime() - now.getTime()) / (1000 * 60)
      )
      
      // Refresh if within refresh window
      if (minutesUntilExpiry <= refreshBeforeMinutes && minutesUntilExpiry > 0) {
        try {
          await refreshSession()
          console.log('[Session Monitor] Auto-refreshed session')
        } catch (error) {
          console.warn('[Session Monitor] Auto-refresh failed:', error)
        }
      }
    }
    
    // Check every minute
    const interval = setInterval(checkAndRefresh, 60 * 1000)
    
    return () => clearInterval(interval)
  }, [refreshBeforeMinutes, supabase.auth])
}