# Home Page Redesign - Implementation Plan

**Date**: December 17, 2025
**Source Documents**:
- `docs/client/documents/home-page-content.docx`
- `docs/client/documents/email-12172025.txt`
- `docs/client/documents/maureen-portrait.png`

**Design Inspiration**: [Kinderground.org](https://kinderground.org/)

---

## Summary of Changes

The client requests a moderate visual refresh with:
- Increased font sizes throughout
- New color scheme (teal #3D4F52 + rose for accents, logo colors for backgrounds)
- Color-blocked sections with some dark backgrounds
- Section restructuring ("What is CARE Collective?" 3-box layout)
- Maureen's photo in About section with asymmetrical layout
- Footer updates (MSU/SGS statement, Facebook icon)

---

## Phase 1: Design System Updates

### 1.1 Color Palette Changes

**Files to modify:**
- `app/styles/tokens.css`
- `tailwind.config.ts`
- `app/globals.css`

**Strategy (per client clarification):**
- **Logo colors** (#FBF2E9, #C39778, #BC6547, #483129) → Section backgrounds & text
- **Teal #3D4F52 + Rose** → Buttons & accents (HOME PAGE ONLY)
- **Keep sage** → Existing internal pages (dashboard, admin, messages)

**Changes:**
| Color | Hex | Usage |
|-------|-----|-------|
| Teal (NEW) | #3D4F52 | Home page buttons, accents |
| Teal-dark (NEW) | #2D3B3E | Hover states for teal |
| Sage (KEEP) | #5A7E79 | Internal pages, existing components |
| Dusty-rose (KEEP) | #D8A8A0 | Secondary accent |
| Tan (NEW) | #C39778 | Section backgrounds |
| Terracotta (EXISTS) | #BC6547 | Section backgrounds |
| Brown (EXISTS) | #483129 | Dark section backgrounds, text |

### 1.2 Font Size Increases

**File:** `app/styles/tokens.css`

| Token | Current | New |
|-------|---------|-----|
| `--font-size-base` | 16px | 17px |
| `--font-size-lg` | 18px | 20px |
| `--font-size-xl` | 20px | 22px |
| `--font-size-2xl` | 24px | 26px |
| `--font-size-3xl` | 30px | 36px |
| `--font-size-4xl` | 36px | 48px |
| `--font-size-5xl` | 48px | 72px |
| `--font-size-6xl` | 60px | 108px |

---

## Phase 2: Hero Section Updates

**Files:** `app/page.tsx`, `components/Hero.tsx`

**Changes:**
1. DELETE "Learn How It Works" button (keep only "Join Our Community")
2. Apply new font sizes (auto via tokens)
3. Update button color from sage to teal

---

## Phase 3: Section Restructure - "What is CARE Collective?"

**File:** `app/page.tsx`

### Current Structure:
- Section 2: "How It Works" (3 step cards)
- Section 3: "Why Join" (feature list)

### New Structure:
**Rename to "What is CARE Collective?"** with 3 boxes across:

#### Box 1: "How It Works"
1. Create an Account
2. Request or Offer Help
3. Build Community

#### Box 2: "Why Join?"
Header: "Are you caring for an aging loved one?"
1. Mutual exchange - Give what you can, receive what you need
2. Flexibility - Engage when and how you can
3. Learning opportunities - Workshops on topics chosen by members
4. No pressure - Okay to be in a season where you mostly need support

#### Box 3: "Kinds of Help" (NEW)
- Health & Caregiving
- Groceries & Meals
- Transportation & Errands
- Household & Yard
- Technology & Administrative
- Social & Companionship

**Layout:** `grid grid-cols-1 lg:grid-cols-3 gap-8`

---

## Phase 4: About Section Redesign

**File:** `app/page.tsx`

### Changes:
1. **DELETE** "Academic Partnership" card entirely
2. **Restructure** "Who We Are" with asymmetrical layout:
   - Left side (60%): Text content
   - Right side (40%): Maureen's photo with caption

### Photo:
- Source: `docs/client/documents/maureen-portrait.png`
- Destination: `public/images/maureen-portrait.png`
- Caption: "Dr. Maureen Templeman, Founder"

---

## Phase 5: Color Blocking Implementation

**Files:** `app/page.tsx`, `components/LandingSection.tsx`

### Section Background Pattern:

| Section | Background | Text Color |
|---------|------------|------------|
| Hero | Gradient (cream → teal-light/20) | Brown |
| What is CARE Collective? | Cream (#FBF2E9) | Brown |
| About CARE Collective | Tan (#C39778) | Brown |
| What's Happening | Brown (#483129) | White |
| Community Resources | Cream (#FBF2E9) | Brown |
| Get in Touch | Terracotta (#BC6547) | White |
| Footer | Navy (#324158) | White |

### New LandingSection variants:
- `variant="tan"` → bg-tan text-brown
- `variant="brown"` → bg-brown text-white
- `variant="terracotta"` → bg-terracotta text-white

---

## Phase 6: Footer Updates

**File:** `app/page.tsx`

### 6.1 MSU/SGS Statement
Replace Column 1 tagline with:
> "Funded by the Southern Gerontological Society and the Department of Sociology, Anthropology, and Gerontology at Missouri State University."

### 6.2 Facebook Icon
- Icon: Facebook from lucide-react
- Link: `https://www.facebook.com/profile.php?id=61582852599484`
- Style: Match Kinderground (icon in colored circle)

---

## Phase 7: Home Page Button Color Updates

**Files:** `app/page.tsx`, `components/Hero.tsx`

- Update home page buttons to use `bg-teal` instead of `bg-sage`
- Add `hover:bg-teal-dark` for hover states
- **DO NOT** change internal pages - they keep sage

---

## Critical Files to Modify

1. `app/styles/tokens.css` - Colors + font sizes
2. `tailwind.config.ts` - Add teal color definitions
3. `app/page.tsx` - Section restructure, content changes
4. `components/Hero.tsx` - Remove button, update colors
5. `components/LandingSection.tsx` - Add new variants
6. `public/images/` - Add maureen-portrait.png

---

## Implementation Order

1. Design tokens (Phase 1)
2. LandingSection variants (Phase 5 partial)
3. Hero changes (Phase 2)
4. Section restructure (Phase 3)
5. About section (Phase 4)
6. Color blocking (Phase 5)
7. Footer (Phase 6)
8. Button updates (Phase 7)

---

## Git Workflow

**Branch**: `feature/home-page-redesign-dec2025`

```bash
git checkout -b feature/home-page-redesign-dec2025
# Implement phases with commits
git push -u origin feature/home-page-redesign-dec2025
gh pr create --title "feat: Home page redesign per client feedback Dec 2025" --base main
```
