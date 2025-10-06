# Next Session: Deep Debugging Authentication Bug
**Date Created:** October 6, 2025
**Priority:** 🚨 CRITICAL - Beta Launch Blocker
**Estimated Duration:** 2-3 hours
**Objective:** Identify exact point where rejected user authentication fails

---

## 🎯 Session Goal

Find the root cause of why rejected users bypass all security layers and why the dashboard shows the wrong user name.

---

## 📋 Context Summary

### Current Situation
- **Bug:** Rejected user logs in → accesses dashboard → sees "Test Approved User!" (wrong name)
- **RLS Fix:** ✅ Database returns correct data (infinite recursion fixed)
- **Service Role:** ✅ Implemented in middleware, dashboard, auth callback
- **Deployments:** ✅ 3 fresh deployments tested - bug persists
- **Evidence:** Screenshot saved in `.playwright-mcp/rejected-user-still-bypassing-security.png`

### What Works
- ✅ Database queries return correct user data
- ✅ Code deploys successfully without errors
- ✅ Service role client created and configured
- ✅ Middleware and dashboard use service role pattern

### What Fails
- ❌ Rejected user not blocked at middleware
- ❌ Dashboard shows wrong user name ("Test Approved User" instead of "Test Rejected User")
- ❌ All 3 security layers bypassed

### Critical Question
**Why does the dashboard show "Test Approved User!" when logged in as rejected user?**

Possible causes:
1. Service role function returns wrong data
2. Middleware doesn't execute at all
3. User ID mixup in auth session
4. Caching issue returning old session data

---

## 🔍 Debugging Plan

### Phase 1: Local Testing with Logging (45 min)

**Step 1.1: Build production locally**
```bash
npm run build
npm run start
```

**Step 1.2: Add comprehensive logging**

File: `lib/supabase/admin.ts`
```typescript
export async function getProfileWithServiceRole(userId: string) {
  console.log('[Service Role] INPUT userId:', userId)
  console.log('[Service Role] Env check:', {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasKey: !!process.env.SUPABASE_SERVICE_ROLE
  })

  const admin = createAdminClient()

  const { data: profile, error } = await admin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  console.log('[Service Role] RESULT:', {
    success: !!profile,
    profileId: profile?.id,
    profileName: profile?.name,
    profileStatus: profile?.verification_status,
    matchesInput: profile?.id === userId,
    error: error?.message
  })

  return profile
}
```

File: `lib/supabase/middleware-edge.ts` (line 172)
```typescript
console.log('[Middleware] BEFORE service role query:', {
  authenticatedUserId: user.id,
  authenticatedUserEmail: user.email,
  path: request.nextUrl.pathname
})

const profile = await getProfileWithServiceRole(user.id)

console.log('[Middleware] AFTER service role query:', {
  profileReturned: !!profile,
  profileId: profile?.id,
  profileName: profile?.name,
  profileStatus: profile?.verification_status,
  shouldBlock: profile?.verification_status === 'rejected',
  willRedirect: profile?.verification_status === 'rejected' ? '/access-denied' : 'continue'
})
```

File: `app/dashboard/page.tsx` (line 24)
```typescript
console.log('[Dashboard] AUTH CHECK START:', {
  hasUser: !!user,
  userId: user?.id,
  userEmail: user?.email
})

console.log('[Dashboard] BEFORE profile fetch:', {
  queryingUserId: user.id
})

const profile = await getProfileWithServiceRole(user.id)

console.log('[Dashboard] AFTER profile fetch:', {
  profileId: profile?.id,
  profileName: profile?.name,
  profileStatus: profile?.verification_status,
  matchesAuthUser: profile?.id === user?.id,
  CRITICAL_MISMATCH: profile?.name
})
```

**Step 1.3: Test locally**
```bash
# Terminal 1: Run local server
npm run start

# Terminal 2: Test rejected user login
# Navigate to http://localhost:3000/login
# Login as: test.rejected.final@carecollective.test / TestPass123!
# Watch console output
```

**What to look for:**
- Does middleware log appear?
- What user ID does middleware receive?
- What profile data does service role return?
- At what point does the wrong name appear?

---

### Phase 2: Production Log Analysis (30 min)

**Step 2.1: Check Vercel deployment logs**
```bash
# Get recent deployment URL
git log --oneline -1

# Check logs for that deployment
# Go to Vercel dashboard → Deployments → [latest] → Logs
# Filter for: "Middleware", "Dashboard", "Service Role"
```

**Step 2.2: Test diagnostic endpoint**
```bash
# Login as rejected user first in browser
# Then call diagnostic endpoint
curl https://care-collective-preview.vercel.app/api/test-auth \
  -H "Cookie: [copy cookies from browser]"
```

Expected response if working:
```json
{
  "success": true,
  "tests": {
    "serviceRole": {
      "profile": {
        "name": "Test Rejected User",
        "status": "rejected"
      }
    },
    "rlsClient": {
      "profile": {
        "name": "Test Rejected User",
        "status": "rejected"
      }
    },
    "comparison": {
      "mismatch": false
    }
  }
}
```

If mismatch is TRUE → RLS still broken
If serviceRole fails → Service role issue
If both show wrong user → Session issue

---

### Phase 3: Auth Session Inspection (30 min)

**Step 3.1: Inspect browser session**
```
1. Open browser dev tools (F12)
2. Navigate to Application → Cookies
3. Find: sb-kecureoyekeqhrxkmjuh-auth-token
4. Copy value and decode JWT token
5. Check 'sub' claim (user ID)
```

Use JWT decoder: https://jwt.io

**What to verify:**
- Does JWT 'sub' match rejected user ID? (93b0b7b4-7cd3-4ffc-8f02-3777f29da4fb)
- Is JWT expired?
- Are there multiple auth cookies?

**Step 3.2: Check Supabase auth directly**
```typescript
// Add to app/dashboard/page.tsx temporarily
const { data: { user }, error } = await supabase.auth.getUser()
console.log('[Dashboard] RAW AUTH USER:', {
  userId: user?.id,
  userEmail: user?.email,
  userMetadata: user?.user_metadata,
  appMetadata: user?.app_metadata
})
```

---

### Phase 4: Hypothesis Testing (45 min)

Based on Phase 1-3 findings, test specific hypotheses:

**Hypothesis A: Middleware Not Executing**
- Evidence needed: No middleware logs in production
- Test: Add simple log at middleware entry point
- Fix: Check middleware.ts matcher configuration

**Hypothesis B: Service Role Returns Wrong Data**
- Evidence needed: Service role logs show wrong profile
- Test: Query database directly with service role
- Fix: Review service role implementation

**Hypothesis C: Auth Session Mixup**
- Evidence needed: JWT shows different user ID than login
- Test: Clear all cookies, retry login
- Fix: Review auth callback implementation

**Hypothesis D: Caching Issue**
- Evidence needed: Same wrong name every time
- Test: Clear Vercel cache, force revalidation
- Fix: Add cache-control headers to middleware

---

## 📊 Success Criteria

Session is successful when we can answer:
1. ✅ **Where** does the bug occur? (middleware, dashboard, auth callback, or session)
2. ✅ **Why** does dashboard show wrong name?
3. ✅ **What** user ID is being passed at each stage?
4. ✅ **How** to fix it?

---

## 🛠️ Quick Commands Reference

### Local Testing
```bash
# Build and run locally
npm run build && npm run start

# Watch logs in real-time
# (check terminal output while testing)
```

### Database Verification
```bash
# Via Supabase MCP - verify user data
SELECT id, name, verification_status
FROM profiles
WHERE id = '93b0b7b4-7cd3-4ffc-8f02-3777f29da4fb'
```

### Browser Testing
```
1. Open incognito window
2. Navigate to http://localhost:3000/login
3. Open dev tools → Console
4. Login as rejected user
5. Watch console logs
6. Screenshot any errors
```

### Test Credentials
- **Rejected:** test.rejected.final@carecollective.test / TestPass123!
- **Approved:** test.approved.final@carecollective.test / TestPass123!

---

## 📝 Documentation Requirements

After debugging, create:
1. **Root Cause Analysis** - Exact point of failure
2. **Fix Implementation Plan** - Steps to resolve
3. **Test Verification** - How to confirm fix works
4. **Prevention Strategy** - How to avoid similar bugs

---

## 🚨 Critical Reminders

1. **Test locally first** - Faster iteration, better logs
2. **One change at a time** - Don't fix multiple things at once
3. **Verify each step** - Confirm logs appear where expected
4. **Document findings** - Record what works and what doesn't
5. **Screenshot everything** - Visual proof for debugging

---

## 📁 Key Files to Review

- `lib/supabase/admin.ts` - Service role client
- `lib/supabase/middleware-edge.ts` - Middleware auth check (line 172)
- `app/dashboard/page.tsx` - Dashboard profile fetch (line 20-60)
- `app/auth/callback/route.ts` - Post-login redirect
- `middleware.ts` - Middleware configuration

---

## 🎬 Session Start Checklist

Before starting:
- [ ] Read this document completely
- [ ] Review `docs/development/CRITICAL_AUTH_BUG_STATUS.md`
- [ ] Check latest git commit status
- [ ] Verify local environment works (`npm run build`)
- [ ] Have browser dev tools ready
- [ ] Clear all browser cookies/cache

---

## 📈 Expected Outcome

By end of session:
- **Root cause identified** with evidence
- **Fix strategy determined** with confidence level
- **Next steps documented** for implementation
- **Estimated time to fix** provided

If root cause not found after 3 hours → escalate for pair debugging or alternative approach.

---

**Last Updated:** October 6, 2025
**Created By:** Claude Code (Session 388e0e0c)
**Status:** Ready for execution
**Priority:** CRITICAL - Beta blocker
