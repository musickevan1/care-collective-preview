'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [applicationReason, setApplicationReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          location: location,
          application_reason: applicationReason,
        },
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      
      // Send notification email about new application
      try {
        await fetch('/api/notify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'new_application',
            userId: 'pending' // We don't have the user ID yet, but the API will handle it
          })
        })
      } catch (notifyError) {
        console.warn('Failed to send new application notification:', notifyError)
        // Don't fail the signup process if email fails
      }
      
      // Redirect to waitlist after showing success message
      setTimeout(() => {
        window.location.href = '/waitlist'
      }, 5000)
    }
    
    setLoading(false)
  }

  if (success) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-foreground">Application Submitted!</CardTitle>
              <CardDescription>
                Thank you for your interest in joining Care Collective
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-muted-foreground mb-4">
                We&apos;ve sent a confirmation email to <strong>{email}</strong>. 
                Please click the link in the email to verify your account.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Verify your email by clicking the confirmation link</li>
                  <li>Our team will review your application</li>
                  <li>You&apos;ll receive an email once your application is approved</li>
                  <li>Start connecting with your community!</li>
                </ol>
              </div>
              <p className="text-xs text-muted-foreground">
                Applications are typically reviewed within 1-2 business days.
              </p>
              <div className="text-xs text-muted-foreground bg-gray-50 rounded p-2">
                You&apos;ll be redirected to your application status page in 5 seconds...
              </div>
              <Link href="/waitlist">
                <Button className="w-full">
                  Check Application Status
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Join Care Collective</h1>
          <p className="text-muted-foreground">Create your account to start helping your community</p>
        </div>

        <Card>
          <CardHeader className="space-y-4">
            <CardTitle className="text-2xl text-center">Sign Up</CardTitle>
            <CardDescription className="text-center">
              Fill in your details to create your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
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
                />
              </div>

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
                  placeholder="Create a strong password"
                  required
                  disabled={loading}
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Password must be at least 8 characters long
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium text-foreground">
                  Location (Optional)
                </label>
                <Input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Springfield, MO"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Helps connect you with nearby community members
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="applicationReason" className="text-sm font-medium text-foreground">
                  Why do you want to join Care Collective? (Optional)
                </label>
                <Textarea
                  id="applicationReason"
                  value={applicationReason}
                  onChange={(e) => setApplicationReason(e.target.value)}
                  placeholder="Tell us briefly why you're interested in joining our mutual aid community..."
                  disabled={loading}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  This helps us understand your interest in community mutual aid
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}