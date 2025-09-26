-- Production Schema Alignment Migration
-- This migration ensures the database schema matches the TypeScript types
-- and implements all features required for production deployment

-- ==============================================
-- 1. ENSURE ALL HELP_REQUEST COLUMNS EXIST
-- ==============================================

-- Add missing columns to help_requests table if they don't exist
ALTER TABLE help_requests 
  ADD COLUMN IF NOT EXISTS helper_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS helped_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
  ADD COLUMN IF NOT EXISTS location_override TEXT,
  ADD COLUMN IF NOT EXISTS location_privacy TEXT CHECK (location_privacy IN ('public', 'helpers_only', 'after_match')) DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_help_requests_helper_id ON help_requests(helper_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_status ON help_requests(status);
CREATE INDEX IF NOT EXISTS idx_help_requests_urgency ON help_requests(urgency);
CREATE INDEX IF NOT EXISTS idx_help_requests_category ON help_requests(category);
CREATE INDEX IF NOT EXISTS idx_help_requests_created_at ON help_requests(created_at DESC);

-- ==============================================
-- 2. ENSURE CONTACT EXCHANGE TABLES EXIST
-- ==============================================

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

-- Messages table - handled by comprehensive messaging migration
-- The comprehensive messaging system creates a more advanced conversation-based schema

-- ==============================================
-- 3. ENSURE PROFILE COLUMNS EXIST
-- ==============================================

-- Add contact preferences and phone to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS contact_preferences JSONB DEFAULT '{
    "show_email": true,
    "show_phone": false,
    "preferred_contact": "email",
    "availability": null
  }',
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- ==============================================
-- 4. CREATE PERFORMANCE INDEXES
-- ==============================================

-- Contact exchanges indexes
CREATE INDEX IF NOT EXISTS idx_contact_exchanges_request ON contact_exchanges(request_id);
CREATE INDEX IF NOT EXISTS idx_contact_exchanges_helper ON contact_exchanges(helper_id);
CREATE INDEX IF NOT EXISTS idx_contact_exchanges_requester ON contact_exchanges(requester_id);
CREATE INDEX IF NOT EXISTS idx_contact_exchanges_exchanged_at ON contact_exchanges(exchanged_at DESC);

-- Messages indexes - handled by comprehensive messaging migration
-- The comprehensive messaging system has its own indexes for the conversation-based schema

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_profiles_applied_at ON profiles(applied_at) WHERE applied_at IS NOT NULL;

-- ==============================================
-- 5. ENSURE RLS POLICIES EXIST
-- ==============================================

-- Enable RLS on new tables
ALTER TABLE contact_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Contact exchanges policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contact_exchanges' 
    AND policyname = 'Users can view their own contact exchanges'
  ) THEN
    CREATE POLICY "Users can view their own contact exchanges" ON contact_exchanges
      FOR SELECT USING (auth.uid() IN (helper_id, requester_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contact_exchanges' 
    AND policyname = 'Helpers can create contact exchanges'
  ) THEN
    CREATE POLICY "Helpers can create contact exchanges" ON contact_exchanges
      FOR INSERT WITH CHECK (auth.uid() = helper_id);
  END IF;
END $$;

-- Messages policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'messages' 
    AND policyname = 'Users can view their own messages'
  ) THEN
    CREATE POLICY "Users can view their own messages" ON messages
      FOR SELECT USING (auth.uid() IN (sender_id, recipient_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'messages' 
    AND policyname = 'Users can send messages'
  ) THEN
    CREATE POLICY "Users can send messages" ON messages
      FOR INSERT WITH CHECK (auth.uid() = sender_id);
  END IF;
END $$;

-- ==============================================
-- 6. CREATE HELPER FUNCTIONS
-- ==============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for help_requests updated_at
DROP TRIGGER IF EXISTS update_help_requests_updated_at ON help_requests;
CREATE TRIGGER update_help_requests_updated_at
  BEFORE UPDATE ON help_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create contact exchange when help is offered
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

-- ==============================================
-- 7. CREATE ADMIN VIEWS FOR STATISTICS
-- ==============================================

-- Create or replace admin statistics view
CREATE OR REPLACE VIEW admin_statistics AS
SELECT 
  -- User statistics
  COUNT(*) FILTER (WHERE verification_status = 'approved') as approved_users,
  COUNT(*) FILTER (WHERE verification_status = 'pending') as pending_users,
  COUNT(*) FILTER (WHERE verification_status = 'rejected') as rejected_users,
  COUNT(*) FILTER (WHERE is_admin = true) as admin_users,
  COUNT(*) as total_users,
  
  -- Help request statistics from help_requests table
  (SELECT COUNT(*) FROM help_requests WHERE status = 'open') as open_requests,
  (SELECT COUNT(*) FROM help_requests WHERE status = 'in_progress') as in_progress_requests,
  (SELECT COUNT(*) FROM help_requests WHERE status = 'completed') as completed_requests,
  (SELECT COUNT(*) FROM help_requests WHERE status = 'cancelled') as cancelled_requests,
  (SELECT COUNT(*) FROM help_requests) as total_requests,
  
  -- Contact exchange statistics
  (SELECT COUNT(*) FROM contact_exchanges) as total_exchanges,
  (SELECT COUNT(*) FROM contact_exchanges WHERE confirmed_at IS NOT NULL) as confirmed_exchanges,
  
  -- Recent activity (last 7 days)
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_users_week,
  (SELECT COUNT(*) FROM help_requests WHERE created_at > NOW() - INTERVAL '7 days') as new_requests_week,
  (SELECT COUNT(*) FROM contact_exchanges WHERE exchanged_at > NOW() - INTERVAL '7 days') as new_exchanges_week
FROM profiles;

-- Grant access to admin view
GRANT SELECT ON admin_statistics TO authenticated;

-- ==============================================
-- 8. UPDATE TABLE COMMENTS FOR DOCUMENTATION
-- ==============================================

COMMENT ON TABLE help_requests IS 'Community help requests with full tracking and contact exchange integration';
COMMENT ON TABLE contact_exchanges IS 'Privacy-controlled contact information exchanges between helpers and requesters';
COMMENT ON TABLE messages IS 'In-app messaging system for secure communication';

COMMENT ON COLUMN help_requests.helper_id IS 'ID of the user helping with this request';
COMMENT ON COLUMN help_requests.helped_at IS 'Timestamp when help was started';
COMMENT ON COLUMN help_requests.completed_at IS 'Timestamp when request was completed';
COMMENT ON COLUMN help_requests.location_privacy IS 'Control who can see location details';
COMMENT ON COLUMN profiles.contact_preferences IS 'User preferences for contact information sharing';

-- ==============================================
-- 9. SECURITY ENHANCEMENTS
-- ==============================================

-- Ensure all UUID columns have proper constraints
ALTER TABLE help_requests ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE contact_exchanges ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE messages ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Add check constraints for data integrity
ALTER TABLE help_requests 
  DROP CONSTRAINT IF EXISTS help_requests_status_check,
  ADD CONSTRAINT help_requests_status_check 
  CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled', 'closed'));

ALTER TABLE help_requests
  DROP CONSTRAINT IF EXISTS help_requests_urgency_check,
  ADD CONSTRAINT help_requests_urgency_check
  CHECK (urgency IN ('normal', 'urgent', 'critical'));

-- ==============================================
-- 10. FINAL CLEANUP AND OPTIMIZATION
-- ==============================================

-- Analyze tables for query optimization
ANALYZE profiles;
ANALYZE help_requests;
ANALYZE contact_exchanges;
ANALYZE messages;

-- Log completion
DO $$ 
BEGIN 
  RAISE NOTICE 'Production schema alignment migration completed successfully';
  RAISE NOTICE 'Database is now ready for production deployment';
END $$;