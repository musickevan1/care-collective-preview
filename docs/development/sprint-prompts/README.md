# Client Feedback Implementation Sprints

## Overview

This directory contains implementation prompts for addressing client feedback from January 2026.

**Total Tasks:** 19  
**Completed:** 0  
**In Progress:** 0  
**Blocked:** 3 (waiting on client)

## Sprint Structure

| Sprint | Focus | Tasks | Priority | Status |
|--------|-------|-------|----------|--------|
| [Sprint 1](./SPRINT_1_TYPOGRAPHY.md) | Typography Foundation | 5 | HIGH | Pending |
| [Sprint 2](./SPRINT_2_LANDING_PAGE.md) | Landing Page Content | 4 | MEDIUM | Pending |
| [Sprint 3](./SPRINT_3_PAGE_UPDATES.md) | Page-Specific Updates | 5 | MEDIUM | Pending |
| [Sprint 4](./SPRINT_4_ADMIN_PANEL.md) | Admin Panel Enhancement | 1 | MEDIUM | Pending |
| Blocked | Waiting on Client | 3 | LOW | Blocked |

## Execution Order

```
Sprint 1 (Typography) ─────┐
                          ├──> Deploy & Verify ──> Sprint 4 (Admin)
Sprint 2 (Landing Page) ──┤
                          │
Sprint 3 (Page Updates) ──┘
```

**Recommended Flow:**
1. Complete Sprint 1 first (affects all pages)
2. Run Sprints 2, 3, 4 in parallel or sequence
3. Deploy after each sprint for visual verification
4. Address blocked items when client responds

## Quick Reference: Vulcan Task IDs

### Sprint 1 - Typography (HIGH)
- `c7a06ba5` - Hero "Southwest Missouri" size
- `b8968533` - Body text size increase
- `f6b36637` - Body text color darken
- `f0a4b353` - Section heading sizes
- `3af27c26` - Mobile text sizing

### Sprint 2 - Landing Page (MEDIUM)
- `362a5978` - "Together, we are making..." font match
- `161ce9db` - Remove duplicate Join button
- `117105ad` - Verify Founder title
- `e7773d39` - Mobile photo placement

### Sprint 3 - Page Updates (MEDIUM)
- `9ee758f5` - Verify Join page text
- `be4549f8` - Resources subheadings centered
- `dbb6104d` - Verify Hospice name
- `07b7e9aa` - Dashboard heading sizes
- `2523a8be` - Offer Help form text size
- `7913c1c1` - Verify Offer Help placeholder

### Sprint 4 - Admin Panel (MEDIUM)
- `4efa0b22` - Admin pending requests info

### Blocked (LOW)
- `82f35f63` - Hero image replacement
- `1d098ca4` - Login destination question
- `96b6483d` - Stock image question

## Verification Checklist

After all sprints complete:

- [ ] All body text readable on mobile without zooming
- [ ] Text contrast meets WCAG AA on cream background
- [ ] "Southwest Missouri" prominent in hero
- [ ] Section headings fill their space
- [ ] Only one Join button in "What Is CARE Collective"
- [ ] Mobile photo below "Who We Are" content
- [ ] Dashboard headings larger than buttons
- [ ] Offer Help form easily readable
- [ ] Admin sees phone, caregiving situation, email status

## Related Documents

- [Client Feedback Email](../../client/CLIENT_FEEDBACK_2026-01-01.md)
- [Project Status](../../../PROJECT_STATUS.md)
- [Design Tokens](../../../app/styles/tokens.css)

---

*Created: January 5, 2026*  
*Last Updated: January 5, 2026*
