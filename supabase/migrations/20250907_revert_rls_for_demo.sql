-- Revert RLS policies for help_requests table to allow demo functionality
-- This reverts the overly restrictive email confirmation requirements back to the original simpler policies
-- Reference: 20240811000000_initial_schema.sql (original working policies)

-- Drop the current restrictive policies that require email confirmation
DROP POLICY IF EXISTS "Help requests are viewable by verified users" ON help_requests;
DROP POLICY IF EXISTS "Verified users can create help requests" ON help_requests;
DROP POLICY IF EXISTS "Verified users can update their own help requests" ON help_requests;
DROP POLICY IF EXISTS "Verified users can delete their own help requests" ON help_requests;

-- Restore the original simpler RLS policies that work with our authentication system
-- These policies only require authentication, not complex verification status + email confirmation

CREATE POLICY "Help requests are viewable by authenticated users" 
  ON help_requests FOR SELECT 
  USING (
    -- Allow viewing for authenticated users who are approved (basic check)
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
        AND profiles.verification_status = 'approved'
    )
  );

CREATE POLICY "Authenticated users can create help requests" 
  ON help_requests FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    -- Only require approval status, not email confirmation
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
        AND profiles.verification_status = 'approved'
    )
  );

CREATE POLICY "Users can update their own help requests" 
  ON help_requests FOR UPDATE 
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
        AND profiles.verification_status = 'approved'
    )
  );

CREATE POLICY "Users can delete their own help requests" 
  ON help_requests FOR DELETE 
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
        AND profiles.verification_status = 'approved'
    )
  );

-- Also simplify messages policies for consistency
DROP POLICY IF EXISTS "Verified users can view messages they sent or received" ON messages;
DROP POLICY IF EXISTS "Verified users can send messages" ON messages;
DROP POLICY IF EXISTS "Verified users can update their own messages" ON messages;

CREATE POLICY "Approved users can view messages they sent or received" 
  ON messages FOR SELECT 
  USING (
    (auth.uid() = sender_id OR auth.uid() = recipient_id) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
        AND profiles.verification_status = 'approved'
    )
  );

CREATE POLICY "Approved users can send messages" 
  ON messages FOR INSERT 
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
        AND profiles.verification_status = 'approved'
    )
  );

CREATE POLICY "Approved users can update their own messages" 
  ON messages FOR UPDATE 
  USING (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
        AND profiles.verification_status = 'approved'
    )
  );

-- Add documentation
COMMENT ON POLICY "Authenticated users can create help requests" ON help_requests 
IS 'Simplified policy that allows approved users to create help requests without email confirmation requirement. Suitable for demo and development environments.';

COMMENT ON POLICY "Help requests are viewable by authenticated users" ON help_requests 
IS 'Simplified policy that allows approved users to view help requests without email confirmation requirement.';