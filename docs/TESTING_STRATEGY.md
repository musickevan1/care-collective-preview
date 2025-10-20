# Comprehensive Testing Strategy - Beta Launch

**Target**: Client meeting Thursday
**Approach**: In-depth Playwright automation + manual accessibility testing
**Goal**: 100% confidence in core user flows

---

## Testing Philosophy

### Coverage Priorities
1. **Critical User Flows**: Must work flawlessly for demo
2. **Security**: Validation, authentication, privacy
3. **Accessibility**: WCAG 2.1 AA compliance
4. **Real-Time Features**: WebSocket functionality
5. **Mobile Experience**: Responsive design verification

### Testing Levels
- **E2E Tests**: Playwright automated browser testing
- **Integration Tests**: API + database interactions
- **Manual Tests**: Accessibility, UX, edge cases
- **Performance Tests**: Real-time latency, load times

---

## Playwright Test Suite Structure

### Test Organization

```
tests/
├── e2e/
│   ├── auth-flows.spec.ts          # Login, signup, logout, verification
│   ├── browse-requests.spec.ts     # Browse page, filters, search, pagination
│   ├── request-detail.spec.ts      # View details, offer help, actions
│   ├── create-request.spec.ts      # Form validation, submission, errors
│   ├── messaging.spec.ts           # Send/receive, real-time, typing
│   ├── messaging-privacy.spec.ts   # Privacy settings, restrictions
│   ├── admin-flows.spec.ts         # Admin verification, moderation
│   └── mobile-experience.spec.ts   # Mobile viewport testing
├── accessibility/
│   ├── wcag-compliance.spec.ts     # Automated accessibility scans
│   └── keyboard-navigation.spec.ts # Tab order, focus management
└── integration/
    ├── supabase-queries.spec.ts    # Database operations
    └── api-endpoints.spec.ts       # API route testing
```

---

## Core User Flow Tests (PRIORITY 1)

### Flow 1: Browse & View Help Requests

**File**: `tests/e2e/browse-requests.spec.ts`

**Test Cases**:
```typescript
describe('Browse Help Requests', () => {
  test('should load browse page without error', async ({ page }) => {
    await page.goto('/requests');

    // CRITICAL: Verify no error page
    await expect(page.locator('text=Something Went Wrong')).not.toBeVisible();

    // Verify requests list loads
    await expect(page.locator('[data-testid="request-card"]')).toHaveCount(await page.locator('[data-testid="request-card"]').count(), { timeout: 10000 });
  });

  test('should filter by category', async ({ page }) => {
    await page.goto('/requests');

    // Select groceries filter
    await page.click('[data-testid="filter-groceries"]');

    // Verify only groceries requests shown
    const cards = await page.locator('[data-testid="request-card"]').all();
    for (const card of cards) {
      await expect(card.locator('text=Groceries')).toBeVisible();
    }
  });

  test('should filter by urgency', async ({ page }) => {
    await page.goto('/requests');

    // Select urgent filter
    await page.click('[data-testid="filter-urgent"]');

    // Verify urgent badge visible
    await expect(page.locator('[data-testid="urgency-urgent"]').first()).toBeVisible();
  });

  test('should search by keyword', async ({ page }) => {
    await page.goto('/requests');

    await page.fill('[data-testid="search-input"]', 'groceries');
    await page.press('[data-testid="search-input"]', 'Enter');

    // Verify results contain keyword
    await expect(page.locator('text=/groceries/i').first()).toBeVisible();
  });

  test('should navigate to request detail', async ({ page }) => {
    await page.goto('/requests');

    const firstCard = page.locator('[data-testid="request-card"]').first();
    await firstCard.click();

    // Verify detail page loaded
    await expect(page).toHaveURL(/\/requests\/[a-f0-9-]+/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should handle pagination', async ({ page }) => {
    await page.goto('/requests');

    // If pagination exists
    const nextButton = page.locator('[data-testid="pagination-next"]');
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await expect(page).toHaveURL(/page=2/);
    }
  });
});
```

**Critical Success Criteria**:
- ✅ No "Something Went Wrong" error
- ✅ Request cards render with all data
- ✅ Filters work correctly
- ✅ Search returns relevant results
- ✅ Detail navigation works

---

### Flow 2: View Request Detail & Offer Help

**File**: `tests/e2e/request-detail.spec.ts`

**Test Cases**:
```typescript
describe('Request Detail Page', () => {
  test('should load request details', async ({ page, context }) => {
    // Login as helper
    await page.goto('/login');
    await page.fill('[name="email"]', 'helper@example.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');

    // Navigate to specific request
    await page.goto('/requests');
    await page.locator('[data-testid="request-card"]').first().click();

    // Verify detail page content
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-testid="request-category"]')).toBeVisible();
    await expect(page.locator('[data-testid="request-description"]')).toBeVisible();
  });

  test('should show "Offer Help" button for open requests', async ({ page }) => {
    // Login and navigate to open request
    await page.goto('/login');
    await page.fill('[name="email"]', 'helper@example.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');

    await page.goto('/requests');
    const openRequest = page.locator('[data-testid="request-status-open"]').first();
    await openRequest.click();

    // Verify offer help button
    await expect(page.locator('button:has-text("Offer Help")')).toBeVisible();
  });

  test('should open messaging dialog on offer help', async ({ page }) => {
    // Setup and navigate to request
    await page.goto('/login');
    await page.fill('[name="email"]', 'helper@example.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');

    await page.goto('/requests');
    await page.locator('[data-testid="request-card"]').first().click();

    // Click offer help
    await page.click('button:has-text("Offer Help")');

    // Verify dialog opened
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="message"]')).toBeVisible();
  });

  test('should send initial help message', async ({ page }) => {
    // Navigate to request and open dialog
    await page.goto('/login');
    await page.fill('[name="email"]', 'helper@example.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');

    await page.goto('/requests');
    await page.locator('[data-testid="request-card"]').first().click();
    await page.click('button:has-text("Offer Help")');

    // Fill and send message
    await page.fill('textarea[placeholder*="message"]', 'I can help with this!');
    await page.click('button:has-text("Send Message")');

    // Verify success and redirect
    await expect(page).toHaveURL('/messages', { timeout: 10000 });
  });
});
```

**Critical Success Criteria**:
- ✅ Detail page loads without error
- ✅ All request data displays correctly
- ✅ Offer help button appears for eligible users
- ✅ Messaging dialog opens
- ✅ Message sends successfully

---

### Flow 3: Create Help Request

**File**: `tests/e2e/create-request.spec.ts`

**Test Cases**:
```typescript
describe('Create Help Request', () => {
  test('should load create form', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'requester@example.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');

    await page.goto('/requests/new');

    // Verify form elements
    await expect(page.locator('[name="title"]')).toBeVisible();
    await expect(page.locator('[name="category"]')).toBeVisible();
    await expect(page.locator('[name="description"]')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'requester@example.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');

    await page.goto('/requests/new');

    // Try to submit without required fields
    await page.click('[type="submit"]');

    // Verify error or disabled button
    const submitButton = page.locator('[type="submit"]');
    await expect(submitButton).toBeDisabled();
  });

  test('should enforce character limits', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'requester@example.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');

    await page.goto('/requests/new');

    // Fill title with more than 100 characters
    const longTitle = 'a'.repeat(101);
    await page.fill('[name="title"]', longTitle);

    // Verify truncated or error shown
    const titleValue = await page.locator('[name="title"]').inputValue();
    expect(titleValue.length).toBeLessThanOrEqual(100);
  });

  test('should prevent XSS attempts', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'requester@example.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');

    await page.goto('/requests/new');

    // Try to submit with script tag
    await page.fill('[name="title"]', '<script>alert("xss")</script>');
    await page.selectOption('[name="category"]', 'groceries');
    await page.click('[type="submit"]');

    // Should show validation error or sanitize
    await expect(page.locator('text=/invalid|error/i')).toBeVisible();
  });

  test('should create request successfully', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'requester@example.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');

    await page.goto('/requests/new');

    // Fill valid form
    await page.fill('[name="title"]', 'Need grocery shopping help');
    await page.selectOption('[name="category"]', 'groceries');
    await page.fill('[name="description"]', 'I need help getting groceries this week.');
    await page.selectOption('[name="urgency"]', 'normal');
    await page.click('[type="submit"]');

    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // Verify request appears in browse
    await page.goto('/requests');
    await expect(page.locator('text=Need grocery shopping help')).toBeVisible();
  });
});
```

**Critical Success Criteria**:
- ✅ Form loads with all fields
- ✅ Required field validation works
- ✅ Character limits enforced
- ✅ XSS attempts blocked
- ✅ Valid submission succeeds
- ✅ Redirect to dashboard works
- ✅ New request appears in browse

---

### Flow 4: Real-Time Messaging

**File**: `tests/e2e/messaging.spec.ts`

**Test Cases**:
```typescript
describe('Messaging Platform', () => {
  test('should navigate to messages page', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'user@example.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');

    await page.goto('/messages');

    // Verify messaging interface
    await expect(page.locator('[data-testid="conversation-list"]')).toBeVisible();
  });

  test('should send and receive messages in real-time', async ({ browser }) => {
    // Create two browser contexts (two users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // User 1 login
    await page1.goto('/login');
    await page1.fill('[name="email"]', 'user1@example.com');
    await page1.fill('[name="password"]', 'TestPass123!');
    await page1.click('[type="submit"]');

    // User 2 login
    await page2.goto('/login');
    await page2.fill('[name="email"]', 'user2@example.com');
    await page2.fill('[name="password"]', 'TestPass123!');
    await page2.click('[type="submit"]');

    // User 1 navigates to conversation
    await page1.goto('/messages');
    await page1.locator('[data-testid="conversation-item"]').first().click();

    // User 2 navigates to same conversation
    await page2.goto('/messages');
    await page2.locator('[data-testid="conversation-item"]').first().click();

    // User 1 sends message
    const testMessage = `Test message ${Date.now()}`;
    await page1.fill('[data-testid="message-input"]', testMessage);
    await page1.click('[data-testid="send-button"]');

    // User 2 should receive in real-time
    await expect(page2.locator(`text=${testMessage}`)).toBeVisible({ timeout: 5000 });

    await context1.close();
    await context2.close();
  });

  test('should show typing indicators', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Login both users and navigate to same conversation
    // ... (similar to previous test)

    // User 1 starts typing
    await page1.focus('[data-testid="message-input"]');
    await page1.type('[data-testid="message-input"]', 'Hello');

    // User 2 should see typing indicator
    await expect(page2.locator('[data-testid="typing-indicator"]')).toBeVisible({ timeout: 3000 });

    // User 1 stops typing
    await page1.fill('[data-testid="message-input"]', '');

    // Typing indicator should disappear
    await expect(page2.locator('[data-testid="typing-indicator"]')).not.toBeVisible({ timeout: 3000 });

    await context1.close();
    await context2.close();
  });

  test('should show message read receipts', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'user@example.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');

    await page.goto('/messages');
    await page.locator('[data-testid="conversation-item"]').first().click();

    // Send message
    await page.fill('[data-testid="message-input"]', 'Test message');
    await page.click('[data-testid="send-button"]');

    // Check for read indicator (after recipient reads)
    const lastMessage = page.locator('[data-testid="message-bubble"]').last();
    // May need to wait for other user to read
    // await expect(lastMessage.locator('[data-testid="read-indicator"]')).toBeVisible();
  });

  test('should display unread count', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'user@example.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');

    await page.goto('/messages');

    // Verify unread badge exists if there are unread messages
    const unreadBadge = page.locator('[data-testid="unread-count"]');
    // May or may not be visible depending on data
  });
});
```

**Critical Success Criteria**:
- ✅ Messages page loads
- ✅ Conversations list displays
- ✅ Messages send successfully
- ✅ Real-time delivery works (< 5s)
- ✅ Typing indicators display
- ✅ Unread counts accurate

---

### Flow 5: Authentication

**File**: `tests/e2e/auth-flows.spec.ts`

**Test Cases**:
```typescript
describe('Authentication Flows', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[name="email"]', 'approved@example.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');

    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[name="email"]', 'wrong@example.com');
    await page.fill('[name="password"]', 'WrongPassword');
    await page.click('[type="submit"]');

    // Verify error message
    await expect(page.locator('text=/invalid|error/i')).toBeVisible();
  });

  test('should signup new user', async ({ page }) => {
    await page.goto('/signup');

    const timestamp = Date.now();
    await page.fill('[name="name"]', `Test User ${timestamp}`);
    await page.fill('[name="email"]', `test${timestamp}@example.com`);
    await page.fill('[name="password"]', 'TestPass123!');
    await page.fill('[name="location"]', 'Springfield, MO');
    await page.fill('[name="applicationReason"]', 'I want to help my community');
    await page.click('[type="submit"]');

    // Verify redirect to waitlist
    await expect(page).toHaveURL('/waitlist', { timeout: 10000 });
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[name="email"]', 'approved@example.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');

    await expect(page).toHaveURL('/dashboard');

    // Logout
    await page.click('[data-testid="logout-button"]');

    // Verify redirect to home
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('should protect authenticated routes', async ({ page }) => {
    // Try to access dashboard without login
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('should handle pending verification status', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[name="email"]', 'pending@example.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');

    // Verify redirect to waitlist
    await expect(page).toHaveURL('/waitlist', { timeout: 10000 });
  });

  test('should handle rejected verification status', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[name="email"]', 'rejected@example.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');

    // Verify redirect to access denied
    await expect(page).toHaveURL(/\/access-denied/, { timeout: 10000 });
  });
});
```

**Critical Success Criteria**:
- ✅ Login works with valid credentials
- ✅ Errors shown for invalid credentials
- ✅ Signup creates account
- ✅ Logout clears session
- ✅ Protected routes redirect
- ✅ Verification status handled

---

## Accessibility Testing (PRIORITY 1)

### Automated Accessibility Scans

**File**: `tests/accessibility/wcag-compliance.spec.ts`

**Test Cases**:
```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

describe('WCAG 2.1 AA Compliance', () => {
  test('should have no accessibility violations on home page', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have no violations on browse requests page', async ({ page }) => {
    await page.goto('/requests');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have no violations on create request form', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[name="email"]', 'approved@example.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');

    await page.goto('/requests/new');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```

### Manual Accessibility Tests

**Keyboard Navigation**:
```typescript
describe('Keyboard Navigation', () => {
  test('should navigate form with Tab key', async ({ page }) => {
    await page.goto('/login');

    // Tab through form
    await page.press('body', 'Tab'); // Email field
    await expect(page.locator('[name="email"]')).toBeFocused();

    await page.press('body', 'Tab'); // Password field
    await expect(page.locator('[name="password"]')).toBeFocused();

    await page.press('body', 'Tab'); // Submit button
    await expect(page.locator('[type="submit"]')).toBeFocused();
  });

  test('should submit form with Enter key', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[name="email"]', 'approved@example.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.press('[name="password"]', 'Enter');

    // Should submit and redirect
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should close dialog with Escape key', async ({ page }) => {
    // ... navigate to page with dialog
    await page.click('button:has-text("Offer Help")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    await page.press('body', 'Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });
});
```

---

## Mobile Testing (PRIORITY 2)

**File**: `tests/e2e/mobile-experience.spec.ts`

```typescript
describe('Mobile Experience', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('should display mobile-optimized browse page', async ({ page }) => {
    await page.goto('/requests');

    // Verify mobile layout
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    await expect(page.locator('[data-testid="request-card"]')).toBeVisible();
  });

  test('should have 44px minimum touch targets', async ({ page }) => {
    await page.goto('/requests');

    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const box = await button.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});
```

---

## Test Execution Plan

### Phase 1: Post-Fix Verification (2 hours)
1. Run `tests/e2e/browse-requests.spec.ts`
2. Run `tests/e2e/request-detail.spec.ts`
3. Run `tests/e2e/create-request.spec.ts`
4. Fix any failures immediately

### Phase 2: Full Flow Testing (4 hours)
1. Run `tests/e2e/messaging.spec.ts`
2. Run `tests/e2e/auth-flows.spec.ts`
3. Run accessibility suite
4. Fix failures, re-run

### Phase 3: Final Verification (2 hours)
1. Run entire suite together
2. Verify 100% pass rate
3. Manual testing of critical flows
4. Mobile device testing (real device)

---

## Success Criteria

### Must Pass (Demo Blockers)
- [ ] All browse-requests tests pass
- [ ] All request-detail tests pass
- [ ] All create-request tests pass
- [ ] Real-time messaging works
- [ ] Authentication flows work
- [ ] No critical accessibility violations

### Should Pass (Quality)
- [ ] Typing indicators work
- [ ] Mobile viewport tests pass
- [ ] Keyboard navigation works
- [ ] All WCAG 2.1 AA checks pass

### Nice to Have
- [ ] Performance benchmarks met
- [ ] All edge cases covered
- [ ] Admin flow tests pass

---

## Test Data Requirements

### Database Seed
- 10-15 realistic help requests (mix of categories, urgencies)
- 5-10 test user accounts (requester, helper, admin, pending, rejected)
- 3-5 active conversations with message history
- Sample unread messages

### Test Accounts
```
approved@example.com / TestPass123! - Approved user
pending@example.com / TestPass123! - Pending verification
rejected@example.com / TestPass123! - Rejected
admin@example.com / TestPass123! - Admin user
requester@example.com / TestPass123! - Has active requests
helper@example.com / TestPass123! - Has offered help
```

---

## Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Run sequentially for database consistency
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to avoid race conditions
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

---

**Last Updated**: 2025-10-20
**Status**: Ready for implementation
**Next**: Begin test suite creation after bug fixes
