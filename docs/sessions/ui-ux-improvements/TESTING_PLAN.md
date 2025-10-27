# Testing Plan: UI/UX Improvements Session
**Date**: October 23, 2025
**Features**: 10 new features across homepage, UI cleanup, and navigation improvements

---

## 📋 Overview

This testing plan covers all features implemented in the UI/UX improvements session:
- **Group 1**: Homepage Content & Navigation (5 features)
- **Group 2**: UI Component Cleanup (3 features)
- **Group 3**: Navigation & Dashboard Fixes (2 features)

---

## 🎯 Testing Objectives

1. **Functional Testing**: Verify all features work as intended
2. **Accessibility Testing**: Ensure WCAG 2.1 AA compliance
3. **Responsive Testing**: Confirm mobile and desktop experiences
4. **Browser Testing**: Test across Chrome, Firefox, Safari
5. **Performance Testing**: Check page load times and interactions

---

## 🤖 Automated Testing with Playwright MCP

### Setup
```bash
# Ensure Playwright MCP is available
# Navigate to production URL
PRODUCTION_URL="https://care-collective-preview.vercel.app"
```

### Test Suite 1: Homepage Content & Navigation

#### Test 1.1: Resources Preview Section
```typescript
// Playwright MCP Test
Test: Navigate to homepage and verify Resources preview section exists

Steps:
1. Navigate to homepage (/)
2. Take screenshot of full page
3. Verify "Resources" section is visible
4. Verify 4 resource categories are displayed:
   - Essentials (with Home icon)
   - Well-Being (with Heart icon)
   - Community (with Users icon)
   - Learning (with GraduationCap icon)
5. Click "View All Resources →" button
6. Verify navigation to /resources page
7. Take screenshot of resources page

Expected Results:
- Resources section visible on homepage
- All 4 categories displayed with icons
- "View All Resources" link navigates correctly
- Resources page loads successfully
```

**Playwright MCP Commands:**
```bash
browser_navigate: https://care-collective-preview.vercel.app
browser_snapshot: # Capture accessibility snapshot
browser_take_screenshot: filename="homepage-resources-section.png"
browser_click: element="View All Resources link" ref="[data-testid='view-all-resources']"
browser_snapshot: # Verify resources page loaded
```

#### Test 1.2: Contact Preview Section
```typescript
Test: Verify Contact preview section and navigation

Steps:
1. Navigate to homepage
2. Scroll to Contact section
3. Verify email link (swmocarecollective@gmail.com) exists
4. Verify location displays "Springfield, MO 65897"
5. Click "Get in Touch →" button
6. Verify navigation to /contact page
7. Take screenshot

Expected Results:
- Contact section visible
- Email link clickable (mailto:)
- Location information correct
- Navigation to /contact works
```

**Playwright MCP Commands:**
```bash
browser_navigate: https://care-collective-preview.vercel.app
browser_snapshot: # Look for contact section
browser_click: element="Get in Touch link"
browser_snapshot: # Verify contact page
browser_take_screenshot: filename="contact-page-navigation.png"
```

#### Test 1.3: Join Our Community Button Styling
```typescript
Test: Verify CTA button has teal background

Steps:
1. Navigate to homepage
2. Scroll to About section
3. Locate "Join Our Community" button
4. Verify button has teal/sage-accessible background color
5. Verify button minimum height is 48px
6. Hover over button to test hover state
7. Take screenshot

Expected Results:
- Button visible with teal background
- Background color: bg-sage-accessible
- Hover state changes to bg-sage-dark
- Minimum height 48px (accessible)
```

**Playwright MCP Commands:**
```bash
browser_navigate: https://care-collective-preview.vercel.app
browser_snapshot: # Find Join Our Community button
browser_hover: element="Join Our Community button in About section"
browser_take_screenshot: filename="join-community-button-hover.png"
browser_evaluate: function="() => { const btn = document.querySelector('a[href=\"/signup\"]'); return { bg: getComputedStyle(btn).backgroundColor, height: getComputedStyle(btn).minHeight }; }"
```

#### Test 1.4: Footer Legal Links
```typescript
Test: Verify Terms and Privacy links in footer

Steps:
1. Navigate to homepage
2. Scroll to footer
3. Locate "Quick Links" section
4. Verify "Terms of Service" link exists
5. Verify "Privacy Policy" link exists
6. Click Terms of Service link
7. Verify /terms page loads
8. Go back, click Privacy Policy link
9. Verify /privacy page loads
10. Take screenshots

Expected Results:
- Both links visible in footer
- Terms link navigates to /terms
- Privacy link navigates to /privacy
- Pages load successfully
```

**Playwright MCP Commands:**
```bash
browser_navigate: https://care-collective-preview.vercel.app
browser_snapshot: # Find footer links
browser_click: element="Terms of Service link"
browser_take_screenshot: filename="terms-of-service-page.png"
browser_navigate_back:
browser_click: element="Privacy Policy link"
browser_take_screenshot: filename="privacy-policy-page.png"
```

#### Test 1.5: Navigation Order and Smooth Scroll
```typescript
Test: Verify navbar order and smooth scroll functionality

Steps:
1. Navigate to homepage
2. Verify desktop navbar order:
   - Home
   - What's Happening
   - How It Works
   - Resources
   - About Us
   - Contact Us
3. Click each nav link and verify smooth scroll
4. Test mobile navigation (resize to 375px width)
5. Verify mobile nav has same order
6. Take screenshots

Expected Results:
- Desktop nav in correct order
- All smooth scroll links work
- Mobile nav matches desktop order
- No scroll jumps or layout issues
```

**Playwright MCP Commands:**
```bash
browser_navigate: https://care-collective-preview.vercel.app
browser_snapshot: # Capture navbar
browser_take_screenshot: filename="desktop-navbar-order.png"

# Test smooth scroll
browser_click: element="What's Happening nav link" ref="[href='#whats-happening']"
browser_wait_for: time=1
browser_take_screenshot: filename="whats-happening-scroll.png"

browser_click: element="How It Works nav link"
browser_wait_for: time=1

# Test mobile
browser_resize: width=375, height=812
browser_take_screenshot: filename="mobile-navbar.png"
browser_click: element="Mobile menu hamburger button"
browser_snapshot: # Verify mobile menu order
```

---

### Test Suite 2: UI Component Cleanup

#### Test 2.1: Diagnostic Panel Close Button
```typescript
Test: Verify diagnostic panel can be closed and persists

Steps:
1. Navigate to /dashboard (authenticated user required)
2. Verify diagnostic panel is visible at bottom of page
3. Locate X close button (yellow background, top-right)
4. Click close button
5. Verify panel disappears
6. Refresh page
7. Verify panel stays closed (localStorage persistence)
8. Clear localStorage
9. Refresh page
10. Verify panel reappears
11. Take screenshots

Expected Results:
- Panel visible on dashboard
- Close button clickable
- Panel disappears when closed
- State persists across page refreshes
- Clearing localStorage brings panel back
```

**Playwright MCP Commands:**
```bash
# Note: Requires authentication - may need manual login first
browser_navigate: https://care-collective-preview.vercel.app/dashboard
browser_snapshot: # Find diagnostic panel
browser_take_screenshot: filename="diagnostic-panel-visible.png"

browser_click: element="Diagnostic panel close button"
browser_snapshot: # Verify panel gone
browser_take_screenshot: filename="diagnostic-panel-closed.png"

browser_navigate: https://care-collective-preview.vercel.app/dashboard
browser_snapshot: # Verify still closed after refresh

# Clear localStorage and verify panel returns
browser_evaluate: function="() => { localStorage.clear(); }"
browser_navigate: https://care-collective-preview.vercel.app/dashboard
browser_snapshot: # Panel should be back
```

#### Test 2.2: Readable Feature Removed
```typescript
Test: Verify Readable mode toggle is removed

Steps:
1. Navigate to /dashboard
2. Check layout header for any "Readable" button
3. Verify no ReadableModeToggle component exists
4. Open browser console
5. Verify no console errors related to ReadableMode
6. Check all admin pages
7. Take screenshots

Expected Results:
- No "Readable" button visible anywhere
- No console errors
- UI functions normally without the feature
- All pages render correctly
```

**Playwright MCP Commands:**
```bash
browser_navigate: https://care-collective-preview.vercel.app/dashboard
browser_snapshot: # Verify no Readable button
browser_console_messages: # Check for errors

browser_navigate: https://care-collective-preview.vercel.app/admin
browser_snapshot: # Check admin pages too
browser_console_messages: onlyErrors=true
```

#### Test 2.3: Improved Advanced Filtering
```typescript
Test: Verify filter improvements on /requests page

Steps:
1. Navigate to /requests
2. Verify status filter buttons:
   - Should only show: All, Open, In Progress
   - Should NOT show: Completed, Cancelled
3. Click "Advanced" filter button
4. Verify sort options:
   - Should only show: Date Created, Urgency Level
   - Should NOT show: Category, Status
5. Test mobile (375px width):
   - Verify filter buttons full-width on mobile
   - Verify touch targets are 44px+
   - Verify sort options stack vertically
6. Test filter combinations
7. Verify URL state updates
8. Click "Clear All" and verify reset
9. Take screenshots

Expected Results:
- Only 3 status filters visible
- Only 2 sort options
- Mobile filters full-width
- Touch targets accessible (44px+)
- Filters work correctly
- URL syncs with filter state
```

**Playwright MCP Commands:**
```bash
browser_navigate: https://care-collective-preview.vercel.app/requests
browser_snapshot: # Capture filter panel
browser_take_screenshot: filename="filter-panel-simplified.png"

# Verify status filters
browser_evaluate: function="() => { const statusButtons = document.querySelectorAll('[data-testid=\"status-filter\"]'); return statusButtons.length; }" # Should be 3

# Open advanced filters
browser_click: element="Advanced filter button"
browser_snapshot: # Check sort options
browser_take_screenshot: filename="advanced-filters-open.png"

# Test mobile
browser_resize: width=375, height=812
browser_take_screenshot: filename="mobile-filters.png"
browser_snapshot: # Check layout

# Test filter functionality
browser_click: element="Open status filter"
browser_snapshot: # Verify results filtered
browser_click: element="Clear All button"
browser_snapshot: # Verify filters reset
```

---

### Test Suite 3: Navigation & Dashboard Fixes

#### Test 3.1: New Request Breadcrumb Fix
```typescript
Test: Verify breadcrumb shows only "New Request"

Steps:
1. Navigate to /requests/new
2. Locate breadcrumb navigation
3. Verify breadcrumb shows: "CARE Collective / New Request"
4. Verify it does NOT show: "Help Requests"
5. Click breadcrumb to verify navigation still works
6. Take screenshot

Expected Results:
- Breadcrumb visible
- Shows "New Request" only (no "Help Requests")
- Navigation functional
- Clean, uncluttered appearance
```

**Playwright MCP Commands:**
```bash
browser_navigate: https://care-collective-preview.vercel.app/requests/new
browser_snapshot: # Find breadcrumb
browser_take_screenshot: filename="new-request-breadcrumb.png"

# Verify breadcrumb text
browser_evaluate: function="() => { const breadcrumb = document.querySelector('[aria-label=\"breadcrumb\"]'); return breadcrumb?.textContent; }"
# Should NOT contain "Help Requests"
```

#### Test 3.2: Dashboard User Activity Section
```typescript
Test: Verify "Your Activity" section on dashboard

Steps:
1. Navigate to /dashboard (authenticated)
2. Locate "Your Activity" card
3. Verify it's in left column (desktop) or top (mobile)
4. Verify it shows user's own help requests
5. Check each request displays:
   - Title
   - Status badge (color-coded)
   - Category
   - Creation date
   - "View" button
6. Verify "View All Your Requests" link exists
7. Click "View" button on a request
8. Verify navigation to request detail page
9. Test empty state (if user has no requests)
10. Take screenshots

Expected Results:
- "Your Activity" section visible
- Shows user's own requests only
- 2-column layout on desktop
- All request info displayed correctly
- Status badges color-coded
- Navigation works
- Empty state shows "Create Your First Request" button
```

**Playwright MCP Commands:**
```bash
browser_navigate: https://care-collective-preview.vercel.app/dashboard
browser_snapshot: # Find Your Activity section
browser_take_screenshot: filename="dashboard-user-activity.png"

# Verify 2-column layout
browser_evaluate: function="() => { const grid = document.querySelector('.grid'); return getComputedStyle(grid).gridTemplateColumns; }"
# Should show 2 columns on large screens

# Test mobile
browser_resize: width=375, height=812
browser_take_screenshot: filename="mobile-dashboard-activity.png"
browser_snapshot: # Should stack vertically

# Click View button
browser_click: element="View button on first request"
browser_snapshot: # Verify navigation to request detail
```

---

## 🧪 Manual Testing Checklist

### Accessibility Testing (WCAG 2.1 AA)

#### Keyboard Navigation
- [ ] Tab through all new homepage sections (Resources, Contact)
- [ ] Tab through footer links (Terms, Privacy)
- [ ] Tab through filter buttons on /requests
- [ ] Tab through diagnostic panel close button
- [ ] Tab through dashboard "Your Activity" section
- [ ] Verify focus indicators visible on all interactive elements
- [ ] Verify no keyboard traps

#### Screen Reader Testing (NVDA/JAWS)
- [ ] Navigate homepage sections with screen reader
- [ ] Verify "Join Our Community" button announced correctly
- [ ] Verify filter panel labels read correctly
- [ ] Verify diagnostic panel close button has proper ARIA label
- [ ] Verify dashboard activity section announced properly
- [ ] Verify breadcrumb navigation announced correctly

#### Color Contrast
- [ ] "Join Our Community" button: text vs. teal background
- [ ] Footer links: white text vs. navy background
- [ ] Filter buttons: all states (default, hover, active)
- [ ] Status badges in dashboard activity section
- [ ] All text meets 4.5:1 contrast ratio minimum

#### Touch Target Sizes
- [ ] "Join Our Community" button: minimum 44px height ✓
- [ ] Footer links: minimum 44px height
- [ ] Filter buttons (mobile): minimum 44px height
- [ ] Diagnostic panel close button: minimum 44px
- [ ] Dashboard "View" buttons: minimum 44px

### Responsive Design Testing

#### Breakpoints to Test
1. **Mobile**: 375px × 667px (iPhone SE)
2. **Tablet**: 768px × 1024px (iPad)
3. **Desktop**: 1920px × 1080px (Full HD)

#### Features to Verify at Each Breakpoint
- [ ] Homepage preview sections (Resources, Contact)
- [ ] Navigation menu (hamburger on mobile)
- [ ] Footer layout and legal links
- [ ] Filter panel on /requests
- [ ] Dashboard 2-column layout (stacks on mobile)
- [ ] All touch targets accessible

### Cross-Browser Testing

#### Browsers to Test
1. **Chrome** (latest): Primary browser
2. **Firefox** (latest): Alternative engine
3. **Safari** (latest): WebKit engine
4. **Edge** (latest): Chromium-based

#### Features to Verify in Each Browser
- [ ] Smooth scroll animations
- [ ] localStorage persistence (diagnostic panel)
- [ ] Filter panel functionality
- [ ] Teal button styling renders correctly
- [ ] 2-column grid layout works
- [ ] All links navigate correctly

---

## 🎨 Visual Regression Testing

### Screenshots to Capture

#### Homepage
1. `homepage-full-desktop.png` - Full page desktop view
2. `homepage-full-mobile.png` - Full page mobile view
3. `homepage-resources-section.png` - Resources preview
4. `homepage-contact-section.png` - Contact preview
5. `homepage-join-button.png` - CTA button in About section
6. `homepage-footer.png` - Footer with legal links

#### Requests Page
7. `requests-filter-panel-desktop.png` - Filter panel desktop
8. `requests-filter-panel-mobile.png` - Filter panel mobile
9. `requests-advanced-filters.png` - Advanced filters expanded
10. `requests-filtered-results.png` - Results after applying filters

#### Dashboard
11. `dashboard-user-activity-desktop.png` - 2-column layout
12. `dashboard-user-activity-mobile.png` - Stacked layout
13. `dashboard-diagnostic-panel-open.png` - Panel visible
14. `dashboard-diagnostic-panel-closed.png` - Panel closed

#### Other Pages
15. `new-request-breadcrumb.png` - Fixed breadcrumb
16. `terms-of-service.png` - Terms page
17. `privacy-policy.png` - Privacy page
18. `resources-full-page.png` - Full resources page
19. `contact-full-page.png` - Full contact page

---

## 🔍 Functional Testing Scenarios

### Scenario 1: First-Time User Homepage Experience
**Steps:**
1. Visit homepage as unauthenticated user
2. Read Resources preview section
3. Click "View All Resources" → verify navigation
4. Return to homepage
5. Read Contact preview section
6. Click "Get in Touch" → verify navigation
7. Return to homepage
8. Scroll to footer
9. Click "Terms of Service" → read terms
10. Click "Privacy Policy" → read privacy

**Expected Result:** Smooth, informative journey through key pages

### Scenario 2: Filter Help Requests on Mobile
**Steps:**
1. Open /requests on mobile device (375px)
2. Tap "Open" status filter
3. Tap "Advanced" to expand filters
4. Select "Urgency" sort
5. Verify URL updates
6. Tap "Clear All"
7. Verify filters reset

**Expected Result:** Easy, touch-friendly filtering experience

### Scenario 3: Dashboard Activity Tracking
**Steps:**
1. Login as authenticated user
2. Navigate to dashboard
3. View "Your Activity" section
4. Click "View" on one of your requests
5. View request details
6. Return to dashboard
7. Click "View All Your Requests"
8. Verify filtered view of your requests

**Expected Result:** User can easily track their own activity

### Scenario 4: Diagnostic Panel Management
**Steps:**
1. Visit dashboard with diagnostic panel visible
2. Click X to close panel
3. Refresh page → verify panel stays closed
4. Open developer console
5. Clear localStorage
6. Refresh page → verify panel returns
7. Close panel again
8. Navigate to different page
9. Return to dashboard → verify panel stays closed

**Expected Result:** Panel remembers closed state across navigation

---

## 🐛 Known Issues & Edge Cases to Test

### Edge Case 1: User with No Help Requests
**Test:** Dashboard "Your Activity" empty state
- Navigate to dashboard with user who has no requests
- Verify empty state message displays
- Verify "Create Your First Request" button appears
- Click button → verify navigation to /requests/new

### Edge Case 2: Long Request Titles in Dashboard
**Test:** Title truncation
- Create help request with very long title (90+ characters)
- View in dashboard "Your Activity" section
- Verify title truncates with ellipsis
- Verify doesn't break layout

### Edge Case 3: Rapid Filter Changes
**Test:** Filter state management
- Apply multiple filters rapidly
- Change sort options quickly
- Verify URL stays in sync
- Verify no race conditions or errors
- Check browser console for warnings

### Edge Case 4: localStorage Unavailable
**Test:** Diagnostic panel fallback
- Block localStorage in browser settings
- Visit dashboard
- Verify diagnostic panel shows
- Verify close button still works
- Verify no console errors

---

## 📊 Performance Testing

### Metrics to Measure

#### Page Load Times (Target: <3 seconds)
- [ ] Homepage (/)
- [ ] Requests page (/requests)
- [ ] Dashboard (/dashboard)
- [ ] Terms (/terms)
- [ ] Privacy (/privacy)
- [ ] Resources (/resources)
- [ ] Contact (/contact)

#### Interaction Times (Target: <100ms)
- [ ] Smooth scroll animation
- [ ] Filter button click response
- [ ] Diagnostic panel close
- [ ] Navigation menu open/close
- [ ] Dashboard activity "View" button

#### Bundle Size Impact
- [ ] Measure bundle size before and after changes
- [ ] Verify Readable feature removal reduced bundle
- [ ] Check for unused CSS/JS

---

## 📝 Test Execution Plan

### Session Structure
**Estimated Time: 60-90 minutes**

#### Phase 1: Automated Testing (30 min)
1. Run all Playwright MCP tests for Group 1 (Homepage)
2. Run all Playwright MCP tests for Group 2 (UI Cleanup)
3. Run all Playwright MCP tests for Group 3 (Navigation)
4. Capture all screenshots
5. Review test results

#### Phase 2: Manual Testing (30 min)
1. Accessibility testing (keyboard, screen reader)
2. Responsive design testing (3 breakpoints)
3. Cross-browser testing (4 browsers)
4. Edge case testing

#### Phase 3: Documentation (15 min)
1. Document any bugs found
2. Create bug tickets if needed
3. Update test results
4. Generate test report

---

## 🚨 Bug Reporting Template

If issues are found, document using this template:

```markdown
### Bug Report #[NUMBER]

**Title:** [Brief description]

**Severity:** [Critical / High / Medium / Low]

**Feature Group:** [Group 1 / Group 2 / Group 3]

**Feature:** [Specific feature name]

**Steps to Reproduce:**
1.
2.
3.

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happens]

**Screenshots:**
[Attach screenshots]

**Environment:**
- Browser:
- OS:
- Screen Size:

**Console Errors:**
[Any console errors]

**Proposed Fix:**
[If known]
```

---

## ✅ Test Sign-Off Criteria

All tests must pass before signing off:

### Functional Requirements
- [ ] All 10 features work as described
- [ ] No console errors on any page
- [ ] All navigation links functional
- [ ] All user interactions work correctly

### Accessibility Requirements
- [ ] WCAG 2.1 AA compliant
- [ ] All touch targets ≥44px
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast meets standards

### Responsive Requirements
- [ ] Works on mobile (375px)
- [ ] Works on tablet (768px)
- [ ] Works on desktop (1920px)
- [ ] No horizontal scroll on any breakpoint

### Browser Compatibility
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge

### Performance Requirements
- [ ] All pages load in <3 seconds
- [ ] Interactions respond in <100ms
- [ ] No memory leaks
- [ ] localStorage works correctly

---

## 📄 Test Report Template

After testing, generate report:

```markdown
# Test Report: UI/UX Improvements
**Date:** [Date]
**Tester:** [Name]
**Duration:** [Time]

## Summary
- **Tests Planned:** [Number]
- **Tests Executed:** [Number]
- **Tests Passed:** [Number]
- **Tests Failed:** [Number]
- **Bugs Found:** [Number]

## Test Results by Feature Group

### Group 1: Homepage Content & Navigation
- Feature 1.1: [PASS/FAIL]
- Feature 1.2: [PASS/FAIL]
- Feature 1.3: [PASS/FAIL]
- Feature 1.4: [PASS/FAIL]
- Feature 1.5: [PASS/FAIL]

### Group 2: UI Component Cleanup
- Feature 2.1: [PASS/FAIL]
- Feature 2.2: [PASS/FAIL]
- Feature 2.3: [PASS/FAIL]

### Group 3: Navigation & Dashboard Fixes
- Feature 3.1: [PASS/FAIL]
- Feature 3.2: [PASS/FAIL]

## Bugs Found
[List all bugs with reference numbers]

## Recommendations
[Any suggestions for improvements]

## Sign-Off
- [ ] Ready for production
- [ ] Requires fixes

**Tester Signature:** _______________
**Date:** _______________
```

---

## 🔗 Resources

### Production URL
https://care-collective-preview.vercel.app

### Test Accounts
- Admin: [TBD]
- Regular User: [TBD]

### Documentation
- PRs: https://github.com/musickevan1/care-collective-preview/pulls
- Issues: https://github.com/musickevan1/care-collective-preview/issues

### Tools
- Playwright MCP
- Chrome DevTools
- WAVE Accessibility Tool
- Lighthouse
- axe DevTools

---

**END OF TESTING PLAN**
