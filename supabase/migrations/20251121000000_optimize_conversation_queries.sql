-- Optimize Conversation Queries - Phase 2.2 Performance Optimization
--
-- This migration creates optimized RPC functions to eliminate N+1 query problems
-- in conversation loading. The main issue was: loading 20 conversations triggered
-- 40+ additional queries (2x per conversation for unread count + last message).
--
-- Solution: Use LATERAL joins to fetch all data in a single query.
--
-- Expected performance improvement: 97% reduction in queries (40+ → 1)

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_conversations_optimized(uuid, text, int, int);

-- Create optimized conversation loading function
CREATE OR REPLACE FUNCTION get_conversations_optimized(
  p_user_id uuid,
  p_status text DEFAULT NULL,
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
  v_conversations jsonb;
BEGIN
  -- Get conversations with all related data in a single query using LATERAL joins
  SELECT jsonb_build_object(
    'conversations', jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'help_request_id', c.help_request_id,
        'created_by', c.created_by,
        'title', c.title,
        'status', c.status,
        'created_at', c.created_at,
        'updated_at', c.updated_at,
        'last_message_at', c.last_message_at,
        'help_request', CASE
          WHEN hr.id IS NOT NULL THEN jsonb_build_object(
            'id', hr.id,
            'title', hr.title,
            'category', hr.category,
            'urgency', hr.urgency,
            'status', hr.status
          )
          ELSE NULL
        END,
        'participants', participants.data,
        'last_message', last_msg.data,
        'unread_count', unread.count
      ) ORDER BY c.last_message_at DESC NULLS LAST
    ),
    'total', total.count
  ) INTO v_result
  FROM conversations c

  -- Join help request
  LEFT JOIN help_requests hr ON c.help_request_id = hr.id

  -- Get all participants for this conversation using LATERAL
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(
      jsonb_build_object(
        'user_id', p.id,
        'name', p.name,
        'location', p.location,
        'role', cp.role
      )
    ) as data
    FROM conversation_participants cp
    JOIN profiles p ON cp.user_id = p.id
    WHERE cp.conversation_id = c.id
      AND cp.left_at IS NULL
  ) participants ON true

  -- Get last message using LATERAL
  LEFT JOIN LATERAL (
    SELECT jsonb_build_object(
      'id', m.id,
      'content', m.content,
      'sender_id', m.sender_id,
      'created_at', m.created_at
    ) as data
    FROM messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) last_msg ON true

  -- Get unread count using LATERAL
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::bigint as count
    FROM messages m
    WHERE m.conversation_id = c.id
      AND m.recipient_id = p_user_id
      AND m.read_at IS NULL
  ) unread ON true

  -- Get total count
  CROSS JOIN (
    SELECT COUNT(*)::bigint as count
    FROM conversations c2
    INNER JOIN conversation_participants cp2 ON c2.id = cp2.conversation_id
    WHERE cp2.user_id = p_user_id
      AND cp2.left_at IS NULL
      AND (p_status IS NULL OR c2.status = p_status)
  ) total

  -- Filter conversations where user is participant
  WHERE EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = c.id
      AND cp.user_id = p_user_id
      AND cp.left_at IS NULL
  )
  AND (p_status IS NULL OR c.status = p_status)

  -- Order by most recent activity
  ORDER BY c.last_message_at DESC NULLS LAST, c.updated_at DESC

  -- Pagination
  LIMIT p_limit
  OFFSET p_offset;

  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_conversations_optimized(uuid, text, int, int) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION get_conversations_optimized(uuid, text, int, int) IS
  'Optimized conversation loading with LATERAL joins to eliminate N+1 queries. Returns all conversation data including participants, last message, and unread count in a single query.';

-- Create composite index for user filtering + sorting (if not exists)
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_active
  ON conversation_participants(user_id, conversation_id) WHERE left_at IS NULL;
