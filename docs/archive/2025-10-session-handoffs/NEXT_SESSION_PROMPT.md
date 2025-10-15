# 🔍 Authentication Bug - Diagnostic Panel Session Prompt

**Copy this entire section into the next Claude Code session:**

---

## Session Objective

Create a visible diagnostic panel on the dashboard to identify the root cause of a critical authentication bug where rejected users bypass all security and see the wrong user's name.

## Quick Context

**The Bug:**
- Login as: `test.rejected.final@carecollective.test` / `TestPass123!`
- Expected: Blocked or redirected to `/access-denied`
- Actual: ❌ Accesses `/dashboard` and shows "Welcome back, Test Approved User!" (wrong name)

**What We've Verified (All Working):**
- ✅ Database has correct data (no corruption)
- ✅ RLS policies correctly configured
- ✅ Service role pattern correctly implemented
- ✅ Middleware configured to protect `/dashboard`
- ✅ Enhanced logging deployed (but can't access Vercel runtime logs)

**Current Blocker:**
- Cannot access Vercel runtime logs via CLI (times out)
- Need visible UI diagnostic panel to see data flow

**Current Status:**
- Commit: `f06b963` (with middleware entry/exit logs)
- Deployment: `dpl_2KWH2FqVxnXX3RYWQC4Gxuwn1Pzw`
- URL: https://care-collective-preview.vercel.app

## Your Task

Follow the step-by-step plan in `NEXT_SESSION_DIAGNOSTIC_PANEL.md` to:

1. **Create diagnostic panel component** (`components/DiagnosticPanel.tsx`)
   - Shows auth user ID, email, profile ID, name, status
   - Visible red/yellow bar at bottom of dashboard
   - Shows ID match/mismatch

2. **Integrate into dashboard** (`app/dashboard/page.tsx`)
   - Collect diagnostic data in `getUser()` function
   - Pass to `<DiagnosticPanel>` component
   - Always visible during debugging

3. **Deploy and test**
   - Commit changes
   - Push to deploy
   - Login as rejected user
   - Screenshot diagnostic panel

4. **Analyze and fix**
   - Panel will show exactly where bug occurs
   - Implement targeted fix based on findings
   - Verify fix with all test scenarios

## Key Documentation to Read

**Primary Guide (Read First):**
```
NEXT_SESSION_DIAGNOSTIC_PANEL.md
```
This has complete step-by-step instructions with all code examples.

**Full Session Context:**
```
docs/development/AUTH_BUG_DEBUGGING_SESSION_SUMMARY.md
```
This has everything we verified and all hypotheses.

**Additional Context (If Needed):**
```
docs/development/AUTH_BUG_ROOT_CAUSE_ANALYSIS.md
NEXT_SESSION_AUTH_BUG_FIX.md
```

## Test Credentials

**Rejected User (to test with):**
- Email: `test.rejected.final@carecollective.test`
- Password: `TestPass123!`
- Expected ID: `93b0b7b4-7cd3-4ffc-8f02-3777f29da4fb`
- Expected Name: "Test Rejected User"
- Expected Status: "rejected"

**Approved User (for comparison):**
- Email: `test.approved.final@carecollective.test`
- Password: `TestPass123!`
- ID: `54f99d62-6e6b-47d0-a22b-7aa449a3a76a`
- Name: "Test Approved User"

## Expected Outcome

The diagnostic panel will show one of these scenarios:

**Scenario A: Service Role Bug**
```
Auth User ID: 93b0b7b4... (rejected user)
Profile Name: Test Approved User
IDs Match: NO ✗
```
→ Service role query returns wrong profile

**Scenario B: Auth Session Bug**
```
Auth User ID: 54f99d62... (approved user ID!)
Profile Name: Test Approved User
IDs Match: YES ✓
```
→ Wrong user logged in entirely

**Scenario C: Middleware Not Executing**
```
Auth User ID: 93b0b7b4... (rejected user)
Profile Name: Test Rejected User
Status: REJECTED
IDs Match: YES ✓
```
→ Correct data but middleware didn't block access

**Scenario D: UI Rendering Bug**
```
Panel shows: Test Rejected User (correct)
Dashboard header shows: Test Approved User (wrong)
```
→ Data correct, display wrong

Each scenario has a specific fix strategy detailed in `NEXT_SESSION_DIAGNOSTIC_PANEL.md`.

## Success Criteria

✅ Diagnostic panel created and deployed
✅ Panel visible on dashboard (red/yellow bar at bottom)
✅ Tested with rejected user login
✅ Screenshot captured showing exact values
✅ Root cause identified from panel data
✅ Fix implemented and verified

## Estimated Time

- Create panel: 10 min
- Integrate: 15 min
- Deploy/test: 10 min
- Analyze/fix: Variable (depends on root cause)
- **Total: 30-60 minutes**

## Priority

🚨 **CRITICAL** - Beta Launch Blocker
- Rejected users have full platform access
- Data leakage (users see wrong names)
- Platform fundamentally unsafe
- **ABSOLUTE NO-GO for beta launch**

## Quick Start

1. Read `NEXT_SESSION_DIAGNOSTIC_PANEL.md` (has all the code)
2. Create `components/DiagnosticPanel.tsx`
3. Modify `app/dashboard/page.tsx`
4. Commit, push, deploy
5. Test with rejected user
6. Screenshot diagnostic panel
7. Analyze and fix

---

**Ready to start? Begin with:**

```bash
cat NEXT_SESSION_DIAGNOSTIC_PANEL.md
```

Then follow the step-by-step instructions in that file. Good luck! 🚀

---

**Created:** October 8, 2025 - 9:15 PM CDT
**For:** Deep Debugging Session #3
**Session Type:** Diagnostic Panel Implementation
