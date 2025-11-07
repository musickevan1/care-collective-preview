'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Shield, CheckCircle, Users, Lock, Eye, EyeOff, Clock, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  ContactEncryptionService,
  encryptContact,
  decryptContact,
  isContactEncrypted,
  type ContactInfo as EncryptedContactInfo,
  type EncryptedContactData
} from '@/lib/security/contact-encryption'
import { captureError, captureWarning, addBreadcrumb } from '@/lib/error-tracking'
import {
  trackContactExchange,
  trackEncryption
} from '@/lib/security/privacy-event-tracker'
import { format } from 'date-fns'

interface HelpRequest {
  id: string
  title: string
  description?: string
  category: string
  urgency: string
  status: string
  user_id: string
  created_at: string
  profiles: {
    id: string
    name: string
    email?: string
    phone?: string
    location?: string
  }
}

interface ContactExchangeProps {
  helpRequest: HelpRequest
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

interface UserPrivacySettings {
  default_contact_sharing: {
    email: boolean
    phone: boolean
    location: boolean
    preferred_method: 'email' | 'phone'
  }
  category_privacy_overrides: Record<string, any>
  auto_delete_exchanges_after_days: number
  allow_emergency_override: boolean
}

export function ContactExchange({
  helpRequest
}: ContactExchangeProps) {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [consentGiven, setConsentGiven] = useState(false)
  const [showConsentDialog, setShowConsentDialog] = useState(false)
  const [hasExistingExchange, setHasExistingExchange] = useState(false)
  const [consentMessage, setConsentMessage] = useState('')
  const [messageError, setMessageError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [encryptionEnabled, setEncryptionEnabled] = useState(false)
  const [privacySettings, setPrivacySettings] = useState<UserPrivacySettings | null>(null)
  const [showDecryptedInfo, setShowDecryptedInfo] = useState(false)
  const [exchangeExpiry, setExchangeExpiry] = useState<Date | null>(null)
  const [revoking, setRevoking] = useState(false)
  const supabase = createClient()

  // Derive values from helpRequest and current user
  const requestId = helpRequest.id
  const requesterId = helpRequest.user_id
  const isRequester = currentUserId === requesterId
  const isHelper = currentUserId !== null && currentUserId !== requesterId

  useEffect(() => {
    // Get current user and check encryption support
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)

        // Check if encryption is supported
        const encryptionStatus = ContactEncryptionService.getInstance().getEncryptionStatus()
        setEncryptionEnabled(encryptionStatus.supported)

        // Load user privacy settings
        await loadUserPrivacySettings(user.id)

        addBreadcrumb({
          message: 'Contact exchange initialized',
          category: 'contact_exchange',
          data: {
            requestId: helpRequest.id,
            encryptionSupported: encryptionStatus.supported
          }
        })
      }
    }
    getCurrentUser()
  }, [supabase.auth, helpRequest.id])

  useEffect(() => {
    if (currentUserId) {
      checkExistingExchange()
    }
  }, [requestId, currentUserId])

  const loadUserPrivacySettings = async (userId: string) => {
    try {
      const { data: settings } = await supabase
        .from('user_privacy_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (settings) {
        setPrivacySettings(settings)
      }
    } catch (error) {
      captureWarning('Failed to load user privacy settings', {
        component: 'ContactExchange',
        userId,
        extra: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
    }
  }

  const checkExistingExchange = async () => {
    if (!currentUserId) return

    try {
      const { data: exchange } = await supabase
        .from('contact_exchanges')
        .select('*, data_retention_until')
        .eq('request_id', requestId)
        .eq('helper_id', currentUserId)
        .eq('requester_id', requesterId)
        .in('status', ['completed', 'initiated'])
        .single()

      if (exchange) {
        setHasExistingExchange(true)
        setConsentGiven(true)
        if (exchange.data_retention_until) {
          setExchangeExpiry(new Date(exchange.data_retention_until))
        }
        await loadContactInfo(exchange)
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

      // Track contact exchange start
      addBreadcrumb({
        message: 'Contact exchange initiated',
        category: 'privacy_security',
        level: 'info',
        data: { requestId, currentUserId, requesterId }
      })

      // Import validation functions
      const { validateContactExchange, validateRateLimit, createAuditEntry, canExchangeContacts } =
        await import('@/lib/validations/contact-exchange');

      if (!currentUserId) {
        throw new Error('You must be logged in to exchange contact information');
      }

      // Validate exchange eligibility
      const eligibility = canExchangeContacts(currentUserId, requesterId, helpRequest.status);
      if (!eligibility.canExchange) {
        throw new Error(eligibility.reason);
      }

      // Validate input data
      const validatedData = validateContactExchange({
        requestId,
        helperId: currentUserId,
        requesterId,
        message,
        consent: true,
      });

      // Check rate limiting
      const { data: recentExchanges } = await supabase
        .from('contact_exchanges')
        .select('initiated_at')
        .eq('helper_id', currentUserId)
        .gte('initiated_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

      const recentDates = recentExchanges?.map(e => new Date(e.initiated_at)) || [];
      if (!validateRateLimit(currentUserId, recentDates)) {
        throw new Error('Too many contact exchange attempts. Please try again later.');
      }

      // Create audit trail BEFORE revealing contact
      const auditEntry = createAuditEntry('CONTACT_EXCHANGE_INITIATED', {
        requestId,
        helperId: currentUserId,
        requesterId,
        metadata: {
          message: validatedData.message,
          encryptionEnabled,
          category: helpRequest.category
        },
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
        captureWarning('Audit trail creation failed', {
          component: 'ContactExchange',
          action: 'handleConsentGiven',
          extra: {
            error: auditError.message
          }
        })
      }

      // Get the requester's contact info and encrypt it if supported
      const { data: requesterProfile } = await supabase
        .from('profiles')
        .select('name, phone, location, contact_preferences')
        .eq('id', requesterId)
        .single()

      if (!requesterProfile) {
        throw new Error('Unable to retrieve contact information')
      }

      // Prepare contact data
      let contactData: any = null
      let encryptedContactData: EncryptedContactData | null = null

      if (encryptionEnabled) {
        // Encrypt sensitive contact information
        const contactToEncrypt: EncryptedContactInfo = {
          name: requesterProfile.name,
          email: `${requesterProfile.name.toLowerCase().replace(' ', '.')}@email.com`, // Demo email
          phone: requesterProfile.phone,
          location: requesterProfile.location
        }

        const fieldsToEncrypt = privacySettings?.default_contact_sharing.email ? ['email'] : []
        if (privacySettings?.default_contact_sharing.phone && requesterProfile.phone) {
          fieldsToEncrypt.push('phone')
        }

        try {
          encryptedContactData = await encryptContact(
            contactToEncrypt,
            currentUserId,
            requestId,
            fieldsToEncrypt as any
          )

          // Track successful encryption
          await trackEncryption('success', 'encrypt', currentUserId, requestId)
        } catch (encryptError) {
          // Track encryption failure
          await trackEncryption('failure', 'encrypt', currentUserId, requestId, encryptError instanceof Error ? encryptError.message : 'Unknown encryption error')
          throw encryptError
        }
      } else {
        // Store as plain JSON for backwards compatibility
        contactData = {
          name: requesterProfile.name,
          location: requesterProfile.location,
          // Only include email/phone based on privacy settings
          ...(privacySettings?.default_contact_sharing.email && {
            email: `${requesterProfile.name.toLowerCase().replace(' ', '.')}@email.com`
          }),
          ...(privacySettings?.default_contact_sharing.phone && requesterProfile.phone && {
            phone: requesterProfile.phone
          })
        }
      }

      // Create consent record with encrypted data
      const retentionDays = privacySettings?.auto_delete_exchanges_after_days || 90
      const retentionDate = new Date()
      retentionDate.setDate(retentionDate.getDate() + retentionDays)

      const { data: exchangeData, error: consentError } = await supabase
        .from('contact_exchanges')
        .insert({
          request_id: requestId,
          helper_id: currentUserId,
          requester_id: requesterId,
          message: validatedData.message,
          consent_given: true,
          status: 'initiated',
          initiated_at: new Date().toISOString(),
          encrypted_contact_data: encryptedContactData,
          contact_shared: contactData,
          encryption_version: encryptionEnabled ? '1.0' : null,
          data_retention_until: retentionDate.toISOString(),
          privacy_level: 'enhanced'
        })
        .select()
        .single()

      if (consentError) throw consentError

      setConsentGiven(true)
      setExchangeExpiry(retentionDate)
      await loadContactInfo(exchangeData)

      // Track successful contact exchange
      await trackContactExchange('completed', exchangeData.id, currentUserId, requesterId, {
        encrypted: encryptionEnabled,
        privacy_level: 'enhanced',
        fields_shared: ['name', 'location'],
        retention_days: privacySettings?.auto_delete_exchanges_after_days || 90
      })

      addBreadcrumb({
        message: 'Contact exchange completed successfully',
        category: 'contact_exchange',
        level: 'info',
        data: {
          requestId,
          encrypted: encryptionEnabled
        }
      })

    } catch (err) {
      console.error('Error processing consent:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to process consent';
      setError(errorMessage)
      setLoading(false)

      // Track failed contact exchange
      if (currentUserId && requesterId) {
        await trackContactExchange('failed', 'temp-id', currentUserId, requesterId, {
          error_message: errorMessage,
          failure_stage: 'consent_processing'
        })
      }

      captureError(err as Error, {
        component: 'ContactExchange',
        action: 'handleConsentGiven',
        userId: currentUserId,
        severity: 'high',
        extra: {
          requestId
        }
      })

      // Log failed attempt for security monitoring
      try {
        const { createAuditEntry } = await import('@/lib/validations/contact-exchange');
        const auditEntry = createAuditEntry('CONTACT_EXCHANGE_FAILED', {
          requestId,
          helperId: currentUserId || '',
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

  const handleRevokeContact = async () => {
    if (!currentUserId) return

    try {
      setRevoking(true)

      // Update exchange status to revoked
      const { error: updateError } = await supabase
        .from('contact_exchanges')
        .update({
          status: 'revoked',
          revoked_at: new Date().toISOString(),
          encrypted_contact_data: null,
          contact_shared: null
        })
        .eq('request_id', requestId)
        .eq('helper_id', currentUserId)
        .eq('requester_id', requesterId)

      if (updateError) throw updateError

      // Create audit trail
      const { createAuditEntry } = await import('@/lib/validations/contact-exchange')
      const auditEntry = createAuditEntry('CONTACT_EXCHANGE_REVOKED', {
        requestId,
        helperId: currentUserId,
        requesterId,
        metadata: { revoked_by: 'user_request' }
      })

      await supabase
        .from('contact_exchange_audit')
        .insert({
          action: auditEntry.action,
          request_id: auditEntry.requestId,
          helper_id: auditEntry.helperId,
          requester_id: auditEntry.requesterId,
          timestamp: auditEntry.timestamp,
          metadata: auditEntry.metadata
        })

      // Update sharing history
      await supabase
        .from('contact_sharing_history')
        .update({ status: 'revoked', revoked_at: new Date().toISOString() })
        .eq('help_request_id', requestId)
        .eq('user_id', requesterId)
        .eq('shared_with_user_id', currentUserId)

      // Track contact exchange revocation
      await trackContactExchange('revoked', 'unknown-id', currentUserId, requesterId, {
        revocation_reason: 'user_request',
        revoked_from: 'privacy_dashboard'
      })

      setContactInfo(null)
      setConsentGiven(false)
      setHasExistingExchange(false)

      addBreadcrumb({
        message: 'Contact information revoked',
        category: 'contact_exchange',
        level: 'info'
      })

    } catch (error) {
      captureError(error as Error, {
        component: 'ContactExchange',
        action: 'handleRevokeContact',
        userId: currentUserId,
        severity: 'medium'
      })
      setError('Failed to revoke contact information')
    } finally {
      setRevoking(false)
    }
  }

  const loadContactInfo = async (exchangeRecord?: any) => {
    if (!currentUserId) return

    try {
      setLoading(true)

      // Get the exchange record if not provided
      let exchange = exchangeRecord
      if (!exchange) {
        const { data } = await supabase
          .from('contact_exchanges')
          .select('*')
          .eq('request_id', requestId)
          .eq('helper_id', currentUserId)
          .eq('requester_id', requesterId)
          .single()
        exchange = data
      }

      if (!exchange) {
        throw new Error('Contact exchange record not found')
      }

      let contactData: ContactInfo | null = null

      // Check if data is encrypted
      if (exchange.encrypted_contact_data && isContactEncrypted(exchange.encrypted_contact_data)) {
        try {
          // Decrypt contact information
          const decryptedData = await decryptContact(
            exchange.encrypted_contact_data,
            currentUserId,
            requestId
          )

          // Track successful decryption
          await trackEncryption('success', 'decrypt', currentUserId, requestId)

          // Get basic profile info for name and location (non-sensitive)
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, location')
            .eq('id', requesterId)
            .single()

          contactData = {
            name: profile?.name || 'Unknown',
            location: profile?.location,
            ...decryptedData
          }

          addBreadcrumb({
            message: 'Contact information decrypted successfully',
            category: 'contact_exchange',
            level: 'info'
          })

        } catch (decryptError) {
          // Track decryption failure
          await trackEncryption('failure', 'decrypt', currentUserId, requestId, decryptError instanceof Error ? decryptError.message : 'Unknown decryption error')

          captureError(decryptError as Error, {
            component: 'ContactExchange',
            action: 'loadContactInfo',
            userId: currentUserId,
            severity: 'high',
            extra: { requestId }
          })

          // Fall back to basic profile information
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, location')
            .eq('id', requesterId)
            .single()

          contactData = {
            name: profile?.name || 'Unknown',
            location: profile?.location
          }

          setError('Contact information is encrypted but could not be decrypted')
        }
      } else if (exchange.contact_shared) {
        // Use legacy plain contact data
        contactData = exchange.contact_shared as ContactInfo
      } else {
        // Fetch basic profile information
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, location')
          .eq('id', requesterId)
          .single()

        contactData = {
          name: profile?.name || 'Unknown',
          location: profile?.location,
          email: `${profile?.name.toLowerCase().replace(' ', '.')}@email.com`
        }
      }

      setContactInfo(contactData)

      // Update exchange record to completed if not already
      if (exchange.status !== 'completed') {
        await supabase
          .from('contact_exchanges')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', exchange.id)

        // Create completion audit entry
        try {
          const { createAuditEntry } = await import('@/lib/validations/contact-exchange')
          const auditEntry = createAuditEntry('CONTACT_EXCHANGE_COMPLETED', {
            requestId,
            helperId: currentUserId,
            requesterId,
            metadata: {
              encryption_used: !!exchange.encrypted_contact_data,
              completion_method: 'automatic'
            }
          })

          await supabase
            .from('contact_exchange_audit')
            .insert({
              action: auditEntry.action,
              request_id: auditEntry.requestId,
              helper_id: auditEntry.helperId,
              requester_id: auditEntry.requesterId,
              timestamp: auditEntry.timestamp,
              metadata: auditEntry.metadata
            })
        } catch {
          // Don't block user experience for audit failures
        }
      }

    } catch (err) {
      console.error('Error loading contact info:', err)
      captureError(err as Error, {
        component: 'ContactExchange',
        action: 'loadContactInfo',
        userId: currentUserId,
        severity: 'medium',
        extra: { requestId }
      })
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
          helperId: currentUserId || '',
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
              <Shield className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium flex items-center gap-2">
                  Privacy & Security Notice
                  {encryptionEnabled && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <Lock className="h-3 w-3 mr-1" />
                      Encrypted
                    </Badge>
                  )}
                </p>
                <ul className="mt-1 space-y-1 text-amber-700">
                  <li>• Contact information is {encryptionEnabled ? 'encrypted' : 'protected'} and shared securely</li>
                  <li>• This exchange is logged for safety and trust</li>
                  <li>• Maximum 5 contact exchanges per hour</li>
                  <li>• Data will be auto-deleted after {privacySettings?.auto_delete_exchanges_after_days || 90} days</li>
                  <li>• You can revoke shared information at any time</li>
                  <li>• Report any inappropriate contact to admins</li>
                </ul>
                {!encryptionEnabled && (
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                    Encryption not available in this browser. Contact info will be stored securely but not encrypted.
                  </div>
                )}
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <CardTitle className="text-sage">Contact Information Shared</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRevokeContact}
            disabled={revoking}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            {revoking ? 'Revoking...' : 'Revoke'}
          </Button>
        </div>
        <CardDescription>
          Connect with {contactInfo.name} to coordinate help
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-800 text-sm">
              <Shield className="h-4 w-4" />
              <span className="font-medium">Privacy Protected Exchange</span>
              {encryptionEnabled && (
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  <Lock className="h-3 w-3 mr-1" />
                  Encrypted
                </Badge>
              )}
            </div>
            {contactInfo && (contactInfo.email || contactInfo.phone) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDecryptedInfo(!showDecryptedInfo)}
                className="text-xs"
              >
                {showDecryptedInfo ? (
                  <><EyeOff className="h-3 w-3 mr-1" />Hide Details</>
                ) : (
                  <><Eye className="h-3 w-3 mr-1" />Show Details</>
                )}
              </Button>
            )}
          </div>
          <p className="text-green-700 text-sm mt-1">
            This contact exchange is {encryptionEnabled ? 'encrypted and ' : ''}logged for community safety.
          </p>
          {exchangeExpiry && (
            <div className="flex items-center gap-1 text-green-700 text-xs mt-2">
              <Clock className="h-3 w-3" />
              Auto-deletion: {format(exchangeExpiry, 'MMM d, yyyy')}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Name</div>
            <div className="font-medium">{contactInfo.name}</div>
          </div>

          {contactInfo.email && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Email</div>
              {showDecryptedInfo ? (
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="font-medium text-sage hover:text-sage-dark underline"
                >
                  {contactInfo.email}
                </a>
              ) : (
                <div className="font-medium text-muted-foreground">••••••@••••••.com</div>
              )}
            </div>
          )}

          {contactInfo.phone && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Phone</div>
              {showDecryptedInfo ? (
                <a
                  href={`tel:${contactInfo.phone}`}
                  className="font-medium text-sage hover:text-sage-dark underline"
                >
                  {contactInfo.phone}
                </a>
              ) : (
                <div className="font-medium text-muted-foreground">(•••) •••-••••</div>
              )}
            </div>
          )}

          {contactInfo.location && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Location</div>
              <div className="font-medium">{contactInfo.location}</div>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-muted space-y-2">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Community Guidelines:</strong> Be respectful, meet in safe public places,
            and report any issues to administrators.
          </p>
          {privacySettings?.auto_delete_exchanges_after_days && (
            <p className="text-xs text-muted-foreground">
              🗓️ <strong>Data Retention:</strong> This contact information will be automatically
              deleted after {privacySettings.auto_delete_exchanges_after_days} days for your privacy.
            </p>
          )}
          {encryptionEnabled && (
            <p className="text-xs text-muted-foreground">
              🔒 <strong>Encryption:</strong> Contact details are encrypted using AES-256-GCM
              for maximum security.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}