-- RLS Performance Monitoring Queries
--
-- Use these queries to monitor Row Level Security (RLS) policy performance
-- and identify potential bottlenecks or infinite recursion issues.
--
-- Run these periodically to ensure RLS policies remain performant

-- ========================================
-- 1. Check for Slow RLS Policy Execution
-- ========================================

-- Analyze profiles table SELECT performance
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT *
FROM profiles
WHERE id = '00000000-0000-0000-0000-000000000000'::uuid; -- Replace with actual test UUID

-- Expected: Index Scan, execution time < 1ms


-- Analyze help_requests table SELECT performance
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT *
FROM help_requests
WHERE status = 'open'
LIMIT 100;

-- Expected: Sequential Scan or Index Scan, execution time < 50ms for 1000 rows


-- ========================================
-- 2. Identify Tables Without RLS Enabled
-- ========================================

SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;

-- All user-facing tables should have rowsecurity = true


-- ========================================
-- 3. List All RLS Policies
-- ========================================

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;


-- ========================================
-- 4. Check for Potentially Recursive Policies
-- ========================================

-- Policies that reference the same table they protect can cause recursion
SELECT
  schemaname,
  tablename,
  policyname,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    qual ILIKE '%' || tablename || '%'
    OR with_check ILIKE '%' || tablename || '%'
  )
ORDER BY tablename;

-- Review these policies carefully to ensure no infinite recursion


-- ========================================
-- 5. Monitor Query Performance Over Time
-- ========================================

-- Enable pg_stat_statements extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View slowest queries involving RLS-protected tables
SELECT
  LEFT(query, 100) AS query_preview,
  calls,
  ROUND(total_exec_time::numeric, 2) AS total_time_ms,
  ROUND(mean_exec_time::numeric, 2) AS avg_time_ms,
  ROUND((100 * total_exec_time / SUM(total_exec_time) OVER ())::numeric, 2) AS percent_total
FROM pg_stat_statements
WHERE query ILIKE '%profiles%'
   OR query ILIKE '%help_requests%'
   OR query ILIKE '%messages%'
   OR query ILIKE '%contact_exchanges%'
ORDER BY total_exec_time DESC
LIMIT 20;


-- ========================================
-- 6. Check Index Usage for RLS Policies
-- ========================================

-- Indexes are critical for RLS performance
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND (
    tablename = 'profiles'
    OR tablename = 'help_requests'
    OR tablename = 'messages'
    OR tablename = 'contact_exchanges'
  )
ORDER BY tablename, idx_scan DESC;

-- Low idx_scan values indicate unused indexes


-- ========================================
-- 7. Monitor Authentication Function Usage
-- ========================================

-- Check how often auth.uid() is called
SELECT
  funcname,
  calls,
  total_time,
  self_time,
  ROUND((total_time / calls)::numeric, 4) AS avg_time_ms
FROM pg_stat_user_functions
WHERE funcname LIKE '%auth%'
   OR funcname LIKE '%uid%'
ORDER BY calls DESC;


-- ========================================
-- 8. Verification Status Change Tracking
-- ========================================

-- Monitor recent verification status changes for audit trail
SELECT
  vsc.id,
  vsc.user_id,
  p.name,
  p.email,
  vsc.old_status,
  vsc.new_status,
  vsc.changed_by,
  vsc.changed_at,
  vsc.session_invalidated,
  vsc.notes
FROM verification_status_changes vsc
LEFT JOIN profiles p ON p.id = vsc.user_id
ORDER BY vsc.changed_at DESC
LIMIT 50;


-- ========================================
-- 9. Pending Session Invalidations
-- ========================================

-- Check for users with pending session invalidations
SELECT
  user_id,
  old_status,
  new_status,
  changed_at,
  session_invalidated,
  EXTRACT(MINUTE FROM (NOW() - changed_at)) AS minutes_since_change
FROM verification_status_changes
WHERE session_invalidated = false
  AND new_status = 'rejected'
  AND changed_at > NOW() - INTERVAL '1 hour'
ORDER BY changed_at DESC;


-- ========================================
-- 10. RLS Policy Execution Statistics
-- ========================================

-- Create a function to test RLS policy overhead
CREATE OR REPLACE FUNCTION test_rls_overhead()
RETURNS TABLE(
  test_name text,
  execution_time_ms numeric
) AS $$
DECLARE
  start_time timestamp;
  end_time timestamp;
BEGIN
  -- Test 1: SELECT with RLS
  start_time := clock_timestamp();
  PERFORM * FROM profiles WHERE id = auth.uid();
  end_time := clock_timestamp();

  RETURN QUERY SELECT
    'profiles_select_with_rls'::text,
    ROUND(EXTRACT(MILLISECONDS FROM (end_time - start_time))::numeric, 3);

  -- Test 2: SELECT help_requests
  start_time := clock_timestamp();
  PERFORM * FROM help_requests LIMIT 100;
  end_time := clock_timestamp();

  RETURN QUERY SELECT
    'help_requests_select_100_rows'::text,
    ROUND(EXTRACT(MILLISECONDS FROM (end_time - start_time))::numeric, 3);

  -- Add more tests as needed
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the test
SELECT * FROM test_rls_overhead();


-- ========================================
-- 11. Troubleshooting Infinite Recursion
-- ========================================

-- If you encounter "infinite recursion detected in policy for relation" errors:
--
-- 1. Check for self-referencing policies (policies that query the same table):
SELECT
  tablename,
  policyname,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND qual ILIKE '%' || tablename || '%';

-- 2. Simplify policies to avoid EXISTS subqueries on the same table
-- 3. Use middleware for complex authorization checks instead of RLS
-- 4. Consider using SECURITY DEFINER functions that bypass RLS


-- ========================================
-- Recommendations
-- ========================================

-- 1. Run query 5 (pg_stat_statements) weekly to identify slow queries
-- 2. Run query 6 (index usage) monthly to find unused indexes
-- 3. Run query 8 (status changes) daily for security audit
-- 4. Run query 9 (pending invalidations) hourly in monitoring system
-- 5. Run query 10 (RLS overhead test) before and after policy changes

-- Set up automated alerts for:
-- - Queries taking > 100ms consistently
-- - Pending session invalidations > 5 minutes old
-- - Tables without RLS enabled
-- - Sudden increase in RLS policy execution time
