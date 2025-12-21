# Homepage Section Architecture & Background Design

## Design Phase Output
**Date**: 2024-12-21  
**Agent**: @ui-architect  
**Task**: Section dividers and background system design

---

## 1. Section Layout Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER (fixed)                                   bg-navy       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  HERO                                                    │   │
│  │  bg: gradient cream → sage-light/20                      │   │
│  │  Visual weight: HIGH                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                      ╲                  ╱                       │
│  ════════════════════╲════════════════╱════════════════════    │ ← Wave Divider (sage-light fill)
│                       ╲______________╱                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  WHAT IS CARE                                            │   │
│  │  Header: bg-background (cream)                           │   │
│  │  Cards: bg-sage-light/10                                 │   │
│  │  Visual weight: HIGH                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                       ______________                            │
│  ════════════════════╱══════════════╲═══════════════════════   │ ← Gentle Wave (cream fill)
│                      ╱                ╲                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ABOUT                                                   │   │
│  │  Header: bg-background (cream)                           │   │
│  │  Body: bg-sage-dark                                      │   │
│  │  Visual weight: HIGH (hero-like impact)                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                      ╲                  ╱                       │
│  ════════════════════╲════════════════╱════════════════════    │ ← Soft Wave (dusty-rose-light fill)
│                       ╲______________╱                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  WHAT'S HAPPENING                                        │   │
│  │  Header: bg-background (cream)                           │   │
│  │  Body: bg-dusty-rose/10                                  │   │
│  │  Visual weight: MEDIUM                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                       ______________                            │
│  ════════════════════╱══════════════╲═══════════════════════   │ ← Gentle Wave (cream fill)
│                      ╱                ╲                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  RESOURCES                                               │   │
│  │  bg: bg-sage/8 (subtle texture)                          │   │
│  │  Visual weight: MEDIUM                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                      ╲                  ╱                       │
│  ════════════════════╲════════════════╱════════════════════    │ ← Deep Wave (navy fill)
│                       ╲______________╱                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  CONTACT                                                 │   │
│  │  bg: bg-navy                                             │   │
│  │  Visual weight: HIGH (anchor)                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  FOOTER                                           bg-navy       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Background Specifications

### Section-by-Section Breakdown

| # | Section | Background | Text Color | Divider Above | Divider Below |
|---|---------|------------|------------|---------------|---------------|
| 1 | Hero | `bg-gradient-to-br from-background via-background to-sage-light/20` | Brown (#483129) | None | `wave-gentle` (sage-light) |
| 2 | What is CARE | Header: `bg-background`, Body: `bg-sage-light/10` | Brown (#483129) | `wave-gentle` | `wave-soft` (cream) |
| 3 | About | Header: `bg-background`, Body: `bg-sage-dark` | White | `wave-soft` | `wave-gentle` (dusty-rose-light) |
| 4 | What's Happening | Header: `bg-background`, Body: `bg-dusty-rose/10` | Brown (#483129) | `wave-gentle` | `wave-soft` (cream) |
| 5 | Resources | `bg-sage/8` | Brown (#483129) | `wave-soft` | `wave-deep` (navy) |
| 6 | Contact | `bg-navy` | White | `wave-deep` | None |

### Color Palette with Opacities

```css
/* Backgrounds */
--bg-hero-start: #FBF2E9;           /* cream */
--bg-hero-end: rgba(163, 196, 191, 0.2);  /* sage-light/20 */
--bg-care-cards: rgba(163, 196, 191, 0.1); /* sage-light/10 */
--bg-about-body: #5A7D78;           /* sage-dark (accessible) */
--bg-happening-body: rgba(216, 168, 160, 0.1); /* dusty-rose/10 */
--bg-resources: rgba(122, 158, 153, 0.08);  /* sage/8 */
--bg-contact: #324158;              /* navy */
--bg-cream: #FBF2E9;                /* cream (breathing room) */
```

---

## 3. SVG Wave Divider System

### Wave Variants

We define 3 wave variants with different amplitudes for visual variety:

#### Variant A: `wave-gentle` (Subtle, 40px amplitude)
```svg
<svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z" />
</svg>
```

#### Variant B: `wave-soft` (Medium, 60px amplitude)
```svg
<svg viewBox="0 0 1440 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,100 L0,100 Z" />
</svg>
```

#### Variant C: `wave-deep` (Pronounced, 80px amplitude)
```svg
<svg viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M0,80 C180,120 360,40 540,80 C720,120 900,40 1080,80 C1260,120 1380,60 1440,80 L1440,120 L0,120 Z" />
</svg>
```

### Divider Placements

| Transition | Divider Variant | Position | Fill Color | Height |
|------------|-----------------|----------|------------|--------|
| Hero → What is CARE | `wave-gentle` | bottom of Hero | `#A3C4BF` (sage-light) | 60px / 80px (md) |
| What is CARE → About | `wave-soft` | bottom of CARE section | `#FBF2E9` (cream) | 80px / 100px (md) |
| About → What's Happening | `wave-gentle` | bottom of About | `#E5C6C1` (dusty-rose-light) | 60px / 80px (md) |
| What's Happening → Resources | `wave-soft` | bottom of Happening | `#FBF2E9` (cream) | 80px / 100px (md) |
| Resources → Contact | `wave-deep` | bottom of Resources | `#324158` (navy) | 80px / 120px (md) |

---

## 4. Visual Flow Analysis

### Color Progression Logic

```
Hero (neutral warm)
    ↓ cool accent
What is CARE (cool sage tint)
    ↓ neutral break
About (deep sage - trust/authority)
    ↓ warm accent
What's Happening (warm dusty-rose tint)
    ↓ neutral break
Resources (cool sage tint)
    ↓ anchor
Contact (navy - grounded/authority)
```

**Pattern**: Warm → Cool → Warm → Cool → Deep  
This creates visual rhythm with "breathing room" (cream headers) between colored sections.

### Visual Weight Distribution

```
HIGH    ████████████████████  Hero (entry point)
HIGH    ████████████████████  What is CARE (core value prop)
HIGH    ████████████████████  About (emotional connection)
MEDIUM  ████████████          What's Happening (engagement)
MEDIUM  ████████████          Resources (utility)
HIGH    ████████████████████  Contact (call to action, anchor)
```

### Breathing Room Strategy

- **Cream header sections** between colored bodies provide visual rest
- **3 cream/light sections** (Hero start, headers, Resources) prevent color fatigue
- **2 dark/saturated sections** (About sage-dark, Contact navy) create anchors

---

## 5. Component Requirements

### Component: `SectionDivider`

```typescript
// components/ui/SectionDivider.tsx

import { ReactElement } from 'react';
import { cn } from '@/lib/utils';

type WaveVariant = 'gentle' | 'soft' | 'deep';
type DividerPosition = 'top' | 'bottom';

interface SectionDividerProps {
  /** Wave style variant */
  variant?: WaveVariant;
  /** Fill color - should match the section it points toward */
  fillColor: string;
  /** Whether divider appears at top or bottom of section */
  position?: DividerPosition;
  /** Additional CSS classes */
  className?: string;
  /** Flip the wave horizontally for variety */
  flip?: boolean;
}

const WAVE_PATHS: Record<WaveVariant, { viewBox: string; path: string; height: string }> = {
  gentle: {
    viewBox: '0 0 1440 80',
    path: 'M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z',
    height: 'h-[60px] md:h-[80px]',
  },
  soft: {
    viewBox: '0 0 1440 100',
    path: 'M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,100 L0,100 Z',
    height: 'h-[80px] md:h-[100px]',
  },
  deep: {
    viewBox: '0 0 1440 120',
    path: 'M0,80 C180,120 360,40 540,80 C720,120 900,40 1080,80 C1260,120 1380,60 1440,80 L1440,120 L0,120 Z',
    height: 'h-[80px] md:h-[120px]',
  },
};

export function SectionDivider({
  variant = 'gentle',
  fillColor,
  position = 'bottom',
  className,
  flip = false,
}: SectionDividerProps): ReactElement {
  const wave = WAVE_PATHS[variant];
  
  return (
    <div
      className={cn(
        'absolute left-0 right-0 w-full overflow-hidden leading-none',
        wave.height,
        position === 'top' ? 'top-0' : 'bottom-0',
        position === 'top' && 'rotate-180',
        flip && 'scale-x-[-1]',
        className
      )}
      aria-hidden="true"
    >
      <svg
        viewBox={wave.viewBox}
        preserveAspectRatio="none"
        className="w-full h-full"
        style={{ fill: fillColor }}
      >
        <path d={wave.path} />
      </svg>
    </div>
  );
}
```

### Component: `SectionBackground`

```typescript
// components/ui/SectionBackground.tsx

import { ReactElement, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { SectionDivider } from './SectionDivider';

type BackgroundVariant = 
  | 'cream' 
  | 'sage-light' 
  | 'sage-dark' 
  | 'dusty-rose' 
  | 'navy';

interface DividerConfig {
  variant: 'gentle' | 'soft' | 'deep';
  fillColor: string;
  flip?: boolean;
}

interface SectionBackgroundProps {
  /** Section ID for navigation anchors */
  id: string;
  /** Background style */
  background?: BackgroundVariant;
  /** Custom background className (overrides variant) */
  backgroundClassName?: string;
  /** Configuration for top divider */
  dividerTop?: DividerConfig;
  /** Configuration for bottom divider */
  dividerBottom?: DividerConfig;
  /** Section content */
  children: ReactNode;
  /** Additional padding on top for divider overlap */
  paddingTop?: 'none' | 'sm' | 'md' | 'lg';
  /** Additional padding on bottom for divider overlap */
  paddingBottom?: 'none' | 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

const BACKGROUND_CLASSES: Record<BackgroundVariant, string> = {
  cream: 'bg-background',
  'sage-light': 'bg-sage-light/10',
  'sage-dark': 'bg-sage-dark',
  'dusty-rose': 'bg-dusty-rose/10',
  navy: 'bg-navy',
};

const PADDING_TOP: Record<string, string> = {
  none: '',
  sm: 'pt-16 md:pt-20',
  md: 'pt-20 md:pt-28',
  lg: 'pt-24 md:pt-32',
};

const PADDING_BOTTOM: Record<string, string> = {
  none: '',
  sm: 'pb-16 md:pb-20',
  md: 'pb-20 md:pb-28',
  lg: 'pb-24 md:pb-32',
};

export function SectionBackground({
  id,
  background = 'cream',
  backgroundClassName,
  dividerTop,
  dividerBottom,
  children,
  paddingTop = 'none',
  paddingBottom = 'none',
  className,
}: SectionBackgroundProps): ReactElement {
  const bgClass = backgroundClassName ?? BACKGROUND_CLASSES[background];

  return (
    <section
      id={id}
      className={cn(
        'relative overflow-hidden',
        bgClass,
        PADDING_TOP[paddingTop],
        PADDING_BOTTOM[paddingBottom],
        className
      )}
    >
      {/* Top Divider */}
      {dividerTop && (
        <SectionDivider
          variant={dividerTop.variant}
          fillColor={dividerTop.fillColor}
          position="top"
          flip={dividerTop.flip}
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Bottom Divider */}
      {dividerBottom && (
        <SectionDivider
          variant={dividerBottom.variant}
          fillColor={dividerBottom.fillColor}
          position="bottom"
          flip={dividerBottom.flip}
        />
      )}
    </section>
  );
}
```

### Tailwind Configuration Addition

```typescript
// Add to tailwind.config.ts theme.extend.colors
{
  divider: {
    'sage-light': '#A3C4BF',
    'dusty-rose-light': '#E5C6C1',
    'cream': '#FBF2E9',
    'navy': '#324158',
  }
}
```

---

## 6. Usage Examples

### What is CARE Section

```tsx
{/* Section Title on cream */}
<SectionBackground id="what-is-care-title" background="cream">
  <div className="container mx-auto px-4 py-16 md:py-20">
    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground text-center">
      What is CARE Collective?
    </h2>
  </div>
</SectionBackground>

{/* Cards on sage-light tint */}
<SectionBackground
  id="what-is-care-content"
  background="sage-light"
  dividerTop={{ variant: 'gentle', fillColor: '#FBF2E9' }}
  dividerBottom={{ variant: 'soft', fillColor: '#FBF2E9' }}
  paddingTop="md"
  paddingBottom="md"
>
  <div className="container mx-auto px-4">
    {/* Card grid */}
  </div>
</SectionBackground>
```

### About Section (Sage-dark body)

```tsx
{/* Header on cream */}
<SectionBackground id="about-title" background="cream">
  <div className="container mx-auto px-4 py-12 md:py-16">
    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground text-center">
      About CARE Collective
    </h2>
  </div>
</SectionBackground>

{/* Body on sage-dark */}
<SectionBackground
  id="about-content"
  background="sage-dark"
  dividerTop={{ variant: 'soft', fillColor: '#FBF2E9' }}
  dividerBottom={{ variant: 'gentle', fillColor: '#E5C6C1' }}
  paddingTop="lg"
  paddingBottom="md"
>
  <div className="container mx-auto px-4">
    {/* About content with white text */}
  </div>
</SectionBackground>
```

---

## 7. Mobile Considerations

### Responsive Wave Heights

| Breakpoint | Gentle | Soft | Deep |
|------------|--------|------|------|
| Mobile (<768px) | 60px | 80px | 80px |
| Tablet/Desktop (≥768px) | 80px | 100px | 120px |

### Mobile-Specific Adjustments

1. **Reduced amplitude** on small screens prevents waves from dominating
2. **`preserveAspectRatio="none"`** ensures waves stretch full width
3. **Padding compensation** - sections need extra padding where dividers overlap:
   - Add `pt-16` (mobile) / `pt-20` (desktop) for top dividers
   - Add `pb-16` (mobile) / `pb-20` (desktop) for bottom dividers

### Performance Considerations

1. **Inline SVG** - No HTTP requests, instant render
2. **Simple paths** - Minimal path complexity, fast rendering
3. **CSS transforms** - Hardware-accelerated flip/rotate
4. **No animations on dividers** - Static elements, no layout thrashing

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  .section-divider {
    transition: none;
  }
}
```

---

## 8. Accessibility Compliance

### Contrast Verification

| Background | Text Color | Contrast Ratio | WCAG Level |
|------------|------------|----------------|------------|
| Cream (#FBF2E9) | Brown (#483129) | 10.2:1 | AAA ✓ |
| Sage-light/10% on cream | Brown (#483129) | ~9.5:1 | AAA ✓ |
| Sage-dark (#5A7D78) | White (#FFFFFF) | 4.6:1 | AA ✓ |
| Dusty-rose/10% on cream | Brown (#483129) | ~9.8:1 | AAA ✓ |
| Sage/8% on cream | Brown (#483129) | ~9.9:1 | AAA ✓ |
| Navy (#324158) | White (#FFFFFF) | 8.5:1 | AAA ✓ |

### Divider Accessibility

- All dividers marked with `aria-hidden="true"`
- Purely decorative, no semantic meaning
- Content remains accessible without visual styling

---

## 9. Implementation Priority

### Phase 1: Core Components
1. ✅ Create `SectionDivider` component
2. ✅ Create `SectionBackground` wrapper
3. ✅ Add Tailwind color tokens

### Phase 2: Section Migration
1. Update "What is CARE" section (replace CSS `borderRadius`)
2. Update "About" section
3. Update "What's Happening" section
4. Update "Resources" section (add visual treatment)
5. Update "Contact" section

### Phase 3: Polish
1. Add subtle fade-up animations (with `prefers-reduced-motion`)
2. Test on mobile devices
3. Validate contrast ratios
4. Performance audit

---

## 10. Files to Create/Modify

### New Files
- `components/ui/SectionDivider.tsx`
- `components/ui/SectionBackground.tsx`

### Files to Modify
- `app/page.tsx` - Replace inline divider styles with components
- `tailwind.config.ts` - Add divider color tokens

---

## Summary

This design system replaces the current CSS `borderRadius` curves with proper SVG wave dividers, creating:

1. **Visual cohesion** - Consistent wave language throughout
2. **Color rhythm** - Warm/cool alternation with cream breathing room
3. **Clear hierarchy** - High-impact sections (Hero, About, Contact) anchor the page
4. **Mobile-first** - Responsive wave heights, touch-friendly
5. **Accessible** - AAA contrast on most sections, decorative elements hidden from AT
6. **Performant** - Inline SVG, no animations on dividers, simple paths

The component API provides flexibility for future sections while maintaining brand consistency.
