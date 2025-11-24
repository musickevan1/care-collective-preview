-- Migration: Add Profile Picture Support
-- Purpose: Enable user avatars for Phase 2.3 messaging UI enhancements
-- Date: 2025-11-23
-- Phase: 2.3 - Messaging Visual Design Polish

-- Add avatar_url column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL;

-- Add index for performance (optional but recommended for avatar lookups)
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_url
ON profiles(avatar_url)
WHERE avatar_url IS NOT NULL;

-- Add helpful comment for documentation
COMMENT ON COLUMN profiles.avatar_url IS
'URL to user profile picture/avatar. Typically stored in Supabase Storage bucket "avatars". Format: avatars/{user_id}/{filename}.{ext}. Falls back to initials-based avatar if NULL.';

-- Verify migration succeeded
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
      AND column_name = 'avatar_url'
  ) THEN
    RAISE EXCEPTION 'Migration failed: avatar_url column not added to profiles table';
  END IF;

  RAISE NOTICE 'Migration successful: Profile pictures support enabled';
  RAISE NOTICE 'Next steps: Create Supabase Storage bucket "avatars" with RLS policies';
END $$;
