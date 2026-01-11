# Sprint A: Infrastructure Verification - Session Prompt

Copy and paste this prompt to start a new Claude Code session:

---

## Prompt

```
I'm working on Care Collective (mutual aid platform). We're in Phase 3: Production Readiness.

Start Sprint A: Infrastructure Verification. The sprint is in vulcan-todo with ID: 0027e971-9a9c-4f3d-9f43-40866de609b7

First, activate the sprint using mcp__vulcan-todo__start_sprint, then work through the 5 tasks in order:

1. **Enable TypeScript strict checking** (URGENT)
   - Remove `ignoreBuildErrors: true` from next.config.js:137-138
   - Run `npm run build` to find TypeScript errors
   - Fix all errors so build passes with strict checking
   - File: next.config.js

2. **Verify Sentry error tracking** (URGENT)
   - Check if NEXT_PUBLIC_SENTRY_DSN is set in Vercel
   - If not configured, help me set up Sentry
   - Code is ready in lib/config/error-tracking.ts

3. **Verify Redis rate limiting** (URGENT)
   - Check if REDIS_URL is set in Vercel (may be in Supabase)
   - Verify lib/security/rate-limiter.ts connects properly
   - In-memory fallback doesn't work in serverless

4. **Complete password reset flow testing** (URGENT)
   - Test the full password reset flow end-to-end
   - Verify email sends and link works
   - Check auth callback handling

5. **Verify emails send in production** (HIGH)
   - Test all 5 email types: waitlist, approval, rejection, status change, help offer
   - RESEND_API_KEY should already be configured

Use vulcan-todo to track progress - mark tasks in_progress when starting, completed when done.

Reference the launch plan at: ~/.claude/plans/squishy-munching-church.md
```

---

## Quick Reference

**Sprint ID**: `0027e971-9a9c-4f3d-9f43-40866de609b7`

**Task IDs**:
| Order | Task | ID |
|-------|------|-----|
| 1 | TypeScript strict | `e99505d1-68c2-4729-8907-afd359b88078` |
| 2 | Sentry verify | `8ce8740f-15c4-4edf-8a46-a875fc615fc5` |
| 3 | Redis verify | `685d6502-4254-40d4-8583-75bb5cf30647` |
| 4 | Password reset | `03bb5c4a-7850-45f2-89b1-86be5d51aa74` |
| 5 | Email verify | `988f010c-3d55-4bf7-87d6-7c6905af1237` |

**Key Files**:
- `next.config.js` - TypeScript/build config
- `lib/config/error-tracking.ts` - Sentry integration
- `lib/security/rate-limiter.ts` - Redis rate limiting
- `app/auth/callback/route.ts` - Password reset callback
- `lib/email/` - Email templates

**Vercel Commands**:
```bash
# Check env vars (requires Vercel CLI)
vercel env ls

# Check specific var
vercel env get NEXT_PUBLIC_SENTRY_DSN
vercel env get REDIS_URL
vercel env get RESEND_API_KEY
```

---

*Created: 2026-01-11 | Sprint A of Care Collective Launch Plan*
