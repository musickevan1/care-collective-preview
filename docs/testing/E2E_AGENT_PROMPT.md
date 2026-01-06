# E2E Testing Agent Prompt

**Purpose:** Instructions for an AI agent to conduct comprehensive end-to-end testing of the Care Collective platform.

---

## Agent Instructions

You are conducting a comprehensive E2E test of the Care Collective mutual aid platform. Your goal is to systematically explore the site, identify issues, take screenshots, and generate a detailed report.

### Your Mission

1. **Explore ALL pages** of the site (public and authenticated)
2. **Test core user flows** (help requests, messaging)
3. **Document issues** found (functionality, UI/UX, accessibility, mobile)
4. **Take screenshots** for evidence
5. **Generate a markdown report** with findings
6. **Create vulcan-todo tasks** for each issue in the `care-collective` project

---

## CRITICAL SAFETY RULES

### NEVER DO (Forbidden Actions)

```
ADMIN PANEL - OBSERVATION ONLY:
- DO NOT click approve/reject on any applications
- DO NOT modify user accounts or permissions  
- DO NOT delete any data
- DO NOT use bulk operations
- DO NOT modify CMS content
- DO NOT process moderation queue items
- ONLY take screenshots of admin pages

USER DATA:
- DO NOT interact with real user help requests
- DO NOT send messages to real users
- DO NOT modify real profiles

SYSTEM:
- DO NOT trigger password resets for real accounts
- DO NOT submit bug reports unless testing with test data
```

### ALWAYS DO (Required Actions)

```
- Prefix ALL test data with "[E2E-TEST]"
- Take screenshots of every page (desktop + mobile)
- Log all issues found immediately
- Clean up ALL test data at end of session
- Verify cleanup by searching for "[E2E-TEST]"
```

---

## Test Execution Steps

### Step 1: Environment Setup

```bash
# Navigate to project
cd /home/evan/care-collective-preview

# Ensure Playwright is installed
npx playwright install chromium

# Set environment variables (user will provide credentials)
export E2E_BASE_URL="https://www.swmocarecollective.org"
export E2E_ADMIN_EMAIL="<admin-email>"
export E2E_ADMIN_PASSWORD="<admin-password>"
export E2E_MEMBER_EMAIL="<member-email>"  
export E2E_MEMBER_PASSWORD="<member-password>"
```

### Step 2: Run Automated Tests

```bash
# Run the comprehensive site audit
npx playwright test comprehensive-site-audit.spec.ts --reporter=list

# Or run with headed browser to observe
npx playwright test comprehensive-site-audit.spec.ts --headed
```

### Step 3: Manual Exploration (If Needed)

If automated tests aren't sufficient, use Playwright's codegen for interactive testing:

```bash
npx playwright codegen https://www.swmocarecollective.org
```

### Step 4: Review Results

After tests complete:
1. Check `docs/reports/e2e-testing-report-YYYY-MM-DD.md` for the report
2. Check `docs/reports/screenshots/e2e-YYYY-MM-DD/` for screenshots
3. Check `docs/reports/e2e-issues-YYYY-MM-DD.json` for structured issue data

### Step 5: Create Vulcan-Todo Tasks

For each issue in the JSON file, create a task:

```bash
# Example for each issue:
vulcan-todo_create_task(
  title="Fix: {issue title}",
  project="care-collective",
  priority="{critical→urgent, high→high, medium→medium, low→low}",
  tags=["e2e-testing", "e2e-2026-01-06", "{category}", "{page}"],
  description="{issue description} - Screenshot: {screenshot path}"
)
```

---

## Pages to Test

### Public Pages (No Auth)

| Page | URL | Priority |
|------|-----|----------|
| Landing | `/` | HIGH |
| About | `/about` | MEDIUM |
| Resources | `/resources` | HIGH |
| Contact | `/contact` | MEDIUM |
| Login | `/login` | HIGH |
| Signup | `/signup` | HIGH |
| Privacy Policy | `/privacy-policy` | LOW |
| Terms | `/terms` | LOW |
| Waitlist | `/waitlist` | LOW |

### Authenticated Pages (Requires Login)

| Page | URL | Priority |
|------|-----|----------|
| Dashboard | `/dashboard` | HIGH |
| Help Requests | `/requests` | HIGH |
| Create Request | `/requests/new` | HIGH |
| My Requests | `/requests/my-requests` | HIGH |
| Messages | `/messages` | HIGH |
| Profile | `/profile` | MEDIUM |
| Privacy Settings | `/privacy` | MEDIUM |

### Admin Pages (Screenshot Only)

| Page | URL | Action |
|------|-----|--------|
| Admin Dashboard | `/admin` | SCREENSHOT ONLY |
| Applications | `/admin/applications` | SCREENSHOT ONLY |
| Users | `/admin/users` | SCREENSHOT ONLY |
| Help Requests | `/admin/help-requests` | SCREENSHOT ONLY |
| CMS | `/admin/cms` | SCREENSHOT ONLY |
| Moderation | `/admin/messaging/moderation` | SCREENSHOT ONLY |
| Reports | `/admin/reports` | SCREENSHOT ONLY |
| Performance | `/admin/performance` | SCREENSHOT ONLY |
| Privacy | `/admin/privacy` | SCREENSHOT ONLY |

---

## What to Check on Each Page

### Visual/UI Checks
- [ ] Page loads without errors
- [ ] Layout is correct (desktop and mobile)
- [ ] No horizontal scrolling on mobile
- [ ] Text is readable (proper sizing, contrast)
- [ ] Images load correctly
- [ ] Forms display properly
- [ ] Buttons/links are visible and clickable

### Functionality Checks
- [ ] Navigation works
- [ ] Links go to correct destinations
- [ ] Forms validate correctly
- [ ] Error messages display appropriately
- [ ] Loading states show when expected
- [ ] Empty states display when no data

### Accessibility Checks
- [ ] Images have alt text
- [ ] Form inputs have labels
- [ ] Touch targets are 44px+ on mobile
- [ ] Color contrast is sufficient
- [ ] Focus states are visible

### Console Checks
- [ ] No JavaScript errors
- [ ] No failed network requests (except expected 404s)
- [ ] No security warnings

---

## Issue Classification

When logging issues, use these categories:

### Severity
- **critical**: Blocks core functionality (login broken, can't create requests)
- **high**: Major feature broken (messaging fails, forms don't submit)
- **medium**: Feature partially broken (styling issues, missing validation)
- **low**: Minor issues (typos, alignment, nice-to-haves)

### Categories
- `functionality` - Feature doesn't work
- `ui-ux` - Visual or usability problem
- `accessibility` - WCAG compliance issue
- `performance` - Slow loading, lag
- `content` - Missing/incorrect text
- `mobile` - Responsive design issue
- `security` - Potential vulnerability

---

## Report Template

After testing, the report should include:

```markdown
# E2E Testing Report - {DATE}

## Summary
- Total Pages Tested: X
- Issues Found: X (Critical: X, High: X, Medium: X, Low: X)

## Critical Issues
(List each with full details)

## High Priority Issues  
(List each with full details)

## Medium/Low Priority Issues
(Table format)

## Screenshots
(List all screenshots taken)

## Recommendations
(Prioritized list of fixes)
```

---

## Cleanup Procedure

Before ending the session:

1. Delete any test help requests with `[E2E-TEST]` prefix
2. Delete any test conversations created
3. Clear test notifications
4. Verify cleanup: Search for `[E2E-TEST]` should return 0 results

---

## Example Session Output

```
Starting E2E Testing Session
============================
Target: https://www.swmocarecollective.org
Date: 2026-01-06

Testing Public Pages...
  Landing Page (Desktop): PASS
    Screenshot: landing-desktop-loaded-1704567890.png
  Landing Page (Mobile): PASS
    Screenshot: landing-mobile-loaded-1704567891.png
    [MEDIUM] 3 touch targets below 44px
  ...

Testing Authenticated Pages...
  Login: SUCCESS
  Dashboard: PASS
    Screenshot: dashboard-desktop-loaded-1704567900.png
  ...

Testing Admin Pages (Observation Only)...
  Admin Dashboard: SCREENSHOT ONLY
    Screenshot: admin-dashboard-desktop-1704567910.png
  ...

Session Complete
================
Total Issues: 12
  Critical: 0
  High: 2  
  Medium: 7
  Low: 3

Report saved: docs/reports/e2e-testing-report-2026-01-06.md
Screenshots: docs/reports/screenshots/e2e-2026-01-06/
Issues JSON: docs/reports/e2e-issues-2026-01-06.json

Creating vulcan-todo tasks...
  Created: E2E-2026-01-06-001 → vulcan-todo task abc123
  Created: E2E-2026-01-06-002 → vulcan-todo task def456
  ...

Session ended. All test data cleaned up.
```

---

## Credentials Required

The agent will need these credentials to run tests:

1. **Admin Account**: For observing admin pages (no actions taken)
2. **Member Account**: For testing authenticated member features

Provide credentials when invoking the agent:
```
E2E_ADMIN_EMAIL=<email>
E2E_ADMIN_PASSWORD=<password>
E2E_MEMBER_EMAIL=<email>
E2E_MEMBER_PASSWORD=<password>
```

---

*Document Version: 1.0 | Created: January 6, 2026*
