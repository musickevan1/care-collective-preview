-- Conversation Acceptance Flow Migration
-- This migration adds the acceptance workflow where requesters must approve help offers
-- before messaging can begin (pending → accepted/rejected flow)

-- ===========================================
-- STEP 1: ADD NEW COLUMNS
-- ===========================================

-- Add acceptance workflow columns to conversations_v2
ALTER TABLE conversations_v2
  ADD COLUMN accepted_at timestamptz,
  ADD COLUMN rejected_at timestamptz,
  ADD COLUMN rejection_reason text,
  ADD COLUMN expires_at timestamptz;

-- Add check constraint: can't have both accepted_at and rejected_at
ALTER TABLE conversations_v2
  ADD CONSTRAINT accepted_or_rejected_not_both
  CHECK (
    NOT (accepted_at IS NOT NULL AND rejected_at IS NOT NULL)
  );

-- ===========================================
-- STEP 2: MIGRATE EXISTING DATA
-- ===========================================

-- Update all existing conversations to 'accepted' status for backward compatibility
-- This ensures existing conversations continue to work as before
UPDATE conversations_v2
SET
  status = 'accepted',
  accepted_at = created_at
WHERE status = 'active' OR status IS NULL;

-- ===========================================
-- STEP 3: ADD PERFORMANCE INDEX
-- ===========================================

-- Index for querying pending and accepted conversations efficiently
CREATE INDEX idx_conversations_v2_status_created
ON conversations_v2(status, created_at DESC)
WHERE status IN ('pending', 'accepted');

-- ===========================================
-- STEP 4: UPDATE create_conversation_atomic()
-- ===========================================

-- Update to create 'pending' conversations with 14-day expiry
-- Maintains security checks from 20251030_fix_v2_security_definer_auth.sql
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

  -- ATOMIC: Create conversation with status='pending' and 14-day expiry
  INSERT INTO conversations_v2 (
    help_request_id,
    requester_id,
    helper_id,
    initial_message,
    status,
    expires_at
  ) VALUES (
    p_help_request_id,
    v_requester_id,
    p_helper_id,
    p_initial_message,
    'pending',
    now() + interval '14 days'
  ) RETURNING id INTO v_conversation_id;

  v_result := jsonb_build_object(
    'success', true,
    'conversation_id', v_conversation_id,
    'status', 'pending',
    'message', 'Offer sent successfully'
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

-- ===========================================
-- STEP 5: CREATE accept_conversation()
-- ===========================================

CREATE OR REPLACE FUNCTION accept_conversation(
  p_conversation_id uuid,
  p_user_id uuid
) RETURNS jsonb SECURITY DEFINER AS $$
DECLARE
  v_conversation_status text;
  v_requester_id uuid;
  v_expires_at timestamptz;
  v_result jsonb;
BEGIN
  -- Get conversation details
  SELECT status, requester_id, expires_at
  INTO v_conversation_status, v_requester_id, v_expires_at
  FROM conversations_v2
  WHERE id = p_conversation_id;

  -- Check if conversation exists
  IF v_conversation_status IS NULL THEN
    RAISE EXCEPTION 'Conversation not found';
  END IF;

  -- Verify user is the requester
  IF v_requester_id != p_user_id THEN
    RAISE EXCEPTION 'Only the requester can accept this offer';
  END IF;

  -- Check if conversation is pending
  IF v_conversation_status != 'pending' THEN
    RAISE EXCEPTION 'Conversation is not in pending status';
  END IF;

  -- Check if conversation has expired
  IF v_expires_at IS NOT NULL AND v_expires_at < now() THEN
    RAISE EXCEPTION 'This offer has expired';
  END IF;

  -- Update conversation to accepted
  UPDATE conversations_v2
  SET
    status = 'accepted',
    accepted_at = now()
  WHERE id = p_conversation_id;

  -- Return success result
  v_result := jsonb_build_object(
    'success', true,
    'message', 'Offer accepted successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to accept offer'
    );
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- STEP 6: CREATE reject_conversation()
-- ===========================================

CREATE OR REPLACE FUNCTION reject_conversation(
  p_conversation_id uuid,
  p_user_id uuid,
  p_reason text DEFAULT NULL
) RETURNS jsonb SECURITY DEFINER AS $$
DECLARE
  v_conversation_status text;
  v_requester_id uuid;
  v_result jsonb;
BEGIN
  -- Get conversation details
  SELECT status, requester_id
  INTO v_conversation_status, v_requester_id
  FROM conversations_v2
  WHERE id = p_conversation_id;

  -- Check if conversation exists
  IF v_conversation_status IS NULL THEN
    RAISE EXCEPTION 'Conversation not found';
  END IF;

  -- Verify user is the requester
  IF v_requester_id != p_user_id THEN
    RAISE EXCEPTION 'Only the requester can reject this offer';
  END IF;

  -- Check if conversation is pending
  IF v_conversation_status != 'pending' THEN
    RAISE EXCEPTION 'Conversation is not in pending status';
  END IF;

  -- Update conversation to rejected
  UPDATE conversations_v2
  SET
    status = 'rejected',
    rejected_at = now(),
    rejection_reason = p_reason
  WHERE id = p_conversation_id;

  -- Return success result
  v_result := jsonb_build_object(
    'success', true,
    'message', 'Offer declined successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to reject offer'
    );
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- STEP 7: UPDATE send_message_v2()
-- ===========================================

-- Update to require 'accepted' status instead of 'active'
-- Maintains security checks from 20251030_fix_v2_security_definer_auth.sql
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

  -- Authorization: Check if sender is a participant AND conversation is accepted
  IF NOT EXISTS (
    SELECT 1 FROM conversations_v2
    WHERE id = p_conversation_id
    AND status = 'accepted'
    AND (requester_id = p_sender_id OR helper_id = p_sender_id)
  ) THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'permission_denied',
      'message', 'Conversation must be accepted before messaging'
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

-- ===========================================
-- STEP 8: UPDATE list_conversations_v2()
-- ===========================================

-- Update existing list_conversations_v2 to support status filtering
-- Extends 20251031000001_add_list_conversations_v2.sql with acceptance workflow fields
CREATE OR REPLACE FUNCTION list_conversations_v2(
  p_user_id uuid,
  p_status text DEFAULT NULL
) RETURNS jsonb SECURITY DEFINER AS $$
DECLARE
  v_conversations jsonb;
BEGIN
  -- Get all conversations where user is participant, with optional status filter
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'help_request_id', c.help_request_id,
      'requester_id', c.requester_id,
      'helper_id', c.helper_id,
      'initial_message', c.initial_message,
      'status', c.status,
      'created_at', c.created_at,
      'updated_at', c.updated_at,
      'accepted_at', c.accepted_at,
      'rejected_at', c.rejected_at,
      'expires_at', c.expires_at,
      -- Other participant info
      'other_participant', jsonb_build_object(
        'id', CASE
          WHEN c.requester_id = p_user_id THEN c.helper_id
          ELSE c.requester_id
        END,
        'name', CASE
          WHEN c.requester_id = p_user_id THEN helper.name
          ELSE requester.name
        END,
        'location', CASE
          WHEN c.requester_id = p_user_id THEN helper.location
          ELSE requester.location
        END
      ),
      -- Full requester profile
      'requester_profile', jsonb_build_object(
        'id', requester.id,
        'name', requester.name,
        'location', requester.location
      ),
      -- Full helper profile
      'helper_profile', jsonb_build_object(
        'id', helper.id,
        'name', helper.name,
        'location', helper.location
      ),
      -- Help request info
      'help_request', jsonb_build_object(
        'id', hr.id,
        'title', hr.title,
        'category', hr.category,
        'urgency', hr.urgency,
        'status', hr.status
      ),
      -- Last message info (initial message or latest follow-up)
      'last_message', CASE
        WHEN last_msg.content IS NOT NULL THEN
          jsonb_build_object(
            'content', last_msg.content,
            'sender_id', last_msg.sender_id,
            'created_at', last_msg.created_at
          )
        ELSE
          jsonb_build_object(
            'content', c.initial_message,
            'sender_id', c.helper_id,
            'created_at', c.created_at
          )
      END,
      -- Message count (initial + follow-ups)
      'message_count', 1 + COALESCE(msg_count.count, 0),
      -- Last activity timestamp
      'last_message_at', COALESCE(last_msg.created_at, c.created_at)
    )
    ORDER BY COALESCE(last_msg.created_at, c.created_at) DESC
  ) INTO v_conversations
  FROM conversations_v2 c
  -- Join requester profile
  LEFT JOIN profiles requester ON requester.id = c.requester_id
  -- Join helper profile
  LEFT JOIN profiles helper ON helper.id = c.helper_id
  -- Join help request
  LEFT JOIN help_requests hr ON hr.id = c.help_request_id
  -- Get last follow-up message
  LEFT JOIN LATERAL (
    SELECT content, sender_id, created_at
    FROM messages_v2
    WHERE conversation_id = c.id
    ORDER BY created_at DESC
    LIMIT 1
  ) last_msg ON true
  -- Get follow-up message count
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::int as count
    FROM messages_v2
    WHERE conversation_id = c.id
  ) msg_count ON true
  WHERE
    (c.requester_id = p_user_id OR c.helper_id = p_user_id)
    AND (p_status IS NULL OR c.status = p_status);

  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'conversations', COALESCE(v_conversations, '[]'::jsonb),
    'count', jsonb_array_length(COALESCE(v_conversations, '[]'::jsonb))
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to list conversations'
    );
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- STEP 9: UPDATE RLS POLICIES
-- ===========================================

-- Update messages_v2 RLS policy to check for 'accepted' status
DROP POLICY IF EXISTS "Participants can send messages in their conversations" ON messages_v2;

CREATE POLICY "Participants can send messages in their conversations" ON messages_v2
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations_v2
      WHERE id = conversation_id
      AND status = 'accepted'
      AND (auth.uid() = requester_id OR auth.uid() = helper_id)
    )
  );

-- ===========================================
-- STEP 10: GRANT PERMISSIONS
-- ===========================================

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION accept_conversation(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_conversation(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION list_conversations_v2(uuid, text) TO authenticated;

-- ===========================================
-- MIGRATION COMPLETE
-- ===========================================
-- Summary of changes:
-- 1. Added acceptance workflow columns (accepted_at, rejected_at, rejection_reason, expires_at)
-- 2. Migrated existing conversations to 'accepted' status
-- 3. Added performance index for status queries
-- 4. Updated create_conversation_atomic() to create 'pending' conversations
-- 5. Created accept_conversation() RPC function
-- 6. Created reject_conversation() RPC function
-- 7. Updated send_message_v2() to require 'accepted' status
-- 8. Created list_conversations_v2() RPC function with status filtering
-- 9. Updated RLS policy to enforce 'accepted' status
-- 10. Granted permissions on new functions
