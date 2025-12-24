# Homepage Cleanup & Polish Plan

**Date:** December 24, 2025
**Priority:** High - User-facing critical page
**Status:** Ready for Implementation

---

## Executive Summary

Comprehensive polish plan for CARE Collective homepage focusing on navigation reliability, visual consistency, performance optimization, and UX enhancements. All changes maintain WCAG 2.1 AA compliance and mobile-first design principles.

**Scope:** 5 major areas across 4 files
**Estimated Implementation Time:** 2-3 hours
**Risk Level:** Low (incremental, testable changes)

---

## User Preferences & Decisions

| Decision | Choice Selected | Rationale |
|----------|----------------|------------|
| Hero Image | **Option A** - Save iStock image locally | Maintains current approved design, removes external dependency |
| Back to Top | **Navbar Logo** becomes back-to-top button | Reuses existing element, minimal visual change |
| Scroll Indicator | **Option B** - Subtle progress bar (test-and-remove) | Low-risk, easy to disable if not needed |
| Typography Scaling | **Option A** - CSS clamp() for smooth scaling | Modern approach, smoother transitions, fewer breakpoints |

---

## Phase 1: Critical Fixes (Navigation & Scroll)

### Task 1.1: Fix Navbar Scroll Offset

**Priority:** CRITICAL - Affects all users
**File:** `hooks/useSmoothScroll.ts`

**Problem:**
- Fixed header height (64px) doesn't account for responsive padding variations
- JavaScript scroll calculation conflicts with CSS `scroll-padding-top` (80px)
- Sections misaligned on mobile/tablet viewports

**Solution:**
```typescript
// hooks/useSmoothScroll.ts
export function useSmoothScroll() {
  const handleSmoothScroll = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const href = e.currentTarget.getAttribute('href');

    if (href?.startsWith('#')) {
      e.preventDefault();
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        // DYNAMIC header height detection
        const header = document.querySelector('header.fixed');
        const headerHeight = header ? header.offsetHeight : 64;
        const buffer = 16;
        
        // Ensure minimum offset matches CSS scroll-padding-top
        const scrollOffset = Math.max(headerHeight + buffer, 80);

        const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - scrollOffset;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    }
  }, []);

  return handleSmoothScroll;
}
```

**Benefits:**
- Responsive header height calculation
- Consistent behavior across all viewports
- Matches CSS `scroll-padding-top` for native scrolling

**Testing:**
- [ ] Desktop (1024px+) - Test all nav links
- [ ] Tablet (768px-1023px) - Verify offset
- [ ] Mobile (<768px) - Test with mobile nav
- [ ] Manual scroll - Verify CSS `scroll-padding-top` works

---

### Task 1.2: Add Back-to-Top Functionality to Navbar Logo

**Priority:** MEDIUM - UX enhancement
**File:** `app/page.tsx`

**Problem:**
- No easy way to return to top when scrolled deep
- Standard pattern for long landing pages

**Solution:**
```tsx
// In homepage navbar (line ~100)
<Link
  href="#home"
  onClick={(e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }}
  className="flex items-center gap-2 sm:gap-3 flex-shrink-0"
  aria-label="Return to top"
>
  <Image
    src="/logo-textless.png"
    alt="CARE Collective Logo"
    width={48}
    height={48}
    className="rounded w-10 h-10 sm:w-12 sm:h-12"
    priority
    sizes="(max-width: 640px) 40px, 48px"
  />
  <span className="text-lg sm:text-xl font-bold truncate">CARE Collective</span>
</Link>
```

**Benefits:**
- Reuses existing logo element (no new UI)
- Same smooth scroll animation as nav links
- Improves navigation for long pages
- Accessible (proper `aria-label`)

**Considerations:**
- Only activates on homepage (other pages navigate to `/`)
- Uses same smooth scroll animation as other links

---

### Task 1.3: Add Subtle Scroll Progress Bar

**Priority:** LOW - Test-and-remove feature
**Files:** `app/globals.css`, `app/page.tsx`

**Problem:**
- No visual indicator of scroll position
- Users don't know how much content remains

**Solution:**
```tsx
// In app/page.tsx - Add after main tag
<div className="fixed top-16 left-0 right-0 h-1 bg-gradient-to-r from-sage via-dusty-rose to-sage z-[40] transition-all duration-300"
  style={{
    width: `${scrollProgress}%`,
    opacity: scrollProgress > 5 ? 1 : 0, // Only show after 5% scroll
  }}
  aria-hidden="true"
  role="presentation"
/>

// Add scroll tracking state
const [scrollProgress, setScrollProgress] = useState(0);

useEffect(() => {
  const handleScroll = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (scrollTop / docHeight) * 100;
    setScrollProgress(Math.min(progress, 100));
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

```css
/* In app/globals.css */
.scroll-progress-bar {
  transition: width 0.3s ease-out, opacity 0.3s ease-out;
}

/* Hide in reduced motion mode */
@media (prefers-reduced-motion: reduce) {
  .scroll-progress-bar {
    display: none;
  }
}
```

**Benefits:**
- Subtle visual feedback
- Easy to remove if not desired
- No impact on functionality

**Removal Instructions:**
If testing shows it's not adding value:
1. Remove `<div>` with scroll progress from `app/page.tsx`
2. Remove `useState` and `useEffect` for scroll tracking
3. Remove CSS from `app/globals.css`

---

## Phase 2: Hero Section Polish

### Task 2.1: Replace External Image with Local Image

**Priority:** HIGH - Performance & reliability
**Files:** `public/hero-image.jpg`, `components/Hero.tsx`

**Problem:**
- External iStock URL is slow (adds to LCP)
- Unreliable (could 404 or be removed)
- Not under our control

**Solution:**

**Step 1: Download and save image**
```bash
# Download current iStock image to public folder
# Image URL: https://media.istockphoto.com/id/863549736/photo/youre-in-my-hands-now.jpg?s=612x612&w=0&k=20&c=lZagU37KsLt3hEOKt5v1cAXCvRe-y1eMugsLtxZ_3Lk=

# Save as: public/hero-image.jpg
# Optimize: Compress to <200KB, maintain aspect ratio
```

**Step 2: Update Hero.tsx**
```tsx
// components/Hero.tsx
function HeroImage(): ReactElement {
  const [imageError, setImageError] = useState(false)

  // Use local image
  const heroImageUrl = '/hero-image.jpg'

  return (
    <div className="relative flex-shrink-0">
      <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-[320px] lg:h-[320px] xl:w-[360px] xl:h-[360px] 2xl:w-[400px] 2xl:h-[400px] rounded-full p-2 sm:p-2.5 md:p-3 lg:p-4 bg-gradient-to-br from-dusty-rose/70 via-dusty-rose/50 to-dusty-rose/30 shadow-2xl">
        <div className="w-full h-full rounded-full overflow-hidden bg-cream shadow-inner">
          {imageError ? (
            // Fallback UI (existing)
            <div className="w-full h-full flex items-center justify-center bg-sage/10">
              {/* Fallback icon */}
            </div>
          ) : (
            <img
              src={heroImageUrl}
              alt="Supportive hands holding - representing care and compassion"
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          )}
        </div>
      </div>
      {/* Accent circle */}
      <div
        className="absolute -bottom-3 -left-3 w-16 h-16 md:w-20 md:h-20 rounded-full bg-sage/20 -z-10"
        aria-hidden="true"
      />
    </div>
  )
}
```

**Benefits:**
- Faster load times (no external request)
- Reliable (no 404 risk)
- Under our control
- Better LCP score

**Fallback:**
- Existing error handling remains
- Falls back to icon with "Caring Together" text

---

### Task 2.2: Improve Typography Scaling with clamp()

**Priority:** HIGH - Visual consistency
**File:** `components/Hero.tsx`

**Problem:**
- Current typography has abrupt jumps between breakpoints
- `text-5xl` → `text-6xl` → `text-7xl` → `text-[140px]` → `text-[180px]` → `text-[220px]`
- Can overflow horizontally on smaller desktop monitors
- Breaks readability at intermediate sizes

**Solution:**
```tsx
// components/Hero.tsx - Hero headline
<div className="mb-4 md:mb-6 animate-fade-in-up">
  {/* "Southwest Missouri" - smaller, lighter weight */}
  <p className="font-display text-[clamp(24px,4vw,48px)] text-brown font-medium tracking-tight mb-1 lg:mb-2">
    Southwest Missouri
  </p>
  {/* "CARE Collective" - MASSIVE, ultra bold */}
  <h1 className="text-[clamp(48px,12vw,140px)] font-black leading-[0.85] tracking-tighter text-sage-dark uppercase">
    CARE Collective
  </h1>
</div>

{/* CARE Acronym */}
<div className="mb-4 md:mb-5 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
  <p className="text-[clamp(18px,2.5vw,32px)] text-brown/90 font-semibold tracking-wide">
    <span className="font-bold text-sage-dark">C</span>aregiver{' '}
    <span className="font-bold text-sage-dark">A</span>ssistance and{' '}
    <span className="font-bold text-sage-dark">R</span>esource{' '}
    <span className="font-bold text-sage-dark">E</span>xchange
  </p>
</div>

{/* Description */}
<div className="mb-6 md:mb-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
  <p className="text-[clamp(16px,2vw,22px)] text-foreground/80 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
    A network of family caregivers in Southwest Missouri who support
    each other through practical help and shared resources.
  </p>
</div>
```

**Clamp Breakdown:**
| Element | Old Approach | New Approach | Result |
|----------|---------------|---------------|---------|
| "Southwest Missouri" | `text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl` | `text-[clamp(24px,4vw,48px)]` | 24px-48px smooth |
| "CARE Collective" | `text-5xl sm:text-6xl md:text-7xl lg:text-[140px] xl:text-[180px] 2xl:text-[220px]` | `text-[clamp(48px,12vw,140px)]` | 48px-140px smooth |
| CARE Acronym | `text-xl sm:text-2xl md:text-3xl lg:text-[28px] xl:text-[32px]` | `text-[clamp(18px,2.5vw,32px)]` | 18px-32px smooth |
| Description | `text-lg sm:text-xl md:text-2xl lg:text-[22px] xl:text-2xl` | `text-[clamp(16px,2vw,22px)]` | 16px-22px smooth |

**Benefits:**
- Smooth scaling across all viewport widths
- No abrupt jumps
- Prevents horizontal overflow
- Modern CSS approach
- Better typography rhythm

---

### Task 2.3: Add Blob Floating Animations

**Priority:** MEDIUM - Visual polish
**File:** `components/Hero.tsx`

**Problem:**
- Animation classes defined in CSS but not applied to blob elements
- Blobs are static
- Missed opportunity for visual polish

**Solution:**
```tsx
// components/Hero.tsx - HeroBackground component
function HeroBackground(): ReactElement {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {/* Base cream background */}
      <div className="absolute inset-0 bg-background" />

      {/* Large sage blob - top left */}
      <div
        className="absolute -top-[10%] -left-[15%] w-[60%] h-[90%] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] bg-sage opacity-[0.15] hero-blob-float"
        style={{ transform: 'rotate(-10deg)' }}
      />

      {/* Dusty rose blob - bottom right */}
      <div
        className="absolute bottom-[15%] right-[5%] w-[35%] h-[40%] rounded-[50%_50%_50%_50%/50%_50%_50%_50%] bg-dusty-rose opacity-[0.20] hero-blob-float-delayed"
        style={{ transform: 'rotate(10deg)' }}
      />

      {/* Small tan accent - right side */}
      <div
        className="absolute top-[25%] right-[8%] w-[12%] h-[18%] rounded-[50%_50%_50%_50%/60%_60%_40%_40%] bg-tan opacity-[0.12] hero-blob-float-slow"
        style={{ transform: 'rotate(-5deg)' }}
      />
    </div>
  )
}
```

**Animation Details:**
- `hero-blob-float`: 20s ease-in-out infinite (sage blob)
- `hero-blob-float-delayed`: 25s with 5s delay (dusty rose)
- `hero-blob-float-slow`: 30s with 10s delay (tan accent)

**Respects Reduced Motion:**
```css
/* Already in app/globals.css */
@media (prefers-reduced-motion: reduce) {
  .hero-blob-float,
  .hero-blob-float-delayed,
  .hero-blob-float-slow {
    animation: none !important;
  }
}
```

**Benefits:**
- Gentle, organic movement
- Enhanced visual interest
- Still respects accessibility preferences

---

### Task 2.4: Standardize Hero Height

**Priority:** MEDIUM - Layout consistency
**File:** `components/Hero.tsx`

**Problem:**
- Inconsistent height across breakpoints
- Mobile: `py-12` (48px top/bottom)
- Desktop: `lg:pt-28 lg:pb-8` + `min-h-[80vh]`
- Creates jumpy layouts

**Solution:**
```tsx
// components/Hero.tsx - Hero section
export default function Hero(): ReactElement {
  return (
    <section
      id="home"
      className="relative py-16 md:py-20 lg:py-24 bg-background min-h-[70vh] lg:min-h-[75vh] flex items-center overflow-hidden"
    >
      {/* Rest of hero content */}
    </section>
  )
}
```

**Consistent Padding:**
- Mobile: `py-16` (64px)
- Tablet: `md:py-20` (80px)
- Desktop: `lg:py-24` (96px)

**Minimum Height:**
- Mobile/Tablet: `min-h-[70vh]`
- Desktop: `lg:min-h-[75vh]`

**Benefits:**
- Balanced hero section on all viewports
- Consistent visual impact
- No jumpy transitions

---

## Phase 3: Visual Polish & Consistency

### Task 3.1: Standardize Section Spacing

**Priority:** MEDIUM - Visual rhythm
**File:** `app/page.tsx`

**Problem:**
- Inconsistent section padding:
  - "What is CARE": `py-16 md:py-20`
  - About: `py-16 md:py-20`
  - What's Happening: `py-16 md:py-20`
  - Resources: `py-20 md:py-28`

**Solution:**
```tsx
// Apply consistent spacing to all section title areas
// Pattern: py-16 md:py-20 for all sections
// Except Resources preview (keep py-20 md:py-28 as it has less content)

// Example for "What is CARE" section (line ~156)
<section id="what-is-care" className="relative">
  {/* Section Title */}
  <div className="py-16 md:py-20 relative z-10">
    <div className="container mx-auto px-4">
      <h2 className="text-[clamp(32px,5vw,48px)] font-bold text-brown text-center uppercase tracking-wide">
        What is CARE Collective?
      </h2>
    </div>
  </div>
  {/* Rest of section */}
</section>
```

**Benefits:**
- Consistent visual rhythm
- Predictable spacing pattern
- Better reading experience

---

### Task 3.2: Enhance Card Hover Effects

**Priority:** LOW - Visual polish
**File:** `app/page.tsx`

**Problem:**
- Current hover lift is subtle: `hover:-translate-y-1`
- May not be noticeable on all devices
- No additional visual feedback

**Solution:**
```tsx
// Update card hover classes in all sections
// Pattern: hover:shadow-2xl hover:-translate-y-2 hover:bg-sage/[0.02]

// Example: "How It Works" card (line ~179)
<div
  id="how-it-works"
  className="bg-white rounded-3xl shadow-lg p-8 md:p-10 hover:shadow-2xl hover:-translate-y-2 hover:bg-sage/2 transition-all duration-300"
  role="region"
  aria-labelledby="how-it-works-heading"
>
  {/* Card content */}
</div>
```

**Benefits:**
- More pronounced hover effect
- Subtle background tint for additional feedback
- Consistent across all cards

---

### Task 3.3: Improve Wave Divider Visibility

**Priority:** LOW - Visual polish
**File:** `app/page.tsx`

**Problem:**
- All dividers use `height="md"` (48px)
- May not be prominent enough
- Mobile reduces to 32px (too subtle?)

**Solution:**
```tsx
// Change all dividers from height="md" to height="lg"
// Example: "What is CARE" section dividers (lines ~169, ~270)

<SectionDivider
  variant="curve"
  position="top"
  fillColor="var(--color-background)"
  height="lg"  // Changed from "md"
/>

<SectionDivider
  variant="curve"
  position="bottom"
  fillColor="var(--color-background)"
  height="lg"  // Changed from "md"
/>
```

**Height Comparison:**
| Height | Value | Mobile Responsive |
|--------|---------|-----------------|
| sm | 24px | 16px |
| md | 48px | 32px |
| lg | 80px | 56px |

**Benefits:**
- More prominent organic transitions
- Better visual separation between sections
- Still responsive on mobile

---

### Task 3.4: Update Section Title Typography

**Priority:** LOW - Consistency
**File:** `app/page.tsx`

**Problem:**
- Section titles don't use clamp for smooth scaling
- `text-4xl sm:text-5xl md:text-[48px]` is abrupt

**Solution:**
```tsx
// Apply clamp to all section titles
// Pattern: text-[clamp(32px,5vw,48px)] font-bold

// Example: "What is CARE" title (line ~160)
<h2 className="text-[clamp(32px,5vw,48px)] font-bold text-brown text-center uppercase tracking-wide">
  What is CARE Collective?
</h2>

// Example: "About" title (line ~284)
<h2 className="text-[clamp(32px,5vw,48px)] font-bold text-brown text-center uppercase tracking-wide">
  About CARE Collective
</h2>

// Example: "Resources" title (line ~438)
<h2 className="text-[clamp(32px,5vw,48px)] font-bold text-brown mb-6 uppercase tracking-wide">
  Community Resources
</h2>
```

**Benefits:**
- Consistent typography scaling
- Smoother transitions between breakpoints
- Maintains wireframe's target sizes

---

## Implementation Order

### Sequence 1: Foundation (Do First)
1. **Task 1.1** - Fix navbar scroll offset (critical)
2. **Task 1.2** - Add back-to-top to logo
3. **Task 2.1** - Replace external image with local

### Sequence 2: Core Improvements
4. **Task 2.2** - Improve typography with clamp
5. **Task 2.3** - Add blob animations
6. **Task 2.4** - Standardize hero height

### Sequence 3: Polish (Do Last)
7. **Task 3.1** - Standardize section spacing
8. **Task 3.2** - Enhance card hover effects
9. **Task 3.3** - Improve wave dividers
10. **Task 3.4** - Update section title typography
11. **Task 1.3** - Add scroll progress bar (test)

---

## Testing Checklist

### Navigation & Scroll
- [ ] Desktop nav links scroll to correct positions
- [ ] Mobile nav links scroll to correct positions
- [ ] Logo acts as back-to-top with smooth animation
- [ ] Scroll bar animates smoothly
- [ ] All sections have proper offset (not covered by header)

### Hero Section
- [ ] Hero image loads from local file (no external request)
- [ ] Fallback icon displays if image fails
- [ ] Typography scales smoothly across all breakpoints
- [ ] "CARE Collective" doesn't overflow horizontally
- [ ] Blobs float gently (subtle animation)
- [ ] Animations respect reduced motion preference
- [ ] Hero height is consistent across viewports

### Visual Polish
- [ ] All sections have consistent spacing
- [ ] Card hover effects are noticeable
- [ ] Wave dividers are prominent
- [ ] Section titles scale smoothly

### Cross-Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (macOS)
- [ ] Safari (iOS mobile)
- [ ] Edge (latest)

### Responsive Testing
- [ ] Mobile (<640px)
- [ ] Tablet (641px-1023px)
- [ ] Desktop (1024px-1439px)
- [ ] Large Desktop (1440px+)

### Accessibility Testing
- [ ] 44px minimum touch targets verified
- [ ] Focus rings visible on all interactive elements
- [ ] Keyboard navigation works (Tab through page)
- [ ] Screen reader announces content correctly
- [ ] ARIA labels are appropriate
- [ ] Color contrast meets WCAG AA

### Performance Testing
- [ ] Lighthouse score checked (no external image requests)
- [ ] LCP improved (local hero image)
- [ ] Animations don't cause jank (use 60fps check)

---

## Rollback Plan

If any change causes issues, roll back using git:

```bash
# Create backup branch before implementing
git checkout -b homepage-polish-backup

# After each task, verify functionality
# If issue found:
git checkout main
git checkout -b homepage-polish-rollback-{task-number}

# Or revert specific commits:
git revert <commit-hash>
```

---

## Rollback Instructions by Task

| Task | Files Modified | Rollback Method |
|-------|----------------|-----------------|
| 1.1 | `hooks/useSmoothScroll.ts` | `git checkout HEAD -- hooks/useSmoothScroll.ts` |
| 1.2 | `app/page.tsx` | `git checkout HEAD -- app/page.tsx` |
| 1.3 | `app/globals.css`, `app/page.tsx` | `git checkout HEAD -- app/globals.css app/page.tsx` |
| 2.1 | `public/hero-image.jpg`, `components/Hero.tsx` | `rm public/hero-image.jpg && git checkout HEAD -- components/Hero.tsx` |
| 2.2 | `components/Hero.tsx` | `git checkout HEAD -- components/Hero.tsx` |
| 2.3 | `components/Hero.tsx` | `git checkout HEAD -- components/Hero.tsx` |
| 2.4 | `components/Hero.tsx` | `git checkout HEAD -- components/Hero.tsx` |
| 3.1 | `app/page.tsx` | `git checkout HEAD -- app/page.tsx` |
| 3.2 | `app/page.tsx` | `git checkout HEAD -- app/page.tsx` |
| 3.3 | `app/page.tsx` | `git checkout HEAD -- app/page.tsx` |
| 3.4 | `app/page.tsx` | `git checkout HEAD -- app/page.tsx` |

---

## Post-Implementation Metrics

### Performance Targets
- **Lighthouse Score:** >90 (from baseline ~85)
- **LCP:** <2.5s (improved by local image)
- **FID:** <100ms (no animation impact)
- **CLS:** <0.1 (stable layout)

### User Experience Targets
- **Scroll behavior:** Smooth and accurate across all viewports
- **Typography:** Readable and well-scaled
- **Visual consistency:** Spacing and styling uniform
- **Mobile experience:** Easy navigation, clear touch targets

---

## Known Limitations & Trade-offs

### Back-to-Top via Logo
- **Limitation:** Logo is always top link, even when already at top
- **User Impact:** Minimal - clicking at top just scrolls to top (already there)
- **Mitigation:** Consider adding scroll detection to only enable when >50% down page

### Scroll Progress Bar
- **Trade-off:** Adds visual clutter for subtle benefit
- **User Impact:** May distract from content
- **Mitigation:** Easy to remove if testing shows it's not valuable

### Typography Clamp
- **Trade-off:** Less granular control than explicit breakpoints
- **User Impact:** May not hit exact target sizes at specific widths
- **Mitigation:** Test on common viewport widths (375px, 768px, 1024px, 1440px, 1920px)

---

## Success Criteria

### Must-Have (Phase 1 & 2)
- [ ] Navbar scroll works correctly on all viewports
- [ ] Logo acts as back-to-top with smooth animation
- [ ] Hero image loads reliably from local file
- [ ] Typography scales smoothly without abrupt jumps
- [ ] Blob animations are subtle and organic
- [ ] All changes maintain accessibility (WCAG AA)

### Should-Have (Phase 3)
- [ ] Section spacing is consistent
- [ ] Card hover effects provide clear feedback
- [ ] Wave dividers are appropriately prominent
- [ ] No visual regressions compared to current design

### Nice-to-Have (Optional)
- [ ] Scroll progress bar provides value without distraction
- [ ] All cross-browser testing passes

---

## References

**Design System:**
- Colors: `app/styles/tokens.css`, `tailwind.config.ts`
- Typography: `lib/fonts.ts`, `app/styles/tokens.css`
- Spacing tokens: `app/styles/tokens.css`

**Brand Standards:**
- Primary: Sage (#7A9E99)
- Secondary: Dusty Rose (#D8A8A0)
- Background: Cream (#FBF2E9)
- Text: Brown (#483129)

**Documentation:**
- Client feedback: `.prompts/homepage-client-updates.md`
- Wireframe design: `docs/homepage-wireframe.jpg`
- Code review fixes: `.prompts/homepage-review-fixes.md`

**Component References:**
- SectionDivider: `components/ui/SectionDivider.tsx`
- MobileNav: `components/MobileNav.tsx`
- Hero: `components/Hero.tsx`

---

## Appendix: Code Snippets

### A. Complete Updated useSmoothScroll Hook

```typescript
// hooks/useSmoothScroll.ts
import React, { useCallback } from 'react';

/**
 * Custom hook for smooth scrolling to anchor links with fixed header offset
 * Dynamically detects header height for responsive accuracy
 * Provides consistent smooth scrolling behavior across the application
 */
export function useSmoothScroll() {
  const handleSmoothScroll = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const href = e.currentTarget.getAttribute('href');

    if (href?.startsWith('#')) {
      e.preventDefault();
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        // DYNAMIC header height detection
        const header = document.querySelector('header.fixed');
        const headerHeight = header ? header.offsetHeight : 64;
        const buffer = 16;

        // Ensure minimum offset matches CSS scroll-padding-top (80px)
        const scrollOffset = Math.max(headerHeight + buffer, 80);

        const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - scrollOffset;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    }
  }, []);

  return handleSmoothScroll;
}
```

### B. Scroll Progress Bar Component

```tsx
// To add in app/page.tsx (after main tag)
'use client'

import { useEffect, useState } from 'react'

// In HomePage component
const [scrollProgress, setScrollProgress] = useState(0);

useEffect(() => {
  const handleScroll = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (scrollTop / docHeight) * 100;
    setScrollProgress(Math.min(progress, 100));
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

// JSX placement (immediately after <main>)
<div
  className="fixed top-16 left-0 right-0 h-1 bg-gradient-to-r from-sage via-dusty-rose to-sage z-[40] transition-all duration-300"
  style={{
    width: `${scrollProgress}%`,
    opacity: scrollProgress > 5 ? 1 : 0,
  }}
  aria-hidden="true"
  role="presentation"
/>
```

### C. Hero Typography with Clamp

```tsx
// Recommended clamp values for hero typography

// "Southwest Missouri"
text-[clamp(24px,4vw,48px)]
// Min: 24px (mobile), Max: 48px (desktop), Step: 4vw

// "CARE Collective"
text-[clamp(48px,12vw,140px)]
// Min: 48px (mobile), Max: 140px (desktop), Step: 12vw

// CARE Acronym
text-[clamp(18px,2.5vw,32px)]
// Min: 18px (mobile), Max: 32px (desktop), Step: 2.5vw

// Description
text-[clamp(16px,2vw,22px)]
// Min: 16px (mobile), Max: 22px (desktop), Step: 2vw
```

---

**End of Plan**
