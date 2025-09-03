'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import Image from 'next/image'
import { ReactElement } from 'react'

interface UserProfile {
  id: string
  name: string
  location: string | null
  verification_status: 'pending' | 'approved' | 'rejected'
  application_reason: string | null
  applied_at: string | null
  rejection_reason: string | null
}

export default function WaitlistPage(): ReactElement {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isReapplying, setIsReapplying] = useState(false)
  const [reapplicationData, setReapplicationData] = useState({
    applicationReason: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function getProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setError('Please log in to view your application status.')
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, location, verification_status, application_reason, applied_at, rejection_reason')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching profile:', error)
          setError('Unable to load your application status.')
        } else {
          setProfile(data)
          setReapplicationData({
            applicationReason: data.application_reason || ''
          })
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

  const handleReapplication = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSubmitting(true)
    setError('')

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          verification_status: 'pending',
          application_reason: reapplicationData.applicationReason,
          applied_at: new Date().toISOString(),
          rejection_reason: null
        })
        .eq('id', profile.id)

      if (error) {
        setError('Failed to submit reapplication. Please try again.')
      } else {
        // Refresh profile data
        const { data } = await supabase
          .from('profiles')
          .select('id, name, location, verification_status, application_reason, applied_at, rejection_reason')
          .eq('id', profile.id)
          .single()
        
        if (data) {
          setProfile(data)
        }
        setIsReapplying(false)
      }
    } catch (err) {
      setError('An unexpected error occurred during reapplication.')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Application Declined</Badge>
      default:
        return <Badge variant="secondary">Unknown Status</Badge>
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your application status...</p>
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

  // If user is approved, redirect them (this shouldn't normally happen due to middleware)
  if (profile?.verification_status === 'approved') {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-primary">Welcome to Care Collective!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-muted-foreground">Your application has been approved!</p>
            <Link href="/dashboard">
              <Button className="w-full">Go to Dashboard</Button>
            </Link>
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
        {/* Status Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Application Status</CardTitle>
                <CardDescription>
                  Welcome {profile?.name}, here's your current status
                </CardDescription>
              </div>
              {profile && getStatusBadge(profile.verification_status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {profile?.verification_status === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-yellow-600 text-xl">⏳</div>
                  <div>
                    <h3 className="font-semibold text-yellow-900 mb-1">Application Under Review</h3>
                    <p className="text-yellow-800 text-sm mb-2">
                      Your application is currently being reviewed by our team. We'll notify you once a decision has been made.
                    </p>
                    <p className="text-yellow-700 text-xs">
                      Applied on: {formatDate(profile.applied_at)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {profile?.verification_status === 'rejected' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-red-600 text-xl">❌</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900 mb-1">Application Declined</h3>
                    <p className="text-red-800 text-sm mb-2">
                      Unfortunately, your application was not approved at this time.
                    </p>
                    {profile.rejection_reason && (
                      <div className="bg-red-100 rounded p-3 mb-3">
                        <p className="text-red-800 text-sm font-medium mb-1">Reason:</p>
                        <p className="text-red-700 text-sm">{profile.rejection_reason}</p>
                      </div>
                    )}
                    <p className="text-red-700 text-sm mb-3">
                      You can reapply by updating your information below and explaining how you've addressed any concerns.
                    </p>
                    {!isReapplying && (
                      <Button 
                        onClick={() => setIsReapplying(true)}
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        Reapply
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Application Details */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-foreground">{profile?.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Location</label>
                <p className="text-foreground">{profile?.location || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Reason for joining</label>
                <p className="text-foreground">{profile?.application_reason || 'Not provided'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reapplication Form */}
        {isReapplying && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Reapply for Access</CardTitle>
              <CardDescription>
                Please provide updated information for your reapplication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleReapplication} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                    {error}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label htmlFor="applicationReason" className="text-sm font-medium text-foreground">
                    Brief reason for joining Care Collective *
                  </label>
                  <Textarea
                    id="applicationReason"
                    value={reapplicationData.applicationReason}
                    onChange={(e) => setReapplicationData({
                      ...reapplicationData,
                      applicationReason: e.target.value
                    })}
                    placeholder="Please explain why you'd like to join our community and how you've addressed any previous concerns..."
                    required
                    disabled={submitting}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Please explain how you've addressed any concerns from your previous application.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={submitting || !reapplicationData.applicationReason.trim()}
                  >
                    {submitting ? 'Submitting...' : 'Submit Reapplication'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsReapplying(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Help Card */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>
              If you have questions about your application or the approval process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <p>
                <strong>What happens next?</strong><br/>
                Our team reviews applications to ensure Care Collective remains a safe, 
                trusted community for mutual aid in Southwest Missouri.
              </p>
              <p>
                <strong>Questions or concerns?</strong><br/>
                Contact us at{' '}
                <a href="mailto:evanmusick.dev@gmail.com" className="text-primary hover:underline">
                  evanmusick.dev@gmail.com
                </a>
              </p>
              <p>
                <strong>Application timeline:</strong><br/>
                Most applications are reviewed within 1-2 business days.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}