-- CRITICAL SECURITY FIX: Add auth.uid() verification to V2 RPC functions
-- This prevents user impersonation attacks

-- Fix 1: create_conversation_atomic
CREATE OR REPLACE FUNCTION create_conversation_atomic(
  p_help_request_id uuid,
  p_helper_id uuid,
  p_initial_message text
) RETURNS jsonb SECURITY DEFINER AS $$
DECLARE
  v_conversation_id uuid;
  v_requester_id uuid;
  v_result jsonb;
BEGIN
  -- SECURITY CHECK: Verify caller is the helper (prevent impersonation)
  IF p_helper_id != auth.uid() THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'permission_denied',
      'message', 'Cannot create conversation on behalf of another user'
    );
    RETURN v_result;
  END IF;

  -- Message length validation
  IF p_initial_message IS NULL OR length(trim(p_initial_message)) < 10 THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'validation_error',
      'message', 'Initial message must be at least 10 characters long'
    );
    RETURN v_result;
  END IF;

  IF length(p_initial_message) > 1000 THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'validation_error',
      'message', 'Initial message cannot exceed 1000 characters'
    );
    RETURN v_result;
  END IF;

  -- Get help request owner (requester)
  SELECT user_id INTO v_requester_id
  FROM help_requests
  WHERE id = p_help_request_id;

  IF v_requester_id IS NULL THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'not_found',
      'message', 'Help request not found'
    );
    RETURN v_result;
  END IF;

  -- Prevent self-help
  IF p_helper_id = v_requester_id THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'validation_error',
      'message', 'Cannot create conversation with yourself'
    );
    RETURN v_result;
  END IF;

  -- Check if help request is still available
  IF NOT EXISTS (
    SELECT 1 FROM help_requests
    WHERE id = p_help_request_id
    AND status IN ('open', 'in_progress')
  ) THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'help_request_unavailable',
      'message', 'Help request is no longer available'
    );
    RETURN v_result;
  END IF;

  -- Check for duplicate conversation
  IF EXISTS (
    SELECT 1 FROM conversations_v2
    WHERE help_request_id = p_help_request_id
    AND helper_id = p_helper_id
  ) THEN
    -- Get existing conversation_id
    SELECT id INTO v_conversation_id
    FROM conversations_v2
    WHERE help_request_id = p_help_request_id
    AND helper_id = p_helper_id
    LIMIT 1;

    v_result := jsonb_build_object(
      'success', false,
      'error', 'conversation_exists',
      'message', 'Conversation already exists for this help request and helper',
      'conversation_id', v_conversation_id
    );
    RETURN v_result;
  END IF;

  -- ATOMIC: Create conversation with embedded initial message
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
    p_initial_message,
    'active'
  ) RETURNING id INTO v_conversation_id;

  v_result := jsonb_build_object(
    'success', true,
    'conversation_id', v_conversation_id,
    'message', 'Conversation created successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'server_error',
      'message', 'Failed to create conversation',
      'details', SQLERRM
    );
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Fix 2: send_message_v2
CREATE OR REPLACE FUNCTION send_message_v2(
  p_conversation_id uuid,
  p_sender_id uuid,
  p_content text
) RETURNS jsonb SECURITY DEFINER AS $$
DECLARE
  v_message_id uuid;
  v_result jsonb;
BEGIN
  -- SECURITY CHECK: Verify caller is the sender (prevent impersonation)
  IF p_sender_id != auth.uid() THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'permission_denied',
      'message', 'Cannot send message on behalf of another user'
    );
    RETURN v_result;
  END IF;

  -- Content validation
  IF p_content IS NULL OR length(trim(p_content)) < 1 THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'validation_error',
      'message', 'Message content cannot be empty'
    );
    RETURN v_result;
  END IF;

  IF length(p_content) > 1000 THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'validation_error',
      'message', 'Message cannot exceed 1000 characters'
    );
    RETURN v_result;
  END IF;

  -- Authorization: Check if sender is a participant
  IF NOT EXISTS (
    SELECT 1 FROM conversations_v2
    WHERE id = p_conversation_id
    AND status = 'active'
    AND (requester_id = p_sender_id OR helper_id = p_sender_id)
  ) THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'permission_denied',
      'message', 'Not authorized to send messages in this conversation'
    );
    RETURN v_result;
  END IF;

  -- Insert message
  INSERT INTO messages_v2 (
    conversation_id,
    sender_id,
    content
  ) VALUES (
    p_conversation_id,
    p_sender_id,
    p_content
  ) RETURNING id INTO v_message_id;

  -- Update conversation last_message_at
  UPDATE conversations_v2
  SET updated_at = now()
  WHERE id = p_conversation_id;

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
      'error', 'server_error',
      'message', 'Failed to send message',
      'details', SQLERRM
    );
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Fix 3: get_conversation_v2
CREATE OR REPLACE FUNCTION get_conversation_v2(
  p_conversation_id uuid,
  p_user_id uuid
) RETURNS jsonb SECURITY DEFINER AS $$
DECLARE
  v_conversation jsonb;
  v_messages jsonb;
  v_result jsonb;
BEGIN
  -- SECURITY CHECK: Verify caller is requesting their own conversation
  IF p_user_id != auth.uid() THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'permission_denied',
      'message', 'Cannot access conversation for another user'
    );
    RETURN v_result;
  END IF;

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
    v_result := jsonb_build_object(
      'success', false,
      'error', 'not_found',
      'message', 'Conversation not found or you do not have access'
    );
    RETURN v_result;
  END IF;

  -- Get messages
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

  v_result := jsonb_build_object(
    'success', true,
    'conversation', v_conversation,
    'messages', COALESCE(v_messages, '[]'::jsonb)
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'server_error',
      'message', 'Failed to get conversation',
      'details', SQLERRM
    );
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_conversation_atomic(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION send_message_v2(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_v2(uuid, uuid) TO authenticated;
