-- Add list_conversations_v2 function to support messaging page
-- This function lists all conversations for a user with full metadata

CREATE OR REPLACE FUNCTION list_conversations_v2(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversations jsonb;
BEGIN
  -- Get all conversations where user is participant
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
  WHERE c.requester_id = p_user_id OR c.helper_id = p_user_id;

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
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION list_conversations_v2(uuid) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION list_conversations_v2(uuid) IS
  'Lists all conversations for a user with full metadata including participants, help request details, and last message';
