import { ReactElement } from 'react'
import { cn } from '@/lib/utils'

/**
 * SVG path definitions for different divider variants
 * All paths are designed for a viewBox of "0 0 1440 80"
 * and scale responsively via preserveAspectRatio
 */
const DIVIDER_PATHS = {
  wave: 'M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z',
  curve: 'M0,60 Q720,0 1440,60 L1440,80 L0,80 Z',
  organic: 'M0,50 C180,70 360,20 540,45 C720,70 900,30 1080,55 C1260,80 1380,40 1440,50 L1440,80 L0,80 Z',
} as const

/**
 * Height values in pixels for divider sizes
 */
const DIVIDER_HEIGHTS = {
  sm: 24,
  md: 48,
  lg: 80,
} as const

export interface SectionDividerProps {
  /** Divider shape variant */
  variant?: 'wave' | 'curve' | 'organic'
  /** Position relative to section (top or bottom) */
  position: 'top' | 'bottom'
  /** Fill color - CSS color value or CSS custom property */
  fillColor: string
  /** Height of the divider */
  height?: 'sm' | 'md' | 'lg'
  /** Additional CSS classes */
  className?: string
}

/**
 * SectionDivider - Reusable SVG wave divider for section transitions
 * 
 * Creates smooth, organic transitions between page sections using
 * scalable SVG paths. Supports multiple variants and is fully
 * accessible (decorative element).
 * 
 * @example
 * // Wave divider at bottom of section
 * <SectionDivider 
 *   variant="wave" 
 *   position="bottom" 
 *   fillColor="var(--color-sage)" 
 * />
 * 
 * @example
 * // Curved divider at top with custom height
 * <SectionDivider 
 *   variant="curve" 
 *   position="top" 
 *   fillColor="#FBF2E9" 
 *   height="lg"
 * />
 */
export function SectionDivider({
  variant = 'wave',
  position,
  fillColor,
  height = 'md',
  className,
}: SectionDividerProps): ReactElement {
  const heightPx = DIVIDER_HEIGHTS[height]
  const path = DIVIDER_PATHS[variant]
  
  // For top position, flip the SVG vertically
  const transform = position === 'top' ? 'scale(1, -1)' : undefined
  
  return (
    <div
      className={cn(
        'absolute left-0 right-0 w-full overflow-hidden leading-[0]',
        position === 'top' ? 'top-0' : 'bottom-0',
        className
      )}
      style={{ height: heightPx }}
      aria-hidden="true"
    >
      <svg
        className="relative block w-full"
        style={{ 
          height: heightPx,
          transform,
          transformOrigin: 'center center',
        }}
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d={path}
          fill={fillColor}
        />
      </svg>
    </div>
  )
}

export default SectionDivider
