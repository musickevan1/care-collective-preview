-- Migration: Create System Conversation RPC Function
-- Creates a function to create system conversations (like welcome messages)
-- without requiring a help_request_id

CREATE OR REPLACE FUNCTION create_system_conversation(
  p_user_id uuid,
  p_system_user_id uuid,
  p_message text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id uuid;
  v_existing_id uuid;
BEGIN
  -- Validate message length
  IF p_message IS NULL OR length(trim(p_message)) < 10 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Message must be at least 10 characters'
    );
  END IF;

  IF length(p_message) > 1000 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Message cannot exceed 1000 characters'
    );
  END IF;

  -- Validate that system user exists and is marked as system
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_system_user_id AND is_system_user = true
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid system user'
    );
  END IF;

  -- Check if system conversation already exists for this user
  SELECT id INTO v_existing_id
  FROM conversations_v2
  WHERE help_request_id IS NULL
    AND requester_id = p_user_id
    AND helper_id = p_system_user_id;

  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Welcome conversation already exists',
      'existing_conversation_id', v_existing_id
    );
  END IF;

  -- Create the system conversation
  -- helper_id is the system user, requester_id is the user receiving the message
  INSERT INTO conversations_v2 (
    help_request_id,
    requester_id,
    helper_id,
    initial_message,
    status,
    created_at,
    updated_at
  ) VALUES (
    NULL,
    p_user_id,
    p_system_user_id,
    trim(p_message),
    'active',
    now(),
    now()
  ) RETURNING id INTO v_conversation_id;

  RETURN jsonb_build_object(
    'success', true,
    'conversation_id', v_conversation_id,
    'message', 'System conversation created successfully'
  );

EXCEPTION
  WHEN unique_violation THEN
    -- Handle race condition where conversation was created between check and insert
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Welcome conversation already exists'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute to service_role only (called from server-side code)
GRANT EXECUTE ON FUNCTION create_system_conversation(uuid, uuid, text) TO service_role;

-- Revoke from public and authenticated to prevent direct client calls
REVOKE EXECUTE ON FUNCTION create_system_conversation(uuid, uuid, text) FROM public;
REVOKE EXECUTE ON FUNCTION create_system_conversation(uuid, uuid, text) FROM authenticated;

-- Add documentation
COMMENT ON FUNCTION create_system_conversation(uuid, uuid, text) IS
  'Creates a system conversation (like welcome message) between a system user and a regular user. Only callable via service_role.';
