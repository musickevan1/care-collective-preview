import { Resend } from 'resend'

/**
 * Email Service for Care Collective
 * Handles production email sending via Resend
 */

interface EmailOptions {
  to: string
  subject: string
  html: string
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
    const {
      to,
      subject,
      html,
      from = 'Care Collective <noreply@carecollective.org>',
      replyTo = 'support@carecollective.org'
    } = options

    // In development or if no API key, log to console
    if (!this.isProduction || !this.resend) {
      console.log('\n=== EMAIL NOTIFICATION (DEV MODE) ===')
      console.log(`From: ${from}`)
      console.log(`To: ${to}`)
      console.log(`Subject: ${subject}`)
      console.log(`Reply-To: ${replyTo}`)
      console.log('HTML Length:', html.length, 'characters')
      console.log('=====================================\n')
      
      // In development, also show a preview
      if (process.env.NODE_ENV === 'development') {
        const textPreview = html
          .replace(/<[^>]*>/g, '') // Strip HTML tags
          .replace(/\s+/g, ' ') // Normalize whitespace
          .substring(0, 200) + '...'
        console.log('Text Preview:', textPreview)
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
    const subject = '📋 You\'re on the Care Collective waitlist'
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #324158;">Welcome to Care Collective, ${name}!</h2>
        <p>Thank you for your interest in joining our mutual aid community.</p>
        <div style="background: #FBF2E9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #BC6547; margin-top: 0;">What happens next?</h3>
          <ol style="color: #483129;">
            <li>Our team will review your application</li>
            <li>You'll receive an email once a decision is made</li>
            <li>You can check your application status anytime by logging in</li>
          </ol>
        </div>
        <p style="color: #7A9E99;"><strong>No email confirmation needed yet!</strong></p>
        <p>You can log in immediately to view your waitlist status. Email confirmation will only be required if your application is approved.</p>
        <hr style="border: none; border-top: 1px solid #E5C6C1; margin: 30px 0;">
        <p style="font-size: 12px; color: #999;">Care Collective - Building stronger communities through mutual aid</p>
      </div>
    `

    return this.sendEmail({ to, subject, html })
  }

  /**
   * Send approval notification with email confirmation link
   */
  async sendApprovalNotification(to: string, name: string, confirmUrl: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const subject = '✅ Welcome to Care Collective - Please Confirm Your Email'
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #324158;">Congratulations, ${name}! 🎉</h2>
        <p>Your application to join Care Collective has been <strong style="color: #5A7D78;">approved</strong>!</p>
        <div style="background: #A3C4BF; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h3 style="color: #FFF; margin-top: 0;">One Final Step</h3>
          <p style="color: #FFF;">Please confirm your email to access the full platform:</p>
          <a href="${confirmUrl}" style="display: inline-block; background: #BC6547; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Confirm Email & Get Started</a>
        </div>
        <p>After confirming your email, you'll be able to:</p>
        <ul style="color: #483129;">
          <li>Create and respond to help requests</li>
          <li>Connect with community members</li>
          <li>Share resources and support</li>
        </ul>
        <p style="font-size: 14px; color: #999; margin-top: 30px;">If the button doesn't work, copy and paste this link into your browser:<br>${confirmUrl}</p>
        <hr style="border: none; border-top: 1px solid #E5C6C1; margin: 30px 0;">
        <p style="font-size: 12px; color: #999;">Care Collective - Southwest Missouri's mutual aid network</p>
      </div>
    `

    return this.sendEmail({ to, subject, html })
  }

  /**
   * Send rejection notification
   */
  async sendRejectionNotification(to: string, name: string, reason?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const subject = 'Update on your Care Collective application'
    const reasonText = reason ? `\n\nReason: ${reason}` : ''
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #324158;">Thank you for your interest, ${name}</h2>
        <p>We have reviewed your application to join Care Collective.</p>
        <div style="background: #FBF2E9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #483129;">Unfortunately, we are unable to approve your application at this time.${reasonText}</p>
        </div>
        <p>You are welcome to reapply in the future. We encourage you to:</p>
        <ul style="color: #483129;">
          <li>Connect with mutual aid groups in your area</li>
          <li>Volunteer with local organizations</li>
          <li>Build connections in your community</li>
        </ul>
        <p>Thank you for your understanding.</p>
        <hr style="border: none; border-top: 1px solid #E5C6C1; margin: 30px 0;">
        <p style="font-size: 12px; color: #999;">Care Collective - Southwest Missouri's mutual aid network</p>
      </div>
    `

    return this.sendEmail({ to, subject, html })
  }

  /**
   * Send help request notification to potential helpers
   */
  async sendHelpRequestNotification(to: string, helperName: string, requestTitle: string, requestUrl: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const subject = `New Help Request: ${requestTitle}`
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #324158;">Hi ${helperName}!</h2>
        <p>A new help request has been posted that might interest you:</p>
        <div style="background: #FBF2E9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #BC6547; margin-top: 0;">${requestTitle}</h3>
          <a href="${requestUrl}" style="display: inline-block; background: #7A9E99; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Request</a>
        </div>
        <p style="font-size: 12px; color: #999;">You're receiving this because you opted in to help request notifications.</p>
        <hr style="border: none; border-top: 1px solid #E5C6C1; margin: 30px 0;">
        <p style="font-size: 12px; color: #999;">Care Collective - Building stronger communities through mutual aid</p>
      </div>
    `

    return this.sendEmail({ to, subject, html })
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
    let subject: string
    let html: string

    switch (newStatus) {
      case 'approved':
        subject = '✅ Your Care Collective account has been activated'
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #324158;">Welcome to Care Collective, ${name}! 🎉</h2>
            <p>Your account has been activated and you now have full access to the platform.</p>
            <div style="background: #A3C4BF; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="color: #FFF; margin-top: 0;">You can now:</h3>
              <ul style="color: #FFF; text-align: left; margin: 10px 0;">
                <li>Create and respond to help requests</li>
                <li>Connect with community members</li>
                <li>Share resources and support</li>
                <li>Access all platform features</li>
              </ul>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" style="display: inline-block; background: #BC6547; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Go to Dashboard</a>
            </div>
            <p>Thank you for being part of our mutual aid community!</p>
            <hr style="border: none; border-top: 1px solid #E5C6C1; margin: 30px 0;">
            <p style="font-size: 12px; color: #999;">Care Collective - Building stronger communities through mutual aid</p>
          </div>
        `
        break

      case 'rejected':
        subject = 'Update on your Care Collective account'
        const reasonText = reason ? `\n\nReason: ${reason}` : ''
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #324158;">Account Status Update</h2>
            <p>Hello ${name},</p>
            <div style="background: #FBF2E9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #483129;">Your account access has been suspended.${reasonText}</p>
            </div>
            <p>If you believe this is an error or would like to appeal this decision, please contact our support team.</p>
            <p>Thank you for your understanding.</p>
            <hr style="border: none; border-top: 1px solid #E5C6C1; margin: 30px 0;">
            <p style="font-size: 12px; color: #999;">Care Collective - Building stronger communities through mutual aid</p>
          </div>
        `
        break

      case 'suspended':
        subject = 'Important: Your Care Collective account status'
        const suspensionReason = reason ? `\n\nReason: ${reason}` : ''
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #324158;">Account Suspension Notice</h2>
            <p>Hello ${name},</p>
            <div style="background: #FFF3CD; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FFC107;">
              <p style="color: #856404;">Your account has been temporarily suspended.${suspensionReason}</p>
            </div>
            <p>This action was taken to ensure community safety and adherence to our guidelines.</p>
            <p>If you have questions about this decision or would like to discuss reinstatement, please contact our support team.</p>
            <hr style="border: none; border-top: 1px solid #E5C6C1; margin: 30px 0;">
            <p style="font-size: 12px; color: #999;">Care Collective - Building stronger communities through mutual aid</p>
          </div>
        `
        break
    }

    return this.sendEmail({ to, subject, html })
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
    if (decision === 'approved') {
      return this.sendApprovalNotification(to, name, `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`)
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
    const urgencyIcon = severity === 'high' ? '🚨' : severity === 'medium' ? '⚠️' : 'ℹ️'
    const urgencyColor = severity === 'high' ? '#DC3545' : severity === 'medium' ? '#FFC107' : '#6C757D'

    const subject = `${urgencyIcon} Moderation Alert: ${reportReason} report`
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${urgencyColor};">${urgencyIcon} Content Moderation Alert</h2>
        <div style="background: #F8F9FA; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${urgencyColor};">
          <h3 style="margin-top: 0; color: #324158;">Report Details</h3>
          <p><strong>Report ID:</strong> ${reportId}</p>
          <p><strong>Message ID:</strong> ${messageId}</p>
          <p><strong>Reason:</strong> ${reportReason}</p>
          <p><strong>Severity:</strong> ${severity.toUpperCase()}</p>
          <p><strong>Reported by:</strong> ${reporterEmail}</p>
          <p><strong>Message sender:</strong> ${messageSender}</p>
        </div>
        <div style="background: #FBF2E9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #BC6547;">Message Preview</h4>
          <p style="color: #483129; font-style: italic;">"${messagePreview}..."</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/messaging/moderation" style="display: inline-block; background: #BC6547; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">Review Report</a>
        </div>
        <p><strong>Action Required:</strong> Please review this report and take appropriate moderation action.</p>
        <hr style="border: none; border-top: 1px solid #E5C6C1; margin: 30px 0;">
        <p style="font-size: 12px; color: #999;">Care Collective Admin System - Automated Moderation Alert</p>
      </div>
    `

    return this.sendEmail({ to: adminEmail, subject, html })
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
    const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0
    const statusColor = successRate >= 90 ? '#28A745' : successRate >= 70 ? '#FFC107' : '#DC3545'

    const subject = `Bulk Operation Complete: ${operationType} (${successCount}/${totalCount} successful)`
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #324158;">Bulk Operation Summary</h2>
        <p>Hello ${adminName},</p>
        <p>Your bulk operation has been completed. Here's the summary:</p>

        <div style="background: #F8F9FA; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #324158;">Operation Details</h3>
          <p><strong>Operation:</strong> ${operationType}</p>
          <p><strong>Total Items:</strong> ${totalCount}</p>
          <p><strong>Successful:</strong> <span style="color: #28A745;">${successCount}</span></p>
          <p><strong>Failed:</strong> <span style="color: #DC3545;">${failureCount}</span></p>
          <p><strong>Success Rate:</strong> <span style="color: ${statusColor}; font-weight: bold;">${successRate}%</span></p>
        </div>

        ${details && details.length > 0 ? `
        <div style="background: #FBF2E9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #BC6547;">Operation Details</h4>
          <ul style="color: #483129;">
            ${details.map(detail => `<li>${detail}</li>`).join('')}
          </ul>
        </div>
        ` : ''}

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin" style="display: inline-block; background: #7A9E99; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">View Admin Dashboard</a>
        </div>

        <hr style="border: none; border-top: 1px solid #E5C6C1; margin: 30px 0;">
        <p style="font-size: 12px; color: #999;">Care Collective Admin System - Bulk Operation Report</p>
      </div>
    `

    return this.sendEmail({ to: adminEmail, subject, html })
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