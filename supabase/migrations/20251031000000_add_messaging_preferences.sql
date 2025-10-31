-- Add messaging_preferences table
-- This table stores user preferences for messaging system
-- Required by the initialize_messaging_preferences_trigger on profiles table

-- Create messaging_preferences table
CREATE TABLE IF NOT EXISTS messaging_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  can_receive_from TEXT CHECK (can_receive_from IN ('anyone', 'help_connections', 'nobody')) DEFAULT 'help_connections',
  auto_accept_help_requests BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  quiet_hours_start TIME, -- e.g., '22:00'
  quiet_hours_end TIME,   -- e.g., '08:00'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE messaging_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view and manage their own messaging preferences
CREATE POLICY "Users can view and manage their own messaging preferences"
  ON messaging_preferences
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON messaging_preferences TO authenticated;

-- Create messaging preferences for existing users who don't have them
INSERT INTO messaging_preferences (user_id, created_at)
SELECT id, created_at
FROM profiles
WHERE id NOT IN (SELECT user_id FROM messaging_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- Add comment
COMMENT ON TABLE messaging_preferences IS 'User preferences for messaging system (used by V1, may be deprecated in favor of V2 settings)';
