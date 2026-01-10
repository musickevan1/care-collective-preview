-- Migration: Fix SECURITY DEFINER views and clean up orphaned table
-- Description: Resolves Supabase security linter errors by:
--   1. Recreating 6 views with explicit SECURITY INVOKER
--   2. Dropping orphaned profiles_audit_backup table
--
-- Views fixed:
--   - pending_applications
--   - demo_summary
--   - bug_report_stats
--   - active_user_restrictions
--   - user_conversations
--   - beta_tester_stats
--
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view

-- ============================================================================
-- STEP 1: Drop orphaned table without RLS
-- ============================================================================

-- This table was created manually in production and is not tracked in migrations
DROP TABLE IF EXISTS public.profiles_audit_backup CASCADE;

-- ============================================================================
-- STEP 2: Fix pending_applications view
-- ============================================================================

DROP VIEW IF EXISTS public.pending_applications CASCADE;
CREATE VIEW public.pending_applications
WITH (security_invoker = true) AS
SELECT
  p.id,
  p.name,
  p.location,
  p.application_reason,
  p.applied_at,
  p.verification_status,
  p.rejection_reason,
  p.email_confirmed,
  p.email_confirmed_at
FROM profiles p
WHERE p.verification_status = 'pending'
ORDER BY p.applied_at ASC;

GRANT SELECT ON public.pending_applications TO authenticated;
COMMENT ON VIEW public.pending_applications IS 'View of pending user applications for admin review. Uses SECURITY INVOKER to respect RLS policies.';

-- ============================================================================
-- STEP 3: Fix demo_summary view
-- ============================================================================

DROP VIEW IF EXISTS public.demo_summary CASCADE;
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

-- ============================================================================
-- STEP 4: Fix beta_tester_stats view
-- ============================================================================

DROP VIEW IF EXISTS public.beta_tester_stats CASCADE;
CREATE VIEW public.beta_tester_stats
WITH (security_invoker = true) AS
SELECT
  COUNT(*) as total_beta_testers,
  COUNT(*) FILTER (WHERE verification_status = 'approved') as approved_testers,
  COUNT(*) FILTER (WHERE verification_status = 'pending') as pending_testers,
  COUNT(*) FILTER (WHERE created_at > now() - interval '7 days') as new_this_week
FROM profiles
WHERE is_beta_tester = true;

GRANT SELECT ON public.beta_tester_stats TO authenticated;
COMMENT ON VIEW public.beta_tester_stats IS 'Statistics for beta tester program. Uses SECURITY INVOKER to respect RLS policies.';

-- ============================================================================
-- STEP 5: Fix bug_report_stats view
-- ============================================================================

DROP VIEW IF EXISTS public.bug_report_stats CASCADE;
CREATE VIEW public.bug_report_stats
WITH (security_invoker = true) AS
SELECT
  COUNT(*) as total_reports,
  COUNT(*) FILTER (WHERE status = 'open') as open_reports,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_reports,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved_reports,
  COUNT(*) FILTER (WHERE severity = 'critical') as critical_reports,
  COUNT(*) FILTER (WHERE severity = 'high') as high_reports,
  COUNT(*) FILTER (WHERE is_from_beta_tester = true) as beta_tester_reports,
  COUNT(*) FILTER (WHERE created_at > now() - interval '7 days') as reports_this_week,
  COUNT(*) FILTER (WHERE created_at > now() - interval '24 hours') as reports_today
FROM bug_reports;

GRANT SELECT ON public.bug_report_stats TO authenticated;
COMMENT ON VIEW public.bug_report_stats IS 'Aggregated bug report statistics. Uses SECURITY INVOKER to respect RLS policies.';

-- ============================================================================
-- STEP 6: Fix active_user_restrictions view
-- ============================================================================

DROP VIEW IF EXISTS public.active_user_restrictions CASCADE;
CREATE VIEW public.active_user_restrictions
WITH (security_invoker = true) AS
SELECT *
FROM user_restrictions
WHERE expires_at IS NULL OR expires_at > now();

GRANT SELECT ON public.active_user_restrictions TO authenticated;
COMMENT ON VIEW public.active_user_restrictions IS 'View of non-expired user restrictions. Uses SECURITY INVOKER to respect RLS policies.';

-- ============================================================================
-- STEP 7: Fix user_conversations view
-- ============================================================================

DROP VIEW IF EXISTS public.user_conversations CASCADE;
CREATE VIEW public.user_conversations
WITH (security_invoker = true) AS
SELECT
  c.*,
  hr.title as help_request_title,
  hr.category as help_request_category,
  (
    SELECT COUNT(*)
    FROM messages m
    WHERE m.conversation_id = c.id
      AND m.recipient_id = auth.uid()
      AND m.read_at IS NULL
  ) as unread_count
FROM conversations c
LEFT JOIN help_requests hr ON c.help_request_id = hr.id
WHERE c.id IN (
  SELECT conversation_id
  FROM conversation_participants
  WHERE user_id = auth.uid() AND left_at IS NULL
)
ORDER BY c.last_message_at DESC;

GRANT SELECT ON public.user_conversations TO authenticated;
COMMENT ON VIEW public.user_conversations IS 'User-specific conversation list with unread counts. Uses SECURITY INVOKER to respect RLS policies.';

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Security fix migration completed successfully';
  RAISE NOTICE 'Fixed 6 views to use SECURITY INVOKER';
  RAISE NOTICE 'Dropped orphaned profiles_audit_backup table';
  RAISE NOTICE 'Re-run Supabase linter to verify all security errors are resolved';
END $$;
