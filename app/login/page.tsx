'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

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
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return
      }

      if (authData?.user) {
        // SECURITY: Check verification status BEFORE redirecting
        // Fetch user profile to determine verification status
        const { data: profile } = await supabase
          .from('profiles')
          .select('verification_status')
          .eq('id', authData.user.id)
          .single()

        console.log('Login successful - verification status:', profile?.verification_status)

        // Route based on verification status
        if (profile?.verification_status === 'rejected') {
          // Rejected users: sign out immediately and show access denied
          await supabase.auth.signOut()
          window.location.replace('/access-denied?reason=rejected')
          return
        } else if (profile?.verification_status === 'pending') {
          // Pending users: redirect to waitlist
          window.location.replace('/waitlist')
          return
        } else if (profile?.verification_status === 'approved') {
          // Approved users: proceed to dashboard or requested page
          const urlParams = new URLSearchParams(window.location.search)
          const redirectTo = urlParams.get('redirectTo')
          const destination = redirectTo || '/dashboard'

          console.log('Approved user, redirecting to:', destination)

          // Add small delay to ensure auth session is properly set
          setTimeout(() => {
            window.location.replace(destination)
          }, 100)
        } else {
          // Unknown status: redirect to waitlist for safety
          setError('Account verification pending. Please wait for approval.')
          window.location.replace('/waitlist')
        }
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
              width={64} 
              height={64}
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