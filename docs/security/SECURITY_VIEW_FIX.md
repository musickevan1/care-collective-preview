# Security Fix: Database Views and Tables

## Issue Detected (January 2026)
The Supabase security linter detected 7 security issues:
1. **6 views** using `SECURITY DEFINER` instead of `SECURITY INVOKER`
2. **1 orphaned table** (`profiles_audit_backup`) with RLS disabled

## What is SECURITY DEFINER?
When a view is created with `SECURITY DEFINER`, it executes with the permissions of the user who created the view, not the user who is querying it. This bypasses Row Level Security (RLS) policies and can expose data that should be restricted.

## Views Fixed

| View Name | Purpose | Fixed In |
|-----------|---------|----------|
| `pending_applications` | Admin view of pending user applications | 20260110000000_fix_security_definer_views.sql |
| `demo_summary` | Demo data statistics overview | 20260110000000_fix_security_definer_views.sql |
| `beta_tester_stats` | Beta testing program statistics | 20260110000000_fix_security_definer_views.sql |
| `bug_report_stats` | Bug report aggregations | 20260110000000_fix_security_definer_views.sql |
| `active_user_restrictions` | Non-expired user restrictions | 20260110000000_fix_security_definer_views.sql |
| `user_conversations` | User's conversation list with unread counts | 20260110000000_fix_security_definer_views.sql |

## Table Removed

| Table Name | Issue | Action |
|------------|-------|--------|
| `profiles_audit_backup` | RLS disabled, not in codebase | Dropped (orphaned table created manually in production) |

## The Fix
All views now explicitly use `SECURITY INVOKER`, which:
- Respects the permissions of the user querying the view
- Enforces RLS policies properly
- Is the safer, recommended approach for most views

## Files Modified

### Migration File
**`supabase/migrations/20260110000000_fix_security_definer_views.sql`**

This migration:
- Drops and recreates all 6 views with explicit `WITH (security_invoker = true)`
- Drops the orphaned `profiles_audit_backup` table
- Adds documentation comments to each view
- Preserves all GRANT permissions

## How to Apply the Fix

### For Production (Supabase SQL Editor)
Copy the contents of `supabase/migrations/20260110000000_fix_security_definer_views.sql` and run in the Supabase SQL Editor.

### For Local Development
```bash
# If Supabase is running, run the migration
supabase migration up

# Or if resetting the database
supabase db reset
```

## Verification
After applying the fix:
1. Go to Supabase Dashboard > Database > Linter
2. Verify all 7 security issues are resolved
3. Test affected features:
   - Admin panel (pending_applications)
   - Messaging (user_conversations)
   - User restrictions (active_user_restrictions)
   - Demo data view (demo_summary)

## Best Practices Going Forward
1. **Always explicitly specify security context for views** using `WITH (security_invoker = true)`
2. **Default to `SECURITY INVOKER`** unless there's a specific need for `SECURITY DEFINER`
3. **Document why** if `SECURITY DEFINER` is actually needed (usually only for RPC functions)
4. **Regularly run security linters** to catch such issues
5. **Never create database objects manually** in production - always use migrations

## When SECURITY DEFINER is Appropriate
`SECURITY DEFINER` should only be used for:
- **RPC functions** that need to bypass RLS for specific operations (e.g., checking admin status to avoid infinite recursion)
- **Triggers** that need elevated privileges
- Never for views unless absolutely necessary (and then document thoroughly)

## Reference
- [Supabase Database Linter Documentation](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view)
- [PostgreSQL View Security Documentation](https://www.postgresql.org/docs/current/sql-createview.html)
