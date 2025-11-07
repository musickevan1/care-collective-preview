-- Update user creation trigger to handle terms acceptance fields
-- This ensures terms_accepted_at and terms_version are captured from signup metadata

CREATE OR REPLACE FUNCTION public.handle_new_user_verification()
RETURNS trigger AS $$
BEGIN
  -- Auto-approve users in preview environment
  -- For production, change 'approved' back to 'pending'
  INSERT INTO public.profiles (
    id,
    name,
    location,
    application_reason,
    verification_status,
    applied_at,
    approved_at,
    approved_by,
    created_at,
    terms_accepted_at,
    terms_version
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'location',
    new.raw_user_meta_data->>'application_reason',
    'approved',  -- Auto-approve for preview
    new.created_at,
    new.created_at,  -- Auto-set approved_at
    new.id,  -- Self-approved for demo
    new.created_at,
    (new.raw_user_meta_data->>'terms_accepted_at')::timestamptz,
    COALESCE(new.raw_user_meta_data->>'terms_version', '1.0')
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(new.raw_user_meta_data->>'name', new.email),
    location = new.raw_user_meta_data->>'location',
    application_reason = new.raw_user_meta_data->>'application_reason',
    verification_status = COALESCE(profiles.verification_status, 'approved'),
    applied_at = COALESCE(profiles.applied_at, new.created_at),
    terms_accepted_at = COALESCE(
      (new.raw_user_meta_data->>'terms_accepted_at')::timestamptz,
      profiles.terms_accepted_at
    ),
    terms_version = COALESCE(
      new.raw_user_meta_data->>'terms_version',
      profiles.terms_version,
      '1.0'
    );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user_verification() IS
  'Auto-approves new users for preview environment and captures terms acceptance. In production, change verification_status to ''pending'' to require manual approval.';
