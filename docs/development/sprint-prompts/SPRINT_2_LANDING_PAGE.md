# Sprint 2: Landing Page Content Updates

## Objective
Update landing page content and layout based on client feedback, including text sizing consistency and mobile layout improvements.

## Tasks (4 items)

### Task 1: Match "Together, we are making caregiving sustainable" Font Size
**File:** `app/page.tsx` (lines 396-404)

**Current:**
```tsx
<p className="text-xl md:text-2xl lg:text-[24px] text-white leading-relaxed">
  A network of family caregivers in Southwest Missouri who support each other through practical help and shared resources.
</p>
...
<p className="text-[27px] md:text-[32px] lg:text-[36px] font-bold text-white leading-snug">
  Together, we are making caregiving sustainable.
</p>
```

**Change to (both lines same size/weight):**
```tsx
<p className="text-2xl md:text-3xl lg:text-[32px] font-semibold text-white leading-relaxed">
  A network of family caregivers in Southwest Missouri who support each other through practical help and shared resources.
</p>
...
<p className="text-2xl md:text-3xl lg:text-[32px] font-semibold text-white leading-snug">
  Together, we are making caregiving sustainable.
</p>
```

**Vulcan Task ID:** `362a5978-dc55-40ba-8aba-cf95495402e1`

---

### Task 2: Remove Duplicate Join Button
**File:** `app/page.tsx` (lines ~226-245)

**Current:** Box 1 "How It Works" has a "Get Started Today" button linking to signup.

**Action:** Remove the button from the "How It Works" box. Keep only the "Join Our Community" button in Box 2 "Why Join?" (the highlighted center box).

**Find this section (~line 240-244):**
```tsx
<Link href="/signup">
  <Button className="w-full bg-sage hover:bg-sage-dark text-white font-semibold">
    Get Started Today
  </Button>
</Link>
```

**Remove it entirely** from the "How It Works" card.

**Vulcan Task ID:** `161ce9db-9324-4444-886b-8a37d6aebe3a`

---

### Task 3: Verify "Founder" Title (Visual Check)
**File:** `app/page.tsx` (lines 377-380)

**Expected to see:**
```tsx
<p className="mt-6 text-lg italic text-white/90 text-center font-medium">
  Dr. Maureen Templeman, Founder
</p>
```

**Verification:** 
- Navigate to landing page
- Scroll to "About CARE Collective" section
- Confirm "Founder" appears under Maureen's photo

**Vulcan Task ID:** `117105ad-8783-43df-8de6-93fca7abf7c6`

---

### Task 4: Move Maureen's Photo Below "Who We Are" on Mobile
**File:** `app/page.tsx` (lines 351-422)

**Current layout:**
```tsx
<div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20">
  {/* Photo - LEFT side desktop, BOTTOM on mobile (flex-col-reverse) */}
  <div className="flex-shrink-0 text-center">
    {/* Photo content */}
  </div>
  
  {/* Content - RIGHT side desktop, TOP on mobile */}
  <div className="flex-1 text-center lg:text-left">
    {/* Who We Are heading + text */}
  </div>
</div>
```

**Change to:**
```tsx
<div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
  {/* Content - appears FIRST on mobile, RIGHT on desktop */}
  <div className="flex-1 text-center lg:text-left order-1 lg:order-2">
    {/* Who We Are heading + text */}
  </div>
  
  {/* Photo - appears SECOND on mobile (below content), LEFT on desktop */}
  <div className="flex-shrink-0 text-center order-2 lg:order-1">
    {/* Photo content */}
  </div>
</div>
```

**Key changes:**
1. Remove `flex-col-reverse`, use `flex-col`
2. Add `order-1 lg:order-2` to content div
3. Add `order-2 lg:order-1` to photo div

This ensures:
- **Mobile:** Content (Who We Are) first, then photo below
- **Desktop:** Photo on left, content on right (same as before)

**Vulcan Task ID:** `e7773d39-ba59-43c5-bf6c-37d466a4fe23`

---

## Verification Steps

After implementation:

1. **Desktop Check:**
   - Both paragraphs in "Who We Are" should be same size
   - Only ONE join button in "What Is CARE Collective" section
   - "Founder" visible under Maureen's photo
   - Photo on LEFT, content on RIGHT in About section

2. **Mobile Check (Chrome DevTools, iPhone 12 Pro):**
   - "Who We Are" content appears FIRST (top)
   - Maureen's photo appears BELOW the text content
   - No duplicate join buttons visible

3. **Tablet Check (iPad):**
   - Layout transitions smoothly between mobile and desktop

---

## Commit Message
```
feat(landing): update Who We Are section layout and remove duplicate CTA

- Match font sizes for both paragraphs in Who We Are section
- Remove duplicate "Get Started" button from How It Works box
- Reorder mobile layout so content appears before photo
- Verify Founder title displays correctly

Addresses client feedback for landing page improvements.
```

---

## Dependencies
- Sprint 1 (Typography) should be completed first for accurate visual verification
