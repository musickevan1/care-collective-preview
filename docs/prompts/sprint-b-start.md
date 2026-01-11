# Sprint B: Database & Core Testing - Session Prompt

Copy and paste this prompt to start a new Claude Code session:

---

## Prompt

```
I'm working on Care Collective (mutual aid platform). We're in Phase 3: Production Readiness.

Start Sprint B: Database & Core Testing. The sprint is in vulcan-todo with ID: 8b9a0d68-4dfc-48dd-8aa5-9f6ce47cffff

First, activate the sprint using mcp__vulcan-todo__start_sprint, then work through the 5 tasks in order:

1. **RLS performance audit** (HIGH)
   - 4 recent RLS cleanup migrations suggest past performance issues
   - Run `supabase db lint` to check for problems
   - Use mcp__supabase__get_advisors with type "performance" and "security"
   - Profile key queries, verify no recursion or timeouts
   - Check migrations in supabase/migrations/20260110*.sql

2. **Fix help request database system** (HIGH)
   - Audit the help_requests table and related queries
   - Verify CRUD operations work correctly
   - Test edge cases: concurrent updates, status transitions
   - Ensure RLS policies allow proper access

3. **Link email templates - verify all 5 types** (HIGH)
   - Test each email template sends correctly:
     1. Waitlist confirmation
     2. Approval notification
     3. Rejection notification
     4. Status change
     5. Help offer notification
   - Check templates in lib/email/ or templates/

4. **Test platform e2e** (HIGH)
   - Run comprehensive end-to-end tests
   - Test critical flows: signup → approval → create request → offer help → messaging
   - Use Playwright if available, otherwise manual testing
   - Document any failures

5. **Verify test coverage on critical paths** (HIGH)
   - Run `npm run test:coverage` or `vitest --coverage`
   - Verify 80%+ coverage on:
     - Auth flows (lib/supabase/, app/auth/)
     - Messaging (lib/messaging/)
     - Help requests (app/requests/)
     - Contact exchange (lib/privacy/)
   - Add tests for uncovered critical paths

Use vulcan-todo to track progress - mark tasks in_progress when starting, completed when done.

Reference the launch plan at: ~/.claude/plans/squishy-munching-church.md
```

---

## Quick Reference

**Sprint ID**: `8b9a0d68-4dfc-48dd-8aa5-9f6ce47cffff`

**Task IDs**:
| Order | Task | ID |
|-------|------|-----|
| 1 | RLS audit | `fbfa3ecd-f808-478b-9df7-f4b481d4f221` |
| 2 | Help requests | `e3f0762e-a8b4-49c9-a5cc-e234ea991da6` |
| 3 | Email templates | `cb096bc7-2ab6-4f45-80ca-242405a4c16f` |
| 4 | E2E testing | `f9e55632-2c1f-4941-b374-9b8c7712dd40` |
| 5 | Test coverage | `53865933-fb03-4655-b9de-a480bcf9e2ec` |

**Key Files**:
- `supabase/migrations/` - Database migrations (especially 20260110*.sql)
- `lib/database.types.ts` - Generated Supabase types
- `app/requests/` - Help request pages
- `lib/email/` - Email service and templates
- `tests/` - Test files

**Useful Commands**:
```bash
# Database
supabase db lint
supabase db reset  # Caution: resets local DB

# Testing
npm run test
npm run test:coverage
vitest --coverage

# Generate types after DB changes
npm run db:types
```

**Supabase MCP Tools**:
```
mcp__supabase__get_advisors - Check security/performance issues
mcp__supabase__list_tables - See all tables
mcp__supabase__execute_sql - Run queries
mcp__supabase__get_logs - Check for errors
```

---

*Created: 2026-01-11 | Sprint B of Care Collective Launch Plan*
