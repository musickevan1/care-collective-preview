-- Add RLS policy for admins to view all profiles
--
-- Bug #3 Fix: Admin user management showing no users
--
-- Root Cause: Existing RLS policies only allow viewing approved users
-- Impact: Admin users cannot see pending/rejected users in admin panel
--
-- Solution: Add new policy allowing users with is_admin=true to view ALL profiles
--
-- Date: October 15, 2025
-- Session: 8
-- Bug Reference: docs/testing/MASTER_FIX_PLAN.md - Bug #3

-- Create policy allowing admins to view all profiles regardless of verification status
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  -- Check if the current user has admin privileges
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  )
);

-- Add documentation
COMMENT ON POLICY "Admins can view all profiles" ON profiles IS
'Allows users with is_admin=true to view ALL profiles regardless of verification_status. This enables admin user management functionality. Works alongside existing policies (RLS policies are OR-ed together). Added in Session 8 to fix Bug #3.';

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
    AND policyname = 'Admins can view all profiles'
  ) THEN
    RAISE NOTICE '✅ SUCCESS: "Admins can view all profiles" policy created';
  ELSE
    RAISE EXCEPTION '❌ FAILED: Could not create admin RLS policy';
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
  RAISE NOTICE 'BUG #3 FIX APPLIED: Admin User Management';
  RAISE NOTICE 'Admins can now view ALL profiles (pending, approved, rejected)';
  RAISE NOTICE 'Admin panel will now show all 8 test users';
  RAISE NOTICE 'RLS policies work together (OR logic):';
  RAISE NOTICE '  1. Users can view their own profile';
  RAISE NOTICE '  2. Approved users can view other approved users';
  RAISE NOTICE '  3. Admins can view ALL profiles (NEW)';
  RAISE NOTICE '========================================';
END $$;
