# Landing Page Hero Enhancements Plan

**Date:** December 24, 2025
**Priority:** High - User-facing critical page
**Status:** Ready for Implementation

---

## Overview

Comprehensive enhancement plan for the CARE Collective landing page hero section to make it stand out, pop, and be easily readable. All changes use CSS and simple React state - no external animation libraries required.

---

## User Requirements

| Requirement | Implementation |
|-------------|----------------|
| Hero section longer (next section below fold) | `min-h-[100vh]` |
| Text should stand out and pop | Animated gradient text with shimmer effect |
| Easily readable | Increased typography sizes using clamp() |
| Image and text horizontally centered | Remove `lg:text-left`, use `text-center` throughout |
| Mobile order: Image then text | Change `flex-col-reverse` to `flex-col` |

---

## User Preferences (Confirmed)

| Decision | Choice |
|----------|--------|
| Animation Style | **Shimmer** - gradient position moves continuously |
| Mouse Background | **Subtle** - 20% opacity |
| Magnetic Button Strength | **Subtle** - 0.25 pull strength |
| Framer Motion | **Not required** - CSS approach preferred |
| Mobile Order | **Image then text** - image appears first on mobile |

---

## Architecture

```
components/Hero.tsx (updated)
├── AnimatedGradientText (new) - CSS shimmer gradient for "CARE Collective"
├── MouseGradientBackground (new) - Subtle mouse-following gradient
├── MagneticButton (new) - CTA with subtle magnetic pull effect
├── HeroBackground (existing) - Enhanced blob animations
└── HeroImage (existing) - Unchanged
```

---

## Task 1: Create AnimatedGradientText Component

**File:** `components/AnimatedGradientText.tsx` (NEW)

**Purpose:** Replaces static "CARE Collective" HTML text with animated shimmer gradient

```tsx
'use client'
import { useState, useEffect } from 'react'

export default function AnimatedGradientText() {
  const [gradientPos, setGradientPos] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setGradientPos(prev => (prev + 0.5) % 100)
    }, 50) // 20fps = smooth, elegant shimmer

    return () => clearInterval(interval)
  }, [])

  return (
    <h1
      className="text-[clamp(56px,15vw,180px)] font-black uppercase tracking-tighter"
      style={{
        background: `linear-gradient(135deg, #5A7E79 ${gradientPos}%, #4A6B66 ${gradientPos + 50}%)`,
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundSize: '200% 200%',
        filter: 'drop-shadow(0 8px 16px rgba(90, 126, 121, 0.25))'
      }}
      aria-label="CARE Collective"
    >
      CARE Collective
    </h1>
  )
}
```

**Key Features:**
- 50ms interval = 20fps smooth animation (not jarring)
- Gradient moves from 0% → 100% and loops continuously
- Drop-shadow creates soft glow effect
- Uses brand colors (sage gradient: #5A7E79 → #4A6B66)
- Zero external dependencies
- Accessible with aria-label

---

## Task 2: Create MouseGradientBackground Component

**File:** `components/MouseGradientBackground.tsx` (NEW)

**Purpose:** Creates subtle premium feel with gradient that follows cursor

```tsx
'use client'
import { useState, useEffect } from 'react'

export default function MouseGradientBackground() {
  const [position, setPosition] = useState({ x: 50, y: 50 })

  useEffect(() => {
    let animationFrame: number

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100
      const y = (e.clientY / window.innerHeight) * 100

      cancelAnimationFrame(animationFrame)
      animationFrame = requestAnimationFrame(() => {
        setPosition({ x, y })
      })
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrame)
    }
  }, [])

  return (
    <div 
      className="absolute inset-0 opacity-20 pointer-events-none transition-all duration-700 ease-out"
      style={{
        background: `radial-gradient(circle at ${position.x}% ${position.y}%, #5A7E79 0%, transparent 50%)`,
      }}
      aria-hidden="true"
    />
  )
}
```

**Key Features:**
- 20% opacity = subtle, not distracting
- Gradient center follows cursor position
- Passive event listener = no scroll blocking
- requestAnimationFrame = smooth 60fps updates
- 700ms transition = smooth, not jittery
- aria-hidden for accessibility

---

## Task 3: Create MagneticButton Component

**File:** `components/MagneticButton.tsx` (NEW)

**Purpose:** Premium "magnetic" pull effect on CTA button

```tsx
'use client'
import { useRef, useState, useEffect, ReactNode } from 'react'

interface MagneticButtonProps {
  children: ReactNode
  className?: string
  pullStrength?: number
  href?: string
}

export default function MagneticButton({ 
  children, 
  className = '',
  pullStrength = 0.25,
  href
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLAnchorElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const button = buttonRef.current
    if (!button || !isHovered) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = button.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const x = e.clientX - centerX
      const y = e.clientY - centerY

      setPosition({
        x: x * pullStrength,
        y: y * pullStrength
      })
    }

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [isHovered, pullStrength])

  const handleMouseEnter = () => setIsHovered(true)
  const handleMouseLeave = () => {
    setIsHovered(false)
    setPosition({ x: 0, y: 0 })
  }

  return (
    <a
      ref={buttonRef}
      href={href}
      className={`inline-block transition-transform duration-200 ${className}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span 
        className="inline-flex items-center justify-center"
        style={{ 
          transform: `translate(${-position.x * 0.5}px, ${-position.y * 0.5}px)`,
          transition: 'transform 200ms ease-out'
        }}
      >
        {children}
      </span>
    </a>
  )
}
```

**Key Features:**
- 0.25 strength = subtle but noticeable magnetic pull
- Inner span maintains text clarity while container moves
- Smooth reset on mouse leave
- Uses anchor tag for href support
- TypeScript interfaces for type safety

---

## Task 4: Update Hero Component

**File:** `components/Hero.tsx`

### 4a. Imports (Add new components)

```tsx
import AnimatedGradientText from './AnimatedGradientText'
import MouseGradientBackground from './MouseGradientBackground'
import MagneticButton from './MagneticButton'
```

### 4b. Update Section Height (100vh)

**Line 92 - Change:**
```tsx
// FROM:
className="relative py-16 md:py-20 lg:py-24 bg-background min-h-[70vh] lg:min-h-[75vh] flex items-center overflow-hidden"

// TO:
className="relative py-20 md:py-24 lg:py-28 bg-background min-h-[100vh] flex items-center overflow-hidden"
```

### 4c. Reverse Mobile Order (Image First)

**Line 100 - Change:**
```tsx
// FROM:
<div className="flex flex-col-reverse lg:flex-row items-center gap-8 lg:gap-12 xl:gap-16">

// TO:
<div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 xl:gap-20">
```

**Note:** `flex-col` (not `flex-col-reverse`) means image appears first on mobile since it comes first in DOM order.

### 4d. Full Horizontal Centering

**Line 103 - Change:**
```tsx
// FROM:
<div className="flex-1 text-center lg:text-left">

// TO:
<div className="flex-1 text-center">
```

### 4e. Add MouseGradientBackground

**After line 95 (after HeroBackground), add:**
```tsx
<MouseGradientBackground />
```

### 4f. Replace Headline with AnimatedGradientText

**Lines 105-113 - Replace:**
```tsx
// FROM:
<div className="mb-4 md:mb-6 animate-fade-in-up">
  <p className="font-display text-[clamp(24px,4vw,48px)] text-brown font-medium tracking-tight mb-1 lg:mb-2">
    Southwest Missouri
  </p>
  <h1 className="text-[clamp(48px,12vw,140px)] font-black leading-[0.85] tracking-tighter text-sage-dark uppercase">
    CARE Collective
  </h1>
</div>

// TO:
<div className="mb-8 md:mb-10 animate-fade-in-up">
  <p className="font-display text-[clamp(28px,5vw,56px)] text-brown font-medium tracking-tight mb-2 lg:mb-4">
    Southwest Missouri
  </p>
  <AnimatedGradientText />
</div>
```

### 4g. Update CARE Acronym Typography

**Lines 117-122 - Change:**
```tsx
// FROM:
<div className="mb-4 md:mb-5 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
  <p className="text-[clamp(18px,2.5vw,32px)] text-brown/90 font-semibold tracking-wide">

// TO:
<div className="mb-6 md:mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
  <p className="text-[clamp(20px,3vw,36px)] text-brown/90 font-semibold tracking-wide">
```

### 4h. Update Description Typography

**Lines 127-132 - Change:**
```tsx
// FROM:
<div className="mb-6 md:mb-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
  <p className="text-[clamp(16px,2vw,22px)] text-foreground/80 max-w-2xl mx-auto lg:mx-0 leading-relaxed">

// TO:
<div className="mb-8 md:mb-10 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
  <p className="text-[clamp(18px,2.2vw,24px)] text-foreground/80 max-w-2xl mx-auto leading-relaxed">
```

**Note:** Removed `lg:mx-0` since we want full centering now.

### 4i. Update CTA Button with MagneticButton

**Lines 135-151 - Replace:**
```tsx
// FROM:
<div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
  <Link 
    href="/signup" 
    className="group w-full sm:w-auto inline-flex items-center justify-center bg-sage text-white px-8 py-4 md:px-10 md:py-5 text-lg md:text-xl font-bold rounded-full hover:bg-sage-dark transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 min-h-[56px] md:min-h-[60px]"
  >
    <span>Join Our Community</span>
    <svg ...>...</svg>
  </Link>
</div>

// TO:
<div className="mt-10 md:mt-12 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
  <MagneticButton
    href="/signup"
    className="group w-full sm:w-auto"
  >
    <span className="inline-flex items-center justify-center bg-sage text-white px-10 py-5 md:px-12 md:py-6 text-lg md:text-xl lg:text-2xl font-bold rounded-full hover:bg-sage-dark transition-all duration-300 hover:shadow-2xl ring-4 ring-white/20 min-h-[64px] md:min-h-[72px]">
      <span>Join Our Community</span>
      <svg 
        className="w-5 h-5 md:w-6 md:h-6 ml-3 group-hover:translate-x-1 transition-transform duration-300" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
    </span>
  </MagneticButton>
</div>
```

### 4j. Reorder Components (Image First on Mobile)

Since we're using `flex-col` (not `flex-col-reverse`), we need to swap the DOM order:

**New structure:**
```tsx
<div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 xl:gap-20">
  {/* Image - appears first on mobile, right on desktop */}
  <div className="animate-fade-in-up lg:animate-fade-in-right flex-shrink-0 lg:order-2" style={{ animationDelay: '150ms' }}>
    <HeroImage />
  </div>
  
  {/* Text Content - appears second on mobile, left on desktop */}
  <div className="flex-1 text-center lg:order-1">
    {/* ... text content ... */}
  </div>
</div>
```

**Note:** Using `lg:order-1` and `lg:order-2` keeps desktop layout as text-left, image-right.

---

## Task 5: Enhance Blob Animations

**File:** `app/globals.css`

**Add after existing blob animations (~line 410):**

```css
/* Enhanced blob animations with organic breathing effect */
@keyframes blob-float-organic {
  0%, 100% {
    transform: translate(0, 0) scale(1) rotate(0deg);
  }
  25% {
    transform: translate(12px, -10px) scale(1.02) rotate(3deg);
  }
  50% {
    transform: translate(8px, 8px) scale(1) rotate(-2deg);
  }
  75% {
    transform: translate(-10px, -6px) scale(1.01) rotate(1deg);
  }
}

.hero-blob-float-organic {
  animation: blob-float-organic 25s ease-in-out infinite;
}

/* Subtle pulse glow effect on blobs */
@keyframes gentle-pulse {
  0%, 100% {
    opacity: 0.15;
  }
  50% {
    opacity: 0.22;
  }
}

.hero-blob-pulse {
  animation: gentle-pulse 6s ease-in-out infinite;
}

/* Combine organic float with pulse */
.hero-blob-enhanced {
  animation: 
    blob-float-organic 25s ease-in-out infinite,
    gentle-pulse 6s ease-in-out infinite;
}

/* Reduced motion: disable enhanced animations */
@media (prefers-reduced-motion: reduce) {
  .hero-blob-float-organic,
  .hero-blob-pulse,
  .hero-blob-enhanced {
    animation: none !important;
  }
}
```

**Update Hero.tsx HeroBackground component:**

```tsx
{/* Large sage blob - top left */}
<div
  className="absolute -top-[10%] -left-[15%] w-[60%] h-[90%] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] bg-sage opacity-[0.15] hero-blob-enhanced"
  style={{ transform: 'rotate(-10deg)' }}
/>

{/* Dusty rose blob - bottom right */}
<div
  className="absolute bottom-[15%] right-[5%] w-[35%] h-[40%] rounded-[50%_50%_50%_50%/50%_50%_50%_50%] bg-dusty-rose opacity-[0.20] hero-blob-float-delayed hero-blob-pulse"
  style={{ transform: 'rotate(10deg)' }}
/>

{/* Small tan accent - right side (no pulse, too small) */}
<div
  className="absolute top-[25%] right-[8%] w-[12%] h-[18%] rounded-[50%_50%_50%_50%/60%_60%_40%_40%] bg-tan opacity-[0.12] hero-blob-float-slow"
  style={{ transform: 'rotate(-5deg)' }}
/>
```

---

## Implementation Order

### Sequence 1: Create New Components
1. Create `components/AnimatedGradientText.tsx`
2. Create `components/MouseGradientBackground.tsx`
3. Create `components/MagneticButton.tsx`

### Sequence 2: Update Hero Component
4. Update imports in `components/Hero.tsx`
5. Update section height to `min-h-[100vh]`
6. Change flex order for mobile (image first)
7. Add MouseGradientBackground component
8. Replace headline with AnimatedGradientText
9. Update typography sizes (larger clamp values)
10. Update spacing (increased margins)
11. Replace CTA with MagneticButton
12. Full horizontal centering (remove lg:text-left)

### Sequence 3: Enhance CSS
13. Add enhanced blob animations to `app/globals.css`
14. Update blob classes in Hero.tsx

### Sequence 4: Test & Verify
15. Run type-check and lint
16. Test on dev server
17. Verify mobile layout
18. Verify desktop layout
19. Check accessibility (reduced motion)

---

## Typography Size Comparison

| Element | Current | New | Change |
|---------|---------|-----|--------|
| "Southwest Missouri" | `clamp(24px,4vw,48px)` | `clamp(28px,5vw,56px)` | +4px min, +8px max |
| "CARE Collective" | `clamp(48px,12vw,140px)` | `clamp(56px,15vw,180px)` | +8px min, +40px max |
| CARE Acronym | `clamp(18px,2.5vw,32px)` | `clamp(20px,3vw,36px)` | +2px min, +4px max |
| Description | `clamp(16px,2vw,22px)` | `clamp(18px,2.2vw,24px)` | +2px min, +2px max |

---

## Spacing Comparison

| Element | Current | New | Reason |
|---------|---------|-----|--------|
| Headline container margin | `mb-4 md:mb-6` | `mb-8 md:mb-10` | More breathing room in 100vh |
| Acronym margin | `mb-4 md:mb-5` | `mb-6 md:mb-8` | Vertical rhythm |
| Description margin | `mb-6 md:mb-8` | `mb-8 md:mb-10` | Vertical rhythm |
| CTA margin | none | `mt-10 md:mt-12` | Visual separation |
| Gap between image/text | `gap-8 lg:gap-12` | `gap-10 lg:gap-16` | More space for 100vh |

---

## Files Summary

| File | Action | Description |
|------|--------|-------------|
| `components/AnimatedGradientText.tsx` | **CREATE** | Shimmer gradient text (~35 lines) |
| `components/MouseGradientBackground.tsx` | **CREATE** | Mouse-following gradient (~35 lines) |
| `components/MagneticButton.tsx` | **CREATE** | Magnetic pull CTA (~55 lines) |
| `components/Hero.tsx` | **MODIFY** | Height, order, centering, spacing |
| `app/globals.css` | **MODIFY** | Add enhanced blob animations |

**Total:** ~125 lines of new code, ~40 lines modified

---

## Testing Checklist

### Functionality
- [ ] Hero occupies full viewport (100vh)
- [ ] "What is CARE" section is below fold on load
- [ ] Gradient text animates (shimmer effect)
- [ ] Mouse gradient follows cursor
- [ ] CTA button has magnetic pull effect
- [ ] Blobs float and pulse organically

### Mobile
- [ ] Image appears first (before text)
- [ ] All content horizontally centered
- [ ] Touch interactions work
- [ ] No horizontal scroll

### Desktop
- [ ] Text on left, image on right
- [ ] All content horizontally centered
- [ ] Mouse effects work smoothly
- [ ] No layout jumps

### Accessibility
- [ ] Reduced motion preference respected
- [ ] Gradient text has aria-label
- [ ] Mouse background has aria-hidden
- [ ] Focus states visible on CTA
- [ ] Screen reader announces content correctly

### Performance
- [ ] No layout shift (CLS)
- [ ] Animations smooth (60fps)
- [ ] No excessive re-renders
- [ ] Bundle size unchanged (no new deps)

---

## Rollback Instructions

If any enhancement causes issues:

```bash
# Rollback all Hero changes
git checkout HEAD -- components/Hero.tsx

# Rollback new components (delete them)
rm components/AnimatedGradientText.tsx
rm components/MouseGradientBackground.tsx
rm components/MagneticButton.tsx

# Rollback CSS changes
git checkout HEAD -- app/globals.css
```

---

## Success Criteria

### Must-Have
- [ ] Hero is 100vh (next section below fold)
- [ ] All content horizontally centered
- [ ] Image appears first on mobile
- [ ] Text is readable and "pops"
- [ ] No accessibility regressions

### Should-Have
- [ ] Gradient shimmer animation smooth
- [ ] Mouse-following background subtle
- [ ] Magnetic CTA feels premium
- [ ] Enhanced blob animations organic

### Nice-to-Have
- [ ] All cross-browser testing passes
- [ ] Lighthouse score maintained (>90)

---

## References

- **Brand Colors:**
  - Sage: #5A7E79
  - Sage Dark: #4A6B66
  - Dusty Rose: #D8A8A0
  - Brown: #483129
  - Cream (background): #FBF2E9

- **Typography:**
  - Font: Overlock (brand font)
  - Font weight: 900 (font-black) for headlines

- **Animation Timing:**
  - Shimmer: 50ms interval (20fps)
  - Mouse gradient: requestAnimationFrame (60fps)
  - Blob float: 25s duration
  - Blob pulse: 6s duration

---

**End of Plan**
