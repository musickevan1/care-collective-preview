'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { ReactElement } from 'react'

interface UserProfile {
  id: string
  name: string
  email_confirmed: boolean
  verification_status: 'pending' | 'approved' | 'rejected'
}

export default function VerifyEmailPage(): ReactElement {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function getProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setError('Please log in to verify your email.')
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, email_confirmed, verification_status')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching profile:', error)
          setError('Unable to load your profile.')
        } else {
          setProfile(data)
          
          // If email is already confirmed, redirect based on verification status
          if (data.email_confirmed) {
            if (data.verification_status === 'approved') {
              window.location.href = '/dashboard'
            } else {
              window.location.href = '/waitlist'
            }
          }
        }
      } catch (err) {
        console.error('Error:', err)
        setError('An unexpected error occurred.')
      } finally {
        setLoading(false)
      }
    }

    getProfile()
  }, [supabase])

  const handleResendConfirmation = async () => {
    setResending(true)
    setResendSuccess(false)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user?.email) {
        setError('Unable to resend confirmation email. Please try logging in again.')
        return
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email
      })

      if (error) {
        setError('Failed to resend confirmation email. Please try again later.')
      } else {
        setResendSuccess(true)
      }
    } catch (err) {
      setError('An error occurred while resending the confirmation email.')
    } finally {
      setResending(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </main>
    )
  }

  if (error && !profile) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <div className="space-y-2">
              <Link href="/login">
                <Button className="w-full">Sign In</Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">Back to Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <nav className="bg-secondary text-secondary-foreground border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <Image 
                src="/logo.png" 
                alt="Care Collective Logo" 
                width={32} 
                height={32}
                className="rounded"
              />
              <span className="text-xl font-bold">CARE Collective</span>
            </Link>
            <div className="flex items-center gap-4">
              <form action="/api/auth/logout" method="post">
                <Button variant="ghost" size="sm" type="submit">
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Mail className="w-16 h-16 text-primary" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl">Email Verification Required</CardTitle>
            <CardDescription>
              Please verify your email to access all platform features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Welcome to CARE Collective, {profile?.name}!</h3>
              <p className="text-blue-800 text-sm mb-3">
                Your application has been approved! To access all features of the platform including 
                creating help requests and messaging other members, please verify your email address.
              </p>
            </div>

            {resendSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm">
                  ✅ Confirmation email sent! Please check your inbox and spam folder.
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">How to verify your email:</h3>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Check your email inbox for a message from CARE Collective</li>
                <li>Click the verification link in the email</li>
                <li>You&apos;ll be automatically redirected back to the platform</li>
                <li>Start connecting with your community!</li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-foreground mb-2">Didn&apos;t receive the email?</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Check your spam folder, or click the button below to resend the verification email.
              </p>
              <Button 
                onClick={handleResendConfirmation}
                disabled={resending}
                variant="outline"
                className="w-full"
              >
                {resending ? 'Sending...' : 'Resend Verification Email'}
              </Button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-2">Need help?</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Having trouble verifying your email? Contact our support team:
              </p>
              <p className="text-sm">
                <a href="mailto:evanmusick.dev@gmail.com" className="text-primary hover:underline">
                  evanmusick.dev@gmail.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}