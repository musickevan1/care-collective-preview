# Next Session: Critical Bug Fixes for Beta Launch

**Priority**: P0 - BLOCKING BETA LAUNCH
**Method**: PRP (Planning → Research → Production)
**Session Goal**: Fix signup bug and React hydration errors to unblock beta testing

---

## Context from Previous Session

During Phase 1 exploratory testing on production, we discovered **2 critical bugs** that completely block beta launch:

1. **Signup Bug (P0)**: New users cannot log in after signup - profile creation fails silently
2. **React Hydration Errors (P1)**: Multiple hydration mismatches causing console errors

**Full Documentation**:
- `PHASE_1_EXPLORATORY_TEST_REPORT.md` - Complete test findings
- `SIGNUP_BUG_ROOT_CAUSE.md` - Detailed root cause analysis

---

## 🎯 Session Objective

Fix both critical bugs using PRP methodology, verify fixes work, and complete exploratory testing of Phase 1 features.

---

## 📋 PRP Method: PLANNING Phase

### Bug #1: Signup Flow - Profile Creation Failure

**Root Cause**: Production database missing `terms_accepted_at` and `terms_version` columns that signup code expects.

**Planning Checklist**:
- [ ] Review `SIGNUP_BUG_ROOT_CAUSE.md` for complete analysis
- [ ] Decide on fix strategy (Option 1 recommended: add columns to production)
- [ ] Plan database migration approach
- [ ] Plan verification testing strategy
- [ ] Plan rollback procedure if needed

**Fix Strategy (Recommended)**:
```sql
-- Add missing columns to production profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version text;

-- Fix orphaned test account
UPDATE profiles
SET terms_accepted_at = created_at,
    terms_version = '1.0'
WHERE id = '0ae2a228-06c7-4413-8e8f-f31e18617943';
```

### Bug #2: React Hydration Errors

**Root Cause**: Server-rendered HTML doesn't match client-side React render (Errors #418, #423).

**Planning Checklist**:
- [ ] Identify which components trigger hydration errors
- [ ] Plan reproduction approach (production build locally)
- [ ] Determine fix strategy (suppress vs fix source)
- [ ] Plan verification that fix doesn't break functionality

**Investigation Strategy**:
1. Run production build locally: `npm run build && npm start`
2. Check for hydration errors in dashboard
3. Identify specific components causing mismatch
4. Common culprits: date formatting, timestamps, client-only state

---

## 🔍 PRP Method: RESEARCH Phase

### Research Task 1: Schema Audit

**Goal**: Document all differences between local migrations and production schema

**Steps**:
1. Query production schema for all `profiles` columns
2. Compare against local migration files in `supabase/migrations/`
3. Document ALL differences (not just terms columns)
4. Create comprehensive migration plan

**Query to Run**:
```sql
-- Get complete production schema
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND table_schema = 'public'
ORDER BY ordinal_position;
```

**Expected Findings**:
- Missing: `terms_accepted_at`, `terms_version`
- Possibly other differences from migration drift

### Research Task 2: Hydration Error Source

**Goal**: Identify exact component(s) causing hydration mismatch

**Steps**:
1. Review dashboard page components (`app/dashboard/page.tsx`)
2. Check for date/time formatting (common cause)
3. Look for conditional rendering based on client state
4. Check for `useEffect` hooks that modify initial render
5. Review any timestamp displays in activity feed

**Files to Investigate**:
- `app/dashboard/page.tsx` - Main dashboard
- Components rendering user greeting with "Welcome back, [name]!"
- Recent activity feed with timestamps
- Stats cards with counts

**Common Patterns to Look For**:
```typescript
// ❌ BAD: Server renders one value, client renders another
{new Date().toLocaleString()}

// ❌ BAD: Conditional based on client-only state
{typeof window !== 'undefined' && <ClientComponent />}

// ✅ GOOD: Suppress hydration warning if intentional
<div suppressHydrationWarning>{new Date().toLocaleString()}</div>

// ✅ GOOD: Use useEffect for client-only content
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
if (!mounted) return <Skeleton />
```

### Research Task 3: Test Account Status

**Goal**: Verify current state of test account and plan cleanup

**Steps**:
1. Check if test bot user still exists in `auth.users`
2. Check if profile was manually created
3. Decide: fix and keep, or delete and recreate

**Query**:
```sql
SELECT
  u.id,
  u.email,
  u.email_confirmed_at,
  p.name,
  p.verification_status,
  p.terms_accepted_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'playwright.testbot.care@gmail.com';
```

---

## 🛠️ PRP Method: PRODUCTION Phase

### Production Task 1: Apply Database Migration

**Priority**: P0 - Do this FIRST

**Steps**:
1. **Backup verification**:
   ```sql
   -- Verify no data will be lost
   SELECT COUNT(*) FROM profiles;
   ```

2. **Apply migration**:
   ```sql
   -- Add missing columns
   ALTER TABLE profiles
     ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
     ADD COLUMN IF NOT EXISTS terms_version text;

   -- Create index for potential queries
   CREATE INDEX IF NOT EXISTS idx_profiles_terms_accepted
     ON profiles(terms_accepted_at)
     WHERE terms_accepted_at IS NOT NULL;
   ```

3. **Verify schema**:
   ```sql
   -- Confirm columns exist
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'profiles'
     AND column_name IN ('terms_accepted_at', 'terms_version');
   ```

4. **Backfill existing users** (optional but recommended):
   ```sql
   -- Set default values for existing users
   UPDATE profiles
   SET
     terms_accepted_at = COALESCE(terms_accepted_at, created_at),
     terms_version = COALESCE(terms_version, '1.0')
   WHERE terms_accepted_at IS NULL;
   ```

### Production Task 2: Test Signup Flow End-to-End

**Priority**: P0 - Verify fix works

**Test Steps**:
1. Navigate to `https://care-collective-preview.vercel.app/signup`
2. Create new test account:
   - Email: `phase1.test.{timestamp}@gmail.com`
   - Name: `[TEST] Phase 1 Verification`
   - Include terms acceptance
3. Wait for redirect to `/waitlist`
4. Log out (if auto-logged in)
5. Navigate to `/login`
6. Log in with test credentials
7. **VERIFY**: Dashboard loads without "Database error"
8. **VERIFY**: Profile exists in database
9. **VERIFY**: No errors in browser console (except hydration - we'll fix next)
10. Delete test account after verification

**Success Criteria**:
- ✅ Signup completes without errors
- ✅ Profile created in database with all fields
- ✅ Login succeeds
- ✅ Dashboard loads correctly
- ✅ No "Database error querying schema" message

### Production Task 3: Fix React Hydration Errors

**Priority**: P1 - Fix after signup bug is resolved

**Approach Options**:

**Option A: Suppress Hydration Warnings** (Quick fix)
```typescript
// If timestamp mismatch is intentional and safe
<div suppressHydrationWarning>
  {new Date().toLocaleString()}
</div>
```

**Option B: Fix Source of Mismatch** (Proper fix)
```typescript
// Make server and client render the same
import { formatDistanceToNow } from 'date-fns'

// Server renders timestamp, client hydrates with same value
<time dateTime={isoTimestamp}>
  {formatDistanceToNow(new Date(isoTimestamp), { addSuffix: true })}
</time>
```

**Option C: Client-Only Rendering** (Avoid hydration)
```typescript
'use client'
import { useEffect, useState } from 'react'

export function ClientTimestamp({ date }: { date: string }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <span>Loading...</span>
  }

  return <span>{new Date(date).toLocaleString()}</span>
}
```

**Steps**:
1. Run `npm run build` locally to reproduce
2. Identify specific component causing errors
3. Choose appropriate fix based on use case
4. Test fix doesn't break functionality
5. Deploy and verify errors are gone

### Production Task 4: Complete Phase 1 Exploratory Testing

**Priority**: P1 - After critical bugs are fixed

**Blocked Tests from Previous Session**:
1. Help request creation with validation
2. Help request editing feature (NEW in Phase 1)
3. Messaging platform functionality
4. Bug report form submission
5. Mobile responsiveness
6. Accessibility compliance

**Testing Approach**:
1. Create fresh test account (now that signup works!)
2. Test help request creation:
   - Fill all required fields
   - Test validation (empty fields, invalid data)
   - Verify request appears in feed
3. Test help request EDITING (Phase 1 new feature):
   - Create a request
   - Navigate to edit page
   - Modify title, description, urgency
   - Save changes
   - Verify changes persist
4. Test messaging between two test accounts
5. Test bug report form:
   - Click "Report a bug" button
   - Fill form with client-side validation
   - Submit report
   - Verify submission succeeds
6. Test on mobile viewport (Chrome DevTools)
7. Run accessibility scan with axe or WAVE

---

## ✅ Verification Checklist

### Database Schema
- [ ] `terms_accepted_at` column exists in production `profiles` table
- [ ] `terms_version` column exists in production `profiles` table
- [ ] Existing users have default values backfilled
- [ ] Test account profile exists and is complete

### Signup Flow
- [ ] New user can complete signup form
- [ ] Profile is created automatically on signup
- [ ] User can log out and log back in
- [ ] Dashboard loads without database errors
- [ ] No silent failures in postgres logs

### React Hydration
- [ ] Production build runs locally without errors
- [ ] Hydration errors identified and fixed
- [ ] Dashboard loads without console errors
- [ ] All dynamic content renders correctly
- [ ] No visual glitches or missing content

### Phase 1 Features
- [ ] Help request creation works with validation
- [ ] Help request editing works (NEW feature)
- [ ] Messaging platform functional
- [ ] Bug report form submits successfully
- [ ] Mobile responsive (320px, 768px, 1024px)
- [ ] Accessibility scan passes (WCAG 2.1 AA)

### Cleanup
- [ ] Test accounts deleted or flagged
- [ ] No orphaned data in database
- [ ] Documentation updated with fixes applied

---

## 📊 Success Metrics

**Beta Launch Ready When**:
1. ✅ New users can signup → login → use platform
2. ✅ No critical console errors (hydration fixed)
3. ✅ All Phase 1 features tested and working
4. ✅ Mobile and accessibility compliant
5. ✅ Test accounts cleaned up
6. ✅ Documentation complete

**Estimated Time**:
- Database fix: 15 minutes
- Signup testing: 15 minutes
- Hydration fix: 30-60 minutes (depends on complexity)
- Phase 1 testing: 1-2 hours
- **Total**: 2-3 hours

---

## 🚨 Rollback Plan

**If schema migration fails**:
```sql
-- Rollback: Remove columns
ALTER TABLE profiles
  DROP COLUMN IF EXISTS terms_accepted_at,
  DROP COLUMN IF EXISTS terms_version;

-- Rollback: Remove code references
-- Revert app/signup/page.tsx to not send terms metadata
```

**If signup still broken after fix**:
1. Check postgres logs for new errors: `mcp__supabase__get_logs --service postgres`
2. Verify trigger function works: Check `handle_user_registration()`
3. Test with different email domains
4. Check RLS policies on profiles table

**If hydration fix breaks UI**:
1. Revert component changes
2. Use suppressHydrationWarning as temporary fix
3. Investigate further in local development

---

## 📝 Documentation to Update After Fixes

1. **PHASE_1_EXPLORATORY_TEST_REPORT.md**
   - Add section: "Fixes Applied"
   - Update status from "NOT READY" to "READY" (if all tests pass)
   - Document any remaining minor issues

2. **SIGNUP_BUG_ROOT_CAUSE.md**
   - Add section: "Resolution"
   - Document exact SQL run
   - Note any unexpected findings
   - Mark as RESOLVED

3. **PROJECT_STATUS.md**
   - Update Phase 1 status
   - Note beta launch readiness
   - Document any new issues found

4. **Create**: `PHASE_1_FIXES_APPLIED.md`
   - Summary of fixes
   - Before/after comparisons
   - Testing results
   - Lessons learned

---

## 🎯 Next Session Commands to Run

```bash
# 1. Connect to production database
# Already configured via MCP

# 2. Apply schema migration
mcp__supabase__execute_sql "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz, ADD COLUMN IF NOT EXISTS terms_version text;"

# 3. Verify schema
mcp__supabase__execute_sql "SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles' AND column_name IN ('terms_accepted_at', 'terms_version');"

# 4. Test signup flow
mcp__playwright__browser_navigate "https://care-collective-preview.vercel.app/signup"
# ... complete signup test

# 5. Investigate hydration errors locally
npm run build
npm start
# Check console for errors

# 6. Check production logs after testing
mcp__supabase__get_logs --service postgres
```

---

## ⚠️ Important Notes

1. **Production Changes**: We're modifying the live production database. The changes are non-destructive (adding columns) but verify backups exist.

2. **Test Account Cleanup**: Delete or clearly mark any test accounts created during verification.

3. **Monitor After Deployment**: Watch for any new errors after fixes are applied.

4. **Beta Tester Communication**: Once fixed, notify beta testers that platform is ready for testing.

5. **Documentation**: Update all relevant docs with findings and fixes.

---

## 📚 Reference Documents

- `PHASE_1_EXPLORATORY_TEST_REPORT.md` - Full test results
- `SIGNUP_BUG_ROOT_CAUSE.md` - Detailed root cause analysis
- `CLAUDE.md` - Project guidelines and PRP method
- `PROJECT_STATUS.md` - Current project status
- `docs/context-engineering/prp-method/` - PRP methodology details

---

**Session Mode**: Execute
**Priority**: P0 - BLOCKING
**Expected Outcome**: Beta launch ready ✅
