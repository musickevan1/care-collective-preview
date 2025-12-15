# Client Alignment Plan - CARE Collective
## December 2025

This documentation folder contains the detailed implementation plan for aligning the CARE Collective platform with client feedback from the document "Send to Evan 1024.docx".

---

## Document Index

| File | Phase | Description |
|------|-------|-------------|
| `00-overview.md` | - | This overview document |
| `01-phase-global-foundation.md` | 1 | CARE capitalization, terminology, colors |
| `02-phase-landing-page.md` | 2 | Landing page restructure and content |
| `03-phase-individual-pages.md` | 3 | Individual page updates |
| `04-phase-cleanup-features.md` | 4 | Crisis page removal, email notifications |

---

## Alignment Status Summary

| Category | Current Alignment | After Implementation |
|----------|-------------------|---------------------|
| Branding (CARE caps) | 85% | 100% |
| Terminology (mutual aid→support) | 40% | 100% |
| Landing Page Layout | 70% | 100% |
| Individual Pages | 60% | 100% |
| Color Scheme | 80% | 100% |

---

## Client Questions Addressed

### From Client Document:
> "Can you do another quick run through to be sure CARE is capitalized everywhere?"

**Answer**: Phase 1 addresses all capitalization issues including email templates.

---

> "I don't know why, but I don't like the term 'mutual aid.' Can you replace any instances of that with 'mutual assistance' or 'mutual support'?"

**Answer**: Phase 1 replaces all "mutual aid" terminology throughout the platform.

---

> "I really like the minimalist icons on the sub-pages. Can you replace any emojis with that kind of icon?"

**Answer**: Phase 1 includes emoji audit and replacement with Lucide React icons.

---

> "If I create a request, do I need to keep logging in and checking to see if someone responded or is there a way to link this to my email?"

**Answer**: Phase 4 implements email notifications when someone offers help on a request.

---

## Implementation Approach

**Strategy**: Phased commits with separate git commits per phase

| Phase | Commit Message | Files | Est. Edits |
|-------|---------------|-------|------------|
| 1 | `fix: Update branding - CARE caps, mutual support terminology, new colors` | 6 | ~20 |
| 2 | `feat: Landing page redesign per client feedback` | 2 | ~30 |
| 3 | `feat: Update individual pages per client feedback` | 7 | ~40 |
| 4 | `feat: Add email notifications, remove crisis page, cleanup` | 4 | ~15 |

**Total**: 12 files modified, 1 file deleted, ~105 edits

---

## Decisions Made

| Question | Decision | Rationale |
|----------|----------|-----------|
| Email notifications for help offers | Yes, add email | Client explicitly asked about this |
| Background check provider | Skip for now | Need more info from client |
| IP ownership | CARE Collective | Client was unsure, defaulting to organization |
| Menu items (Home/Contact) | Evaluate during implementation | Client said "maybe remove" |
| Help page content | Simplify now | Create clean structure for future content |

---

## New Color Palette

```
Background colors:
- Dark blue: #324158 (header/footer)
- Cream: #FBF2E9 (main background)

Accent colors:
- Almond (NEW): #E9DDD4 (How It Works boxes)
- Seafoam (NEW): #D6E2DF
- Rose (REVISED): #C28C83
- Clay: #C39778
- Terra cotta: #BC6547
- Brown: #483129
- Teal: #7A9E99
```

---

## Critical Files

| Priority | File Path | Changes |
|----------|-----------|---------|
| HIGH | `app/page.tsx` | Landing page restructure |
| HIGH | `lib/email-service.ts` | CARE caps + email notifications |
| HIGH | `app/signup/page.tsx` | Required fields |
| HIGH | `app/resources/page.tsx` | Crisis lines integration |
| MED | `components/Hero.tsx` | Text updates |
| MED | `app/help/page.tsx` | Major simplification |
| DEL | `app/crisis-resources/page.tsx` | Remove entirely |

---

*Source Document*: "Send to Evan 1024.docx"
*Plan Created*: December 2025
