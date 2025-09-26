'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import { errorTracker } from '@/lib/error-tracking'

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
          logger.warn('Initial session retrieval failed', {
            errorMessage: error.message,
            retryCount,
            maxRetries,
            category: 'auth_session',
            isJWTError: error.message.includes('JWT')
          })

          errorTracker.captureWarning('Initial session error', {
            component: 'AuthProvider',
            action: 'get_initial_session',
            severity: 'low',
            tags: {
              error_type: error.message.includes('JWT') ? 'jwt_error' : 'session_error',
              retry_count: retryCount.toString()
            },
            extra: {
              errorMessage: error.message,
              willRetry: error.message.includes('JWT') && retryCount < maxRetries
            }
          })

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
        logger.error('Critical failure getting initial session', error as Error, {
          retryCount,
          maxRetries,
          category: 'auth_critical'
        })

        errorTracker.captureError(error as Error, {
          component: 'AuthProvider',
          action: 'get_initial_session_failure',
          severity: 'high',
          tags: {
            error_type: 'critical_auth_failure',
            retry_count: retryCount.toString()
          }
        })

        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.info('Auth state change detected', {
          event,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          category: 'auth_state_change'
        })

        errorTracker.addBreadcrumb({
          message: `Auth state changed: ${event}`,
          category: 'auth',
          level: 'info',
          data: {
            event,
            hasUser: !!session?.user,
            hasSession: !!session
          }
        })

        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Handle session refresh
        if (event === 'TOKEN_REFRESHED') {
          logger.info('Authentication token refreshed successfully', {
            userId: session?.user?.id,
            category: 'auth_token_refresh'
          })

          errorTracker.addBreadcrumb({
            message: 'Auth token refreshed',
            category: 'auth',
            level: 'info',
            data: {
              event: 'TOKEN_REFRESHED',
              userId: session?.user?.id
            }
          })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signOut = async () => {
    try {
      setLoading(true)

      logger.info('User sign out initiated', {
        userId: user?.id,
        category: 'auth_signout'
      })

      await supabase.auth.signOut()
      setUser(null)
      setSession(null)

      logger.info('User signed out successfully', {
        category: 'auth_signout'
      })

      errorTracker.addBreadcrumb({
        message: 'User signed out',
        category: 'auth',
        level: 'info',
        data: {
          action: 'signout_success'
        }
      })

    } catch (error) {
      logger.error('Sign out failed', error as Error, {
        userId: user?.id,
        category: 'auth_error'
      })

      errorTracker.captureError(error as Error, {
        component: 'AuthProvider',
        action: 'sign_out',
        severity: 'medium',
        userId: user?.id,
        tags: {
          error_type: 'signout_failure'
        }
      })
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