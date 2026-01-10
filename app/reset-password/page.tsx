'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PublicPageLayout } from '@/components/layout/PublicPageLayout'
import { Lock, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [hasSession, setHasSession] = useState(false)

  // Check if user has a valid session (from clicking the reset link)
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      setHasSession(!!session)
      setSessionChecked(true)
    }
    checkSession()
  }, [])

  const validatePassword = (): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match'
    }
    // Basic password strength check
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    if (!hasUppercase || !hasLowercase || !hasNumber) {
      return 'Password must include uppercase, lowercase, and a number'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate password
    const validationError = validatePassword()
    if (validationError) {
      setError(validationError)
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()

      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        console.error('[Reset Password] Update error:', updateError)
        setError(updateError.message || 'Failed to reset password. Please try again.')
        return
      }

      // Success
      setSuccess(true)

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login?message=password_reset')
      }, 3000)

    } catch (err) {
      console.error('Password reset error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Loading state while checking session
  if (!sessionChecked) {
    return (
      <PublicPageLayout showFooter={true}>
        <main id="main-content" className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Verifying your reset link...</p>
          </div>
        </main>
      </PublicPageLayout>
    )
  }

  // No session - link expired or invalid
  if (!hasSession) {
    return (
      <PublicPageLayout showFooter={true}>
        <main id="main-content" className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md">
            <Card>
              <CardHeader className="space-y-4 text-center">
                <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Lock className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle className="text-2xl">Link Expired</CardTitle>
                <CardDescription>
                  This password reset link has expired or is invalid.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Password reset links expire after 1 hour for security reasons.
                </p>
                <Link href="/forgot-password">
                  <Button className="w-full">
                    Request a New Reset Link
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
      </PublicPageLayout>
    )
  }

  // Success state
  if (success) {
    return (
      <PublicPageLayout showFooter={true}>
        <main id="main-content" className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md">
            <Card>
              <CardHeader className="space-y-4 text-center">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Password Reset!</CardTitle>
                <CardDescription>
                  Your password has been successfully updated.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">
                  Redirecting you to login...
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </PublicPageLayout>
    )
  }

  return (
    <PublicPageLayout showFooter={true}>
      <main id="main-content" className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Set New Password</h1>
            <p className="text-muted-foreground">
              Choose a strong password for your account
            </p>
          </div>

          <Card>
            <CardHeader className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl text-center">Create New Password</CardTitle>
              <CardDescription className="text-center">
                Must be at least 8 characters with uppercase, lowercase, and a number
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div role="alert" className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      disabled={loading}
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                    Confirm Password
                  </label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>

                {/* Password strength indicator */}
                {password && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Password requirements:</p>
                    <ul className="text-xs space-y-1">
                      <li className={password.length >= 8 ? 'text-green-600' : 'text-muted-foreground'}>
                        {password.length >= 8 ? '✓' : '○'} At least 8 characters
                      </li>
                      <li className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-muted-foreground'}>
                        {/[A-Z]/.test(password) ? '✓' : '○'} One uppercase letter
                      </li>
                      <li className={/[a-z]/.test(password) ? 'text-green-600' : 'text-muted-foreground'}>
                        {/[a-z]/.test(password) ? '✓' : '○'} One lowercase letter
                      </li>
                      <li className={/[0-9]/.test(password) ? 'text-green-600' : 'text-muted-foreground'}>
                        {/[0-9]/.test(password) ? '✓' : '○'} One number
                      </li>
                      <li className={password === confirmPassword && confirmPassword ? 'text-green-600' : 'text-muted-foreground'}>
                        {password === confirmPassword && confirmPassword ? '✓' : '○'} Passwords match
                      </li>
                    </ul>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading || !password || !confirmPassword}
                >
                  {loading ? 'Resetting Password...' : 'Reset Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </PublicPageLayout>
  )
}
