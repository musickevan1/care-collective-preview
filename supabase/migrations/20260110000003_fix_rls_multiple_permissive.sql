-- Migration: Fix Multiple Permissive RLS Policies
-- Description: Replaces FOR ALL policies with separate INSERT/UPDATE/DELETE policies
--              to resolve Supabase linter warning about multiple permissive policies
--
-- Issue: FOR ALL policies include SELECT, causing overlap with dedicated SELECT policies
-- Solution: Replace FOR ALL with specific operation policies
--
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies

-- ============================================================================
-- CALENDAR_EVENTS TABLE
-- Replace calendar_events_admin_manage (FOR ALL) with INSERT/UPDATE/DELETE
-- ============================================================================

DROP POLICY IF EXISTS "calendar_events_admin_manage" ON calendar_events;

CREATE POLICY "calendar_events_insert" ON calendar_events
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

CREATE POLICY "calendar_events_update" ON calendar_events
FOR UPDATE
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

CREATE POLICY "calendar_events_delete" ON calendar_events
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

-- ============================================================================
-- EVENT_CATEGORIES TABLE
-- Replace event_categories_admin_manage (FOR ALL) with INSERT/UPDATE/DELETE
-- ============================================================================

DROP POLICY IF EXISTS "event_categories_admin_manage" ON event_categories;

CREATE POLICY "event_categories_insert" ON event_categories
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

CREATE POLICY "event_categories_update" ON event_categories
FOR UPDATE
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

CREATE POLICY "event_categories_delete" ON event_categories
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

-- ============================================================================
-- USER_PRESENCE TABLE
-- Replace user_presence_manage_own (FOR ALL) with INSERT/UPDATE/DELETE
-- Also drop stale policy "Users can view all presence data" if it exists
-- ============================================================================

DROP POLICY IF EXISTS "user_presence_manage_own" ON user_presence;
DROP POLICY IF EXISTS "Users can view all presence data" ON user_presence;

CREATE POLICY "user_presence_insert" ON user_presence
FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "user_presence_update" ON user_presence
FOR UPDATE
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "user_presence_delete" ON user_presence
FOR DELETE
USING ((select auth.uid()) = user_id);

-- ============================================================================
-- USER_RESTRICTIONS TABLE
-- Replace user_restrictions_admin_manage (FOR ALL) with INSERT/UPDATE/DELETE
-- ============================================================================

DROP POLICY IF EXISTS "user_restrictions_admin_manage" ON user_restrictions;

CREATE POLICY "user_restrictions_insert" ON user_restrictions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

CREATE POLICY "user_restrictions_update" ON user_restrictions
FOR UPDATE
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

CREATE POLICY "user_restrictions_delete" ON user_restrictions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
    AND verification_status = 'approved'
  )
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  warning_count INTEGER;
BEGIN
  -- Count policies that might still cause warnings
  SELECT COUNT(*) INTO warning_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename IN ('calendar_events', 'event_categories', 'user_presence', 'user_restrictions')
  AND cmd = 'ALL';

  IF warning_count > 0 THEN
    RAISE WARNING 'Found % FOR ALL policies remaining on target tables', warning_count;
  ELSE
    RAISE NOTICE 'Multiple Permissive Policies Fix Complete';
    RAISE NOTICE '';
    RAISE NOTICE 'Changes made:';
    RAISE NOTICE '  - calendar_events: Replaced FOR ALL with INSERT/UPDATE/DELETE';
    RAISE NOTICE '  - event_categories: Replaced FOR ALL with INSERT/UPDATE/DELETE';
    RAISE NOTICE '  - user_presence: Replaced FOR ALL with INSERT/UPDATE/DELETE';
    RAISE NOTICE '  - user_restrictions: Replaced FOR ALL with INSERT/UPDATE/DELETE';
    RAISE NOTICE '';
    RAISE NOTICE 'Re-run Supabase linter to verify warnings are resolved';
  END IF;
END $$;
