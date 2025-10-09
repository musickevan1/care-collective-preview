# 🔍 Next Session: Create Diagnostic Panel for Auth Bug
**Priority:** 🚨 CRITICAL - Beta Launch Blocker
**Estimated Time:** 30-45 minutes
**Objective:** Create visible diagnostic panel to identify auth bug root cause

---

## 🎯 Quick Context

**The Bug:** Rejected user logs in → accesses dashboard → sees "Test Approved User!" (wrong name)

**What We Know:**
- ✅ Database has correct data
- ✅ RLS policies correct
- ✅ Service role implemented correctly
- ✅ Middleware configured correctly
- ✅ Enhanced logging deployed
- ❌ **Cannot access Vercel runtime logs** (CLI times out)

**What We Need:** Visible debug info in the UI to see exact data flow

---

## 📋 Session Plan: Create Diagnostic Panel

### Step 1: Create Diagnostic Panel Component (10 min)

Create new file: `components/DiagnosticPanel.tsx`

```typescript
import { ReactElement } from 'react'

interface DiagnosticData {
  authUserId: string
  authUserEmail: string
  profileId: string
  profileName: string
  profileStatus: string
  idsMatch: boolean
  timestamp: string
}

/**
 * Diagnostic panel for debugging authentication issues
 * Shows real-time data from auth session and database queries
 *
 * TEMPORARY: Remove after bug is fixed
 */
export function DiagnosticPanel({ data }: { data: DiagnosticData }): ReactElement {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white p-4 text-xs font-mono z-50 shadow-lg border-t-4 border-yellow-400">
      <div className="max-w-7xl mx-auto">
        <div className="font-bold text-yellow-300 mb-2 text-center">
          🚨 DIAGNOSTIC MODE - Auth Debug Panel 🚨
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <div className="font-bold text-yellow-300">Auth User ID:</div>
            <div className="truncate text-xs" title={data.authUserId}>
              {data.authUserId.substring(0, 8)}...
            </div>
          </div>
          <div>
            <div className="font-bold text-yellow-300">Auth Email:</div>
            <div className="truncate">{data.authUserEmail}</div>
          </div>
          <div>
            <div className="font-bold text-yellow-300">Profile ID:</div>
            <div className="truncate text-xs" title={data.profileId}>
              {data.profileId.substring(0, 8)}...
            </div>
          </div>
          <div>
            <div className="font-bold text-yellow-300">Profile Name:</div>
            <div className="font-bold text-lg">{data.profileName}</div>
          </div>
          <div>
            <div className="font-bold text-yellow-300">Status:</div>
            <div className={
              data.profileStatus === 'rejected' ? 'text-red-300 font-bold' :
              data.profileStatus === 'approved' ? 'text-green-300 font-bold' :
              'text-yellow-300'
            }>
              {data.profileStatus.toUpperCase()}
            </div>
          </div>
          <div>
            <div className="font-bold text-yellow-300">IDs Match:</div>
            <div className={data.idsMatch ? 'text-green-300 font-bold' : 'text-red-300 font-bold text-lg'}>
              {data.idsMatch ? '✓ YES' : '✗ NO MISMATCH!'}
            </div>
          </div>
        </div>
        <div className="mt-2 text-center text-yellow-200 text-xs">
          Full Auth ID: {data.authUserId} | Full Profile ID: {data.profileId} | {data.timestamp}
        </div>
      </div>
    </div>
  )
}
```

### Step 2: Integrate into Dashboard (15 min)

Modify: `app/dashboard/page.tsx`

**Find the `getUser()` function and modify:**

```typescript
async function getUser() {
  const supabase = await createClient();

  // ENHANCED DEBUG LOGGING - AUTH CHECK START
  console.log('[Dashboard] AUTH CHECK START:', {
    timestamp: new Date().toISOString(),
    message: 'Beginning authentication check'
  })

  const { data: { user }, error } = await supabase.auth.getUser();

  console.log('[Dashboard] Auth User Retrieved:', {
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    error: error?.message,
    timestamp: new Date().toISOString()
  });

  if (error || !user) {
    console.log('[Dashboard] No user found, returning null');
    return null;
  }

  // ENHANCED DEBUG LOGGING - BEFORE profile fetch
  console.log('[Dashboard] BEFORE profile fetch:', {
    queryingUserId: user.id,
    queryingUserEmail: user.email,
    timestamp: new Date().toISOString()
  })

  // Get user profile with verification status
  // CRITICAL: Use service role to bypass RLS and get guaranteed accurate data
  let profile;
  try {
    profile = await getProfileWithServiceRole(user.id);

    // ENHANCED DEBUG LOGGING - AFTER profile fetch
    console.log('[Dashboard] AFTER profile fetch:', {
      profileId: profile.id,
      profileName: profile.name,
      profileStatus: profile.verification_status,
      matchesAuthUser: profile.id === user.id,
      CRITICAL_MISMATCH: profile.name,
      expectedUserId: user.id,
      actualProfileId: profile.id,
      timestamp: new Date().toISOString()
    });

    // CRITICAL SECURITY: Validate profile ID matches authenticated user ID
    if (profile.id !== user.id) {
      console.error('[Dashboard] SECURITY ALERT: Profile ID mismatch!', {
        authUserId: user.id,
        profileId: profile.id,
        authEmail: user.email,
        profileName: profile.name,
        timestamp: new Date().toISOString()
      });
      // This should never happen with service role - indicates serious bug
      // FORCE LOGOUT to clear the corrupted session
      await supabase.auth.signOut();
      redirect('/login?error=session_mismatch');
    }
  } catch (error) {
    console.error('[Dashboard] Service role profile query failed:', error);
    // Sign out on error - secure by default
    await supabase.auth.signOut();
    redirect('/login?error=verification_failed');
  }

  const userData = {
    id: user.id,
    name: profile?.name || user.email?.split('@')[0] || 'Unknown',
    email: user.email || '',
    isAdmin: profile?.is_admin || false,
    verificationStatus: profile?.verification_status,
    profile,
    // ADD DIAGNOSTIC DATA
    diagnosticData: {
      authUserId: user.id,
      authUserEmail: user.email || '',
      profileId: profile.id,
      profileName: profile.name,
      profileStatus: profile.verification_status,
      idsMatch: profile.id === user.id,
      timestamp: new Date().toISOString()
    }
  };

  // PRODUCTION DEBUG: Final user data
  console.log('[Dashboard] Returning user data:', {
    id: userData.id,
    name: userData.name,
    verificationStatus: userData.verificationStatus,
    diagnosticData: userData.diagnosticData,
    timestamp: new Date().toISOString()
  });

  return userData;
}
```

**Add import at top of file:**

```typescript
import { DiagnosticPanel } from '@/components/DiagnosticPanel'
```

**Modify the component to use diagnostic panel:**

```typescript
export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedSearchParams = await searchParams;
  const userData = await getUser();

  if (!userData) {
    redirect('/login');
  }

  return (
    <PlatformLayout>
      {/* Preview mode notice */}
      <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
        {/* ... existing preview notice ... */}
      </div>

      {/* Dashboard content */}
      {/* ... existing dashboard content ... */}

      {/* DIAGNOSTIC PANEL - Always visible during debugging */}
      <DiagnosticPanel data={userData.diagnosticData} />
    </PlatformLayout>
  )
}
```

### Step 3: Deploy and Test (10 min)

```bash
# 1. Commit changes
git add components/DiagnosticPanel.tsx app/dashboard/page.tsx
git commit -m "🔍 DEBUG: Add diagnostic panel to dashboard

Added visible debug panel showing:
- Auth user ID and email
- Profile ID and name from database
- Verification status
- ID match verification

This will help identify where auth bug occurs without
needing access to Vercel runtime logs.

Panel is visible at bottom of dashboard in red/yellow.

🤖 Generated with Claude Code"

# 2. Push to deploy
git push origin main

# 3. Wait for deployment (30-60 seconds)
# Check: npx vercel inspect https://care-collective-preview.vercel.app
```

### Step 4: Test with Rejected User (5 min)

```bash
# 1. Clear browser cookies completely
# 2. Open incognito window
# 3. Navigate to: https://care-collective-preview.vercel.app/login
# 4. Login as: test.rejected.final@carecollective.test / TestPass123!
# 5. View dashboard - diagnostic panel at bottom
# 6. SCREENSHOT the diagnostic panel
```

### Step 5: Analyze Results and Implement Fix (Variable)

**Scenario A: Auth User ID = 93b0b7b4... (rejected), Profile = Approved User**
```
Auth User ID: 93b0b7b4...
Profile Name: Test Approved User
IDs Match: NO
```
→ **Service role query bug** - Returns wrong profile for given user ID

**Fix:** Debug service role query, verify correct user ID passed

---

**Scenario B: Auth User ID = 54f99d62... (approved), Profile = Approved User**
```
Auth User ID: 54f99d62...
Profile Name: Test Approved User
IDs Match: YES
```
→ **Auth session bug** - Wrong user logged in entirely

**Fix:** Debug login flow, check auth callback, verify Supabase auth

---

**Scenario C: Auth User ID = 93b0b7b4... (rejected), Profile = Rejected User**
```
Auth User ID: 93b0b7b4...
Profile Name: Test Rejected User
Profile Status: REJECTED
IDs Match: YES
```
→ **Middleware not executing** - Correct data but not blocked

**Fix:** Debug middleware execution, check matcher config

---

**Scenario D: IDs match but name wrong in display**
```
IDs Match: YES
Panel shows: Test Rejected User
Dashboard shows: Test Approved User
```
→ **UI rendering bug** - Data correct, display wrong

**Fix:** Check where dashboard gets user name for display

---

## 🎯 Success Criteria

Session is successful when:
1. ✅ Diagnostic panel visible on dashboard
2. ✅ Panel shows all data fields correctly
3. ✅ Screenshot captured showing exact values
4. ✅ Root cause identified from panel data
5. ✅ Fix strategy determined with confidence

---

## 📚 Reference Documentation

- **Session Summary:** `docs/development/AUTH_BUG_DEBUGGING_SESSION_SUMMARY.md`
- **Root Cause Analysis:** `docs/development/AUTH_BUG_ROOT_CAUSE_ANALYSIS.md`
- **Previous Session Handoff:** `NEXT_SESSION_AUTH_BUG_FIX.md`

---

## 🔑 Key Information

### Test Credentials
- **Rejected:** test.rejected.final@carecollective.test / TestPass123!
- **Approved:** test.approved.final@carecollective.test / TestPass123!

### Expected User IDs
- **Rejected:** `93b0b7b4-7cd3-4ffc-8f02-3777f29da4fb`
- **Approved:** `54f99d62-6e6b-47d0-a22b-7aa449a3a76a`

### Current Deployment
- **Commit:** `f06b963` (with middleware entry/exit logs)
- **URL:** https://care-collective-preview.vercel.app

---

## ⚠️ Important Notes

1. **Diagnostic panel is TEMPORARY** - Remove after bug fixed
2. **Panel shows sensitive data** - Only for debugging, not production
3. **Test with fresh cookies** - Clear all cookies before each test
4. **Screenshot is critical** - Capture exact values shown in panel
5. **One test enough** - Panel will show root cause immediately

---

## 🚀 Quick Start Command

```bash
# Start here - read this file first, then:
cat docs/development/AUTH_BUG_DEBUGGING_SESSION_SUMMARY.md

# Then create the diagnostic panel component
# Then modify dashboard to use it
# Then commit, push, deploy, test
```

---

**Ready to Start:** YES ✓
**Next Action:** Create `components/DiagnosticPanel.tsx`
**Estimated Total Time:** 30-45 minutes to root cause identification

---

**Created:** October 8, 2025 - 9:15 PM CDT
**For Session:** Deep Debugging Session #3
**Priority:** CRITICAL - Beta Launch Blocker
**Confidence Level:** HIGH - Diagnostic panel will reveal root cause
