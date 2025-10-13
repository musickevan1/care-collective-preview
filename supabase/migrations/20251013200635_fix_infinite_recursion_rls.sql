-- Fix infinite recursion in profiles RLS policy
--
-- ISSUE: The current SELECT policy has an EXISTS subquery that queries the
-- profiles table to check if the current user is approved. This causes infinite
-- recursion because querying profiles triggers the same policy, which queries
-- profiles again, creating an infinite loop.
--
-- ERROR: infinite recursion detected in policy for relation "profiles"
--
-- ROOT CAUSE: RLS policy that references the same table it's protecting
--
-- SOLUTION: Simplify the policy to only allow users to view their own profile.
-- Middleware and page-level security checks will handle access control for
-- protected routes. Service role queries bypass RLS for admin operations.

-- Drop the problematic policy with EXISTS subquery
DROP POLICY IF EXISTS "Users can view their own profile and approved users" ON profiles;

-- Create a simple, non-recursive policy
-- Users can only view their own profile
CREATE POLICY "profiles_select_own_only"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- SECURITY NOTE: This is actually MORE secure than the previous policy
-- because users can't browse other users' profiles directly. They can only
-- see other users' information through help requests and conversations, which
-- have their own RLS policies.
--
-- The middleware at lib/supabase/middleware-edge.ts handles verification status
-- checks to block rejected/pending users from accessing protected routes.
