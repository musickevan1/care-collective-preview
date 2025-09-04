-- Add email confirmation system for waitlist functionality
-- This migration adds email confirmation fields and updates policies to allow pending users access without email confirmation

-- Add email confirmation fields to profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS email_confirmed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient querying of email confirmation status
CREATE INDEX IF NOT EXISTS idx_profiles_email_confirmed ON profiles(email_confirmed);
CREATE INDEX IF NOT EXISTS idx_profiles_email_confirmed_at ON profiles(email_confirmed_at DESC);

-- Update existing users to have email confirmed (grandfathering existing users)
-- Only update users who were approved before this migration (they must have been verified somehow)
UPDATE profiles 
SET email_confirmed = true, 
    email_confirmed_at = COALESCE(approved_at, created_at)
WHERE verification_status = 'approved' 
  AND email_confirmed IS NULL;

-- Create updated function to handle new user verification setup with email confirmation
CREATE OR REPLACE FUNCTION public.handle_new_user_with_email_confirmation()
RETURNS trigger AS $$
BEGIN
  -- Insert new profile with email confirmation status based on Supabase auth
  INSERT INTO public.profiles (id, name, location, application_reason, verification_status, applied_at, email_confirmed, email_confirmed_at, created_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'location',
    new.raw_user_meta_data->>'application_reason',
    'pending',
    new.created_at,
    COALESCE(new.email_confirmed_at IS NOT NULL, false), -- Use Supabase's email confirmation status
    new.email_confirmed_at,
    new.created_at
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(new.raw_user_meta_data->>'name', new.email),
    location = new.raw_user_meta_data->>'location',
    application_reason = new.raw_user_meta_data->>'application_reason',
    verification_status = COALESCE(profiles.verification_status, 'pending'),
    applied_at = COALESCE(profiles.applied_at, new.created_at),
    email_confirmed = GREATEST(profiles.email_confirmed, COALESCE(new.email_confirmed_at IS NOT NULL, false)),
    email_confirmed_at = COALESCE(profiles.email_confirmed_at, new.email_confirmed_at);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the trigger to use the new function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_with_email_confirmation();

-- Create trigger to update email confirmation when Supabase confirms email
CREATE OR REPLACE FUNCTION public.handle_email_confirmation()
RETURNS trigger AS $$
BEGIN
  -- Update profile when email is confirmed in Supabase auth
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE profiles 
    SET email_confirmed = true,
        email_confirmed_at = NEW.email_confirmed_at
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for email confirmation updates
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_email_confirmation();

-- Update RLS policies to allow pending users to access their data without email confirmation
-- But require email confirmation for approved users accessing protected routes (handled in middleware)

-- Drop existing profile policies that might conflict
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create new policies that allow pending users to access their profile without email confirmation
CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (
    auth.uid() = id AND (
      -- Pending users can update their profile without email confirmation (for waitlist)
      verification_status = 'pending' OR
      -- Approved/rejected users need email confirmation for updates
      (verification_status IN ('approved', 'rejected') AND email_confirmed = true)
    )
  )
  WITH CHECK (
    auth.uid() = id AND (
      -- Same logic for updates
      verification_status = 'pending' OR
      (verification_status IN ('approved', 'rejected') AND email_confirmed = true)
    )
  );

-- Create policy for viewing profiles - allow pending users to view their own without email confirmation
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (
    auth.uid() = id OR
    -- Allow everyone to view approved users' basic info (existing behavior)
    (verification_status = 'approved' AND email_confirmed = true)
  );

-- Update help_requests policies to require email confirmation for approved users
-- But allow pending users to access if they ever get approved later
DROP POLICY IF EXISTS "Help requests are viewable by everyone" ON help_requests;
DROP POLICY IF EXISTS "Users can create help requests" ON help_requests;
DROP POLICY IF EXISTS "Users can update their own help requests" ON help_requests;
DROP POLICY IF EXISTS "Users can delete their own help requests" ON help_requests;

-- Create new help_requests policies with email confirmation requirements
CREATE POLICY "Help requests are viewable by verified users" 
  ON help_requests FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
        AND profiles.verification_status = 'approved' 
        AND profiles.email_confirmed = true
    )
  );

CREATE POLICY "Verified users can create help requests" 
  ON help_requests FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
        AND profiles.verification_status = 'approved' 
        AND profiles.email_confirmed = true
    )
  );

CREATE POLICY "Verified users can update their own help requests" 
  ON help_requests FOR UPDATE 
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
        AND profiles.verification_status = 'approved' 
        AND profiles.email_confirmed = true
    )
  );

CREATE POLICY "Verified users can delete their own help requests" 
  ON help_requests FOR DELETE 
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
        AND profiles.verification_status = 'approved' 
        AND profiles.email_confirmed = true
    )
  );

-- Update messages policies to require email confirmation for approved users
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

CREATE POLICY "Verified users can view messages they sent or received" 
  ON messages FOR SELECT 
  USING (
    (auth.uid() = sender_id OR auth.uid() = recipient_id) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
        AND profiles.verification_status = 'approved' 
        AND profiles.email_confirmed = true
    )
  );

CREATE POLICY "Verified users can send messages" 
  ON messages FOR INSERT 
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
        AND profiles.verification_status = 'approved' 
        AND profiles.email_confirmed = true
    )
  );

CREATE POLICY "Verified users can update their own messages" 
  ON messages FOR UPDATE 
  USING (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
        AND profiles.verification_status = 'approved' 
        AND profiles.email_confirmed = true
    )
  );

-- Update the pending_applications view to include email confirmation status
DROP VIEW IF EXISTS pending_applications;
CREATE OR REPLACE VIEW pending_applications AS
SELECT 
  p.id,
  p.name,
  p.location,
  p.application_reason,
  p.applied_at,
  p.verification_status,
  p.rejection_reason,
  p.email_confirmed,
  p.email_confirmed_at
FROM profiles p
WHERE p.verification_status = 'pending'
ORDER BY p.applied_at ASC;

-- Grant permissions for the updated view
GRANT SELECT ON pending_applications TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN profiles.email_confirmed IS 'Whether the user has confirmed their email address';
COMMENT ON COLUMN profiles.email_confirmed_at IS 'Timestamp when the user confirmed their email address';

-- Create function for admins to approve users (updates both verification and email confirmation)
CREATE OR REPLACE FUNCTION approve_user_application(
  user_id UUID,
  admin_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  user_exists BOOLEAN;
  admin_is_valid BOOLEAN;
BEGIN
  -- Check if user exists and is pending
  SELECT EXISTS(
    SELECT 1 FROM profiles 
    WHERE id = user_id AND verification_status = 'pending'
  ) INTO user_exists;
  
  -- Check if admin is valid
  SELECT EXISTS(
    SELECT 1 FROM profiles 
    WHERE id = admin_id 
      AND verification_status = 'approved' 
      AND is_admin = true
      AND email_confirmed = true
  ) INTO admin_is_valid;
  
  IF NOT user_exists OR NOT admin_is_valid THEN
    RETURN FALSE;
  END IF;
  
  -- Approve the user
  UPDATE profiles 
  SET 
    verification_status = 'approved',
    approved_at = NOW(),
    approved_by = admin_id,
    rejection_reason = NULL
  WHERE id = user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION approve_user_application(UUID, UUID) TO authenticated;