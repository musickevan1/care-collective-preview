-- Migration: Update categories to new 7-category structure and add new fields
-- Date: 2025-10-22

-- Step 1: Add new fields to profiles table for terms acceptance
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version varchar DEFAULT '1.0';

-- Step 2: Add new fields to help_requests table
ALTER TABLE help_requests
  ADD COLUMN IF NOT EXISTS subcategory text,
  ADD COLUMN IF NOT EXISTS is_ongoing boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Step 3: Create a function to map old categories to new categories
CREATE OR REPLACE FUNCTION map_old_category_to_new(old_category text)
RETURNS text AS $$
BEGIN
  RETURN CASE old_category
    -- Map medical, respite to health-caregiving
    WHEN 'medical' THEN 'health-caregiving'
    WHEN 'respite' THEN 'health-caregiving'

    -- Map groceries, meals to groceries-meals
    WHEN 'groceries' THEN 'groceries-meals'
    WHEN 'meals' THEN 'groceries-meals'

    -- Map transport to transportation-errands
    WHEN 'transport' THEN 'transportation-errands'

    -- Map household, childcare, petcare to household-yard
    WHEN 'household' THEN 'household-yard'
    WHEN 'childcare' THEN 'household-yard'
    WHEN 'petcare' THEN 'household-yard'

    -- Map technology to technology-administrative
    WHEN 'technology' THEN 'technology-administrative'

    -- Map companionship, emotional to social-companionship
    WHEN 'companionship' THEN 'social-companionship'
    WHEN 'emotional' THEN 'social-companionship'

    -- Keep other as other
    WHEN 'other' THEN 'other'

    -- Default to other if unknown
    ELSE 'other'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 4: Update existing help_requests to use new categories
UPDATE help_requests
SET category = map_old_category_to_new(category);

-- Step 5: Drop old category constraint
ALTER TABLE help_requests
  DROP CONSTRAINT IF EXISTS help_requests_category_check;

-- Step 6: Add new category constraint
ALTER TABLE help_requests
  ADD CONSTRAINT help_requests_category_check
  CHECK (category IN (
    'health-caregiving',
    'groceries-meals',
    'transportation-errands',
    'household-yard',
    'technology-administrative',
    'social-companionship',
    'other'
  ));

-- Step 7: Create index on subcategory for filtering
CREATE INDEX IF NOT EXISTS idx_help_requests_subcategory
  ON help_requests(subcategory)
  WHERE subcategory IS NOT NULL;

-- Step 8: Create index on is_ongoing for filtering active requests
CREATE INDEX IF NOT EXISTS idx_help_requests_is_ongoing
  ON help_requests(is_ongoing);

-- Step 9: Create index on expires_at for expiration processing
CREATE INDEX IF NOT EXISTS idx_help_requests_expires_at
  ON help_requests(expires_at)
  WHERE expires_at IS NOT NULL;

-- Step 10: Add comment explaining the new category structure
COMMENT ON COLUMN help_requests.category IS 'Help request category: health-caregiving, groceries-meals, transportation-errands, household-yard, technology-administrative, social-companionship, or other';
COMMENT ON COLUMN help_requests.subcategory IS 'Specific type of help within the category';
COMMENT ON COLUMN help_requests.is_ongoing IS 'Whether this is an ongoing request that should not auto-expire';
COMMENT ON COLUMN help_requests.expires_at IS 'When this request should expire (30 days from creation for non-ongoing requests)';

-- Step 11: Create a function to set expiration date on new help requests
CREATE OR REPLACE FUNCTION set_help_request_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set expiration for non-ongoing requests
  IF NEW.is_ongoing = false AND NEW.expires_at IS NULL THEN
    NEW.expires_at = NEW.created_at + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 12: Create trigger to automatically set expiration
DROP TRIGGER IF EXISTS trigger_set_help_request_expiration ON help_requests;
CREATE TRIGGER trigger_set_help_request_expiration
  BEFORE INSERT ON help_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_help_request_expiration();

-- Step 13: Update existing non-closed requests to have expiration dates
UPDATE help_requests
SET expires_at = created_at + INTERVAL '30 days'
WHERE
  expires_at IS NULL
  AND is_ongoing = false
  AND status != 'closed';

-- Step 14: Drop the old mapping function (cleanup)
DROP FUNCTION IF EXISTS map_old_category_to_new(text);

-- Note: A separate cron job or scheduled function will be needed to:
-- 1. Send reminder emails 7 days before expiration
-- 2. Auto-close requests that have expired
