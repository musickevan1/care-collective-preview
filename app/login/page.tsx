'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Request deduplication for login
let loginPromise: Promise<void> | null = null

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Check for error messages from redirects
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const errorParam = urlParams.get('error')

    if (errorParam === 'session_error') {
      setError('Your session expired. Please log in again.')
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    // Prevent double-click: if login is already in progress, return immediately
    if (loginPromise) {
      console.debug('Login already in progress, ignoring duplicate request')
      return
    }

    setLoading(true)
    setError('')

    loginPromise = (async () => {
      try {
        // Call rate-limited login API endpoint
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        })

      const data = await response.json()

      // Handle rate limiting
      if (response.status === 429) {
        setError(data.message || 'Too many login attempts. Please try again later.')
        return
      }

      // Handle validation or authentication errors
      if (!response.ok) {
        setError(data.message || 'Login failed. Please check your credentials.')
        return
      }

      // Handle successful authentication with different verification statuses
      if (data.success && data.data) {
        const { status, redirect, message } = data.data

        console.log('Login successful:', { status, redirect })

        // Handle different verification statuses
        if (status === 'rejected') {
          setError(message || 'Access denied: Account has been rejected')
          setTimeout(() => {
            window.location.replace(redirect || '/access-denied?reason=rejected')
          }, 1000)
          return
        }

        if (status === 'pending') {
          window.location.replace(redirect || '/waitlist')
          return
        }

        if (status === 'approved') {
          // Check for redirect parameter from URL
          const urlParams = new URLSearchParams(window.location.search)
          const redirectTo = urlParams.get('redirectTo')
          const destination = redirectTo || redirect || '/dashboard'

          // Add small delay to ensure auth session is properly set
          setTimeout(() => {
            window.location.replace(destination)
          }, 100)
          return
        }

        // Unknown status: redirect to waitlist for safety
        window.location.replace(redirect || '/waitlist')
      }
      } catch (err) {
        console.error('Login error:', err)
        setError('An unexpected error occurred. Please try again.')
      } finally {
        // Always reset loading state after a brief delay to ensure user feedback
        setTimeout(() => {
          setLoading(false)
        }, 500)
      }
    })()

    try {
      await loginPromise
    } finally {
      // Clear the promise to allow future login attempts
      loginPromise = null
    }
  }

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-navy text-white shadow-lg">
        <nav className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2 sm:gap-3">
              <Image
                src="/logo-textless.png"
                alt="CARE Collective Logo"
                width={56}
                height={56}
                className="rounded w-12 h-12 sm:w-14 sm:h-14"
                priority
              />
              <span className="text-lg sm:text-xl font-bold">CARE Collective</span>
            </Link>
            <Link href="/" className="text-white hover:text-sage-light transition-colors py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy">
              ← Back to Home
            </Link>
          </div>
        </nav>
      </header>

      <main id="main-content" className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 pt-24">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">Sign in to your CARE Collective account</p>
          </div>

        <Card>
          <CardHeader className="space-y-4">
            <CardTitle className="text-2xl text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                  autoComplete="email"
                  inputMode="email"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don&apos;t have an account? </span>
              <Link href="/signup" className="text-primary hover:text-primary/80 font-medium">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
    </>
  )
}