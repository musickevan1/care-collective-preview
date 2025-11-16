-- Migration: Add exchange_offer field to help_requests table
-- Purpose: Enable mutual aid reciprocity by allowing requesters to offer something in exchange
-- This supports the core philosophy of the collective: community members supporting each other

-- Add the exchange_offer column
ALTER TABLE help_requests
ADD COLUMN IF NOT EXISTS exchange_offer TEXT;

-- Add a check constraint for maximum length (300 characters)
ALTER TABLE help_requests
ADD CONSTRAINT help_requests_exchange_offer_length
CHECK (exchange_offer IS NULL OR char_length(exchange_offer) <= 300);

-- Add a comment explaining the field
COMMENT ON COLUMN help_requests.exchange_offer IS
'Optional field for requesters to describe what they can offer in exchange for help (mutual aid reciprocity). Max 300 characters.';

-- Create an index for filtering requests that have exchange offers (optional optimization)
CREATE INDEX IF NOT EXISTS idx_help_requests_has_exchange_offer
ON help_requests ((exchange_offer IS NOT NULL))
WHERE exchange_offer IS NOT NULL;
