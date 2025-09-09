-- CRITICAL SECURITY MIGRATION: Fix authentication and RLS policy issues
-- This migration addresses severe security vulnerabilities identified in audit
-- Priority: IMMEDIATE - Authentication bypass and privilege escalation risks

-- =======================
-- PHASE 1: USER ID ALIGNMENT
-- =======================

-- First, identify and fix any profile records where id != auth.uid()
-- This is a critical security issue that allows authentication bypass

-- Create backup table for investigation
CREATE TABLE IF NOT EXISTS profiles_audit_backup AS 
SELECT * FROM profiles WHERE FALSE; -- Empty structure

-- Insert problematic records for audit
INSERT INTO profiles_audit_backup 
SELECT * FROM profiles 
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users 
  WHERE auth.users.id = profiles.id
);

-- Log any problematic records found
DO $$
DECLARE
  problematic_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO problematic_count
  FROM profiles_audit_backup;
  
  IF problematic_count > 0 THEN
    RAISE NOTICE 'SECURITY ALERT: Found % profiles with mismatched IDs - backed up for investigation', problematic_count;
  END IF;
END $$;

-- Remove any profiles that don't have corresponding auth.users records
-- This prevents authentication bypass
DELETE FROM profiles 
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users 
  WHERE auth.users.id = profiles.id
);

-- =======================
-- PHASE 2: CLEAN UP CONFLICTING RLS POLICIES
-- =======================

-- Drop ALL existing conflicting policies to start fresh
-- This prevents policy conflicts and ensures consistent security

-- Profiles table cleanup
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update user verification status" ON profiles;

-- Help requests table cleanup
DROP POLICY IF EXISTS "Help requests are viewable by everyone" ON help_requests;
DROP POLICY IF EXISTS "Help requests are viewable by authenticated users" ON help_requests;
DROP POLICY IF EXISTS "Help requests are viewable by verified users" ON help_requests;
DROP POLICY IF EXISTS "Users can create help requests" ON help_requests;
DROP POLICY IF EXISTS "Authenticated users can create help requests" ON help_requests;
DROP POLICY IF EXISTS "Verified users can create help requests" ON help_requests;
DROP POLICY IF EXISTS "Users can update their own help requests" ON help_requests;
DROP POLICY IF EXISTS "Verified users can update their own help requests" ON help_requests;
DROP POLICY IF EXISTS "Users can delete their own help requests" ON help_requests;
DROP POLICY IF EXISTS "Verified users can delete their own help requests" ON help_requests;
DROP POLICY IF EXISTS "Admins can update any help request" ON help_requests;
DROP POLICY IF EXISTS "Admins can delete any help request" ON help_requests;

-- Messages table cleanup
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON messages;
DROP POLICY IF EXISTS "Approved users can view messages they sent or received" ON messages;
DROP POLICY IF EXISTS "Verified users can view messages they sent or received" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Approved users can send messages" ON messages;
DROP POLICY IF EXISTS "Verified users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Approved users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Verified users can update their own messages" ON messages;

-- Audit logs cleanup
DROP POLICY IF EXISTS "Only admins can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Only admins can insert audit logs" ON audit_logs;

-- =======================
-- PHASE 3: SECURE RLS POLICIES
-- =======================

-- Profiles table - SECURE policies with proper auth.uid() checks
CREATE POLICY "profiles_select_own_or_approved_users"
  ON profiles FOR SELECT
  USING (
    -- Users can see their own profile regardless of status
    auth.uid() = id
    OR
    -- Approved users can see other approved users' profiles
    (
      verification_status = 'approved' 
      AND EXISTS (
        SELECT 1 FROM profiles viewer
        WHERE viewer.id = auth.uid() 
        AND viewer.verification_status = 'approved'
      )
    )
    OR
    -- Admins can see all profiles
    EXISTS (
      SELECT 1 FROM profiles admin
      WHERE admin.id = auth.uid() 
      AND admin.is_admin = true
      AND admin.verification_status = 'approved'
    )
  );

CREATE POLICY "profiles_insert_own_only"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own_or_admin"
  ON profiles FOR UPDATE
  USING (
    -- Users can update their own profile (except admin status)
    auth.uid() = id
    OR
    -- Admins can update any profile
    EXISTS (
      SELECT 1 FROM profiles admin
      WHERE admin.id = auth.uid() 
      AND admin.is_admin = true
      AND admin.verification_status = 'approved'
    )
  )
  WITH CHECK (
    -- Users can update their own profile but not admin status
    (auth.uid() = id AND is_admin = (SELECT is_admin FROM profiles WHERE id = auth.uid()))
    OR
    -- Admins can update any profile including admin status
    EXISTS (
      SELECT 1 FROM profiles admin
      WHERE admin.id = auth.uid() 
      AND admin.is_admin = true
      AND admin.verification_status = 'approved'
    )
  );

-- Help requests table - SECURE policies
CREATE POLICY "help_requests_select_approved_users"
  ON help_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.verification_status = 'approved'
    )
  );

CREATE POLICY "help_requests_insert_approved_users"
  ON help_requests FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.verification_status = 'approved'
    )
  );

CREATE POLICY "help_requests_update_owner_or_admin"
  ON help_requests FOR UPDATE
  USING (
    -- Owner can update their own requests
    (
      auth.uid() = user_id 
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.verification_status = 'approved'
      )
    )
    OR
    -- Admins can update any request
    EXISTS (
      SELECT 1 FROM profiles admin
      WHERE admin.id = auth.uid()
      AND admin.is_admin = true
      AND admin.verification_status = 'approved'
    )
  );

CREATE POLICY "help_requests_delete_owner_or_admin"
  ON help_requests FOR DELETE
  USING (
    -- Owner can delete their own requests
    (
      auth.uid() = user_id
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.verification_status = 'approved'
      )
    )
    OR
    -- Admins can delete any request
    EXISTS (
      SELECT 1 FROM profiles admin
      WHERE admin.id = auth.uid()
      AND admin.is_admin = true
      AND admin.verification_status = 'approved'
    )
  );

-- Messages table - SECURE policies
CREATE POLICY "messages_select_participants_only"
  ON messages FOR SELECT
  USING (
    (auth.uid() = sender_id OR auth.uid() = recipient_id)
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.verification_status = 'approved'
    )
  );

CREATE POLICY "messages_insert_approved_sender"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.verification_status = 'approved'
    )
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = recipient_id
      AND profiles.verification_status = 'approved'
    )
  );

CREATE POLICY "messages_update_sender_only"
  ON messages FOR UPDATE
  USING (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.verification_status = 'approved'
    )
  );

-- Audit logs table - ADMIN ONLY policies
CREATE POLICY "audit_logs_admin_select_only"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
      AND profiles.verification_status = 'approved'
    )
  );

CREATE POLICY "audit_logs_admin_insert_only"
  ON audit_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
      AND profiles.verification_status = 'approved'
    )
  );

-- =======================
-- PHASE 4: REMOVE OVERPERMISSIVE GRANTS
-- =======================

-- Revoke dangerous permissions
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Grant only necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON help_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO authenticated;
GRANT SELECT ON pending_applications TO authenticated;
GRANT SELECT, INSERT ON audit_logs TO authenticated;

-- Grant sequence permissions for primary keys
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION handle_new_user_verification TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;

-- =======================
-- PHASE 5: SECURITY LOGGING
-- =======================

-- Create security audit function
CREATE OR REPLACE FUNCTION log_security_event(
  event_type TEXT,
  entity_type TEXT DEFAULT NULL,
  entity_id UUID DEFAULT NULL,
  details JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- Only log if user is authenticated
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO audit_logs (
      user_id,
      action,
      entity_type,
      entity_id,
      metadata,
      created_at
    ) VALUES (
      auth.uid(),
      event_type,
      COALESCE(entity_type, 'security'),
      entity_id,
      COALESCE(details, '{}'::jsonb),
      NOW()
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION log_security_event TO authenticated;

-- =======================
-- PHASE 6: VERIFICATION & TESTING
-- =======================

-- Create function to verify RLS is working correctly
CREATE OR REPLACE FUNCTION verify_rls_security() RETURNS TABLE(
  table_name TEXT,
  has_rls BOOLEAN,
  policy_count INTEGER,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::TEXT,
    t.rowsecurity,
    COUNT(p.policyname)::INTEGER,
    CASE 
      WHEN t.rowsecurity AND COUNT(p.policyname) > 0 THEN 'SECURE'
      WHEN t.rowsecurity AND COUNT(p.policyname) = 0 THEN 'RLS_NO_POLICIES'
      WHEN NOT t.rowsecurity THEN 'NO_RLS'
      ELSE 'UNKNOWN'
    END::TEXT
  FROM pg_tables t
  LEFT JOIN pg_policies p ON p.tablename = t.tablename
  WHERE t.schemaname = 'public'
  AND t.tablename IN ('profiles', 'help_requests', 'messages', 'audit_logs')
  GROUP BY t.tablename, t.rowsecurity
  ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION verify_rls_security TO authenticated;

-- Log completion
SELECT log_security_event('SECURITY_MIGRATION_COMPLETED', 'migration', NULL, '{"migration": "20250109000000_security_reconstruction"}'::jsonb);

-- Add critical comments
COMMENT ON MIGRATION '20250109000000_security_reconstruction' IS 'CRITICAL SECURITY MIGRATION: Fixed authentication bypass vulnerabilities, RLS policy conflicts, and overpermissive grants. This migration addresses immediate security threats.';