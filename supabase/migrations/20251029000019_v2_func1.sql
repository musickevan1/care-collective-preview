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
  IF p_initial_message IS NULL OR length(trim(p_initial_message)) < 10 THEN
    RAISE EXCEPTION 'Initial message must be at least 10 characters long';
  END IF;
  IF length(p_initial_message) > 1000 THEN
    RAISE EXCEPTION 'Initial message cannot exceed 1000 characters';
  END IF;
  SELECT user_id INTO v_requester_id FROM help_requests WHERE id = p_help_request_id;
  IF v_requester_id IS NULL THEN
    RAISE EXCEPTION 'Help request not found';
  END IF;
  IF p_helper_id = v_requester_id THEN
    RAISE EXCEPTION 'Cannot create conversation with yourself';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM help_requests WHERE id = p_help_request_id AND status IN ('open', 'in_progress')) THEN
    RAISE EXCEPTION 'Help request is no longer available';
  END IF;
  IF EXISTS (SELECT 1 FROM conversations_v2 WHERE help_request_id = p_help_request_id AND helper_id = p_helper_id) THEN
    RAISE EXCEPTION 'Conversation already exists for this help request and helper';
  END IF;
  INSERT INTO conversations_v2 (help_request_id, requester_id, helper_id, initial_message, status)
  VALUES (p_help_request_id, v_requester_id, p_helper_id, trim(p_initial_message), 'active')
  RETURNING id INTO v_conversation_id;
  v_result := jsonb_build_object('success', true, 'conversation_id', v_conversation_id, 'message', 'Conversation created successfully');
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    v_result := jsonb_build_object('success', false, 'error', SQLERRM, 'message', 'Failed to create conversation');
    RETURN v_result;
END;
$$;
