# Implementation Plan: CARE Collective Client Feedback (January 1, 2026)

> Created: January 2, 2026
> Status: Ready for Orchestrator
> Client: Dr. Maureen Templeman
> Project: CARE Collective Website (swmocarecollective.org)

## Git Workflow Requirements

**IMPORTANT - Branch & Approval Process:**
1. Create a new branch for this work: `feature/client-feedback-jan2026`
2. Commit all changes to this branch
3. **DO NOT push to main or create PR** - Wait for client review and approval
4. After approval, the team will merge via standard PR process

**Branch Name:** `feature/client-feedback-jan2026`

---

## Overview

This plan addresses all feedback items from Dr. Maureen Templeman's January 1, 2026 email. The changes focus on typography improvements, content corrections, dashboard enhancements, and social media integration.

**Reference Documents:**
- Client feedback email: `/home/evan/care-collective-preview/docs/client/emails/Email-01012026.eml`
- Current implementation: `/home/evan/care-collective-preview/app/`

---

## Executive Summary

### Scope
- 10 files requiring modifications
- No database schema changes
- CSS/Tailwind updates + content changes
- No breaking changes to functionality

### Timeline
- Estimated: 4-6 hours of agent work
- Recommended: Single Orchestrator session with parallel execution

---

## Phase 1: Design System & Typography

### 1.1 Add Teal Accent Color to Tailwind Config

**File:** `tailwind.config.ts`

**Change:** Add new color token for teal (#3D4F52) as specified in client feedback.

```typescript
// Add to colors section:
teal: {
  DEFAULT: "#3D4F52",
  light: "#4A6065",
  dark: "#2D3A3D",
}
```

**Rationale:** Client requested teal (#3D4F52) for buttons and accents to complement existing sage/dusty-rose palette.

---

### 1.2 Update Global Typography Scale

**Approach:** Create CSS custom properties in globals.css for consistent typography across the platform.

**Target Sizes:**
- Body text: Increase from 16px to 17px (text-base → text-[17px])
- Body text on cream: Darken color for better contrast
- Section headings: Increase by ~20% from current sizes
- Mobile text: Ensure minimum 16px, target 17px

**Implementation:**
Add to `app/globals.css`:
```css
:root {
  --text-body: 17px;
  --text-body-light: #6B5B4F; /* Darker than current on cream */
  --text-heading-scale: 1.2; /* 20% larger than current */
}
```

**Classes to update:**
- `text-base` → `text-[17px]`
- `text-foreground/70` → `text-[color:var(--text-body-light)]`
- Section heading `text-[clamp(32px,5vw,48px)]` → increase multiplier

---

### 1.3 Update Hero Component Typography

**File:** `components/Hero.tsx`

**Changes:**
1. "Southwest Missouri" headline:
   - Current: `text-xl sm:text-2xl font-bold`
   - Target: `text-2xl sm:text-3xl font-bold`
   
2. Body description text:
   - Increase font size by one level
   - Darken text color for better contrast on cream background

**Code location:** Lines 117-143

```typescript
// Line 117-119 - Increase size
<p className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
  Southwest Missouri
</p>

// Line 136-143 - Increase description size and darken
<p
  className="text-[17px] text-[color:var(--text-body-light)] max-w-2xl mx-auto sm:mx-0 leading-relaxed"
>
```

---

## Phase 2: Homepage Section Updates

### 2.1 About Section - Add "Founder" Title

**File:** `app/page.tsx`

**Location:** Line 378-380 (About section, under Maureen portrait)

**Current:**
```typescript
<p className="mt-6 text-lg italic text-white/90 text-center font-medium">
  Dr. Maureen Templeman
</p>
```

**Update:**
```typescript
<p className="mt-6 text-lg italic text-white/90 text-center font-medium">
  Dr. Maureen Templeman, Founder
</p>
```

---

### 2.2 Fix "Together, we are making caregiving sustainable" Text Size

**File:** `app/page.tsx`

**Location:** Lines 402-404 (About section, highlighted statement)

**Current:**
```typescript
<p className="text-2xl md:text-3xl lg:text-[32px] font-bold text-white leading-snug">
  Together, we are making caregiving sustainable.
</p>
```

**Update:** Match or slightly larger than the text above it (line 396-398):
```typescript
<p className="text-[27px] md:text-[32px] lg:text-[36px] font-bold text-white leading-snug">
  Together, we are making caregiving sustainable.
</p>
```

**Rationale:** Client requested this be the same size/weight as the line above it for visual consistency.

---

### 2.3 Mobile - Move Founder Photo Below Section Content

**File:** `app/page.tsx`

**Location:** About section, lines 354-381 (flex container)

**Current Layout:**
- Mobile: Photo appears first, then content
- Desktop: Photo left, content right

**Current Code (line 351):**
```typescript
<div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
```

**Current Photo (line 354):**
```typescript
<div className="flex-shrink-0 text-center">
```

**Update:** Change flex order on mobile so content appears first:

```typescript
// Change line 351 to reorder on mobile:
<div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20">

// Photo stays at line 354, but now appears SECOND on mobile
```

**Rationale:** Client requested moving the founder photo below the "Who We Are" section content on mobile devices for better flow.

---

## Phase 3: Join Page Updates

### 3.1 Update Subheading Text

**File:** `app/signup/page.tsx`

**Location:** Line 178

**Current:**
```typescript
<p className="text-base md:text-lg text-muted-foreground">Create your account to start helping your community</p>
```

**Update:**
```typescript
<p className="text-base md:text-lg text-muted-foreground">Create an account below</p>
```

---

## Phase 4: Resources Page Updates

### 4.1 Center Section Subheadings

**File:** `app/resources/page.tsx`

**Approach:** Update the `SectionHeader` component usage to center-align subheadings.

**Current (lines 69-74, 96-101, 124-129):**
```typescript
<SectionHeader
  title="Well-Being"
  description="Find support for emotional health, caregiving challenges, and serious illness."
  icon={<Heart className="w-8 h-8 text-white" />}
  iconBgColor="dusty-rose"
/>
```

**Update:** Add center alignment classes or update SectionHeader component props:
```typescript
<SectionHeader
  title="Well-Being"
  description="Find support for emotional health, caregiving challenges, and serious illness."
  icon={<Heart className="w-8 h-8 text-white" />}
  iconBgColor="dusty-rose"
  className="text-center" // Add this
  descriptionClassName="text-center" // Add this
/>
```

**Note:** May need to update the `SectionHeader` component in `components/public/SectionHeader.tsx` to support center alignment.

---

### 4.2 Update Hospice Resource Title

**File:** `app/resources/page.tsx`

**Location:** Line 78 (Well-Being section)

**Current:**
```typescript
<ResourceCard
  title="Local Hospice & Palliative Care Programs"
  description="Provide compassionate support for individuals and families during serious illness (e.g., CoxHealth Palliative Care, Good Shepherd, Seasons)."
/>
```

**Update:**
```typescript
<ResourceCard
  title="Hospice Foundation for Outreach"
  description="Provide compassionate support for individuals and families during serious illness (e.g., CoxHealth Palliative Care, Good Shepherd, Seasons)."
/>
```

---

## Phase 5: Dashboard & Member Portal Updates

### 5.1 Increase Dashboard Card Heading Sizes

**File:** `app/dashboard/page.tsx`

**Changes:** Update all `CardTitle` components from `text-lg` to `text-xl` or larger.

**Locations:**
- Line 245: "Need Help?" - `className="flex items-center gap-2 text-lg"`
- Line 266: "Want to Help?" - `className="flex items-center gap-2 text-lg"`
- Line 287: "Messages" - `className="flex items-center gap-2 text-lg"`
- Line 319: "Your Requests" - `className="text-base font-semibold"`
- Line 331: "Messages" - `className="text-base font-semibold"`
- Line 345: "Community Impact" - `className="text-base font-semibold"`

**Update:** Increase all to `text-xl`:
```typescript
className="flex items-center gap-2 text-xl" // For action cards
className="text-xl font-semibold" // For stat cards
```

---

### 5.2 Update "Offer to Help" Form

**File:** `app/requests/page.tsx` (main requests listing with modal)

**Changes:**

1. **Increase Form Text Sizes:**
   - Labels: Increase from `text-sm` to `text-base`
   - Input text: Increase from default to 16px+
   - Descriptions: Increase for readability

2. **Update Placeholder Text:**
   - Find the "Offer to Help" message textarea
   - Current placeholder: Generic message
   - Target placeholder: "Hi. I think I can help! I am available most days after 5 PM"

**Note:** If this form is in a modal component, locate the modal component (likely `RequestModal` or similar) and update there.

---

## Phase 6: Admin Panel Improvements

### 6.1 Show Email Address on Pending Applications

**File:** `app/admin/applications/page.tsx`

**Changes:**

1. **Update Interface (line 13-21):** Add email to ApplicationData
```typescript
interface ApplicationData {
  id: string
  name: string
  email: string | null  // ADD THIS
  location: string | null
  application_reason: string | null
  applied_at: string | null
  verification_status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
}
```

2. **Update Query (line 77):** Include email in select
```typescript
.select('id, name, email, location, application_reason, applied_at, verification_status, rejection_reason')
```

3. **Update Display (line 174-179):** Show email in application details
```typescript
<div className="space-y-1 text-sm text-muted-foreground">
  {application.location && (
    <p>📍 {application.location}</p>
  )}
  {application.email && (
    <p>✉️ {application.email}</p>  // ADD THIS
  )}
  <p>📅 Applied {formatTimeAgo(application.applied_at)}</p>
</div>
```

---

## Phase 7: Footer Social Media Integration

### 7.1 Add Facebook Icon to Both Footers

**Files:**
- `components/layout/SiteFooter.tsx`
- `components/layout/PublicPageFooter.tsx`

**Facebook URL:** `https://www.facebook.com/profile.php?id=61582852599484`

**Update for SiteFooter.tsx (lines 123-141):** Add social media section in the Support column or create new column:

```typescript
// Add after Support section or within it:
<div className="space-y-4">
  <h3 className="font-semibold text-lg">Follow Us</h3>
  <div className="flex items-center gap-4">
    <a 
      href="https://www.facebook.com/profile.php?id=61582852599484"
      target="_blank"
      rel="noopener noreferrer"
      className="text-gray-300 hover:text-white transition-colors"
      aria-label="Follow us on Facebook"
    >
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
      </svg>
    </a>
  </div>
</div>
```

**Update for PublicPageFooter.tsx (lines 67-99):** Add Facebook link to Resources column or create new column following the same pattern.

**Note:** Use the official Facebook SVG icon path or lucide-react Facebook icon if available.

---

## Files Summary

| # | File | Priority | Change Type |
|---|------|----------|-------------|
| 1 | `tailwind.config.ts` | High | Add teal color token |
| 2 | `app/globals.css` | High | Typography CSS variables |
| 3 | `components/Hero.tsx` | High | Typography increases |
| 4 | `app/page.tsx` | High | Multiple content/typography updates |
| 5 | `app/signup/page.tsx` | Medium | Text change |
| 6 | `app/resources/page.tsx` | Medium | Content + alignment updates |
| 7 | `app/dashboard/page.tsx` | Medium | Typography increases |
| 8 | `app/requests/page.tsx` | Medium | Form text + placeholder |
| 9 | `app/admin/applications/page.tsx` | Medium | Add email display |
| 10 | `components/layout/SiteFooter.tsx` | Medium | Add Facebook icon |
| 11 | `components/layout/PublicPageFooter.tsx` | Medium | Add Facebook icon |

---

## Implementation Notes

### Testing Requirements
- Verify typography scales consistently across breakpoints
- Check color contrast on cream backgrounds
- Test mobile layout changes (founder photo ordering)
- Verify all form components render correctly after text size increases
- Test admin panel with pending applications

### No Breaking Changes
- All changes are visual/content only
- No API changes required
- No database schema changes
- No authentication flow changes

### Dependencies
- New hero image file (if provided by client) → `public/hero-image.jpg`
- No external library additions required

---

## Git Workflow for This Session

### Before Starting Work
```bash
# Create and checkout the feature branch
git checkout -b feature/client-feedback-jan2026

# Verify you're on the new branch
git branch
```

### During Implementation
```bash
# Stage changes as you complete them
git add .

# Commit with descriptive message
git commit -m "feat: implement client feedback - [brief description] 🤖 Generated by orchestrator"

# Repeat for each major change group
```

### After Completion (DO NOT PUSH TO MAIN)
```bash
# Push branch to origin (but not to main)
git push origin feature/client-feedback-jan2026

# DO NOT create PR or merge to main
# Wait for client review and approval
```

**Important:** All commits stay on `feature/client-feedback-jan2026` until approved.

---

## Commands for Verification

After implementation, run:

```bash
# TypeScript check
npm run type-check

# Lint check
npm run lint

# Build test
npm run build

# Visual regression testing (if available)
npm run test:visual
```

---

## References

- Client Feedback Email: `/home/evan/care-collective-preview/docs/client/emails/Email-01012026.eml`
- Brand Colors: `tailwind.config.ts` (existing colors)
- Teal Color Request: `#3D4F52`
- Facebook URL: `https://www.facebook.com/profile.php?id=61582852599484`

---

*Plan prepared for Orchestrator session execution*
