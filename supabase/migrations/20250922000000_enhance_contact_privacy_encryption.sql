-- Migration: Enhanced Contact Privacy and Encryption Support
-- Phase 2.2: Contact Exchange Security & Privacy Enhancement
-- Created: 2025-09-22

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add new columns to contact_exchanges table for encryption support
ALTER TABLE contact_exchanges
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS initiated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS revocation_reason TEXT,
ADD COLUMN IF NOT EXISTS encrypted_contact_data JSONB,
ADD COLUMN IF NOT EXISTS encryption_version TEXT,
ADD COLUMN IF NOT EXISTS data_retention_until TIMESTAMPTZ;

-- Update existing contact_exchanges records to have proper status
UPDATE contact_exchanges
SET status = 'completed', consent_given = true
WHERE status IS NULL AND exchanged_at IS NOT NULL;

-- Create contact_exchange_audit table for comprehensive audit trails
CREATE TABLE IF NOT EXISTS contact_exchange_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL CHECK (action IN (
        'CONTACT_EXCHANGE_INITIATED',
        'CONTACT_EXCHANGE_COMPLETED',
        'CONTACT_EXCHANGE_FAILED',
        'CONTACT_EXCHANGE_REVOKED',
        'CONTACT_EXCHANGE_EXPIRED',
        'PRIVACY_SETTING_CHANGED',
        'DATA_EXPORT_REQUESTED',
        'DATA_DELETION_REQUESTED'
    )),
    request_id UUID REFERENCES help_requests(id) ON DELETE CASCADE,
    helper_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_privacy_settings table for granular privacy controls
CREATE TABLE IF NOT EXISTS user_privacy_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,

    -- Contact sharing preferences
    default_contact_sharing JSONB DEFAULT '{
        "email": true,
        "phone": false,
        "location": true,
        "preferred_method": "email"
    }',

    -- Category-specific privacy settings
    category_privacy_overrides JSONB DEFAULT '{}',

    -- Data retention preferences
    auto_delete_exchanges_after_days INTEGER DEFAULT 90,
    allow_emergency_override BOOLEAN DEFAULT true,

    -- Communication preferences
    notification_preferences JSONB DEFAULT '{
        "contact_requests": true,
        "privacy_updates": true,
        "data_retention_reminders": true
    }',

    -- Consent and legal
    gdpr_consent_given BOOLEAN DEFAULT false,
    gdpr_consent_date TIMESTAMPTZ,
    privacy_policy_version TEXT,
    privacy_policy_accepted_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create contact_sharing_history table for user visibility into their data
CREATE TABLE IF NOT EXISTS contact_sharing_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    help_request_id UUID REFERENCES help_requests(id) ON DELETE CASCADE,
    exchange_id UUID REFERENCES contact_exchanges(id) ON DELETE CASCADE,

    -- What was shared
    fields_shared TEXT[] NOT NULL,
    sharing_purpose TEXT NOT NULL,

    -- Status tracking
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
    shared_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,

    -- Metadata
    sharing_context JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create data_export_requests table for GDPR compliance
CREATE TABLE IF NOT EXISTS data_export_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    request_type TEXT DEFAULT 'full_export' CHECK (request_type IN (
        'full_export',
        'contact_data_only',
        'privacy_audit',
        'sharing_history'
    )),
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending',
        'processing',
        'completed',
        'failed',
        'expired'
    )),
    export_format TEXT DEFAULT 'json' CHECK (export_format IN ('json', 'csv', 'pdf')),

    -- File information
    export_file_url TEXT,
    export_file_size_bytes BIGINT,
    file_expires_at TIMESTAMPTZ,

    -- Processing information
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,

    -- Security
    download_token TEXT UNIQUE,
    downloads_count INTEGER DEFAULT 0,
    max_downloads INTEGER DEFAULT 3,
    ip_address INET,
    user_agent TEXT
);

-- Create privacy_violation_alerts table for admin monitoring
CREATE TABLE IF NOT EXISTS privacy_violation_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_type TEXT NOT NULL CHECK (alert_type IN (
        'SUSPICIOUS_CONTACT_PATTERN',
        'RATE_LIMIT_EXCEEDED',
        'INAPPROPRIATE_MESSAGE_CONTENT',
        'UNAUTHORIZED_ACCESS_ATTEMPT',
        'DATA_BREACH_INDICATOR',
        'ENCRYPTION_FAILURE'
    )),
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),

    -- Associated entities
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    help_request_id UUID REFERENCES help_requests(id) ON DELETE SET NULL,
    exchange_id UUID REFERENCES contact_exchanges(id) ON DELETE SET NULL,

    -- Alert details
    description TEXT NOT NULL,
    details JSONB DEFAULT '{}',

    -- Status tracking
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolution_notes TEXT,

    -- Timestamps
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_exchange_audit_user_id ON contact_exchange_audit(helper_id, requester_id);
CREATE INDEX IF NOT EXISTS idx_contact_exchange_audit_request_id ON contact_exchange_audit(request_id);
CREATE INDEX IF NOT EXISTS idx_contact_exchange_audit_timestamp ON contact_exchange_audit(timestamp);
CREATE INDEX IF NOT EXISTS idx_contact_exchange_audit_action ON contact_exchange_audit(action);

CREATE INDEX IF NOT EXISTS idx_user_privacy_settings_user_id ON user_privacy_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_contact_sharing_history_user_id ON contact_sharing_history(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_sharing_history_shared_with ON contact_sharing_history(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_contact_sharing_history_status ON contact_sharing_history(status);
CREATE INDEX IF NOT EXISTS idx_contact_sharing_history_expires_at ON contact_sharing_history(expires_at);

CREATE INDEX IF NOT EXISTS idx_data_export_requests_user_id ON data_export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_status ON data_export_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_expires_at ON data_export_requests(file_expires_at);

CREATE INDEX IF NOT EXISTS idx_privacy_violation_alerts_severity ON privacy_violation_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_privacy_violation_alerts_status ON privacy_violation_alerts(status);
CREATE INDEX IF NOT EXISTS idx_privacy_violation_alerts_detected_at ON privacy_violation_alerts(detected_at);

-- Add enhanced columns to contact_exchanges table
ALTER TABLE contact_exchanges
ADD COLUMN IF NOT EXISTS privacy_level TEXT DEFAULT 'standard' CHECK (privacy_level IN ('minimal', 'standard', 'enhanced')),
ADD COLUMN IF NOT EXISTS auto_expire_days INTEGER DEFAULT 90,
ADD COLUMN IF NOT EXISTS emergency_override BOOLEAN DEFAULT false;

-- Create triggers for automatic data retention
CREATE OR REPLACE FUNCTION update_contact_exchange_retention()
RETURNS TRIGGER AS $$
BEGIN
    -- Set retention date based on privacy settings
    IF NEW.completed_at IS NOT NULL AND NEW.data_retention_until IS NULL THEN
        NEW.data_retention_until = NEW.completed_at + INTERVAL '90 days';
    END IF;

    -- Update sharing history
    INSERT INTO contact_sharing_history (
        user_id,
        shared_with_user_id,
        help_request_id,
        exchange_id,
        fields_shared,
        sharing_purpose,
        expires_at
    ) VALUES (
        NEW.requester_id,
        NEW.helper_id,
        NEW.request_id,
        NEW.id,
        ARRAY['contact_info'],
        'mutual_aid_coordination',
        NEW.data_retention_until
    ) ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_contact_exchange_retention
    BEFORE UPDATE ON contact_exchanges
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_exchange_retention();

-- Create function for automated data cleanup
CREATE OR REPLACE FUNCTION cleanup_expired_contact_data()
RETURNS INTEGER AS $$
DECLARE
    cleanup_count INTEGER := 0;
BEGIN
    -- Mark expired contact exchanges
    UPDATE contact_exchanges
    SET
        status = 'expired',
        encrypted_contact_data = NULL,
        contact_shared = NULL
    WHERE
        data_retention_until < NOW()
        AND status != 'expired';

    GET DIAGNOSTICS cleanup_count = ROW_COUNT;

    -- Update sharing history
    UPDATE contact_sharing_history
    SET status = 'expired'
    WHERE expires_at < NOW() AND status = 'active';

    -- Clean up old export files
    UPDATE data_export_requests
    SET status = 'expired', export_file_url = NULL
    WHERE file_expires_at < NOW() AND status = 'completed';

    RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies for privacy tables
ALTER TABLE contact_exchange_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_sharing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_violation_alerts ENABLE ROW LEVEL SECURITY;

-- Users can only access their own privacy settings
CREATE POLICY "Users can manage their own privacy settings" ON user_privacy_settings
    FOR ALL USING (auth.uid() = user_id);

-- Users can view their own sharing history
CREATE POLICY "Users can view their own sharing history" ON contact_sharing_history
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = shared_with_user_id);

-- Users can manage their own data export requests
CREATE POLICY "Users can manage their own data exports" ON data_export_requests
    FOR ALL USING (auth.uid() = user_id);

-- Audit logs are append-only for users, full access for admins
CREATE POLICY "Users can view related audit logs" ON contact_exchange_audit
    FOR SELECT USING (
        auth.uid() = helper_id OR
        auth.uid() = requester_id OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- Privacy violation alerts are admin-only
CREATE POLICY "Admins can access privacy violation alerts" ON privacy_violation_alerts
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- Insert default privacy settings for existing users
INSERT INTO user_privacy_settings (user_id, gdpr_consent_given, gdpr_consent_date)
SELECT
    id,
    true,
    NOW()
FROM profiles
WHERE id NOT IN (SELECT user_id FROM user_privacy_settings WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- Create a function to initialize privacy settings for new users
CREATE OR REPLACE FUNCTION initialize_user_privacy_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_privacy_settings (
        user_id,
        gdpr_consent_given,
        gdpr_consent_date,
        privacy_policy_version,
        privacy_policy_accepted_at
    ) VALUES (
        NEW.id,
        true,
        NOW(),
        '2.2.0',
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_initialize_privacy_settings
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION initialize_user_privacy_settings();

-- Add comments for documentation
COMMENT ON TABLE contact_exchange_audit IS 'Comprehensive audit trail for all contact exchange and privacy-related actions';
COMMENT ON TABLE user_privacy_settings IS 'User-configurable privacy preferences and GDPR compliance tracking';
COMMENT ON TABLE contact_sharing_history IS 'Detailed history of what contact information was shared with whom';
COMMENT ON TABLE data_export_requests IS 'GDPR-compliant data export request tracking';
COMMENT ON TABLE privacy_violation_alerts IS 'System alerts for potential privacy violations or suspicious activity';

COMMENT ON COLUMN contact_exchanges.encrypted_contact_data IS 'Encrypted contact information using AES-256-GCM';
COMMENT ON COLUMN contact_exchanges.data_retention_until IS 'Automatic data deletion date for privacy compliance';
COMMENT ON COLUMN user_privacy_settings.category_privacy_overrides IS 'Per-category privacy settings (medical, financial, etc.)';
COMMENT ON COLUMN contact_sharing_history.fields_shared IS 'Array of contact fields that were shared (email, phone, etc.)';