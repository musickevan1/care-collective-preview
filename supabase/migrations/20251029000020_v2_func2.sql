CREATE OR REPLACE FUNCTION send_message_v2(p_conversation_id uuid, p_sender_id uuid, p_content text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_message_id uuid;
  v_result jsonb;
BEGIN
  IF p_content IS NULL OR length(trim(p_content)) < 1 THEN
    RAISE EXCEPTION 'Message content cannot be empty';
  END IF;
  IF length(p_content) > 1000 THEN
    RAISE EXCEPTION 'Message cannot exceed 1000 characters';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM conversations_v2 WHERE id = p_conversation_id AND status = 'active' AND (requester_id = p_sender_id OR helper_id = p_sender_id)) THEN
    RAISE EXCEPTION 'Not authorized to send messages in this conversation';
  END IF;
  INSERT INTO messages_v2 (conversation_id, sender_id, content) VALUES (p_conversation_id, p_sender_id, trim(p_content)) RETURNING id INTO v_message_id;
  v_result := jsonb_build_object('success', true, 'message_id', v_message_id, 'message', 'Message sent successfully');
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    v_result := jsonb_build_object('success', false, 'error', SQLERRM, 'message', 'Failed to send message');
    RETURN v_result;
END;
$$;
