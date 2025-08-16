-- Contact Exchange System Tables
-- This migration adds support for contact information exchange between helpers and requesters

-- Contact exchanges tracking table
CREATE TABLE IF NOT EXISTS contact_exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES help_requests(id) ON DELETE CASCADE,
  helper_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  exchange_type TEXT CHECK (exchange_type IN ('display', 'message')) DEFAULT 'display',
  contact_shared JSONB DEFAULT '{}', -- Stores which contact info was shared
  exchanged_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  UNIQUE(request_id, helper_id, requester_id)
);

-- Messages table for in-app messaging (if message type is selected)
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

-- Add contact preferences to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS contact_preferences JSONB DEFAULT '{
  "show_email": true,
  "show_phone": false,
  "preferred_contact": "email",
  "availability": null
}';

-- Add phone number to profiles (optional)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add location override to help requests
ALTER TABLE help_requests
ADD COLUMN IF NOT EXISTS location_override TEXT,
ADD COLUMN IF NOT EXISTS location_privacy TEXT CHECK (location_privacy IN ('public', 'helpers_only', 'after_match')) DEFAULT 'public';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_exchanges_request ON contact_exchanges(request_id);
CREATE INDEX IF NOT EXISTS idx_contact_exchanges_helper ON contact_exchanges(helper_id);
CREATE INDEX IF NOT EXISTS idx_messages_request ON messages(request_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id, read);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(request_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_participants ON message_threads USING GIN(participant_ids);

-- RLS Policies
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
CREATE TRIGGER trigger_create_contact_exchange
  AFTER UPDATE OF helper_id ON help_requests
  FOR EACH ROW
  EXECUTE FUNCTION create_contact_exchange();

-- Add comment for documentation
COMMENT ON TABLE contact_exchanges IS 'Tracks when contact information is exchanged between helpers and requesters';
COMMENT ON TABLE messages IS 'Stores in-app messages between users';
COMMENT ON TABLE message_threads IS 'Organizes messages into conversation threads';