# Security Fix: demo_summary View

## Issue Detected
The Supabase security linter detected that the `demo_summary` view was using (or defaulting to) `SECURITY DEFINER`, which could pose a security risk.

## What is SECURITY DEFINER?
When a view is created with `SECURITY DEFINER`, it executes with the permissions of the user who created the view, not the user who is querying it. This bypasses Row Level Security (RLS) policies and can expose data that should be restricted.

## The Fix
We've updated the `demo_summary` view to explicitly use `SECURITY INVOKER` instead, which:
- Respects the permissions of the user querying the view
- Enforces RLS policies properly
- Is the safer, recommended approach for most views

## Files Modified
1. **New Migration**: `supabase/migrations/20250115_fix_demo_summary_security.sql`
   - Drops and recreates the view with explicit `SECURITY INVOKER`
   - Adds documentation about the security model

2. **Seed Files Updated**:
   - `scripts/seed-demo.sql`
   - `scripts/seed-demo-fixed.sql`
   - `supabase/seed.sql`
   - All now create the view with `WITH (security_invoker = true)`

## How to Apply the Fix

### Method 1: Using the Prepared Script
There's a ready-to-use script that can be run directly:

```bash
# For local development with psql
psql "postgresql://postgres:postgres@localhost:54322/postgres" -f scripts/apply-security-fix.sql

# Or copy the contents of scripts/apply-security-fix.sql and run in Supabase SQL Editor
```

### Method 2: For Local Development
```bash
# If Supabase is running, run the migration
supabase migration up

# Or if resetting the database
supabase db reset
```

### Method 3: Manual Application (Production or SQL Editor)
Run this in the Supabase SQL Editor:

```sql
-- Drop the existing view if it exists
DROP VIEW IF EXISTS public.demo_summary CASCADE;

-- Recreate with SECURITY INVOKER
CREATE VIEW public.demo_summary 
WITH (security_invoker = true) AS
SELECT 
  'Demo Data Summary' as title,
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM profiles WHERE is_admin = true) as admin_users,
  (SELECT COUNT(*) FROM help_requests) as total_requests,
  (SELECT COUNT(*) FROM help_requests WHERE status = 'open') as open_requests,
  (SELECT COUNT(*) FROM help_requests WHERE status = 'in_progress') as in_progress_requests,
  (SELECT COUNT(*) FROM help_requests WHERE status = 'completed') as completed_requests,
  (SELECT COUNT(*) FROM help_requests WHERE status = 'cancelled') as cancelled_requests,
  (SELECT COUNT(DISTINCT helper_id) FROM help_requests WHERE helper_id IS NOT NULL) as active_helpers;

GRANT SELECT ON public.demo_summary TO anon, authenticated;

COMMENT ON VIEW public.demo_summary IS 'Summary view for demo data. Uses SECURITY INVOKER to respect the querying user''s permissions and RLS policies.';
```

## Verification
After applying the fix, the Supabase linter should no longer report this security issue.

## Best Practices Going Forward
1. Always explicitly specify security context for views
2. Default to `SECURITY INVOKER` unless there's a specific need for `SECURITY DEFINER`
3. Document why if `SECURITY DEFINER` is actually needed
4. Regularly run security linters to catch such issues

## Reference
- [Supabase Database Linter Documentation](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view)
- [PostgreSQL View Security Documentation](https://www.postgresql.org/docs/current/sql-createview.html)