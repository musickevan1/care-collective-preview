-- Messaging System Enhancement Phase 2.1
-- Implements message threading, real-time features, and enhanced moderation
-- Date: September 23, 2025

-- Enhance messages table for threading and real-time features
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS parent_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS thread_id UUID,
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'standard' CHECK (message_type IN ('standard', 'system', 'help_request_update', 'contact_exchange', 'thread_reply')),
ADD COLUMN IF NOT EXISTS encryption_status TEXT DEFAULT 'none' CHECK (encryption_status IN ('none', 'encrypted', 'failed')),
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS flagged_reason TEXT,
ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'hidden', 'deleted'));

-- Create indexes for threading and performance
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id) WHERE thread_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_parent_id ON messages(parent_message_id) WHERE parent_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_moderation ON messages(moderation_status);
CREATE INDEX IF NOT EXISTS idx_messages_flagged ON messages(is_flagged) WHERE is_flagged = true;
CREATE INDEX IF NOT EXISTS idx_messages_read_status ON messages(recipient_id, read_at) WHERE read_at IS NULL;

-- Message reports table for user reporting system
CREATE TABLE IF NOT EXISTS message_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  report_reason TEXT NOT NULL CHECK (report_reason IN ('spam', 'harassment', 'inappropriate', 'scam', 'personal_info', 'other')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'dismissed', 'action_taken')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate reports from same user for same message
  CONSTRAINT unique_user_message_report UNIQUE (message_id, reported_by)
);

-- Indexes for message reports
CREATE INDEX IF NOT EXISTS idx_message_reports_status ON message_reports(status);
CREATE INDEX IF NOT EXISTS idx_message_reports_reported_by ON message_reports(reported_by);
CREATE INDEX IF NOT EXISTS idx_message_reports_created_at ON message_reports(created_at);

-- Message audit log for comprehensive tracking
CREATE TABLE IF NOT EXISTS message_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('sent', 'read', 'edited', 'deleted', 'reported', 'moderated', 'encrypted', 'decrypted')),
  restriction_id UUID REFERENCES user_restrictions(id),
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit log
CREATE INDEX IF NOT EXISTS idx_message_audit_log_message_id ON message_audit_log(message_id);
CREATE INDEX IF NOT EXISTS idx_message_audit_log_user_id ON message_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_message_audit_log_action_type ON message_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_message_audit_log_created_at ON message_audit_log(created_at);

-- User presence tracking for real-time features
CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  current_conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  is_typing_in_conversation UUID REFERENCES conversations(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for presence
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen);
CREATE INDEX IF NOT EXISTS idx_user_presence_typing ON user_presence(is_typing_in_conversation) WHERE is_typing_in_conversation IS NOT NULL;

-- Privacy violation alerts (extending Phase 2.2 system)
ALTER TABLE privacy_violation_alerts
ADD COLUMN IF NOT EXISTS message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL;

-- Function to generate thread ID for message threading
CREATE OR REPLACE FUNCTION generate_thread_id()
RETURNS UUID
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN gen_random_uuid();
END;
$$;

-- Function to handle message threading
CREATE OR REPLACE FUNCTION handle_message_threading()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If this is a reply to another message, use that message's thread_id or create new one
  IF NEW.parent_message_id IS NOT NULL THEN
    SELECT COALESCE(thread_id, id) INTO NEW.thread_id
    FROM messages
    WHERE id = NEW.parent_message_id;

    -- If parent doesn't have thread_id, set it to parent's id
    IF NEW.thread_id IS NULL THEN
      UPDATE messages
      SET thread_id = NEW.parent_message_id
      WHERE id = NEW.parent_message_id;

      NEW.thread_id := NEW.parent_message_id;
    END IF;

    NEW.message_type := 'thread_reply';
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for message threading
CREATE TRIGGER trigger_message_threading
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_message_threading();

-- Function to update user presence
CREATE OR REPLACE FUNCTION update_user_presence(
  user_uuid UUID,
  new_status TEXT DEFAULT 'online',
  conversation_uuid UUID DEFAULT NULL,
  typing_in_conversation UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_presence (user_id, status, current_conversation_id, is_typing_in_conversation, last_seen, updated_at)
  VALUES (user_uuid, new_status, conversation_uuid, typing_in_conversation, NOW(), NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    current_conversation_id = EXCLUDED.current_conversation_id,
    is_typing_in_conversation = EXCLUDED.is_typing_in_conversation,
    last_seen = EXCLUDED.last_seen,
    updated_at = EXCLUDED.updated_at;
END;
$$;

-- Function to check if user can send message (moderation integration)
CREATE OR REPLACE FUNCTION can_user_send_message(
  user_uuid UUID,
  conversation_uuid UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  restriction_record RECORD;
  daily_count INTEGER;
BEGIN
  -- Get current restrictions
  SELECT * INTO restriction_record
  FROM get_user_restrictions(user_uuid)
  LIMIT 1;

  -- Check if user can send messages
  IF NOT restriction_record.can_send_messages THEN
    RETURN FALSE;
  END IF;

  -- Check daily message limit
  IF restriction_record.message_limit_per_day > 0 THEN
    SELECT COUNT(*) INTO daily_count
    FROM messages
    WHERE sender_id = user_uuid
      AND created_at >= current_date
      AND created_at < current_date + interval '1 day';

    IF daily_count >= restriction_record.message_limit_per_day THEN
      RETURN FALSE;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$;

-- Function to get message thread
CREATE OR REPLACE FUNCTION get_message_thread(thread_uuid UUID, user_uuid UUID)
RETURNS TABLE (
  id UUID,
  content TEXT,
  sender_id UUID,
  sender_name TEXT,
  created_at TIMESTAMPTZ,
  parent_message_id UUID,
  message_type TEXT,
  is_current_user BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.content,
    m.sender_id,
    p.name as sender_name,
    m.created_at,
    m.parent_message_id,
    m.message_type,
    (m.sender_id = user_uuid) as is_current_user
  FROM messages m
  JOIN profiles p ON m.sender_id = p.id
  WHERE m.thread_id = thread_uuid
    AND m.moderation_status = 'approved'
  ORDER BY m.created_at ASC;
END;
$$;

-- Function to get unread message count for user
CREATE OR REPLACE FUNCTION get_unread_message_count(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM messages
  WHERE recipient_id = user_uuid
    AND read_at IS NULL
    AND moderation_status = 'approved';

  RETURN COALESCE(unread_count, 0);
END;
$$;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(
  user_uuid UUID,
  conversation_uuid UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE messages
  SET read_at = NOW()
  WHERE conversation_id = conversation_uuid
    AND recipient_id = user_uuid
    AND read_at IS NULL
    AND moderation_status = 'approved';

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  RETURN updated_count;
END;
$$;

-- RLS Policies for new tables

-- Message reports policies
ALTER TABLE message_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reports they made" ON message_reports
  FOR SELECT
  USING (auth.uid() = reported_by);

CREATE POLICY "Users can create reports" ON message_reports
  FOR INSERT
  WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Admins can manage all reports" ON message_reports
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Message audit log policies
ALTER TABLE message_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit log" ON message_audit_log
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit log" ON message_audit_log
  FOR INSERT
  WITH CHECK (true); -- Allow system inserts

CREATE POLICY "Admins can view all audit logs" ON message_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- User presence policies
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all presence" ON user_presence
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own presence" ON user_presence
  FOR ALL
  USING (auth.uid() = user_id);

-- Grant permissions for new functions
GRANT EXECUTE ON FUNCTION generate_thread_id() TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_presence(UUID, TEXT, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_send_message(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_message_thread(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_message_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_read(UUID, UUID) TO authenticated;

-- Create trigger for presence updates
CREATE OR REPLACE FUNCTION update_user_presence_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_presence_updated_at
  BEFORE UPDATE ON user_presence
  FOR EACH ROW
  EXECUTE FUNCTION update_user_presence_timestamp();

-- Add helpful comments
COMMENT ON TABLE message_reports IS 'User reports for inappropriate messages and content moderation';
COMMENT ON TABLE message_audit_log IS 'Comprehensive audit trail for all message-related actions';
COMMENT ON TABLE user_presence IS 'Real-time user presence and typing indicators for messaging';
COMMENT ON FUNCTION update_user_presence(UUID, TEXT, UUID, UUID) IS 'Updates user presence status and typing indicators';
COMMENT ON FUNCTION can_user_send_message(UUID, UUID) IS 'Checks if user has permission to send messages based on restrictions';
COMMENT ON FUNCTION get_message_thread(UUID, UUID) IS 'Retrieves all messages in a thread for display';
COMMENT ON FUNCTION mark_messages_read(UUID, UUID) IS 'Marks all unread messages in a conversation as read';