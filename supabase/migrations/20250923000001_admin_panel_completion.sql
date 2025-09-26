-- Admin Panel Completion Phase 2.3
-- Email tracking, bulk operations, and enhanced admin functionality
-- Date: September 23, 2025

-- Email notification tracking table
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN (
    'user_status_notification',
    'application_decision',
    'moderation_alert',
    'bulk_operation_summary',
    'help_request_notification',
    'waitlist_confirmation',
    'approval_notification',
    'rejection_notification'
  )),
  subject TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  provider_message_id TEXT, -- Resend/provider message ID
  error_message TEXT,
  metadata JSONB DEFAULT '{}', -- Additional context like admin_id, reason, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for email notifications
CREATE INDEX IF NOT EXISTS idx_email_notifications_user_id ON email_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_template_type ON email_notifications(template_type);
CREATE INDEX IF NOT EXISTS idx_email_notifications_delivery_status ON email_notifications(delivery_status);
CREATE INDEX IF NOT EXISTS idx_email_notifications_sent_at ON email_notifications(sent_at);

-- Bulk operation tracking table
CREATE TABLE IF NOT EXISTS admin_bulk_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL CHECK (operation_type IN (
    'bulk_user_activate',
    'bulk_user_deactivate',
    'bulk_user_suspend',
    'bulk_application_approve',
    'bulk_application_reject',
    'bulk_user_make_admin',
    'bulk_user_remove_admin',
    'bulk_message_moderate',
    'bulk_export_data'
  )),
  affected_users UUID[] NOT NULL DEFAULT '{}', -- Array of user IDs affected
  total_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  parameters JSONB DEFAULT '{}', -- Operation parameters like reason, filters, etc.
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_details TEXT,
  results JSONB DEFAULT '{}', -- Detailed results of the operation
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for bulk operations
CREATE INDEX IF NOT EXISTS idx_admin_bulk_operations_admin_id ON admin_bulk_operations(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_bulk_operations_operation_type ON admin_bulk_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_admin_bulk_operations_status ON admin_bulk_operations(status);
CREATE INDEX IF NOT EXISTS idx_admin_bulk_operations_started_at ON admin_bulk_operations(started_at);

-- Application review tracking table (enhanced from basic approval tracking)
CREATE TABLE IF NOT EXISTS application_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected', 'pending', 'requires_info')),
  reasoning TEXT,
  review_notes TEXT,
  review_duration_minutes INTEGER, -- How long the review took
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100), -- Automated risk assessment
  flags JSONB DEFAULT '{}', -- Any red flags or notes for future reference
  reviewed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for application reviews
CREATE INDEX IF NOT EXISTS idx_application_reviews_application_id ON application_reviews(application_id);
CREATE INDEX IF NOT EXISTS idx_application_reviews_reviewer_id ON application_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_application_reviews_decision ON application_reviews(decision);
CREATE INDEX IF NOT EXISTS idx_application_reviews_reviewed_at ON application_reviews(reviewed_at);

-- Admin action audit log (enhanced logging for all admin actions)
CREATE TABLE IF NOT EXISTS admin_action_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'application', 'message', 'help_request', 'system')),
  target_id UUID, -- ID of the affected entity
  action_details JSONB NOT NULL DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for admin audit log
CREATE INDEX IF NOT EXISTS idx_admin_action_audit_admin_id ON admin_action_audit(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_audit_action_type ON admin_action_audit(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_action_audit_target_type ON admin_action_audit(target_type);
CREATE INDEX IF NOT EXISTS idx_admin_action_audit_created_at ON admin_action_audit(created_at);

-- Community health metrics materialized view for dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS community_health_metrics AS
SELECT
  -- User metrics
  COUNT(DISTINCT p.id) as total_users,
  COUNT(DISTINCT CASE WHEN p.verification_status = 'approved' THEN p.id END) as active_users,
  COUNT(DISTINCT CASE WHEN p.verification_status = 'pending' THEN p.id END) as pending_users,
  COUNT(DISTINCT CASE WHEN p.created_at >= NOW() - INTERVAL '30 days' THEN p.id END) as new_users_30d,

  -- Help request metrics
  COUNT(DISTINCT hr.id) as total_help_requests,
  COUNT(DISTINCT CASE WHEN hr.status = 'open' THEN hr.id END) as open_requests,
  COUNT(DISTINCT CASE WHEN hr.status = 'completed' THEN hr.id END) as completed_requests,
  COUNT(DISTINCT CASE WHEN hr.created_at >= NOW() - INTERVAL '7 days' THEN hr.id END) as new_requests_7d,

  -- Messaging metrics
  COUNT(DISTINCT m.id) as total_messages,
  COUNT(DISTINCT CASE WHEN m.created_at >= NOW() - INTERVAL '24 hours' THEN m.id END) as messages_24h,
  COUNT(DISTINCT mr.id) as total_reports,
  COUNT(DISTINCT CASE WHEN mr.status = 'pending' THEN mr.id END) as pending_reports,

  -- Engagement metrics
  ROUND(AVG(CASE WHEN hr.status = 'completed' AND hr.completed_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM hr.completed_at - hr.created_at) / 3600 END), 2) as avg_resolution_hours,

  -- Last updated
  NOW() as last_updated

FROM profiles p
LEFT JOIN help_requests hr ON TRUE
LEFT JOIN messages m ON TRUE
LEFT JOIN message_reports mr ON TRUE;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_community_health_metrics_last_updated
ON community_health_metrics(last_updated);

-- Function to refresh community health metrics
CREATE OR REPLACE FUNCTION refresh_community_health_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY community_health_metrics;
END;
$$;

-- Function to log admin actions automatically
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id UUID,
  p_action_type TEXT,
  p_target_type TEXT,
  p_target_id UUID DEFAULT NULL,
  p_action_details JSONB DEFAULT '{}'::jsonb,
  p_success BOOLEAN DEFAULT TRUE,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO admin_action_audit (
    admin_id,
    action_type,
    target_type,
    target_id,
    action_details,
    success,
    error_message
  ) VALUES (
    p_admin_id,
    p_action_type,
    p_target_type,
    p_target_id,
    p_action_details,
    p_success,
    p_error_message
  ) RETURNING id INTO audit_id;

  RETURN audit_id;
END;
$$;

-- Function to track email notifications
CREATE OR REPLACE FUNCTION track_email_notification(
  p_user_id UUID,
  p_email_address TEXT,
  p_template_type TEXT,
  p_subject TEXT,
  p_provider_message_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO email_notifications (
    user_id,
    email_address,
    template_type,
    subject,
    provider_message_id,
    metadata,
    delivery_status
  ) VALUES (
    p_user_id,
    p_email_address,
    p_template_type,
    p_subject,
    p_provider_message_id,
    p_metadata,
    CASE WHEN p_provider_message_id IS NOT NULL THEN 'sent' ELSE 'pending' END
  ) RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$;

-- Function to update email delivery status
CREATE OR REPLACE FUNCTION update_email_delivery_status(
  p_notification_id UUID,
  p_delivery_status TEXT,
  p_error_message TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE email_notifications
  SET
    delivery_status = p_delivery_status,
    error_message = p_error_message,
    updated_at = NOW()
  WHERE id = p_notification_id;
END;
$$;

-- Row Level Security (RLS) policies

-- Email notifications - only accessible by admins and the affected user
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email notifications" ON email_notifications
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Bulk operations - only accessible by admins
ALTER TABLE admin_bulk_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can access bulk operations" ON admin_bulk_operations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Application reviews - only accessible by admins
ALTER TABLE application_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can access application reviews" ON application_reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admin audit log - only accessible by admins
ALTER TABLE admin_action_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can access audit logs" ON admin_action_audit
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Grant permissions for functions
GRANT EXECUTE ON FUNCTION refresh_community_health_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION log_admin_action(UUID, TEXT, TEXT, UUID, JSONB, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION track_email_notification(UUID, TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION update_email_delivery_status(UUID, TEXT, TEXT) TO authenticated;

-- Initial refresh of metrics
SELECT refresh_community_health_metrics();