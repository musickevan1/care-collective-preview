-- Fix RLS policies for help_requests table to allow approved users to create requests
-- This addresses the "new row violates row-level security policy" error

-- Drop the overly restrictive policy that requires email confirmation
DROP POLICY IF EXISTS "Verified users can create help requests" ON help_requests;

-- Create a new policy that allows approved users to create help requests
-- Email confirmation is still preferred but not mandatory for demo/development
CREATE POLICY "Approved users can create help requests" 
  ON help_requests FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
        AND profiles.verification_status = 'approved'
        -- Removed email_confirmed requirement for demo functionality
    )
  );

-- Also update the SELECT policy to be more permissive for demo
DROP POLICY IF EXISTS "Help requests are viewable by verified users" ON help_requests;

CREATE POLICY "Help requests are viewable by approved users" 
  ON help_requests FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
        AND profiles.verification_status = 'approved'
        -- Removed email_confirmed requirement
    )
  );

-- Update UPDATE policy similarly  
DROP POLICY IF EXISTS "Verified users can update their own help requests" ON help_requests;

CREATE POLICY "Approved users can update their own help requests" 
  ON help_requests FOR UPDATE 
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
        AND profiles.verification_status = 'approved'
    )
  );

-- Update DELETE policy similarly
DROP POLICY IF EXISTS "Verified users can delete their own help requests" ON help_requests;

CREATE POLICY "Approved users can delete their own help requests" 
  ON help_requests FOR DELETE 
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
        AND profiles.verification_status = 'approved'
    )
  );

-- Add comment for documentation
COMMENT ON POLICY "Approved users can create help requests" ON help_requests 
IS 'Allows approved users to create help requests. Email confirmation removed for demo functionality.';