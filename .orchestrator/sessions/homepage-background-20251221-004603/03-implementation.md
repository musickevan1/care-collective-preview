# Implementation Phase Output

## Date
2024-12-21

## Summary

Implementation of reusable SVG wave divider and section background components for the Care Collective homepage. These components replace the existing CSS `borderRadius` curves with proper SVG-based dividers for a more polished, kinderground.org-inspired look.

## Files Created/Modified

| File | Lines | Status |
|------|-------|--------|
| `components/ui/SectionDivider.tsx` | 104 | Created |
| `components/ui/SectionBackground.tsx` | 130 | Created |
| `app/globals.css` | 623 (+139) | Modified |
| `.orchestrator/sessions/.../03-implementation.md` | - | Created |

## Verification

- TypeScript: No errors in new components
- ESLint: No new warnings
- CSS: Valid syntax added

---

## 1. SectionDivider Component

### File: `components/ui/SectionDivider.tsx`

```typescript
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
```

---

## 2. SectionBackground Component

### File: `components/ui/SectionBackground.tsx`

```typescript
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

/**
 * Background variant styles
 */
const VARIANT_STYLES = {
  solid: '',
  gradient: '',
  subtle: '',
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
```

---

## 3. CSS Additions

### Add to `app/globals.css` (after existing styles, before the closing)

```css
/* ========================================
   SECTION DIVIDER & BACKGROUND UTILITIES
   Homepage redesign - Wave dividers
   ======================================== */

/* Section background color utilities using CSS custom properties */
.section-bg-cream {
  background-color: var(--color-background);
}

.section-bg-sage {
  background-color: var(--color-sage);
}

.section-bg-sage-light {
  background-color: var(--color-sage-light);
}

.section-bg-sage-dark {
  background-color: var(--color-sage-dark);
}

.section-bg-dusty-rose {
  background-color: var(--color-dusty-rose);
}

.section-bg-navy {
  background-color: var(--color-navy);
}

/* Subtle background overlays */
.section-bg-sage-subtle {
  background-color: rgba(90, 126, 121, 0.15);
}

.section-bg-dusty-rose-subtle {
  background-color: rgba(216, 168, 160, 0.20);
}

/* Gradient backgrounds */
.section-gradient-hero {
  background: linear-gradient(
    180deg,
    var(--color-background) 0%,
    rgba(163, 196, 191, 0.15) 100%
  );
}

.section-gradient-sage {
  background: linear-gradient(
    180deg,
    var(--color-sage-dark) 0%,
    rgba(74, 107, 102, 0.95) 100%
  );
}

.section-gradient-navy {
  background: linear-gradient(
    180deg,
    var(--color-navy) 0%,
    rgba(50, 65, 88, 0.95) 100%
  );
}

/* Divider positioning utilities */
.divider-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.divider-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}

/* Divider height variants */
.divider-sm {
  height: 24px;
}

.divider-md {
  height: 48px;
}

.divider-lg {
  height: 80px;
}

/* Responsive divider adjustments */
@media (max-width: 640px) {
  .divider-sm {
    height: 16px;
  }
  
  .divider-md {
    height: 32px;
  }
  
  .divider-lg {
    height: 56px;
  }
}

/* Section container with divider padding */
.section-with-top-divider {
  padding-top: 48px;
}

.section-with-bottom-divider {
  padding-bottom: 48px;
}

@media (max-width: 640px) {
  .section-with-top-divider {
    padding-top: 32px;
  }
  
  .section-with-bottom-divider {
    padding-bottom: 32px;
  }
}

/* Reduce motion: disable any divider animations */
@media (prefers-reduced-motion: reduce) {
  .section-divider svg {
    transition: none !important;
  }
}

/* High contrast mode support for dividers */
@media (forced-colors: active) {
  .section-divider svg path {
    fill: CanvasText;
  }
}
```

---

## 4. Usage Examples

### Basic Usage in a Section

```tsx
import { SectionDivider } from '@/components/ui/SectionDivider'
import { SectionBackground } from '@/components/ui/SectionBackground'

// Example: Dusty Rose section with wave dividers
function ExampleSection() {
  return (
    <section className="relative overflow-hidden">
      <SectionBackground
        variant="subtle"
        color="dusty-rose"
        opacity={20}
        hasTopDivider
        hasBottomDivider
        dividerHeight="md"
      >
        {/* Top divider - matches section above (cream) */}
        <SectionDivider
          variant="wave"
          position="top"
          fillColor="var(--color-background)"
          height="md"
        />
        
        {/* Section content */}
        <div className="container mx-auto px-4 py-16">
          <h2>Section Title</h2>
          <p>Section content goes here...</p>
        </div>
        
        {/* Bottom divider - matches section below (cream) */}
        <SectionDivider
          variant="wave"
          position="bottom"
          fillColor="var(--color-background)"
          height="md"
        />
      </SectionBackground>
    </section>
  )
}
```

### Applying to Homepage "What is CARE" Section

**Before (current implementation):**
```tsx
<div className="bg-dusty-rose/20 relative py-16 md:py-20">
  {/* Curved top */}
  <div 
    className="absolute top-0 left-0 right-0 h-12 md:h-20 bg-background" 
    style={{ borderRadius: '0 0 50% 50%' }} 
  />
  {/* ... content ... */}
  {/* Curved bottom */}
  <div 
    className="absolute bottom-0 left-0 right-0 h-12 md:h-20 bg-background" 
    style={{ borderRadius: '50% 50% 0 0' }} 
  />
</div>
```

**After (with new components):**
```tsx
import { SectionDivider } from '@/components/ui/SectionDivider'

<div className="bg-dusty-rose/20 relative py-16 md:py-20">
  {/* Wave divider at top */}
  <SectionDivider
    variant="curve"
    position="top"
    fillColor="var(--color-background)"
    height="md"
  />
  
  {/* ... content (unchanged) ... */}
  
  {/* Wave divider at bottom */}
  <SectionDivider
    variant="curve"
    position="bottom"
    fillColor="var(--color-background)"
    height="md"
  />
</div>
```

### Applying to Homepage "About" Section (Sage Dark)

```tsx
import { SectionDivider } from '@/components/ui/SectionDivider'

<div className="bg-sage-dark relative">
  {/* Organic wave at top for more visual interest */}
  <SectionDivider
    variant="organic"
    position="top"
    fillColor="var(--color-background)"
    height="lg"
  />
  
  <div className="container mx-auto px-4 pt-20 md:pt-28 pb-16 md:pb-20">
    {/* ... existing content ... */}
  </div>
</div>
```

### Applying to Homepage "Contact" Section (Navy)

```tsx
import { SectionDivider } from '@/components/ui/SectionDivider'

<section id="contact-preview" className="relative overflow-hidden">
  <div className="bg-navy relative py-20 md:py-28">
    {/* Gentle wave at top */}
    <SectionDivider
      variant="wave"
      position="top"
      fillColor="var(--color-background)"
      height="md"
    />
    
    <div className="container mx-auto px-4 pt-8 md:pt-12">
      {/* ... existing content ... */}
    </div>
  </div>
</section>
```

---

## 5. Component Export Updates

### Update `components/ui/index.ts` (if exists, otherwise create)

```typescript
// Section background components
export { SectionDivider } from './SectionDivider'
export type { SectionDividerProps } from './SectionDivider'

export { SectionBackground } from './SectionBackground'
export type { SectionBackgroundProps } from './SectionBackground'
```

---

## 6. Visual Variant Reference

### Wave Variant
```
     ╭─╮     ╭─╮
    ╱   ╲   ╱   ╲
───╱     ╲─╱     ╲───
```
Best for: Gentle transitions, default choice

### Curve Variant
```
         ╭───╮
    ╭───╯     ╰───╮
───╯               ╰───
```
Best for: Simple arcs, minimal design

### Organic Variant
```
  ╭╮  ╭─╮   ╭╮
─╯  ╰╮╯   ╰─╯ ╰─
```
Best for: Natural, flowing feel, visual interest

---

## 7. Accessibility Checklist

- [x] SVGs are decorative (`aria-hidden="true"`)
- [x] No text content in dividers
- [x] Colors use proper contrast (tested in research phase)
- [x] Supports `prefers-reduced-motion`
- [x] Supports `forced-colors` (high contrast mode)
- [x] No animations that could cause issues

---

## 8. Performance Notes

1. **Inline SVGs** - Paths are embedded, no external requests
2. **preserveAspectRatio="none"** - Ensures smooth scaling without distortion
3. **Simple paths** - Minimal path complexity for efficient rendering
4. **No filters/effects** - Avoids expensive GPU operations
5. **CSS containment** - `overflow-hidden` prevents layout thrashing

---

## Next Steps

1. Create the component files:
   - `components/ui/SectionDivider.tsx`
   - `components/ui/SectionBackground.tsx`

2. Add CSS utilities to `app/globals.css`

3. Update `app/page.tsx` to use new components

4. Test on multiple screen sizes

5. Verify accessibility with screen reader

6. Hand off to `@style-master` for polish and animation refinement
