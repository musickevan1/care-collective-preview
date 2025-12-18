# Next Session Prompt - React Error #419 Continuation

**Copy this prompt to start the next session:**

---

## Context

I'm continuing to fix React Error #419 on production request detail pages for Care Collective.

**Previous Session Summary:**
- Fixed React Error #419 caused by module-level singleton instantiation
- Applied 4 commits (5c17c95, 3836a2c, 8e9d961, 6550bcb)
- Latest commit: **6550bcb** deployed ~5 minutes ago
- See `REACT_419_FIX_SUMMARY.md` for full details

## Current Status

**Production URL:** https://care-collective-preview.vercel.app/requests/2488f745-dc45-45e9-9978-9c4614975fad

**Latest Fixes Applied:**
1. ✅ Lazy-loaded MessagingClient (lib/messaging/client.ts)
2. ✅ Removed privacyEventTracker & contactEncryption singleton exports
3. ✅ Removed userPrivacyControls singleton export
4. ✅ Fixed helper functions to use .getInstance() directly

**Deployment:** Commit 6550bcb should be deployed by now

## What I Need You To Do

### Step 1: Verify Latest Deployment (2 min)
```bash
# Check if 6550bcb is deployed
npx vercel ls --yes | head -6
git log --oneline -5
```

### Step 2: Test with Playwright (1 min)
```bash
npx playwright codegen https://care-collective-preview.vercel.app/requests/2488f745-dc45-45e9-9978-9c4614975fad
```

**Check for:**
- ❌ "Something Went Wrong" error page (BAD)
- ❌ Console: "Minified React error #419" (BAD)
- ✅ Request detail page loads correctly (GOOD)

### Step 3A: If Page WORKS ✅
1. Test a few more request URLs to confirm
2. Mark issue as RESOLVED
3. Update PROJECT_STATUS.md
4. Provide summary to user

### Step 3B: If Page STILL FAILS ❌
**There's another module-level singleton. Find it:**

```bash
# Search for remaining singletons
grep -r "export const.*getInstance()" lib/ app/ --include="*.ts"
grep -r "export const.*= new " lib/ app/ --include="*.ts" | grep -v test | grep -v node_modules

# Check which are actually being imported by the failing page
grep -r "import.*from.*lib/" app/requests/\[id\]/page.tsx
```

**Then apply the same fix:**
1. Comment out the singleton export
2. Update references to use `.getInstance()` directly
3. Test again

## Quick Reference

**Test URL:** https://care-collective-preview.vercel.app/requests/2488f745-dc45-45e9-9978-9c4614975fad

**Check deployments:**
```bash
npx vercel ls --yes | head -10
```

**Fix pattern:**
```typescript
// ❌ REMOVE THIS:
export const singleton = Service.getInstance();

// ✅ USE THIS INSTEAD:
// Callers use: Service.getInstance().method()
```

## Success Criteria

- Request detail page loads WITHOUT React Error #419
- No "Something Went Wrong" error boundary
- Page displays request details correctly
- Ready for Thursday client demo

---

**Start here:** Check deployment status and test with Playwright
