# Orchestration Context: public-pages-ui-standardization

## Original Request
Standardize UI/UX across 6 public pages (About, Resources, Contact, Help, Privacy Policy, Terms of Service) by addressing 45+ inconsistencies identified in analysis. Create 4 reusable components and apply consistent design patterns while preserving all existing content.

## Project Context
- **Stack**: Next.js 14.2.32, React 18.3.1, TypeScript 5, Tailwind CSS 4, Supabase
- **Branch**: feature/public-layout-standardization (continuing work, NOT pushing to main)
- **Previous Work**: PublicPageLayout and PublicPageFooter components already created
- **Pages to Update**: About, Resources, Contact, Help, Privacy Policy, Terms

## Design Decisions

### Question 1: Icon Backgrounds
**Decision**: Use solid tints (`bg-sage/10`, `bg-primary/10`)
**Rationale**: Cleaner, more modern, matches existing help page pattern, more maintainable than gradients

### Question 2: Card Borders
**Decision**: 4 strict variants (standard, featured, accent, warning)
**Rationale**: Ensures consistency, semantic meaning (standard=info, featured=highlight, accent=special, warning=alert), easier to maintain

### Question 3: Help Page Colors
**Decision**: Change from `text-secondary` (dusty rose) to `text-foreground`
**Rationale**: Consistency across all pages is more important than page distinction, improves accessibility, reduces visual confusion

### Question 4: Privacy & Terms Headers
**Decision**: Add header icons
**Rationale**: Visual consistency, professional appearance, aligns with About/Resources/Contact patterns

### Question 5: Implementation Scope
**Decision**: Complete in one session
**Rationale**: High impact improvements deserve full effort, phased approach allows incremental testing within session

## Color Semantics Definition

```typescript
const colorSemantics = {
  // Primary Actions/Branding - CTAs, active states, primary links
  sage: '#7A9E99',

  // Important/Featured Content - Section headers, featured cards, important info
  primary: '#324158', // Navy from secondary color

  // Standard Content - Body text, page titles, card titles
  foreground: '#483129',

  // Highlights/Features - Special features, decorative elements
  accent: '#C39778',

  // Warnings/Important Notices - Alerts, warnings, important notices
  dustyRose: '#D8A8A0',
}
```

## Component Specifications

### 1. PageHeader Component
- Location: `components/public/PageHeader.tsx`
- Props: title, description?, icon?, iconBgColor?, showIcon?
- Icon container: w-12 h-12 in `bg-{color}/10 rounded-full`
- Title: text-4xl md:text-5xl font-bold text-foreground
- Description: text-xl text-muted-foreground max-w-3xl mx-auto
- Spacing: mb-12

### 2. SectionHeader Component
- Location: `components/public/SectionHeader.tsx`
- Props: title, description?, icon?, iconBgColor?
- Icon container: w-6 h-6 in `bg-{color}/10 rounded-lg`
- Title: text-2xl md:text-3xl font-bold text-foreground
- Description: text-lg text-muted-foreground mb-6
- Spacing: mb-6

### 3. CTAButton Component
- Location: `components/public/CTAButton.tsx`
- Props: href, children, variant? ('primary' | 'secondary')
- Implementation: Sage gradient background, white text, ArrowRight icon
- Accessibility: min-h-[48px], focus ring (focus:ring-2 focus:ring-sage/30)

### 4. ExternalLink Component
- Location: `components/public/ExternalLink.tsx`
- Props: href, children, icon?
- Style: inline-flex items-center gap-2 text-sage hover:text-sage-dark font-medium
- Focus: focus:outline-none focus:ring-2 focus:ring-sage/50 rounded

## Card Variants

### Variant 1: Standard Card (default)
```tsx
<Card className="bg-white border-sage/20 shadow-md hover:shadow-lg transition-all duration-300">
```

### Variant 2: Featured Card (important/key content)
```tsx
<Card className="bg-white border-sage/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-sage hover:-translate-y-1">
```

### Variant 3: Accent Card (highlights/special features)
```tsx
<Card className="border-primary/20 bg-primary/5">
```

### Variant 4: Warning Card (alerts/important notices)
```tsx
<Card className="border-dusty-rose/30 bg-dusty-rose/5">
```

## Standard Patterns

### Hover Effects
- Cards: `hover:shadow-xl hover:-translate-y-1` (for featured cards)
- Links: `hover:underline` (for external links)
- Buttons: `hover:opacity-90` (for CTA buttons)

### Grid Layouts
- Pattern: `grid gap-6 md:grid-cols-2`
- Apply to: About (values), Resources (all sections), Contact (how to help), Help (categories)

## Constraints
- **DO NOT push to main branch** - stay in feature/public-layout-standardization
- Create PR when complete
- All files must be under 500 lines
- Use `ReactElement` return type (NOT `JSX.Element`)
- WCAG 2.1 AA accessibility required
- DO NOT modify existing page content
- Preserve all existing functionality

## Success Criteria
- ✅ 4 reusable components created (PageHeader, SectionHeader, CTAButton, ExternalLink)
- ✅ All 6 pages updated with consistent patterns
- ✅ Help page heading colors fixed
- ✅ Privacy & Terms pages have header icons
- ✅ All external links have focus states
- ✅ Card variants applied consistently
- ✅ Hover effects standardized
- ✅ Grid layouts standardized
- ✅ Accessibility audit passed
- ✅ Manual testing completed
- ✅ TypeScript compiles without errors
- ✅ ESLint passes with 0 warnings
- ✅ Pull request created (NOT merged to main)

## Phase Execution Order
1. Phase 0: Planning & Design Decisions (context.md created)
2. Phase 1: Quick Wins (Help page colors, CTA button, focus states)
3. Phase 2: Component Standardization (PageHeader, SectionHeader, Card variants)
4. Phase 3: UX Improvements (Privacy/Terms headers, hover effects, grid layouts)
5. Phase 4: Accessibility Audit
6. Phase 5: Testing & Verification
7. Phase 6: Git Workflow & Documentation (PR creation)

## Session Files
- `context.md` - This file (design decisions and specifications)
- `01-phase1-quick-wins.md` - Phase 1 execution notes
- `02-phase2-components.md` - Phase 2 execution notes
- `03-phase3-ux-improvements.md` - Phase 3 execution notes
- `04-phase4-accessibility.md` - Phase 4 execution notes
- `05-phase5-testing.md` - Phase 5 execution notes
- `06-final-summary.md` - Final summary and PR details
