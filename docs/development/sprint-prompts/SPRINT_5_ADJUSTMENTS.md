# Sprint 5: Post-Verification Adjustments

## Objective
Address any gaps or issues identified during the Playwright visual verification and ensure the `--text-body-light` color variable is properly applied.

## Background

During verification, all 14 public page tasks passed. However, a code review revealed:

1. **`--text-body-light: #5a453d`** was created but never applied to any components
2. The `text-muted-foreground` class still uses `#483129` which may appear faded on cream background
3. Manual verification is still needed for Dashboard, Offer Help dialog, and Admin Panel

---

## Tasks

### Task 5.1: Apply Darker Body Text Color (OPTIONAL - Visual Review First)

**Priority:** Low (verify visually before implementing)

**Question:** Does the current body text color (`#483129`) actually appear too faded on cream background?

**If YES, apply these changes:**

**Option A: Update muted-foreground color**
File: `app/globals.css` (line 46)

```css
/* Current */
--color-muted-foreground: #483129;

/* Change to darker */
--color-muted-foreground: #3d2a23;
```

**Option B: Create new utility class and selectively apply**
File: `app/globals.css`

```css
/* Add this utility class */
.text-body-dark {
  color: var(--text-body-light); /* #5a453d */
}
```

Then apply to specific elements that need more contrast.

**Files potentially affected:**
- `app/page.tsx` - Landing page body text
- `components/Hero.tsx` - Hero description
- `app/resources/page.tsx` - Resource descriptions
- `app/signup/page.tsx` - Form help text

**Decision needed:** Should we darken ALL muted text, or only specific sections?

---

### Task 5.2: Verify Resources Page Description Alignment

**Priority:** Medium

The verification report mentions section descriptions are centered, but let me verify the main page description is also properly styled.

**File:** `app/resources/page.tsx` (line 24)

**Current:**
```tsx
<p className="text-lg md:text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed mb-12">
```

**Check:** Is this text centered? It has `mx-auto` but no `text-center`.

**If not centered, add:**
```tsx
<p className="text-lg md:text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed mb-12 text-center">
```

---

### Task 5.3: Manual Verification Checklist (No Code Changes)

**Priority:** High

Create checklist items for manual testing of authenticated pages:

#### Dashboard Verification
- [ ] Log in to dashboard at `/dashboard`
- [ ] Verify "Need Help?", "Want to Help?", "Messages" card headings are `text-xl md:text-2xl font-bold`
- [ ] Headings should be visually larger than the buttons below them
- [ ] Screenshot for records

#### Offer Help Dialog Verification
- [ ] Navigate to `/requests`
- [ ] Click "Offer Help" on any request
- [ ] Verify dialog label says "Your message" in `text-lg font-medium`
- [ ] Verify textarea text is `text-lg`
- [ ] Verify placeholder text is: "Hi. I think I can help! I am available most days after 5 PM"
- [ ] Screenshot for records

#### Admin Panel Verification
- [ ] Log in as admin
- [ ] Navigate to `/admin/applications`
- [ ] Verify pending applications show:
  - [ ] Phone number (with Phone icon)
  - [ ] Email verification badge (green "Email Verified" or yellow "Email Unverified")
  - [ ] Caregiving situation (in sage-light/10 box if provided)
- [ ] Screenshot for records

---

## Blocked Items (Awaiting Client)

These items from original feedback are still blocked:

| Task | Blocker | Action Needed |
|------|---------|---------------|
| Hero image replacement | Need image | Client to provide community/peer-focused image OR confirm stock subscription |
| Login destination | Need decision | Client to confirm: home page or dashboard after login? |
| Stock image subscription | Need answer | Does client have or want paid stock image access? |

---

## Verification Steps

After adjustments (if any):

1. **Text Contrast Check:**
   - Use Chrome DevTools → Accessibility → Contrast ratio
   - Body text on cream should meet WCAG AA (4.5:1 minimum)

2. **Visual Comparison:**
   - Compare before/after screenshots
   - Ensure text is clearly readable without straining

3. **Cross-Browser Check:**
   - Test in Chrome, Firefox, Safari
   - Verify colors render consistently

---

## Commit Message (if changes made)

```
fix(typography): apply darker body text color for improved contrast

- Update muted-foreground color to #3d2a23 for better readability on cream
- OR: Add text-body-dark utility class for selective application
- Center Resources page main description

Sprint 5 adjustments for client feedback (Jan 2026)
```

---

## Decision Points

Before implementing, answer these questions:

1. **Is the current body text color actually problematic?**
   - Review screenshots from verification
   - Get client feedback on current contrast
   
2. **Should we change ALL muted text, or just specific areas?**
   - Global change: Faster, consistent, but affects all pages
   - Selective change: More control, but requires more code changes

3. **Which authentication method for manual testing?**
   - Use existing test account
   - Ask for credentials
   - Skip and document for client to verify

---

## Files Reference

| File | Purpose |
|------|---------|
| `app/globals.css` | CSS variables including `--text-body-light` |
| `app/styles/tokens.css` | Typography tokens |
| `app/page.tsx` | Landing page |
| `components/Hero.tsx` | Hero section |
| `app/resources/page.tsx` | Resources page |
| `app/signup/page.tsx` | Signup page |
| `app/dashboard/page.tsx` | Dashboard (auth required) |
| `components/help-requests/HelpRequestCardWithMessaging.tsx` | Offer Help dialog |
| `app/admin/applications/page.tsx` | Admin applications |

---

*Created: January 6, 2026*
*Status: Planning - Awaiting decision on color adjustment*
