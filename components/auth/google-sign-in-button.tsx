'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, type ReactElement } from 'react'

interface GoogleSignInButtonProps {
  mode?: 'signin' | 'signup'
  className?: string
}

function GoogleIcon(): ReactElement {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9.003 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.26c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9.003 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.002 0 5.48 0 2.438 2.017.956 4.958l3.008 2.332c.708-2.127 2.692-3.71 5.04-3.71z"
      />
    </svg>
  )
}

export function GoogleSignInButton({
  mode = 'signin',
  className = ''
}: GoogleSignInButtonProps): ReactElement {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (oauthError) {
        console.error('Google sign-in error:', oauthError)
        setError('Failed to sign in with Google. Please try again.')
        setLoading(false)
      }
      // If successful, the page will redirect to Google
    } catch (err) {
      console.error('Unexpected error during Google sign-in:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  const buttonText = mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'
  const loadingText = 'Redirecting to Google...'

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-3 px-4 py-3
                   bg-white border border-gray-300 rounded-lg
                   hover:bg-gray-50 hover:border-gray-400
                   focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2
                   disabled:opacity-50 disabled:cursor-not-allowed
                   min-h-[44px] transition-all duration-200
                   text-gray-700 font-medium ${className}`}
        aria-label={buttonText}
      >
        <GoogleIcon />
        <span>{loading ? loadingText : buttonText}</span>
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Divider component for separating OAuth options from form
 */
export function AuthDivider(): ReactElement {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-gray-200" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-3 text-muted-foreground">Or continue with</span>
      </div>
    </div>
  )
}
