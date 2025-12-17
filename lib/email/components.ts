/**
 * Email Components for CARE Collective
 * Reusable HTML components with WCAG 2.1 AA accessibility compliance
 * All components use inline CSS for email client compatibility
 */

// Brand Colors (WCAG 2.1 AA verified)
export const BRAND_COLORS = {
  sage: '#5A7E79',           // Primary actions - WCAG AA compliant
  sageLight: '#A3C4BF',      // Accents in Navy footer
  dustyRose: '#D8A8A0',      // Secondary accent
  terracotta: '#BC6547',     // Critical Alerts
  navy: '#324158',           // Headings & Footer
  tan: '#C39778',            // Warnings
  cream: '#FBF2E9',          // Email Background
  brown: '#483129',          // Body text
} as const

// Font stack matching website (Overlock) with safe fallbacks
export const FONT_FAMILY = "'Overlock', 'Helvetica Neue', Helvetica, Arial, sans-serif"

// Font Sizes (Refined for readability)
export const FONT_SIZES = {
  xs: '14px',
  sm: '16px',
  base: '18px',     // Increased from 16px
  lg: '20px',
  xl: '24px',
  xxl: '30px',
  display: '36px',
} as const

/**
 * Email wrapper component
 * Provides consistent max-width, background, and preheader text
 */
export function emailWrapper(content: string, preheader?: string): string {
  const preheaderHTML = preheader
    ? `<div style="display: none; max-height: 0px; overflow: hidden;">${preheader}</div>`
    : ''

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>CARE Collective</title>
      <!-- Load Website Font -->
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Overlock:ital,wght@0,400;0,700;0,900;1,400&display=swap" rel="stylesheet">
      <style>
        /* Reset styles */
        body {
          margin: 0;
          padding: 0;
          width: 100% !important;
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
          font-family: ${FONT_FAMILY};
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: ${BRAND_COLORS.cream};">
      ${preheaderHTML}
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${BRAND_COLORS.cream};">
        <tr>
          <td align="center" style="padding: 20px 10px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #FFFFFF;">
              <tr>
                <td style="padding: 0;">
                  ${content}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

/**
 * Email header component
 * Text-based "CARE Collective" branding
 */
export function emailHeader(logoText: string = 'CARE Collective'): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="background-color: ${BRAND_COLORS.sage}; padding: 30px 30px; text-align: center; border-bottom: 4px solid ${BRAND_COLORS.dustyRose};">
          <h1 style="margin: 0; font-family: ${FONT_FAMILY}; font-size: ${FONT_SIZES.xxl}; font-weight: 900; color: #FFFFFF; line-height: 1.2; letter-spacing: 0.5px;">
            ${logoText}
          </h1>
          <p style="margin: 8px 0 0 0; font-family: ${FONT_FAMILY}; font-size: ${FONT_SIZES.sm}; color: #FFFFFF; opacity: 0.95; font-weight: 600;">
            Community Aid & Resource Exchange
          </p>
        </td>
      </tr>
    </table>
  `
}

/**
 * Email footer component
 * Contact info, privacy policy, copyright
 */
export function emailFooter(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://swmocarecollective.com'

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="padding: 40px 30px; background-color: ${BRAND_COLORS.navy}; color: #FFFFFF;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <!-- Top Section: 2 Columns on Mobile, 4 on Desktop (Simulation via nested tables for email support) -->
            <tr>
              <td style="vertical-align: top; padding-bottom: 24px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <!-- Column 1: Brand -->
                    <td style="vertical-align: top; padding-bottom: 24px; padding-right: 16px; width: 50%;">
                      <h3 style="margin: 0 0 12px 0; font-family: ${FONT_FAMILY}; font-size: ${FONT_SIZES.sm}; font-weight: 800; color: ${BRAND_COLORS.sageLight}; text-transform: uppercase; letter-spacing: 0.5px;">CARE Collective</h3>
                      <p style="margin: 0; font-family: ${FONT_FAMILY}; font-size: ${FONT_SIZES.xs}; color: #FFFFFF; opacity: 0.8; line-height: 1.5;">
                        Community mutual support for Southwest Missouri
                      </p>
                    </td>
                    <!-- Column 2: Contact -->
                    <td style="vertical-align: top; padding-bottom: 24px; width: 50%;">
                      <h3 style="margin: 0 0 12px 0; font-family: ${FONT_FAMILY}; font-size: ${FONT_SIZES.sm}; font-weight: 800; color: ${BRAND_COLORS.sageLight}; text-transform: uppercase; letter-spacing: 0.5px;">Contact</h3>
                      <p style="margin: 0; font-family: ${FONT_FAMILY}; font-size: ${FONT_SIZES.xs}; color: #FFFFFF; opacity: 0.8; line-height: 1.6;">
                        Dr. Maureen Templeman<br>
                        Springfield, MO<br>
                        <a href="mailto:swmocarecollective@gmail.com" style="color: #FFFFFF; text-decoration: none; opacity: 0.8;">swmocarecollective@gmail.com</a>
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <!-- Column 3: Get Started -->
                    <td style="vertical-align: top; padding-bottom: 24px; padding-right: 16px; width: 50%;">
                      <h3 style="margin: 0 0 12px 0; font-family: ${FONT_FAMILY}; font-size: ${FONT_SIZES.sm}; font-weight: 800; color: ${BRAND_COLORS.sageLight}; text-transform: uppercase; letter-spacing: 0.5px;">Get Started</h3>
                      <p style="margin: 0; font-family: ${FONT_FAMILY}; font-size: ${FONT_SIZES.xs}; line-height: 1.6;">
                        <a href="${siteUrl}/signup" style="color: #FFFFFF; text-decoration: none; opacity: 0.8; display: block; margin-bottom: 4px;">Join Community</a>
                        <a href="${siteUrl}/login" style="color: #FFFFFF; text-decoration: none; opacity: 0.8; display: block;">Member Login</a>
                      </p>
                    </td>
                    <!-- Column 4: Resources -->
                    <td style="vertical-align: top; padding-bottom: 24px; width: 50%;">
                      <h3 style="margin: 0 0 12px 0; font-family: ${FONT_FAMILY}; font-size: ${FONT_SIZES.sm}; font-weight: 800; color: ${BRAND_COLORS.sageLight}; text-transform: uppercase; letter-spacing: 0.5px;">Resources</h3>
                      <p style="margin: 0; font-family: ${FONT_FAMILY}; font-size: ${FONT_SIZES.xs}; line-height: 1.6;">
                        <a href="${siteUrl}/help" style="color: #FFFFFF; text-decoration: none; opacity: 0.8; display: block; margin-bottom: 4px;">Help & Support</a>
                        <a href="${siteUrl}/terms" style="color: #FFFFFF; text-decoration: none; opacity: 0.8; display: block; margin-bottom: 4px;">Terms of Service</a>
                        <a href="${siteUrl}/privacy-policy" style="color: #FFFFFF; text-decoration: none; opacity: 0.8; display: block;">Privacy Policy</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Copyright -->
            <tr>
              <td style="padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.2); text-align: center;">
                <p style="margin: 0; font-family: ${FONT_FAMILY}; font-size: 12px; color: #FFFFFF; opacity: 0.6;">
                  © ${new Date().getFullYear()} CARE Collective - Southwest Missouri. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `
}

/**
 * Primary button component (Terracotta)
 * 44px minimum height for accessibility
 */
export function primaryButton(text: string, url: string, ariaLabel?: string): string {
  const label = ariaLabel || text

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td align="center" style="padding: 20px 30px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="background-color: ${BRAND_COLORS.terracotta}; border-radius: 8px; box-shadow: 0 4px 6px rgba(188, 101, 71, 0.25);">
                <a href="${url}"
                   aria-label="${label}"
                   style="display: inline-block; background-color: ${BRAND_COLORS.terracotta}; color: #FFFFFF; font-family: ${FONT_FAMILY}; font-size: ${FONT_SIZES.base}; font-weight: 800; text-decoration: none; padding: 16px 42px; border-radius: 8px; line-height: 1.5; text-align: center; letter-spacing: 0.5px;">
                  ${text}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `
}

/**
 * Secondary button component (Sage)
 * 44px minimum height for accessibility
 */
export function secondaryButton(text: string, url: string, ariaLabel?: string): string {
  const label = ariaLabel || text

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td align="center" style="padding: 20px 30px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="background-color: ${BRAND_COLORS.sage}; border-radius: 8px; box-shadow: 0 4px 6px rgba(122, 158, 153, 0.25);">
                <a href="${url}"
                   aria-label="${label}"
                   style="display: inline-block; background-color: ${BRAND_COLORS.sage}; color: #FFFFFF; font-family: ${FONT_FAMILY}; font-size: ${FONT_SIZES.base}; font-weight: 800; text-decoration: none; padding: 16px 42px; border-radius: 8px; line-height: 1.5; text-align: center; letter-spacing: 0.5px;">
                  ${text}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `
}

/**
 * Info box component (Cream background)
 * For neutral informational content
 */
export function infoBox(content: string, title?: string): string {
  const titleHTML = title
    ? `<h3 style="margin: 0 0 15px 0; font-family: ${FONT_FAMILY}; font-size: ${FONT_SIZES.lg}; font-weight: 800; color: ${BRAND_COLORS.navy}; line-height: 1.3;">${title}</h3>`
    : ''

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="padding: 20px 30px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="background-color: #FFFFFF; padding: 24px; border-radius: 8px; border-left: 5px solid ${BRAND_COLORS.navy}; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #F0F0F0;">
                ${titleHTML}
                <div style="font-family: ${FONT_FAMILY}; font-size: ${FONT_SIZES.base}; color: ${BRAND_COLORS.brown}; line-height: 1.6;">
                  ${content}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `
}

/**
 * Success box component (Sage background, white text)
 * For positive/congratulatory messages
 */
export function successBox(content: string, title?: string): string {
  const titleHTML = title
    ? `<h3 style="margin: 0 0 15px 0; font-family: ${FONT_FAMILY}; font-size: ${FONT_SIZES.lg}; font-weight: 800; color: #FFFFFF; line-height: 1.3;">${title}</h3>`
    : ''

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="padding: 20px 30px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="background-color: ${BRAND_COLORS.sage}; padding: 30px 24px; border-radius: 8px; text-align: center; box-shadow: 0 4px 8px rgba(122, 158, 153, 0.3);">
                ${titleHTML}
                <div style="font-family: ${FONT_FAMILY}; font-size: ${FONT_SIZES.base}; color: #FFFFFF; line-height: 1.6;">
                  ${content}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `
}

/**
 * Warning box component (Yellow background with border)
 * For warnings and suspension notices
 */
export function warningBox(content: string, title?: string): string {
  const titleHTML = title
    ? `<h3 style="margin: 0 0 15px 0; font-family: ${FONT_FAMILY}; font-size: ${FONT_SIZES.lg}; font-weight: 800; color: ${BRAND_COLORS.brown}; line-height: 1.3;">${title}</h3>`
    : ''

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="padding: 20px 30px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="background-color: #FFFFFF; padding: 20px; border-radius: 8px; border-left: 4px solid ${BRAND_COLORS.tan}; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #F0F0F0;">
                ${titleHTML}
                <div style="font-family: ${FONT_FAMILY}; font-size: ${FONT_SIZES.base}; color: ${BRAND_COLORS.brown}; line-height: 1.6;">
                  ${content}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `
}

/**
 * Alert box component (severity-based styling)
 * For moderation alerts and admin notifications
 */
export function alertBox(
  content: string,
  severity: 'high' | 'medium' | 'low',
  title?: string
): string {
  const severityColors = {
    high: BRAND_COLORS.terracotta,
    medium: BRAND_COLORS.tan,
    low: BRAND_COLORS.sage,
  }

  const severityIcons = {
    high: '🚨',
    medium: '⚠️',
    low: 'ℹ️',
  }

  const borderColor = severityColors[severity]
  const icon = severityIcons[severity]
  const titleText = title || `${icon} ${severity.toUpperCase()} Priority Alert`

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="padding: 20px 30px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="background-color: #FFFFFF; padding: 20px; border-radius: 8px; border-left: 4px solid ${borderColor}; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #F0F0F0;">
                <h3 style="margin: 0 0 15px 0; font-family: ${FONT_FAMILY}; font-size: 18px; font-weight: 600; color: ${BRAND_COLORS.navy}; line-height: 1.3;">
                  ${titleText}
                </h3>
                <div style="font-family: ${FONT_FAMILY}; font-size: ${FONT_SIZES.base}; color: ${BRAND_COLORS.brown}; line-height: 1.6;">
                  ${content}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `
}

/**
 * Section component
 * Generic content wrapper with consistent padding
 */
export function section(content: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="padding: 10px 30px;">
          <div style="font-family: ${FONT_FAMILY}; font-size: ${FONT_SIZES.base}; color: ${BRAND_COLORS.brown}; line-height: 1.6;">
            ${content}
          </div>
        </td>
      </tr>
    </table>
  `
}

/**
 * Divider component
 * Horizontal rule with Dusty Rose color
 */
export function divider(): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="padding: 0;">
          <hr style="border: none; border-top: 1px solid #DEE5E4; margin: 30px 0;">
        </td>
      </tr>
    </table>
  `
}
