import { Resend } from 'resend'
import {
  approvalTemplate,
  helpRequestTemplate,
  moderationAlertTemplate,
  waitlistTemplate,
  rejectionTemplate,
  helpOfferTemplate,
  userActivatedTemplate,
  userSuspendedTemplate,
  bulkOperationSummaryTemplate
} from './email/templates'

/**
 * Email Service for CARE Collective
 * Handles production email sending via Resend
 */

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string  // Plain text fallback for accessibility
  from?: string
  replyTo?: string
}

class EmailService {
  private resend: Resend | null = null
  private isProduction: boolean

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production'
    
    if (this.isProduction && process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY)
    }
  }

  /**
   * Send an email using Resend in production, or log to console in development
   */
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev'
    const adminEmail = process.env.ADMIN_EMAIL || 'onboarding@resend.dev'

    const {
      to,
      subject,
      html,
      text,
      from = `CARE Collective <${fromEmail}>`,
      replyTo = adminEmail
    } = options

    // In development or if no API key, log to console
    if (!this.isProduction || !this.resend) {
      console.log('\n=== EMAIL NOTIFICATION (DEV MODE) ===')
      console.log(`From: ${from}`)
      console.log(`To: ${to}`)
      console.log(`Subject: ${subject}`)
      console.log(`Reply-To: ${replyTo}`)
      console.log('HTML Length:', html.length, 'characters')
      console.log('Plain Text:', text ? 'Included' : 'Not included')
      console.log('=====================================\n')

      // In development, also show a preview
      if (process.env.NODE_ENV === 'development') {
        const textPreview = text || html
          .replace(/<[^>]*>/g, '') // Strip HTML tags
          .replace(/\s+/g, ' ') // Normalize whitespace
        console.log('Text Preview:', textPreview.substring(0, 200) + '...')
      }

      return { success: true, messageId: `dev-${Date.now()}` }
    }

    // Production: Send via Resend
    try {
      const result = await this.resend.emails.send({
        from,
        to,
        subject,
        html,
        text, // Include plain text fallback
        replyTo
      })

      if (result.error) {
        console.error('[Email Service] Resend error:', result.error)
        return { success: false, error: result.error.message }
      }

      console.log('[Email Service] Email sent successfully:', result.data?.id)
      return { success: true, messageId: result.data?.id }
    } catch (error) {
      console.error('[Email Service] Send error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send a welcome/waitlist confirmation email
   */
  async sendWaitlistConfirmation(to: string, name: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { html, text, subject } = waitlistTemplate(name)
    return this.sendEmail({ to, subject, html, text })
  }

  /**
   * Send approval notification with email confirmation link
   */
  async sendApprovalNotification(to: string, name: string, confirmUrl: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { html, text, subject } = approvalTemplate(name, confirmUrl)
    return this.sendEmail({ to, subject, html, text })
  }

  /**
   * Send rejection notification
   */
  async sendRejectionNotification(to: string, name: string, reason?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { html, text, subject } = rejectionTemplate(name, reason)
    return this.sendEmail({ to, subject, html, text })
  }

  /**
   * Send help request notification to potential helpers
   */
  async sendHelpRequestNotification(to: string, helperName: string, requestTitle: string, requestUrl: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Default to 'general' category and 'normal' urgency for now
    // These parameters can be added to the method signature in future updates
    const { html, text, subject } = helpRequestTemplate(
      helperName,
      requestTitle,
      requestUrl,
      'general',
      'normal'
    )
    return this.sendEmail({ to, subject, html, text })
  }

  /**
   * Send email notification when someone offers help on a request
   */
  async sendHelpOfferEmailNotification(
    recipientEmail: string,
    recipientName: string,
    helperName: string,
    requestTitle: string,
    requestId: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { html, text, subject } = helpOfferTemplate(recipientName, helperName, requestTitle, requestId)
    return this.sendEmail({ to: recipientEmail, subject, html, text })
  }

  /**
   * Send user status change notification to user
   */
  async sendUserStatusNotification(
    to: string,
    name: string,
    newStatus: 'approved' | 'rejected' | 'suspended',
    reason?: string,
    adminName?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    switch (newStatus) {
      case 'approved': {
        const { html, text, subject } = userActivatedTemplate(name)
        return this.sendEmail({ to, subject, html, text })
      }

      case 'rejected':
        return this.sendRejectionNotification(to, name, reason)

      case 'suspended': {
        const { html, text, subject } = userSuspendedTemplate(name, reason)
        return this.sendEmail({ to, subject, html, text })
      }
    }
  }

  /**
   * Send application decision notification to applicant
   */
  async sendApplicationDecision(
    to: string,
    name: string,
    decision: 'approved' | 'rejected',
    notes?: string,
    reviewerName?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://swmocarecollective.com'

    if (decision === 'approved') {
      return this.sendApprovalNotification(to, name, `${siteUrl}/dashboard`)
    } else {
      return this.sendRejectionNotification(to, name, notes)
    }
  }

  /**
   * Send moderation alert to administrators
   */
  async sendModerationAlert(
    reportId: string,
    messageId: string,
    reportReason: string,
    reporterEmail: string,
    messageSender: string,
    messagePreview: string,
    severity: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@carecollective.org'
    const reviewUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/admin/moderation/reports/${reportId}`

    const { html, text, subject } = moderationAlertTemplate(
      reportId,
      messageId,
      reportReason,
      reporterEmail,
      messageSender,
      messagePreview,
      severity,
      reviewUrl
    )

    return this.sendEmail({ to: adminEmail, subject, html, text })
  }

  /**
   * Send bulk operation summary to admin
   */
  async sendBulkOperationSummary(
    adminEmail: string,
    adminName: string,
    operationType: string,
    totalCount: number,
    successCount: number,
    failureCount: number,
    details?: string[]
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { html, text, subject } = bulkOperationSummaryTemplate(
      adminName,
      operationType,
      totalCount,
      successCount,
      failureCount,
      details
    )
    return this.sendEmail({ to: adminEmail, subject, html, text })
  }

  /**
   * Test email configuration
   */
  async testConfiguration(): Promise<{ success: boolean; message: string }> {
    if (!this.isProduction) {
      return { success: true, message: 'Development mode - email logging enabled' }
    }

    if (!process.env.RESEND_API_KEY) {
      return { success: false, message: 'RESEND_API_KEY environment variable not set' }
    }

    if (!this.resend) {
      return { success: false, message: 'Resend client not initialized' }
    }

    return { success: true, message: 'Email service configured and ready' }
  }
}

// Export singleton instance
export const emailService = new EmailService()
export default emailService