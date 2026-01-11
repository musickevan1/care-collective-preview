-- Sync email_confirmed from auth.users to profiles for existing users
-- This fixes users where Supabase auth email_confirmed_at is set but
-- profiles.email_confirmed was not synced (trigger didn't fire)

-- Update profiles where auth.users shows confirmed but profiles doesn't
UPDATE profiles p
SET
  email_confirmed = true,
  email_confirmed_at = u.email_confirmed_at
FROM auth.users u
WHERE p.id = u.id
  AND u.email_confirmed_at IS NOT NULL
  AND (p.email_confirmed = false OR p.email_confirmed IS NULL);

-- Log count of synced users for auditing
DO $$
DECLARE
  synced_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO synced_count
  FROM profiles p
  INNER JOIN auth.users u ON p.id = u.id
  WHERE u.email_confirmed_at IS NOT NULL
    AND p.email_confirmed = true
    AND p.email_confirmed_at = u.email_confirmed_at;

  RAISE NOTICE 'Email confirmation sync complete. Total confirmed users: %', synced_count;
END $$;
