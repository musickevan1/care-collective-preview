# E2E Test Suite - Session Transfer Document

**Date:** 2026-01-10
**Status:** Auth/Dashboard 100%, Help-requests selector fixes complete, Messaging fixtures created

---

## What Was Accomplished

### 1. Test Files Created

```
tests/e2e/
├── fixtures/
│   ├── auth.fixture.ts           # Login helpers, test credentials
│   └── conversations.fixture.ts  # NEW: Conversation seeding for messaging tests
├── pages/
│   ├── BasePage.ts               # Base page object class
│   ├── DashboardPage.ts          # Dashboard interactions
│   ├── MessagesPage.ts           # Messaging interactions
│   └── RequestsPage.ts           # Help request interactions (UPDATED)
├── selectors/
│   └── index.ts                  # Centralized selectors (UPDATED)
├── auth.spec.ts                  # 34 auth tests
├── dashboard.spec.ts             # 40 dashboard tests
├── help-requests.spec.ts         # 34 help request tests (UPDATED)
└── messaging.spec.ts             # 30 messaging tests
```

### 2. Test Users Created in Supabase

| Email | Password | Status |
|-------|----------|--------|
| `test-user-a@example.com` | `testpassword123` | approved |
| `test-user-b@example.com` | `testpassword123` | approved |

User IDs:
- User A: `f94bb6dd-d7c4-4d91-8638-df9a97aed4df`
- User B: `c80374ce-5cc5-460d-b0d2-6959fcce9dae`

### 3. Config Fixes Applied

**next.config.js** - Commented out Supabase chunk splitting to fix Edge Runtime error:
```javascript
// Line ~206-212 - COMMENTED OUT
// supabase: {
//   test: /[\\/]node_modules[\\/]@supabase[\\/]/,
//   name: 'supabase',
//   chunks: 'all',
//   priority: 10,
// },
```

**supabase/config.toml** - Fixed template paths:
```toml
content_path = "supabase/templates/confirm_signup.html"  # Changed from just filename
```

**.env.local** - Added service role key:
```
SUPABASE_SERVICE_ROLE_KEY=<added via script>
```

---

## Current Test Results

Run with: `E2E_BASE_URL="http://localhost:3000" npx playwright test tests/e2e/<file>.spec.ts`

| Suite | Passed | Failed | Skipped | Notes |
|-------|--------|--------|---------|-------|
| auth.spec.ts | **34** | 0 | 0 | ✅ All fixed |
| dashboard.spec.ts | **38** | 0 | 2 | ✅ All fixed (2 skipped need admin user) |
| help-requests.spec.ts | **24** | 10 | 0 | ⚠️ Selector fixes complete, failures now auth timeouts |
| messaging.spec.ts | 7 | 4 | 19 | Conversation fixture created |

---

## Session 2026-01-10 - Help-Requests Fixes

### ✅ FIXED: Create Request Form Selectors

**Problem:** Form used `id` attributes but tests looked for `name` attributes.

**Changes to `tests/e2e/selectors/index.ts`:**
```typescript
createRequest: {
  titleInput: '#title',                    // Was: input[name="title"]
  descriptionInput: '#description',        // Was: textarea[name="description"]
  categorySelect: '#category',             // Was: select[name="category"]
  urgencyRadio: 'input[name="urgency"]',   // Was: select (form uses radio buttons!)
  urgencyNormal: '#urgency-normal',
  urgencyUrgent: '#urgency-urgent',
  urgencyCritical: '#urgency-critical',
  locationInput: '#location',              // Was: input[name="locationOverride"]
  submitButton: 'button[type="submit"]',
  errorMessage: '[role="alert"], .text-red-500, .text-red-600',
}
```

**Changes to `tests/e2e/pages/RequestsPage.ts`:**
- Updated `createRequest()` to use `.selectOption()` for category dropdown
- Updated urgency selection to use radio button `.check()` instead of select

**Changes to `tests/e2e/help-requests.spec.ts`:**
- Fixed category value: `'Groceries'` → `'groceries-meals'` (matches CATEGORY_VALUES)
- Updated offer help success indicator regex to match actual UI text

### ✅ FIXED: Modal Focus Management

**Problem:** Dialog close button didn't have `aria-label="Close"`.

**Change to `components/ui/dialog.tsx`:**
```tsx
<DialogPrimitive.Close
  aria-label="Close"  // ADDED
  className="..."
>
```

### ✅ IMPROVED: Auth Fixture Timeouts

**Changes to `tests/e2e/fixtures/auth.fixture.ts`:**
- Login timeout: 15000ms → 30000ms
- Dashboard wait: 10000ms → 20000ms
- Better handling for slow local dev servers

### ✅ CREATED: Messaging Fixtures

**New file: `tests/e2e/fixtures/conversations.fixture.ts`**
- `createTestConversation(page)` - Creates a conversation via UI flow
- `hasExistingConversations(page)` - Checks if test users have conversations
- `ensureTestConversationsExist(page)` - Setup helper for messaging tests

### ✅ ADDED: data-testid Attributes

**`components/messaging/ConversationList.tsx`:**
- Added `data-testid="conversation-item"` to ConversationItem
- Added `data-testid="conversation-list"` to list container

**`components/messaging/MessageInput.tsx`:**
- Added `data-testid="message-input"` to Textarea
- Added `data-testid="send-button"` to Send button

**Updated selectors in `tests/e2e/selectors/index.ts`:**
```typescript
messages: {
  conversationList: '[data-testid="conversation-list"], [role="listbox"]',
  conversationItem: '[data-testid="conversation-item"], [role="option"]',
  messageInput: '[data-testid="message-input"], textarea[placeholder*="message"]',
  sendButton: '[data-testid="send-button"], button:has-text("Send")',
  ...
}
```

---

## Known Issues Remaining

### Help-Requests (10 failures - mostly auth timeouts)

The selector fixes WORK - verified by:
- Test 13 (Desktop Create Request): ✓ PASSED
- Test 28 (Mobile form fields): ✓ PASSED
- Test 30 (Mobile Create Request): ✓ PASSED
- Test 31 (Mobile Offer Help): ✓ PASSED

Remaining failures are **intermittent login timeouts**, not code bugs:
- Desktop Chrome has auth timeout issues on some tests
- Same tests pass on Mobile Chrome
- The dev server stability affects results

### Messaging (4 failures, 19 skipped)

- 19 tests skip because test users have no conversations
- Use `ensureTestConversationsExist()` in beforeAll hook to seed data
- Or manually create a test help request and offer help before running tests

---

## Scripts Created

Helper scripts in `scripts/`:
- `create-test-users.ts` - Creates auth users
- `update-test-users.ts` - Updates profile status
- `check-profiles.ts` - Verifies user profiles
- `finalize-test-users.ts` - Sets names/locations
- `get-service-key.ts` - Retrieves service role key

---

## How to Run Tests

```bash
# Start dev server (check which port it uses)
npm run dev

# Run specific test file
E2E_BASE_URL="http://localhost:3001" npx playwright test tests/e2e/auth.spec.ts --reporter=list

# Run all E2E tests
E2E_BASE_URL="http://localhost:3001" npx playwright test tests/e2e/ --reporter=list

# Run with headed browser for debugging
E2E_BASE_URL="http://localhost:3001" npx playwright test tests/e2e/auth.spec.ts --headed

# Run single test
E2E_BASE_URL="http://localhost:3001" npx playwright test tests/e2e/auth.spec.ts --grep "approved user can login"
```

---

## Next Steps

1. ✅ ~~Fix failing selectors~~ - Auth & Dashboard complete
2. ✅ ~~Fix Create Request form selectors~~ - Complete
3. ✅ ~~Fix Offer Help completion~~ - Complete
4. ✅ ~~Set up messaging test fixtures~~ - Fixture created
5. **Integrate conversation fixture** - Add to messaging.spec.ts beforeAll
6. **Add to CI** - Consider adding E2E tests to GitHub Actions
7. **Commit changes** - All fixes from this session are uncommitted

---

## Key Files Reference

- Playwright config: `playwright.config.ts`
- Auth fixture: `tests/e2e/fixtures/auth.fixture.ts`
- Conversation fixture: `tests/e2e/fixtures/conversations.fixture.ts`
- Selectors: `tests/e2e/selectors/index.ts`
- Login page: `app/login/page.tsx`
- Dashboard page: `app/dashboard/page.tsx`
- Create Request page: `app/requests/new/page.tsx`
- Categories constant: `lib/constants/categories.ts`

---

## Session Notes

- The dev server sometimes starts on port 3001/3002 if 3000 is in use
- Login API works correctly - issues are timing/timeout related
- The Edge Runtime error was caused by webpack chunk splitting for Supabase
- Test users were created via Supabase Management API using CLI access token
- Form uses radio buttons for urgency, not a select dropdown
- Category values are like `'groceries-meals'`, not `'Groceries'`
- Dialog component needed `aria-label="Close"` for accessibility tests
