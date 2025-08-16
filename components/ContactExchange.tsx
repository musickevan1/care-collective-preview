'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

interface ContactExchangeProps {
  requestId: string
  helperId: string
  requesterId: string
  isHelper: boolean
  isRequester: boolean
}

interface ContactInfo {
  name: string
  email?: string
  phone?: string
  location?: string
  preferences?: {
    show_email: boolean
    show_phone: boolean
    preferred_contact: string
  }
}

export function ContactExchange({ 
  requestId, 
  helperId, 
  requesterId,
  isHelper,
  isRequester 
}: ContactExchangeProps) {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadContactInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, helperId, requesterId])

  const loadContactInfo = async () => {
    try {
      setLoading(true)
      
      // Determine which user's contact info to show
      const targetUserId = isHelper ? requesterId : helperId
      
      // Fetch the user's profile and contact preferences
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, location, phone, contact_preferences')
        .eq('id', targetUserId)
        .single()

      if (profileError) throw profileError

      // Get the user's email from auth
      const { data: { users } } = await supabase.auth.admin.listUsers()
      const user = users?.find(u => u.id === targetUserId)
      
      const preferences = profile.contact_preferences || {
        show_email: true,
        show_phone: false,
        preferred_contact: 'email'
      }

      setContactInfo({
        name: profile.name,
        email: preferences.show_email ? user?.email : undefined,
        phone: preferences.show_phone ? profile.phone : undefined,
        location: profile.location,
        preferences
      })

      // Record that contact was exchanged
      await supabase
        .from('contact_exchanges')
        .upsert({
          request_id: requestId,
          helper_id: helperId,
          requester_id: requesterId,
          exchange_type: 'display',
          contact_shared: {
            email_shared: preferences.show_email,
            phone_shared: preferences.show_phone,
            timestamp: new Date().toISOString()
          }
        })

    } catch (err) {
      console.error('Error loading contact info:', err)
      setError('Failed to load contact information')
    } finally {
      setLoading(false)
    }
  }

  if (!isHelper && !isRequester) {
    return null // Don't show contact info to non-participants
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            Loading contact information...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !contactInfo) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            {error || 'Contact information not available'}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-sage/30 bg-sage/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {isHelper ? 'Requester Contact Info' : 'Helper Contact Info'}
          </CardTitle>
          <Badge className="bg-sage text-white">
            Contact Shared
          </Badge>
        </div>
        <CardDescription>
          Use this information to coordinate assistance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-1">Name</div>
          <div className="font-medium">{contactInfo.name}</div>
        </div>

        {contactInfo.email && (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Email</div>
            <a 
              href={`mailto:${contactInfo.email}`}
              className="font-medium text-sage hover:text-sage-dark underline"
            >
              {contactInfo.email}
            </a>
          </div>
        )}

        {contactInfo.phone && (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Phone</div>
            <a 
              href={`tel:${contactInfo.phone}`}
              className="font-medium text-sage hover:text-sage-dark underline"
            >
              {contactInfo.phone}
            </a>
          </div>
        )}

        {contactInfo.location && (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Location</div>
            <div className="font-medium">{contactInfo.location}</div>
          </div>
        )}

        {contactInfo.preferences?.preferred_contact && (
          <div className="pt-2 border-t">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Preferred contact method:</span>{' '}
              {contactInfo.preferences.preferred_contact}
            </div>
          </div>
        )}

        <div className="pt-4">
          <div className="bg-dusty-rose/10 border border-dusty-rose/30 rounded-lg p-3">
            <p className="text-sm text-foreground">
              <strong>Remember:</strong> Please be respectful when reaching out. 
              Coordinate a time that works for both parties and maintain clear communication 
              throughout the assistance process.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}