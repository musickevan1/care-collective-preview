-- Migration: Optimize filtering and search functionality
-- Adds new category options, search optimization, and performance indexes

-- Update category constraint to include all new categories
ALTER TABLE help_requests 
  DROP CONSTRAINT IF EXISTS help_requests_category_check;

ALTER TABLE help_requests 
  ADD CONSTRAINT help_requests_category_check 
  CHECK (category IN (
    'groceries', 'transport', 'household', 'medical', 
    'meals', 'childcare', 'petcare', 'technology', 
    'companionship', 'respite', 'emotional', 'other'
  ));

-- Create composite indexes for common filtering combinations
-- These support our FilterPanel functionality efficiently

-- Index for status + category filtering (most common combination)
CREATE INDEX IF NOT EXISTS idx_help_requests_status_category
  ON help_requests(status, category);

-- Index for status + urgency filtering
CREATE INDEX IF NOT EXISTS idx_help_requests_status_urgency
  ON help_requests(status, urgency);

-- Index for category + urgency filtering
CREATE INDEX IF NOT EXISTS idx_help_requests_category_urgency
  ON help_requests(category, urgency);

-- Index for urgency-based sorting (critical > urgent > normal)
CREATE INDEX IF NOT EXISTS idx_help_requests_urgency_created
  ON help_requests(urgency DESC, created_at DESC);

-- Composite index for multiple filter combinations
CREATE INDEX IF NOT EXISTS idx_help_requests_multi_filter
  ON help_requests(status, category, urgency, created_at DESC);

-- Text search indexes for title and description
-- Enable full-text search capabilities
CREATE INDEX IF NOT EXISTS idx_help_requests_title_search
  ON help_requests USING gin(to_tsvector('english', title));

CREATE INDEX IF NOT EXISTS idx_help_requests_description_search
  ON help_requests USING gin(to_tsvector('english', COALESCE(description, '')));

-- Combined text search index for title + description
CREATE INDEX IF NOT EXISTS idx_help_requests_full_text_search
  ON help_requests USING gin(
    to_tsvector('english', title || ' ' || COALESCE(description, ''))
  );

-- Index for user's own requests (dashboard optimization)
CREATE INDEX IF NOT EXISTS idx_help_requests_user_status
  ON help_requests(user_id, status, created_at DESC);

-- Index for helper assignments and status tracking
CREATE INDEX IF NOT EXISTS idx_help_requests_helper_status
  ON help_requests(helper_id, status) WHERE helper_id IS NOT NULL;

-- Partial indexes for active requests (status filtering optimization)
CREATE INDEX IF NOT EXISTS idx_help_requests_open
  ON help_requests(created_at DESC, urgency DESC)
  WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_help_requests_in_progress
  ON help_requests(created_at DESC)
  WHERE status = 'in_progress';

-- Create function for optimized text search
CREATE OR REPLACE FUNCTION search_help_requests(search_query TEXT)
RETURNS SETOF help_requests AS $$
BEGIN
  RETURN QUERY
  SELECT hr.*
  FROM help_requests hr
  WHERE 
    to_tsvector('english', hr.title || ' ' || COALESCE(hr.description, '')) 
    @@ plainto_tsquery('english', search_query)
  ORDER BY 
    ts_rank(
      to_tsvector('english', hr.title || ' ' || COALESCE(hr.description, '')),
      plainto_tsquery('english', search_query)
    ) DESC,
    hr.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant permissions for the search function
GRANT EXECUTE ON FUNCTION search_help_requests TO anon, authenticated;

-- Create optimized view for request listing with profile joins
CREATE OR REPLACE VIEW help_requests_with_profiles AS
SELECT 
  hr.*,
  u.name as requester_name,
  u.location as requester_location,
  h.name as helper_name,
  h.location as helper_location
FROM help_requests hr
LEFT JOIN profiles u ON hr.user_id = u.id
LEFT JOIN profiles h ON hr.helper_id = h.id;

-- Grant access to the view
GRANT SELECT ON help_requests_with_profiles TO anon, authenticated;

-- Add database-level performance improvements
-- Analyze tables to update statistics for better query planning
ANALYZE help_requests;
ANALYZE profiles;

-- Add comments for documentation
COMMENT ON INDEX idx_help_requests_status_category IS 'Optimizes filtering by status and category combination';
COMMENT ON INDEX idx_help_requests_full_text_search IS 'Enables full-text search across title and description';
COMMENT ON INDEX idx_help_requests_multi_filter IS 'Supports complex filtering combinations used by FilterPanel';
COMMENT ON FUNCTION search_help_requests IS 'Optimized full-text search function with relevance ranking';

-- Create materialized view for dashboard statistics (optional optimization)
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_stats AS
SELECT 
  COUNT(*) FILTER (WHERE status = 'open') as open_requests,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_requests, 
  COUNT(*) FILTER (WHERE status = 'completed') as completed_requests,
  COUNT(*) FILTER (WHERE urgency = 'critical' AND status = 'open') as critical_requests,
  COUNT(*) FILTER (WHERE urgency = 'urgent' AND status = 'open') as urgent_requests,
  COUNT(DISTINCT category) FILTER (WHERE status = 'open') as active_categories,
  COUNT(DISTINCT user_id) as total_requesters,
  COUNT(DISTINCT helper_id) FILTER (WHERE helper_id IS NOT NULL) as active_helpers,
  EXTRACT(epoch FROM NOW()) as last_updated
FROM help_requests
WHERE created_at > NOW() - INTERVAL '30 days'; -- Focus on recent activity

-- Index for materialized view refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_stats_refresh
  ON dashboard_stats(last_updated);

-- Grant access to materialized view
GRANT SELECT ON dashboard_stats TO anon, authenticated;

-- Function to refresh dashboard stats (called periodically)
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW dashboard_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION refresh_dashboard_stats TO anon, authenticated;