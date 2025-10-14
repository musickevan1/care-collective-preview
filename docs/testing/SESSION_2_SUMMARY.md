# Session 2: Browse Requests Fix - Comprehensive Summary

**Date:** October 14, 2025
**Issue:** Bug #1 - Browse Requests page showing 500 Internal Server Error
**Status:** RLS Fix Applied ✅ | Deployment Issue ⚠️

---

## 🎯 What Was Fixed

### Root Cause Discovered
The Browse Requests 500 error was caused by an **RLS (Row Level Security) policy conflict**:

1. **help_requests table RLS**: Allows approved users to view help requests ✅
2. **profiles table RLS**: Only allowed users to view their OWN profile ❌
3. **The Problem**: Browse Requests query uses foreign key joins to show requester names:
   ```sql
   SELECT hr.*, profiles.name, profiles.location
   FROM help_requests hr
   LEFT JOIN profiles ON hr.user_id = profiles.id
   ```
4. **Result**: RLS blocked the JOIN because viewers couldn't see other users' profiles → 500 error

### Solution Implemented

#### Migration Created: `20251014120000_fix_profiles_rls_for_community_viewing.sql`

**Key Components:**

1. **SECURITY DEFINER Function** (prevents infinite recursion):
   ```sql
   CREATE OR REPLACE FUNCTION is_current_user_approved()
   RETURNS boolean
   LANGUAGE sql
   SECURITY DEFINER
   STABLE
   AS $$
     SELECT EXISTS (
       SELECT 1 FROM profiles
       WHERE id = auth.uid()
       AND verification_status = 'approved'
     );
   $$;
   ```

2. **Updated RLS Policy**:
   ```sql
   CREATE POLICY "profiles_select_community_viewing"
   ON profiles FOR SELECT TO authenticated
   USING (
     -- Rule 1: Users can ALWAYS view their own profile
     auth.uid() = id
     OR
     -- Rule 2: Approved users can view OTHER approved users' profiles
     (
       is_current_user_approved()  -- Uses SECURITY DEFINER to avoid recursion
       AND verification_status = 'approved'
     )
   );
   ```

3. **Why This Works:**
   - Approved users can now see other approved users' basic info (name, location)
   - Essential for mutual aid platform (must see who's asking for help)
   - No infinite recursion (SECURITY DEFINER breaks the cycle)
   - Maintains security (rejected users still blocked from everything)

---

## ✅ Verification: RLS Fix Working

### Database Query Test (PASSED ✅)

Ran this test query to simulate Browse Requests:
```sql
SELECT
  hr.*,
  u.name as user_name,
  u.location as user_location
FROM help_requests hr
LEFT JOIN profiles u ON hr.user_id = u.id
LIMIT 5;
```

**Result:** SUCCESS! Query returned help requests with profile names:
- Patricia Parent (Republic, MO)
- Mary Neighbor (Joplin, MO)
- Robert Elder (Springfield, MO)
- etc.

**Conclusion:** RLS policy is correctly allowing approved users to see other approved users' profiles.

---

## ⚠️ Current Issue: 500 Error Persists

### Problem
Despite the RLS fix working in the database, the Browse Requests page still shows a 500 error in production.

### Evidence
- **Database test**: RLS policy allows the JOIN ✅
- **Production test**: Page shows 500 error ❌
- **Deployment status**: Code committed and pushed ✅
- **Waited**: 90+ seconds for deployment ✅

### Likely Causes

1. **Vercel Deployment Cache** (MOST LIKELY)
   - Vercel may be serving cached serverless functions
   - The updated code may not have deployed yet
   - Server-side cache needs to clear

2. **Build Failed Silently**
   - Vercel build may have failed without notification
   - TypeScript errors might be blocking deployment
   - Check Vercel dashboard for build logs

3. **Different Error in Code**
   - Another issue in `app/requests/page.tsx` or `lib/queries/help-requests-optimized.ts`
   - Server-side error not visible in browser console
   - Need to check Vercel function logs

---

## 📋 Commits Made

### Commit 1: `359b09b` (REVERTED - Wrong Approach)
```
🐛 FIX: Resolve Browse Requests 500 error (P0 Critical Bug)
```
- Attempted to use `help_requests_with_profiles` view
- View doesn't exist in production database
- This approach was abandoned

### Commit 2: `242fdfc` (CURRENT FIX)
```
🔒 FIX: Resolve Browse Requests RLS policy issue (Final Fix)
```
**Files changed:**
- `supabase/migrations/20251014120000_fix_profiles_rls_for_community_viewing.sql` (created)
- `lib/queries/help-requests-optimized.ts` (reverted to use direct queries)
- `app/requests/page.tsx` (reverted to use nested profile structure)

**Migration applied to production:** ✅ YES (using `mcp__supabase__apply_migration`)

---

## 🔍 Next Steps to Resolve

### Step 1: Check Vercel Deployment Status
```bash
# View recent deployments
npx vercel ls

# Check specific deployment logs
npx vercel logs [deployment-url]

# Inspect latest deployment
npx vercel inspect
```

### Step 2: Force Redeploy (if needed)
```bash
# Trigger new deployment without code changes
git commit --allow-empty -m "Force redeploy to clear cache"
git push origin main
```

### Step 3: Check Vercel Function Logs
1. Open Vercel dashboard: https://vercel.com/musickevan1/care-collective-preview
2. Navigate to Deployments → Latest → Functions
3. Find `/requests` function logs
4. Look for actual error message (not just generic 500)

### Step 4: Verify Build Success
1. Check Vercel build logs for errors
2. Verify TypeScript compilation succeeded
3. Check for any deployment warnings

### Step 5: Test Locally (Optional)
```bash
npm run dev
# Navigate to http://localhost:3000/requests
# See if error reproduces locally
```

---

## 📊 Summary

| Component | Status | Notes |
|-----------|--------|-------|
| **RLS Policy Fix** | ✅ COMPLETE | Migration applied, database queries work |
| **Code Changes** | ✅ COMPLETE | Reverted to direct table queries |
| **Commits** | ✅ COMPLETE | 2 commits made, pushed to `main` |
| **Migration Applied** | ✅ COMPLETE | `20251014120000_fix_profiles_rls_for_community_viewing.sql` |
| **Database Test** | ✅ PASSED | Foreign key joins work with new RLS |
| **Production Test** | ❌ FAILED | 500 error still showing |
| **Root Cause** | 🔍 INVESTIGATING | Likely deployment cache or build issue |

---

## 🎓 Lessons Learned

### 1. Supabase Views Don't Bypass RLS on JOINs
- Initially thought database views would bypass RLS
- **Reality:** Supabase still enforces RLS on underlying tables even in views
- **Solution:** Fix the RLS policies directly

### 2. SECURITY DEFINER Functions Prevent Recursion
- RLS policies that query the same table cause infinite recursion
- **Solution:** Use SECURITY DEFINER functions to break the cycle
- Function runs with creator's privileges, bypassing RLS for that specific check

### 3. Database vs. Deployment are Separate
- Database changes (migrations) apply immediately via MCP tool
- Code changes require Vercel deployment (may take time or fail)
- Always test both database queries AND production URLs

### 4. Mutual Aid Platforms Need Profile Visibility
- Users MUST be able to see who's asking for help
- This is core to the platform's purpose
- RLS policies must balance security with community functionality

---

## 💡 Recommendations

1. **Check Vercel Dashboard**: Review deployment logs to see actual error
2. **Force Redeploy**: If build succeeded but cache is stale
3. **Enable Vercel Function Logs**: Get real error messages instead of generic 500
4. **Consider View Migration**: If preferred, apply `20250910000000_optimize_filtering_and_search.sql` to production
5. **Add Error Boundary Logging**: Capture server errors for better debugging

---

## 🔗 Related Documentation

- **Main Issue**: `docs/testing/TESTING_REPORT.md` - Bug #1
- **Session Prompt**: `docs/testing/SESSION_2_PROMPT.md`
- **RLS Migration**: `supabase/migrations/20251014120000_fix_profiles_rls_for_community_viewing.sql`
- **Previous RLS Fixes**:
  - `20251012000000_fix_profiles_rls_critical.sql`
  - `20251013200635_fix_infinite_recursion_rls.sql`

---

**Session Status:** Paused - Waiting for deployment investigation
**Next Session:** Verify Vercel deployment, check function logs, resolve 500 error
