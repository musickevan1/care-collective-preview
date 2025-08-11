-- Migration: Add enhanced request status tracking
-- Adds more granular status options and helper assignment

-- Update the status check constraint to include more options
ALTER TABLE help_requests 
  DROP CONSTRAINT IF EXISTS help_requests_status_check;

ALTER TABLE help_requests 
  ADD CONSTRAINT help_requests_status_check 
  CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled', 'closed'));

-- Add new columns for better tracking
ALTER TABLE help_requests
  ADD COLUMN IF NOT EXISTS helper_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS helped_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create an index for helper assignments
CREATE INDEX IF NOT EXISTS idx_help_requests_helper_id ON help_requests(helper_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_help_requests_updated_at ON help_requests;
CREATE TRIGGER update_help_requests_updated_at
  BEFORE UPDATE ON help_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policy for helpers to update requests they're helping with
CREATE POLICY "Helpers can update requests they're assigned to"
  ON help_requests FOR UPDATE
  USING (auth.uid() = helper_id);

-- Create a view for request statistics
CREATE OR REPLACE VIEW request_statistics AS
SELECT 
  COUNT(*) FILTER (WHERE status = 'open') as open_count,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
  COUNT(*) FILTER (WHERE status = 'closed') as closed_count,
  COUNT(*) as total_count,
  COUNT(DISTINCT user_id) as unique_requesters,
  COUNT(DISTINCT helper_id) as unique_helpers
FROM help_requests;

-- Grant access to the view
GRANT SELECT ON request_statistics TO anon, authenticated;

-- Add comment for documentation
COMMENT ON COLUMN help_requests.status IS 'Request status: open (needs help), in_progress (helper assigned), completed (successfully helped), cancelled (requester cancelled), closed (administratively closed)';
COMMENT ON COLUMN help_requests.helper_id IS 'User ID of the person helping with this request';
COMMENT ON COLUMN help_requests.helped_at IS 'Timestamp when a helper started helping';
COMMENT ON COLUMN help_requests.completed_at IS 'Timestamp when the request was completed';
COMMENT ON COLUMN help_requests.cancelled_at IS 'Timestamp when the request was cancelled';
COMMENT ON COLUMN help_requests.cancel_reason IS 'Reason for cancellation if cancelled';