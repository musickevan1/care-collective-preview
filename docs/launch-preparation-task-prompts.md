# Individual Task Prompts for Orchestrator

**Created**: December 27, 2025
**Purpose**: Orchestrator can use these individual prompts to spawn specialized agents for each launch preparation task

---

## Task 1: Fix Login Redirect to Dashboard

### Recommended Agent
`@frontend-engineer` - Client-side JavaScript redirect logic in login page
OR
`@api-designer` - If the issue is in the API response

### Prompt

Fix the login redirect bug where users who successfully authenticate are incorrectly redirected to the homepage (`/`) instead of the dashboard (`/dashboard`).

### Investigation Required

First, diagnose whether this is a **redirect bug** or a **dashboard rendering issue**:

1. Sign in with test credentials on `/app/login/page.tsx`
2. Check browser URL after successful authentication
3. Confirm whether redirect goes to `/` or `/dashboard`
4. If URL shows `/dashboard`, investigate dashboard rendering (the page might be rendering homepage content)

### Potential Fixes

**If API returns incorrect redirect:**
File: `/app/api/auth/login/route.ts` (Line 196)
Ensure the response includes:
```json
{
  "success": true,
  "data": {
    "status": "approved",
    "redirect": "/dashboard",  // ← Ensure this is /dashboard
    "message": "Login successful"
  }
}
```

**If client-side redirect logic is faulty:**
File: `/app/login/page.tsx` (Lines 86-96)

Add debug logging and verify the destination calculation:
```typescript
if (status === 'approved') {
  const urlParams = new URLSearchParams(window.location.search)
  const redirectTo = urlParams.get('redirectTo')
  const destination = redirectTo || redirect || '/dashboard'

  console.log('Login redirect destination:', destination)  // Debug log

  setTimeout(() => {
    window.location.replace(destination)
  }, 300)  // Consider increasing from 100ms to 300ms
  return
}
```

**If session establishment is slow:**
Increase timeout from 100ms to 300ms in `/app/login/page.tsx` (Line 93)

### Acceptance Criteria
- [ ] User logs in with correct credentials
- [ ] Browser URL changes to `/dashboard` after login
- [ ] Dashboard page loads with correct user data
- [ ] No console errors during redirect
- [ ] Works for both form-based login and OAuth callback
- [ ] Verified with test user on local development environment

### Files to Modify
- `/app/login/page.tsx` (if client-side fix needed)
- `/app/api/auth/login/route.ts` (if API response fix needed)
- `/app/auth/callback/route.ts` (verify OAuth redirect)

### Testing Required
1. Test with standard credentials
2. Test with OAuth (if configured)
3. Test with `?redirectTo=/some-page` parameter
4. Test on mobile and desktop
5. Check browser console for errors

---

## Task 6: Profile Page Breadcrumb Cleanup

### Recommended Agent
`@frontend-engineer` - Simple component state change

### Prompt

Update the profile page breadcrumbs to show just `/ Profile` instead of `/ Dashboard / Profile`, matching the pattern used for other top-level pages like Messages.

### Implementation

File: `/app/profile/page.tsx` (Lines 205-208)

**Change from:**
```typescript
const breadcrumbs = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Profile', href: '/profile' }
]
```

**Change to:**
```typescript
const breadcrumbs = [
  { label: 'Profile', href: '/profile' }
]
```

This will change the breadcrumb display from:
- **Before**: `/ Dashboard / Profile`
- **After**: `/ Profile`

### Acceptance Criteria
- [ ] Profile page displays `/ Profile` in header
- [ ] "Dashboard" is removed from breadcrumb trail
- [ ] Clicking "Profile" breadcrumb stays on profile page
- [ ] Mobile navigation (breadcrumbs hidden on mobile) still works
- [ ] Consistent with Messages page breadcrumb pattern

### Files to Modify
- `/app/profile/page.tsx` (Lines 205-208)

### Testing Required
1. Navigate to profile page, check breadcrumb display
2. Click breadcrumb, verify it stays on profile page
3. Navigate to other pages, verify breadcrumbs still work
4. Check mobile (breadcrumbs hidden correctly)

---

## Task 7: Dashboard Navbar Bug Fix

### Recommended Agent
`@frontend-engineer` - Component state and routing logic

### Prompt

Fix the dashboard navbar double-highlighting bug where both "Browse Requests" and "New Request" are highlighted when viewing the `/requests/new` page.

### Problem

On `/requests/new`, both navbar items are active because:
- "Browse Requests" uses prefix matching: `pathname.startsWith('/requests')`
- "New Request" uses exact matching: `pathname === '/requests/new'`

This causes confusing double-highlighting.

### Implementation

File: `/components/layout/PlatformLayout.tsx` (Lines ~35-60 for navItems)

**Recommended Solution (Simplest)**: Add `exactMatch: true` to "Browse Requests"

**Change from:**
```typescript
const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home, exactMatch: true },
  { href: '/requests', label: 'Browse Requests', icon: Search },  // NO exactMatch
  { href: '/requests/new', label: 'New Request', icon: PlusCircle, exactMatch: true },
  // ... rest of items
]
```

**Change to:**
```typescript
const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home, exactMatch: true },
  { href: '/requests', label: 'Browse Requests', icon: Search, exactMatch: true },  // ADD exactMatch: true
  { href: '/requests/new', label: 'New Request', icon: PlusCircle, exactMatch: true },
  // ... rest of items
]
```

### Note on Side Effects

After this change, request detail pages (`/requests/[id]`) will not have any highlighted navbar item because "Browse Requests" will only match `/requests` exactly.

**If this is undesirable**, consider one of these alternatives:
1. Add "Request Details" as a new nav item with exact match
2. Implement smart matching logic that excludes exact match routes from prefix matches

### Acceptance Criteria
- [ ] On `/requests` page, only "Browse Requests" is highlighted
- [ ] On `/requests/new` page, only "New Request" is highlighted
- [ ] On `/dashboard` page, only "Dashboard" is highlighted
- [ ] On `/messages` page, only "Messages" is highlighted
- [ ] On `/profile` page, only "Profile" is highlighted
- [ ] No double-highlighting on any page
- [ ] Visual consistency across all pages

### Files to Modify
- `/components/layout/PlatformLayout.tsx` (navItems definition, approximately line 40)

### Testing Required
1. Navigate to `/requests`, verify only "Browse Requests" active
2. Navigate to `/requests/new`, verify only "New Request" active
3. Navigate to `/requests/[id]`, verify appropriate highlighting (or decide on behavior)
4. Navigate to all other pages, verify correct highlighting
5. Test on mobile (same active state logic)

---

## Task 4: Scroll Progress Bar Responsiveness

### Recommended Agent
`@frontend-engineer` - Client-side performance optimization

### Prompt

Fix the scroll progress bar at the top of the homepage which exhibits delayed/laggy updates when scrolling, causing poor user experience.

### Problem Analysis

Current implementation in `/app/page.tsx` (Lines 92-105) updates the progress bar on every scroll event without throttling or requestAnimationFrame. This causes:
- Excessive state updates at 60-120fps
- Direct React state updates competing with browser scroll rendering
- Potential visual jitter

### Implementation

Replace the current scroll handler with a requestAnimationFrame-based approach:

File: `/app/page.tsx` (Lines 92-105, 174-183)

**Change from:**
```typescript
const [scrollProgress, setScrollProgress] = useState(0)

useEffect(() => {
  const handleScroll = () => {
    const scrollTop = window.scrollY
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    const progress = (scrollTop / docHeight) * 100
    setScrollProgress(Math.min(progress, 100))
  }

  window.addEventListener('scroll', handleScroll, { passive: true })
  return () => window.removeEventListener('scroll', handleScroll)
}, [])
```

**Change to:**
```typescript
const [scrollProgress, setScrollProgress] = useState(0)
const [scrollRAF, setScrollRAF] = useState<number | null>(null)

useEffect(() => {
  const handleScroll = () => {
    // Cancel any pending animation frame
    if (scrollRAF !== null) {
      cancelAnimationFrame(scrollRAF)
    }

    // Schedule new animation frame
    const rafId = requestAnimationFrame(() => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = (scrollTop / docHeight) * 100
      setScrollProgress(Math.min(progress, 100))
      setScrollRAF(null)
    })

    setScrollRAF(rafId)
  }

  window.addEventListener('scroll', handleScroll, { passive: true })

  return () => {
    if (scrollRAF !== null) {
      cancelAnimationFrame(scrollRAF)
    }
    window.removeEventListener('scroll', handleScroll)
  }
}, [scrollRAF])
```

**Benefits:**
- Syncs updates with browser's repaint cycle (60fps)
- Cancels pending updates to avoid stale renders
- Eliminates visual jitter

### Acceptance Criteria
- [ ] Scroll progress bar updates smoothly when scrolling at normal speed
- [ ] Scroll progress bar updates smoothly when scrolling rapidly
- [ ] No visual jitter or lag perceived
- [ ] Performance impact is minimal (check Chrome DevTools Performance tab)
- [ ] Works on both desktop and mobile browsers
- [ ] Progress bar remains hidden until 5% scroll threshold

### Files to Modify
- `/app/page.tsx` (Lines 92-105, 174-183)

### Testing Required
1. Test slow scrolling (smooth updates)
2. Test rapid scrolling (no lag, keeps up)
3. Test on mobile (smooth performance)
4. Check performance with Chrome DevTools (no excessive layout thrashing)

---

## Task 5: Hero Section Redesign

### Recommended Agent
`@style-master` - Typography, layout, and responsive design changes

### Prompt

Redesign the hero section with improved typography, layout, and spacing to better communicate the platform's purpose and geographic focus.

### Current Layout
```
[CARE Collective Logo]
Southwest Missouri
CARE Collective
C.A.R.E. Acronym
[Description text on 2 lines]
[Get Started CTA]
```

### Desired Layout

```
           [Transparent Logo] (Centered)
Southwest Missouri (Larger, bolded, left-aligned, closer to CARE)
      CARE Collective (Main text)
  C.A.R.E. [Acronym] (Larger to match CARE width)
[Description text on 2 lines] (Larger text)
      [Get Started CTA] (Good as-is)
```

### Implementation

File: `/app/page.tsx` (Hero section - approximate lines 175-220)

#### 1. Add Transparent Logo Above Text

```tsx
{/* Transparent Logo - Centered Above */}
<div className="flex justify-center mb-6">
  <Image
    src="/logo-textless.png"
    alt="CARE Collective Logo"
    width={120}
    height={120}
    className="rounded w-24 h-24 sm:w-28 sm:h-28 opacity-80"
    priority
  />
</div>
```

#### 2. Update "Southwest Missouri" Text

```tsx
<p className="text-xl sm:text-2xl font-bold text-secondary mb-2">
  Southwest Missouri
</p>
```
- **Larger**: `text-xl sm:text-2xl` (was `text-base sm:text-lg`)
- **Bolded**: Add `font-bold`
- **Closer to CARE**: Reduce `mb-4` to `mb-2`

#### 3. Adjust CARE Collective Main Text

```tsx
<h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-foreground mb-4">
  CARE Collective
</h1>
```
- No change to text size (already large)
- Reduce `mb-6` to `mb-4` for tighter spacing

#### 4. Expand C.A.R.E. Acronym Width

```tsx
<p className="text-lg sm:text-xl md:text-2xl tracking-[0.2em] text-accent font-medium mb-6">
  C<span className="mx-1">.</span>A<span className="mx-1">.</span>R<span className="mx-1">.</span>E
</p>
```
- **Larger text**: `text-lg sm:text-xl md:text-2xl` (was `text-base sm:text-lg md:text-xl`)
- **Increased letter spacing**: `tracking-[0.2em]` to stretch width
- **Letter dots**: Add `mx-1` between letters for visual separation

#### 5. Increase Description Text Size

```tsx
<p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
  Community Assistance &amp; Resources Exchange
  <br className="hidden sm:block" />
  Connecting neighbors through mutual aid
</p>
```
- **Larger text**: `text-base sm:text-lg md:text-xl` (was `text-sm sm:text-base md:text-lg`)
- **Remain on two lines**: Use `<br className="hidden sm:block" />` for responsive line break
- **Improved readability**: Add `leading-relaxed` for better line height

#### 6. Adjust Responsive Spacing

```tsx
{/* Mobile: More vertical spacing, Desktop: Tighter */}
<div className="flex flex-col items-center px-4 sm:px-6 py-12 md:py-16 lg:py-20 text-center sm:text-left">
  {/* Hero content */}
</div>
```
- Mobile: `text-center` for centered layout
- Desktop: `sm:text-left` to align Southwest Missouri with CARE text
- Adjust padding for better vertical balance

### Acceptance Criteria
- [ ] Transparent logo appears centered above all text
- [ ] "Southwest Missouri" is bolded, larger than before
- [ ] "Southwest Missouri" is visually closer to "CARE Collective"
- [ ] "Southwest Missouri" aligns left on desktop (with CARE text)
- [ ] C.A.R.E. acronym spans similar width to CARE text
- [ ] Description text is larger while maintaining two-line layout
- [ ] CTA button size and positioning remain good
- [ ] Layout works well on mobile, tablet, and desktop

### Files to Modify
- `/app/page.tsx` (Hero section - approximate lines 175-220)

### Testing Required
1. Visual inspection on mobile (375px, 414px)
2. Visual inspection on tablet (768px, 1024px)
3. Visual inspection on desktop (1280px, 1440px, 1920px)
4. Check for accessibility (contrast ratios, screen reader order)
5. Verify responsive behavior (line breaks, spacing adjustments)

---

## Task 2: Mobile Homepage Responsiveness (DEFERRED)

### Recommended Agent
`@style-master` - Responsive design fixes

### Prompt

**DEFER THIS TASK** until Task 5 (Hero Section Redesign) is complete. Since the hero section text sizing and layout will change significantly, mobile responsiveness fixes should be applied after that work is complete to avoid duplicate effort.

### Planned Fixes (Post-Task 5)

Once hero redesign is complete, implement these mobile responsiveness improvements:

1. **Footer Link Touch Targets** (Priority: High)
   - Add `min-h-[44px]` to footer links for tablet screens (641-1023px)
   - Ensure WCAG 2.1 AA compliance on all breakpoints

2. **Hero Image Size on Ultra-Small Screens** (Priority: Medium)
   - Add `xs:` breakpoint handling for screens 320-375px
   - Reduce image size from `w-48 h-48` to `w-40 h-40` on smallest screens

3. **Section Title Sizing** (Priority: Low)
   - Adjust `clamp()` minimum from 32px to 28px for very small screens
   - Ensure vertical spacing is adequate

### Files to Modify
- `/app/page.tsx` (main homepage)
- `/app/globals.css` (footer touch targets)
- Tailwind config (if new xs breakpoint needed)

---

## Task 3: Launch Readiness Verification

### Recommended Agent
`@orchestrator` - Coordinates testing across multiple areas

### Prompt

Perform comprehensive launch readiness verification of the Care Collective platform. The "unbeta test everything" task was completed previously, so this is a verification and validation task.

### Implementation

#### Phase 1: Manual QA Checklist

Execute and document results for the following areas:

**Authentication Flow**
- [ ] Sign up process works correctly
- [ ] Email verification receives and processes
- [ ] Login with correct credentials works
- [ ] Login with incorrect credentials shows error
- [ ] Password reset flow (if available)
- [ ] OAuth login (if configured)
- [ ] Session persists across page refreshes
- [ ] Sign out clears session properly

**Dashboard & Navigation**
- [ ] Dashboard loads for approved users
- [ ] Dashboard shows correct user stats
- [ ] Quick action cards navigate correctly
- [ ] Recent activity displays properly
- [ ] Breadcrumbs show correct path
- [ ] Mobile navigation menu works

**Help Requests**
- [ ] Create new help request form submits
- [ ] Form validation works (required fields, character limits)
- [ ] Request appears in "My Requests" after creation
- [ ] Browse requests page shows all open requests
- [ ] Filtering by category/urgency works
- [ ] Request detail page loads correctly
- [ ] Status updates work (open → in_progress → closed)

**Messaging**
- [ ] Messaging page loads correctly
- [ ] Conversation list shows conversations
- [ ] Clicking conversation opens thread
- [ ] Sending messages works
- [ ] Real-time message updates appear
- [ ] Typing indicators show
- [ ] Unread badges update correctly
- [ ] Mobile messaging works (toggle between list/thread)

**Profile**
- [ ] Profile page loads with user data
- [ ] Profile updates save correctly
- [ ] Avatar upload works (if available)
- [ ] Location updates save

**Privacy & Security**
- [ ] Contact exchange requires consent
- [ ] Contact info not exposed without consent
- [ ] Privacy policy link works
- [ ] Terms of service link works

**Responsive Design**
- [ ] Homepage displays correctly on mobile (375px, 414px)
- [ ] Homepage displays correctly on tablet (768px, 1024px)
- [ ] Dashboard displays correctly on mobile
- [ ] Messaging displays correctly on mobile
- [ ] All touch targets are 44px minimum on mobile

#### Phase 2: Automated Test Suite Execution

Run the existing test suite and generate coverage report:

```bash
# Unit and integration tests
pnpm test

# Coverage report
pnpm test:coverage

# E2E tests with Playwright
pnpm test:e2e
```

**Expected Coverage**
- Unit tests: >80% coverage on critical paths
- Integration tests: All major user flows covered
- E2E tests: Critical paths (auth, requests, messaging)

#### Phase 3: Performance Verification

**Check Build Warnings**
```bash
pnpm build
```
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] No build warnings

**Lighthouse Scores** (Production deployment)
- Performance: >90
- Accessibility: >95
- Best Practices: >90
- SEO: >90

### Acceptance Criteria
- [ ] All manual QA items pass
- [ ] Automated test suite passes with >80% coverage
- [ ] No critical bugs found
- [ ] Performance meets Lighthouse thresholds
- [ ] Documentation updated with any new findings

### Files to Review
- Test files in `/tests/`
- Configuration files: `package.json`, `tsconfig.json`, `next.config.js`
- Lighthouse reports from production URL

---

## Task 8: Messaging UI Bug Exploration with Playwright

### Recommended Agent
`@test-engineer` - Create and execute Playwright test suite

### Prompt

Create a comprehensive Playwright-based exploration test suite for the messaging UI to identify and document bugs across mobile, desktop, interactions, and accessibility.

### Implementation

#### Step 1: Create Test Suite Structure

Create the following directory structure:

```
/tests/messaging/
  ├── exploration/
  │   ├── mobile-viewport.test.ts    (Mobile-specific issues)
  │   ├── desktop-viewport.test.ts   (Desktop-specific issues)
  │   ├── interactions.test.ts          (User interaction bugs)
  │   └── accessibility.test.ts        (A11y issues)
  ├── fixtures/
  │   ├── test-users.ts                (Test user credentials)
  │   └── test-conversations.ts         (Mock conversation data)
  └── helpers/
      └── messaging-helpers.ts          (Reusable test utilities)
```

#### Step 2: Create Exploration Tests

**File**: `/tests/messaging/exploration/mobile-viewport.test.ts`

Create tests for mobile viewport (375px × 812px):

```typescript
import { test, expect } from '@playwright/test'
import { login } from '../helpers/messaging-helpers'

test.describe('Messaging UI - Mobile Viewport Exploration', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'test-user@example.com', 'password123')
    await page.goto('/messages')
    await page.setViewportSize({ width: 375, height: 812 })
  })

  test('conversation list touch targets', async ({ page }) => {
    // Check all conversation list items meet 44px minimum
    const items = await page.locator('[data-component="ConversationList"] > div').all()

    for (const item of items) {
      const box = await item.boundingBox()
      expect(box.height).toBeGreaterThanOrEqual(44)
    }
  })

  test('unread badge visibility', async ({ page }) => {
    // Check unread badges are visible and tappable
    const badge = await page.locator('.bg-sage.text-white.text-xs').first()
    await expect(badge).toBeVisible()

    const box = await badge.boundingBox()
    expect(box.width).toBeGreaterThanOrEqual(24)
    expect(box.height).toBeGreaterThanOrEqual(24)
  })

  test('header button spacing', async ({ page }) => {
    // Check header buttons have adequate spacing
    const buttons = await page.locator('[data-component="ConversationHeader"] button').all()

    for (let i = 0; i < buttons.length - 1; i++) {
      const box1 = await buttons[i].boundingBox()
      const box2 = await buttons[i + 1].boundingBox()
      const spacing = box2.x - (box1.x + box1.width)

      expect(spacing).toBeGreaterThanOrEqual(8)
    }
  })

  test('list vs thread toggle', async ({ page }) => {
    // Verify mobile can toggle between conversation list and message thread
    const firstConversation = page.locator('[data-component="ConversationList"] > div').first()

    await firstConversation.click()
    await expect(page.locator('[data-component="MessageThreadPanel"]')).toBeVisible()

    const backButton = page.locator('[aria-label="Back to conversations"]')
    await backButton.click()
    await expect(page.locator('[data-component="ConversationList"]')).toBeVisible()
  })

  test('message bubble width', async ({ page }) => {
    // Check message bubbles aren't too wide on mobile
    const bubble = page.locator('[data-component="MessageBubble"]').first()
    const container = page.locator('[data-component="MessageThreadPanel"]')

    const containerBox = await container.boundingBox()
    const bubbleBox = await bubble.boundingBox()

    const maxAllowedWidth = containerBox.width * 0.8
    expect(bubbleBox.width).toBeLessThanOrEqual(maxAllowedWidth)
  })

  test('content density', async ({ page }) => {
    // Check conversation list items aren't overcrowded
    const item = page.locator('[data-component="ConversationList"] > div').first()

    const avatar = item.locator('img').first()
    const text = item.locator('.text-foreground').first()

    const avatarBox = await avatar.boundingBox()
    const textBox = await text.boundingBox()

    const gap = textBox.x - (avatarBox.x + avatarBox.width)
    expect(gap).toBeGreaterThanOrEqual(16)
  })
})
```

**File**: `/tests/messaging/exploration/desktop-viewport.test.ts`

Create tests for desktop viewport (1920px × 1080px):

```typescript
import { test, expect } from '@playwright/test'
import { login } from '../helpers/messaging-helpers'

test.describe('Messaging UI - Desktop Viewport Exploration', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'test-user@example.com', 'password123')
    await page.goto('/messages')
    await page.setViewportSize({ width: 1920, height: 1080 })
  })

  test('two-pane layout visibility', async ({ page }) => {
    await expect(page.locator('[data-component="ConversationPanel"]')).toBeVisible()
    await expect(page.locator('[data-component="MessageThreadPanel"]')).toBeVisible()
  })

  test('conversation list selection', async ({ page }) => {
    const firstConversation = page.locator('[data-component="ConversationList"] > div').first()

    await firstConversation.click()
    await expect(firstConversation).toHaveClass(/bg-sage\/10/)
  })

  test('message send workflow', async ({ page }) => {
    await page.locator('[data-component="MessageInput"] textarea').fill('Test message')
    await page.locator('[data-component="MessageInput"] button[type="submit"]').click()

    const message = page.locator('text=Test message').last()
    await expect(message).toBeVisible()
  })

  test('tab navigation', async ({ page }) => {
    const tabs = page.locator('[data-component="ConversationPanel"] button')

    const allTab = tabs.filter({ hasText: 'All' })
    const unreadTab = tabs.filter({ hasText: 'Unread' })

    await unreadTab.click()
    await expect(unreadTab).toHaveClass(/text-sage/)

    await allTab.click()
    await expect(allTab).toHaveClass(/text-sage/)
  })
})
```

**File**: `/tests/messaging/exploration/interactions.test.ts`

```typescript
import { test, expect } from '@playwright/test'
import { login } from '../helpers/messaging-helpers'

test.describe('Messaging UI - Interaction Exploration', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'test-user@example.com', 'password123')
    await page.goto('/messages')
  })

  test('typing indicator visibility', async ({ page }) => {
    await page.locator('[data-component="MessageInput"] textarea').fill('Typing...')

    const typingIndicator = page.locator('[data-component="TypingIndicator"]')
    await expect(typingIndicator).toBeVisible({ timeout: 5000 })
  })

  test('long message handling', async ({ page }) => {
    const longMessage = 'A'.repeat(500)

    await page.locator('[data-component="MessageInput"] textarea').fill(longMessage)
    await page.locator('[data-component="MessageInput"] button[type="submit"]').click()

    const messageBubble = page.locator('[data-component="MessageBubble"]').last()
    await expect(messageBubble).toBeVisible()

    const box = await messageBubble.boundingBox()
    expect(box.height).toBeGreaterThan(100)
  })

  test('rapid message sending', async ({ page }) => {
    await page.locator('[data-component="MessageInput"] textarea').fill('Message 1')
    await page.locator('[data-component="MessageInput"] button[type="submit"]').click()

    await page.locator('[data-component="MessageInput"] textarea').fill('Message 2')
    await page.locator('[data-component="MessageInput"] button[type="submit"]').click()

    await page.locator('[data-component="MessageInput"] textarea').fill('Message 3')
    await page.locator('[data-component="MessageInput"] button[type="submit"]').click()

    const messages = await page.locator('[data-component="MessageBubble"]').all()
    expect(messages.length).toBeGreaterThanOrEqual(3)
  })
})
```

**File**: `/tests/messaging/exploration/accessibility.test.ts`

```typescript
import { test, expect } from '@playwright/test'
import { login } from '../helpers/messaging-helpers'

test.describe('Messaging UI - Accessibility Exploration', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'test-user@example.com', 'password123')
    await page.goto('/messages')
  })

  test('keyboard navigation', async ({ page }) => {
    await page.keyboard.press('Tab')

    const firstFocusable = page.locator('button, input, textarea, a[href]').first()
    await expect(firstFocusable).toBeFocused()

    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    await expect(page.locator('[data-component="ConversationList"] > div').first()).toBeFocused()
  })

  test('aria labels', async ({ page }) => {
    const buttons = await page.locator('button:not([aria-label]):not([aria-labelledby])').all()

    expect(buttons.length).toBe(0)
  })

  test('contrast ratios', async ({ page }) => {
    const unreadBadge = page.locator('.bg-sage.text-white.text-xs').first()
    await expect(unreadBadge).toHaveCSS('color', 'rgb(255,255,255)')
  })

  test('screen reader order', async ({ page }) => {
    const conversation = page.locator('[data-component="ConversationList"] > div').first()

    const text = await conversation.textContent()
    expect(text).toMatch(/Name/)
    expect(text).toMatch(/Location/)
  })
})
```

#### Step 3: Create Test Helper Utilities

**File**: `/tests/messaging/helpers/messaging-helpers.ts`

```typescript
import { Page } from '@playwright/test'

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')

  await page.waitForURL(/\/(dashboard|messages)/, { timeout: 5000 })
}

export async function sendMessage(page: Page, text: string) {
  await page.fill('[data-component="MessageInput"] textarea', text)
  await page.click('[data-component="MessageInput"] button[type="submit"]')

  await expect(page.locator(`text=${text}`)).toBeVisible()
}
```

#### Step 4: Execute Tests and Document Findings

Run exploration tests and document all bugs found with severity and recommendations:

```bash
# Run all exploration tests
pnpm playwright test tests/messaging/exploration/

# Run with UI mode to see what's happening
pnpm playwright test tests/messaging/exploration/ --ui

# Generate reports
pnpm playwright test tests/messaging/exploration/ --reporter=html
```

**Create Output Document**: `/tests/messaging/exploration-results.md`

Document findings in this format:
```markdown
# Messaging UI Exploration Results

**Date**: December 27, 2025
**Tests Run**: [X] tests
**Environment**: [Local development / Production URL]

## Mobile Viewport Issues

### High Priority
1. [Description of issue found]
   - **Location**: [Component/file]
   - **Severity**: [Critical / High / Medium / Low]
   - **Steps to reproduce**: [Detailed steps]
   - **Expected behavior**: [What should happen]
   - **Actual behavior**: [What actually happens]

### Medium Priority
2. [Description of issue found]
   - **Location**: [Component/file]
   - **Severity**: [High / Medium / Low]
   - ...

### Low Priority
3. [Description of issue found]
   - ...

## Desktop Viewport Issues

### [Organize same as mobile]

## Interaction Issues

### [Organize same as mobile]

## Accessibility Issues

### [Organize same as mobile]

## Summary

### Bugs Found
- Total: [X]
- Critical: [X]
- High: [X]
- Medium: [X]
- Low: [X]

### Recommendations
1. [Fix recommendation 1]
2. [Fix recommendation 2]
3. [Fix recommendation 3]

### Next Steps
- Prioritize critical bugs
- Create fix tickets for each issue
- Implement fixes and re-test
```

### Acceptance Criteria
- [ ] Playwright exploration tests created
- [ ] Tests run successfully (no test framework errors)
- [ ] Results documented in markdown file
- [ ] Bugs categorized by priority and severity
- [ ] Screenshot/video evidence captured for visual bugs
- [ ] Recommendations provided for each issue

### Files to Create
- `/tests/messaging/exploration/mobile-viewport.test.ts`
- `/tests/messaging/exploration/desktop-viewport.test.ts`
- `/tests/messaging/exploration/interactions.test.ts`
- `/tests/messaging/exploration/accessibility.test.ts`
- `/tests/messaging/helpers/messaging-helpers.ts`
- `/tests/messaging/exploration-results.md` (output)

### Files to Modify
- `/tests/setup.ts` (if Playwright configuration needs updates)

### Testing Required
1. Run exploration tests on local development
2. Review test output and screenshots
3. Document findings with severity levels
4. Prioritize bugs for fixes in future tasks

---

## Usage Notes for Orchestrator

### General Workflow

For each task:
1. Review the prompt to understand requirements
2. Read relevant files to understand current implementation
3. Implement fixes according to the prompt
4. Run `pnpm typecheck` to verify TypeScript compilation
5. Run `pnpm lint` to ensure code quality
6. Run relevant tests (`pnpm test`)
7. Manual test changes in browser
8. Commit with clear message: `feat: [task description]`

### Task Dependencies

```
Task 1 (Login Redirect)
    ↓ (No dependencies)

Task 6 (Profile Breadcrumb)
    ↓ (No dependencies)

Task 7 (Navbar Bug)
    ↓ (No dependencies)

Task 4 (Scroll Progress)
    ↓ (No dependencies)

Task 5 (Hero Redesign)
    ↓ (No dependencies)

Task 3 (Verification)
    ↓ (Depends on Tasks 1, 4, 5, 6, 7 being complete)

Task 2 (Mobile Responsiveness)
    ↓ (Depends on Task 5 - Hero Redesign)

Task 8 (Messaging Exploration)
    ↓ (No dependencies)
```

### Recommended Execution Order

**Phase 1: Critical Fixes (Day 1)**
1. Task 1: Fix login redirect to dashboard
2. Task 6: Profile breadcrumb cleanup
3. Task 7: Dashboard navbar bug fix

**Phase 2: UX Improvements (Day 2)**
4. Task 4: Scroll progress bar responsiveness
5. Task 5: Hero section redesign

**Phase 3: Testing & Polish (Day 3)**
6. Task 3: Launch readiness verification
7. Task 2: Mobile responsiveness (if needed after Task 5)
8. Task 8: Messaging UI bug exploration

---

**End of Task Prompts**
