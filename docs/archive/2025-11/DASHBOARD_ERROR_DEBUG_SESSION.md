# Dashboard Error - Debug Session Prompt

**Date Created**: November 2, 2025
**Priority**: HIGH
**Status**: Ready for Investigation

---

## 🚨 Issue Summary

The dashboard page at https://care-collective-preview.vercel.app/dashboard is showing an error screen after deploying the beta testing framework (commit 5c37a20).

**What Changed**: Added beta testing features including:
- BetaWelcomeModal component
- BugReportButton component
- BetaTesterWrapper component
- Modified `app/dashboard/page.tsx`
- Modified `app/layout.tsx`

**Error Location**: Dashboard page (`/dashboard`)
**Deployment URL**: https://care-collective-preview-divv361pz-musickevan1s-projects.vercel.app

---

## 🔍 Investigation Steps

### Step 1: Check Vercel Deployment Logs
```bash
# Get the latest deployment logs
npx vercel logs https://care-collective-preview-divv361pz-musickevan1s-projects.vercel.app

# Or inspect the deployment
npx vercel inspect https://care-collective-preview-divv361pz-musickevan1s-projects.vercel.app --logs
```

**Look for**:
- Runtime errors
- Component rendering errors
- Import/module resolution errors
- Database connection errors

### Step 2: Check Browser Console

**Test URL**: https://care-collective-preview.vercel.app/dashboard

**Look for**:
- JavaScript errors
- React errors
- Network errors (API calls failing)
- Component errors (BetaWelcomeModal, BetaTesterWrapper)

### Step 3: Review Recent Changes

**Files Modified in Last Commit** (5c37a20):
- `app/dashboard/page.tsx` - Added `<BetaTesterWrapper showWelcomeModal={true} />`
- `app/layout.tsx` - Added `<BetaTesterWrapper />` in footer area
- `components/beta/BetaTesterWrapper.tsx` - New component
- `components/beta/BetaWelcomeModal.tsx` - New component
- `components/beta/BugReportButton.tsx` - New component

**Check for**:
- Import errors
- Component nesting issues
- Props mismatches
- Client/Server component conflicts

### Step 4: Test Locally

```bash
# Build and test locally first
npm run build
npm run dev

# Navigate to http://localhost:3000/dashboard
# Check if error reproduces locally
```

### Step 5: Check Database Connection

The beta components query the database for `is_beta_tester` flag:

```sql
-- Verify the column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'is_beta_tester';

-- Check if any users have the flag
SELECT id, name, is_beta_tester
FROM profiles
WHERE is_beta_tester = true;
```

---

## 🐛 Likely Causes

### 1. Client/Server Component Conflict

**Issue**: BetaTesterWrapper is a client component (`'use client'`) but might be used incorrectly in the server-rendered dashboard.

**Location**: `app/dashboard/page.tsx:297`
```tsx
<BetaTesterWrapper showWelcomeModal={true} />
```

**Check**: Is this causing hydration errors?

### 2. Import Path Issues

**Check these imports**:
- `components/beta/BetaTesterWrapper.tsx`
- `components/beta/BetaWelcomeModal.tsx`
- `components/beta/BugReportButton.tsx`

**Verify**:
- All imports use correct paths (`@/components/beta/...`)
- All components are exported correctly
- No circular dependencies

### 3. Missing Dependencies

**BugReportButton uses**:
- `lucide-react` icons: `Bug`, `X`, `Send`
- `@/components/ui/button`

**Check**: Are all dependencies available?

### 4. Database Query Errors

**BetaTesterWrapper queries**:
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('is_beta_tester')
  .eq('id', user.id)
  .single();
```

**Check**:
- Is the column accessible?
- Are RLS policies blocking the query?
- Is the Supabase client initialized correctly?

### 5. Duplicate BetaTesterWrapper

**Issue**: Component appears in TWO places:
1. `app/layout.tsx:70` - In footer (without modal)
2. `app/dashboard/page.tsx:297` - In dashboard (with modal)

**Potential Conflict**: Two instances of the same component checking beta status?

---

## 🛠️ Quick Fixes to Try

### Fix 1: Remove Duplicate from Layout

If BetaTesterWrapper in layout.tsx conflicts:

```typescript
// app/layout.tsx - Remove or comment out line 70
{/* Beta Testing Bug Report Button (only shown to beta testers) */}
{/* <BetaTesterWrapper /> */}
```

### Fix 2: Wrap in ErrorBoundary

Add error boundary around beta components:

```typescript
// app/dashboard/page.tsx
try {
  <BetaTesterWrapper showWelcomeModal={true} />
} catch (error) {
  console.error('Beta wrapper error:', error);
  // Render nothing on error
}
```

### Fix 3: Conditional Rendering

Only render if database is accessible:

```typescript
// components/beta/BetaTesterWrapper.tsx
if (!profile) {
  return null; // Fail gracefully
}
```

### Fix 4: Check Environment Variables

Ensure Supabase credentials are set in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 📝 Debugging Commands

### Check Build Errors
```bash
npm run build 2>&1 | grep -A 10 "Error:"
```

### Check TypeScript Errors
```bash
npm run type-check 2>&1 | grep "components/beta"
```

### Test Specific Component
```bash
# Create a minimal test page
# app/test-beta/page.tsx
import { BetaTesterWrapper } from '@/components/beta/BetaTesterWrapper';

export default function TestPage() {
  return <BetaTesterWrapper showWelcomeModal={false} />;
}
```

### Check Supabase Connection
```bash
# Via MCP
mcp__supabase__execute_sql "SELECT current_user, current_database();"
```

---

## 🎯 Expected Outcome

After fixing the issue:
1. ✅ Dashboard loads without errors
2. ✅ Beta welcome modal appears for beta testers
3. ✅ Bug report button shows for beta testers
4. ✅ Non-beta users see normal dashboard
5. ✅ No console errors
6. ✅ Components render correctly

---

## 📋 Files to Review

**Priority 1 (Most Likely):**
1. `app/dashboard/page.tsx` - Where BetaTesterWrapper is added
2. `components/beta/BetaTesterWrapper.tsx` - Main wrapper component
3. `components/beta/BetaWelcomeModal.tsx` - Modal component

**Priority 2 (Check if needed):**
4. `components/beta/BugReportButton.tsx` - Button component
5. `app/layout.tsx` - Global layout with duplicate wrapper
6. `app/api/beta/bug-report/route.ts` - API endpoint

---

## 🔄 Rollback Plan (If Needed)

If the issue is critical and can't be fixed quickly:

```bash
# Revert to previous commit
git revert 5c37a20

# Or reset to before beta framework
git reset --hard 3163f38

# Push to redeploy
git push origin main --force
```

**Note**: This will remove all beta testing features. Only use if absolutely necessary.

---

## 📊 Context Information

**Last Working Commit**: 3163f38
**Breaking Commit**: 5c37a20
**Deployment Time**: ~2 minutes ago
**Affected URL**: https://care-collective-preview.vercel.app/dashboard
**User Impact**: All users trying to access dashboard

**Beta Features Added**:
- Bug report button (floating)
- Beta welcome modal
- Beta tester flag in database
- Bug reports table
- 7 documentation files

---

## ✅ Resolution Checklist

After fixing:
- [ ] Dashboard loads without errors
- [ ] Verified on production URL
- [ ] Tested with beta tester account
- [ ] Tested with non-beta account
- [ ] No console errors
- [ ] Modal appears correctly for beta testers
- [ ] Bug button visible for beta testers
- [ ] Bug button hidden for non-beta users
- [ ] Bug report submission works
- [ ] Deployed fix to production
- [ ] Updated this document with solution

---

## 💡 Solution Notes

**After debugging, document the solution here:**

**Issue Found**:
[Describe what was wrong]

**Root Cause**:
[Explain why it happened]

**Fix Applied**:
[Describe the fix]

**Files Changed**:
[List files modified]

**Commit**:
[Commit hash of the fix]

**Verified**:
[How you tested the fix]

---

**Last Updated**: November 2, 2025
**Status**: Awaiting Investigation
**Priority**: HIGH - Dashboard is broken in production

*Start next session with: "I need to debug the dashboard error. Read `docs/DASHBOARD_ERROR_DEBUG_SESSION.md` and investigate the issue."*
