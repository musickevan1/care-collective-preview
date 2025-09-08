-- Comprehensive Messaging System Migration
-- Transforms basic messages table into a full-featured messaging platform
-- Based on the Care Collective Messaging System Brainstorm v1.0

-- Drop existing basic messages table constraints to rebuild
DROP TABLE IF EXISTS messages CASCADE;

-- Create conversations table for better message organization
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  help_request_id UUID REFERENCES help_requests(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Conversation metadata
  title TEXT, -- Optional custom title
  status TEXT CHECK (status IN ('active', 'closed', 'blocked')) DEFAULT 'active',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation participants (many-to-many)
CREATE TABLE conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  role TEXT CHECK (role IN ('member', 'moderator')) DEFAULT 'member',
  PRIMARY KEY (conversation_id, user_id)
);

-- Enhanced messages table for comprehensive messaging
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  help_request_id UUID REFERENCES help_requests(id) ON DELETE SET NULL,
  
  -- Message content
  content TEXT NOT NULL CHECK (length(content) <= 1000),
  message_type TEXT CHECK (message_type IN ('text', 'system', 'help_request_update')) DEFAULT 'text',
  
  -- Message status
  status TEXT CHECK (status IN ('sent', 'delivered', 'read', 'failed')) DEFAULT 'sent',
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Safety & moderation
  is_flagged BOOLEAN DEFAULT FALSE,
  flagged_reason TEXT,
  moderation_status TEXT CHECK (moderation_status IN ('pending', 'approved', 'hidden', 'removed')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete for audit
);

-- User messaging preferences
CREATE TABLE messaging_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  can_receive_from TEXT CHECK (can_receive_from IN ('anyone', 'help_connections', 'nobody')) DEFAULT 'help_connections',
  auto_accept_help_requests BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  quiet_hours_start TIME, -- e.g., '22:00'
  quiet_hours_end TIME,   -- e.g., '08:00'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message reports for community safety
CREATE TABLE message_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'scam', 'other')) NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES profiles(id)
);

-- Message audit log for safety investigations
CREATE TABLE message_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  action_type TEXT CHECK (action_type IN ('sent', 'delivered', 'read', 'reported', 'deleted', 'moderated')),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  metadata JSONB, -- Additional context data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance indexes for messaging queries
CREATE INDEX idx_conversations_participant ON conversation_participants(user_id, left_at) WHERE left_at IS NULL;
CREATE INDEX idx_conversations_help_request ON conversations(help_request_id) WHERE help_request_id IS NOT NULL;
CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_recipient_unread ON messages(recipient_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_messages_flagged ON messages(is_flagged, moderation_status) WHERE is_flagged = TRUE;
CREATE INDEX idx_messages_status ON messages(status, created_at);
CREATE INDEX idx_message_reports_status ON message_reports(status, created_at) WHERE status = 'pending';

-- Full-text search for message content (future feature)
CREATE INDEX idx_messages_content_search ON messages USING gin(to_tsvector('english', content));

-- Enable Row Level Security on all new tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE messaging_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT USING (
    id IN (
      SELECT conversation_id FROM conversation_participants 
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Conversation creators can update their conversations" ON conversations
  FOR UPDATE USING (created_by = auth.uid());

-- RLS policies for conversation participants
CREATE POLICY "Users can view conversation participants for their conversations" ON conversation_participants
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants 
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

CREATE POLICY "Users can join conversations they're invited to" ON conversation_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave conversations they're part of" ON conversation_participants
  FOR UPDATE USING (user_id = auth.uid());

-- RLS policies for messages
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants 
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

CREATE POLICY "Users can send messages to their conversations" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants 
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

CREATE POLICY "Users can update messages sent to them" ON messages
  FOR UPDATE USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- RLS policies for messaging preferences
CREATE POLICY "Users can view and manage their own messaging preferences" ON messaging_preferences
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS policies for message reports
CREATE POLICY "Users can view reports they created" ON message_reports
  FOR SELECT USING (reported_by = auth.uid());

CREATE POLICY "Users can create message reports" ON message_reports
  FOR INSERT WITH CHECK (reported_by = auth.uid());

-- RLS policies for audit log (read-only for users, admin access)
CREATE POLICY "Users can view audit logs for their messages" ON message_audit_log
  FOR SELECT USING (
    message_id IN (
      SELECT id FROM messages WHERE sender_id = auth.uid() OR recipient_id = auth.uid()
    )
  );

-- Function to update conversation timestamp when new message is sent
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET last_message_at = NEW.created_at, updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation timestamp
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Function to create audit log entry for message actions
CREATE OR REPLACE FUNCTION log_message_action()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO message_audit_log (message_id, action_type, user_id, metadata)
    VALUES (NEW.id, 'sent', NEW.sender_id, jsonb_build_object('status', NEW.status));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log read status updates
    IF OLD.read_at IS NULL AND NEW.read_at IS NOT NULL THEN
      INSERT INTO message_audit_log (message_id, action_type, user_id, metadata)
      VALUES (NEW.id, 'read', NEW.recipient_id, jsonb_build_object('read_at', NEW.read_at));
    END IF;
    -- Log moderation actions
    IF OLD.moderation_status IS DISTINCT FROM NEW.moderation_status THEN
      INSERT INTO message_audit_log (message_id, action_type, user_id, metadata)
      VALUES (NEW.id, 'moderated', auth.uid(), jsonb_build_object('old_status', OLD.moderation_status, 'new_status', NEW.moderation_status));
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for message audit logging
CREATE TRIGGER message_audit_trigger
  AFTER INSERT OR UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION log_message_action();

-- Function to initialize messaging preferences for new users
CREATE OR REPLACE FUNCTION initialize_messaging_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO messaging_preferences (user_id, created_at)
  VALUES (NEW.id, NEW.created_at)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default messaging preferences for new profiles
CREATE TRIGGER initialize_messaging_preferences_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION initialize_messaging_preferences();

-- Grant necessary permissions
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON conversation_participants TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON messaging_preferences TO authenticated;
GRANT ALL ON message_reports TO authenticated;
GRANT SELECT ON message_audit_log TO authenticated;

-- Create helper functions for common messaging operations

-- Function to start a new conversation related to a help request
CREATE OR REPLACE FUNCTION start_help_conversation(
  help_request_uuid UUID,
  recipient_uuid UUID,
  initial_message TEXT
)
RETURNS UUID AS $$
DECLARE
  conversation_uuid UUID;
  sender_uuid UUID;
BEGIN
  sender_uuid := auth.uid();
  
  -- Create conversation
  INSERT INTO conversations (help_request_id, created_by)
  VALUES (help_request_uuid, sender_uuid)
  RETURNING id INTO conversation_uuid;
  
  -- Add participants
  INSERT INTO conversation_participants (conversation_id, user_id) VALUES
    (conversation_uuid, sender_uuid),
    (conversation_uuid, recipient_uuid);
  
  -- Send initial message
  INSERT INTO messages (conversation_id, sender_id, recipient_id, help_request_id, content)
  VALUES (conversation_uuid, sender_uuid, recipient_uuid, help_request_uuid, initial_message);
  
  RETURN conversation_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can message another user
CREATE OR REPLACE FUNCTION can_user_message(sender_uuid UUID, recipient_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  recipient_preferences RECORD;
BEGIN
  -- Get recipient preferences
  SELECT * INTO recipient_preferences 
  FROM messaging_preferences 
  WHERE user_id = recipient_uuid;
  
  -- If no preferences found, use defaults
  IF NOT FOUND THEN
    recipient_preferences.can_receive_from := 'help_connections';
  END IF;
  
  -- Check permission level
  CASE recipient_preferences.can_receive_from
    WHEN 'nobody' THEN
      RETURN FALSE;
    WHEN 'anyone' THEN
      RETURN TRUE;
    WHEN 'help_connections' THEN
      -- Check if users have interacted through help requests
      RETURN EXISTS (
        SELECT 1 FROM conversations c
        JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
        JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
        WHERE cp1.user_id = sender_uuid 
          AND cp2.user_id = recipient_uuid 
          AND c.help_request_id IS NOT NULL
      );
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create views for common queries
CREATE VIEW user_conversations AS
SELECT 
  c.*,
  hr.title as help_request_title,
  hr.category as help_request_category,
  (
    SELECT COUNT(*)
    FROM messages m
    WHERE m.conversation_id = c.id
      AND m.recipient_id = auth.uid()
      AND m.read_at IS NULL
  ) as unread_count
FROM conversations c
LEFT JOIN help_requests hr ON c.help_request_id = hr.id
WHERE c.id IN (
  SELECT conversation_id 
  FROM conversation_participants 
  WHERE user_id = auth.uid() AND left_at IS NULL
)
ORDER BY c.last_message_at DESC;