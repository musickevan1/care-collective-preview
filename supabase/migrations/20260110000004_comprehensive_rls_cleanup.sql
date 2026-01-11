-- Migration: Comprehensive RLS Policy Cleanup
-- Description: Drops all old-style RLS policies that duplicate the new consolidated ones,
--              fixes security_definer_view issue, and adds search_path to functions
--
-- This resolves:
--   - multiple_permissive_policies warnings on profiles, help_requests, messages
--   - auth_rls_initplan warnings (old policies with bare auth.uid())
--   - security_definer_view error on pending_applications
--   - function_search_path_mutable warnings on 3 functions

-- ============================================================================
-- PROFILES TABLE - Drop Old Policies
-- Keep: profiles_select, profiles_insert_own_only, profiles_update_own_or_admin
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update user verification status" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles (no recursion)" ON profiles;
DROP POLICY IF EXISTS "profiles_select_community_viewing" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile and approved users" ON profiles;

-- ============================================================================
-- HELP_REQUESTS TABLE - Drop Old Policies
-- Keep: help_requests_select_approved, help_requests_insert_approved_users,
--       help_requests_update_owner_or_admin, help_requests_delete_owner_or_admin
-- ============================================================================

DROP POLICY IF EXISTS "Help requests are viewable by verified users" ON help_requests;
DROP POLICY IF EXISTS "Help requests are viewable by everyone" ON help_requests;
DROP POLICY IF EXISTS "Help requests are viewable by authenticated users" ON help_requests;
DROP POLICY IF EXISTS "Verified users can create help requests" ON help_requests;
DROP POLICY IF EXISTS "Authenticated users can create help requests" ON help_requests;
DROP POLICY IF EXISTS "Users can create help requests" ON help_requests;
DROP POLICY IF EXISTS "Verified users can update their own help requests" ON help_requests;
DROP POLICY IF EXISTS "Verified users can delete their own help requests" ON help_requests;
DROP POLICY IF EXISTS "Approved users can view help requests" ON help_requests;
DROP POLICY IF EXISTS "Users can update their own help requests" ON help_requests;
DROP POLICY IF EXISTS "Users can delete their own help requests" ON help_requests;
DROP POLICY IF EXISTS "Admins can update any help request" ON help_requests;
DROP POLICY IF EXISTS "Admins can delete any help request" ON help_requests;
DROP POLICY IF EXISTS "Approved users can accept open help requests" ON help_requests;
DROP POLICY IF EXISTS "Helpers can update requests they're assigned to" ON help_requests;

-- ============================================================================
-- MESSAGES TABLE - Drop Old Policies
-- Keep: messages_select_participants_only, messages_insert_approved_sender,
--       messages_update_sender_only
-- ============================================================================

DROP POLICY IF EXISTS "Verified users can view messages they sent or received" ON messages;
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON messages;
DROP POLICY IF EXISTS "Approved users can view messages they sent or received" ON messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Verified users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Approved users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;
DROP POLICY IF EXISTS "Verified users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Approved users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can update messages sent to them" ON messages;

-- ============================================================================
-- FIX: pending_applications View - SECURITY INVOKER
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
COMMENT ON VIEW public.pending_applications IS 'Admin view for pending user applications with SECURITY INVOKER';

-- ============================================================================
-- FIX: Functions with search_path
-- ============================================================================

ALTER FUNCTION public.approve_user_application(uuid, uuid)
  SET search_path = public;

ALTER FUNCTION public.handle_new_user_with_email_confirmation()
  SET search_path = public;

ALTER FUNCTION public.handle_email_confirmation()
  SET search_path = public;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  duplicate_count INTEGER;
  old_policy_count INTEGER;
BEGIN
  -- Check for remaining old-style policies
  SELECT COUNT(*) INTO old_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'help_requests', 'messages')
  AND policyname LIKE '%can %';  -- Old naming convention: "Users can ...", "Verified users can ..."

  IF old_policy_count > 0 THEN
    RAISE WARNING 'Found % old-style policies still remaining', old_policy_count;
  END IF;

  RAISE NOTICE 'Comprehensive RLS Cleanup Complete';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '  - Dropped old profiles policies (keeping profiles_select, profiles_insert_own_only, profiles_update_own_or_admin)';
  RAISE NOTICE '  - Dropped old help_requests policies (keeping help_requests_select_approved, help_requests_insert_approved_users, help_requests_update_owner_or_admin, help_requests_delete_owner_or_admin)';
  RAISE NOTICE '  - Dropped old messages policies (keeping messages_select_participants_only, messages_insert_approved_sender, messages_update_sender_only)';
  RAISE NOTICE '  - Fixed pending_applications view with SECURITY INVOKER';
  RAISE NOTICE '  - Added search_path to approve_user_application, handle_new_user_with_email_confirmation, handle_email_confirmation';
  RAISE NOTICE '';
  RAISE NOTICE 'Re-run Supabase linter to verify warnings are resolved';
END $$;
