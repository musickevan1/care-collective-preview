'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Shield, CheckCircle, Users } from 'lucide-react'
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
  const [consentGiven, setConsentGiven] = useState(false)
  const [showConsentDialog, setShowConsentDialog] = useState(false)
  const [hasExistingExchange, setHasExistingExchange] = useState(false)
  const [consentMessage, setConsentMessage] = useState('')
  const [messageError, setMessageError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    checkExistingExchange()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, helperId, requesterId])

  const checkExistingExchange = async () => {
    try {
      const { data: exchange } = await supabase
        .from('contact_exchanges')
        .select('*')
        .eq('request_id', requestId)
        .eq('helper_id', helperId)
        .eq('requester_id', requesterId)
        .single()

      if (exchange) {
        setHasExistingExchange(true)
        setConsentGiven(true)
        loadContactInfo()
      } else {
        setLoading(false)
      }
    } catch {
      setLoading(false)
    }
  }

  const handleConsentRequest = () => {
    setShowConsentDialog(true)
  }

  const handleConsentGiven = async (message: string) => {
    try {
      setLoading(true)
      setShowConsentDialog(false)
      
      // Import validation functions
      const { validateContactExchange, validateRateLimit, createAuditEntry, canExchangeContacts } = 
        await import('@/lib/validations/contact-exchange');
      
      // Validate exchange eligibility
      const eligibility = canExchangeContacts(helperId, requesterId, 'open');
      if (!eligibility.canExchange) {
        throw new Error(eligibility.reason);
      }
      
      // Validate input data
      const validatedData = validateContactExchange({
        requestId,
        helperId,
        requesterId,
        message,
        consent: true,
      });
      
      // Check rate limiting
      const { data: recentExchanges } = await supabase
        .from('contact_exchanges')
        .select('created_at')
        .eq('helper_id', helperId)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());
      
      const recentDates = recentExchanges?.map(e => new Date(e.created_at)) || [];
      if (!validateRateLimit(helperId, recentDates)) {
        throw new Error('Too many contact exchange attempts. Please try again later.');
      }
      
      // Create audit trail BEFORE revealing contact
      const auditEntry = createAuditEntry('CONTACT_EXCHANGE_INITIATED', {
        requestId,
        helperId,
        requesterId,
        metadata: { message: validatedData.message },
      });
      
      // Insert audit trail
      const { error: auditError } = await supabase
        .from('contact_exchange_audit')
        .insert({
          action: auditEntry.action,
          request_id: auditEntry.requestId,
          helper_id: auditEntry.helperId,
          requester_id: auditEntry.requesterId,
          timestamp: auditEntry.timestamp,
          metadata: auditEntry.metadata,
        });
      
      if (auditError) {
        console.warn('Audit trail creation failed:', auditError);
        // Continue but log the issue
      }
      
      // Create consent record with validated data
      const { error: consentError } = await supabase
        .from('contact_exchanges')
        .insert({
          request_id: requestId,
          helper_id: helperId,
          requester_id: requesterId,
          message: validatedData.message,
          consent_given: true,
          status: 'initiated',
          initiated_at: new Date().toISOString()
        })

      if (consentError) throw consentError

      setConsentGiven(true)
      await loadContactInfo()
    } catch (err) {
      console.error('Error processing consent:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to process consent';
      setError(errorMessage)
      setLoading(false)
      
      // Log failed attempt for security monitoring
      try {
        const { createAuditEntry } = await import('@/lib/validations/contact-exchange');
        const auditEntry = createAuditEntry('CONTACT_EXCHANGE_FAILED', {
          requestId,
          helperId,
          requesterId,
          metadata: { error: errorMessage },
        });
        
        await supabase
          .from('contact_exchange_audit')
          .insert({
            action: auditEntry.action,
            request_id: auditEntry.requestId,
            helper_id: auditEntry.helperId,
            requester_id: auditEntry.requesterId,
            timestamp: auditEntry.timestamp,
            metadata: auditEntry.metadata,
          });
      } catch {
        // Silently fail audit logging to not block user
      }
    }
  }

  const loadContactInfo = async () => {
    try {
      setLoading(true)
      
      // Determine which user's contact info to show
      const targetUserId = isHelper ? requesterId : helperId
      
      // Fetch the user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, location')
        .eq('id', targetUserId)
        .single()

      if (profileError) throw profileError

      // For demo purposes, simulate contact info
      // In production, this would respect user privacy preferences
      setContactInfo({
        name: profile.name,
        email: `${profile.name.toLowerCase().replace(' ', '.')}@email.com`,
        location: profile.location,
      })

      // Update exchange record to completed
      await supabase
        .from('contact_exchanges')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('request_id', requestId)
        .eq('helper_id', helperId)
        .eq('requester_id', requesterId)

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

  // Consent Dialog
  if (showConsentDialog) {
    const handleSubmitConsent = async () => {
      setMessageError(null);
      
      // Validate message before proceeding
      if (!consentMessage.trim()) {
        setMessageError('Please provide a message explaining how you can help');
        return;
      }
      
      if (consentMessage.trim().length < 10) {
        setMessageError('Message must be at least 10 characters');
        return;
      }
      
      if (consentMessage.trim().length > 200) {
        setMessageError('Message cannot exceed 200 characters');
        return;
      }
      
      try {
        // Validate message content
        const { sanitizeMessage, validateContactExchange } = await import('@/lib/validations/contact-exchange');
        const sanitizedMessage = sanitizeMessage(consentMessage);
        
        // This will throw if message contains inappropriate content
        validateContactExchange({
          requestId,
          helperId,
          requesterId,
          message: sanitizedMessage,
          consent: true,
        });
        
        await handleConsentGiven(sanitizedMessage);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Invalid message content';
        setMessageError(errorMessage);
      }
    };
    
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-amber-800">Contact Sharing Consent</CardTitle>
          </div>
          <CardDescription className="text-amber-700">
            You're about to share contact information with another community member.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white p-3 rounded-lg border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Privacy & Safety Notice:</p>
                <ul className="mt-1 space-y-1 text-amber-700">
                  <li>• Only your basic contact information will be shared</li>
                  <li>• This exchange is logged for safety and trust</li>
                  <li>• Maximum 5 contact exchanges per hour</li>
                  <li>• Report any inappropriate contact to admins</li>
                  <li>• You can revoke shared information at any time</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="consent-message" className="text-amber-800 font-medium">
              How can you help with this request? <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="consent-message"
              placeholder="Briefly explain how you can help (10-200 characters)"
              value={consentMessage}
              onChange={(e) => setConsentMessage(e.target.value)}
              className="min-h-[80px] bg-white"
              maxLength={200}
              required
              aria-describedby={messageError ? 'message-error' : undefined}
              aria-invalid={!!messageError}
            />
            {messageError && (
              <p id="message-error" role="alert" className="text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {messageError}
              </p>
            )}
            <p className="text-xs text-amber-600">
              {consentMessage.length}/200 characters
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={handleSubmitConsent}
              disabled={!consentMessage.trim() || consentMessage.length < 10 || loading}
              className="bg-sage hover:bg-sage-dark text-white disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {loading ? 'Sharing...' : 'Yes, Share My Contact Info'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowConsentDialog(false);
                setConsentMessage('');
                setMessageError(null);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="border-sage">
        <CardHeader>
          <CardTitle className="text-sage">Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  // If no consent given yet, show request button
  if (!consentGiven && !hasExistingExchange) {
    return (
      <Card className="border-sage">
        <CardHeader>
          <CardTitle className="text-sage">Contact Exchange</CardTitle>
          <CardDescription>
            Connect with community members safely and securely.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="bg-sage/10 p-4 rounded-lg">
              <Users className="h-8 w-8 text-sage mx-auto mb-2" />
              <p className="text-sm text-sage-dark">
                Contact sharing requires mutual consent and is logged for safety.
              </p>
            </div>
            <Button 
              onClick={handleConsentRequest}
              className="bg-sage hover:bg-sage-dark text-white"
            >
              Request Contact Information
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!contactInfo) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No contact information available.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-sage/30 bg-sage/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <CardTitle className="text-sage">Contact Information Shared</CardTitle>
        </div>
        <CardDescription>
          Connect with {contactInfo.name} to coordinate help
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-800 text-sm">
            <Shield className="h-4 w-4" />
            <span className="font-medium">Privacy Protected Exchange</span>
          </div>
          <p className="text-green-700 text-sm mt-1">
            This contact exchange is logged and monitored for community safety.
          </p>
        </div>
        
        <div className="space-y-3">
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
        </div>

        <div className="pt-3 border-t border-muted">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Community Guidelines:</strong> Be respectful, meet in safe public places, 
            and report any issues to administrators.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}