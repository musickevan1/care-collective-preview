-- Migration: Add System Conversations Support
-- Enables CARE Team welcome messages by:
-- 1. Making help_request_id nullable in conversations_v2
-- 2. Adding is_system_user flag to profiles
-- 3. Creating the CARE Team system user

-- Step 1: Add is_system_user column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_system_user boolean DEFAULT false;

-- Step 2: Make help_request_id nullable in conversations_v2
ALTER TABLE conversations_v2 ALTER COLUMN help_request_id DROP NOT NULL;

-- Step 3: Drop the existing unique constraint that includes help_request_id
-- The constraint was defined as: CONSTRAINT unique_help_request_helper UNIQUE (help_request_id, helper_id)
ALTER TABLE conversations_v2 DROP CONSTRAINT IF EXISTS unique_help_request_helper;

-- Step 4: Create partial unique indexes
-- For regular conversations: unique per (help_request_id, helper_id) when help_request_id is not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_help_request_helper
  ON conversations_v2 (help_request_id, helper_id)
  WHERE help_request_id IS NOT NULL;

-- For system conversations: unique per (requester_id, helper_id) when help_request_id is null
-- This prevents duplicate welcome messages
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_system_conversation
  ON conversations_v2 (requester_id, helper_id)
  WHERE help_request_id IS NULL;

-- Step 5: Create CARE Team system user in profiles
-- Note: We cannot insert into auth.users directly in migrations (managed by Supabase Auth)
-- Instead, we'll insert into profiles with the reserved UUID and handle auth separately
INSERT INTO profiles (id, name, location, is_system_user, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'CARE Team',
  'Care Collective',
  true,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  is_system_user = true,
  name = 'CARE Team',
  location = 'Care Collective';

-- Add comment for documentation
COMMENT ON COLUMN profiles.is_system_user IS 'True for system accounts like CARE Team bot';
COMMENT ON INDEX idx_unique_system_conversation IS 'Ensures only one system conversation per user-pair (e.g., one welcome message per user)';
