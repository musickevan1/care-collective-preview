-- User Restrictions System Migration
-- Implements comprehensive user restriction and moderation enforcement

-- Create user_restrictions table
CREATE TABLE IF NOT EXISTS user_restrictions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restriction_level text NOT NULL CHECK (restriction_level IN ('none', 'limited', 'suspended', 'banned')),

  -- Restriction settings
  can_send_messages boolean DEFAULT true,
  can_start_conversations boolean DEFAULT true,
  requires_pre_approval boolean DEFAULT false,
  message_limit_per_day integer DEFAULT 100,

  -- Moderation context
  reason text NOT NULL,
  applied_by uuid REFERENCES auth.users(id),
  applied_at timestamptz DEFAULT now(),
  expires_at timestamptz, -- NULL for permanent restrictions

  -- Audit trail
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_message_limit CHECK (message_limit_per_day >= 0 AND message_limit_per_day <= 1000),
  CONSTRAINT logical_restrictions CHECK (
    (restriction_level = 'none' AND can_send_messages = true AND can_start_conversations = true) OR
    (restriction_level != 'none')
  )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_restrictions_user_id ON user_restrictions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_restrictions_level ON user_restrictions(restriction_level);
CREATE INDEX IF NOT EXISTS idx_user_restrictions_expires ON user_restrictions(expires_at) WHERE expires_at IS NOT NULL;

-- Create function to get current user restrictions
CREATE OR REPLACE FUNCTION get_user_restrictions(target_user_id uuid)
RETURNS TABLE (
  restriction_level text,
  can_send_messages boolean,
  can_start_conversations boolean,
  requires_pre_approval boolean,
  message_limit_per_day integer,
  reason text,
  expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ur.restriction_level,
    ur.can_send_messages,
    ur.can_start_conversations,
    ur.requires_pre_approval,
    ur.message_limit_per_day,
    ur.reason,
    ur.expires_at
  FROM user_restrictions ur
  WHERE ur.user_id = target_user_id
    AND (ur.expires_at IS NULL OR ur.expires_at > now())
  ORDER BY ur.applied_at DESC
  LIMIT 1;

  -- If no restrictions found, return default 'none' level
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
      'none'::text,
      true::boolean,
      true::boolean,
      false::boolean,
      100::integer,
      ''::text,
      null::timestamptz;
  END IF;
END;
$$;

-- Create function to check daily message count
CREATE OR REPLACE FUNCTION get_daily_message_count(target_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  message_count integer;
BEGIN
  SELECT COUNT(*)
  INTO message_count
  FROM messages
  WHERE sender_id = target_user_id
    AND created_at >= current_date
    AND created_at < current_date + interval '1 day';

  RETURN COALESCE(message_count, 0);
END;
$$;

-- Create function to apply user restrictions
CREATE OR REPLACE FUNCTION apply_user_restriction(
  target_user_id uuid,
  new_restriction_level text,
  new_reason text,
  applied_by_user_id uuid DEFAULT NULL,
  expires_at_param timestamptz DEFAULT NULL,
  message_limit integer DEFAULT 100
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  restriction_id uuid;
  can_send boolean;
  can_start boolean;
  requires_approval boolean;
BEGIN
  -- Validate restriction level
  IF new_restriction_level NOT IN ('none', 'limited', 'suspended', 'banned') THEN
    RAISE EXCEPTION 'Invalid restriction level: %', new_restriction_level;
  END IF;

  -- Set restriction flags based on level
  CASE new_restriction_level
    WHEN 'none' THEN
      can_send := true;
      can_start := true;
      requires_approval := false;
      message_limit := 100;
    WHEN 'limited' THEN
      can_send := true;
      can_start := false;
      requires_approval := true;
      message_limit := LEAST(message_limit, 10);
    WHEN 'suspended' THEN
      can_send := false;
      can_start := false;
      requires_approval := false;
      message_limit := 0;
    WHEN 'banned' THEN
      can_send := false;
      can_start := false;
      requires_approval := false;
      message_limit := 0;
  END CASE;

  -- Insert new restriction (replaces any existing)
  INSERT INTO user_restrictions (
    user_id,
    restriction_level,
    can_send_messages,
    can_start_conversations,
    requires_pre_approval,
    message_limit_per_day,
    reason,
    applied_by,
    expires_at
  ) VALUES (
    target_user_id,
    new_restriction_level,
    can_send,
    can_start,
    requires_approval,
    message_limit,
    new_reason,
    applied_by_user_id,
    expires_at_param
  ) RETURNING id INTO restriction_id;

  RETURN restriction_id;
END;
$$;

-- Create RLS policies for user_restrictions
ALTER TABLE user_restrictions ENABLE ROW LEVEL SECURITY;

-- Users can view their own restrictions
CREATE POLICY "Users can view own restrictions" ON user_restrictions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can manage all restrictions (simplified for demo)
CREATE POLICY "Admins can manage restrictions" ON user_restrictions
  FOR ALL
  USING (true); -- In production, add proper admin role checking

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_restrictions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_restrictions_updated_at
  BEFORE UPDATE ON user_restrictions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_restrictions_updated_at();

-- Add restriction tracking to message_audit_log
ALTER TABLE message_audit_log
ADD COLUMN IF NOT EXISTS restriction_id uuid REFERENCES user_restrictions(id);

-- Create view for active restrictions (non-expired)
CREATE OR REPLACE VIEW active_user_restrictions AS
SELECT *
FROM user_restrictions
WHERE expires_at IS NULL OR expires_at > now();

-- Grant necessary permissions
GRANT SELECT ON active_user_restrictions TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_restrictions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_message_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION apply_user_restriction(uuid, text, text, uuid, timestamptz, integer) TO authenticated;

-- Add helpful comments
COMMENT ON TABLE user_restrictions IS 'Stores user restriction settings for content moderation';
COMMENT ON FUNCTION get_user_restrictions(uuid) IS 'Returns current active restrictions for a user';
COMMENT ON FUNCTION get_daily_message_count(uuid) IS 'Returns number of messages sent by user today';
COMMENT ON FUNCTION apply_user_restriction(uuid, text, text, uuid, timestamptz, integer) IS 'Applies restriction to a user with specified settings';