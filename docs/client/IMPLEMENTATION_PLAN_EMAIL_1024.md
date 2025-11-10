# Implementation Plan: Client Email Requests ("Send to Evan 1024")

**Document Date**: November 10, 2025
**Source**: docs/client/Send to Evan 1024.docx
**Status**: Ready for Implementation

---

## Overview

**33 total changes requested** across 9 pages/areas
- ✅ 6 done (18%)
- ⚠️ 9 partial (27%)
- ❌ 18 not done (55%)

**Estimated Time**: 2-3 days of focused work
**Testing Time**: 1 day
**Total Duration**: 3-4 days

---

## Phase 1: Global Changes (Foundation) - 4 hours

### 1.1 Terminology Updates

**Find/Replace Operations:**
- `"mutual aid"` → `"mutual assistance"` or `"mutual support"` (20+ instances)
- `"Care Collective"` → `"CARE Collective"` (30+ instances)

**Files to Update:**
- `/app/page.tsx` - Landing page
- `/app/about/page.tsx` - About page
- `/app/signup/page.tsx` - Signup form
- `/app/login/page.tsx` - Login page
- `/app/help/page.tsx` - Help page
- `/app/resources/page.tsx` - Resources page
- `/app/terms/page.tsx` - Terms of Service
- `/lib/email-service.ts` - Email notifications
- `/components/layout/footer.tsx` - Footer links
- Any other components with these terms

### 1.2 Icon System Replacement

**Replace 15+ emojis with lucide-react icons:**

Icon Mapping:
- 🤝 → `Users` or `Handshake`
- 💖 → `Heart`
- 🙋‍♀️ → `HandHeart` or `UserPlus`
- 🌟 → `Star` or `Sparkles`
- 🌱 → `Sprout` or `LeafyGreen`
- 🏠 → `Home`
- 👥 → `Users`
- 📚 → `BookOpen` or `Library`
- 📧 → `Mail`
- 🤲 → `HandHelping` or `Heart`
- 🎓 → `GraduationCap`
- 📋 → `ClipboardList`

**Files to Update:**
- `/app/page.tsx` - Landing page (10+ emojis)
- `/app/about/page.tsx` - About page (3 emojis)
- `/app/signup/signup-success/page.tsx` - Success page (1 emoji)
- `/app/admin/**` - Admin panel (multiple emojis)

**Implementation Notes:**
- Import from `lucide-react`
- Maintain consistent sizing (typically `className="w-6 h-6"` or `w-8 h-8`)
- Add proper `aria-label` attributes for accessibility
- Keep color scheme consistent with brand colors

---

## Phase 2: Landing Page Restructure - 6 hours

### 2.1 Color Scheme Updates

**Background Colors:**
- Change ALL section backgrounds from gradient/white → cream `#FBF2E9`
- Maintain dark blue `#324158` for top header and footer sections

**Dividers:**
- Add terra cotta `#BC6547` border lines between sections
- Suggested: `border-b-2 border-[#BC6547]` or similar

**Box Colors:**
- Update "How It Works" step boxes → almond `#E9DDD4` background
- Current: white boxes
- New: `bg-[#E9DDD4]`

### 2.2 Section Reordering

**Current Order:**
1. Hero Section
2. What's Happening
3. How It Works
4. About CARE Collective
5. Community Resources Preview
6. Contact Section

**New Order (Requested):**
1. Hero Section (stays)
2. **How It Works** (move from #3)
3. **Why Join?** (NEW - create from scratch)
4. **About CARE Collective** (move from #4)
5. **What's Happening** (move from #2)
6. Community Resources Preview (stays)
7. Contact Section (stays)

### 2.3 Navigation Menu Reorder

**Current Menu:**
Home → What's Happening → How It Works → About → Resources → Contact

**New Menu:**
Home (maybe remove) → How It Works → Why Join? → About Us → What's Happening → Resources → Contact Us (maybe remove if crowded)

**Client Note**: Consider removing "Home" and "Contact Us" if menu gets crowded

### 2.4 Hero Section Text Updates

**Line 1**: "Southwest Missouri" (same)
**Line 2**: "CARE Collective" (same, already correct)
**Line 3**: Add explicit definition below:
```
Caregiver Assistance and Resource Exchange
```
- Same size font as current subtitle
- Maybe bold first letter of each word (C-A-R-E)

**Line 4**: Update from:
> "Building community through mutual aid"

To:
> "The CARE Collective is a network of family caregivers in Southwest Missouri who support each other through practical help and shared resources."

**Client Note**: "Maybe this font could be just slightly bigger"

### 2.5 Create New "Why Join?" Section

**Section Heading**: "Why Join?"

**Opening Text**:
> The CARE Collective connects you with other caregivers who understand what you're going through and are ready to help and be helped.

**Subheading**: "As a member, you'll have access to:"

**6 Benefit Cards** (similar layout to "How It Works"):

1. **Practical help when you need it**
   - Get support with respite, errands, paperwork, or just someone to check in.

2. **Mutual exchange of support**
   - Caregivers helping each other meet real, practical needs. Give what you can, receive what you need. Everyone has something to offer, and everyone needs help sometimes.

3. **Flexibility that works for you**
   - Participate in ways that fit your schedule and capacity, whether that's offering a ride once a month or connecting for weekly check-ins.

4. **Learning opportunities**
   - Attend workshops on topics that matter to you, from advance care planning to caregiver self-care.

5. **No pressure, just support**
   - Feeling overwhelmed? Don't have much free time? Worried you don't have much to offer? You belong here, and it's okay to be in a season where you mostly need support.

6. **Joining is simple**
   - We'll help you get started, and you can participate in whatever ways work for your life right now.

**Design Notes:**
- Use bullet points or cards similar to "How It Works" section
- Consider icon for each benefit
- Background color: almond `#E9DDD4` or cream with terra cotta borders

### 2.6 About Section Restructure

**Current Structure:**
- "About CARE Collective" heading
- "Our Story" box
- "Academic Partnership" box
- "Join Our Community" box

**New Structure:**

**Remove**:
- Tagline (if present)
- First box/redundant content

**Reorganize as:**

1. **"Who We Are"** (stretch full width across screen)
   - Content: "The CARE (Caregiver Assistance and Resource Exchange) Collective is a network of family caregivers in Southwest Missouri who support each other through practical help and shared resources. The Collective is powered by caregivers themselves, along with students and volunteers who help maintain the site and coordinate outreach and engagement. Together, we are building a space where caregivers find connection, practical help, and the mutual support that makes caregiving sustainable."

2. **"Academic Partnership"** (keep current box)
   - Keep existing content about MSU partnership

3. **"Learn More About Us"** (make it a prominent box)
   - Make this stand out since it links to full About page with Mission, Vision, Values

**Remove**:
- "Join Our Community" box (already exists elsewhere)

### 2.7 Footer Updates

**Contact Information Section:**
- Add: "Dr. Maureen Templeman"
- Keep: Email address (swmocarecollective@gmail.com)

**Quick Links Section:**
- Remove duplicate: Currently has both "Member Login" and "Member Portal"
- Keep only: "Member Login" (matches top bar)

---

## Phase 3: Form Pages - 3 hours

### 3.1 Signup Page (`/app/signup/page.tsx`)

**CARE Capitalization:**
- Line 108: "Care Collective" → "CARE Collective" (success message)
- Line 171: "Join Care Collective" → "Join CARE Collective" (heading)
- Line 286: Already correct "CARE Collective's"

**Font Size:**
- Increase subtitle font size (client: "Make the font of the next sentence a little bigger")
- Current uses `text-sm`, try `text-base` or `text-lg`

**Location Field (Lines 239-253):**
- Remove "(Optional)" label
- Add `required` attribute
- Update to: "Location (Required)" or just "Location"
- Add validation

**"Why Join" Field (Lines 256-271):**
- Remove "(Optional)" label
- Add `required` attribute
- Update placeholder to: "Tell us briefly why you'd like to join our community"
- Update helper text to: "This helps us understand what brings you here."
- Capitalize CARE in question: "Why do you want to join CARE Collective?"

### 3.2 Login Page (`/app/login/page.tsx`)

**Line 122:**
- Change: "Sign in to your Care Collective account"
- To: "Sign in to your CARE Collective account"

---

## Phase 4: Information Pages - 4 hours

### 4.1 About Page (`/app/about/page.tsx`)

**Remove:**
- Tagline under "About CARE Collective" (if present)
- First box with redundant description (duplicate of landing page content)

**Verify:**
- "Our Mission" is the first content box
- Community Standards section matches Terms of Service (already correct ✅)

### 4.2 Community Resources Page (`/app/resources/page.tsx`)

**"Need Immediate Support?" Section (Lines 169-191):**

**Update Heading To:**
> "If you're experiencing a crisis or need mental health support, resources are available 24/7."

**Add 4 Crisis Lines INLINE** (remove link to separate page):

```markdown
### Need Immediate Support?

If you're experiencing a crisis or need mental health support, resources are available 24/7.

**Crisis Resources:**
- **988 Suicide & Crisis Lifeline**: Call or text 988
- **Crisis Text Line**: Text HOME to 741741
- **Missouri Crisis Line**: 1-888-279-8369
- **Veterans Crisis Line**: Call 1-800-273-8255 or text 838255
```

**Design:**
- Use Heart icon from lucide-react (already imported)
- Style as prominent banner or card
- Ensure high contrast for visibility

**DELETE Separate Page:**
- Remove `/app/crisis-resources/page.tsx` entirely
- Update any links pointing to `/crisis-resources` → update to anchor link on resources page

### 4.3 Help & Support Page (`/app/help/page.tsx`)

**Rename Page:**
- Line 40: "Help & Support" → "Platform Help & Support"

**Update Subtitle:**
- To: "We're here to help you connect with your community safely and effectively."

**Remove Top 3 Quick Action Boxes (Lines 48-104):**
- Browse Help Requests
- Request Help
- Messages

**Remove Phone Support Section (Lines 234-256):**
- Keep email support only
- Client: "Let's remove Phone Support for now!"

**Remove Crisis Box (Lines 262-282):**
- "Need Immediate Support?" section
- Already on resources page

**Keep:**
- Troubleshooting/tech help content
- FAQ sections
- Platform usage guides

**Client Note**: "If this page is too difficult to build out, don't worry about having all of the features on it! If you want, I can type up some instructions and we can just have them all on this page, rather than branching to other pages like it seems you're planning."

### 4.4 Terms of Service Page (`/app/terms/page.tsx`)

**Community Standards:**
- Already matches About page ✅
- Remove last sentence: "For complete Community Standards..." (if present)

**Intellectual Property:**
- **Client Question**: "Is it really owned by MSU? I'm genuinely unsure of this."
- Review and clarify ownership language
- May need legal review

**Background Check Information:**
- Add section about background checks (if not present)
- Update with pricing:
  - **MACHS**: $15 per person (https://www.machs.mo.gov/MACHSFP/home.html)
  - **Sterling Volunteers**: $19 per person (https://www.sterlingvolunteers.com/packages-and-pricing/)

### 4.5 Privacy Policy Page (`/app/privacy-policy/page.tsx`)

**Questions and Concerns Section (Lines 287-301):**
- Make contact information match Terms of Service format
- Remove email address from this section
- Keep: Dr. Maureen Templeman, Missouri State University
- Remove: swmocarecollective@gmail.com (from this section)

---

## Phase 5: Email Notifications (Optional) - 4 hours

### 5.1 Request Response Notifications

**Client Question:**
> "If I create a request, do I need to keep logging in and checking to see if someone responded or is there a way to link this to my email?"

**Solution**: Add email notification when someone offers help

**Implementation:**

1. **Create New Notification Type** in `/lib/email-service.ts`:
   - `help_offer_received`
   - Triggers when someone clicks "Offer Help" on a request
   - Sends to request creator

2. **Update Offer Help Flow**:
   - Locate where help offers are processed
   - Add call to email service
   - Pass request details and helper info

3. **Email Template**:
   ```
   Subject: Someone wants to help with your request!

   Hi [Requester Name],

   Good news! [Helper Name] has offered to help with your request: "[Request Title]"

   Log in to view their message and connect:
   [Link to Request]

   Thanks for being part of the CARE Collective!
   ```

4. **Testing**:
   - Test email delivery
   - Verify correct recipient
   - Check email formatting
   - Ensure link works

**Infrastructure**:
- Email service already exists: `/lib/email-service.ts`
- API endpoint exists: `/app/api/notify/route.ts`
- Just need to add new trigger and template

---

## Phase 6: Testing & Verification - 1 day

### 6.1 Visual Regression Testing

**Checklist:**
- [ ] All color changes render correctly
  - [ ] Cream background on all sections
  - [ ] Terra cotta dividers visible
  - [ ] Almond boxes in "How It Works"
  - [ ] Dark blue header/footer maintained
- [ ] All icon replacements look correct
  - [ ] Proper sizing
  - [ ] Aligned with text
  - [ ] Consistent colors
- [ ] Landing page section order is correct
- [ ] New "Why Join?" section displays properly
- [ ] Footer updates visible
- [ ] Mobile responsive design works

### 6.2 Functionality Testing

**Form Testing:**
- [ ] Signup form location field is required (blocks submission)
- [ ] Signup form "why join" field is required (blocks submission)
- [ ] Form validation messages appear correctly
- [ ] Forms submit successfully with all fields

**Navigation Testing:**
- [ ] Top menu links work in new order
- [ ] Smooth scroll to sections works
- [ ] Footer quick links work
- [ ] No broken internal links

**Content Testing:**
- [ ] Crisis resources display inline on resources page
- [ ] Crisis resources page is deleted (404)
- [ ] All "CARE" capitalizations correct
- [ ] All "mutual aid" → "mutual assistance/support"
- [ ] Email notifications work (if implemented)

### 6.3 Accessibility Testing

**WCAG 2.1 AA Compliance:**
- [ ] All icons have proper `aria-label` attributes
- [ ] Color contrast meets requirements (especially terra cotta dividers)
- [ ] Keyboard navigation works with new structure
- [ ] Screen reader announces sections correctly
- [ ] Required form fields have proper aria attributes
- [ ] Focus indicators visible on all interactive elements

**Tools:**
- Run Lighthouse accessibility audit
- Test with screen reader (NVDA/JAWS)
- Keyboard-only navigation test

### 6.4 Performance Testing

- [ ] Page load times < 3 seconds
- [ ] No console errors
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)

### 6.5 Cross-Browser Testing

**Test in:**
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## Files to Modify (18 files)

### Core Pages (9 files)
1. `/app/page.tsx` - Landing page restructure (MAJOR changes)
2. `/app/signup/page.tsx` - Form requirements, CARE caps
3. `/app/login/page.tsx` - CARE capitalization
4. `/app/about/page.tsx` - Remove first box
5. `/app/resources/page.tsx` - Add crisis lines inline
6. `/app/help/page.tsx` - Rename, simplify content
7. `/app/terms/page.tsx` - Background check pricing
8. `/app/privacy-policy/page.tsx` - Contact info updates

### Layout Components (2 files)
9. `/components/layout/header.tsx` - Navigation reorder
10. `/components/layout/footer.tsx` - Add name, consolidate links

### Backend/Services (3 files)
11. `/lib/email-service.ts` - New notification types
12. `/app/api/notify/route.ts` - Email notification logic
13. `/lib/constants/categories.ts` - Terminology updates (if "mutual aid" present)

### Other Components (4+ files)
14. Various component files with "mutual aid" text (find via search)
15. Various component files with "Care Collective" text (find via search)
16. Icon replacements across multiple components
17. Any admin panel files with emojis

### Files to DELETE (1 file)
- `/app/crisis-resources/page.tsx` - Consolidate into resources page

---

## Search Commands for Finding Updates

### Find "mutual aid"
```bash
rg "mutual aid" --type ts --type tsx
```

### Find "Care Collective" (non-CARE)
```bash
rg "Care Collective" --type ts --type tsx
```

### Find emojis
```bash
rg "[🤝💖🙋‍♀️🌟🌱🏠👥📚📧🤲🎓📋]" --type ts --type tsx
```

---

## Color Reference

**Background Colors:**
- Dark blue: `#324158`
- Cream: `#FBF2E9`

**Accent Colors:**
- Almond (NEW): `#E9DDD4`
- Cream (hands in logo): `#FBF2E9`
- Clay (basket in logo): `#C39778`
- Terra cotta (heart in logo): `#BC6547`
- Brown (outline in logo): `#483129`
- Dark blue: `#324158`
- Teal: `#7A9E99`
- Seafoam (NEW): `#D6E2DF`
- Rose (REVISED?): `#C28C83`

---

## Risk Mitigation

### Low Risk Changes (Safe to implement)
- CARE capitalization (find/replace)
- Text replacements ("mutual aid" → "mutual assistance")
- Footer updates (name, link consolidation)
- Form field requirements (adding `required` attribute)
- Privacy policy contact updates

### Medium Risk Changes (Test carefully)
- Landing page section reordering (layout shifts, may affect scroll behavior)
- Icon replacements (sizing, spacing, alignment)
- Help page simplification (ensure no broken links to removed sections)
- Crisis resources inline (ensure styling works, delete separate page)

### Higher Risk Changes (Thorough testing required)
- Color scheme updates (CSS cascade effects, contrast ratios)
- Creating new "Why Join?" section (new content/layout, responsive design)
- Email notifications (backend logic, email delivery, testing)
- Navigation menu reordering (may affect user expectations)

### Recommended Approach
1. **Implement in phases** (1-2 per day)
2. **Test after each phase** before moving to next
3. **Deploy to Vercel preview** after each phase
4. **Get client approval** on visual changes before proceeding
5. **Final deploy to production** after all testing complete

---

## Deployment Strategy

### Staging Workflow
1. Create feature branch: `git checkout -b feature/client-email-1024`
2. Implement Phase 1, commit
3. Push to GitHub: `git push origin feature/client-email-1024`
4. Vercel auto-creates preview deployment
5. Share preview URL with client for feedback
6. Repeat for each phase

### Production Deployment
1. All phases complete and tested
2. Client approves all changes
3. Merge to main: `git checkout main && git merge feature/client-email-1024`
4. Push to main: `git push origin main`
5. Vercel auto-deploys to production (via Git integration)
6. **DO NOT run `npx vercel --prod`** (causes duplicate deployments)

---

## Success Criteria

### Functionality ✅
- [ ] ALL instances of "mutual aid" replaced with "mutual assistance/support"
- [ ] ALL instances of "Care Collective" → "CARE Collective"
- [ ] ALL emojis replaced with lucide-react icons
- [ ] Landing page sections in new order (7 sections)
- [ ] New "Why Join?" section created with 6 benefit cards
- [ ] Crisis resources inline on resources page (4 lines)
- [ ] Crisis resources page deleted (404 error)
- [ ] Help page simplified (removed 3 boxes + 2 sections)
- [ ] Signup form location field REQUIRED
- [ ] Signup form "why join" field REQUIRED
- [ ] Background check pricing updated in Terms
- [ ] Footer updated with Dr. Templeman's name
- [ ] Footer "Member Portal" link removed
- [ ] Email notifications working (if implemented)

### Visual Design ✅
- [ ] Cream background (#FBF2E9) on all landing page sections
- [ ] Terra cotta dividers (#BC6547) between sections
- [ ] Almond background (#E9DDD4) on "How It Works" boxes
- [ ] Dark blue header/footer maintained
- [ ] Icons sized consistently
- [ ] Mobile responsive layout works

### Technical Quality ✅
- [ ] WCAG 2.1 AA compliance maintained
- [ ] Zero TypeScript errors
- [ ] Zero ESLint warnings
- [ ] All tests passing (80%+ coverage)
- [ ] Build succeeds without errors
- [ ] Mobile responsive on all pages
- [ ] Cross-browser compatible
- [ ] Page load times < 3 seconds

### Client Approval ✅
- [ ] Client reviews and approves all visual changes
- [ ] Client confirms crisis resources placement
- [ ] Client confirms "Why Join?" content and layout
- [ ] Client approves landing page restructure
- [ ] Client confirms terminology changes throughout

---

## Questions for Client (Before Starting)

1. **"Why Join?" Section Layout**: Prefer cards (like "How It Works") or bullet list?
2. **Menu Simplification**: Remove "Home" and "Contact Us" from top menu? (client mentioned "if it gets too crowded")
3. **Email Notifications**: High priority or can be Phase 2 feature?
4. **Intellectual Property**: Confirm ownership language for Terms of Service
5. **Icon Style**: Prefer outlined or filled icons from lucide-react?

---

## Timeline Estimate

**Total Time**: 3-4 days (24-32 hours)

**Day 1** (8 hours):
- Phase 1: Global changes (terminology, icons) - 4 hours
- Phase 2: Landing page start (color scheme, reordering) - 4 hours

**Day 2** (8 hours):
- Phase 2 continued: Create "Why Join?", restructure About - 4 hours
- Phase 3: Form pages (signup, login) - 3 hours
- Phase 4 start: About, Resources pages - 1 hour

**Day 3** (8 hours):
- Phase 4 continued: Help, Terms, Privacy pages - 3 hours
- Phase 5: Email notifications (if prioritized) - 4 hours
- Phase 6 start: Testing - 1 hour

**Day 4** (8 hours):
- Phase 6: Full testing and verification - 4 hours
- Bug fixes and polish - 2 hours
- Client review and adjustments - 2 hours

**Contingency**: Add 1-2 days for unexpected issues or client feedback iterations

---

## Notes

- **Original Document**: `docs/client/Send to Evan 1024.docx`
- **Client Contact**: Dr. Maureen Templeman (swmocarecollective@gmail.com)
- **Previous Implementation**: ~77% of earlier requirements complete
- **This Plan**: Addresses latest round of UI/UX refinements
- **Status**: Ready to begin implementation

---

## Next Steps

1. **Read this plan thoroughly**
2. **Ask any clarifying questions** to client before starting
3. **Create feature branch**: `feature/client-email-1024`
4. **Start with Phase 1** (foundation/global changes)
5. **Commit frequently** with descriptive messages
6. **Test after each phase** before proceeding
7. **Deploy to Vercel preview** for client review
8. **Iterate based on feedback**
9. **Final production deployment** after approval

Good luck! 🚀
