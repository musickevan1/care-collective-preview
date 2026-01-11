# Sprint D: Polish & Launch Prep - Session Prompt

Copy and paste this prompt to start a new Claude Code session:

---

## Prompt

```
I'm working on Care Collective (mutual aid platform). We're in Phase 3: Production Readiness.

Start Sprint D: Polish & Launch Prep. The sprint is in vulcan-todo with ID: 518c05e7-1f3b-4a4d-a83d-456958c9e2b7

This is the final sprint before launch with 9 tasks. First, activate the sprint using mcp__vulcan-todo__start_sprint, then work through the tasks:

1. **Cleanup beta/testing data** (MED)
   - Identify test accounts in the database
   - Remove test users, help requests, conversations
   - Keep only real/production data
   - Be careful not to delete actual user data

2. **Fix admin CMS system** (MED)
   - Review admin panel at /admin
   - Fix any broken CMS features or controls
   - Ensure user management works correctly
   - Test approval/rejection workflows

3. **Create/verify settings page** (MED)
   - Check if user settings page exists
   - Should include notification preferences
   - Should include privacy preferences
   - Create if missing, verify if exists

4. **Performance baseline - Lighthouse audit** (MED)
   - Run Lighthouse on key pages: landing, dashboard, requests, messages
   - Document scores: Performance, Accessibility, Best Practices, SEO
   - Save results for baseline comparison
   - Note any critical issues to fix

5. **Send messenger tutorial preview to client** (MED) - IN PROGRESS
   - This task is already in progress
   - Follow up with client if awaiting response
   - Get approval before launch

6. **Bundle size analysis** (MED)
   - Run `npm run build` and check output sizes
   - Or use `npx next build --analyze` (may need @next/bundle-analyzer)
   - Identify large dependencies
   - Document baseline sizes

7. **Database query optimization** (MED)
   - Search for `select(*)` queries in lib/ and app/
   - Replace with specific column selections on hot paths
   - Check for missing indexes on foreign keys
   - Use mcp__supabase__get_advisors for recommendations

8. **Verify image optimization settings** (MED)
   - Check `images.unoptimized: true` in next.config.js
   - Either enable optimization or document why it's disabled
   - If enabling, test that images still load correctly

9. **Production environment validation** (MED)
   - Review env validation in lib/config/ or similar
   - Add strict validation for production mode
   - Ensure missing critical env vars fail fast
   - Don't allow lenient/optional for security-critical vars

Use vulcan-todo to track progress - mark tasks in_progress when starting, completed when done.

Reference the launch plan at: ~/.claude/plans/squishy-munching-church.md
```

---

## Quick Reference

**Sprint ID**: `518c05e7-1f3b-4a4d-a83d-456958c9e2b7`

**Task IDs**:
| Order | Task | ID | Status |
|-------|------|-----|--------|
| 1 | Beta cleanup | `079c0c46-e7f3-454f-9212-d3f5f3fc7b00` | pending |
| 2 | Admin CMS | `6837d9d8-5687-475c-b147-05ae33523765` | pending |
| 3 | Settings page | `652b2a99-057a-4755-bdc5-164d7cba3d59` | pending |
| 4 | Lighthouse | `7a2c1511-0e03-4a0a-ad06-4d9911d483cb` | pending |
| 5 | Messenger tutorial | `87632015-6376-4ce7-9c56-d885707f9e64` | **in_progress** |
| 6 | Bundle analysis | `3deb0227-f9be-44ec-9d74-803cdf46c367` | pending |
| 7 | Query optimization | `a629b119-08d8-46b7-b5b4-baaf6c773cb3` | pending |
| 8 | Image optimization | `1a7a55e2-576d-4fe2-a6cf-a946dde58b94` | pending |
| 9 | Env validation | `b66ae895-bdfe-4f16-881b-085f24841cb9` | pending |

**Key Files**:
- `app/admin/` - Admin panel pages
- `app/settings/` - User settings (if exists)
- `next.config.js` - Image optimization, build config
- `lib/config/` - Environment validation
- `lib/supabase/` - Database queries to optimize

**Useful Commands**:
```bash
# Lighthouse CLI (install: npm i -g lighthouse)
lighthouse https://care-collective-preview.vercel.app --output html --output-path ./lighthouse-report.html

# Bundle analysis
npm run build
# Or with analyzer
npx @next/bundle-analyzer

# Find select(*) queries
rg "\.select\('\*'\)" --type ts
rg "\.select\(\)" --type ts

# Check image config
grep -A5 "images:" next.config.js
```

**Lighthouse Target Scores**:
| Metric | Target |
|--------|--------|
| Performance | > 80 |
| Accessibility | > 90 (WCAG 2.1 AA) |
| Best Practices | > 90 |
| SEO | > 90 |

**Database Cleanup SQL** (use with caution):
```sql
-- List test accounts (review before deleting!)
SELECT id, email, created_at FROM auth.users
WHERE email LIKE '%test%' OR email LIKE '%example%';

-- Count test data
SELECT COUNT(*) FROM help_requests WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%test%'
);
```

---

*Created: 2026-01-11 | Sprint D of Care Collective Launch Plan*
