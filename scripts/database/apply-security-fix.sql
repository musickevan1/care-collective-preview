-- Apply Security Fix for demo_summary view
-- This script can be run in the Supabase SQL Editor or via psql

-- Drop the existing view if it exists
DROP VIEW IF EXISTS public.demo_summary CASCADE;

-- Recreate the view with explicit SECURITY INVOKER
-- This ensures the view respects the permissions of the querying user
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

-- Grant appropriate permissions
GRANT SELECT ON public.demo_summary TO anon, authenticated;

-- Add documentation about the security model
COMMENT ON VIEW public.demo_summary IS 'Summary view for demo data. Uses SECURITY INVOKER to respect the querying user''s permissions and RLS policies.';

-- Verify the fix was applied
SELECT 
    schemaname,
    viewname,
    viewowner,
    definition
FROM pg_views 
WHERE viewname = 'demo_summary';