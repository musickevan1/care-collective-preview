-- Fix Browse Requests Page RLS Policy
-- This migration fixes the overly restrictive RLS policy that prevented
-- anonymous users from viewing help requests on the browse page

-- Drop the restrictive policy that requires authentication and approval
DROP POLICY IF EXISTS "Help requests are viewable by authenticated users" ON help_requests;

-- Create a public policy that allows everyone to view help requests
-- This is appropriate for a community mutual aid platform where
-- people should be able to see requests for help without logging in first
CREATE POLICY "Help requests are viewable by everyone"
  ON help_requests FOR SELECT
  USING (true);

-- Add documentation explaining the security model
COMMENT ON POLICY "Help requests are viewable by everyone" ON help_requests
IS 'Allows public viewing of help requests to enable community browsing without authentication. This is appropriate for mutual aid platforms where discovery of needs is essential for community response.';

-- Note: This policy only affects SELECT operations
-- CREATE, UPDATE, and DELETE operations still require authentication and proper permissions