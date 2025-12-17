/**
 * Email Utilities for CARE Collective
 * Plain text generation, validation, and color contrast verification
 */

/**
 * Generate plain text version from HTML email
 * Preserves structure and converts links to readable format
 */
export function generatePlainText(html: string): string {
  let text = html

  // Remove email wrapper DOCTYPE and HTML tags
  text = text.replace(/<!DOCTYPE[^>]*>/gi, '')
  text = text.replace(/<html[^>]*>/gi, '')
  text = text.replace(/<\/html>/gi, '')
  text = text.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
  text = text.replace(/<body[^>]*>/gi, '')
  text = text.replace(/<\/body>/gi, '')

  // Convert links to [Text](URL) format
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '$2 ($1)')

  // Convert headings to text with visual separation
  text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n\n=== $1 ===\n')
  text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n\n== $1 ==\n')
  text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n\n-- $1 --\n')

  // Convert paragraphs to text with line breaks
  text = text.replace(/<p[^>]*>/gi, '\n')
  text = text.replace(/<\/p>/gi, '\n')

  // Convert line breaks
  text = text.replace(/<br\s*\/?>/gi, '\n')

  // Convert list items
  text = text.replace(/<li[^>]*>/gi, '\n• ')
  text = text.replace(/<\/li>/gi, '')

  // Convert horizontal rules
  text = text.replace(/<hr[^>]*>/gi, '\n-----------------------------------\n')

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]*>/g, '')

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/&#39;/g, "'")

  // Normalize whitespace
  text = text.replace(/[ \t]+/g, ' ') // Multiple spaces/tabs to single space
  text = text.replace(/\n[ \t]+/g, '\n') // Remove leading spaces on lines
  text = text.replace(/[ \t]+\n/g, '\n') // Remove trailing spaces on lines
  text = text.replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines

  // Trim and ensure consistent line endings
  text = text.trim()

  return text
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean
  warnings: string[]
  errors: string[]
}

/**
 * Validate email template for accessibility and best practices
 * Returns warnings and errors for review
 */
export function validateEmailTemplate(html: string): ValidationResult {
  const warnings: string[] = []
  const errors: string[] = []

  // Check max width (should be 600px)
  if (!html.includes('max-width: 600px')) {
    warnings.push('Email should have max-width: 600px for optimal display')
  }

  // Check for external CSS (not allowed)
  if (html.includes('<link') && html.includes('stylesheet')) {
    errors.push('External stylesheets detected - use inline CSS only')
  }

  if (html.includes('<style>') || html.includes('<style ')) {
    warnings.push('Style tags detected - inline CSS is more reliable across email clients')
  }

  // Check for inline JavaScript (not allowed)
  if (html.includes('<script') || html.includes('javascript:')) {
    errors.push('JavaScript detected - not supported in email')
  }

  // Check for proper DOCTYPE
  if (!html.includes('<!DOCTYPE html>')) {
    warnings.push('Missing DOCTYPE declaration')
  }

  // Check for table-based layout (recommended for email)
  if (!html.includes('<table')) {
    warnings.push('Table-based layout recommended for email client compatibility')
  }

  // Check for proper role attributes
  if (html.includes('<table') && !html.includes('role="presentation"')) {
    warnings.push('Tables should have role="presentation" for accessibility')
  }

  // Check for minimum font sizes (14px minimum)
  const fontSizeMatches = html.match(/font-size:\s*(\d+)px/g)
  if (fontSizeMatches) {
    fontSizeMatches.forEach((match) => {
      const size = parseInt(match.match(/\d+/)?.[0] || '0')
      if (size > 0 && size < 14) {
        warnings.push(`Font size ${size}px is below recommended minimum of 14px`)
      }
    })
  }

  // Check for button/touch target sizing (44px minimum)
  const minHeightMatches = html.match(/min-height:\s*(\d+)px/g)
  if (minHeightMatches) {
    minHeightMatches.forEach((match) => {
      const size = parseInt(match.match(/\d+/)?.[0] || '0')
      if (size > 0 && size < 44) {
        warnings.push(`Touch target ${size}px height is below minimum of 44px`)
      }
    })
  }

  // Check for alt text on images (if any images present)
  const imgMatches = html.match(/<img[^>]*>/g)
  if (imgMatches) {
    imgMatches.forEach((img) => {
      if (!img.includes('alt=')) {
        errors.push('Image missing alt attribute for accessibility')
      }
    })
  }

  // Check for proper semantic HTML
  if (!html.includes('<h1') && !html.includes('<h2') && !html.includes('<h3')) {
    warnings.push('No heading tags found - use semantic headings for accessibility')
  }

  const valid = errors.length === 0
  return { valid, warnings, errors }
}

/**
 * Calculate relative luminance for WCAG contrast ratio
 * Based on WCAG 2.1 formula
 */
function getRelativeLuminance(rgb: number[]): number {
  const [r, g, b] = rgb.map((val) => {
    const sRGB = val / 255
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4)
  })

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Convert hex color to RGB array
 */
function hexToRgb(hex: string): number[] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : null
}

/**
 * Calculate WCAG contrast ratio between two colors
 * Returns ratio (e.g., 4.5 for 4.5:1)
 * WCAG AA requires 4.5:1 for normal text, 3:1 for large text
 */
export function colorContrast(foreground: string, background: string): number {
  const fgRgb = hexToRgb(foreground)
  const bgRgb = hexToRgb(background)

  if (!fgRgb || !bgRgb) {
    throw new Error('Invalid hex color format')
  }

  const fgLuminance = getRelativeLuminance(fgRgb)
  const bgLuminance = getRelativeLuminance(bgRgb)

  const lighter = Math.max(fgLuminance, bgLuminance)
  const darker = Math.min(fgLuminance, bgLuminance)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check if color contrast meets WCAG AA standards
 * @param foreground - Foreground color (hex)
 * @param background - Background color (hex)
 * @param isLargeText - True for 18px+ or 14px+ bold text
 * @returns Object with pass status and contrast ratio
 */
export function meetsWCAG_AA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): { pass: boolean; ratio: number; required: number } {
  const ratio = colorContrast(foreground, background)
  const required = isLargeText ? 3.0 : 4.5

  return {
    pass: ratio >= required,
    ratio: Math.round(ratio * 100) / 100,
    required,
  }
}
