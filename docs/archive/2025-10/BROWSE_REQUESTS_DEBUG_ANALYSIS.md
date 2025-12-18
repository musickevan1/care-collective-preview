# Browse Requests Page - Comprehensive Debug Analysis
**Date**: September 30, 2025
**Issue**: Browse Help Requests page not accessible to users
**Priority**: 🔴 CRITICAL - Blocks beta launch

---

## 🔍 Executive Summary

The browse requests page (`/requests`) has proper authentication/authorization logic but may have issues preventing approved users from accessing it. Analysis reveals the page is protected by a multi-layer security system that requires:

1. ✅ Valid Supabase authentication session
2. ✅ Approved verification status (`verification_status = 'approved'`)
3. ✅ OR Admin privileges (`is_admin = true`)

**Current Database State**:
- **Total Users**: 14
- **Approved Users**: 3 ✅
- **Pending Users**: 3 ⏳
- **Admin Users**: 3 👨‍💼
- **Active Help Requests**: 5+ requests available

---

## 🎯 Authentication Flow Analysis

### Current Implementation (`app/requests/page.tsx`)

```typescript
// Line 69-96: getUser() function
async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null; // Not authenticated
  }

  // Get user profile with verification status
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, location, verification_status, is_admin')
    .eq('id', user.id)
    .single();

  // Check if user is approved or admin
  if (!profile || (profile.verification_status !== 'approved' && !profile.is_admin)) {
    return null; // Not approved - will trigger redirect
  }

  return {
    id: user.id,
    name: profile?.name || user.email?.split('@')[0] || 'Unknown',
    email: user.email || '',
    verification_status: profile.verification_status,
    is_admin: profile.is_admin
  };
}

// Line 144-156: Redirect logic
if (!user) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (authUser) {
    // User is authenticated but not approved
    redirect('/dashboard?message=approval_required');
  } else {
    // User is not authenticated
    redirect('/login?redirect=/requests');
  }
}
```

### Middleware Protection (`lib/supabase/middleware-edge.ts`)

The middleware adds another layer of protection:

```typescript
// Lines 128-165: Protected path logic
const protectedPaths = ['/dashboard', '/requests', '/admin']
const isProtectedPath = protectedPaths.some(path =>
  request.nextUrl.pathname.startsWith(path)
)

if (isProtectedPath) {
  // Check authentication
  if (!user) {
    redirect('/login?redirectTo=' + request.nextUrl.pathname)
  }

  // Check verification status
  const { data: profile } = await supabase
    .from('profiles')
    .select('verification_status, is_admin')
    .eq('id', user.id)
    .single()

  if (profile.verification_status !== 'approved') {
    redirect('/waitlist')
  }
}
```

---

## 🐛 Identified Issues & Root Causes

### Issue #1: Middleware vs Page Logic Mismatch 🔴 CRITICAL

**Problem**: Middleware redirects to `/waitlist`, but page redirects to `/dashboard`

**Evidence**:
- **Middleware** (line 208): `redirect('/waitlist')`
- **Page** (line 151): `redirect('/dashboard?message=approval_required')`

**Impact**: Inconsistent user experience, potential redirect loops

**Fix Required**: Align both to use `/dashboard?message=approval_required`

---

### Issue #2: Potential RLS Policy Blocking 🟡 HIGH

**Problem**: Row Level Security policies may prevent approved users from querying help_requests

**Evidence**: Need to verify RLS policies allow approved users to SELECT from help_requests

**Test Query Needed**:
```sql
-- Check RLS policies on help_requests table
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'help_requests';
```

**Expected Policy**:
```sql
-- Should allow approved users to SELECT
CREATE POLICY "Approved users can view help requests"
ON help_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.verification_status = 'approved'
  )
);
```

---

### Issue #3: Profile Query May Fail Silently 🟡 HIGH

**Problem**: If profile query fails, user is returned as null without clear error

**Location**: `app/requests/page.tsx:78-86`

```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('id, name, location, verification_status, is_admin')
  .eq('id', user.id)
  .single();

if (!profile || (profile.verification_status !== 'approved' && !profile.is_admin)) {
  return null; // ⚠️ No error logging
}
```

**Impact**: Silent failures make debugging difficult

**Fix Required**: Add error logging and proper error handling

---

### Issue #4: Missing Test User Documentation 🟡 MEDIUM

**Problem**: No clear instructions for creating/approving test users

**Current State**:
- 3 approved users exist in database
- No documentation on which users are approved
- No clear test credentials

**Fix Required**: Document test users or create approval workflow

---

## 🔬 Debugging Checklist

### Step 1: Verify Test User Status ✅

**Action**: Check if you have credentials for an approved user

**SQL Query**:
```sql
SELECT id, name, verification_status, is_admin, created_at
FROM profiles
WHERE verification_status = 'approved'
ORDER BY created_at DESC;
```

**Expected**: At least one test user with `verification_status = 'approved'`

---

### Step 2: Test Authentication Flow 🔍

**Action**: Log in with an approved user and try accessing `/requests`

**Test Steps**:
1. Navigate to: `https://care-collective-preview.vercel.app/login`
2. Sign in with approved user credentials
3. Manually navigate to: `https://care-collective-preview.vercel.app/requests`
4. Observe behavior:
   - ✅ **Expected**: Page loads with help requests
   - ❌ **If redirected**: Note where (login, dashboard, waitlist)
   - ❌ **If error**: Check browser console and network tab

---

### Step 3: Check RLS Policies 🔒

**Action**: Verify RLS policies allow approved users to view help requests

**SQL Query**:
```sql
-- Check help_requests RLS policies
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'help_requests';

-- Check profiles RLS policies
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';
```

**Expected**: Policies should allow authenticated + approved users to SELECT

---

### Step 4: Test Query Access 🔍

**Action**: Verify approved user can query help_requests table

**Test as authenticated user** (use Supabase SQL Editor with RLS enabled):
```sql
-- This should work for approved users
SELECT id, title, status, category, urgency
FROM help_requests
WHERE status = 'open'
LIMIT 5;
```

**Expected**: Returns help requests without permission errors

---

### Step 5: Check Middleware Logs 📊

**Action**: Check Vercel deployment logs for middleware errors

**Commands**:
```bash
npx vercel logs https://care-collective-preview.vercel.app --follow
```

**Look for**:
- `[Middleware] Auth state` messages
- `[Middleware] Redirecting to` messages
- `[Middleware] Profile query error` messages
- Any auth-related errors

---

### Step 6: Test with Browser DevTools 🌐

**Action**: Use browser developer tools to inspect the authentication flow

**Steps**:
1. Open DevTools (F12)
2. Go to **Network** tab
3. Navigate to `/requests`
4. Check for:
   - 401/403 responses (authentication/authorization failures)
   - Supabase auth API calls
   - Redirect chains (multiple 302/307 responses)
5. Go to **Console** tab
6. Look for:
   - JavaScript errors
   - `[Middleware]` log messages (in development)
   - Supabase client errors

---

## 🛠️ Recommended Fixes

### Fix #1: Align Middleware and Page Redirects (15 minutes)

**File**: `lib/supabase/middleware-edge.ts`

**Change line 208**:
```typescript
// BEFORE
return NextResponse.redirect(new URL('/waitlist', request.url))

// AFTER
const redirectUrl = new URL('/dashboard', request.url)
redirectUrl.searchParams.set('message', 'approval_required')
return NextResponse.redirect(redirectUrl)
```

---

### Fix #2: Add Error Logging to Profile Query (5 minutes)

**File**: `app/requests/page.tsx`

**Update lines 78-86**:
```typescript
// Get user profile with verification status
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('id, name, location, verification_status, is_admin')
  .eq('id', user.id)
  .single();

if (profileError) {
  console.error('[Browse Requests] Profile query error:', profileError);
  return null;
}

// Check if user is approved or admin
if (!profile || (profile.verification_status !== 'approved' && !profile.is_admin)) {
  console.log('[Browse Requests] User not approved:', {
    userId: user.id,
    verificationStatus: profile?.verification_status,
    isAdmin: profile?.is_admin
  });
  return null;
}
```

---

### Fix #3: Verify/Add RLS Policies (10 minutes)

**Action**: Ensure RLS policies allow approved users to view help requests

**SQL to run in Supabase SQL Editor**:
```sql
-- Check existing policies
SELECT policyname, qual FROM pg_policies
WHERE tablename = 'help_requests' AND cmd = 'SELECT';

-- If missing, add policy for approved users
CREATE POLICY IF NOT EXISTS "Approved users can view help requests"
ON help_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.verification_status = 'approved' OR profiles.is_admin = true)
  )
);
```

---

### Fix #4: Create Test User Documentation (10 minutes)

**Action**: Document test user credentials for beta testing

**File**: `docs/development/TEST_USERS.md`

**Content**:
```markdown
# Test Users for Care Collective

## Approved Users (Can Access /requests)

1. **Admin User**
   - Email: admin@carecollective.org
   - Status: Approved + Admin
   - Purpose: Full system access

2. **Regular User**
   - Email: user@example.com
   - Status: Approved
   - Purpose: Standard user testing

3. **Helper User**
   - Email: helper@example.com
   - Status: Approved
   - Purpose: Offering help testing

## Pending Users (Cannot Access /requests)

1. **Pending User**
   - Email: pending@example.com
   - Status: Pending
   - Purpose: Test approval workflow
```

---

## 🧪 Testing Plan

### Manual Test Scenarios

#### Scenario 1: Unauthenticated User Access
**Steps**:
1. Open incognito/private browser window
2. Navigate to `https://care-collective-preview.vercel.app/requests`
3. **Expected**: Redirected to `/login?redirect=/requests`
4. **Verify**: Login page loads, redirect parameter preserved

#### Scenario 2: Pending User Access
**Steps**:
1. Log in with pending user credentials
2. Navigate to `/requests`
3. **Expected**: Redirected to `/dashboard?message=approval_required`
4. **Verify**: Dashboard shows "waiting for approval" message

#### Scenario 3: Approved User Access ✅ TARGET
**Steps**:
1. Log in with approved user credentials
2. Navigate to `/requests`
3. **Expected**: Browse requests page loads successfully
4. **Verify**:
   - Help requests displayed in grid
   - Filters work (status, category, urgency)
   - "Create Request" button visible
   - Individual requests clickable

#### Scenario 4: Admin User Access ✅ TARGET
**Steps**:
1. Log in with admin user credentials
2. Navigate to `/requests`
3. **Expected**: Browse requests page loads successfully
4. **Verify**: All functionality same as approved user + admin features

---

## 📊 Database Queries for Analysis

### Query 1: Current User Status Distribution
```sql
SELECT
  verification_status,
  COUNT(*) as user_count,
  SUM(CASE WHEN is_admin THEN 1 ELSE 0 END) as admin_count
FROM profiles
GROUP BY verification_status
ORDER BY verification_status;
```

### Query 2: Help Requests Available for Browse
```sql
SELECT
  status,
  COUNT(*) as request_count,
  MIN(created_at) as oldest_request,
  MAX(created_at) as newest_request
FROM help_requests
GROUP BY status
ORDER BY status;
```

### Query 3: Check RLS Policies on Help Requests
```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('help_requests', 'profiles')
ORDER BY tablename, policyname;
```

### Query 4: Test User Query Permissions (Run as specific user)
```sql
-- This should return results for approved users
-- Run with RLS enabled in Supabase SQL Editor
SELECT id, title, status, category, urgency, created_at
FROM help_requests
WHERE status = 'open'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🚨 Known Issues Summary

| Issue | Severity | Impact | Estimated Fix Time |
|-------|----------|--------|-------------------|
| Middleware redirect mismatch | 🔴 Critical | Confusing UX, potential loops | 15 minutes |
| Missing error logging | 🟡 High | Silent failures, hard to debug | 5 minutes |
| RLS policy verification needed | 🟡 High | May block approved users | 10 minutes |
| No test user docs | 🟡 Medium | Testing friction | 10 minutes |
| Inconsistent redirect URLs | 🟢 Low | Minor UX inconsistency | 5 minutes |

**Total Estimated Fix Time**: 45 minutes

---

## 🎯 Next Session Action Plan

### Phase 1: Investigation (10 minutes)
1. ✅ Verify test user credentials exist
2. ✅ Check RLS policies on help_requests
3. ✅ Review Vercel deployment logs
4. ✅ Test authenticated user access manually

### Phase 2: Implementation (30 minutes)
1. 🔧 Fix middleware redirect inconsistency
2. 🔧 Add error logging to profile queries
3. 🔧 Verify/fix RLS policies
4. 🔧 Document test users

### Phase 3: Validation (15 minutes)
1. ✅ Test all user scenarios (unauthenticated, pending, approved, admin)
2. ✅ Verify help requests display correctly
3. ✅ Confirm filters and sorting work
4. ✅ Test create request functionality

### Phase 4: Documentation (10 minutes)
1. 📝 Update PROJECT_STATUS.md
2. 📝 Create TEST_USERS.md
3. 📝 Update NEXT_SESSION_PROMPT.md

**Total Session Time**: ~65 minutes (1 hour)

---

## 📝 Key Files Reference

| File | Purpose | Key Lines |
|------|---------|-----------|
| `app/requests/page.tsx` | Browse requests page | 69-96 (auth), 144-156 (redirect) |
| `lib/supabase/middleware-edge.ts` | Middleware protection | 128-165 (protected paths), 204-209 (redirect) |
| `lib/queries/help-requests-optimized.ts` | Query functions | Optimized queries with indexes |
| `supabase/migrations/` | Database schema | RLS policies, indexes |

---

## ✅ Success Criteria

Browse requests page is considered **WORKING** when:

1. ✅ Unauthenticated users redirected to login
2. ✅ Pending users redirected to dashboard with message
3. ✅ Approved users can view browse requests page
4. ✅ Admin users can view browse requests page
5. ✅ Help requests display correctly in grid
6. ✅ Filters (status, category, urgency) work
7. ✅ Search functionality works
8. ✅ Create request button accessible
9. ✅ Individual request cards clickable
10. ✅ No console errors or silent failures

---

## 🔗 Related Documentation

- [Authentication Flow](./browse-requests-authentication-pattern.md)
- [Master Plan](../context-engineering/master-plan.md)
- [Beta Launch Analysis](../../BETA_LAUNCH_ANALYSIS.md)
- [Project Status](../../PROJECT_STATUS.md)

---

**Last Updated**: September 30, 2025
**Next Review**: After implementing fixes in next session
**Status**: 🔴 Investigation Required → Implementation Pending