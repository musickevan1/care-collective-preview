# Remaining Client Changes: Landing Page & Content Updates

**Session Date**: TBD (Next Session)
**Phase 1 Status**: ✅ COMPLETED - All beta bugs fixed, committed, deployed, tested
**Remaining Work**: Phases 2-4 (Client-requested changes from Maureen)

---

## 📋 Remaining Tasks (20 tasks)

### PHASE 2: Landing Page Restructure (10 tasks)

**2.1 Color Scheme Update** (30 min - SIMPLE)
- [ ] Update Tailwind config with new colors:
  - Replace `dusty-rose` → `rose` (#C28C83)
  - Replace `sage-light` → `seafoam` (#D6E2DF)
  - Add `almond` (#E9DDD4)
  - Keep `sage` (primary), `terracotta` (#BC6547 for dividers)
- [ ] Update `tailwind.config.ts` and `app/globals.css`

**2.2 Create "Why Join?" Section** (1-2 hours - MEDIUM)
- [ ] Create `components/landing/WhyJoinSection.tsx`
- [ ] Design 3 benefit cards:
  - "Get Help When You Need It" (icon: Heart/HelpCircle)
  - "Build Community Connections" (icon: Users)
  - "Make a Real Difference" (icon: Handshake)
- [ ] Match styling: white cards, hover effects, shadow layering

**2.3 Reorder Landing Page Sections** (1 hour - MEDIUM)
- [ ] Restructure `app/page.tsx` sections:
  - New order: Hero → How It Works → **Why Join?** (NEW) → About Us → What's Happening → Community Resources → Get in Touch
- [ ] Update desktop nav (lines 36-46)
- [ ] Update mobile nav in `components/MobileNav.tsx`
- [ ] Update footer Quick Links

**2.4 Unified Background & Dividers** (30 min - SIMPLE)
- [ ] Apply cream background globally: `bg-background` (#FBF2E9)
- [ ] Remove alternating gradient backgrounds
- [ ] Add terra cotta dividers: `border-t-4 border-primary` (#BC6547)
- [ ] Add spacing: `pt-16 md:pt-20` after dividers

**2.5 Replace Emojis with Lucide Icons** (2 hours - MEDIUM)
- [ ] Landing page (`app/page.tsx` - 10 emojis):
  - Import: `Users, Hand, Handshake, Heart, Star, Sprout, BookOpen, Home, Mail`
  - Style: `className="w-12 h-12 text-sage"` with `bg-sage-light/20 rounded-full p-3`
- [ ] Admin panel (`app/admin/page.tsx` - 5 emojis):
  - Icons: `Shield, Clipboard, Users, Handshake, BarChart3`
- [ ] Other components (20 emojis in 10 files):
  - Help workflows, beta banner, error pages
  - Use consistent icon styling pattern

**Files to modify**:
- `tailwind.config.ts`, `app/globals.css`
- `app/page.tsx` (landing page)
- `components/landing/WhyJoinSection.tsx` (NEW)
- `components/MobileNav.tsx`
- `app/admin/page.tsx` + 10 other component files

---

### PHASE 3: Form & Page Updates (6 tasks)

**3.1 Join Form Validation** (1.5 hours - MEDIUM)
- [ ] Update `lib/validations.ts`:
  - Add `location` field: `z.string().min(1, 'Location is required').max(100)`
  - Add `applicationReason` field: `z.string().min(10, 'Please tell us why (at least 10 characters)').max(500)`
- [ ] Update `app/signup/page.tsx`:
  - Remove "(Optional)" from labels (lines 240, 257)
  - Add `required` HTML attributes
  - Add asterisks to labels: "Location *", "Why do you want to join? *"
  - Increase label font: `text-sm` → `text-base`
  - Add field-level error display: `text-xs text-red-600`

**3.2 Global "CARE" Capitalization** (1 hour - SIMPLE)
- [ ] Search/replace: "Care Collective" → "CARE Collective"
- [ ] Preserve in URLs/file names
- [ ] Files: All user-facing pages, components, emails (26+ files)

**3.3 Page Content Updates** (1-2 hours - MEDIUM)
- [ ] Login page (`app/login/page.tsx`): Capitalize "CARE" in heading
- [ ] About page (`app/about/page.tsx`):
  - Remove tagline from top
  - Remove redundant first box
  - Update "Who We Are" section
- [ ] Help & Support (`app/help/page.tsx`):
  - Rename: "Platform Help & Support"
  - Remove "Phone Support" section
  - Focus on troubleshooting only
- [ ] Terms & Privacy pages:
  - Update contact info consistency
  - Add background check provider details

**3.4 Community Resources Consolidation** (1 hour - MEDIUM)
- [ ] Update `app/resources/page.tsx`:
  - Add crisis lines directly on page (prominent cards at top):
    - 988 Suicide & Crisis Lifeline
    - Crisis Text Line (text HOME to 741741)
    - Missouri Crisis Hotline
    - Veterans Crisis Line
- [ ] Delete `app/crisis/page.tsx`
- [ ] Update all links: `/crisis` → `/resources`
- [ ] Update navigation menus

**Files to modify**:
- `lib/validations.ts`, `app/signup/page.tsx`
- `app/login/page.tsx`, `app/about/page.tsx`, `app/help/page.tsx`
- `app/terms/page.tsx`, `app/privacy-policy/page.tsx`
- `app/resources/page.tsx`
- Delete: `app/crisis/page.tsx`

---

### PHASE 4: Terminology & Polish (4 tasks)

**4.1 "Mutual Aid" Replacement** (1 hour - SIMPLE)
- [ ] Email service (`lib/email-service.ts` - 10 instances):
  - "mutual aid community" → "mutual support community"
  - "mutual aid network" → "mutual support network"
  - "mutual aid" → "mutual assistance"
- [ ] Hero component (`components/Hero.tsx`):
  - "Building community through mutual aid" → "Building community through mutual support"
- [ ] Meta descriptions (`app/layout.tsx`): Update SEO text
- [ ] Documentation (lower priority): CLAUDE.md, PROJECT_STATUS.md

**4.2 Footer Updates** (30 min - SIMPLE)
- [ ] Update `app/page.tsx` footer (lines 393-426):
  - Add "Dr. Maureen Templeman" to Contact Information
  - Consolidate: "Member Login" + "Member Portal" → single "Member Portal" link
  - Update link order per client preference

**4.3 Hero Content Update** (30 min - SIMPLE)
- [ ] Update `components/Hero.tsx` subtitle:
  - Change to: "**C**aregiver **A**ssistance and **R**esource **E**xchange" (bold first letters)
  - Ensure "CARE" is capitalized

**Files to modify**:
- `lib/email-service.ts` (10 instances)
- `components/Hero.tsx` (2 changes)
- `app/layout.tsx` (meta descriptions)
- `app/page.tsx` (footer)
- Documentation files (optional)

---

## 🎯 Implementation Strategy for Next Session

**Recommended Order**:
1. **Phase 2**: Landing page restructure (visual changes, most visible to client)
2. **Phase 3**: Forms and page updates (functional improvements)
3. **Phase 4**: Terminology and polish (cleanup)

**Estimated Time**: 10-14 hours total
- Phase 2: 5-6 hours
- Phase 3: 3-4 hours
- Phase 4: 2-3 hours

**Testing Strategy**:
- Visual regression testing after Phase 2
- Form validation testing after Phase 3
- Full site audit after Phase 4

---

## 📝 Notes for Next Session

**Color Scheme Decision**: Client confirmed "Replace existing accent colors" approach
- Replace `dusty-rose` variants with new `rose` color
- Replace `sage-light` with `seafoam`
- Add `almond` as new option

**Why Join Section**: Client confirmed "Detailed cards with descriptions"
- 3 cards similar to "How It Works" section
- Icons + headlines + 2-3 sentence descriptions

**Beta Bug Status**: All 3 critical bugs FIXED in Phase 1
1. ✅ Edit functionality implemented (API + UI)
2. ✅ Offer Help UX improved (success dialog, notifications)
3. ✅ Messaging debug logging added (will help diagnose production issues)

---

## 🔧 Testing Checklist (Post-Implementation)

After completing Phase 2 landing page changes:
- [ ] Desktop: All sections visible and in correct order
- [ ] Mobile: Responsive layout maintained
- [ ] Navigation: All links work, no broken anchors
- [ ] Icons: All emojis replaced, consistent sizing
- [ ] Colors: New palette applied correctly
- [ ] Accessibility: WCAG 2.1 AA maintained (contrast, touch targets)

After completing Phase 3 form changes:
- [ ] Join form: Location and "why join" required, proper validation
- [ ] Error messages: Clear and helpful
- [ ] Crisis resources: All hotlines accessible from Resources page
- [ ] Page consolidation: No 404s from old Crisis page links

After completing Phase 4 polish:
- [ ] Terminology: All "mutual aid" replaced
- [ ] Footer: Maureen's name added, links consolidated
- [ ] Hero: CARE acronym formatted correctly
- [ ] Overall: Consistent branding throughout

---

## 💡 Pro Tips for Next Session

1. **Test incrementally**: Commit after each phase, not all at once
2. **Use parallel work**: Icon replacement can happen alongside color updates
3. **Check mobile first**: Client's audience likely mobile-heavy
4. **Verify links**: Especially after page consolidation (Crisis → Resources)
5. **Screenshot comparison**: Before/after for client review

---

**Current Status**: Phase 1 complete, tested, deployed
**Next Action**: Start Phase 2.1 (Color Scheme Update) in next session
**Priority**: High - Client-requested changes
**Risk**: Low - All changes are well-scoped and documented
