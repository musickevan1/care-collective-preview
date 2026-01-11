'use client'

import { useState, useEffect, ReactElement } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, Mail, MapPin, Phone, Shield, ExternalLink, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { Database } from '@/lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function AccountSettingsPage(): ReactElement {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          setError('Please log in to view account settings')
          return
        }

        setEmail(user.email || null)

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          throw profileError
        }

        setProfile(profileData)
      } catch (err) {
        setError('Failed to load account information')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-sage" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
        {error}
      </div>
    )
  }

  const getVerificationBadge = (status: string | null | undefined) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Needs Attention</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Account Settings</h2>
        <p className="text-muted-foreground">
          View and manage your account information
        </p>
      </div>

      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Your basic profile details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{profile?.name || 'Not set'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Email</p>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{email || 'Not available'}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Location</p>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{profile?.location || 'Not set'}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Phone</p>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{profile?.phone || 'Not set'}</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Link href="/profile">
              <Button variant="outline" className="min-h-[44px]">
                <ExternalLink className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Status
          </CardTitle>
          <CardDescription>
            Your membership and verification status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Verification Status</p>
              <p className="text-sm text-muted-foreground">
                Your account verification with CARE Collective
              </p>
            </div>
            {getVerificationBadge(profile?.verification_status)}
          </div>

          {profile?.is_admin && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="font-medium">Admin Access</p>
                <p className="text-sm text-muted-foreground">
                  You have administrative privileges
                </p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">Admin</Badge>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="font-medium">Member Since</p>
              <p className="text-sm text-muted-foreground">
                When you joined CARE Collective
              </p>
            </div>
            <p className="text-sm">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Unknown'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>
            Helpful resources and actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link href="/help" className="block">
            <Button variant="ghost" className="w-full justify-start min-h-[44px]">
              Help Center
            </Button>
          </Link>
          <Link href="/privacy-policy" className="block">
            <Button variant="ghost" className="w-full justify-start min-h-[44px]">
              Privacy Policy
            </Button>
          </Link>
          <Link href="/terms" className="block">
            <Button variant="ghost" className="w-full justify-start min-h-[44px]">
              Terms of Service
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
