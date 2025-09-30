-- Fix Help Requests RLS Policies - Remove duplicate/incorrect policies
-- Issue: Multiple SELECT policies with different permission levels exist on help_requests
-- This migration ensures only approved users (or admins) can view help requests

-- Drop all existing SELECT policies to start clean
DROP POLICY IF EXISTS "Help requests are viewable by everyone" ON help_requests;
DROP POLICY IF EXISTS "Help requests are viewable by authenticated users" ON help_requests;
DROP POLICY IF EXISTS "help_requests_select_approved_users" ON help_requests;

-- Create single, clear SELECT policy: approved users OR admins can view
CREATE POLICY "Approved users can view help requests"
  ON help_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.verification_status = 'approved' OR profiles.is_admin = true)
    )
  );

-- Documentation
COMMENT ON POLICY "Approved users can view help requests" ON help_requests
IS 'Allows approved users and admins to view help requests. Ensures gated community access control.';

-- Verify the policy is correctly created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'help_requests'
    AND policyname = 'Approved users can view help requests'
  ) THEN
    RAISE NOTICE 'RLS policy "Approved users can view help requests" created successfully';
  ELSE
    RAISE EXCEPTION 'Failed to create RLS policy';
  END IF;
END $$;
