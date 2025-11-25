-- Fix get_conversations_optimized RPC to Query V2 Tables
--
-- CRITICAL BUG FIX: Previous version (20251121) queried V1 tables
-- (conversations, conversation_participants) but accepted help requests
-- are stored in V2 tables (conversations_v2, messages_v2).
--
-- Result: Accepted conversations never appeared in inbox.
--
-- This migration:
-- 1. Drops the broken V1-only RPC function
-- 2. Creates V2-compatible version that queries conversations_v2
-- 3. Maintains all performance optimizations (LATERAL joins)

-- Drop the broken version
DROP FUNCTION IF EXISTS get_conversations_optimized(uuid, text, int, int);

-- Create V2-compatible optimized conversation loading function
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
BEGIN
  -- Get conversations with all related data in a single query using LATERAL joins
  SELECT jsonb_build_object(
    'conversations', jsonb_agg(conv_data ORDER BY sort_date DESC NULLS LAST),
    'total', total.count
  ) INTO v_result
  FROM (
    SELECT
      jsonb_build_object(
        'id', c.id,
        'help_request_id', c.help_request_id,
        'requester_id', c.requester_id,
        'helper_id', c.helper_id,
        'status', c.status,
        'created_at', c.created_at,
        'updated_at', c.updated_at,
        'initial_message', c.initial_message,

        -- Help request details (if exists)
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

        -- Participants array (requester + helper profiles)
        'participants', jsonb_build_array(
          jsonb_build_object(
            'user_id', rp.id,
            'name', rp.name,
            'location', rp.location,
            'role', 'requester'
          ),
          jsonb_build_object(
            'user_id', hp.id,
            'name', hp.name,
            'location', hp.location,
            'role', 'helper'
          )
        ),

        -- Last message (using LATERAL join for performance)
        'last_message', lm.data,

        -- Unread count (using LATERAL join for performance)
        'unread_count', unread.count
      ) as conv_data,
      c.updated_at as sort_date

    FROM conversations_v2 c

    -- Join help request details
    LEFT JOIN help_requests hr ON c.help_request_id = hr.id

    -- Join requester profile
    LEFT JOIN profiles rp ON c.requester_id = rp.id

    -- Join helper profile
    LEFT JOIN profiles hp ON c.helper_id = hp.id

    -- Get last message using LATERAL (more efficient than subquery)
    LEFT JOIN LATERAL (
      SELECT jsonb_build_object(
        'id', m.id,
        'content', m.content,
        'sender_id', m.sender_id,
        'created_at', m.created_at
      ) as data
      FROM messages_v2 m
      WHERE m.conversation_id = c.id
      ORDER BY m.created_at DESC
      LIMIT 1
    ) lm ON true

    -- Get unread count using LATERAL
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::bigint as count
      FROM messages_v2 m
      WHERE m.conversation_id = c.id
        AND m.recipient_id = p_user_id
        AND m.read_at IS NULL
    ) unread ON true

    -- Filter: user must be either requester or helper
    WHERE (c.requester_id = p_user_id OR c.helper_id = p_user_id)
      AND (p_status IS NULL OR c.status = p_status)

    -- Pagination
    LIMIT p_limit
    OFFSET p_offset
  ) conversations

  -- Get total count for pagination
  CROSS JOIN (
    SELECT COUNT(*)::bigint as count
    FROM conversations_v2 c
    WHERE (c.requester_id = p_user_id OR c.helper_id = p_user_id)
      AND (p_status IS NULL OR c.status = p_status)
  ) total;

  RETURN COALESCE(v_result, jsonb_build_object('conversations', '[]'::jsonb, 'total', 0));
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_conversations_optimized(uuid, text, int, int) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION get_conversations_optimized(uuid, text, int, int) IS
  'V2-compatible optimized conversation loading with LATERAL joins. Queries conversations_v2 table for help request-based conversations. Eliminates N+1 queries by fetching all data in a single query.';

-- Create index on conversations_v2.updated_at for efficient sorting (if not exists)
CREATE INDEX IF NOT EXISTS idx_conversations_v2_updated_at
  ON conversations_v2(updated_at DESC);

-- Create composite indexes for user filtering + sorting (if not exists)
CREATE INDEX IF NOT EXISTS idx_conversations_v2_requester_updated
  ON conversations_v2(requester_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_v2_helper_updated
  ON conversations_v2(helper_id, updated_at DESC);
