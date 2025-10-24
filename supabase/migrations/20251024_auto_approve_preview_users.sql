-- Auto-approve users for preview/demo environment
-- This allows immediate access to help requests and messaging features
-- NOTE: In production, you may want to keep manual approval workflow

-- Update the user creation function to auto-approve
CREATE OR REPLACE FUNCTION public.handle_new_user_verification()
RETURNS trigger AS $$
BEGIN
  -- Auto-approve users in preview environment
  -- For production, change 'approved' back to 'pending'
  INSERT INTO public.profiles (id, name, location, application_reason, verification_status, applied_at, approved_at, approved_by, created_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'location',
    new.raw_user_meta_data->>'application_reason',
    'approved',  -- Auto-approve for preview
    new.created_at,
    new.created_at,  -- Auto-set approved_at
    new.id,  -- Self-approved for demo
    new.created_at
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(new.raw_user_meta_data->>'name', new.email),
    location = new.raw_user_meta_data->>'location',
    application_reason = new.raw_user_meta_data->>'application_reason',
    verification_status = COALESCE(profiles.verification_status, 'approved'),
    applied_at = COALESCE(profiles.applied_at, new.created_at);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also approve any existing pending users
UPDATE profiles
SET
  verification_status = 'approved',
  approved_at = NOW(),
  approved_by = id  -- Self-approved for demo
WHERE verification_status = 'pending';

-- Add comment explaining this is for preview
COMMENT ON FUNCTION public.handle_new_user_verification() IS
  'Auto-approves new users for preview environment. In production, change verification_status to ''pending'' to require manual approval.';
