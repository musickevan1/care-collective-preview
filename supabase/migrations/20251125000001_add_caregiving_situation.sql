-- Migration: Add caregiving situation field to profiles
-- Date: 2025-11-25
-- Description: Adds optional field for users to describe their caregiving context

-- Add caregiving_situation column to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS caregiving_situation TEXT;

-- Add constraint to limit length to 500 characters
ALTER TABLE profiles
ADD CONSTRAINT caregiving_situation_length_check
CHECK (caregiving_situation IS NULL OR char_length(caregiving_situation) <= 500);

-- Add comment for documentation
COMMENT ON COLUMN profiles.caregiving_situation IS
'Optional field for users to describe their caregiving context (e.g., ''Caring for aging parent with mobility challenges''). Max 500 characters.';

-- Create index for potential future searching
CREATE INDEX IF NOT EXISTS idx_profiles_caregiving_situation
ON profiles (caregiving_situation)
WHERE caregiving_situation IS NOT NULL;
