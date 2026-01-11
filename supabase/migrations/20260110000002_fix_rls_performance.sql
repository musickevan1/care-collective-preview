-- Migration: Fix RLS Policy Performance Issues
-- Description: Wraps auth.uid() calls in (select auth.uid()) for performance
--              and consolidates duplicate permissive policies
--
-- This addresses Supabase database linter warnings:
--   - auth_rls_initplan: auth.uid() evaluated per row instead of once
--   - multiple_permissive_policies: duplicate policies for same role/action
--
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- ============================================================================
-- PROFILES TABLE
-- Consolidate: "Admins can view all profiles (no recursion)" + "profiles_select_community_viewing" + "Users can view their own profile and approved users"
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all profiles (no recursion)" ON profiles;
DROP POLICY IF EXISTS "profiles_select_community_viewing" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile and approved users" ON profiles;

CREATE POLICY "profiles_select" ON profiles FOR SELECT
USING (
  -- User can view their own profile
  (select auth.uid()) = id
  OR
  -- Approved users can view other approved users' profiles
  (
    EXISTS (
      SELECT 1 FROM profiles viewer
      WHERE viewer.id = (select auth.uid())
      AND viewer.verification_status = 'approved'
    )
    AND verification_status = 'approved'
  )
  OR
  -- Admins can view all profiles
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
  )
);

-- Fix INSERT policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own_only" ON profiles;

CREATE POLICY "profiles_insert_own_only" ON profiles FOR INSERT
WITH CHECK ((select auth.uid()) = id);

-- Fix UPDATE policy
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update user verification status" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON profiles;

CREATE POLICY "profiles_update_own_or_admin" ON profiles FOR UPDATE
USING (
  (select auth.uid()) = id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
)
WITH CHECK (
  (select auth.uid()) = id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

-- ============================================================================
-- HELP_REQUESTS TABLE
-- Consolidate UPDATE policies: owner + helper + admin
-- ============================================================================

DROP POLICY IF EXISTS "Approved users can view help requests" ON help_requests;
DROP POLICY IF EXISTS "Help requests are viewable by everyone" ON help_requests;
DROP POLICY IF EXISTS "Help requests are viewable by authenticated users" ON help_requests;
DROP POLICY IF EXISTS "Help requests are viewable by verified users" ON help_requests;

CREATE POLICY "help_requests_select_approved" ON help_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND verification_status = 'approved'
  )
);

DROP POLICY IF EXISTS "Users can create help requests" ON help_requests;
DROP POLICY IF EXISTS "Authenticated users can create help requests" ON help_requests;
DROP POLICY IF EXISTS "Verified users can create help requests" ON help_requests;
DROP POLICY IF EXISTS "help_requests_insert_approved_users" ON help_requests;

CREATE POLICY "help_requests_insert_approved_users" ON help_requests FOR INSERT
WITH CHECK (
  (select auth.uid()) = user_id
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND verification_status = 'approved'
  )
);

-- Consolidate all UPDATE policies into one
DROP POLICY IF EXISTS "Users can update their own help requests" ON help_requests;
DROP POLICY IF EXISTS "Verified users can update their own help requests" ON help_requests;
DROP POLICY IF EXISTS "Admins can update any help request" ON help_requests;
DROP POLICY IF EXISTS "Approved users can accept open help requests" ON help_requests;
DROP POLICY IF EXISTS "Helpers can update requests they're assigned to" ON help_requests;
DROP POLICY IF EXISTS "help_requests_update_owner_or_admin" ON help_requests;

CREATE POLICY "help_requests_update_owner_or_admin" ON help_requests FOR UPDATE
USING (
  (select auth.uid()) = user_id  -- Owner
  OR (select auth.uid()) = helper_id  -- Assigned helper
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
)
WITH CHECK (
  (select auth.uid()) = user_id
  OR (select auth.uid()) = helper_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

DROP POLICY IF EXISTS "Users can delete their own help requests" ON help_requests;
DROP POLICY IF EXISTS "Verified users can delete their own help requests" ON help_requests;
DROP POLICY IF EXISTS "Admins can delete any help request" ON help_requests;
DROP POLICY IF EXISTS "help_requests_delete_owner_or_admin" ON help_requests;

CREATE POLICY "help_requests_delete_owner_or_admin" ON help_requests FOR DELETE
USING (
  (select auth.uid()) = user_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

-- ============================================================================
-- MESSAGES TABLE
-- Consolidate duplicate INSERT, SELECT, UPDATE policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view messages they sent or received" ON messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Approved users can view messages they sent or received" ON messages;
DROP POLICY IF EXISTS "Verified users can view messages they sent or received" ON messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "messages_select_participants_only" ON messages;

CREATE POLICY "messages_select_participants_only" ON messages FOR SELECT
USING (
  (select auth.uid()) = sender_id OR (select auth.uid()) = recipient_id
);

DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;
DROP POLICY IF EXISTS "Approved users can send messages" ON messages;
DROP POLICY IF EXISTS "Verified users can send messages" ON messages;
DROP POLICY IF EXISTS "messages_insert_approved_sender" ON messages;

CREATE POLICY "messages_insert_approved_sender" ON messages FOR INSERT
WITH CHECK (
  (select auth.uid()) = sender_id
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND verification_status = 'approved'
  )
);

DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can update messages sent to them" ON messages;
DROP POLICY IF EXISTS "Approved users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Verified users can update their own messages" ON messages;
DROP POLICY IF EXISTS "messages_update_sender_only" ON messages;

CREATE POLICY "messages_update_sender_only" ON messages FOR UPDATE
USING ((select auth.uid()) = sender_id);

-- ============================================================================
-- CONVERSATIONS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;

CREATE POLICY "conversations_select_participants" ON conversations FOR SELECT
USING (
  (select auth.uid()) = created_by
  OR EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conversations.id
    AND user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;

CREATE POLICY "conversations_insert_approved" ON conversations FOR INSERT
WITH CHECK (
  (select auth.uid()) = created_by
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND verification_status = 'approved'
  )
);

DROP POLICY IF EXISTS "Conversation creators can update their conversations" ON conversations;

CREATE POLICY "conversations_update_creator" ON conversations FOR UPDATE
USING ((select auth.uid()) = created_by);

-- ============================================================================
-- CONVERSATION_PARTICIPANTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own participation records" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view conversation participants for their conversations" ON conversation_participants;

CREATE POLICY "conversation_participants_select" ON conversation_participants FOR SELECT
USING (
  (select auth.uid()) = user_id
  OR EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
    AND cp.user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can join conversations they're invited to" ON conversation_participants;
DROP POLICY IF EXISTS "Users can leave conversations they're part of" ON conversation_participants;

CREATE POLICY "conversation_participants_delete" ON conversation_participants FOR DELETE
USING ((select auth.uid()) = user_id);

-- ============================================================================
-- CONVERSATIONS_V2 TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations_v2;

CREATE POLICY "conversations_v2_select" ON conversations_v2 FOR SELECT
USING (
  (select auth.uid()) = requester_id OR (select auth.uid()) = helper_id
);

DROP POLICY IF EXISTS "Users can create conversations for help requests" ON conversations_v2;

CREATE POLICY "conversations_v2_insert" ON conversations_v2 FOR INSERT
WITH CHECK (
  (select auth.uid()) = helper_id
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND verification_status = 'approved'
  )
);

DROP POLICY IF EXISTS "Participants can update conversation status" ON conversations_v2;

CREATE POLICY "conversations_v2_update" ON conversations_v2 FOR UPDATE
USING (
  (select auth.uid()) = requester_id OR (select auth.uid()) = helper_id
);

-- ============================================================================
-- MESSAGES_V2 TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Participants can view messages in their conversations" ON messages_v2;

CREATE POLICY "messages_v2_select" ON messages_v2 FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations_v2
    WHERE id = messages_v2.conversation_id
    AND ((select auth.uid()) = requester_id OR (select auth.uid()) = helper_id)
  )
);

DROP POLICY IF EXISTS "Participants can send messages in their conversations" ON messages_v2;

CREATE POLICY "messages_v2_insert" ON messages_v2 FOR INSERT
WITH CHECK (
  (select auth.uid()) = sender_id
  AND EXISTS (
    SELECT 1 FROM conversations_v2
    WHERE id = conversation_id
    AND ((select auth.uid()) = requester_id OR (select auth.uid()) = helper_id)
  )
);

-- ============================================================================
-- BUG_REPORTS TABLE
-- Consolidate: user view + admin view, user update + admin update
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own bug reports" ON bug_reports;
DROP POLICY IF EXISTS "Admins can view all bug reports" ON bug_reports;

CREATE POLICY "bug_reports_select" ON bug_reports FOR SELECT
USING (
  (select auth.uid()) = user_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

DROP POLICY IF EXISTS "Users can create bug reports" ON bug_reports;

CREATE POLICY "bug_reports_insert" ON bug_reports FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own open bug reports" ON bug_reports;
DROP POLICY IF EXISTS "Admins can update all bug reports" ON bug_reports;

CREATE POLICY "bug_reports_update" ON bug_reports FOR UPDATE
USING (
  ((select auth.uid()) = user_id AND status = 'open')
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

-- ============================================================================
-- USER_RESTRICTIONS TABLE
-- Consolidate: user view + admin manage
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own restrictions" ON user_restrictions;
DROP POLICY IF EXISTS "Only admins can manage restrictions" ON user_restrictions;
DROP POLICY IF EXISTS "Admins can manage restrictions" ON user_restrictions;

CREATE POLICY "user_restrictions_select" ON user_restrictions FOR SELECT
USING (
  (select auth.uid()) = user_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

CREATE POLICY "user_restrictions_admin_manage" ON user_restrictions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

-- ============================================================================
-- USER_PRESENCE TABLE
-- Consolidate: user manage own + view all
-- ============================================================================

DROP POLICY IF EXISTS "Users can view all presence" ON user_presence;
DROP POLICY IF EXISTS "Users can update own presence" ON user_presence;
DROP POLICY IF EXISTS "Users can manage their own presence" ON user_presence;

CREATE POLICY "user_presence_select" ON user_presence FOR SELECT
USING (true);  -- All authenticated users can view presence

CREATE POLICY "user_presence_manage_own" ON user_presence
FOR ALL
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- ============================================================================
-- SITE_CONTENT TABLE (CMS)
-- Consolidate: public read + admin view
-- ============================================================================

DROP POLICY IF EXISTS "Public can read published site content" ON site_content;
DROP POLICY IF EXISTS "Admins can view all site content" ON site_content;

CREATE POLICY "site_content_select" ON site_content FOR SELECT
USING (
  (status = 'published')
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

DROP POLICY IF EXISTS "Admins can insert site content" ON site_content;

CREATE POLICY "site_content_insert" ON site_content FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

DROP POLICY IF EXISTS "Admins can update site content" ON site_content;

CREATE POLICY "site_content_update" ON site_content FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

DROP POLICY IF EXISTS "Admins can delete site content" ON site_content;

CREATE POLICY "site_content_delete" ON site_content FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

-- ============================================================================
-- COMMUNITY_UPDATES TABLE (CMS)
-- Consolidate: public read + admin view
-- ============================================================================

DROP POLICY IF EXISTS "Public can read published community updates" ON community_updates;
DROP POLICY IF EXISTS "Admins can view all community updates" ON community_updates;

CREATE POLICY "community_updates_select" ON community_updates FOR SELECT
USING (
  (status = 'published')
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

DROP POLICY IF EXISTS "Admins can insert community updates" ON community_updates;

CREATE POLICY "community_updates_insert" ON community_updates FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

DROP POLICY IF EXISTS "Admins can update community updates" ON community_updates;

CREATE POLICY "community_updates_update" ON community_updates FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

DROP POLICY IF EXISTS "Admins can delete community updates" ON community_updates;

CREATE POLICY "community_updates_delete" ON community_updates FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

-- ============================================================================
-- CONTENT_REVISIONS TABLE (CMS)
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view content revisions" ON content_revisions;

CREATE POLICY "content_revisions_select" ON content_revisions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

DROP POLICY IF EXISTS "Admins can insert content revisions" ON content_revisions;

CREATE POLICY "content_revisions_insert" ON content_revisions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

-- ============================================================================
-- CALENDAR_EVENTS TABLE
-- Consolidate: public read + admin view + admin manage
-- ============================================================================

DROP POLICY IF EXISTS "Public can read published calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Admins can view all calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Admins can manage calendar events" ON calendar_events;

CREATE POLICY "calendar_events_select" ON calendar_events FOR SELECT
USING (
  (status = 'published')
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

CREATE POLICY "calendar_events_admin_manage" ON calendar_events
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

-- ============================================================================
-- EVENT_CATEGORIES TABLE
-- Consolidate: public read + admin view + admin manage
-- ============================================================================

DROP POLICY IF EXISTS "Public can read active event categories" ON event_categories;
DROP POLICY IF EXISTS "Admins can view all event categories" ON event_categories;
DROP POLICY IF EXISTS "Admins can manage event categories" ON event_categories;

CREATE POLICY "event_categories_select" ON event_categories FOR SELECT
USING (
  (is_active = true)
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

CREATE POLICY "event_categories_admin_manage" ON event_categories
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

-- ============================================================================
-- GOOGLE_CALENDAR_SYNC TABLE
-- Consolidate: admin view + admin manage
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view google calendar sync" ON google_calendar_sync;
DROP POLICY IF EXISTS "Admins can manage google calendar sync" ON google_calendar_sync;

CREATE POLICY "google_calendar_sync_admin_all" ON google_calendar_sync
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

-- ============================================================================
-- SYNC_CONFLICT_LOG TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view sync conflict logs" ON sync_conflict_log;

CREATE POLICY "sync_conflict_log_admin_select" ON sync_conflict_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

-- ============================================================================
-- VERIFICATION_STATUS_CHANGES TABLE
-- Consolidate: admin view + user own view
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all verification status changes" ON verification_status_changes;
DROP POLICY IF EXISTS "Users can view their own status changes" ON verification_status_changes;

CREATE POLICY "verification_status_changes_select" ON verification_status_changes FOR SELECT
USING (
  (select auth.uid()) = user_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

-- ============================================================================
-- AUDIT_LOGS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Only admins can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_admin_select_only" ON audit_logs;

CREATE POLICY "audit_logs_admin_select_only" ON audit_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

DROP POLICY IF EXISTS "Only admins can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_admin_insert_only" ON audit_logs;

CREATE POLICY "audit_logs_admin_insert_only" ON audit_logs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

-- ============================================================================
-- CONTACT_EXCHANGES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own contact exchanges" ON contact_exchanges;

CREATE POLICY "contact_exchanges_select" ON contact_exchanges FOR SELECT
USING ((select auth.uid()) IN (helper_id, requester_id));

DROP POLICY IF EXISTS "Helpers can create contact exchanges" ON contact_exchanges;

CREATE POLICY "contact_exchanges_insert" ON contact_exchanges FOR INSERT
WITH CHECK ((select auth.uid()) = helper_id);

DROP POLICY IF EXISTS "Users can update their own contact exchanges" ON contact_exchanges;
DROP POLICY IF EXISTS "Requester can update exchange status" ON contact_exchanges;
DROP POLICY IF EXISTS "Helper can revoke their contact share" ON contact_exchanges;

CREATE POLICY "contact_exchanges_update" ON contact_exchanges FOR UPDATE
USING ((select auth.uid()) IN (helper_id, requester_id));

-- ============================================================================
-- CONTACT_SHARING_HISTORY TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own sharing history" ON contact_sharing_history;

CREATE POLICY "contact_sharing_history_select" ON contact_sharing_history FOR SELECT
USING ((select auth.uid()) = user_id OR (select auth.uid()) = shared_with_user_id);

-- ============================================================================
-- MESSAGE_REPORTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view reports they created" ON message_reports;
DROP POLICY IF EXISTS "Users can view reports they made" ON message_reports;

CREATE POLICY "message_reports_select" ON message_reports FOR SELECT
USING (
  (select auth.uid()) = reported_by
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

DROP POLICY IF EXISTS "Users can create message reports" ON message_reports;
DROP POLICY IF EXISTS "Users can create reports" ON message_reports;

CREATE POLICY "message_reports_insert" ON message_reports FOR INSERT
WITH CHECK ((select auth.uid()) = reported_by);

-- ============================================================================
-- MESSAGE_AUDIT_LOG TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view audit logs for their messages" ON message_audit_log;
DROP POLICY IF EXISTS "Users can view their own audit log" ON message_audit_log;

CREATE POLICY "message_audit_log_select" ON message_audit_log FOR SELECT
USING (
  (select auth.uid()) = user_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

-- ============================================================================
-- MESSAGING_PREFERENCES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view and manage their own messaging preferences" ON messaging_preferences;

CREATE POLICY "messaging_preferences_manage_own" ON messaging_preferences
FOR ALL
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- ============================================================================
-- USER_PRIVACY_SETTINGS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage their own privacy settings" ON user_privacy_settings;

CREATE POLICY "user_privacy_settings_manage_own" ON user_privacy_settings
FOR ALL
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- ============================================================================
-- DATA_EXPORT_REQUESTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage their own data exports" ON data_export_requests;

CREATE POLICY "data_export_requests_manage_own" ON data_export_requests
FOR ALL
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- ============================================================================
-- MESSAGE_THREADS TABLE (if exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'message_threads') THEN
    DROP POLICY IF EXISTS "Users can view their own threads" ON message_threads;
    DROP POLICY IF EXISTS "Users can create threads they're part of" ON message_threads;
    DROP POLICY IF EXISTS "Users can update their own threads" ON message_threads;

    EXECUTE 'CREATE POLICY "message_threads_select" ON message_threads FOR SELECT
      USING ((select auth.uid()) = ANY(participant_ids))';

    EXECUTE 'CREATE POLICY "message_threads_insert" ON message_threads FOR INSERT
      WITH CHECK ((select auth.uid()) = ANY(participant_ids))';

    EXECUTE 'CREATE POLICY "message_threads_update" ON message_threads FOR UPDATE
      USING ((select auth.uid()) = ANY(participant_ids))';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';

  RAISE NOTICE 'RLS Performance Migration Complete';
  RAISE NOTICE 'Total policies in public schema: %', policy_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '  - All auth.uid() calls wrapped in (select auth.uid())';
  RAISE NOTICE '  - Duplicate permissive policies consolidated';
  RAISE NOTICE '';
  RAISE NOTICE 'Re-run Supabase linter to verify warnings are resolved';
END $$;
