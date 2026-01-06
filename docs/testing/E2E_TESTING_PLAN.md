# Care Collective E2E Testing Plan

**Date Created:** January 6, 2026  
**Target URL:** https://www.swmocarecollective.org  
**Testing Framework:** Playwright  
**Report Output:** `docs/reports/e2e-testing-report-YYYY-MM-DD.md`

---

## Overview

This document outlines the comprehensive end-to-end testing strategy for the Care Collective platform. The testing agent will systematically explore all pages, test core functionality, and document issues for remediation.

## Test Environment Setup

### Test Accounts (Created via Supabase)

| Role | Email | Purpose |
|------|-------|---------|
| Admin | `e2e-admin@test.swmocarecollective.org` | Admin panel access (observation only) |
| Member | `e2e-member@test.swmocarecollective.org` | Full member journey testing |
| Helper | `e2e-helper@test.swmocarecollective.org` | Testing help offer flow |

### Test Data Lifecycle

1. **Setup Phase**: Create test accounts and seed data via Supabase
2. **Testing Phase**: Execute all test scenarios
3. **Cleanup Phase**: Remove all test data created during session
4. **Report Phase**: Generate markdown report with findings

---

## Safety Guardrails (CRITICAL)

### NEVER DO - Forbidden Actions

1. **Admin Panel**:
   - DO NOT approve/reject real membership applications
   - DO NOT modify user accounts or permissions
   - DO NOT delete any data
   - DO NOT use bulk operations
   - DO NOT modify CMS content
   - DO NOT process moderation queue items
   - ONLY observe and screenshot admin pages

2. **User Data**:
   - DO NOT interact with real user help requests (only test data)
   - DO NOT send messages to real users
   - DO NOT modify real profiles

3. **System**:
   - DO NOT trigger password resets for real accounts
   - DO NOT submit bug reports (unless testing the feature with test data)

### ALWAYS DO - Required Practices

1. **Prefix all test data** with `[E2E-TEST]` in titles/descriptions
2. **Use test email domain**: `@test.swmocarecollective.org`
3. **Screenshot before any action** that modifies data
4. **Log all actions** in the test report
5. **Clean up ALL test data** at end of session
6. **Verify cleanup** by searching for test data markers

---

## Test Categories

### Category 1: Public Pages (No Auth Required)

| Page | URL | Tests |
|------|-----|-------|
| Landing | `/` | Layout, typography, links, mobile responsiveness |
| About | `/about` | Content, images, navigation |
| Resources | `/resources` | Cards, links, crisis info, centering |
| Contact | `/contact` | Form validation, submission |
| Login | `/login` | Form, validation, error states |
| Signup | `/signup` | Form, validation, password requirements |
| Privacy Policy | `/privacy-policy` | Content, readability |
| Terms | `/terms` | Content, readability |
| Waitlist | `/waitlist` | Form functionality |

### Category 2: Authenticated Member Pages

| Page | URL | Tests |
|------|-----|-------|
| Dashboard | `/dashboard` | Cards, stats, navigation, quick actions |
| Help Requests List | `/requests` | Filtering, sorting, pagination, cards |
| Create Request | `/requests/new` | Form validation, categories, urgency |
| My Requests | `/requests/my-requests` | User's own requests, status |
| Request Detail | `/requests/[id]` | Full details, offer help button |
| Messages | `/messages` | Conversation list, message display |
| Profile | `/profile` | Edit profile, settings |
| Privacy Settings | `/privacy` | Data controls, preferences |

### Category 3: Core User Flows

#### Flow 1: Help Request Creation
1. Login as member
2. Navigate to create request
3. Fill form with test data
4. Submit and verify creation
5. Verify appears in listings
6. Clean up: delete test request

#### Flow 2: Offer Help (Messaging)
1. Login as helper
2. Browse open requests
3. Click "Offer Help" on test request
4. Send message via dialog
5. Verify conversation created
6. Verify notifications
7. Clean up: delete test conversation

#### Flow 3: Message Exchange
1. Login as requester
2. View incoming message
3. Reply to helper
4. Verify real-time updates (if applicable)
5. Test message moderation triggers (safe content only)

### Category 4: Admin Pages (Observation Only)

| Page | URL | Action |
|------|-----|--------|
| Admin Dashboard | `/admin` | Screenshot only |
| Applications | `/admin/applications` | Screenshot pending list |
| Users | `/admin/users` | Screenshot user list |
| Help Requests | `/admin/help-requests` | Screenshot request management |
| CMS | `/admin/cms` | Screenshot content management |
| Moderation | `/admin/messaging/moderation` | Screenshot queue |
| Reports | `/admin/reports` | Screenshot analytics |
| Performance | `/admin/performance` | Screenshot metrics |
| Privacy Dashboard | `/admin/privacy` | Screenshot privacy controls |

---

## Issue Classification

### Severity Levels

| Level | Description | Examples |
|-------|-------------|----------|
| **Critical** | Blocks core functionality | Login broken, can't create requests |
| **High** | Major feature broken | Messaging fails, forms don't submit |
| **Medium** | Feature partially broken | Styling issues, missing validation |
| **Low** | Minor issues | Typos, alignment, nice-to-haves |

### Issue Categories

- **Functionality**: Feature doesn't work as expected
- **UI/UX**: Visual or usability problems
- **Accessibility**: WCAG compliance issues
- **Performance**: Slow loading, lag
- **Content**: Missing/incorrect text
- **Mobile**: Responsive design issues
- **Security**: Potential vulnerabilities

---

## Screenshot Strategy

### Naming Convention
```
{page}-{viewport}-{state}-{timestamp}.png
```

Examples:
- `dashboard-desktop-loaded-1704567890.png`
- `requests-mobile-empty-state-1704567891.png`
- `login-desktop-error-validation-1704567892.png`

### Required Screenshots

1. **Every page**: Desktop (1440x900) and Mobile (390x844)
2. **Error states**: Validation errors, empty states
3. **Before/After**: Any data modification
4. **Issues found**: Screenshot with annotation

### Output Directory
```
docs/reports/screenshots/e2e-{date}/
```

---

## Report Format

```markdown
# E2E Testing Report - {DATE}

## Summary
- **Total Pages Tested**: X
- **Issues Found**: X (Critical: X, High: X, Medium: X, Low: X)
- **Test Duration**: X minutes
- **Test Data Created**: X items
- **Test Data Cleaned**: X items

## Test Environment
- URL: https://www.swmocarecollective.org
- Browser: Chromium (Playwright)
- Viewports: 1440x900 (Desktop), 390x844 (Mobile)

## Issues Found

### Critical Issues
| ID | Page | Description | Screenshot |
|----|------|-------------|------------|

### High Priority Issues
...

### Medium Priority Issues
...

### Low Priority Issues
...

## Page-by-Page Results

### Public Pages
#### Landing Page (/)
- **Status**: PASS/FAIL
- **Desktop**: [screenshot]
- **Mobile**: [screenshot]
- **Issues**: List any issues found
- **Notes**: Additional observations

...

## Core Flow Results

### Help Request Creation Flow
- **Status**: PASS/FAIL
- **Steps Completed**: X/Y
- **Issues**: ...

...

## Recommendations

1. Priority fixes
2. Improvements
3. Future considerations

## Test Data Cleanup Verification
- [ ] All test help requests deleted
- [ ] All test conversations deleted
- [ ] All test messages deleted
- [ ] Test accounts preserved for future testing
```

---

## Cleanup Checklist

Before ending session, verify:

1. **Help Requests**: Delete all with `[E2E-TEST]` prefix
2. **Conversations**: Delete all involving test accounts
3. **Messages**: Cascade deleted with conversations
4. **Notifications**: Clear test account notifications
5. **Verification**: Search for `E2E-TEST` returns 0 results

---

## Vulcan-Todo Integration

After testing, create tasks in `care-collective` project:

```bash
# For each issue found:
vulcan-todo create_task \
  --title "Fix: {brief description}" \
  --project "care-collective" \
  --priority "{critical|high|medium|low}" \
  --tags "e2e-testing,{category},{page}"
  --description "{detailed description with screenshot reference}"
```

### Tag Conventions
- `e2e-testing` - All issues from this session
- `e2e-{date}` - Session-specific tag
- Category: `functionality`, `ui-ux`, `accessibility`, `performance`, `content`, `mobile`, `security`
- Page: `landing`, `dashboard`, `requests`, `messaging`, `admin`, `profile`, etc.

---

## Execution Checklist

### Pre-Test
- [ ] Verify target URL is accessible
- [ ] Create/verify test accounts exist
- [ ] Clear previous test data if any
- [ ] Prepare screenshot directory

### During Test
- [ ] Follow safety guardrails strictly
- [ ] Document all findings immediately
- [ ] Take screenshots for every issue
- [ ] Note any unexpected behaviors

### Post-Test
- [ ] Complete cleanup checklist
- [ ] Generate markdown report
- [ ] Create vulcan-todo tasks for issues
- [ ] Commit report to repository

---

*Plan Version: 1.0 | Created: January 6, 2026*
