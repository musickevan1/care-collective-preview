# Next Session: Beta Testing & E2E Validation

## 📋 Session Objective
Complete production deployment of critical bug fix, run comprehensive E2E tests on messaging platform, and validate all beta testing accounts are working.

---

## 🎯 Session Goals (30-45 minutes)

1. **Redeploy to Production** (5 min)
2. **Test All User Logins** (10 min)
3. **E2E Messaging Platform Tests** (15 min)
4. **Validate Help Requests System** (5 min)
5. **Final Beta Readiness Check** (5 min)

---

## 🚀 STEP 1: Redeploy to Production

### Context from Previous Session
- ✅ **Critical Bug Fixed**: Added `SUPABASE_SERVICE_ROLE_KEY` to Vercel production
- ❌ **Not Yet Deployed**: Hit 100 deployments/day limit
- 🔧 **Ready to Deploy**: Just needs `npx vercel --prod`

### Commands to Run
```bash
# Navigate to project
cd /home/evan/Projects/Care-Collective/care-collective-preview

# Redeploy with fixed environment variable
npx vercel --prod

# Expected output:
# ✓ Deployed to production
# Production: https://care-collective-preview.vercel.app

# Verify deployment
npx vercel inspect <deployment-url> --logs
```

### What to Check
- ✅ Deployment succeeds
- ✅ Build completes without errors
- ✅ No console warnings about missing env vars

---

## 🧪 STEP 2: Test All User Logins

### Use Playwright MCP Browser
```
Goal: Verify all 5 test accounts can successfully login
Priority: CRITICAL - This was the bug we fixed
```

### Test Accounts (from `docs/beta-testing/BETA_CREDENTIALS.md`)

#### 1. Alice Martinez (Test User)
- Email: `alice.test@carecollective.com`
- Password: `BetaTest2025!`
- Expected: Redirect to `/dashboard` ✅

#### 2. Bob Johnson (Test User)
- Email: `bob.test@carecollective.com`
- Password: `BetaTest2025!`
- Expected: Redirect to `/dashboard` ✅

#### 3. Carol Davis (Test User)
- Email: `carol.test@carecollective.com`
- Password: `BetaTest2025!`
- Expected: Redirect to `/dashboard` ✅

#### 4. Evan (Dev Admin)
- Email: `evanmusick@admin.org`
- Password: `uBrwz57KH359T&fLeXzn`
- Expected: Redirect to `/dashboard` + admin panel access ✅

#### 5. Maureen (Client Admin)
- Email: `maureentempleman@admin.org`
- Password: `MgSvjZM634SYqsVEKvw@`
- Expected: Redirect to `/dashboard` + admin panel access ✅

### Success Criteria
- [ ] All 5 users can login without `verification_failed` error
- [ ] Users redirect to `/dashboard` (not `/login?error=...`)
- [ ] No console errors during login
- [ ] Session persists (no immediate logout)

---

## 💬 STEP 3: E2E Messaging Platform Tests (PRIORITY #1)

### Test 3A: Load Existing Conversation
```
User: Alice
URL: https://care-collective-preview.vercel.app/messages
Expected: See 1 conversation with Bob about groceries
```

**Validation**:
- [ ] Conversation list loads
- [ ] Shows "Bob Johnson" in conversation list
- [ ] Shows preview: "Hi Alice! I saw your groceries request..."
- [ ] Shows timestamp
- [ ] No PGRST116 errors in console

### Test 3B: Open Conversation & View Messages
```
User: Alice (already logged in)
Action: Click on Bob's conversation
Expected: See 3 messages about groceries help
```

**Validation**:
- [ ] 3 messages display (Bob → Alice → Bob)
- [ ] Message bubbles render correctly
- [ ] Timestamps show
- [ ] Sender names display
- [ ] No "0 rows" database errors

### Test 3C: Send New Message
```
User: Alice
Action: Type "Thanks Bob, testing the messaging system!" and send
Expected: Message appears immediately
```

**Validation**:
- [ ] Message sends successfully
- [ ] Message appears in chat instantly
- [ ] Send button works
- [ ] Input clears after send
- [ ] No errors in console

### Test 3D: Real-Time Delivery (Two Browser Windows)
```
Window 1: Alice (already logged in)
Window 2: Bob (login in incognito/private window)
Action: Alice sends "Real-time test!", Bob should receive it
```

**Validation**:
- [ ] Bob's window auto-updates (WebSocket)
- [ ] Message appears within 1 second
- [ ] Typing indicator shows (if Alice types)
- [ ] Presence status updates
- [ ] No WebSocket connection errors

### Test 3E: Start New Conversation from Help Request
```
User: Carol
Action: Browse help requests, offer help on Alice's "Tech help" request
Expected: New conversation created
```

**Validation**:
- [ ] "Offer Help" button visible on help requests
- [ ] Dialog opens to compose initial message
- [ ] Conversation creates successfully
- [ ] Redirects to `/messages?conversation=<id>`
- [ ] Initial message displays

### Test 3F: Message Virtualization (If Time)
```
Optional: Test with 100+ messages to verify react-window works
```

**Validation**:
- [ ] Messages virtualize (not all in DOM at once)
- [ ] Scrolling smooth
- [ ] No performance issues

---

## 📝 STEP 4: Validate Help Requests System

### Test 4A: Browse Help Requests
```
User: Any test user
URL: https://care-collective-preview.vercel.app/requests
Expected: See 5 help requests
```

**Validation**:
- [ ] 5 requests display (groceries, doctor ride, yard work, tech help, companionship)
- [ ] Filter by category works
- [ ] Filter by urgency works
- [ ] Search works
- [ ] "Offer Help" button visible on each

### Test 4B: Create New Help Request
```
User: Carol
URL: https://care-collective-preview.vercel.app/requests/new
Test: Create "Computer virus removal" request
```

**Validation**:
- [ ] Form renders correctly
- [ ] All fields editable
- [ ] Category dropdown has 7 options
- [ ] Urgency has 3 options
- [ ] Submit creates request
- [ ] Redirects to request detail or list

### Test 4C: Request Detail Modal
```
User: Any user
Action: Click on a help request
Expected: Modal opens with full details
```

**Validation**:
- [ ] Modal opens
- [ ] Shows title, description, category, urgency
- [ ] Shows requester name
- [ ] Shows created date
- [ ] "Offer Help" button works

---

## 🔐 STEP 5: Admin Panel Validation

### Test 5A: Admin Access
```
User: Evan (dev admin)
URL: https://care-collective-preview.vercel.app/admin
Expected: Admin dashboard loads
```

**Validation**:
- [ ] Admin panel accessible
- [ ] Shows user count (5 users)
- [ ] Shows help request count (5+)
- [ ] Shows recent activity
- [ ] No 403 forbidden errors

### Test 5B: Non-Admin Blocked
```
User: Alice (regular user)
URL: https://care-collective-preview.vercel.app/admin
Expected: Redirect to /dashboard with error
```

**Validation**:
- [ ] Access denied (not 500 error)
- [ ] Redirects appropriately
- [ ] No admin data leaked

---

## 📊 STEP 6: Final Beta Readiness Check

### Checklist
- [ ] All 5 users can login ✅
- [ ] Messaging platform functional ✅
- [ ] Real-time WebSocket works ✅
- [ ] Help requests CRUD working ✅
- [ ] Admin panel secured ✅
- [ ] Mobile responsive (test on phone if possible)
- [ ] No critical console errors
- [ ] Performance acceptable (< 3s page loads)

### Update Documentation
If all tests pass:

```bash
# Update BETA_CREDENTIALS.md
echo "✅ READY FOR BETA TESTING - All systems verified" >> docs/beta-testing/BETA_CREDENTIALS.md

# Commit test results
git add docs/beta-testing/
git commit -m "test: Complete E2E validation - Platform ready for beta"
git push origin main
```

---

## 🐛 If Issues Found

### Common Issues & Fixes

**Issue**: Login still fails with `verification_failed`
**Fix**: Check Vercel env vars, verify `SUPABASE_SERVICE_ROLE_KEY` exists

**Issue**: Messages don't load (PGRST116 error)
**Fix**: Verify `NEXT_PUBLIC_MESSAGING_V2_ENABLED=true` in Vercel

**Issue**: WebSocket connection fails
**Fix**: Check Supabase realtime is enabled, verify session tokens

**Issue**: "Offer Help" doesn't create conversation
**Fix**: Check `create_conversation_atomic` RPC function exists

### Debug Commands
```bash
# Check Vercel env vars
npx vercel env ls production

# Check Supabase connection
npm run db:types  # Should connect successfully

# View production logs
npx vercel logs care-collective-preview --prod

# Check deployment status
npx vercel inspect <deployment-url>
```

---

## 📝 Session Output Deliverables

### Create These Documents
1. **E2E Test Results** (`docs/beta-testing/E2E_TEST_RESULTS.md`)
   - Test date/time
   - Each test result (pass/fail)
   - Screenshots if issues found
   - Performance metrics

2. **Beta Readiness Report** (`docs/beta-testing/BETA_READINESS.md`)
   - Overall status (GO/NO-GO)
   - Known issues (if any)
   - Recommended next steps
   - Beta tester instructions

3. **Update BETA_CREDENTIALS.md**
   - Add "✅ VERIFIED" status to accounts that passed login
   - Note any issues found

---

## 🎯 Success Criteria for This Session

### Must Have (Go/No-Go)
- ✅ All 5 users can login
- ✅ Messaging platform sends/receives messages
- ✅ Real-time WebSocket delivery works
- ✅ No critical bugs blocking usage

### Should Have
- ✅ Help requests CRUD functional
- ✅ Admin panel working
- ✅ Mobile responsive
- ✅ Performance acceptable

### Nice to Have
- ✅ E2E tests automated (Playwright scripts)
- ✅ Performance benchmarks documented
- ✅ Accessibility audit complete

---

## 💡 Session Tips

1. **Use Playwright MCP Browser**: Already configured, clean cache
2. **Test in order**: Login → Messaging → Help Requests → Admin
3. **Take screenshots**: Especially if errors occur
4. **Check console**: Look for errors after each action
5. **Test real-time**: Use two browser windows for WebSocket tests
6. **Document everything**: Any issue, no matter how small

---

## 📞 Support Context

**Previous Session Summary**:
- Fixed 100+ TypeScript errors
- Reset production database
- Created 5 test accounts
- Seeded test data (5 requests, 1 conversation, 3 messages)
- Enabled Messaging V2 in Vercel
- Found & fixed critical login bug (env var mismatch)
- **Status**: Awaiting redeploy to pick up env var fix

**Critical Files**:
- `docs/beta-testing/BETA_CREDENTIALS.md` - All login credentials
- `docs/beta-testing/CRITICAL_BUG_FIX.md` - Login bug details
- `docs/beta-testing/BETA_LAUNCH_SUMMARY.md` - What was accomplished

**Known Good State**:
- Database: Clean with test data
- Users: 5 accounts created and approved
- Code: Latest commit `d5a5f9e` (bug fix docs)
- Environment: SUPABASE_SERVICE_ROLE_KEY added (not yet deployed)

---

## 🚀 Ready to Start?

Run this session with:
```
Goal: Complete E2E testing of Care Collective messaging platform after critical bug fix deployment. Test all 5 user logins, validate messaging platform (priority #1), verify help requests system, and provide final beta readiness assessment.

Start by redeploying to production (npx vercel --prod), then use Playwright MCP browser to test:
1. All 5 user logins (critical - was failing before fix)
2. Messaging platform (load conversation, send messages, real-time delivery)
3. Help requests CRUD
4. Admin panel access control

Review docs/beta-testing/NEXT_SESSION_PROMPT.md for full test plan. Create E2E_TEST_RESULTS.md and BETA_READINESS.md with findings.
```

---

**Estimated Duration**: 30-45 minutes
**Priority**: CRITICAL (blocking beta launch)
**Context Available**: Yes (all docs in `docs/beta-testing/`)
