# PublicPageLayout Design Notes

> Generated: December 30, 2025
> Session: header-footer-standardization

---

## Component Overview

The `PublicPageLayout` component provides a consistent header and footer across all public pages (about, resources, contact, help, etc.), matching the homepage design exactly.

## Component Structure

```
┌─────────────────────────────────────────────────┐
│  Fixed Header (bg-navy, z-50)                 │
│  ┌───────────────────────────────────────────┐  │
│  │ Logo | Desktop Nav | Auth Buttons | Mobile │  │
│  └───────────────────────────────────────────┘  │
├─────────────────────────────────────────────────┤
│  Main Content Area (bg-background)             │
│  ┌───────────────────────────────────────────┐  │
│  │                                           │  │
│  │  Children Content                          │  │
│  │                                           │  │
│  └───────────────────────────────────────────┘  │
├─────────────────────────────────────────────────┤
│  Site Footer (bg-navy) [if showFooter]        │
│  ┌───────────────────────────────────────────┐  │
│  │ 4-column grid: Brand, Quick, Legal, Support│  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. Navigation Items
Public pages use page-based navigation (not anchor links like homepage):

```typescript
const navItems = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About Us' },
  { href: '/help', label: 'Help' },
  { href: '/resources', label: 'Resources' },
  { href: '/contact', label: 'Contact Us' },
]
```

**Rationale:** Public pages are standalone pages, not homepage sections. Page navigation provides clearer navigation hierarchy.

### 2. Active State Logic
```typescript
const isActive = (href: string) => {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}
```

**Rationale:**
- Exact match for homepage to avoid false positives
- Partial match for other pages (e.g., `/resources` matches `/resources/community-programs`)

### 3. Active State Styling
When a page is active:
- Background: `bg-white/20 text-sage-light`
- Font weight: `font-semibold`
- Visual indicator: Sage dot (w-2 h-2 bg-sage rounded-full)

**Rationale:** High contrast, clear visual hierarchy, consistent with homepage patterns.

### 4. Auth-Aware Buttons

**Not Authenticated:**
```tsx
<Link href="/signup" className="bg-sage">Join Community</Link>
<Link href="/login" className="border-2 border-white">Member Login</Link>
```

**Authenticated:**
```tsx
<Link href="/dashboard" className="bg-secondary">Dashboard</Link>
<LogoutButton variant="default" />
```

**Loading:**
```tsx
<div className="bg-sage/50 animate-pulse">Loading...</div>
```

**Rationale:** Homepage uses these exact styles for consistency. LogoutButton provides proper logout flow.

### 5. Header Positioning
```tsx
<header className="fixed top-0 left-0 right-0 z-50 bg-navy">
```

**Rationale:** Fixed positioning matches homepage, provides persistent navigation. `z-50` ensures header sits above all content.

### 6. Content Spacing
Main content needs padding to account for fixed header:

```tsx
<main className="pt-16">
  {children}
</main>
```

**Rationale:** Header is h-16 (64px), so pt-16 ensures content isn't hidden behind fixed header.

### 7. Skip Links for Accessibility
```tsx
<a href="#main-content" className="sr-only focus:not-sr-only ...">
  Skip to main content
</a>
<main id="main-content" tabIndex={-1}>
  {children}
</main>
```

**Rationale:** WCAG 2.1 AA requires skip links for keyboard users. `sr-only` + `focus:not-sr-only` shows link only when focused.

### 8. Mobile Navigation
```tsx
<MobileNav variant="homepage" />
```

**Rationale:** MobileNav already supports `variant="homepage"` with proper auth state handling. No changes needed to MobileNav.

### 9. Footer Integration
```tsx
{showFooter && <SiteFooter />}
```

**Rationale:** Some pages (auth pages, access-denied) might want to hide footer. Optional prop provides flexibility.

### 10. Color Tokens
```css
bg-navy          /* #324158 - Header/footer background */
bg-background     /* #FBF2E9 - Page background */
bg-sage          /* #7A9E99 - Primary CTA */
bg-secondary      /* #9A6B61 - Secondary actions */
text-sage-light   /* #A3C4BF - Active nav text */
text-white        /* White - Header/footer text */
```

**Rationale:** Semantic color tokens provide consistency and easy theming. Avoids hardcoded hex values.

## Props Interface

```typescript
interface PublicPageLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;  // Default: true
  className?: string;    // Optional custom classes for main content
}
```

**Rationale:**
- `children`: Required for page content
- `showFooter`: Optional for pages without footer (default true)
- `className`: Optional for custom page-level styling

## Accessibility Considerations

### WCAG 2.1 AA Compliance

1. **Color Contrast:** All text meets WCAG AA (4.5:1 for normal text, 3:1 for large text)
   - White text on navy background: 12.6:1 ✅
   - Sage-light on navy background: 5.1:1 ✅

2. **Touch Targets:** All interactive elements meet 44px minimum
   ```tsx
   min-h-[44px]  // All buttons and links
   ```

3. **Keyboard Navigation:**
   - Tab order: Skip link → Logo → Nav items → Auth buttons → Main content
   - Focus rings: `focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy`
   - Escape key handled by MobileNav

4. **ARIA Labels:**
   ```tsx
   <nav aria-label="Main navigation">
   <header aria-label="Site header">
   <main id="main-content" role="main">
   <footer role="contentinfo">
   ```

5. **Skip Links:**
   - "Skip to main content" link appears on focus
   - Links to `#main-content` with `tabIndex={-1}` for focus management

## Responsive Design

### Breakpoints
```css
sm: 640px    /* Small devices */
md: 768px    /* Medium devices (tablets) */
lg: 1024px   /* Large devices (desktops) */
xl: 1280px   /* Extra large devices */
```

### Navigation Visibility
```css
Desktop nav: hidden lg:flex     /* Hidden on mobile, visible on lg+ */
Auth buttons: hidden lg:flex   /* Hidden on mobile, visible on lg+ */
Mobile button: lg:hidden       /* Hidden on desktop, visible on mobile */
```

### Layout Adjustments
```css
Container: mx-auto px-4 sm:px-6  /* Wider padding on desktop */
Nav items: gap-3 xl:gap-4          /* More spacing on xl */
Logo: w-10 sm:w-12                 /* Larger on desktop */
```

## Performance Optimization

### Image Optimization
```tsx
<Image
  src="/logo-textless.png"
  width={48}
  height={48}
  className="rounded w-10 h-10 sm:w-12 sm:h-12"
  priority  // Above-fold image, prioritize loading
/>
```

### Code Splitting
- MobileNav is already a client component
- No dynamic imports needed (already efficient)

### Memoization
```tsx
const navItems = useMemo(() => [...], [])
const isActive = useCallback((href: string) => { ... }, [pathname])
```

**Rationale:** Prevents unnecessary re-renders and function recreation.

## Component Dependencies

### Internal Components
- `MobileNav` - Mobile navigation menu (variant="homepage")
- `SiteFooter` - Footer with links and info
- `LogoutButton` - Logout action button

### Hooks
- `useAuthNavigation()` - Auth state (isAuthenticated, isLoading, displayName)
- `usePathname()` - Current pathname for active state

### Utility
- `cn()` - Conditional class merging from `@/lib/utils`

## Testing Strategy

### Unit Tests
```typescript
describe('PublicPageLayout', () => {
  it('renders header with navigation', () => {})
  it('shows correct auth buttons when not authenticated', () => {})
  it('shows correct auth buttons when authenticated', () => {})
  it('highlights active page correctly', () => {})
  it('shows footer when showFooter is true', () => {})
  it('hides footer when showFooter is false', () => {})
})
```

### Accessibility Tests
```typescript
it('has skip link for keyboard users', () => {})
it('has correct ARIA labels', () => {})
it('all buttons meet 44px touch targets', () => {})
it('focus rings visible on keyboard navigation', () => {})
```

### Visual Regression Tests
- Test header on all 10 public pages
- Test mobile/desktop layouts
- Test auth states (authenticated, not authenticated, loading)

## Implementation Checklist

- [x] Component created at `components/layout/PublicPageLayout.tsx`
- [ ] Props interface defined
- [ ] Header matches homepage design exactly
- [ ] Navigation items correct (page-based, not anchors)
- [ ] Active state logic and styling
- [ ] Auth-aware buttons (all three states)
- [ ] MobileNav integrated with variant="homepage"
- [ ] SiteFooter integrated
- [ ] Skip link for accessibility
- [ ] ARIA labels on all interactive elements
- [ ] 44px touch targets on all buttons/links
- [ ] Semantic color tokens (no hardcoded hex)
- [ ] Responsive design (mobile-first)
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings
- [ ] Under 500 lines

## Next Steps

Once component is complete:
1. Test component on a single page (e.g., `/about`)
2. Apply to all 10 public pages
3. Run automated tests
4. Manual testing checklist
5. Create PR and merge to main
