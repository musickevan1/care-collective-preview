# Sprint C: Security Hardening - Session Prompt

Copy and paste this prompt to start a new Claude Code session:

---

## Prompt

```
I'm working on Care Collective (mutual aid platform). We're in Phase 3: Production Readiness.

Start Sprint C: Security Hardening. The sprint is in vulcan-todo with ID: 257e0490-1c32-4fdd-9740-a57516e11019

First, activate the sprint using mcp__vulcan-todo__start_sprint, then work through the 5 tasks in order:

1. **Enable Content Security Policy headers** (HIGH)
   - CSP is commented out in next.config.js around line 108
   - Uncomment and configure appropriate CSP directives
   - Test that the site still works (scripts, styles, images load)
   - Balance security with functionality (Supabase, Vercel Analytics, etc.)

2. **Secure health check endpoints** (HIGH)
   - Review /api/health/* endpoints
   - They may expose: database timing, memory usage, system info
   - Options: add authentication, sanitize sensitive data, or remove detailed info
   - Keep basic health check for uptime monitoring

3. **Audit API route input validation** (HIGH)
   - Review all routes in app/api/
   - Ensure consistent Zod validation on all inputs
   - Check for: missing validation, inconsistent schemas, unvalidated params
   - Reference existing patterns in the codebase

4. **Remove console.log from production code** (HIGH)
   - Known locations:
     - app/admin/page.tsx
     - app/admin/applications/ApprovalActions.tsx
     - app/complete-profile/page.tsx
   - Search for other console.log statements: `rg "console\.(log|debug|info)" --type ts --type tsx`
   - Remove or convert to proper logging (error tracking)

5. **Test full notification system** (MED)
   - Test both email AND in-platform notifications
   - Verify notifications trigger correctly for:
     - New help request offers
     - Message received
     - Status changes
   - Check notification UI in the app

Use vulcan-todo to track progress - mark tasks in_progress when starting, completed when done.

Reference the launch plan at: ~/.claude/plans/squishy-munching-church.md
```

---

## Quick Reference

**Sprint ID**: `257e0490-1c32-4fdd-9740-a57516e11019`

**Task IDs**:
| Order | Task | ID |
|-------|------|-----|
| 1 | CSP headers | `64cb6226-e5b6-4618-b591-e66feec3b4fa` |
| 2 | Health endpoints | `04e681d2-c3ca-4d4f-970e-3e5bdf327940` |
| 3 | API validation | `ccf1fe90-8dd7-4576-8e09-22a07d3cea51` |
| 4 | Remove console.log | `50b1cca7-62aa-4ada-9ac6-b26b63bf41b0` |
| 5 | Notification system | `f3942ad2-5f5a-41b2-90cd-575e1088dccd` |

**Key Files**:
- `next.config.js` - CSP headers configuration (~line 108)
- `app/api/health/` - Health check endpoints
- `app/api/` - All API routes for validation audit
- `app/admin/page.tsx` - Known console.log location
- `app/admin/applications/ApprovalActions.tsx` - Known console.log location
- `app/complete-profile/page.tsx` - Known console.log location
- `lib/notifications/` - Notification system

**Useful Commands**:
```bash
# Find console.log statements
rg "console\.(log|debug|info)" --type ts --type tsx -l

# Find console.log with context
rg "console\.(log|debug|info)" --type ts -C 2

# List all API routes
find app/api -name "route.ts" -type f

# Test CSP headers after enabling
curl -I https://care-collective-preview.vercel.app | grep -i content-security
```

**CSP Starter Template**:
```javascript
// Recommended CSP for Next.js + Supabase
contentSecurityPolicy: `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https: blob:;
  font-src 'self' data:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vercel.live;
  frame-ancestors 'none';
`
```

---

*Created: 2026-01-11 | Sprint C of Care Collective Launch Plan*
