/**
 * Email Templates for CARE Collective
 * Professional, accessible, and consistent email templates
 * Phase 1: approval, help_request, moderation_alert
 */

import {
  emailWrapper,
  emailHeader,
  emailFooter,
  primaryButton,
  secondaryButton,
  infoBox,
  successBox,
  alertBox,
  warningBox,
  section,
  divider,
  BRAND_COLORS,
  FONT_SIZES,
  FONT_FAMILY,
} from './components'
import { generatePlainText } from './utils'

/**
 * Email template result interface
 */
export interface EmailTemplate {
  html: string
  text: string
  subject: string
}

/**
 * Approval Notification Template
 * Sent when user application is approved with email confirmation link
 */
export function approvalTemplate(name: string, confirmUrl: string): EmailTemplate {
  const subject = 'Welcome to CARE Collective - Please Confirm Your Email'

  const preheader = 'Your application has been approved! Confirm your email to get started.'

  const content = `
    ${emailHeader()}

    ${section(`
        <h2 style="color: ${BRAND_COLORS.navy}; font-size: ${FONT_SIZES.xl}; font-weight: 800; margin: 0 0 16px 0; line-height: 1.3;">
        Congratulations, ${name}!
      </h2>
      <p style="margin: 0 0 20px 0; font-size: ${FONT_SIZES.base}; line-height: 1.6;">
        Your application to join <strong>CARE Collective</strong> has been approved!
      </p>
    `)}

    ${successBox(`
      <p style="margin: 0 0 15px 0;">
        Please confirm your email address to access the full platform:
      </p>
      ${primaryButton('Confirm Your Email & Get Started', confirmUrl, 'Confirm your email address to activate your account')}
    `, 'One Final Step')}

    ${infoBox(`
      <p style="margin: 0 0 10px 0;"><strong>After confirming your email, you'll be able to:</strong></p>
      <ul style="margin: 10px 0; padding-left: 20px; color: ${BRAND_COLORS.brown};">
        <li style="margin: 8px 0;">Create and respond to help requests</li>
        <li style="margin: 8px 0;">Connect with community members</li>
        <li style="margin: 8px 0;">Share resources and support</li>
        <li style="margin: 8px 0;">Build stronger community connections</li>
      </ul>
    `, 'What Happens Next')}

    ${section(`
      <p style="font-size: 14px; color: #666666; margin: 20px 0 0 0; line-height: 1.6;">
        <strong>Having trouble with the button?</strong><br>
        Copy and paste this link into your browser:<br>
        <a href="${confirmUrl}" style="color: ${BRAND_COLORS.sage}; word-break: break-all;">${confirmUrl}</a>
      </p>
    `)}

    ${divider()}
    ${emailFooter()}
  `

  const html = emailWrapper(content, preheader)
  const text = generatePlainText(html)

  return { html, text, subject }
}

/**
 * Help Request Notification Template
 * Sent to potential helpers about new help requests
 */
export function helpRequestTemplate(
  helperName: string,
  requestTitle: string,
  requestUrl: string,
  category: string,
  urgency: 'normal' | 'urgent' | 'critical'
): EmailTemplate {
  // Subject line with urgency indicator
  const urgencyPrefix = urgency === 'critical' ? 'URGENT' : urgency === 'urgent' ? 'Time-Sensitive' : ''
  const subject = urgencyPrefix
    ? `${urgencyPrefix}: ${requestTitle}`
    : `New Help Request: ${requestTitle}`

  const preheader = `A community member needs help with: ${requestTitle}`

  // Urgency styling
  const urgencyColors = {
    critical: BRAND_COLORS.terracotta,
    urgent: BRAND_COLORS.tan,
    normal: BRAND_COLORS.sage,
  }

  const urgencyLabels = {
    critical: 'CRITICAL - Immediate assistance needed',
    urgent: 'URGENT - Time-sensitive request',
    normal: 'Help request from your community',
  }

  const urgencyColor = urgencyColors[urgency]
  const urgencyLabel = urgencyLabels[urgency]

  // Category badge
  const categoryDisplay = category.charAt(0).toUpperCase() + category.slice(1)

  const content = `
    ${emailHeader()}

    ${section(`
      <h2 style="color: ${BRAND_COLORS.navy}; font-size: ${FONT_SIZES.xl}; font-weight: 800; margin: 0 0 12px 0; line-height: 1.3;">
        Hi ${helperName}!
      </h2>
      <p style="margin: 0 0 20px 0; font-size: ${FONT_SIZES.base}; line-height: 1.6;">
        A new help request has been posted that matches your interests:
      </p>
    `)}

    ${urgency !== 'normal' ? `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="padding: 10px 30px;">
          <div style="background-color: ${urgencyColor}; color: #FFFFFF; padding: 12px 20px; border-radius: 6px; text-align: center; font-weight: 600; font-size: 14px;">
            ${urgencyLabel}
          </div>
        </td>
      </tr>
    </table>
    ` : ''}

    ${infoBox(`
      <h3 style="color: ${BRAND_COLORS.navy}; font-size: ${FONT_SIZES.lg}; font-weight: 800; margin: 0 0 12px 0; line-height: 1.3;">
        ${requestTitle}
      </h3>
      <p style="margin: 0 0 15px 0; display: inline-block; background-color: ${BRAND_COLORS.tan}; color: #FFFFFF; padding: 6px 12px; border-radius: 4px; font-size: ${FONT_SIZES.xs}; font-weight: 700;">
        ${categoryDisplay}
      </p>
      <p style="margin: 15px 0 0 0; font-size: ${FONT_SIZES.sm}; color: ${BRAND_COLORS.brown};">
        ${urgency !== 'normal' ? `<strong>Priority Level:</strong> ${urgencyLabel}<br>` : ''}
        <strong>Category:</strong> ${categoryDisplay}
      </p>
    `)}

    ${primaryButton('View Request & Offer Help', requestUrl, `View help request: ${requestTitle}`)}

    ${section(`
      <p style="font-size: 14px; color: #666666; margin: 20px 0 0 0; line-height: 1.6; text-align: center;">
        Your response can make a real difference in someone's life.
      </p>
    `)}

    ${divider()}
    ${emailFooter()}
  `

  const html = emailWrapper(content, preheader)
  const text = generatePlainText(html)

  return { html, text, subject }
}

/**
 * Moderation Alert Template
 * Sent to admins for content moderation reports
 */
export function moderationAlertTemplate(
  reportId: string,
  messageId: string,
  reportReason: string,
  reporterEmail: string,
  messageSender: string,
  messagePreview: string,
  severity: 'high' | 'medium' | 'low',
  reviewUrl: string
): EmailTemplate {
  const severityIcons = {
    high: '',
    medium: '',
    low: '',
  }

  const icon = severityIcons[severity]
  const subject = `Moderation Alert: ${reportReason} (${severity.toUpperCase()} priority)`

  const preheader = `${severity.toUpperCase()} priority content report requires review`

  // Truncate message preview if too long
  const truncatedPreview = messagePreview.length > 200
    ? messagePreview.substring(0, 200) + '...'
    : messagePreview

  const content = `
    ${emailHeader()}

    ${section(`
      <h2 style="color: ${BRAND_COLORS.navy}; font-size: ${FONT_SIZES.xl}; font-weight: 800; margin: 0 0 12px 0; line-height: 1.3;">
        Content Moderation Alert
      </h2>
      <p style="margin: 0 0 20px 0; font-size: ${FONT_SIZES.base}; line-height: 1.6;">
        A ${severity} priority content report requires your immediate attention.
      </p>
    `)}

    ${alertBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size: ${FONT_SIZES.sm}; color: ${BRAND_COLORS.brown};">
        <tr>
          <td style="padding: 8px 8px 8px 0; font-weight: 700; width: 40%;">Report ID:</td>
          <td style="padding: 8px 0; width: 60%; word-break: break-word;">${reportId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 8px 8px 0; font-weight: 700; width: 40%;">Message ID:</td>
          <td style="padding: 8px 0; width: 60%; word-break: break-word;">${messageId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 8px 8px 0; font-weight: 700; width: 40%;">Violation Type:</td>
          <td style="padding: 8px 0; width: 60%; word-break: break-word;">${reportReason}</td>
        </tr>
        <tr>
          <td style="padding: 8px 8px 8px 0; font-weight: 700; width: 40%;">Severity:</td>
          <td style="padding: 8px 0; width: 60%;"><strong style="text-transform: uppercase;">${severity}</strong></td>
        </tr>
        <tr>
          <td style="padding: 8px 8px 8px 0; font-weight: 700; width: 40%;">Reported By:</td>
          <td style="padding: 8px 0; width: 60%; word-break: break-word;">${reporterEmail}</td>
        </tr>
        <tr>
          <td style="padding: 8px 8px 8px 0; font-weight: 700; width: 40%;">Message Sender:</td>
          <td style="padding: 8px 0; width: 60%; word-break: break-word;">${messageSender}</td>
        </tr>
      </table>
    `, severity, 'Report Details')}

    ${infoBox(`
      <h4 style="margin: 0 0 10px 0; font-size: ${FONT_SIZES.sm}; font-weight: 700; color: ${BRAND_COLORS.terracotta};">
        Flagged Message Preview
      </h4>
      <p style="margin: 0; font-style: italic; color: ${BRAND_COLORS.brown}; padding: 12px; background-color: #FFFFFF; border-radius: 4px; border-left: 3px solid ${BRAND_COLORS.terracotta};">
        "${truncatedPreview}"
      </p>
    `)}

    ${primaryButton('Review Report & Take Action', reviewUrl, 'Review moderation report and take appropriate action')}

    ${section(`
      <p style="font-size: 14px; color: #666666; margin: 20px 0 0 0; line-height: 1.6;">
        <strong>Action Required:</strong> Please review this report promptly and take appropriate moderation action to maintain community safety.
      </p>
    `)}

    ${divider()}
    ${emailFooter()}
  `

  const html = emailWrapper(content, preheader)
  const text = generatePlainText(html)

  return { html, text, subject }
}

/**
 * Waitlist Confirmation Template
 * Sent when user joins waitlist
 */
export function waitlistTemplate(name: string): EmailTemplate {
  const subject = 'You\'re on the CARE Collective Waitlist'

  const preheader = 'Thank you for your interest in joining our mutual support community.'

  const content = `
    ${emailHeader()}

    ${section(`
      <h2 style="color: ${BRAND_COLORS.navy}; font-size: ${FONT_SIZES.xl}; font-weight: 800; margin: 0 0 16px 0; line-height: 1.3;">
        Welcome to CARE Collective, ${name}!
      </h2>
      <p style="margin: 0 0 20px 0; font-size: ${FONT_SIZES.base}; line-height: 1.6;">
        Thank you for your interest in joining our mutual support community.
      </p>
    `)}

    ${infoBox(`
      <h3 style="margin: 0 0 12px 0; font-size: ${FONT_SIZES.lg}; font-weight: 800; color: ${BRAND_COLORS.navy};">What happens next?</h3>
      <ol style="margin: 0; padding-left: 20px; color: ${BRAND_COLORS.brown}; line-height: 1.8;">
        <li style="margin: 8px 0;">Our team will review your application</li>
        <li style="margin: 8px 0;">You'll receive an email once a decision is made</li>
        <li style="margin: 8px 0;">You can check your application status anytime by logging in</li>
      </ol>
    `)}

    ${section(`
      <p style="margin: 20px 0 0 0; font-size: ${FONT_SIZES.base}; line-height: 1.6; color: ${BRAND_COLORS.sage};">
        <strong>No email confirmation needed yet!</strong>
      </p>
      <p style="margin: 10px 0 0 0; font-size: ${FONT_SIZES.sm}; line-height: 1.6;">
        You can log in immediately to view your waitlist status. Email confirmation will only be required if your application is approved.
      </p>
    `)}

    ${divider()}
    ${emailFooter()}
  `

  const html = emailWrapper(content, preheader)
  const text = generatePlainText(html)

  return { html, text, subject }
}

/**
 * User Activated Template
 * Sent when user account is activated
 */
export function userActivatedTemplate(name: string): EmailTemplate {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://swmocarecollective.com'
  const subject = 'Your CARE Collective Account Has Been Activated'

  const preheader = 'Welcome! You now have full access to the platform.'

  const content = `
    ${emailHeader()}

    ${section(`
      <h2 style="color: ${BRAND_COLORS.navy}; font-size: ${FONT_SIZES.xl}; font-weight: 800; margin: 0 0 16px 0; line-height: 1.3;">
        Welcome to CARE Collective, ${name}!
      </h2>
      <p style="margin: 0 0 20px 0; font-size: ${FONT_SIZES.base}; line-height: 1.6;">
        Your account has been activated and you now have full access to the platform.
      </p>
    `)}

    ${successBox(`
      <h3 style="margin: 0 0 15px 0; font-size: ${FONT_SIZES.lg}; font-weight: 800; color: #FFFFFF;">You can now:</h3>
      <ul style="margin: 0; padding-left: 20px; color: #FFFFFF; line-height: 1.8; text-align: left;">
        <li style="margin: 8px 0;">Create and respond to help requests</li>
        <li style="margin: 8px 0;">Connect with community members</li>
        <li style="margin: 8px 0;">Share resources and support</li>
        <li style="margin: 8px 0;">Access all platform features</li>
      </ul>
    `)}

    ${primaryButton('Go to Dashboard', `${siteUrl}/dashboard`, 'Visit your dashboard to get started')}

    ${section(`
      <p style="margin: 20px 0 0 0; font-size: ${FONT_SIZES.base}; line-height: 1.6; text-align: center;">
        Thank you for being part of our mutual support community!
      </p>
    `)}

    ${divider()}
    ${emailFooter()}
  `

  const html = emailWrapper(content, preheader)
  const text = generatePlainText(html)

  return { html, text, subject }
}

/**
 * Rejection Notification Template
 * Sent when user application is rejected
 */
export function rejectionTemplate(name: string, reason?: string): EmailTemplate {
  const subject = 'Update on Your CARE Collective Application'

  const preheader = 'Thank you for your interest in joining CARE Collective.'

  const content = `
    ${emailHeader()}

    ${section(`
      <h2 style="color: ${BRAND_COLORS.navy}; font-size: ${FONT_SIZES.xl}; font-weight: 800; margin: 0 0 16px 0; line-height: 1.3;">
        Thank you for your interest, ${name}
      </h2>
      <p style="margin: 0 0 20px 0; font-size: ${FONT_SIZES.base}; line-height: 1.6;">
        We have carefully reviewed your application to join CARE Collective.
      </p>
    `)}

    ${infoBox(`
      <p style="margin: 0; font-size: ${FONT_SIZES.base}; line-height: 1.6;">
        Unfortunately, we are unable to approve your application at this time.
      </p>
      ${reason ? `
      <p style="margin: 16px 0 0 0; font-size: ${FONT_SIZES.sm}; line-height: 1.6;">
        <strong>Reason:</strong> ${reason}
      </p>
      ` : ''}
    `)}

    ${section(`
      <p style="margin: 20px 0 10px 0; font-size: ${FONT_SIZES.base}; line-height: 1.6;">
        You are welcome to reapply in the future. We encourage you to:
      </p>
      <ul style="margin: 0; padding-left: 20px; color: ${BRAND_COLORS.brown}; line-height: 1.8;">
        <li style="margin: 8px 0;">Connect with mutual support groups in your area</li>
        <li style="margin: 8px 0;">Volunteer with local organizations</li>
        <li style="margin: 8px 0;">Build connections in your community</li>
      </ul>
      <p style="margin: 20px 0 0 0; font-size: ${FONT_SIZES.base}; line-height: 1.6;">
        Thank you for your understanding.
      </p>
    `)}

    ${divider()}
    ${emailFooter()}
  `

  const html = emailWrapper(content, preheader)
  const text = generatePlainText(html)

  return { html, text, subject }
}

/**
 * Help Offer Notification Template
 * Sent when someone offers to help with a request
 */
export function helpOfferTemplate(
  recipientName: string,
  helperName: string,
  requestTitle: string,
  requestId: string
): EmailTemplate {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://swmocarecollective.com'
  const subject = 'Someone Wants to Help with Your Request'

  const preheader = `${helperName} has offered to help with: ${requestTitle}`

  const content = `
    ${emailHeader()}

    ${section(`
      <h2 style="color: ${BRAND_COLORS.navy}; font-size: ${FONT_SIZES.xl}; font-weight: 800; margin: 0 0 16px 0; line-height: 1.3;">
        Good news, ${recipientName}!
      </h2>
      <p style="margin: 0 0 20px 0; font-size: ${FONT_SIZES.base}; line-height: 1.6;">
        <strong>${helperName}</strong> has offered to help with your request.
      </p>
    `)}

    ${infoBox(`
      <h3 style="color: ${BRAND_COLORS.navy}; font-size: ${FONT_SIZES.lg}; font-weight: 800; margin: 0 0 12px 0; line-height: 1.3;">
        ${requestTitle}
      </h3>
      <p style="margin: 0; font-size: ${FONT_SIZES.sm}; color: ${BRAND_COLORS.brown}; line-height: 1.6;">
        You can now message them directly to coordinate assistance and discuss next steps.
      </p>
    `, 'Your Help Request')}

    ${primaryButton('View Messages', `${siteUrl}/messages?help_request=${requestId}`, `View messages for help request: ${requestTitle}`)}

    ${section(`
      <p style="font-size: ${FONT_SIZES.sm}; color: #666666; margin: 20px 0 0 0; line-height: 1.6; text-align: center;">
        Your community is here to support you.
      </p>
    `)}

    ${divider()}
    ${emailFooter()}
  `

  const html = emailWrapper(content, preheader)
  const text = generatePlainText(html)

  return { html, text, subject }
}

/**
 * User Suspended Template
 * Sent when user account is suspended
 */
export function userSuspendedTemplate(name: string, reason?: string): EmailTemplate {
  const subject = 'Important: Your CARE Collective Account Status'

  const preheader = 'Your account has been temporarily suspended. Please review this notice.'

  const content = `
    ${emailHeader()}

    ${section(`
      <h2 style="color: ${BRAND_COLORS.navy}; font-size: ${FONT_SIZES.xl}; font-weight: 800; margin: 0 0 16px 0; line-height: 1.3;">
        Account Suspension Notice
      </h2>
      <p style="margin: 0 0 20px 0; font-size: ${FONT_SIZES.base}; line-height: 1.6;">
        Hello ${name},
      </p>
    `)}

    ${warningBox(`
      <p style="margin: 0; font-size: ${FONT_SIZES.base}; line-height: 1.6;">
        Your account has been temporarily suspended.
      </p>
      ${reason ? `
      <p style="margin: 16px 0 0 0; font-size: ${FONT_SIZES.sm}; line-height: 1.6;">
        <strong>Reason:</strong> ${reason}
      </p>
      ` : ''}
    `, 'Suspension Details')}

    ${section(`
      <p style="margin: 20px 0 10px 0; font-size: ${FONT_SIZES.base}; line-height: 1.6;">
        This action was taken to ensure community safety and adherence to our guidelines.
      </p>
      <p style="margin: 10px 0 0 0; font-size: ${FONT_SIZES.base}; line-height: 1.6;">
        If you have questions about this decision or would like to discuss reinstatement, please contact our support team at <a href="mailto:swmocarecollective@gmail.com" style="color: ${BRAND_COLORS.sage}; text-decoration: underline;">swmocarecollective@gmail.com</a>.
      </p>
    `)}

    ${divider()}
    ${emailFooter()}
  `

  const html = emailWrapper(content, preheader)
  const text = generatePlainText(html)

  return { html, text, subject }
}

/**
 * Bulk Operation Summary Template
 * Sent to admins after bulk operations
 */
export function bulkOperationSummaryTemplate(
  adminName: string,
  operationType: string,
  totalCount: number,
  successCount: number,
  failureCount: number,
  details?: string[]
): EmailTemplate {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://swmocarecollective.com'
  const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0
  const severity: 'high' | 'medium' | 'low' =
    successRate >= 90 ? 'low' : successRate >= 70 ? 'medium' : 'high'

  const subject = `Bulk Operation Complete: ${operationType} (${successCount}/${totalCount} successful)`

  const preheader = `Your bulk operation has completed. Success rate: ${successRate}%`

  const content = `
    ${emailHeader()}

    ${section(`
      <h2 style="color: ${BRAND_COLORS.navy}; font-size: ${FONT_SIZES.xl}; font-weight: 800; margin: 0 0 16px 0; line-height: 1.3;">
        Bulk Operation Summary
      </h2>
      <p style="margin: 0 0 20px 0; font-size: ${FONT_SIZES.base}; line-height: 1.6;">
        Hello ${adminName},
      </p>
      <p style="margin: 0 0 20px 0; font-size: ${FONT_SIZES.base}; line-height: 1.6;">
        Your bulk operation has been completed. Here's the summary:
      </p>
    `)}

    ${alertBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size: ${FONT_SIZES.sm}; color: ${BRAND_COLORS.brown};">
        <tr>
          <td style="padding: 8px 8px 8px 0; font-weight: 700; width: 40%;">Operation:</td>
          <td style="padding: 8px 0; width: 60%; word-break: break-word;">${operationType}</td>
        </tr>
        <tr>
          <td style="padding: 8px 8px 8px 0; font-weight: 700; width: 40%;">Total Items:</td>
          <td style="padding: 8px 0; width: 60%;">${totalCount}</td>
        </tr>
        <tr>
          <td style="padding: 8px 8px 8px 0; font-weight: 700; width: 40%;">Successful:</td>
          <td style="padding: 8px 0; width: 60%; color: ${BRAND_COLORS.sage}; font-weight: 700;">${successCount}</td>
        </tr>
        <tr>
          <td style="padding: 8px 8px 8px 0; font-weight: 700; width: 40%;">Failed:</td>
          <td style="padding: 8px 0; width: 60%; color: ${BRAND_COLORS.terracotta}; font-weight: 700;">${failureCount}</td>
        </tr>
        <tr>
          <td style="padding: 8px 8px 8px 0; font-weight: 700; width: 40%;">Success Rate:</td>
          <td style="padding: 8px 0; width: 60%; color: ${successRate >= 90 ? BRAND_COLORS.sage : successRate >= 70 ? BRAND_COLORS.tan : BRAND_COLORS.terracotta}; font-weight: 800; font-size: ${FONT_SIZES.lg};">${successRate}%</td>
        </tr>
      </table>
    `, severity, 'Operation Results')}

    ${details && details.length > 0 ? infoBox(`
      <h4 style="margin: 0 0 12px 0; font-size: ${FONT_SIZES.base}; font-weight: 700; color: ${BRAND_COLORS.navy};">Operation Details</h4>
      <ul style="margin: 0; padding-left: 20px; color: ${BRAND_COLORS.brown}; line-height: 1.8;">
        ${details.map(detail => `<li style="margin: 8px 0;">${detail}</li>`).join('')}
      </ul>
    `, 'Additional Information') : ''}

    ${primaryButton('View Admin Dashboard', `${siteUrl}/admin`, 'Visit admin dashboard to review operation')}

    ${section(`
      <p style="font-size: ${FONT_SIZES.sm}; color: #666666; margin: 20px 0 0 0; line-height: 1.6; text-align: center;">
        This is an automated report for administrative bulk operations.
      </p>
    `)}

    ${divider()}
    ${emailFooter()}
  `

  const html = emailWrapper(content, preheader)
  const text = generatePlainText(html)

  return { html, text, subject }
}
