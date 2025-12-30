# Header/Footer Standardization - Context

> Generated: December 30, 2025
> Session: header-footer-standardization
> Branch: feature/public-layout-standardization

---

## Original Plan

Standardize header and footer design across all public pages in the Care Collective platform. Create a reusable `PublicPageLayout` component and apply it to 10 public pages, ensuring consistent navigation, branding, and user experience matching the homepage design.

**Pages to Update:**
1. app/about/page.tsx
2. app/resources/page.tsx
3. app/contact/page.tsx
4. app/help/page.tsx
5. app/privacy-policy/page.tsx
6. app/terms/page.tsx
7. app/login/page.tsx
8. app/signup/page.tsx
9. app/waitlist/page.tsx
10. app/access-denied/page.tsx

---

## Research Findings

### 1. Homepage Header Implementation (app/page.tsx)

**Header Design:**
- Navy background: `bg-navy` (#324158) - using semantic color token
- Fixed positioning: `fixed top-0 left-0 right-0 z-50`
- Structure: Logo → Desktop Nav → Auth Buttons → MobileNav

**Desktop Navigation Items:**
```typescript
[
  { href: '#what-is-care', label: 'What is CARE?' },
  { href: '#about', label: 'About Us' },
  { href: '#whats-happening', label: "What's Happening" },
  { href: '#resources-preview', label: 'Resources' },
  { href: '#contact-preview', label: 'Contact Us' }
]
```

**Auth-Aware Buttons:**
- **Loading**: Pulsing "Loading..." button
- **Authenticated**: "Dashboard" (bg-secondary) + "Sign Out" (bg-[#D8837C])
- **Not Authenticated**: "Join Community" (bg-sage) + "Member Login" (border-2 border-white)

**Key Features:**
- Smooth scrolling with `handleSmoothScroll` for anchor links
- Hover states: `hover:text-sage-light`
- Focus rings: `focus:ring-2 focus:ring-sage-light`
- Min 44px touch targets

---

### 2. SiteFooter Component (components/layout/SiteFooter.tsx)

**Component Interface:**
```typescript
interface FooterProps {
  // No props - self-contained
}
```

**Structure:**
- 4-column responsive grid (1 col on mobile, 4 on desktop)
- Columns: Brand Section, Quick Links, Legal Links, Contact & Support
- Bottom bar: Copyright + funding acknowledgment
- Disclaimer box: Platform liability disclaimer

**Styling:**
- Background: `bg-[#324158]` (navy)
- Container: `container mx-auto px-4`
- Padding: `py-12`

**Critical Finding:** Homepage has **inline footer** (lines 609-656) that differs from SiteFooter component:
- Homepage: Contact info with Dr. Maureen Templeman, SWMO email
- SiteFooter: Support email, privacy-first badge, disclaimer

---

### 3. Public Pages Analysis

**Common Patterns to Remove:**

| Pattern | Affected Pages |
|---------|----------------|
| Gradient backgrounds | about, resources, contact |
| "Back to Home" buttons | about, resources, contact, help, privacy-policy, terms, login, signup |
| Custom inline headers | about, resources, contact, help, privacy-policy, terms |
| Custom fixed headers | login, signup, waitlist |

**Background Patterns:**
- about: `bg-gradient-to-br from-background via-sage-light/10 to-dusty-rose-light/10`
- resources: `bg-gradient-to-br from-background via-sage-light/10 to-dusty-rose-light/10`
- contact: `bg-gradient-to-br from-background via-sage-light/10 to-primary/5`
- help, privacy-policy, terms, login, signup, waitlist, access-denied: `bg-background`

**Content to Preserve:**
- All main page content and forms
- Help request sections
- Legal content and cross-navigation
- Action buttons on access-denied
- Status display on waitlist

---

### 4. MobileNav Component (components/MobileNav.tsx)

**Interface:**
```typescript
interface MobileNavProps {
  isAdmin?: boolean;
  variant?: 'homepage' | 'dashboard';  // Default: 'dashboard'
}
```

**Homepage Variant Behavior:**
- **Not Authenticated**: Shows anchor links to homepage sections
- **Authenticated**: Shows app links (Dashboard, Requests, Messages, Profile, Admin)

**Navigation Items (not authenticated):**
```typescript
[
  { href: '#home', label: 'Home' },
  { href: '#what-is-care', label: 'What is CARE?' },
  { href: '#about', label: 'About Us' },
  { href: '#whats-happening', label: "What's Happening" },
  { href: '#resources-preview', label: 'Resources' },
  { href: '#contact-preview', label: 'Contact Us' }
]
```

**Key Features:**
- Hamburger button with animated icon (3-line → X)
- Full-screen backdrop with `z-50`
- Slide-in menu panel (w-72 sm:w-80)
- Escape key closes menu
- Focus management (auto-focus first item)
- Keyboard navigation support

**Reusability:** ✅ Excellent - Can be reused with `variant="homepage"`

---

### 5. PlatformLayout Reference (components/layout/PlatformLayout.tsx)

**Component Structure:**
```
Header (sticky, z-40, h-16)
├── Logo & Brand (left)
├── Desktop Navigation (center, hidden on mobile)
├── User Actions (right)
│   ├── NotificationDropdown
│   ├── Profile Link + LogoutButton
│   └── MobileNav button
└── Main Content (children)
```

**Patterns to Apply:**
- Client component with `'use client'`
- Sticky header with `z-40`
- Container with `container mx-auto px-4`
- Use `usePathname()` for active state detection
- Responsive design (desktop nav hidden on mobile)
- Semantic elements: `<header>`, `<main>`, `<nav>`

**Auth State Management:**
- Derived from presence of user prop
- No auth checks for admin routes (soft check only)
- UI-based conditional rendering

**Components to Reuse:**
- Button from `@/components/ui/button`
- Logo image pattern with `Image` component
- Responsive container pattern
- `cn()` utility for conditional classes

**Components NOT Needed:**
- NotificationDropdown
- Badge system
- Breadcrumbs
- Messaging context bar

---

## Design Decisions

### Header Navigation Items

Based on homepage analysis and public pages requirements:

```typescript
const navItems = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About Us' },
  { href: '/help', label: 'Help' },
  { href: '/resources', label: 'Resources' },
  { href: '/contact', label: 'Contact Us' },
]
```

**Note:** Changed from anchor links (`#about`) to page links (`/about`) for consistency across public pages.

### Active State Logic

```typescript
const isActive = (href: string) => {
  // Exact match for homepage
  if (href === '/') return pathname === '/';
  // Partial match for other pages
  return pathname.startsWith(href);
};
```

### Active State Styling

- Background: `bg-white/20 text-sage-light`
- Font weight: `font-semibold`
- Left indicator: Small sage dot

### Auth States

**Not Authenticated:**
- "Join Community" (bg-sage)
- "Member Login" (border-2 border-white)

**Authenticated:**
- "Dashboard" (bg-secondary)
- "Sign Out"

### Background Colors

- Header: `bg-navy` (#324158)
- Page: `bg-background` (cream #FBF2E9)
- Remove all gradients

---

## Component Interfaces

### PublicPageLayout Props

```typescript
interface PublicPageLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;  // Default: true
  className?: string;    // Optional custom classes
}
```

---

## Implementation Constraints

**Critical Constraints:**
- ✅ Use `ReactElement` return type (NOT `JSX.Element`)
- ✅ Max 500 lines per file
- ✅ WCAG 2.1 AA accessibility
- ✅ Mobile-first design
- ✅ 44px minimum touch targets
- ✅ No TypeScript errors
- ✅ No ESLint warnings
- ✅ Use semantic color tokens (bg-navy, not #324158)

**File Limits:**
- PublicPageLayout: < 500 lines
- Use sub-components if needed
- Clear feature separation

**Content Preservation:**
- ❌ DO NOT modify existing page content
- ❌ DO NOT change form logic
- ✅ ONLY wrap/structure changes
- ✅ PRESERVE all existing functionality

---

## Success Criteria

Project is complete when:
1. ✅ PublicPageLayout component created and working
2. ✅ All 10 public pages use PublicPageLayout
3. ✅ Navy header appears on all pages
4. ✅ Navigation works with active state highlighting
5. ✅ Footer appears on all public pages
6. ✅ Auth buttons display correctly (both states)
7. ✅ Mobile navigation works on all pages
8. ✅ Background is consistent (bg-background)
9. ✅ All automated tests pass
10. ✅ Manual testing checklist complete
11. ✅ Pull request created and approved
12. ✅ Changes merged to main via PR

---

## Next Steps

**Phase 1:** Create PublicPageLayout component
**Phase 2:** Update 6 public content pages (parallel)
**Phase 3:** Update 2 auth pages (parallel)
**Phase 4:** Update 2 special pages (parallel)
**Phase 5:** Testing and verification
**Phase 6:** Git workflow and PR creation
