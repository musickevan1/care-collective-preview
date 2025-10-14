-- Session invalidation on verification status change
--
-- PURPOSE: Track when user verification status changes and provide
-- infrastructure for automatic session invalidation
--
-- SECURITY ENHANCEMENT: When a user's verification status changes
-- (especially to 'rejected'), we need to immediately invalidate their
-- session to prevent continued access with stale authentication.
--
-- NOTE: Supabase auth sessions cannot be directly invalidated from
-- PostgreSQL triggers. This migration creates the tracking infrastructure
-- and the middleware will check this table to enforce access control.

-- Create table to track verification status changes
CREATE TABLE IF NOT EXISTS verification_status_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid REFERENCES auth.users(id), -- Admin who made the change
  changed_at timestamp with time zone DEFAULT now() NOT NULL,
  session_invalidated boolean DEFAULT false,
  session_invalidated_at timestamp with time zone,
  notes text,

  -- Index for efficient lookups
  CONSTRAINT verification_status_changes_user_id_changed_at_idx
    UNIQUE (user_id, changed_at)
);

-- Create index for quick session invalidation checks
CREATE INDEX IF NOT EXISTS idx_verification_status_changes_user_invalidation
ON verification_status_changes(user_id, session_invalidated)
WHERE session_invalidated = false;

-- Create index for audit trail queries
CREATE INDEX IF NOT EXISTS idx_verification_status_changes_changed_at
ON verification_status_changes(changed_at DESC);

-- Function to log verification status changes
CREATE OR REPLACE FUNCTION log_verification_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if verification_status actually changed
  IF OLD.verification_status IS DISTINCT FROM NEW.verification_status THEN
    INSERT INTO verification_status_changes (
      user_id,
      old_status,
      new_status,
      changed_by,
      notes
    ) VALUES (
      NEW.id,
      OLD.verification_status::text,
      NEW.verification_status::text,
      auth.uid(), -- Current user making the change (admin)
      CASE
        WHEN NEW.verification_status = 'rejected' THEN 'User rejected - session should be invalidated'
        WHEN NEW.verification_status = 'approved' THEN 'User approved - access granted'
        WHEN NEW.verification_status = 'pending' THEN 'User set to pending - limited access'
        ELSE 'Verification status changed'
      END
    );

    -- Log security event for critical status changes
    IF NEW.verification_status = 'rejected' OR NEW.verification_status = 'approved' THEN
      RAISE NOTICE 'SECURITY: User % verification status changed from % to %',
        NEW.id, OLD.verification_status, NEW.verification_status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to log verification status changes
DROP TRIGGER IF EXISTS trigger_log_verification_status_change ON profiles;
CREATE TRIGGER trigger_log_verification_status_change
  AFTER UPDATE OF verification_status ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_verification_status_change();

-- Function to check if user has pending session invalidation
-- This will be called by middleware to enforce session invalidation
CREATE OR REPLACE FUNCTION has_pending_session_invalidation(user_uuid uuid)
RETURNS boolean AS $$
DECLARE
  has_pending boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM verification_status_changes
    WHERE user_id = user_uuid
      AND session_invalidated = false
      AND new_status = 'rejected'
      AND changed_at > NOW() - INTERVAL '1 hour' -- Only check recent changes
  ) INTO has_pending;

  RETURN COALESCE(has_pending, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark session as invalidated
-- Called after middleware successfully signs out the user
CREATE OR REPLACE FUNCTION mark_session_invalidated(user_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE verification_status_changes
  SET
    session_invalidated = true,
    session_invalidated_at = now()
  WHERE user_id = user_uuid
    AND session_invalidated = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies for verification_status_changes table
ALTER TABLE verification_status_changes ENABLE ROW LEVEL SECURITY;

-- Admins can view all status changes
CREATE POLICY "Admins can view all verification status changes"
ON verification_status_changes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
      AND profiles.verification_status = 'approved'
  )
);

-- Users can view their own status changes
CREATE POLICY "Users can view their own status changes"
ON verification_status_changes
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Only admins can insert status changes (through trigger)
CREATE POLICY "Only system can insert status changes"
ON verification_status_changes
FOR INSERT
TO authenticated
WITH CHECK (false); -- Explicit deny, only trigger can insert via SECURITY DEFINER

-- Grant necessary permissions
GRANT SELECT ON verification_status_changes TO authenticated;

-- Add helpful comments
COMMENT ON TABLE verification_status_changes IS
'Tracks all changes to user verification status for security audit trail and session invalidation';

COMMENT ON FUNCTION has_pending_session_invalidation(uuid) IS
'Checks if a user has a pending session invalidation (verification_status changed to rejected)';

COMMENT ON FUNCTION mark_session_invalidated(uuid) IS
'Marks a user session as successfully invalidated after sign out';

COMMENT ON FUNCTION log_verification_status_change() IS
'Trigger function that logs verification status changes and flags sessions for invalidation';
