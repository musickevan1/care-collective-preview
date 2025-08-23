-- Fix security issue with demo_summary view
-- Remove SECURITY DEFINER to use SECURITY INVOKER (default and safer)

-- Drop the existing view
DROP VIEW IF EXISTS public.demo_summary;

-- Recreate the view with explicit SECURITY INVOKER
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

-- Add a comment explaining the security model
COMMENT ON VIEW public.demo_summary IS 'Summary view for demo data. Uses SECURITY INVOKER to respect the querying user''s permissions and RLS policies.';