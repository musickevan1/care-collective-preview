# Phase 1: Global Foundation

**Commit Message**: `fix: Update branding - CARE caps, mutual support terminology, new colors`

---

## Overview

This phase establishes the foundation for all other changes by addressing:
1. Brand consistency ("CARE" capitalization)
2. Terminology alignment ("mutual aid" → "mutual support/assistance")
3. Color palette additions
4. Emoji replacement with icons

---

## 1.1 "CARE" Capitalization

### Client Request
> "Can you do another quick run through to be sure CARE is capitalized everywhere?"

### Files to Update

#### `/lib/email-service.ts`
**Current State**: Uses "Care Collective" (lowercase 'a')
**Required**: Change to "CARE Collective"

| Line | Current Text | New Text |
|------|--------------|----------|
| ~40 | "Welcome to Care Collective, ${name}!" | "Welcome to CARE Collective, ${name}!" |
| ~55 | "Care Collective - Building stronger communities" | "CARE Collective - Building stronger communities" |
| ~70 | "Care Collective - Southwest Missouri's mutual aid network" | "CARE Collective - Southwest Missouri's mutual support network" |
| ~85 | "Your application to join Care Collective has been approved" | "Your application to join CARE Collective has been approved" |
| ~100 | "Update on your Care Collective account" | "Update on your CARE Collective account" |
| (additional instances) | "Care Collective" | "CARE Collective" |

**Total changes in this file**: ~8+ instances

#### `/app/help/page.tsx`
**Current State**: File comment uses "Care Collective users"
**Required**: Change to "CARE Collective users"

```typescript
// Line 2 (file comment)
// Current:
* @fileoverview Help and support page for Care Collective users

// Updated:
* @fileoverview Help and support page for CARE Collective users
```

### Verification Checklist
- [ ] All email templates use "CARE Collective"
- [ ] All page file comments use "CARE Collective"
- [ ] Run `grep -r "Care Collective" --include="*.ts" --include="*.tsx"` to verify no missed instances

---

## 1.2 Terminology: "mutual aid" → "mutual support/assistance"

### Client Request
> "I don't know why, but I don't like the term 'mutual aid.' Can you replace any instances of that with 'mutual assistance' or 'mutual support'?"

### Usage Guidelines
- **"mutual support"** - For general descriptions and user-facing content
- **"mutual assistance"** - For formal/legal documents (Terms, Privacy Policy)

### Files to Update

#### `/app/page.tsx` (Footer)
```typescript
// Line ~465
// Current:
"Community mutual aid for Southwest Missouri"

// Updated:
"Community mutual support for Southwest Missouri"
```

#### `/app/terms/page.tsx`
```typescript
// Metadata description
// Current:
"Terms of Service and user agreement for the CARE Collective mutual aid platform"

// Updated:
"Terms of Service and user agreement for the CARE Collective mutual assistance platform"

// Section 2 body text
// Current:
"The CARE Collective is a mutual aid platform that connects family caregivers"

// Updated:
"The CARE Collective is a mutual assistance platform that connects family caregivers"
```

#### `/app/privacy-policy/page.tsx`
```typescript
// Metadata description
// Current:
"Privacy Policy for the CARE Collective mutual aid platform"

// Updated:
"Privacy Policy for the CARE Collective mutual assistance platform"

// Section 2 body text
// Current:
"Connect you with community members for mutual aid"

// Updated:
"Connect you with community members for mutual assistance"
```

#### `/lib/email-service.ts`
```typescript
// In email templates
// Current:
"Southwest Missouri's mutual aid network"

// Updated:
"Southwest Missouri's mutual support network"
```

### Verification Checklist
- [ ] Footer updated to "mutual support"
- [ ] Terms page uses "mutual assistance"
- [ ] Privacy Policy uses "mutual assistance"
- [ ] Email templates use "mutual support"
- [ ] Run `grep -r "mutual aid" --include="*.ts" --include="*.tsx"` to verify no missed instances

---

## 1.3 New Color Palette

### Client Request
> Color Palette Reference at end of document

### Colors to Add to `/tailwind.config.ts`

```typescript
// In the colors section of tailwind.config.ts
colors: {
  // Existing colors remain...

  // NEW colors to add:
  almond: '#E9DDD4',    // For How It Works boxes (client specified)
  seafoam: '#D6E2DF',   // New accent color
  rose: '#C28C83',      // Revised from dusty-rose (different shade)
}
```

### Color Usage Plan
| Color | Hex | Usage |
|-------|-----|-------|
| Almond | #E9DDD4 | How It Works section boxes (replacing white) |
| Seafoam | #D6E2DF | Available as accent, determine usage in Phase 2 |
| Rose | #C28C83 | Alternative to dusty-rose for specific elements |

---

## 1.4 Emoji Replacement with Icons

### Client Request
> "I really like the minimalist icons on the sub-pages. Can you replace any emojis with that kind of icon?"

### Audit Required
Search for emoji usage across the codebase:
```bash
# Find files with potential emoji usage
grep -r "🙌\|👋\|❤️\|✅\|⚠️" --include="*.tsx" --include="*.ts"
```

### Known Emoji Locations
| File | Context | Current | Replacement Icon |
|------|---------|---------|-----------------|
| Notification titles | Help offer | "🙌" | `<ThumbsUp />` or `<HandHeart />` |
| (audit needed) | TBD | TBD | Lucide React icons |

### Icon Library
The project already uses **Lucide React** (`lucide-react`) for icons.

Common icon replacements:
- 🙌 → `<HandHeart />` or `<Heart />`
- 👋 → `<Hand />`
- ✅ → `<Check />` or `<CheckCircle />`
- ⚠️ → `<AlertTriangle />`
- ❤️ → `<Heart />`

---

## Implementation Order

1. **First**: Update `/tailwind.config.ts` with new colors
2. **Second**: Update `/lib/email-service.ts` (CARE caps + terminology)
3. **Third**: Update `/app/page.tsx` footer (terminology)
4. **Fourth**: Update `/app/terms/page.tsx` (terminology)
5. **Fifth**: Update `/app/privacy-policy/page.tsx` (terminology)
6. **Sixth**: Update `/app/help/page.tsx` (file comment)
7. **Finally**: Audit and replace emojis with icons

---

## Verification Commands

```bash
# Check for remaining "Care Collective" (lowercase)
grep -r "Care Collective" --include="*.ts" --include="*.tsx" care-collective-preview/

# Check for remaining "mutual aid"
grep -r "mutual aid" --include="*.ts" --include="*.tsx" care-collective-preview/

# Check for emoji usage
grep -rP "[\x{1F300}-\x{1F9FF}]" --include="*.ts" --include="*.tsx" care-collective-preview/
```

---

## Files Modified in This Phase

| File | Type of Change |
|------|----------------|
| `/tailwind.config.ts` | Add 3 new colors |
| `/lib/email-service.ts` | CARE caps (8+) + terminology |
| `/app/page.tsx` | Footer terminology |
| `/app/terms/page.tsx` | Terminology (2 locations) |
| `/app/privacy-policy/page.tsx` | Terminology (2 locations) |
| `/app/help/page.tsx` | File comment capitalization |

**Total Files**: 6
**Estimated Edits**: ~20
