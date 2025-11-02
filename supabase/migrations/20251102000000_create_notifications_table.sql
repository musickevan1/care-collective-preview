-- Create notifications table for in-app notification system (Phase 2)
-- Part of the Care Collective notification system implementation

-- Create notification type enum
CREATE TYPE notification_type AS ENUM (
  'new_message',
  'help_request_offer',
  'help_request_accepted',
  'help_request_completed',
  'help_request_cancelled',
  'system_announcement'
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  content text,
  related_id uuid, -- ID of related message, help request, etc.
  related_type text, -- Type of related entity: 'message', 'help_request', 'conversation'
  action_url text, -- URL to navigate to when notification is clicked
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notifications_title_length CHECK (char_length(title) <= 200),
  CONSTRAINT notifications_content_length CHECK (char_length(content) <= 500)
);

-- Add indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_related ON notifications(related_id, related_type);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Only system/authenticated users can create notifications (via service role)
CREATE POLICY "Authenticated users can create notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to mark a notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notifications
  SET read_at = now()
  WHERE id = notification_id
    AND user_id = auth.uid()
    AND read_at IS NULL;
END;
$$;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notifications
  SET read_at = now()
  WHERE user_id = auth.uid()
    AND read_at IS NULL;
END;
$$;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  count bigint;
BEGIN
  SELECT COUNT(*)
  INTO count
  FROM notifications
  WHERE user_id = auth.uid()
    AND read_at IS NULL;

  RETURN count;
END;
$$;

-- Function to automatically clean up old read notifications (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM notifications
  WHERE read_at IS NOT NULL
    AND read_at < now() - interval '30 days';
END;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION mark_notification_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read() TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_notifications() TO service_role;

-- Add comment for documentation
COMMENT ON TABLE notifications IS 'In-app notifications for users - Phase 2 of notification system';
COMMENT ON FUNCTION mark_notification_read(uuid) IS 'Mark a single notification as read for the current user';
COMMENT ON FUNCTION mark_all_notifications_read() IS 'Mark all unread notifications as read for the current user';
COMMENT ON FUNCTION get_unread_notification_count() IS 'Get count of unread notifications for the current user';
COMMENT ON FUNCTION cleanup_old_notifications() IS 'Delete read notifications older than 30 days - run periodically via cron';
