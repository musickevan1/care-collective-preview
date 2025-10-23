'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
    setLoading(true)
    setError('')

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
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-primary hover:text-primary/80 text-sm">← Back to Home</Link>
          <div className="flex justify-center mt-4 mb-4">
            <Image
              src="/logo.png"
              alt="Care Collective Logo"
              width={256}
              height={256}
              className="rounded-lg"
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to your Care Collective account</p>
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
  )
}