import { ReactElement, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Color mappings to CSS custom properties
 * Using theme colors defined in globals.css @theme block
 */
const COLOR_MAP = {
  cream: 'var(--color-background)',
  sage: 'var(--color-sage)',
  'sage-light': 'var(--color-sage-light)',
  'sage-dark': 'var(--color-sage-dark)',
  'dusty-rose': 'var(--color-dusty-rose)',
  navy: 'var(--color-navy)',
} as const

export interface SectionBackgroundProps {
  /** Background style variant */
  variant: 'solid' | 'gradient' | 'subtle'
  /** Base color for the background */
  color: keyof typeof COLOR_MAP
  /** Opacity for subtle variant (0-100) */
  opacity?: number
  /** Section content */
  children: ReactNode
  /** Additional CSS classes */
  className?: string
  /** Section ID for navigation anchors */
  id?: string
  /** Whether to add relative positioning for dividers */
  hasTopDivider?: boolean
  /** Whether to add bottom padding for dividers */
  hasBottomDivider?: boolean
  /** Divider height to account for in padding */
  dividerHeight?: 'sm' | 'md' | 'lg'
}

/**
 * Divider height values in pixels for padding calculations
 */
const DIVIDER_PADDING = {
  sm: 24,
  md: 48,
  lg: 80,
} as const

/**
 * SectionBackground - Consistent section background wrapper
 * 
 * Provides a unified way to apply background colors, gradients, and
 * subtle overlays to page sections. Handles divider spacing and
 * maintains consistent z-index layering.
 * 
 * @example
 * // Solid sage background
 * <SectionBackground variant="solid" color="sage">
 *   <div>Section content</div>
 * </SectionBackground>
 * 
 * @example
 * // Subtle dusty-rose with 15% opacity
 * <SectionBackground 
 *   variant="subtle" 
 *   color="dusty-rose" 
 *   opacity={15}
 *   hasTopDivider
 *   dividerHeight="md"
 * >
 *   <div>Section content</div>
 * </SectionBackground>
 */
export function SectionBackground({
  variant,
  color,
  opacity = 20,
  children,
  className,
  id,
  hasTopDivider = false,
  hasBottomDivider = false,
  dividerHeight = 'md',
}: SectionBackgroundProps): ReactElement {
  const baseColor = COLOR_MAP[color]
  const topPadding = hasTopDivider ? DIVIDER_PADDING[dividerHeight] : 0
  const bottomPadding = hasBottomDivider ? DIVIDER_PADDING[dividerHeight] : 0
  
  // Calculate background style based on variant
  const getBackgroundStyle = (): React.CSSProperties => {
    switch (variant) {
      case 'solid':
        return { backgroundColor: baseColor }
      case 'gradient':
        // Gradient from color to slightly lighter version
        return {
          background: `linear-gradient(180deg, ${baseColor} 0%, ${baseColor}CC 100%)`,
        }
      case 'subtle':
        // Use opacity for subtle background
        // Convert opacity percentage to hex alpha
        const alphaHex = Math.round((opacity / 100) * 255).toString(16).padStart(2, '0')
        return {
          backgroundColor: `${baseColor}${alphaHex}`,
        }
      default:
        return {}
    }
  }

  return (
    <div
      id={id}
      className={cn(
        'relative overflow-hidden',
        className
      )}
      style={{
        ...getBackgroundStyle(),
        paddingTop: topPadding,
        paddingBottom: bottomPadding,
      }}
    >
      {/* Content wrapper with proper z-index */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

export default SectionBackground
