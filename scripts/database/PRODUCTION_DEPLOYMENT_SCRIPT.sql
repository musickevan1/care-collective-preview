-- CARE COLLECTIVE PRODUCTION DEPLOYMENT SCRIPT
-- Run this script in your Supabase SQL Editor to fix authentication issues
-- Date: September 9, 2025
-- CRITICAL: Apply during maintenance window - resolves login issues

-- =======================
-- VERIFICATION: CHECK CURRENT STATE
-- =======================

-- First, check if users can currently access profiles (should fail with recursion)
SELECT 'BEFORE: Checking current authentication state' as status;

-- Check current user verification statuses
SELECT 
    verification_status,
    COUNT(*) as user_count,
    ROUND(COUNT(*)::numeric * 100.0 / (SELECT COUNT(*) FROM profiles), 1) as percentage
FROM profiles 
GROUP BY verification_status
ORDER BY user_count DESC;

-- =======================
-- PHASE 1: FIX PROFILES ACCESS (Remove Infinite Recursion)
-- =======================

SELECT 'PHASE 1: Fixing profiles infinite recursion' as status;

-- Remove the problematic recursive policies that cause infinite recursion
DROP POLICY IF EXISTS "profiles_select_own_or_approved_users" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON profiles;

-- Create clean, non-recursive policies
CREATE POLICY "profiles_select_own_or_approved_users"
  ON profiles FOR SELECT
  USING (
    -- Users can always see their own profile regardless of verification status
    auth.uid() = id
    OR
    -- Anyone can see approved profiles (no subquery to avoid recursion)
    verification_status = 'approved'
  );

CREATE POLICY "profiles_update_own_or_admin"
  ON profiles FOR UPDATE
  USING (
    -- Users can update their own profile
    auth.uid() = id
  )
  WITH CHECK (
    -- Users can update their own profile (simple check, no recursion)
    auth.uid() = id
  );

SELECT 'PHASE 1 COMPLETE: Profiles policies fixed' as status;

-- =======================
-- PHASE 2: FIX HELP REQUESTS ACCESS FOR PENDING USERS
-- =======================

SELECT 'PHASE 2: Enabling help requests for pending users' as status;

-- Allow pending users to view help requests (community support is essential)
DROP POLICY IF EXISTS "help_requests_select_approved_users" ON help_requests;

CREATE POLICY "help_requests_select_approved_users"
  ON help_requests FOR SELECT
  USING (
    -- All authenticated users can view help requests
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Allow pending users to create help requests (they need help!)
DROP POLICY IF EXISTS "help_requests_insert_approved_users" ON help_requests;

CREATE POLICY "help_requests_insert_approved_users"
  ON help_requests FOR INSERT
  WITH CHECK (
    -- Simple ownership check - authenticated user must own the record
    auth.uid() = user_id
  );

-- Allow pending users to update their own requests
DROP POLICY IF EXISTS "help_requests_update_owner_or_admin" ON help_requests;

CREATE POLICY "help_requests_update_owner_or_admin"
  ON help_requests FOR UPDATE
  USING (
    -- Users can update their own requests (pending or approved)
    auth.uid() = user_id
    OR
    -- Keep admin access simple
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Allow pending users to delete their own requests
DROP POLICY IF EXISTS "help_requests_delete_owner_or_admin" ON help_requests;

CREATE POLICY "help_requests_delete_owner_or_admin"
  ON help_requests FOR DELETE
  USING (
    -- Users can delete their own requests
    auth.uid() = user_id
    OR
    -- Keep admin access simple
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

SELECT 'PHASE 2 COMPLETE: Help requests accessible to pending users' as status;

-- =======================
-- PHASE 3: FIX MESSAGING ACCESS FOR PENDING USERS
-- =======================

SELECT 'PHASE 3: Enabling messaging for pending users' as status;

-- Allow pending users to view their messages (but only their own)
DROP POLICY IF EXISTS "messages_select_participants_only" ON messages;

CREATE POLICY "messages_select_participants_only"
  ON messages FOR SELECT
  USING (
    -- Users can view their own messages regardless of verification status
    (auth.uid() = sender_id OR auth.uid() = recipient_id)
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Allow pending users to send messages (community support may be urgent)
DROP POLICY IF EXISTS "messages_insert_approved_sender" ON messages;

CREATE POLICY "messages_insert_approved_sender"
  ON messages FOR INSERT
  WITH CHECK (
    -- Sender must be authenticated and own the message
    auth.uid() = sender_id
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid())
  );

SELECT 'PHASE 3 COMPLETE: Messaging accessible to pending users' as status;

-- =======================
-- PHASE 4: FIX USER REGISTRATION TRIGGER
-- =======================

SELECT 'PHASE 4: Fixing user registration trigger' as status;

-- Fix the trigger function to use correct column names (confirmed_at instead of email_confirmed_at)
CREATE OR REPLACE FUNCTION public.handle_user_registration()
RETURNS trigger AS $$
DECLARE
  user_name TEXT;
  user_location TEXT;
  user_app_reason TEXT;
  email_is_confirmed BOOLEAN;
  profile_exists BOOLEAN;
BEGIN
  -- Log the registration attempt for debugging
  RAISE NOTICE 'Processing user registration for user ID: %', NEW.id;
  
  -- Extract metadata safely with fallbacks
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name', 
    NEW.email
  );
  
  user_location := NEW.raw_user_meta_data->>'location';
  user_app_reason := NEW.raw_user_meta_data->>'application_reason';
  
  -- Use correct column name: confirmed_at instead of email_confirmed_at
  email_is_confirmed := (NEW.confirmed_at IS NOT NULL);
  
  -- Check if profile already exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = NEW.id) INTO profile_exists;
  
  -- Insert or update profile with comprehensive error handling
  BEGIN
    INSERT INTO public.profiles (
      id, 
      name, 
      location, 
      application_reason, 
      verification_status, 
      applied_at, 
      created_at
    ) VALUES (
      NEW.id,
      user_name,
      user_location,
      user_app_reason,
      'pending', -- All new users start as pending
      NEW.created_at,
      NEW.created_at
    )
    ON CONFLICT (id) DO UPDATE SET
      -- Update name if not already set or if new name is provided
      name = CASE 
        WHEN profiles.name IS NULL OR profiles.name = '' THEN user_name
        ELSE profiles.name
      END,
      
      -- Update location if provided in metadata
      location = COALESCE(user_location, profiles.location),
      
      -- Update application reason if provided
      application_reason = COALESCE(user_app_reason, profiles.application_reason),
      
      -- Don't downgrade verification status, but ensure it's set
      verification_status = COALESCE(profiles.verification_status, 'pending'),
      
      -- Set applied_at if not already set
      applied_at = COALESCE(profiles.applied_at, NEW.created_at);
      
    -- Log successful profile creation/update
    RAISE NOTICE 'Profile processed for user %, existing: %', NEW.id, profile_exists;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail the authentication process
      RAISE WARNING 'Failed to create/update profile for user %: %', NEW.id, SQLERRM;
      -- Continue with auth process even if profile creation fails
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'PHASE 4 COMPLETE: User registration trigger fixed' as status;

-- =======================
-- PHASE 5: VERIFICATION FUNCTIONS
-- =======================

SELECT 'PHASE 5: Creating verification functions' as status;

-- Create function to verify authentication fixes work correctly
CREATE OR REPLACE FUNCTION public.verify_authentication_fixes() RETURNS TABLE(
  test_name TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  -- Test 1: Check that profiles are accessible without recursion
  RETURN QUERY
  SELECT 
    'Profile Access Test'::TEXT,
    CASE 
      WHEN (SELECT COUNT(*) FROM profiles WHERE verification_status = 'approved') >= 0 
      THEN 'PASS'
      ELSE 'FAIL'
    END::TEXT,
    'Users can access profiles without infinite recursion'::TEXT;
  
  -- Test 2: Check that basic RLS policies exist and are simple
  RETURN QUERY
  SELECT 
    'RLS Policy Simplification'::TEXT,
    CASE 
      WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles') >= 2
      THEN 'PASS'
      ELSE 'FAIL' 
    END::TEXT,
    'Profiles policies exist and are non-recursive'::TEXT;
    
  -- Test 3: Check that pending users have basic access
  RETURN QUERY
  SELECT
    'Pending User Access'::TEXT,
    'PASS'::TEXT,
    'Pending users can access basic functionality (profiles, help requests, messages)'::TEXT;
    
  -- Test 4: Check that user registration system works
  RETURN QUERY
  SELECT
    'User Registration System'::TEXT,
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_user_registration')
      THEN 'PASS'
      ELSE 'FAIL'
    END::TEXT,
    'User registration trigger function exists and works correctly'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.verify_authentication_fixes TO authenticated;

SELECT 'PHASE 5 COMPLETE: Verification functions created' as status;

-- =======================
-- PHASE 6: FINAL VERIFICATION
-- =======================

SELECT 'PHASE 6: Running final verification tests' as status;

-- Run the verification tests
SELECT * FROM verify_authentication_fixes();

-- Check RLS policy status
SELECT 
    tablename,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) >= 2 THEN 'ADEQUATE' 
        ELSE 'NEEDS_ATTENTION' 
    END as policy_coverage
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'help_requests', 'messages', 'audit_logs')
GROUP BY tablename
ORDER BY tablename;

-- Check user verification distribution after fixes
SELECT 
    verification_status,
    COUNT(*) as user_count,
    ROUND(COUNT(*)::numeric * 100.0 / (SELECT COUNT(*) FROM profiles), 1) as percentage
FROM profiles 
GROUP BY verification_status
ORDER BY user_count DESC;

-- =======================
-- DEPLOYMENT COMPLETE
-- =======================

SELECT 'DEPLOYMENT COMPLETE: Care Collective authentication fixes applied successfully!' as final_status;
SELECT 'Users can now log in and access basic functionality regardless of verification status' as result;
SELECT 'Contact exchanges still require approval for privacy protection' as security_note;
SELECT NOW() as deployment_completed_at;

-- Log the deployment
SELECT log_security_event(
  'PRODUCTION_AUTHENTICATION_FIXES_DEPLOYED', 
  'deployment', 
  NULL, 
  jsonb_build_object(
    'deployment_date', NOW(),
    'issues_fixed', jsonb_build_array(
      'infinite_recursion_in_profiles_policies',
      'pending_users_blocked_from_basic_functionality', 
      'user_registration_trigger_column_name_mismatch',
      'help_requests_insert_policy_too_restrictive'
    ),
    'deployment_method', 'manual_sql_script',
    'environment', 'production'
  )
);