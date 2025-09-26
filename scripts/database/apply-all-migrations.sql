-- Care Collective - Apply All Migrations
-- Run this script in Supabase SQL Editor to apply all migrations in sequence
-- This ensures your database is fully up to date

-- Check current state
SELECT 'Starting migration process...' as status;

-- Migration 1: Initial Schema (if not already applied)
-- Note: Using IF NOT EXISTS to make this idempotent

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Migration 2: Enhanced Status Tracking
-- From: supabase/migrations/20250811082915_add_request_status_tracking.sql

DO $$ 
BEGIN
  -- Check if we need to update the status constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'help_requests_status_check' 
    AND check_clause LIKE '%in_progress%'
  ) THEN
    -- Update the status check constraint to include more options
    ALTER TABLE help_requests 
      DROP CONSTRAINT IF EXISTS help_requests_status_check;
    
    ALTER TABLE help_requests 
      ADD CONSTRAINT help_requests_status_check 
      CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled', 'closed'));
  END IF;
END $$;

-- Add new columns for better tracking (IF NOT EXISTS makes it safe to re-run)
ALTER TABLE help_requests
  ADD COLUMN IF NOT EXISTS helper_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS helped_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- IMPORTANT: Location columns for request-specific location overrides
  ADD COLUMN IF NOT EXISTS location_override TEXT,
  ADD COLUMN IF NOT EXISTS location_privacy TEXT CHECK (location_privacy IN ('public', 'helpers_only', 'after_match')) DEFAULT 'public';

-- Create an index for helper assignments
CREATE INDEX IF NOT EXISTS idx_help_requests_helper_id ON help_requests(helper_id);

-- Create or replace the update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_help_requests_updated_at ON help_requests;
CREATE TRIGGER update_help_requests_updated_at
  BEFORE UPDATE ON help_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policy for helpers to update requests they're helping with
DROP POLICY IF EXISTS "Helpers can update requests they're assigned to" ON help_requests;
CREATE POLICY "Helpers can update requests they're assigned to"
  ON help_requests FOR UPDATE
  USING (auth.uid() = helper_id);

-- Create a view for request statistics
CREATE OR REPLACE VIEW request_statistics AS
SELECT 
  COUNT(*) FILTER (WHERE status = 'open') as open_count,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
  COUNT(*) FILTER (WHERE status = 'closed') as closed_count,
  COUNT(*) as total_count,
  COUNT(DISTINCT user_id) as unique_requesters,
  COUNT(DISTINCT helper_id) as unique_helpers
FROM help_requests;

-- Grant access to the view
GRANT SELECT ON request_statistics TO anon, authenticated;

-- Migration 3: Admin Support
-- From: supabase/migrations/20250811090000_add_admin_support.sql

-- Add is_admin column to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
  -- Add contact preference columns for contact exchange system
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS contact_preferences JSONB DEFAULT '{
    "show_email": true,
    "show_phone": false,
    "preferred_contact": "email",
    "availability": null
  }';

-- Create index for admin users
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;

-- Update RLS policies for help_requests to allow admin updates
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

-- Allow admins to delete any help request
DROP POLICY IF EXISTS "Admins can delete any help request" ON help_requests;
CREATE POLICY "Admins can delete any help request"
  ON help_requests FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Create audit_logs table for tracking admin actions
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

-- Create indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
DROP POLICY IF EXISTS "Only admins can view audit logs" ON audit_logs;
CREATE POLICY "Only admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Only admins can insert audit logs
DROP POLICY IF EXISTS "Only admins can insert audit logs" ON audit_logs;
CREATE POLICY "Only admins can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Grant permissions
GRANT ALL ON audit_logs TO authenticated;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = user_id 
    AND profiles.is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;

-- Migration 4: Contact Exchange System
-- From: supabase/migrations/20250115_contact_exchange.sql

-- Contact exchanges tracking table
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

-- Messages table for future in-app messaging
CREATE TABLE IF NOT EXISTS messages (
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

-- Message threads for organizing conversations
CREATE TABLE IF NOT EXISTS message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES help_requests(id) ON DELETE CASCADE,
  participant_ids UUID[] NOT NULL,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_exchanges_request ON contact_exchanges(request_id);
CREATE INDEX IF NOT EXISTS idx_contact_exchanges_helper ON contact_exchanges(helper_id);
CREATE INDEX IF NOT EXISTS idx_messages_request ON messages(request_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id, read);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(request_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_participants ON message_threads USING GIN(participant_ids);

-- Enable RLS on new tables
ALTER TABLE contact_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;

-- Contact exchanges policies
CREATE POLICY "Users can view their own contact exchanges" ON contact_exchanges
  FOR SELECT USING (auth.uid() IN (helper_id, requester_id));

CREATE POLICY "Helpers can create contact exchanges" ON contact_exchanges
  FOR INSERT WITH CHECK (auth.uid() = helper_id);

CREATE POLICY "Users can update their own contact exchanges" ON contact_exchanges
  FOR UPDATE USING (auth.uid() IN (helper_id, requester_id));

-- Messages policies
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (auth.uid() IN (sender_id, recipient_id));

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (auth.uid() = sender_id AND deleted_at IS NULL);

-- Message threads policies
CREATE POLICY "Users can view their own threads" ON message_threads
  FOR SELECT USING (auth.uid() = ANY(participant_ids));

CREATE POLICY "Users can create threads they're part of" ON message_threads
  FOR INSERT WITH CHECK (auth.uid() = ANY(participant_ids));

CREATE POLICY "Users can update their own threads" ON message_threads
  FOR UPDATE USING (auth.uid() = ANY(participant_ids));

-- Function to automatically create contact exchange when help is offered
CREATE OR REPLACE FUNCTION create_contact_exchange()
RETURNS TRIGGER AS $$
BEGIN
  -- When helper_id is set (someone offers help), create a contact exchange record
  IF NEW.helper_id IS NOT NULL AND OLD.helper_id IS NULL THEN
    INSERT INTO contact_exchanges (request_id, helper_id, requester_id, exchange_type)
    VALUES (NEW.id, NEW.helper_id, NEW.user_id, 'display')
    ON CONFLICT (request_id, helper_id, requester_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create contact exchange
DROP TRIGGER IF EXISTS trigger_create_contact_exchange ON help_requests;
CREATE TRIGGER trigger_create_contact_exchange
  AFTER UPDATE OF helper_id ON help_requests
  FOR EACH ROW
  EXECUTE FUNCTION create_contact_exchange();

-- Add helpful comments
COMMENT ON COLUMN profiles.is_admin IS 'Whether the user has admin privileges';
COMMENT ON TABLE audit_logs IS 'Audit trail for admin actions';
COMMENT ON FUNCTION is_admin IS 'Check if a user has admin privileges';
COMMENT ON COLUMN help_requests.status IS 'Request status: open (needs help), in_progress (helper assigned), completed (successfully helped), cancelled (requester cancelled), closed (administratively closed)';
COMMENT ON COLUMN help_requests.helper_id IS 'User ID of the person helping with this request';
COMMENT ON COLUMN help_requests.helped_at IS 'Timestamp when a helper started helping';
COMMENT ON COLUMN help_requests.completed_at IS 'Timestamp when the request was completed';
COMMENT ON COLUMN help_requests.cancelled_at IS 'Timestamp when the request was cancelled';
COMMENT ON COLUMN help_requests.cancel_reason IS 'Reason for cancellation if cancelled';
COMMENT ON COLUMN help_requests.location_override IS 'Optional location override for this specific request';
COMMENT ON COLUMN help_requests.location_privacy IS 'Who can see the location: public, helpers_only, or after_match';
COMMENT ON COLUMN profiles.phone IS 'Optional phone number for contact exchange';
COMMENT ON COLUMN profiles.contact_preferences IS 'User preferences for contact sharing';
COMMENT ON TABLE contact_exchanges IS 'Tracks when contact information is exchanged between helpers and requesters';
COMMENT ON TABLE messages IS 'Stores in-app messages between users';
COMMENT ON TABLE message_threads IS 'Organizes messages into conversation threads';

-- Final verification
SELECT 
  'Checking critical columns...' as status;

-- Verify all critical columns exist
SELECT 
  column_name, 
  data_type,
  CASE 
    WHEN column_name = 'helper_id' THEN '✓ Fixes "Offer to Help" button'
    WHEN column_name = 'helped_at' THEN '✓ Tracks when help started'
    WHEN column_name = 'location_override' THEN '✓ Fixes location error'
    WHEN column_name = 'location_privacy' THEN '✓ Controls location visibility'
  END as purpose
FROM information_schema.columns 
WHERE table_name = 'help_requests' 
  AND column_name IN ('helper_id', 'helped_at', 'location_override', 'location_privacy')
ORDER BY column_name;

-- Summary
SELECT 
  'Migrations applied successfully!' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('profiles', 'help_requests', 'messages', 'audit_logs', 'contact_exchanges')) as tables_count,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_admin') as has_admin_column,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'help_requests' AND column_name = 'helper_id') as has_helper_column,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'help_requests' AND column_name = 'location_override') as has_location_column,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as policies_count;