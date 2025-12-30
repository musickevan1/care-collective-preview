# Header/Footer Standardization Plan

**Project:** Care Collective Platform
**Created:** December 30, 2025
**Status:** Planning Phase

---

## Executive Summary

Standardize header and footer design across all public pages (`/about`, `/resources`, `/contact`, `/help`, `/privacy-policy`, `/terms`, `/login`, `/signup`, `/waitlist`, `/access-denied`) to match the homepage design with consistent navigation, branding, and user experience.

**Branch Strategy:** All changes will be made in `feature/public-layout-standardization` branch, NOT main.

---

## Current State Analysis

### Homepage (`/`) ✅
**Has Complete Implementation:**
- Full navy header (`bg-[#324158]`)
- Logo and "CARE Collective" branding
- Desktop navigation with anchor links
- Auth-aware buttons (Dashboard/Sign Out OR Join Community/Member Login)
- `MobileNav` component with `variant="homepage"`
- Complete footer with 4 columns (Brand, Contact, Quick Actions, Resources)

### Public Pages ❌
**Missing Header/Footer:**
- `/about`, `/resources`, `/contact`, `/help` - No header, only "Back to Home" button
- `/privacy-policy`, `/terms` - No header or footer
- Different background colors (gradients instead of consistent cream)
- No site branding/navigation
- Inconsistent navigation

### Login/Signup Pages ⚠️
**Partial Implementation:**
- Custom inline header with logo only (no navigation)
- No footer
- No navigation menu
- No mobile navigation

### Existing Components
- ✅ `SiteFooter` - Well-structured, 4-column layout
- ✅ `PlatformLayout` - For authenticated pages only
- ✅ `MobileNav` - Has `variant="homepage"` for public navigation

---

## Problems Identified

1. **Inconsistent Navigation** - Public pages have no navigation
2. **Missing Footer** - Only homepage has full footer
3. **No Branding** - Public pages lack logo/navy header
4. **Scattered Code** - Each page has own "Back to Home" button pattern
5. **User Experience** - Users get lost on public pages (no way to navigate except back button)
6. **Visual Inconsistency** - Gradient backgrounds differ across pages
7. **Auth State** - No consistent auth button display on public pages

---

## Implementation Plan

### Phase 1: Create PublicPageLayout Component

**New File:** `components/layout/PublicPageLayout.tsx`

**Features:**
1. **Navy Header** matching homepage design:
   - Logo and "CARE Collective" branding
   - Desktop navigation with homepage-style links (not anchors)
   - Auth-aware right-side buttons
   - MobileNav with `variant="homepage"`

2. **Navigation Links:**
   - Home (`/`)
   - About Us (`/about`)
   - Help (`/help`)
   - Resources (`/resources`)
   - Contact Us (`/contact`)

3. **Auth States:**
   - Not Authenticated: "Join Community" + "Member Login"
   - Authenticated: "Dashboard" + "Sign Out"

4. **Active State Highlighting:**
   - Highlight current page in navigation
   - Background: `bg-white/20 text-sage-light`
   - Font weight: `font-semibold`
   - Left indicator: Small sage dot

5. **Main Content Area:**
   - Children prop for page content
   - Proper spacing and padding

6. **SiteFooter:**
   - Reuse existing `SiteFooter` component
   - Optional via prop (`showFooter` default `true`)

**Key Design Decisions:**
- Header background: `bg-[#324158]` (navy)
- Use same mobile navigation as homepage
- Header links are page routes (not anchor links)
- Footer required on most pages, optional for login/signup

### Phase 2: Update Public Pages

**Pages to Update:**
1. `/about/page.tsx`
2. `/resources/page.tsx`
3. `/contact/page.tsx`
4. `/help/page.tsx`
5. `/privacy-policy/page.tsx`
6. `/terms/page.tsx`

**Changes:**
- Remove "Back to Home" button
- Remove custom header/footer code (if any)
- Wrap content in `PublicPageLayout`
- Change `bg-gradient-to-br` to `bg-background`
- Keep all existing page content/cards intact

### Phase 3: Update Auth Pages

**Pages to Update:**
1. `/login/page.tsx`
2. `/signup/page.tsx`

**Changes:**
- Remove custom inline header
- Use `PublicPageLayout` with `showFooter={true}`
- Remove `pt-24` from main (header will handle spacing)
- Keep form content intact
- Include full footer for access to legal links

### Phase 4: Update Special Pages

**Pages to Update:**
1. `/waitlist/page.tsx`
2. `/access-denied/page.tsx`

**Changes:**
- Wrap existing content in `PublicPageLayout`
- Include footer (these are public pages)
- Maintain existing messaging content
- Ensure consistent header

### Phase 5: Testing & Verification

**Manual Testing:**
- All public pages have navy header
- Navigation works on all 8+ pages
- Current page is highlighted in header
- Footer appears on all public pages
- Auth buttons show correctly (logged in vs out)
- Mobile navigation works with hamburger menu
- No "Back to Home" buttons remain
- Background is consistent (cream)
- Waitlist and access-denied pages have proper header/footer

**Automated Testing:**
- TypeScript compiles without errors
- ESLint passes (0 warnings)
- No console errors in browser
- No console warnings

### Phase 6: Git Workflow

**CRITICAL: Branch Strategy**
1. Create and switch to `feature/public-layout-standardization`
2. Make all changes following implementation steps
3. Test thoroughly on branch
4. Commit with descriptive message
5. Push feature branch
6. Create Pull Request to main
7. Review and approve PR
8. Merge to main

**PROHIBITED:**
- ❌ Direct commits to `main` branch
- ❌ Pushing to `main` branch
- ❌ Force merges without review
- ✅ All work must happen on feature branch

---

## Design Specifications

### Header Navigation (Desktop)
```typescript
const navItems = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About Us' },
  { href: '/help', label: 'Help' },
  { href: '/resources', label: 'Resources' },
  { href: '/contact', label: 'Contact Us' },
]
```

### Active State Implementation
```typescript
const isActive = (href: string) => {
  // Exact match for homepage
  if (href === '/') return pathname === '/';
  // Partial match for other pages
  return pathname.startsWith(href);
};
```

### Auth States
**Not Authenticated:**
- "Join Community" button (sage background)
- "Member Login" button (border, white)

**Authenticated:**
- "Dashboard" button (secondary background)
- "Sign Out" button

### Mobile Navigation
- Use existing `MobileNav` component with `variant="homepage"`
- Same hamburger menu as homepage
- Slide-in from right

### Footer
- Reuse existing `SiteFooter` component
- No changes needed to component itself
- Include on all public pages

### Background Colors
**Standardize to `bg-background` (cream)**
- Remove all gradient backgrounds
- Consistent visual experience
- Better accessibility (contrast)
- Easier to maintain

---

## Implementation Steps

### Step 0: Git Branch Creation
```bash
git checkout -b feature/public-layout-standardization
git status  # Verify clean working directory
```

### Step 1: Create PublicPageLayout Component
```
File: components/layout/PublicPageLayout.tsx

Features:
- Navy header (bg-[#324158])
- Desktop navigation with active state highlighting
- Auth-aware right-side buttons
- MobileNav variant="homepage"
- SiteFooter (optional via showFooter prop)
- Props interface with children and showFooter
```

### Step 2-7: Update Public Pages
**Changes:**
- Wrap content in `PublicPageLayout`
- Remove "Back to Home" buttons
- Change gradients to bg-background
- Keep all cards/sections content intact

Pages:
1. `/about/page.tsx`
2. `/resources/page.tsx`
3. `/contact/page.tsx`
4. `/help/page.tsx`
5. `/privacy-policy/page.tsx`
6. `/terms/page.tsx`

### Step 8-9: Update Auth Pages
**Changes:**
- Remove custom headers
- Use `PublicPageLayout` with `showFooter={true}`
- Remove `pt-24` from main (header handles spacing)
- Keep form content intact

Pages:
1. `/login/page.tsx`
2. `/signup/page.tsx`

### Step 10-11: Update Special Pages
**Changes:**
- Wrap existing content in `PublicPageLayout`
- Include footer

Pages:
1. `/waitlist/page.tsx`
2. `/access-denied/page.tsx`

### Step 12: Testing & Verification
**Manual Testing Checklist:**
- [ ] Header shows on all pages
- [ ] Navigation links work
- [ ] Active page is highlighted
- [ ] Auth buttons correct (logged out state)
- [ ] Auth buttons correct (logged in state)
- [ ] Mobile navigation works
- [ ] Footer appears
- [ ] Background is consistent (cream)
- [ ] No "Back to Home" buttons remain

**Automated Testing:**
```bash
npm run type-check  # TypeScript compilation
npm run lint        # ESLint validation
npm run test         # Unit tests (if affected)
```

### Step 13: Commit Changes
```bash
git add .
git commit -m "feat: standardize header/footer across public pages

- Create PublicPageLayout component with navy header and footer
- Update all public pages to use PublicPageLayout
- Add active state highlighting in navigation
- Standardize background colors to bg-background
- Include footer on login/signup pages
- Update waitlist/access-denied pages

🤖 Generated by build-agent (GLM-4.7)"
```

### Step 14: Create Pull Request
```bash
git push origin feature/public-layout-standardization

# Then via GitHub/GitHub CLI or web interface:
- Create PR from feature/public-layout-standardization → main
- Title: "Standardize header/footer across public pages"
- Description: Include implementation summary and testing checklist
- Request review before merge
```

### Step 15: Merge After Review
```bash
# After approval:
git checkout main
git pull origin main
git merge feature/public-layout-standardization
git push origin main

# Optional: Delete branch
git branch -d feature/public-layout-standardization
```

---

## Testing Checklist

### Functionality
- [ ] All public pages have navy header
- [ ] Navigation works on all 8+ pages
- [ ] Current page is highlighted in header
- [ ] Footer appears on all public pages
- [ ] Auth buttons show correctly (logged in vs out)
- [ ] Mobile navigation works with hamburger menu
- [ ] No "Back to Home" buttons remain in code
- [ ] Waitlist and access-denied pages have proper header/footer

### Visual Consistency
- [ ] Background is `bg-background` (cream) on all pages
- [ ] No gradient backgrounds remain
- [ ] Header matches homepage design
- [ ] Footer matches homepage design
- [ ] Logo and branding consistent
- [ ] Active state highlighting visible

### Accessibility
- [ ] Skip links work
- [ ] ARIA labels on navigation
- [ ] Keyboard navigation works
- [ ] Mobile touch targets (44px minimum)
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] Focus states visible
- [ ] Screen reader announcements

### Technical
- [ ] TypeScript compiles without errors
- [ ] ESLint passes (0 warnings)
- [ ] No console errors in browser
- [ ] No console warnings
- [ ] No build errors

---

## File Impact Summary

**Files to Create (1):**
1. `components/layout/PublicPageLayout.tsx`

**Files to Modify (10):**
1. `app/about/page.tsx`
2. `app/resources/page.tsx`
3. `app/contact/page.tsx`
4. `app/help/page.tsx`
5. `app/privacy-policy/page.tsx`
6. `app/terms/page.tsx`
7. `app/login/page.tsx`
8. `app/signup/page.tsx`
9. `app/waitlist/page.tsx`
10. `app/access-denied/page.tsx`

**Total Changes:** 11 files affected (1 new, 10 modified)

---

## Risk Assessment

**Risk Level:** Medium

**Concerns:**
- Changes affect 8+ public pages
- Auth state management across all pages
- Mobile navigation might need adjustments
- Background color changes visible to users

**Mitigations:**
- Work on feature branch (isolated from main)
- Comprehensive testing before merge
- Keep all page content intact (only wrapper changes)
- Test auth states (logged in/out)
- Gradual rollout via PR review process
- Manual testing of all affected pages

---

## Design Decisions Rationale

### Footer on Login/Signup: YES
**Decision:** Both login and signup pages should include `SiteFooter`

**Rationale:**
- Consistent user experience across all public-facing pages
- Users need access to legal links (Terms, Privacy) even when signing up
- Footer branding reinforces trust during registration
- Better UX - can navigate without scrolling up

### Active State Styling: YES
**Decision:** Header navigation should highlight current page

**Rationale:**
- Clear visual indicator of user's location
- Improved navigation UX
- Standard web pattern
- Consistent with platform design

### Background Colors: bg-background (cream)
**Decision:** Standardize all public pages to `bg-background`

**Rationale:**
- Consistent across all public pages
- Cleaner, less distracting than gradients
- Matches homepage design
- Improves accessibility (better contrast)
- Easier to maintain
- Reduces CSS bundle size

### Header on Waitlist/Access-Denied: YES
**Decision:** Both pages get full `PublicPageLayout`

**Rationale:**
- Consistent branding across all user-facing pages
- Users may land here without navigation
- Footer provides legal links
- Better UX than isolated pages

---

## Questions & Answers

1. **Footer on login/signup?**
   - ✅ YES - Both pages will show `SiteFooter`

2. **Active state styling?**
   - ✅ YES - Navigation will highlight current page

3. **Header on waitlist/access-denied?**
   - ✅ YES - Both will get full `PublicPageLayout`

4. **Background colors?**
   - ✅ YES - Standardize all to `bg-background` (cream)

---

## Success Criteria

**Project is complete when:**
1. All public pages use `PublicPageLayout` component
2. Navy header appears on all public pages
3. Navigation works with active state highlighting
4. Footer appears on all public pages
5. Auth buttons display correctly based on state
6. Mobile navigation works on all pages
7. Background is consistent (`bg-background`)
8. All automated tests pass
9. Manual testing checklist complete
10. Changes merged to main via pull request

---

## Related Documentation

- [CLAUDE.md](/CLAUDE.md) - Project guidelines and conventions
- [pages-reference.md](docs/reference/pages-reference.md) - Complete page route reference
- [MobileNav Component](components/MobileNav.tsx) - Mobile navigation implementation
- [SiteFooter Component](components/layout/SiteFooter.tsx) - Footer implementation

---

**Next Steps:** Execute implementation using orchestration prompt generated by @prompt-builder
