# Sprint 3: Page-Specific Updates

## Objective
Update individual pages (Resources, Dashboard, Help Request form) based on client feedback.

## Tasks (5 items)

### Task 1: Verify Join Page Subheading (Visual Check)
**File:** `app/signup/page.tsx` (lines 177-178)

**Expected to see:**
```tsx
<h1 className="text-3xl font-bold text-foreground mb-2">Join CARE Collective</h1>
<p className="text-base md:text-lg text-muted-foreground">Create an account below</p>
```

**Verification:**
- Navigate to https://care-collective-preview.vercel.app/signup
- Confirm subheading says "Create an account below"
- NOT "to start helping your community"

**Vulcan Task ID:** `9ee758f5-19bf-4f9a-b428-0a74854df8fd`

---

### Task 2: Verify Resources Page Subheadings Centered
**File:** `app/resources/page.tsx`

**Check these SectionHeader components (lines 69-76, 98-105, 128-135):**
```tsx
<SectionHeader
  title="Well-Being"
  description="Find support for emotional health..."
  icon={<Heart className="w-8 h-8 text-white" />}
  iconBgColor="dusty-rose"
  className="text-center"
  descriptionClassName="text-center"
/>
```

**Verification:**
- Navigate to https://care-collective-preview.vercel.app/resources
- Confirm "Well-Being", "Community", and "Learning" section headers are centered
- If not centered, add/verify `className="text-center"` and `descriptionClassName="text-center"`

**Also verify Hospice card (lines 79-82):**
```tsx
<ResourceCard
  title="Hospice Foundation for Outreach"
  ...
/>
```

**Vulcan Task IDs:** 
- `be4549f8-fa09-46aa-95cf-fa181a398db4` (centered subheadings)
- `dbb6104d-7846-4077-86ce-8bed542b1c68` (Hospice name)

---

### Task 3: Increase Dashboard Box Heading Sizes
**File:** `app/dashboard/page.tsx` (lines 245, 266, 287)

**Current:**
```tsx
<CardTitle className="flex items-center gap-2 text-lg">
  Need Help?
</CardTitle>
```

**Change all three CardTitle elements to:**
```tsx
<CardTitle className="flex items-center gap-2 text-xl md:text-2xl font-bold">
  Need Help?
</CardTitle>
```

**Locations:**
- Line ~245: "Need Help?"
- Line ~266: "Want to Help?"  
- Line ~287: "Messages"

**Vulcan Task ID:** `07b7e9aa-b1c6-4d00-a383-5df7f63fa474`

---

### Task 4: Fix "Offer to Help" Form Text Size
**File:** `components/help-requests/HelpRequestCardWithMessaging.tsx` (lines 366-379)

**Current:**
```tsx
<Label htmlFor="offer-message" className="text-base font-medium">Your message</Label>
<Textarea
  ...
  className="resize-none text-base"
  rows={4}
  ...
/>
<span className="text-base">Be specific about how you can help</span>
```

**Change to:**
```tsx
<Label htmlFor="offer-message" className="text-lg font-medium">Your message</Label>
<Textarea
  ...
  className="resize-none text-lg"
  rows={4}
  ...
/>
<span className="text-base text-muted-foreground">Be specific about how you can help</span>
```

**Vulcan Task ID:** `2523a8be-b68f-4108-8f45-fad451d2b107`

---

### Task 5: Verify "Offer to Help" Placeholder Text
**File:** `components/help-requests/HelpRequestCardWithMessaging.tsx` (line 371)

**Expected to see:**
```tsx
placeholder="Hi. I think I can help! I am available most days after 5 PM"
```

**Verification:**
- Log in to dashboard
- Find a help request
- Click "Offer Help"
- Verify the placeholder text matches client's suggestion

**Vulcan Task ID:** `7913c1c1-9208-4992-b422-91bf01e8a001`

---

## Verification Steps

After implementation:

1. **Signup Page:**
   - Visit /signup
   - Confirm "Create an account below" subheading

2. **Resources Page:**
   - Visit /resources
   - Section titles (Well-Being, Community, Learning) should be centered
   - "Hospice Foundation for Outreach" should be the card title

3. **Dashboard:**
   - Log in and visit /dashboard
   - "Need Help?", "Want to Help?", "Messages" headings should be larger and more prominent than the buttons below

4. **Offer Help Form:**
   - Find a help request on /requests
   - Click "Offer Help"
   - Text should be larger and more readable
   - Placeholder should show specific example message

---

## Commit Message
```
feat(pages): improve dashboard headings and offer help form readability

- Increase dashboard quick action card heading sizes
- Enlarge Offer Help form text for better readability
- Verify Resources page subheadings are centered
- Verify Join page and Offer Help placeholder text

Addresses client feedback for page-specific improvements.
```

---

## Dependencies
- Sprint 1 (Typography) should be completed first
- Sprint 2 (Landing Page) can run in parallel
