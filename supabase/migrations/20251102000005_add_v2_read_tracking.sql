-- Migration: Add Read Tracking to V2 Messaging System
-- Purpose: Enable unread message counters and read status tracking for messages_v2/conversations_v2
-- Phase: 1.1 - Critical Quick Win
-- Date: 2025-01-02

-- ============================================================================
-- 1. Add Read Tracking Columns
-- ============================================================================

-- Add read_at timestamp to messages_v2 (null = unread)
ALTER TABLE messages_v2
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ DEFAULT NULL;

-- Add last_read_at to conversations_v2 (when user last viewed conversation)
ALTER TABLE conversations_v2
ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ DEFAULT NULL;

-- ============================================================================
-- 2. Create Performance Indexes
-- ============================================================================

-- Index for efficient unread message queries
CREATE INDEX IF NOT EXISTS idx_messages_v2_unread
ON messages_v2 (recipient_id, read_at)
WHERE read_at IS NULL;

-- Index for conversation-specific unread queries
CREATE INDEX IF NOT EXISTS idx_messages_v2_conversation_unread
ON messages_v2 (conversation_id, recipient_id, read_at)
WHERE read_at IS NULL;

-- Index for timestamp-based queries (pagination)
CREATE INDEX IF NOT EXISTS idx_messages_v2_created
ON messages_v2 (conversation_id, created_at DESC);

-- ============================================================================
-- 3. Database Functions for Read Tracking
-- ============================================================================

-- Function: Get total unread count for a user across all conversations
CREATE OR REPLACE FUNCTION get_unread_count_v2(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM messages_v2
  WHERE recipient_id = user_uuid
    AND read_at IS NULL
    AND deleted_at IS NULL;

  RETURN COALESCE(unread_count, 0);
END;
$$;

-- Function: Get unread count for a specific conversation
CREATE OR REPLACE FUNCTION get_conversation_unread_count_v2(
  user_uuid UUID,
  conversation_uuid UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM messages_v2
  WHERE conversation_id = conversation_uuid
    AND recipient_id = user_uuid
    AND read_at IS NULL
    AND deleted_at IS NULL;

  RETURN COALESCE(unread_count, 0);
END;
$$;

-- Function: Mark all messages in a conversation as read for a user
CREATE OR REPLACE FUNCTION mark_conversation_read_v2(
  user_uuid UUID,
  conversation_uuid UUID
)
RETURNS TABLE (
  marked_count INTEGER,
  success BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  -- Update all unread messages in the conversation for this user
  UPDATE messages_v2
  SET read_at = NOW()
  WHERE conversation_id = conversation_uuid
    AND recipient_id = user_uuid
    AND read_at IS NULL
    AND deleted_at IS NULL;

  GET DIAGNOSTICS rows_updated = ROW_COUNT;

  -- Update last_read_at timestamp on the conversation
  UPDATE conversations_v2
  SET last_read_at = NOW()
  WHERE id = conversation_uuid
    AND (
      requester_id = user_uuid OR helper_id = user_uuid
    );

  RETURN QUERY SELECT rows_updated, TRUE;
END;
$$;

-- Function: Mark all messages as read for a user across all conversations
CREATE OR REPLACE FUNCTION mark_all_messages_read_v2(user_uuid UUID)
RETURNS TABLE (
  marked_count INTEGER,
  success BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  -- Update all unread messages for this user
  UPDATE messages_v2
  SET read_at = NOW()
  WHERE recipient_id = user_uuid
    AND read_at IS NULL
    AND deleted_at IS NULL;

  GET DIAGNOSTICS rows_updated = ROW_COUNT;

  -- Update last_read_at for all conversations user is part of
  UPDATE conversations_v2
  SET last_read_at = NOW()
  WHERE requester_id = user_uuid OR helper_id = user_uuid;

  RETURN QUERY SELECT rows_updated, TRUE;
END;
$$;

-- Function: Mark a single message as read
CREATE OR REPLACE FUNCTION mark_message_read_v2(
  user_uuid UUID,
  message_uuid UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE messages_v2
  SET read_at = NOW()
  WHERE id = message_uuid
    AND recipient_id = user_uuid
    AND read_at IS NULL
    AND deleted_at IS NULL;

  GET DIAGNOSTICS rows_updated = ROW_COUNT;

  RETURN rows_updated > 0;
END;
$$;

-- ============================================================================
-- 4. Create Updated View with Unread Counts
-- ============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS conversation_list_v2;

-- Create view that includes unread counts per conversation
CREATE OR REPLACE VIEW conversation_list_v2 AS
SELECT
  c.id,
  c.request_id,
  c.requester_id,
  c.helper_id,
  c.status,
  c.created_at,
  c.updated_at,
  c.last_read_at,
  c.requester_accepted_at,
  c.helper_accepted_at,

  -- Requester profile
  req_profile.name AS requester_name,
  req_profile.location AS requester_location,

  -- Helper profile
  helper_profile.name AS helper_name,
  helper_profile.location AS helper_location,

  -- Last message info
  latest_msg.content AS last_message,
  latest_msg.created_at AS last_message_at,
  latest_msg.sender_id AS last_sender_id,

  -- Request details
  hr.title AS request_title,
  hr.category AS request_category,
  hr.urgency AS request_urgency,

  -- Unread count for requester
  (
    SELECT COUNT(*)
    FROM messages_v2 m
    WHERE m.conversation_id = c.id
      AND m.recipient_id = c.requester_id
      AND m.read_at IS NULL
      AND m.deleted_at IS NULL
  ) AS requester_unread_count,

  -- Unread count for helper
  (
    SELECT COUNT(*)
    FROM messages_v2 m
    WHERE m.conversation_id = c.id
      AND m.recipient_id = c.helper_id
      AND m.read_at IS NULL
      AND m.deleted_at IS NULL
  ) AS helper_unread_count

FROM conversations_v2 c
LEFT JOIN profiles req_profile ON c.requester_id = req_profile.id
LEFT JOIN profiles helper_profile ON c.helper_id = helper_profile.id
LEFT JOIN help_requests hr ON c.request_id = hr.id
LEFT JOIN LATERAL (
  SELECT content, created_at, sender_id
  FROM messages_v2
  WHERE conversation_id = c.id
    AND deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1
) latest_msg ON TRUE;

-- ============================================================================
-- 5. Grant Permissions
-- ============================================================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_unread_count_v2(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_unread_count_v2(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_conversation_read_v2(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_messages_read_v2(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_message_read_v2(UUID, UUID) TO authenticated;

-- Grant select on the view
GRANT SELECT ON conversation_list_v2 TO authenticated;

-- ============================================================================
-- 6. Comments for Documentation
-- ============================================================================

COMMENT ON COLUMN messages_v2.read_at IS 'Timestamp when message was read by recipient (NULL = unread)';
COMMENT ON COLUMN conversations_v2.last_read_at IS 'Timestamp when user last viewed this conversation';
COMMENT ON FUNCTION get_unread_count_v2(UUID) IS 'Returns total unread message count for a user';
COMMENT ON FUNCTION get_conversation_unread_count_v2(UUID, UUID) IS 'Returns unread count for specific conversation';
COMMENT ON FUNCTION mark_conversation_read_v2(UUID, UUID) IS 'Marks all messages in conversation as read';
COMMENT ON FUNCTION mark_all_messages_read_v2(UUID) IS 'Marks all messages as read for user';
COMMENT ON FUNCTION mark_message_read_v2(UUID, UUID) IS 'Marks a single message as read';
COMMENT ON VIEW conversation_list_v2 IS 'Materialized view of conversations with unread counts and latest message';

-- ============================================================================
-- 7. Migration Verification
-- ============================================================================

-- Verify columns were added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages_v2' AND column_name = 'read_at'
  ) THEN
    RAISE EXCEPTION 'Migration failed: read_at column not added to messages_v2';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations_v2' AND column_name = 'last_read_at'
  ) THEN
    RAISE EXCEPTION 'Migration failed: last_read_at column not added to conversations_v2';
  END IF;

  RAISE NOTICE 'Migration successful: V2 read tracking enabled';
END $$;
