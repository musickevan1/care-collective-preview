# Sprint 1: Typography Foundation

## Objective
Implement global typography improvements to address readability concerns across the entire site, with special focus on mobile.

## Tasks (5 items)

### Task 1: Increase Body Text Size (+2px)
**File:** `app/styles/tokens.css`

**Changes:**
```css
/* Update font size scale - add 2px to each */
--font-size-xs: 15px;   /* was 13px */
--font-size-sm: 17px;   /* was 15px */
--font-size-base: 18px; /* was 16px */
--font-size-lg: 20px;   /* was 18px */
--font-size-xl: 22px;   /* was 20px */
--font-size-2xl: 26px;  /* was 24px */
--font-size-3xl: 32px;  /* was 30px */
--font-size-4xl: 38px;  /* was 36px */
--font-size-5xl: 50px;  /* was 48px */
--font-size-6xl: 62px;  /* was 60px */
```

Also update `.readable-mode` values proportionally.

**Vulcan Task ID:** `b8968533-bb8c-43b8-86ed-cb50716236d8`

---

### Task 2: Darken Body Text Color
**File:** `app/globals.css`

**Changes:**
Find the `--text-body-light` variable and darken it:
```css
/* Darken body text for better contrast on cream background */
--text-body-light: #5a453d;  /* was lighter, now darker for cream bg */
```

Also check/update:
- `--color-foreground` if needed
- Any muted text colors that appear on cream

**Vulcan Task ID:** `f6b36637-b8b6-4732-afbf-33a91ee5698b`

---

### Task 3: Fix Mobile Text Sizing
**File:** `app/globals.css` (mobile media query section, ~lines 102-120)

**Changes:**
```css
@media (max-width: 640px) {
  h1 { font-size: 2rem; }      /* was 1.75rem */
  h2 { font-size: 1.75rem; }   /* was 1.5rem */
  h3 { font-size: 1.5rem; }    /* was 1.25rem */
  p, .text-base { 
    font-size: 1.125rem;       /* 18px - ensure readable */
  }
  .text-sm {
    font-size: 1rem;           /* 16px minimum on mobile */
  }
}
```

**Vulcan Task ID:** `3af27c26-3d99-4bd3-aba3-421a8a96aedd`

---

### Task 4: Increase Hero "Southwest Missouri" Size
**File:** `components/Hero.tsx` (lines 116-119)

**Current:**
```tsx
<p className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
  Southwest Missouri
</p>
```

**Change to:**
```tsx
<p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-2">
  Southwest Missouri
</p>
```

**Vulcan Task ID:** `c7a06ba5-88c2-4270-975e-bf20c596fa1f`

---

### Task 5: Increase Section Heading Sizes
**File:** `app/page.tsx`

**Find all instances of:**
```tsx
className="text-[clamp(32px,5vw,48px)] font-bold text-brown text-center uppercase tracking-wide"
```

**Change to:**
```tsx
className="text-[clamp(36px,6vw,56px)] font-bold text-brown text-center uppercase tracking-wide"
```

**Locations:**
- Line ~208-211: "What is CARE Collective?"
- Line ~333-335: "About CARE Collective"
- Any other section headers with same pattern

**Vulcan Task ID:** `f0a4b353-b4fd-4981-94f1-ef23365a769d`

---

## Verification Steps

After implementation:

1. **Desktop Check:**
   - Visit https://care-collective-preview.vercel.app
   - Body text should feel slightly larger and easier to read
   - Text on cream background should have better contrast
   - Section headings should feel more prominent

2. **Mobile Check (Chrome DevTools or real device):**
   - Toggle mobile view (iPhone 12 Pro, 390x844)
   - All text should be readable without zooming
   - Headings should be proportionally larger
   - "Southwest Missouri" should be prominent in hero

3. **Accessibility Check:**
   - Use browser dev tools to check contrast ratios
   - Body text on cream should meet WCAG AA (4.5:1 minimum)

---

## Commit Message
```
feat(typography): increase font sizes and improve contrast for readability

- Bump all font size tokens by 2px for better readability
- Darken body text color for improved contrast on cream background  
- Increase mobile heading sizes for better hierarchy
- Make "Southwest Missouri" more prominent in hero section
- Enlarge section headings to fill their space better

Addresses client feedback from January 2026 design review.
```

---

## Rollback Plan
If changes cause issues:
1. Revert tokens.css font sizes to original values
2. Revert globals.css color and mobile sizing changes
3. Revert Hero.tsx and page.tsx class changes
