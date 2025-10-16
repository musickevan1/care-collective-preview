-- Fix infinite recursion in admin RLS policy
--
-- Problem: The "Admins can view all profiles" policy causes infinite recursion
-- because it queries the profiles table within the RLS check itself
--
-- Root Cause:
-- CREATE POLICY ... USING (
--   EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
-- )
-- This SELECT from profiles triggers RLS, which checks the same policy, causing recursion
--
-- Solution: Use SECURITY DEFINER function (bypasses RLS) to check admin status
--
-- Date: October 15, 2025
-- Session: 8
-- Bug Reference: docs/testing/MASTER_FIX_PLAN.md - Bug #3 (fix #2)

-- Step 1: Create helper function to check if current user is admin
-- SECURITY DEFINER makes this function run with creator's privileges, bypassing RLS
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_current_user_admin() TO authenticated;

-- Add comment
COMMENT ON FUNCTION is_current_user_admin() IS
'Security definer function to check if current user is admin. Bypasses RLS to prevent infinite recursion. Used by admin RLS policy.';

-- Step 2: Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Step 3: Create new policy using SECURITY DEFINER function
CREATE POLICY "Admins can view all profiles (no recursion)"
ON profiles FOR SELECT
TO authenticated
USING (
  -- Use SECURITY DEFINER function to check admin status (avoids recursion)
  is_current_user_admin()
);

-- Add documentation
COMMENT ON POLICY "Admins can view all profiles (no recursion)" ON profiles IS
'Allows users with is_admin=true to view ALL profiles regardless of verification_status. Uses SECURITY DEFINER function to prevent infinite recursion. Essential for admin user management. Added in Session 8 to fix Bug #3.';

-- Verification checks
DO $$
DECLARE
  policy_record RECORD;
  policy_count INTEGER;
BEGIN
  -- Verify the new policy was created successfully
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname = 'Admins can view all profiles (no recursion)'
  ) THEN
    RAISE NOTICE '✅ SUCCESS: "Admins can view all profiles (no recursion)" policy created';
  ELSE
    RAISE EXCEPTION '❌ FAILED: Could not create admin RLS policy';
  END IF;

  -- Verify the helper function exists
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'is_current_user_admin'
  ) THEN
    RAISE NOTICE '✅ SUCCESS: is_current_user_admin() function created';
  ELSE
    RAISE EXCEPTION '❌ FAILED: Could not create helper function';
  END IF;

  -- Count total SELECT policies on profiles
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'profiles'
  AND cmd = 'SELECT';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total SELECT policies on profiles table: %', policy_count;
  RAISE NOTICE 'Current SELECT policies on profiles table:';

  FOR policy_record IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND cmd = 'SELECT'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '  - %', policy_record.policyname;
  END LOOP;

  RAISE NOTICE '========================================';
END $$;

-- Log the fix
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'BUG #3 FIX APPLIED (v2): Admin User Management';
  RAISE NOTICE 'Fixed infinite recursion issue using SECURITY DEFINER function';
  RAISE NOTICE 'Admins can now view ALL profiles without recursion errors';
  RAISE NOTICE 'RLS policies work together (OR logic):';
  RAISE NOTICE '  1. Users can view their own profile';
  RAISE NOTICE '  2. Approved users can view other approved users (uses is_current_user_approved)';
  RAISE NOTICE '  3. Admins can view ALL profiles (uses is_current_user_admin) NEW';
  RAISE NOTICE '========================================';
END $$;
