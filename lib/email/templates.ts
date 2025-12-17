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
  section,
  BRAND_COLORS,
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
  const subject = '✅ Welcome to CARE Collective - Please Confirm Your Email'

  const preheader = 'Your application has been approved! Confirm your email to get started.'

  const content = `
    ${emailHeader()}

    ${section(`
      <h2 style="color: ${BRAND_COLORS.navy}; font-size: 24px; font-weight: 700; margin: 0 0 16px 0; line-height: 1.3;">
        Congratulations, ${name}! 🎉
      </h2>
      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
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
  const urgencyPrefix = urgency === 'critical' ? '🚨 URGENT' : urgency === 'urgent' ? '⚠️ Time-Sensitive' : ''
  const subject = urgencyPrefix
    ? `${urgencyPrefix}: ${requestTitle}`
    : `New Help Request: ${requestTitle}`

  const preheader = `A community member needs help with: ${requestTitle}`

  // Urgency styling
  const urgencyColors = {
    critical: '#DC3545',
    urgent: '#FF8C00',
    normal: BRAND_COLORS.sage,
  }

  const urgencyLabels = {
    critical: '🚨 CRITICAL - Immediate assistance needed',
    urgent: '⚠️ URGENT - Time-sensitive request',
    normal: 'Help request from your community',
  }

  const urgencyColor = urgencyColors[urgency]
  const urgencyLabel = urgencyLabels[urgency]

  // Category badge
  const categoryDisplay = category.charAt(0).toUpperCase() + category.slice(1)

  const content = `
    ${emailHeader()}

    ${section(`
      <h2 style="color: ${BRAND_COLORS.navy}; font-size: 22px; font-weight: 700; margin: 0 0 12px 0; line-height: 1.3;">
        Hi ${helperName}! 👋
      </h2>
      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
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
      <h3 style="color: ${BRAND_COLORS.navy}; font-size: 20px; font-weight: 700; margin: 0 0 12px 0; line-height: 1.3;">
        ${requestTitle}
      </h3>
      <p style="margin: 0 0 15px 0; display: inline-block; background-color: ${BRAND_COLORS.tan}; color: #FFFFFF; padding: 6px 12px; border-radius: 4px; font-size: 13px; font-weight: 600;">
        ${categoryDisplay}
      </p>
      <p style="margin: 15px 0 0 0; font-size: 14px; color: ${BRAND_COLORS.brown};">
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
    high: '🚨',
    medium: '⚠️',
    low: 'ℹ️',
  }

  const icon = severityIcons[severity]
  const subject = `${icon} Moderation Alert: ${reportReason} (${severity.toUpperCase()} priority)`

  const preheader = `${severity.toUpperCase()} priority content report requires review`

  // Truncate message preview if too long
  const truncatedPreview = messagePreview.length > 200
    ? messagePreview.substring(0, 200) + '...'
    : messagePreview

  const content = `
    ${emailHeader()}

    ${section(`
      <h2 style="color: ${BRAND_COLORS.navy}; font-size: 22px; font-weight: 700; margin: 0 0 12px 0; line-height: 1.3;">
        ${icon} Content Moderation Alert
      </h2>
      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
        A ${severity} priority content report requires your immediate attention.
      </p>
    `)}

    ${alertBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size: 15px; color: ${BRAND_COLORS.brown};">
        <tr>
          <td style="padding: 8px 0; font-weight: 600; width: 140px;">Report ID:</td>
          <td style="padding: 8px 0;">${reportId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600;">Message ID:</td>
          <td style="padding: 8px 0;">${messageId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600;">Violation Type:</td>
          <td style="padding: 8px 0;">${reportReason}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600;">Severity:</td>
          <td style="padding: 8px 0;"><strong style="text-transform: uppercase;">${severity}</strong></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600;">Reported By:</td>
          <td style="padding: 8px 0;">${reporterEmail}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600;">Message Sender:</td>
          <td style="padding: 8px 0;">${messageSender}</td>
        </tr>
      </table>
    `, severity, 'Report Details')}

    ${infoBox(`
      <h4 style="margin: 0 0 10px 0; font-size: 16px; font-weight: 600; color: ${BRAND_COLORS.terracotta};">
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

    ${emailFooter()}
  `

  const html = emailWrapper(content, preheader)
  const text = generatePlainText(html)

  return { html, text, subject }
}
