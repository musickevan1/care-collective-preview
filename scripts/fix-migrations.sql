-- QUICK FIX for Care Collective Database
-- This fixes the "Offer to Help" button and location_override errors

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- STEP 1: Fix help_requests table (REQUIRED for both errors)
-- ================================================

-- Fix status constraint
ALTER TABLE help_requests 
  DROP CONSTRAINT IF EXISTS help_requests_status_check;

ALTER TABLE help_requests 
  ADD CONSTRAINT help_requests_status_check 
  CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled', 'closed'));

-- Add ALL missing columns (fixes "Offer to Help" button AND location error)
ALTER TABLE help_requests
  ADD COLUMN IF NOT EXISTS helper_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS helped_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS location_override TEXT,
  ADD COLUMN IF NOT EXISTS location_privacy TEXT CHECK (location_privacy IN ('public', 'helpers_only', 'after_match')) DEFAULT 'public';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_help_requests_helper_id ON help_requests(helper_id);

-- ================================================
-- STEP 2: Fix profiles table
-- ================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS contact_preferences JSONB DEFAULT '{
    "show_email": true,
    "show_phone": false,
    "preferred_contact": "email",
    "availability": null
  }';

-- ================================================
-- STEP 3: Add update trigger
-- ================================================

-- Create or replace the update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_help_requests_updated_at ON help_requests;
CREATE TRIGGER update_help_requests_updated_at
  BEFORE UPDATE ON help_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- STEP 4: Fix RLS policies
-- ================================================

-- Allow helpers to update requests they're helping with
DROP POLICY IF EXISTS "Helpers can update requests they're assigned to" ON help_requests;
CREATE POLICY "Helpers can update requests they're assigned to"
  ON help_requests FOR UPDATE
  USING (auth.uid() = helper_id);

-- Allow admins to update any request
DROP POLICY IF EXISTS "Admins can update any help request" ON help_requests;
CREATE POLICY "Admins can update any help request"
  ON help_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- ================================================
-- STEP 5: Fix the messages table structure
-- ================================================

-- Check if messages table exists with wrong structure
DO $$ 
BEGIN
  -- If messages table exists but doesn't have sent_at column, add it
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'messages'
  ) THEN
    -- Add missing columns if they don't exist
    ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
      
    -- Rename created_at to sent_at if needed
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'messages' 
      AND column_name = 'created_at'
    ) AND NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'messages' 
      AND column_name = 'sent_at'
    ) THEN
      ALTER TABLE messages RENAME COLUMN created_at TO sent_at;
    END IF;
  ELSE
    -- Create messages table with correct structure
    CREATE TABLE messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      request_id UUID REFERENCES help_requests(id) ON DELETE CASCADE,
      sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
      recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      read BOOLEAN DEFAULT FALSE,
      read_at TIMESTAMPTZ,
      sent_at TIMESTAMPTZ DEFAULT NOW(),
      edited_at TIMESTAMPTZ,
      deleted_at TIMESTAMPTZ
    );
  END IF;
END $$;

-- ================================================
-- STEP 6: Create contact_exchanges table (safe to run multiple times)
-- ================================================

CREATE TABLE IF NOT EXISTS contact_exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES help_requests(id) ON DELETE CASCADE,
  helper_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  exchange_type TEXT CHECK (exchange_type IN ('display', 'message')) DEFAULT 'display',
  contact_shared JSONB DEFAULT '{}',
  exchanged_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  UNIQUE(request_id, helper_id, requester_id)
);

-- Create audit_logs if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- STEP 7: Enable RLS and add basic policies
-- ================================================

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Basic policies for contact_exchanges
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'contact_exchanges' 
    AND policyname = 'Users can view their own contact exchanges'
  ) THEN
    CREATE POLICY "Users can view their own contact exchanges" ON contact_exchanges
      FOR SELECT USING (auth.uid() IN (helper_id, requester_id));
  END IF;
END $$;

-- ================================================
-- VERIFICATION - THIS IS CRITICAL!
-- ================================================

-- This should return 4 rows if successful
SELECT 
  'VERIFICATION:' as check_type,
  column_name, 
  data_type,
  CASE 
    WHEN column_name = 'helper_id' THEN '✓ Fixes "Offer to Help" button'
    WHEN column_name = 'helped_at' THEN '✓ Tracks when help started'
    WHEN column_name = 'location_override' THEN '✓ Fixes location error'
    WHEN column_name = 'location_privacy' THEN '✓ Controls location visibility'
  END as fixes_issue
FROM information_schema.columns 
WHERE table_name = 'help_requests' 
  AND column_name IN ('helper_id', 'helped_at', 'location_override', 'location_privacy')
ORDER BY column_name;

-- Final status
SELECT 
  '✅ Migration Complete!' as status,
  'Both errors should now be fixed. Test the "Offer to Help" button!' as message;