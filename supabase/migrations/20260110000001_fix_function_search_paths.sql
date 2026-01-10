-- Migration: Fix function search_path security warnings
-- Description: Adds SET search_path = public to all SECURITY DEFINER functions
--              and fixes overly permissive RLS policies
--
-- This addresses Supabase security linter warnings:
--   - function_search_path_mutable warnings
--   - rls_policy_always_true warnings
--
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- ============================================================================
-- PART 1: Fix function search_path for all functions
-- ============================================================================
-- Using DO block to safely handle functions that may or may not exist
-- Each ALTER is wrapped to continue if function doesn't exist

DO $$
DECLARE
  func_count INTEGER := 0;
BEGIN
  -- Session/Auth Functions
  BEGIN ALTER FUNCTION public.is_current_user_admin() SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.is_current_user_approved() SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.is_admin(uuid) SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.log_verification_status_change() SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.has_pending_session_invalidation(uuid) SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.mark_session_invalidated(uuid) SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.handle_new_user_verification() SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.handle_user_registration() SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.handle_email_confirmation_update() SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.verify_user_registration_system() SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;

  -- Messaging Functions
  BEGIN ALTER FUNCTION public.create_conversation_atomic(uuid, uuid, text) SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.send_message_v2(uuid, uuid, text) SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.get_conversation_v2(uuid, uuid) SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.list_conversations_v2(uuid) SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.list_conversations_v2(uuid, integer, integer) SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.accept_conversation(uuid, uuid) SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.reject_conversation(uuid, uuid) SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.update_conversation_timestamp() SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.log_message_action() SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.can_user_message(uuid, uuid) SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.is_conversation_participant(uuid) SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.start_help_conversation(uuid, uuid, text) SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.update_conversations_v2_updated_at() SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.update_messages_v2_updated_at() SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.initialize_messaging_preferences() SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.update_user_presence(uuid, text, uuid, uuid) SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;

  -- Admin Functions
  BEGIN ALTER FUNCTION public.approve_user_application(uuid, uuid) SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.apply_user_restriction(uuid, text, text, uuid, timestamptz, integer) SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.get_user_restrictions(uuid) SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.get_daily_message_count(uuid) SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.log_security_event(text, uuid, text, jsonb) SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.verify_rls_security() SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.verify_policy_documentation() SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.verify_authentication_fixes() SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;

  -- Utility/Trigger Functions
  BEGIN ALTER FUNCTION public.update_updated_at_column() SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.update_site_content_updated_at() SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.update_user_restrictions_updated_at() SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.update_bug_reports_updated_at() SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.log_content_change() SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.get_upcoming_events(integer, uuid) SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.check_event_conflicts(timestamptz, timestamptz, uuid) SET search_path = public; func_count := func_count + 1; EXCEPTION WHEN undefined_function THEN NULL; END;

  RAISE NOTICE 'Fixed search_path for % functions', func_count;
END $$;

-- ============================================================================
-- PART 2: Fix overly permissive RLS policies
-- ============================================================================

-- Fix 1: Drop orphan policy on conversation_participants (created in production, not in codebase)
DROP POLICY IF EXISTS "Allow inserting participants for new conversations" ON conversation_participants;

-- Fix 2: Replace overly permissive user_restrictions policy with proper admin check
DROP POLICY IF EXISTS "Admins can manage restrictions" ON user_restrictions;
CREATE POLICY "Only admins can manage restrictions" ON user_restrictions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_admin = true
      AND verification_status = 'approved'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_admin = true
      AND verification_status = 'approved'
    )
  );

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Security fix migration completed successfully';
  RAISE NOTICE 'Fixed 2 overly permissive RLS policies';
  RAISE NOTICE 'Re-run Supabase linter to verify warnings are resolved';
END $$;
