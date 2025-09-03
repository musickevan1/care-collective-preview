-- Add user verification system for waitlist functionality
-- This migration adds verification status and related fields to the profiles table

-- Create verification status enum
DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add verification fields to profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS verification_status verification_status DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS application_reason TEXT,
  ADD COLUMN IF NOT EXISTS applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create index for efficient querying of verification status
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_applied_at ON profiles(applied_at DESC);

-- Update existing users to approved status (grandfathering existing users)
UPDATE profiles 
SET verification_status = 'approved', 
    approved_at = created_at 
WHERE verification_status = 'pending' 
  AND created_at < NOW();

-- Create function to handle new user verification setup
CREATE OR REPLACE FUNCTION public.handle_new_user_verification()
RETURNS trigger AS $$
BEGIN
  -- Update the existing handle_new_user function to set verification status
  INSERT INTO public.profiles (id, name, location, application_reason, verification_status, applied_at, created_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'location',
    new.raw_user_meta_data->>'application_reason',
    'pending',
    new.created_at,
    new.created_at
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(new.raw_user_meta_data->>'name', new.email),
    location = new.raw_user_meta_data->>'location',
    application_reason = new.raw_user_meta_data->>'application_reason',
    verification_status = COALESCE(profiles.verification_status, 'pending'),
    applied_at = COALESCE(profiles.applied_at, new.created_at);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the trigger to use the new function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_verification();

-- Update RLS policies to include verification status checks
-- Users can view their own profile regardless of verification status
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add policy for admin verification management
CREATE POLICY "Admins can update user verification status" 
  ON profiles FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile 
      WHERE admin_profile.id = auth.uid() 
        AND admin_profile.verification_status = 'approved'
        AND admin_profile.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles admin_profile 
      WHERE admin_profile.id = auth.uid() 
        AND admin_profile.verification_status = 'approved'
        AND admin_profile.is_admin = true
    )
  );

-- Create view for pending applications (admin use)
CREATE OR REPLACE VIEW pending_applications AS
SELECT 
  p.id,
  p.name,
  p.location,
  p.application_reason,
  p.applied_at,
  p.verification_status,
  p.rejection_reason
FROM profiles p
WHERE p.verification_status = 'pending'
ORDER BY p.applied_at ASC;

-- Grant permissions for the view
GRANT SELECT ON pending_applications TO authenticated;

-- Add comment for documentation
COMMENT ON COLUMN profiles.verification_status IS 'User verification status for waitlist system';
COMMENT ON COLUMN profiles.application_reason IS 'User provided reason for joining the platform';
COMMENT ON COLUMN profiles.applied_at IS 'Timestamp when user applied';
COMMENT ON COLUMN profiles.approved_at IS 'Timestamp when user was approved';
COMMENT ON COLUMN profiles.approved_by IS 'Admin who approved the user';
COMMENT ON COLUMN profiles.rejection_reason IS 'Reason provided when rejecting application';