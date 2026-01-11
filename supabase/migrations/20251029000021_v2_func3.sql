CREATE OR REPLACE FUNCTION get_conversation_v2(p_conversation_id uuid, p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_conversation jsonb;
  v_messages jsonb;
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object('id', c.id, 'help_request_id', c.help_request_id, 'requester_id', c.requester_id, 'helper_id', c.helper_id, 'initial_message', c.initial_message, 'status', c.status, 'created_at', c.created_at, 'updated_at', c.updated_at)
  INTO v_conversation FROM conversations_v2 c WHERE c.id = p_conversation_id AND (c.requester_id = p_user_id OR c.helper_id = p_user_id);
  IF v_conversation IS NULL THEN
    RAISE EXCEPTION 'Conversation not found or access denied';
  END IF;
  SELECT jsonb_agg(jsonb_build_object('id', m.id, 'sender_id', m.sender_id, 'content', m.content, 'created_at', m.created_at, 'updated_at', m.updated_at) ORDER BY m.created_at ASC)
  INTO v_messages FROM messages_v2 m WHERE m.conversation_id = p_conversation_id;
  v_result := jsonb_build_object('conversation', v_conversation, 'messages', COALESCE(v_messages, '[]'::jsonb));
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    v_result := jsonb_build_object('success', false, 'error', SQLERRM);
    RETURN v_result;
END;
$$;
