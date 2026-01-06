# Sprint 1: Manual Verifications - Agent Prompt

**Sprint:** 1 of 5  
**Focus:** Manual Verifications + Login Confirmation  
**Estimated Time:** 2 hours  
**Date:** January 6, 2026  

---

## Context

You are implementing Sprint 1 of the Care Collective post-E2E testing iteration. This sprint focuses on manually verifying that previous client feedback changes were implemented correctly.

**Reference Documents:**
- `docs/development/ITERATION_PLAN_2026-01-06.md` - Full iteration plan
- `docs/reports/e2e-testing-report-2026-01-06.md` - E2E testing results
- `docs/client/CLIENT_FEEDBACK_2026-01-01.md` - Original client feedback

---

## Tasks

### Task 1.1: Verify Dashboard Card Headings
**Vulcan-Todo ID:** `40220585-4f3a-4ac6-a04d-89e9a8299a13`

**Steps:**
1. Read `app/dashboard/page.tsx`
2. Verify card headings use `text-xl md:text-2xl font-bold`
3. Run Playwright to capture screenshot of dashboard
4. If not correct, fix the styling
5. Mark task complete

**Expected Code Pattern:**
```tsx
<h2 className="text-xl md:text-2xl font-bold">Card Title</h2>
```

**Screenshot Command:**
```bash
E2E_ADMIN_EMAIL="evanmusick.dev@gmail.com" \
E2E_ADMIN_PASSWORD="TempAdminPass123!" \
npx playwright test --grep "Dashboard" --project="Desktop Chrome"
```

---

### Task 1.2: Verify Offer Help Dialog
**Vulcan-Todo ID:** `5521d23a-425c-49b8-87d1-85598150a490`

**Steps:**
1. Read `components/help-requests/HelpRequestCardWithMessaging.tsx`
2. Find the "Offer Help" dialog/modal
3. Verify text uses `text-lg` sizing
4. Verify placeholder text is descriptive
5. Take screenshot if possible, otherwise document findings
6. Mark task complete

**Expected Code Pattern:**
```tsx
<textarea 
  className="text-lg ..."
  placeholder="Describe how you can help with this request..."
/>
```

---

### Task 1.3: Verify Admin Panel Member Info
**Vulcan-Todo ID:** `d71ace90-2486-4cb5-a814-9212bd0746b0`

**Steps:**
1. Read `app/admin/applications/page.tsx`
2. Verify pending applications display:
   - Phone number (or "Not provided")
   - Caregiving situation (or "Not provided")
   - Email verification badge (green verified / yellow unverified)
3. Run Playwright to capture admin applications screenshot
4. Mark task complete

**Screenshot Command:**
```bash
E2E_ADMIN_EMAIL="evanmusick.dev@gmail.com" \
E2E_ADMIN_PASSWORD="TempAdminPass123!" \
npx playwright test --grep "Applications" --project="Desktop Chrome"
```

---

### Task 1.4: Confirm Login Redirects to Dashboard
**Status:** Already verified via code review

**Documentation Task:**
1. Read the login redirect logic in:
   - `app/auth/callback/route.ts`
   - `app/login/page.tsx`
   - `app/api/auth/login/route.ts`
2. Confirm approved users redirect to `/dashboard`
3. Document this in a brief summary for client

---

## Completion Criteria

- [ ] Dashboard card headings verified (screenshot taken)
- [ ] Offer Help dialog verified (text-lg, good placeholder)
- [ ] Admin applications verified (phone, caregiving, email badge)
- [ ] Login redirect confirmed (documentation note)
- [ ] All 3 verification tasks marked complete in vulcan-todo
- [ ] No code changes needed OR fixes applied

---

## After Sprint 1

**If all verifications pass (no code changes needed):**
1. Mark all tasks complete in vulcan-todo
2. Report summary to user
3. Proceed to Sprint 2

**If code changes are needed:**
1. Make minimal fixes
2. Run E2E test on affected pages
3. Commit changes with message: `fix: [description] - Sprint 1 verification`
4. Mark tasks complete
5. Proceed to Sprint 2

---

## Vulcan-Todo Commands

```bash
# Mark task complete
vulcan-todo_complete_task(id="40220585-4f3a-4ac6-a04d-89e9a8299a13")
vulcan-todo_complete_task(id="5521d23a-425c-49b8-87d1-85598150a490")
vulcan-todo_complete_task(id="d71ace90-2486-4cb5-a814-9212bd0746b0")
```

---

## Credentials

```
E2E_ADMIN_EMAIL=evanmusick.dev@gmail.com
E2E_ADMIN_PASSWORD=TempAdminPass123!
```

---

*Sprint 1 of 5 | Care Collective Iteration January 2026*
