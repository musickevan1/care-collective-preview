# Session 3: Debug Browse Requests 500 Error with Function Logs

**Priority:** P0 - Critical Bug
**Issue:** Browse Requests page shows 500 error despite RLS policy fix working
**Previous Session:** Session 2 (RLS fix applied successfully)
**Status:** Database queries work ✅ | Production page fails ❌

---

## 🎯 Session Objective

**Fix the Browse Requests page 500 error by:**
1. Accessing Vercel function logs to identify the actual error
2. Diagnosing the root cause based on error details
3. Implementing the fix
4. Verifying the page loads correctly in production

**Success Criteria:**
- ✅ Browse Requests page loads without 500 error
- ✅ Help request cards display with requester names
- ✅ Filters work correctly
- ✅ No console errors

---

## 📋 Context from Session 2

### What Was Fixed
✅ **RLS Policy Updated:** Migration `20251014120000_fix_profiles_rls_for_community_viewing.sql`
- Added `is_current_user_approved()` SECURITY DEFINER function
- Updated `profiles_select_community_viewing` policy
- Allows approved users to view other approved users' profiles

✅ **Database Verification:** Direct SQL queries work perfectly
```sql
SELECT hr.*, profiles.name, profiles.location
FROM help_requests hr
LEFT JOIN profiles ON hr.user_id = profiles.id
-- Returns data with profile names (Patricia Parent, Mary Neighbor, etc.)
```

✅ **Code Updated:**
- `lib/queries/help-requests-optimized.ts` - Uses direct table queries
- `app/requests/page.tsx` - Nested profile objects with null handling

✅ **Deployed:** 3 commits pushed, Vercel shows "Ready"

### What's Still Broken
❌ **Production Error:** Browse Requests page shows 500 Internal Server Error
❌ **Generic Error:** "An error occurred in the Server Components render"
❌ **No Detailed Logs:** Vercel CLI times out, need dashboard access

### Key Mystery
**Dashboard works** with similar query (`profiles!user_id (name)`) but shows "Anonymous"
**Browse Requests fails** with same pattern (`profiles!user_id (name, location)`)

---

## 🔍 Debugging Strategy - Three Paths Forward

### Path A: Access Vercel Function Logs (FASTEST - 15 min)

**If you have Vercel dashboard access:**

1. **Navigate to Vercel Dashboard:**
   - URL: https://vercel.com/musickevan1s-projects/care-collective-preview
   - Click: Deployments → Latest Deployment (191a3f1 or newer)
   - Click: Functions tab

2. **Find the `/requests` function:**
   - Look for: `app/requests/page`
   - Click: View function details

3. **Reproduce the error:**
   - In another tab, navigate to: https://care-collective-preview.vercel.app/requests
   - Log in as: test.approved.final@carecollective.test / TestPass123!
   - Watch function logs in real-time

4. **Identify the actual error:**
   - Look for: TypeError, ReferenceError, or specific error messages
   - Copy: Full error stack trace
   - Note: Which line/file is causing the error

5. **Share findings:**
   - Paste the error message here
   - I'll diagnose and implement fix immediately

**Common errors to look for:**
- `TypeError: Cannot read property 'name' of undefined`
- `Error: Serialization error`
- `Supabase: permission denied for relation profiles`
- `ReferenceError: ... is not defined`

---

### Path B: Add Debug Logging (NO DASHBOARD ACCESS - 30 min)

**If you can't access Vercel dashboard, let me add detailed logging:**

**Step 1: Add Debug Code**

I'll modify `app/requests/page.tsx` to add comprehensive error logging:

```typescript
// Enhanced logging to capture the actual error
try {
  const queryResult = await getOptimizedHelpRequests({...})

  // Log EVERYTHING
  console.error('[BROWSE DEBUG] Query completed:', {
    success: !queryResult.error,
    hasData: !!queryResult.data,
    dataLength: queryResult.data?.length,
    firstItem: JSON.stringify(queryResult.data?.[0]),
    errorMessage: queryResult.error?.message,
    errorCode: queryResult.error?.code,
    errorDetails: JSON.stringify(queryResult.error)
  })

  requests = queryResult.data
  queryError = queryResult.error
} catch (error) {
  console.error('[BROWSE DEBUG] EXCEPTION:', {
    name: error?.constructor?.name,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
  })
  queryError = error
}
```

**Step 2: Deploy and Check Logs**

After deploying, you can check logs via:
```bash
# List deployments
npx vercel ls

# View logs for latest deployment
npx vercel logs [deployment-url]
```

Or check Vercel dashboard at a later time.

---

### Path C: Test Simplified Query (DIAGNOSTIC - 20 min)

**Test if the issue is with the JOIN or something else:**

**Step 1: Create Test API Endpoint**

I'll create `app/api/test-browse/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Test 1: Simple query without JOIN
    const { data: test1, error: error1 } = await supabase
      .from('help_requests')
      .select('*')
      .limit(3)

    // Test 2: Query with JOIN (like Browse Requests)
    const { data: test2, error: error2 } = await supabase
      .from('help_requests')
      .select(`
        *,
        profiles!user_id (name, location)
      `)
      .limit(3)

    return Response.json({
      test1: { success: !error1, count: test1?.length, error: error1?.message },
      test2: { success: !error2, count: test2?.length, error: error2?.message, data: test2 }
    })
  } catch (err) {
    return Response.json({
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined
    }, { status: 500 })
  }
}
```

**Step 2: Test the Endpoint**

Navigate to: `https://care-collective-preview.vercel.app/api/test-browse`

This will show us:
- ✅ If the query works in an API route
- ❌ If the error is specific to Server Components
- 🔍 What the actual data looks like

**Step 3: Compare Results**

If test2 succeeds:
- Issue is in page component rendering, not the query
- Check for serialization errors
- Check for undefined values during mapping

If test2 fails:
- Issue is with the Supabase query itself
- RLS might not be working in production
- Environment variables might be incorrect

---

### Path D: Alternative Fix - Separate Queries (WORKAROUND - 45 min)

**If the JOIN keeps failing, fetch data separately:**

Instead of:
```typescript
profiles!user_id (name, location)  // Single query with JOIN
```

Use:
```typescript
// Query 1: Get help requests
const requests = await supabase.from('help_requests').select('*')

// Query 2: Get unique user IDs
const userIds = [...new Set(requests.map(r => r.user_id))]

// Query 3: Get profiles in batch
const profiles = await supabase
  .from('profiles')
  .select('id, name, location')
  .in('id', userIds)

// Merge data in code
const merged = requests.map(req => ({
  ...req,
  profile: profiles.find(p => p.id === req.user_id)
}))
```

This avoids the JOIN entirely and gives us more control over error handling.

---

## 🚀 Recommended Execution Order

### Option 1: You Have Vercel Dashboard Access
1. ✅ **PATH A** - Check function logs (15 min)
2. Share error message
3. I'll implement fix immediately

### Option 2: You Don't Have Dashboard Access
1. ✅ **PATH C** - Create test endpoint (20 min)
2. Check if query works in API route
3. ✅ **PATH B** - Add debug logging if needed (30 min)
4. ✅ **PATH D** - Use separate queries as fallback (45 min)

### Option 3: Quick Workaround Needed
1. ✅ **PATH D** - Implement separate queries (45 min)
2. Get Browse Requests working immediately
3. Debug JOIN issue later

---

## 📊 Quick Reference

### Files to Check
- `app/requests/page.tsx:218-250` - Query execution
- `lib/queries/help-requests-optimized.ts:42-114` - Query function
- `app/requests/page.tsx:252-256` - safeRequests mapping

### Test Accounts
- **Approved User:** test.approved.final@carecollective.test / TestPass123!
- **Admin User:** admin@carecollective.test / AdminPass123!

### URLs to Test
- **Browse Requests:** https://care-collective-preview.vercel.app/requests
- **Dashboard (works):** https://care-collective-preview.vercel.app/dashboard

### Vercel Info
- **Project:** care-collective-preview
- **Organization:** musickevan1s-projects
- **Latest Deployment:** 191a3f1 (force redeploy)

### Database Verification
```sql
-- This works perfectly in production database
SELECT hr.*, profiles.name, profiles.location
FROM help_requests hr
LEFT JOIN profiles ON hr.user_id = profiles.id
LIMIT 5;
```

---

## 📝 Expected Outcomes

### If Error is: `TypeError: Cannot read property 'name' of undefined`
**Diagnosis:** Null profile data not being handled
**Fix:** Update safeRequests mapping in `app/requests/page.tsx`
**Time:** 10 minutes

### If Error is: `Supabase: permission denied`
**Diagnosis:** RLS policy not applied correctly in production
**Fix:** Re-run migration or check environment variables
**Time:** 20 minutes

### If Error is: `Serialization error` or `JSON` related
**Diagnosis:** Server component can't serialize the data
**Fix:** Ensure all data is JSON-serializable, remove functions/dates
**Time:** 15 minutes

### If Error is: Query timeout or connection error
**Diagnosis:** Supabase connection issue
**Fix:** Check environment variables, verify API keys
**Time:** 15 minutes

---

## ✅ Session Completion Checklist

- [ ] Identified actual error from function logs or test endpoint
- [ ] Diagnosed root cause
- [ ] Implemented fix
- [ ] Tested in production with approved user
- [ ] Verified help request cards display names correctly
- [ ] Tested filters (status, category, urgency)
- [ ] Checked mobile view
- [ ] No console errors
- [ ] Committed fix with descriptive message
- [ ] Updated `docs/testing/MASTER_FIX_PLAN.md` - mark Bug #1 as FIXED
- [ ] Created Session 3 summary document

---

## 🎯 Start Session 3

**Step 1:** Choose your path:
- "Check Vercel logs" → I'll guide you through Path A
- "I don't have access" → I'll execute Path C (test endpoint)
- "Just make it work" → I'll execute Path D (separate queries)

**Step 2:** Share findings or let me know which path to take

**Step 3:** I'll implement the fix and verify

Let's fix this! 🚀

---

**Related Documentation:**
- Session 2 Summary: `docs/testing/SESSION_2_SUMMARY.md`
- Session 2 Final Status: `docs/testing/SESSION_2_FINAL_STATUS.md`
- Master Fix Plan: `docs/testing/MASTER_FIX_PLAN.md`
- Testing Report: `docs/testing/TESTING_REPORT.md`
