-- Migration: Fix Profiles RLS Infinite Recursion (CRITICAL PRODUCTION FIX)
-- Description: The profiles_select policy queries profiles table within itself,
--              causing infinite recursion. This fix uses SECURITY DEFINER functions
--              to check user status without triggering RLS.
--
-- Error: "infinite recursion detected in policy for relation profiles"

-- ============================================================================
-- STEP 1: Create helper functions with SECURITY DEFINER to bypass RLS
-- ============================================================================

-- Function to check if current user is approved (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_current_user_approved()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND verification_status = 'approved'
  );
$$;

-- Function to check if current user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
    AND verification_status = 'approved'
  );
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_current_user_approved() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

-- ============================================================================
-- STEP 2: Drop the recursive policy and create a fixed one
-- ============================================================================

DROP POLICY IF EXISTS "profiles_select" ON profiles;

CREATE POLICY "profiles_select" ON profiles FOR SELECT
USING (
  -- User can always view their own profile
  (select auth.uid()) = id
  OR
  -- Approved users can view other approved users' profiles
  (
    public.is_current_user_approved()
    AND verification_status = 'approved'
  )
  OR
  -- Admins can view all profiles
  public.is_current_user_admin()
);

-- ============================================================================
-- STEP 3: Fix other policies that may have the same recursion issue
-- ============================================================================

-- Fix help_requests policies
DROP POLICY IF EXISTS "help_requests_select_approved" ON help_requests;

CREATE POLICY "help_requests_select_approved" ON help_requests FOR SELECT
USING (public.is_current_user_approved());

DROP POLICY IF EXISTS "help_requests_insert_approved_users" ON help_requests;

CREATE POLICY "help_requests_insert_approved_users" ON help_requests FOR INSERT
WITH CHECK (
  (select auth.uid()) = user_id
  AND public.is_current_user_approved()
);

DROP POLICY IF EXISTS "help_requests_update_owner_or_admin" ON help_requests;

CREATE POLICY "help_requests_update_owner_or_admin" ON help_requests FOR UPDATE
USING (
  (select auth.uid()) = user_id
  OR (select auth.uid()) = helper_id
  OR public.is_current_user_admin()
)
WITH CHECK (
  (select auth.uid()) = user_id
  OR (select auth.uid()) = helper_id
  OR public.is_current_user_admin()
);

DROP POLICY IF EXISTS "help_requests_delete_owner_or_admin" ON help_requests;

CREATE POLICY "help_requests_delete_owner_or_admin" ON help_requests FOR DELETE
USING (
  (select auth.uid()) = user_id
  OR public.is_current_user_admin()
);

-- Fix profiles UPDATE policy
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON profiles;

CREATE POLICY "profiles_update_own_or_admin" ON profiles FOR UPDATE
USING (
  (select auth.uid()) = id
  OR public.is_current_user_admin()
)
WITH CHECK (
  (select auth.uid()) = id
  OR public.is_current_user_admin()
);

-- Fix messages INSERT policy
DROP POLICY IF EXISTS "messages_insert_approved_sender" ON messages;

CREATE POLICY "messages_insert_approved_sender" ON messages FOR INSERT
WITH CHECK (
  (select auth.uid()) = sender_id
  AND public.is_current_user_approved()
);

-- Fix conversations INSERT policy
DROP POLICY IF EXISTS "conversations_insert_approved" ON conversations;

CREATE POLICY "conversations_insert_approved" ON conversations FOR INSERT
WITH CHECK (
  (select auth.uid()) = created_by
  AND public.is_current_user_approved()
);

-- Fix conversations_v2 INSERT policy
DROP POLICY IF EXISTS "conversations_v2_insert" ON conversations_v2;

CREATE POLICY "conversations_v2_insert" ON conversations_v2 FOR INSERT
WITH CHECK (
  (select auth.uid()) = helper_id
  AND public.is_current_user_approved()
);

-- ============================================================================
-- STEP 4: Fix admin-only policies
-- ============================================================================

-- Bug reports
DROP POLICY IF EXISTS "bug_reports_select" ON bug_reports;

CREATE POLICY "bug_reports_select" ON bug_reports FOR SELECT
USING (
  (select auth.uid()) = user_id
  OR public.is_current_user_admin()
);

DROP POLICY IF EXISTS "bug_reports_update" ON bug_reports;

CREATE POLICY "bug_reports_update" ON bug_reports FOR UPDATE
USING (
  ((select auth.uid()) = user_id AND status = 'open')
  OR public.is_current_user_admin()
);

-- User restrictions
DROP POLICY IF EXISTS "user_restrictions_select" ON user_restrictions;

CREATE POLICY "user_restrictions_select" ON user_restrictions FOR SELECT
USING (
  (select auth.uid()) = user_id
  OR public.is_current_user_admin()
);

DROP POLICY IF EXISTS "user_restrictions_admin_manage" ON user_restrictions;

CREATE POLICY "user_restrictions_admin_manage" ON user_restrictions
FOR ALL
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- Site content
DROP POLICY IF EXISTS "site_content_select" ON site_content;

CREATE POLICY "site_content_select" ON site_content FOR SELECT
USING (
  status = 'published'
  OR public.is_current_user_admin()
);

DROP POLICY IF EXISTS "site_content_insert" ON site_content;

CREATE POLICY "site_content_insert" ON site_content FOR INSERT
WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "site_content_update" ON site_content;

CREATE POLICY "site_content_update" ON site_content FOR UPDATE
USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "site_content_delete" ON site_content;

CREATE POLICY "site_content_delete" ON site_content FOR DELETE
USING (public.is_current_user_admin());

-- Community updates
DROP POLICY IF EXISTS "community_updates_select" ON community_updates;

CREATE POLICY "community_updates_select" ON community_updates FOR SELECT
USING (
  status = 'published'
  OR public.is_current_user_admin()
);

DROP POLICY IF EXISTS "community_updates_insert" ON community_updates;

CREATE POLICY "community_updates_insert" ON community_updates FOR INSERT
WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "community_updates_update" ON community_updates;

CREATE POLICY "community_updates_update" ON community_updates FOR UPDATE
USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "community_updates_delete" ON community_updates;

CREATE POLICY "community_updates_delete" ON community_updates FOR DELETE
USING (public.is_current_user_admin());

-- Content revisions
DROP POLICY IF EXISTS "content_revisions_select" ON content_revisions;

CREATE POLICY "content_revisions_select" ON content_revisions FOR SELECT
USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "content_revisions_insert" ON content_revisions;

CREATE POLICY "content_revisions_insert" ON content_revisions FOR INSERT
WITH CHECK (public.is_current_user_admin());

-- Calendar events
DROP POLICY IF EXISTS "calendar_events_select" ON calendar_events;

CREATE POLICY "calendar_events_select" ON calendar_events FOR SELECT
USING (
  status = 'published'
  OR public.is_current_user_admin()
);

DROP POLICY IF EXISTS "calendar_events_admin_manage" ON calendar_events;

CREATE POLICY "calendar_events_admin_manage" ON calendar_events
FOR ALL
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- Event categories
DROP POLICY IF EXISTS "event_categories_select" ON event_categories;

CREATE POLICY "event_categories_select" ON event_categories FOR SELECT
USING (
  is_active = true
  OR public.is_current_user_admin()
);

DROP POLICY IF EXISTS "event_categories_admin_manage" ON event_categories;

CREATE POLICY "event_categories_admin_manage" ON event_categories
FOR ALL
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- Google calendar sync
DROP POLICY IF EXISTS "google_calendar_sync_admin_all" ON google_calendar_sync;

CREATE POLICY "google_calendar_sync_admin_all" ON google_calendar_sync
FOR ALL
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- Sync conflict log
DROP POLICY IF EXISTS "sync_conflict_log_admin_select" ON sync_conflict_log;

CREATE POLICY "sync_conflict_log_admin_select" ON sync_conflict_log FOR SELECT
USING (public.is_current_user_admin());

-- Verification status changes
DROP POLICY IF EXISTS "verification_status_changes_select" ON verification_status_changes;

CREATE POLICY "verification_status_changes_select" ON verification_status_changes FOR SELECT
USING (
  (select auth.uid()) = user_id
  OR public.is_current_user_admin()
);

-- Audit logs
DROP POLICY IF EXISTS "audit_logs_admin_select_only" ON audit_logs;

CREATE POLICY "audit_logs_admin_select_only" ON audit_logs FOR SELECT
USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "audit_logs_admin_insert_only" ON audit_logs;

CREATE POLICY "audit_logs_admin_insert_only" ON audit_logs FOR INSERT
WITH CHECK (public.is_current_user_admin());

-- Message reports
DROP POLICY IF EXISTS "message_reports_select" ON message_reports;

CREATE POLICY "message_reports_select" ON message_reports FOR SELECT
USING (
  (select auth.uid()) = reported_by
  OR public.is_current_user_admin()
);

-- Message audit log
DROP POLICY IF EXISTS "message_audit_log_select" ON message_audit_log;

CREATE POLICY "message_audit_log_select" ON message_audit_log FOR SELECT
USING (
  (select auth.uid()) = user_id
  OR public.is_current_user_admin()
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CRITICAL FIX: Profiles RLS Recursion';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Created helper functions:';
  RAISE NOTICE '  - is_current_user_approved() - checks if user is approved';
  RAISE NOTICE '  - is_current_user_admin() - checks if user is admin';
  RAISE NOTICE '';
  RAISE NOTICE 'These functions use SECURITY DEFINER to bypass RLS,';
  RAISE NOTICE 'preventing infinite recursion when checking user status.';
  RAISE NOTICE '';
  RAISE NOTICE 'All policies using EXISTS(SELECT FROM profiles) have been';
  RAISE NOTICE 'updated to use these helper functions instead.';
END $$;
