-- Add beta tester flag to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_beta_tester BOOLEAN DEFAULT false;

-- Add index for beta tester queries
CREATE INDEX IF NOT EXISTS idx_profiles_beta_tester ON profiles(is_beta_tester);

-- Create bug_reports table for beta testing feedback
CREATE TABLE IF NOT EXISTS bug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Bug details
  title text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  category text NOT NULL CHECK (category IN ('functionality', 'ui', 'performance', 'security', 'content')),
  description text NOT NULL,
  steps_to_reproduce text,

  -- Context information
  context jsonb NOT NULL DEFAULT '{}',

  -- Reporter information
  reporter_name text,
  reporter_email text,
  is_from_beta_tester boolean DEFAULT false,

  -- Status tracking
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'wont_fix')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  resolution_notes text,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add indexes for bug reports
CREATE INDEX IF NOT EXISTS idx_bug_reports_user_id ON bug_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_severity ON bug_reports(severity);
CREATE INDEX IF NOT EXISTS idx_bug_reports_beta_tester ON bug_reports(is_from_beta_tester);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created_at ON bug_reports(created_at DESC);

-- Add updated_at trigger for bug_reports
CREATE OR REPLACE FUNCTION update_bug_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_bug_reports_updated_at
  BEFORE UPDATE ON bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_bug_reports_updated_at();

-- Row Level Security for bug_reports
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- Users can view and create their own bug reports
CREATE POLICY "Users can view their own bug reports"
  ON bug_reports
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create bug reports"
  ON bug_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own open bug reports"
  ON bug_reports
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'open');

-- Admins can view and manage all bug reports
CREATE POLICY "Admins can view all bug reports"
  ON bug_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all bug reports"
  ON bug_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create view for beta tester statistics
CREATE OR REPLACE VIEW beta_tester_stats AS
SELECT
  COUNT(*) as total_beta_testers,
  COUNT(*) FILTER (WHERE verification_status = 'approved') as approved_testers,
  COUNT(*) FILTER (WHERE verification_status = 'pending') as pending_testers,
  COUNT(*) FILTER (WHERE created_at > now() - interval '7 days') as new_this_week
FROM profiles
WHERE is_beta_tester = true;

-- Create view for bug report statistics
CREATE OR REPLACE VIEW bug_report_stats AS
SELECT
  COUNT(*) as total_reports,
  COUNT(*) FILTER (WHERE status = 'open') as open_reports,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_reports,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved_reports,
  COUNT(*) FILTER (WHERE severity = 'critical') as critical_reports,
  COUNT(*) FILTER (WHERE severity = 'high') as high_reports,
  COUNT(*) FILTER (WHERE is_from_beta_tester = true) as beta_tester_reports,
  COUNT(*) FILTER (WHERE created_at > now() - interval '7 days') as reports_this_week,
  COUNT(*) FILTER (WHERE created_at > now() - interval '24 hours') as reports_today
FROM bug_reports;

-- Grant permissions on views to authenticated users
GRANT SELECT ON beta_tester_stats TO authenticated;
GRANT SELECT ON bug_report_stats TO authenticated;

-- Comment the tables and columns
COMMENT ON TABLE bug_reports IS 'Bug reports and feedback from users, especially beta testers';
COMMENT ON COLUMN bug_reports.severity IS 'Priority level: low, medium, high, critical';
COMMENT ON COLUMN bug_reports.category IS 'Type of issue: functionality, ui, performance, security, content';
COMMENT ON COLUMN bug_reports.context IS 'JSON object with page URL, user agent, screen size, timestamp, etc.';
COMMENT ON COLUMN bug_reports.is_from_beta_tester IS 'Whether this report came from a beta tester';
COMMENT ON COLUMN bug_reports.status IS 'Current status: open, in_progress, resolved, closed, wont_fix';

COMMENT ON COLUMN profiles.is_beta_tester IS 'Whether this user is participating in beta testing';
