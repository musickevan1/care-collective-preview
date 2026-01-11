-- Messaging System V2 - Complete Atomic Rebuild
-- This migration creates a new messaging system that runs alongside V1
-- Key improvements: Atomic conversation creation, embedded initial messages, no race conditions

-- ===========================================
-- V2 TABLES
-- ===========================================

-- Conversations V2 table with embedded initial message
CREATE TABLE conversations_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  help_request_id uuid NOT NULL REFERENCES help_requests(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id),
  helper_id uuid NOT NULL REFERENCES auth.users(id),
  initial_message text NOT NULL CHECK (length(initial_message) >= 10 AND length(initial_message) <= 1000),
  status conversation_status DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Ensure requester and helper are different
  CONSTRAINT different_participants CHECK (requester_id != helper_id),

  -- Ensure only one conversation per help request per helper
  CONSTRAINT unique_help_request_helper UNIQUE (help_request_id, helper_id)
);

-- Messages V2 table (follow-up messages only, initial message is in conversations_v2)
CREATE TABLE messages_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations_v2(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  content text NOT NULL CHECK (length(content) >= 1 AND length(content) <= 1000),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ===========================================
-- V2 INDEXES
-- ===========================================

-- Performance indexes for conversations_v2
CREATE INDEX idx_conversations_v2_help_request_id ON conversations_v2(help_request_id);
CREATE INDEX idx_conversations_v2_requester_id ON conversations_v2(requester_id);
CREATE INDEX idx_conversations_v2_helper_id ON conversations_v2(helper_id);
CREATE INDEX idx_conversations_v2_status ON conversations_v2(status);
CREATE INDEX idx_conversations_v2_created_at ON conversations_v2(created_at DESC);

-- Performance indexes for messages_v2
CREATE INDEX idx_messages_v2_conversation_id ON messages_v2(conversation_id);
CREATE INDEX idx_messages_v2_sender_id ON messages_v2(sender_id);
CREATE INDEX idx_messages_v2_created_at ON messages_v2(created_at DESC);

-- ===========================================
-- V2 RLS POLICIES
-- ===========================================

-- Enable RLS
ALTER TABLE conversations_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages_v2 ENABLE ROW LEVEL SECURITY;

-- Conversations V2 policies
CREATE POLICY "Users can view conversations they participate in" ON conversations_v2
  FOR SELECT USING (
    auth.uid() = requester_id OR auth.uid() = helper_id
  );

CREATE POLICY "Users can create conversations for help requests" ON conversations_v2
  FOR INSERT WITH CHECK (
    auth.uid() = helper_id AND
    -- Ensure the help request exists and is still open
    EXISTS (
      SELECT 1 FROM help_requests
      WHERE id = help_request_id
      AND status IN ('open', 'in_progress')
    )
  );

CREATE POLICY "Participants can update conversation status" ON conversations_v2
  FOR UPDATE USING (
    auth.uid() = requester_id OR auth.uid() = helper_id
  );

-- Messages V2 policies
CREATE POLICY "Participants can view messages in their conversations" ON messages_v2
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations_v2
      WHERE id = conversation_id
      AND (auth.uid() = requester_id OR auth.uid() = helper_id)
    )
  );

CREATE POLICY "Participants can send messages in their conversations" ON messages_v2
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations_v2
      WHERE id = conversation_id
      AND status = 'active'
      AND (auth.uid() = requester_id OR auth.uid() = helper_id)
    )
  );

-- ===========================================
-- V2 FUNCTIONS
-- ===========================================

-- Atomic conversation creation function
-- This is the core of V2 - creates conversation + initial message in one transaction
CREATE OR REPLACE FUNCTION create_conversation_atomic(
  p_help_request_id uuid,
  p_helper_id uuid,
  p_initial_message text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id uuid;
  v_requester_id uuid;
  v_result jsonb;
BEGIN
  -- Input validation
  IF p_initial_message IS NULL OR length(trim(p_initial_message)) < 10 THEN
    RAISE EXCEPTION 'Initial message must be at least 10 characters long';
  END IF;

  IF length(p_initial_message) > 1000 THEN
    RAISE EXCEPTION 'Initial message cannot exceed 1000 characters';
  END IF;

  -- Get requester_id from help request
  SELECT user_id INTO v_requester_id
  FROM help_requests
  WHERE id = p_help_request_id;

  IF v_requester_id IS NULL THEN
    RAISE EXCEPTION 'Help request not found';
  END IF;

  -- Ensure helper is not the requester
  IF p_helper_id = v_requester_id THEN
    RAISE EXCEPTION 'Cannot create conversation with yourself';
  END IF;

  -- Check if help request is still available
  IF NOT EXISTS (
    SELECT 1 FROM help_requests
    WHERE id = p_help_request_id
    AND status IN ('open', 'in_progress')
  ) THEN
    RAISE EXCEPTION 'Help request is no longer available';
  END IF;

  -- Check for existing conversation (prevent duplicates)
  IF EXISTS (
    SELECT 1 FROM conversations_v2
    WHERE help_request_id = p_help_request_id
    AND helper_id = p_helper_id
  ) THEN
    RAISE EXCEPTION 'Conversation already exists for this help request and helper';
  END IF;

  -- Atomic transaction: Create conversation with embedded initial message
  INSERT INTO conversations_v2 (
    help_request_id,
    requester_id,
    helper_id,
    initial_message,
    status
  ) VALUES (
    p_help_request_id,
    v_requester_id,
    p_helper_id,
    trim(p_initial_message),
    'active'
  ) RETURNING id INTO v_conversation_id;

  -- Return success result
  v_result := jsonb_build_object(
    'success', true,
    'conversation_id', v_conversation_id,
    'message', 'Conversation created successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Return error result
    v_result := jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to create conversation'
    );
    RETURN v_result;
END;
$$;

-- Function to send follow-up messages
CREATE OR REPLACE FUNCTION send_message_v2(
  p_conversation_id uuid,
  p_sender_id uuid,
  p_content text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_message_id uuid;
  v_result jsonb;
BEGIN
  -- Input validation
  IF p_content IS NULL OR length(trim(p_content)) < 1 THEN
    RAISE EXCEPTION 'Message content cannot be empty';
  END IF;

  IF length(p_content) > 1000 THEN
    RAISE EXCEPTION 'Message cannot exceed 1000 characters';
  END IF;

  -- Verify sender is participant and conversation is active
  IF NOT EXISTS (
    SELECT 1 FROM conversations_v2
    WHERE id = p_conversation_id
    AND status = 'active'
    AND (requester_id = p_sender_id OR helper_id = p_sender_id)
  ) THEN
    RAISE EXCEPTION 'Not authorized to send messages in this conversation';
  END IF;

  -- Insert message
  INSERT INTO messages_v2 (
    conversation_id,
    sender_id,
    content
  ) VALUES (
    p_conversation_id,
    p_sender_id,
    trim(p_content)
  ) RETURNING id INTO v_message_id;

  -- Return success result
  v_result := jsonb_build_object(
    'success', true,
    'message_id', v_message_id,
    'message', 'Message sent successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to send message'
    );
    RETURN v_result;
END;
$$;

-- Function to get conversation with all messages
CREATE OR REPLACE FUNCTION get_conversation_v2(p_conversation_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation jsonb;
  v_messages jsonb;
  v_result jsonb;
BEGIN
  -- Get conversation details
  SELECT jsonb_build_object(
    'id', c.id,
    'help_request_id', c.help_request_id,
    'requester_id', c.requester_id,
    'helper_id', c.helper_id,
    'initial_message', c.initial_message,
    'status', c.status,
    'created_at', c.created_at,
    'updated_at', c.updated_at
  ) INTO v_conversation
  FROM conversations_v2 c
  WHERE c.id = p_conversation_id
  AND (c.requester_id = p_user_id OR c.helper_id = p_user_id);

  IF v_conversation IS NULL THEN
    RAISE EXCEPTION 'Conversation not found or access denied';
  END IF;

  -- Get all messages
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', m.id,
      'sender_id', m.sender_id,
      'content', m.content,
      'created_at', m.created_at,
      'updated_at', m.updated_at
    ) ORDER BY m.created_at ASC
  ) INTO v_messages
  FROM messages_v2 m
  WHERE m.conversation_id = p_conversation_id;

  -- Build result
  v_result := jsonb_build_object(
    'conversation', v_conversation,
    'messages', COALESCE(v_messages, '[]'::jsonb)
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
    RETURN v_result;
END;
$$;

-- ===========================================
-- V2 TRIGGERS
-- ===========================================

-- Update updated_at timestamp for conversations_v2
CREATE OR REPLACE FUNCTION update_conversations_v2_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER conversations_v2_updated_at
  BEFORE UPDATE ON conversations_v2
  FOR EACH ROW EXECUTE FUNCTION update_conversations_v2_updated_at();

-- Update updated_at timestamp for messages_v2
CREATE OR REPLACE FUNCTION update_messages_v2_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_v2_updated_at
  BEFORE UPDATE ON messages_v2
  FOR EACH ROW EXECUTE FUNCTION update_messages_v2_updated_at();

-- ===========================================
-- GRANTS
-- ===========================================

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON conversations_v2 TO authenticated;
GRANT SELECT, INSERT ON messages_v2 TO authenticated;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION create_conversation_atomic(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION send_message_v2(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_v2(uuid, uuid) TO authenticated;