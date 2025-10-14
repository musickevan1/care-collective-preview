-- Fix profiles RLS to allow community viewing without infinite recursion
--
-- ISSUE: Current RLS policy only allows users to view their own profile
-- This breaks Browse Requests because the help_requests_with_profiles view
-- needs to JOIN with profiles to show requester names, but RLS blocks it.
--
-- ROOT CAUSE: The view doesn't bypass RLS on underlying tables in Supabase.
-- Even with GRANT SELECT on the view, RLS is still enforced on JOINs.
--
-- SOLUTION: Allow approved users to view other approved users' basic profile info
-- Use a SECURITY DEFINER function to check approval status without recursion

-- Step 1: Create helper function to check if current user is approved
-- SECURITY DEFINER makes this function run with creator's privileges, bypassing RLS
CREATE OR REPLACE FUNCTION is_current_user_approved()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND verification_status = 'approved'
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_current_user_approved() TO authenticated;

-- Add comment
COMMENT ON FUNCTION is_current_user_approved() IS
'Security definer function to check if current user is approved. Bypasses RLS to prevent infinite recursion.';

-- Step 2: Drop the overly restrictive policy
DROP POLICY IF EXISTS "profiles_select_own_only" ON profiles;

-- Step 3: Create new policy that allows community viewing
CREATE POLICY "profiles_select_community_viewing"
ON profiles
FOR SELECT
TO authenticated
USING (
  -- Rule 1: Users can ALWAYS view their own profile
  auth.uid() = id
  OR
  -- Rule 2: Approved users can view OTHER approved users' profiles
  -- This enables Browse Requests, messaging, and other community features
  (
    -- Check if viewer is approved (using SECURITY DEFINER function to avoid recursion)
    is_current_user_approved()
    -- Check if the profile being viewed is also approved
    AND verification_status = 'approved'
  )
);

-- Add documentation
COMMENT ON POLICY "profiles_select_community_viewing" ON profiles IS
'Allows users to view their own profile OR allows approved users to view other approved users basic info (name, location). Uses SECURITY DEFINER function to prevent infinite recursion. Essential for Browse Requests and community features.';

-- Verification
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname = 'profiles_select_community_viewing'
  ) THEN
    RAISE NOTICE '✅ SUCCESS: profiles_select_community_viewing policy created';
  ELSE
    RAISE EXCEPTION '❌ FAILED: Could not create profiles RLS policy';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'is_current_user_approved'
  ) THEN
    RAISE NOTICE '✅ SUCCESS: is_current_user_approved() function created';
  ELSE
    RAISE EXCEPTION '❌ FAILED: Could not create helper function';
  END IF;
END $$;

-- Log the fix
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PROFILES RLS FIX APPLIED';
  RAISE NOTICE 'Approved users can now view other approved users profiles';
  RAISE NOTICE 'This enables Browse Requests page to show requester names';
  RAISE NOTICE 'Uses SECURITY DEFINER function to prevent infinite recursion';
  RAISE NOTICE '========================================';
END $$;
