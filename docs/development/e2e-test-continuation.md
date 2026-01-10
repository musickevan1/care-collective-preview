# E2E Test Suite - Session Transfer Document

**Date:** 2026-01-10
**Status:** Auth/Dashboard 100%, Help-requests 70%, Messaging needs work

---

## What Was Accomplished

### 1. Test Files Created

```
tests/e2e/
├── fixtures/
│   └── auth.fixture.ts       # Login helpers, test credentials
├── pages/
│   ├── BasePage.ts           # Base page object class
│   ├── DashboardPage.ts      # Dashboard interactions
│   ├── MessagesPage.ts       # Messaging interactions
│   └── RequestsPage.ts       # Help request interactions
├── selectors/
│   └── index.ts              # Centralized selectors
├── auth.spec.ts              # 34 auth tests (30 passing)
├── dashboard.spec.ts         # 40 dashboard tests (27 passing)
├── help-requests.spec.ts     # 34 help request tests
└── messaging.spec.ts         # 30 messaging tests
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
| help-requests.spec.ts | **24** | 10 | 0 | Create Request form selectors, Offer Help completion |
| messaging.spec.ts | 7 | 4 | 19 | Transient auth, needs conversation fixtures |

---

## Known Issues to Fix

### ✅ FIXED: Auth & Dashboard (Session 2026-01-10)

All auth and dashboard selector issues resolved:
- Mobile menu handling in `ensureLoggedOut()`
- Error message selector updated (`.bg-red-50` to avoid Next.js route announcer)
- Stats cards have `data-testid` attributes
- Touch target test fixed (targets button, not link)

### REMAINING: Help-Requests (10 failures)

#### 1. Create Request Form (6 tests)
Form field selectors may not match actual DOM in `/app/requests/new/page.tsx`.

**Files:** `tests/e2e/selectors/index.ts` → `createRequest` section

#### 2. Offer Help Completion (2 tests)
Flow works but success indicator not found after submission.

**File:** `tests/e2e/help-requests.spec.ts:314` expects redirect to `/messages` or success text

#### 3. Modal Focus Management (1 test)
Depends on modal behavior.

#### 4. Mobile Browse Requests (1 test)
Timing issue on mobile viewport.

### REMAINING: Messaging (4 failures, 19 skipped)

- **Transient auth timeouts** - Not selector issues
- **19 skipped** - Need conversation test fixtures to be created

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

# Run all new tests
E2E_BASE_URL="http://localhost:3001" npx playwright test tests/e2e/auth.spec.ts tests/e2e/help-requests.spec.ts tests/e2e/messaging.spec.ts tests/e2e/dashboard.spec.ts

# Run with headed browser for debugging
E2E_BASE_URL="http://localhost:3001" npx playwright test tests/e2e/auth.spec.ts --headed

# Run single test
E2E_BASE_URL="http://localhost:3001" npx playwright test tests/e2e/auth.spec.ts --grep "approved user can login"
```

---

## Next Steps

1. ✅ ~~Fix failing selectors~~ - Auth & Dashboard complete
2. **Fix Create Request form selectors** - Verify against `/app/requests/new/page.tsx`
3. **Fix Offer Help completion** - Update success indicator assertion
4. **Set up messaging test fixtures** - Create conversations for test users
5. **Add to CI** - Consider adding E2E tests to GitHub Actions
6. **Commit changes** - All fixes from this session are uncommitted

---

## Key Files Reference

- Playwright config: `playwright.config.ts`
- Auth fixture: `tests/e2e/fixtures/auth.fixture.ts`
- Selectors: `tests/e2e/selectors/index.ts`
- Login page: `app/login/page.tsx`
- Dashboard page: `app/dashboard/page.tsx`

---

## Session Notes

- The dev server sometimes starts on port 3001 if 3000 is in use
- Login API works correctly via curl - issues were with Playwright selectors
- The Edge Runtime error was caused by webpack chunk splitting for Supabase
- Test users were created via Supabase Management API using CLI access token
