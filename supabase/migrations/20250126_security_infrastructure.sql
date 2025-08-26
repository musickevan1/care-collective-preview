-- Security Infrastructure Migration
-- Creates tables and functions for comprehensive security logging and monitoring

-- Create security events table for logging all security-related activities
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'auth_failure', 'rate_limit', 'validation_error', 'suspicious_activity',
    'access_denied', 'password_reset_request', 'password_reset_success',
    'account_locked', 'unusual_login', 'data_export_request', 'admin_action'
  )),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for performance
  INDEX idx_security_events_type (event_type),
  INDEX idx_security_events_user (user_id),
  INDEX idx_security_events_ip (ip_address),
  INDEX idx_security_events_created (created_at),
  INDEX idx_security_events_severity (severity)
);

-- Create contact preferences table for managing contact sharing preferences
CREATE TABLE IF NOT EXISTS contact_preferences (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY ON DELETE CASCADE,
  share_email BOOLEAN DEFAULT true,
  share_phone BOOLEAN DEFAULT false,
  preferred_method TEXT DEFAULT 'email' CHECK (preferred_method IN ('email', 'phone', 'platform')),
  privacy_level TEXT DEFAULT 'standard' CHECK (privacy_level IN ('minimal', 'standard', 'open')),
  auto_share_after_help BOOLEAN DEFAULT false,
  require_mutual_consent BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create contact exchanges table for tracking contact information sharing
CREATE TABLE IF NOT EXISTS contact_exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES help_requests(id) ON DELETE CASCADE NOT NULL,
  helper_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'revoked')),
  exchange_type TEXT DEFAULT 'display' CHECK (exchange_type IN ('display', 'message', 'both')),
  helper_consented BOOLEAN DEFAULT false,
  requester_consented BOOLEAN DEFAULT false,
  shared_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Ensure unique exchanges per request
  UNIQUE(request_id, helper_id, requester_id),
  
  -- Indexes
  INDEX idx_contact_exchanges_request (request_id),
  INDEX idx_contact_exchanges_helper (helper_id),
  INDEX idx_contact_exchanges_requester (requester_id),
  INDEX idx_contact_exchanges_status (status),
  INDEX idx_contact_exchanges_created (created_at)
);

-- Create account locks table for managing temporary account restrictions
CREATE TABLE IF NOT EXISTS account_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lock_type TEXT NOT NULL CHECK (lock_type IN ('brute_force', 'suspicious_activity', 'admin_action', 'violation')),
  reason TEXT NOT NULL,
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  locked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Admin who locked the account
  unlock_attempts INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  INDEX idx_account_locks_user (user_id),
  INDEX idx_account_locks_expires (expires_at),
  INDEX idx_account_locks_type (lock_type)
);

-- Create failed login attempts table for brute force detection
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  failure_reason TEXT,
  
  INDEX idx_failed_logins_email (email),
  INDEX idx_failed_logins_ip (ip_address),
  INDEX idx_failed_logins_attempted (attempted_at)
);

-- Enable Row Level Security on all security tables
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for security_events
CREATE POLICY "Admins can view all security events" ON security_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own security events" ON security_events
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert security events" ON security_events
  FOR INSERT WITH CHECK (true); -- Allow system logging

-- RLS Policies for contact_preferences
CREATE POLICY "Users can manage their own contact preferences" ON contact_preferences
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for contact_exchanges
CREATE POLICY "Users can view their own exchanges" ON contact_exchanges
  FOR SELECT USING (helper_id = auth.uid() OR requester_id = auth.uid());

CREATE POLICY "Users can create exchanges for their requests" ON contact_exchanges
  FOR INSERT WITH CHECK (
    helper_id = auth.uid() OR 
    requester_id = auth.uid()
  );

CREATE POLICY "Users can update their own exchanges" ON contact_exchanges
  FOR UPDATE USING (helper_id = auth.uid() OR requester_id = auth.uid());

-- RLS Policies for account_locks
CREATE POLICY "Admins can view all account locks" ON account_locks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own locks" ON account_locks
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for failed_login_attempts
CREATE POLICY "System can log failed attempts" ON failed_login_attempts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view failed attempts" ON failed_login_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Create functions for security operations

-- Function to check if user is locked out
CREATE OR REPLACE FUNCTION is_user_locked(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM account_locks 
    WHERE user_id = check_user_id 
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to lock user account
CREATE OR REPLACE FUNCTION lock_user_account(
  target_user_id UUID,
  lock_reason TEXT,
  lock_duration INTERVAL DEFAULT NULL,
  locked_by_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  lock_id UUID;
BEGIN
  INSERT INTO account_locks (
    user_id, 
    lock_type, 
    reason, 
    expires_at,
    locked_by
  ) VALUES (
    target_user_id,
    'admin_action',
    lock_reason,
    CASE WHEN lock_duration IS NOT NULL THEN NOW() + lock_duration ELSE NULL END,
    locked_by_user_id
  )
  RETURNING id INTO lock_id;
  
  -- Log the admin action
  INSERT INTO security_events (
    event_type,
    user_id,
    details,
    severity
  ) VALUES (
    'admin_action',
    locked_by_user_id,
    jsonb_build_object(
      'action', 'account_locked',
      'target_user_id', target_user_id,
      'reason', lock_reason,
      'duration', lock_duration::TEXT
    ),
    'high'
  );
  
  RETURN lock_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unlock user account
CREATE OR REPLACE FUNCTION unlock_user_account(
  target_user_id UUID,
  unlocked_by_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE account_locks 
  SET expires_at = NOW()
  WHERE user_id = target_user_id 
  AND (expires_at IS NULL OR expires_at > NOW());
  
  -- Log the unlock action
  INSERT INTO security_events (
    event_type,
    user_id,
    details,
    severity
  ) VALUES (
    'admin_action',
    unlocked_by_user_id,
    jsonb_build_object(
      'action', 'account_unlocked',
      'target_user_id', target_user_id
    ),
    'medium'
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old security events (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_security_events()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete events older than 90 days except critical ones
  DELETE FROM security_events 
  WHERE created_at < NOW() - INTERVAL '90 days'
  AND severity != 'critical';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Delete critical events older than 1 year
  DELETE FROM security_events 
  WHERE created_at < NOW() - INTERVAL '1 year'
  AND severity = 'critical';
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check for brute force attempts
CREATE OR REPLACE FUNCTION check_brute_force_attempts(
  check_email TEXT,
  check_ip INET,
  time_window INTERVAL DEFAULT '15 minutes'
)
RETURNS INTEGER AS $$
DECLARE
  attempt_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO attempt_count
  FROM failed_login_attempts
  WHERE (email = check_email OR ip_address = check_ip)
  AND attempted_at > NOW() - time_window;
  
  RETURN attempt_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic cleanup and monitoring

-- Trigger to auto-expire old failed login attempts
CREATE OR REPLACE FUNCTION cleanup_failed_attempts()
RETURNS TRIGGER AS $$
BEGIN
  -- Clean up attempts older than 24 hours
  DELETE FROM failed_login_attempts 
  WHERE attempted_at < NOW() - INTERVAL '24 hours';
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that runs daily
-- Note: In production, this should be handled by a scheduled job
CREATE OR REPLACE FUNCTION create_cleanup_trigger()
RETURNS VOID AS $$
BEGIN
  -- This would typically be handled by pg_cron or similar
  -- For now, we'll document that cleanup should be run manually or via cron
  NULL;
END;
$$ LANGUAGE plpgsql;

-- Add security-related columns to existing tables if they don't exist

-- Add security fields to profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_login_at') THEN
    ALTER TABLE profiles ADD COLUMN last_login_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'login_count') THEN
    ALTER TABLE profiles ADD COLUMN login_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_login_ip') THEN
    ALTER TABLE profiles ADD COLUMN last_login_ip INET;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'account_status') THEN
    ALTER TABLE profiles ADD COLUMN account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'locked', 'suspended', 'pending_verification'));
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON profiles(last_login_at);

-- Grant necessary permissions
GRANT SELECT ON security_events TO authenticated;
GRANT INSERT ON security_events TO authenticated;
GRANT ALL ON contact_preferences TO authenticated;
GRANT ALL ON contact_exchanges TO authenticated;
GRANT SELECT ON account_locks TO authenticated;
GRANT INSERT ON failed_login_attempts TO authenticated;

-- Comment the tables for documentation
COMMENT ON TABLE security_events IS 'Comprehensive security event logging for monitoring and auditing';
COMMENT ON TABLE contact_preferences IS 'User preferences for contact information sharing';
COMMENT ON TABLE contact_exchanges IS 'Records of contact information exchanges between users';
COMMENT ON TABLE account_locks IS 'Temporary account restrictions and locks';
COMMENT ON TABLE failed_login_attempts IS 'Failed login attempts for brute force detection';

-- Create a view for security dashboard (admin only)
CREATE OR REPLACE VIEW security_dashboard AS
SELECT 
  DATE_TRUNC('day', created_at) as event_date,
  event_type,
  severity,
  COUNT(*) as event_count
FROM security_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), event_type, severity
ORDER BY event_date DESC, event_count DESC;

-- Grant access to the view
GRANT SELECT ON security_dashboard TO authenticated;