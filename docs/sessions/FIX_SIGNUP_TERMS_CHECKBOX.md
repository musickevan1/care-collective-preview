# Fix Session: Add Terms of Service Checkbox to Signup Form

**Priority**: CRITICAL
**Issue**: Missing required Terms of Service acceptance checkbox on signup page
**Discovered**: 2025-10-22 during comprehensive platform testing

---

## Problem

The signup form at `/signup` is missing a required Terms of Service agreement checkbox. Users can currently create accounts without explicitly agreeing to the platform's terms.

**Current State**: Signup form has name, email, password, location, and reason fields - but NO ToS checkbox.

**Required State**: Form must include a checkbox requiring users to agree to Terms of Service before account creation.

---

## Your Task

Please plan and implement a fix for this issue:

1. **Add Terms of Service Checkbox**
   - Required checkbox that must be checked to submit form
   - Label text: "I agree to the Terms of Service" (or similar)
   - Link "Terms of Service" text to `/terms` page
   - Checkbox must be visually consistent with platform design

2. **Implement Validation**
   - Form cannot be submitted if checkbox is unchecked
   - Display clear error message if user tries to submit without checking
   - Client-side validation for immediate feedback
   - Server-side validation for security

3. **Follow Platform Guidelines**
   - Match existing form styling (dusty-rose/sage color scheme)
   - Ensure WCAG 2.1 AA accessibility compliance
   - 44px minimum touch target for mobile
   - Clear focus indicators for keyboard navigation
   - Proper ARIA labels for screen readers

4. **Test the Implementation**
   - Verify checkbox appears correctly
   - Test validation (try submitting without checking)
   - Test link to Terms of Service page works
   - Test on mobile viewport (375px)
   - Check accessibility with keyboard navigation

---

## Relevant Files

**Primary File** (most likely):
- `app/signup/page.tsx` - Signup page component

**Validation** (may need updates):
- `lib/validations.ts` - Zod schemas for form validation
- Check for `signupSchema` or similar

**Reference**:
- `/terms` page exists and works correctly
- CLAUDE.md shows validation patterns using Zod

---

## Design Reference

From CLAUDE.md, the validation should follow this pattern:

```typescript
import { z } from 'zod';

export const signupSchema = z.object({
  // ... existing fields ...
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Terms of Service" })
  }),
});
```

---

## Success Criteria

✅ Terms of Service checkbox appears on signup form
✅ Checkbox is required (form cannot submit without it)
✅ "Terms of Service" text links to `/terms` page
✅ Error message displays if submission attempted without checkbox
✅ Styling matches platform design system
✅ Accessible via keyboard navigation
✅ Works on mobile viewports
✅ Form validation prevents unchecked submissions

---

## Testing After Fix

After implementing, test:
1. Try submitting form without checking box (should fail)
2. Check the box and submit with valid data (should succeed)
3. Click "Terms of Service" link (should open `/terms`)
4. Test with keyboard only (Tab to checkbox, Space to check)
5. Test on mobile viewport (checkbox should be large enough)

---

## Additional Context

**Platform**: Care Collective - Mutual aid platform
**Tech Stack**: Next.js 14.2.32, React 18.3.1, TypeScript, Supabase, Tailwind CSS 4
**Brand Colors**: --sage: #7A9E99, --dusty-rose: #D8A8A0

**Critical**: This is blocking ongoing comprehensive testing. Once fixed, testing will resume with Phase 2 (authentication flow).

---

**Start by reading the signup page file, planning the fix, then implementing it.**
