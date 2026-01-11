'use client'

import { useState, useEffect, type ReactElement } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PublicPageLayout } from '@/components/layout/PublicPageLayout'
import { createClient } from '@/lib/supabase/client'

export default function CompleteProfilePage(): ReactElement {
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [applicationReason, setApplicationReason] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState('')

  const router = useRouter()
  const supabase = createClient()

  // Fetch user data on mount
  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          // Not logged in, redirect to login
          router.replace('/login')
          return
        }

        // Pre-fill name from Google profile
        const googleName = user.user_metadata?.full_name || user.user_metadata?.name
        if (googleName) {
          setName(googleName)
        }

        setUserEmail(user.email || '')
      } catch (err) {
        console.error('Error loading user:', err)
        setError('Failed to load user data. Please try again.')
      } finally {
        setInitialLoading(false)
      }
    }

    loadUser()
  }, [supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!termsAccepted) {
      setError('You must accept the Community Standards and Terms of Service.')
      return
    }

    if (applicationReason.trim().length < 10) {
      setError('Please provide a bit more detail about why you want to join (at least 10 characters).')
      return
    }

    setLoading(true)
    setError('')

    try {
      const payload = {
        name: name.trim(),
        location: location.trim(),
        application_reason: applicationReason.trim(),
        terms_accepted: true,
      }

      // Debug logging for troubleshooting
      console.log('[CompleteProfile] Submitting:', {
        nameLength: payload.name.length,
        locationLength: payload.location.length,
        reasonLength: payload.application_reason.length,
      })

      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      // Log full response for debugging
      console.log('[CompleteProfile] Response:', {
        status: response.status,
        ok: response.ok,
        data,
      })

      if (!response.ok) {
        // Show detailed validation errors if available
        let errorMessage = data.message || 'Failed to complete profile. Please try again.'
        if (data.errors && Array.isArray(data.errors)) {
          const fieldErrors = data.errors.map((e: { path?: string[]; message?: string }) =>
            `${e.path?.join('.') || 'Field'}: ${e.message}`
          ).join(', ')
          errorMessage = `${errorMessage} (${fieldErrors})`
        }
        console.error('[CompleteProfile] Error:', errorMessage)
        setError(errorMessage)
        return
      }

      // Success - redirect to waitlist
      router.replace('/waitlist')
    } catch (err) {
      console.error('Profile completion error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <PublicPageLayout showFooter={false}>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </PublicPageLayout>
    )
  }

  return (
    <PublicPageLayout showFooter={true}>
      <div className="container mx-auto py-8 flex items-center justify-center p-6 min-h-screen">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Complete Your Profile</h1>
            <p className="text-base md:text-lg text-muted-foreground">
              Just a few more details to join CARE Collective
            </p>
          </div>

          <Card>
            <CardHeader className="space-y-4">
              <CardTitle className="text-2xl text-center">Almost There!</CardTitle>
              <CardDescription className="text-center">
                {userEmail && (
                  <span className="block mb-2">
                    Signed in as <strong>{userEmail}</strong>
                  </span>
                )}
                Please provide a few more details so we can process your application.
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
                  <label htmlFor="name" className="text-sm font-medium text-foreground">
                    Full Name
                  </label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    disabled={loading}
                    aria-describedby="name-hint"
                  />
                  <p id="name-hint" className="text-xs text-muted-foreground">
                    You can update this if needed
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="location" className="text-sm font-medium text-foreground">
                    Location <span className="text-primary">*</span>
                  </label>
                  <Input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Springfield, MO"
                    required
                    disabled={loading}
                    aria-describedby="location-hint"
                  />
                  <p id="location-hint" className="text-xs text-muted-foreground">
                    Helps connect you with nearby community members
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="applicationReason" className="text-sm font-medium text-foreground">
                    Why do you want to join CARE Collective? <span className="text-primary">*</span>
                  </label>
                  <Textarea
                    id="applicationReason"
                    value={applicationReason}
                    onChange={(e) => setApplicationReason(e.target.value)}
                    placeholder="Tell us briefly why you'd like to join our community (minimum 10 characters)"
                    required
                    minLength={10}
                    disabled={loading}
                    rows={3}
                    aria-describedby="reason-hint"
                  />
                  <p id="reason-hint" className="text-xs text-muted-foreground">
                    This helps us understand what brings you here.{' '}
                    <span className={applicationReason.length < 10 ? 'text-primary font-medium' : 'text-sage'}>
                      ({applicationReason.length}/10 min)
                    </span>
                  </p>
                </div>

                {/* Community Standards and Terms Acceptance */}
                <div className="space-y-3 border border-sage/20 bg-sage/5 rounded-lg p-4">
                  <label htmlFor="termsAccepted" className="flex items-start gap-3 cursor-pointer">
                    <input
                      id="termsAccepted"
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      disabled={loading}
                      className="w-5 h-5 sm:w-4 sm:h-4 text-primary accent-sage flex-shrink-0 mt-0.5"
                      required
                      aria-describedby="termsAccepted-description"
                    />
                    <div className="text-sm" id="termsAccepted-description">
                      <span className="text-foreground">
                        I agree to follow the CARE Collective&apos;s{' '}
                        <Link
                          href="/about#community-standards"
                          target="_blank"
                          className="text-primary hover:underline font-medium"
                        >
                          Community Standards
                        </Link>
                        {' '}and{' '}
                        <Link
                          href="/terms"
                          target="_blank"
                          className="text-primary hover:underline font-medium"
                        >
                          Terms of Service
                        </Link>
                        , use the site responsibly, and respect the privacy and safety of all members.
                      </span>
                    </div>
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading || !termsAccepted || applicationReason.trim().length < 10}
                >
                  {loading ? 'Submitting...' : 'Complete Application'}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Want to use a different account? </span>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut()
                    router.replace('/signup')
                  }}
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Sign out
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicPageLayout>
  )
}
