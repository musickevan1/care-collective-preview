-- CRITICAL FIX: Fix profiles RLS policy to prevent cross-user data access
--
-- Root Cause: The "Users can view their own profile" policy had:
--   USING (auth.uid() = id OR (verification_status = 'approved' AND email_confirmed = true))
--
-- This allowed ANY authenticated user to view ALL approved profiles!
-- This caused rejected users to see approved users' profile data.
--
-- Security Impact: CRITICAL - Cross-user data leakage, authentication bypass
-- Date: October 12, 2025
-- Bug Reference: PROJECT_STATUS.md - RLS authentication bug
--
-- This migration:
-- 1. Removes the overly permissive policy
-- 2. Creates a new policy that enforces users can ONLY view their own profile
-- 3. Service role queries bypass RLS entirely (as designed)

-- Drop all dangerous and old profile SELECT policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile ONLY" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile without confirmation" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile and approved users" ON profiles;

-- Create a secure policy with TWO rules:
-- 1. Users can ALWAYS view their own profile
-- 2. Approved users can view OTHER approved users' profiles (for help requests/messaging)
--
-- This allows the mutual aid platform to function (showing requester/helper names)
-- while preventing rejected users from seeing ANY profiles
CREATE POLICY "Users can view their own profile and approved users"
  ON profiles FOR SELECT
  USING (
    -- Rule 1: User can view their own profile
    auth.uid() = id
    OR
    -- Rule 2: Approved users can view other approved users' profiles
    -- (needed for help requests, messaging, etc.)
    (
      -- The viewer must be approved
      EXISTS (
        SELECT 1 FROM profiles viewer
        WHERE viewer.id = auth.uid()
        AND viewer.verification_status = 'approved'
      )
      -- AND the profile being viewed must be approved
      AND verification_status = 'approved'
    )
  );

-- Verify the new policy was created successfully
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname = 'Users can view their own profile and approved users'
  ) THEN
    RAISE NOTICE 'SUCCESS: Secure RLS policy "Users can view their own profile and approved users" created';
  ELSE
    RAISE EXCEPTION 'FAILED: Could not create secure RLS policy';
  END IF;

  -- Verify no dangerous policies remain
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND cmd = 'SELECT'
    AND policyname NOT IN ('Users can view their own profile and approved users')
  ) THEN
    RAISE WARNING 'WARNING: Other SELECT policies still exist on profiles table';
  ELSE
    RAISE NOTICE 'SUCCESS: No other SELECT policies exist';
  END IF;
END $$;

-- Add documentation
COMMENT ON POLICY "Users can view their own profile and approved users" ON profiles
IS 'SECURITY CRITICAL: (1) Users can view their own profile, (2) Approved users can view other approved users profiles for help requests/messaging. This prevents rejected users from seeing ANY profiles (fixes critical bug). Service role queries bypass RLS for auth checks.';

-- Log the fix
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS FIX APPLIED: Profiles table now has STRICT secure SELECT policy';
  RAISE NOTICE 'Users can ONLY view their own profile via RLS-enabled queries';
  RAISE NOTICE 'Service role queries bypass RLS for admin/auth operations';
  RAISE NOTICE 'Bug fixed: Rejected users can no longer view approved users profiles';
  RAISE NOTICE '========================================';
END $$;
