-- Migration: Add composite index for optimized inbox pagination
-- Created: 2025-11-02
-- Purpose: Optimize queries for unread messages in user inbox
--
-- This index improves performance for queries like:
-- SELECT * FROM messages
-- WHERE recipient_id = ? AND read_at IS NULL
-- ORDER BY conversation_id, created_at DESC

-- Add composite index for inbox pagination (V1 messages table)
-- This index is partial (only for unread messages) to keep it small and fast
CREATE INDEX IF NOT EXISTS idx_messages_inbox_pagination
ON messages(recipient_id, conversation_id, created_at DESC)
WHERE read_at IS NULL;

-- Add comment explaining the index purpose
COMMENT ON INDEX idx_messages_inbox_pagination IS
'Composite index for efficient inbox pagination queries. Optimizes fetching unread messages grouped by conversation.';
