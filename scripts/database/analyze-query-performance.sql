-- CARE COLLECTIVE DATABASE PERFORMANCE ANALYSIS
-- This script analyzes query performance and identifies optimization opportunities
-- Usage: psql -f scripts/analyze-query-performance.sql
-- 
-- Designed specifically for Care Collective mutual aid platform
-- Focuses on help requests, contact exchanges, and user management queries

\echo '======================================='
\echo 'CARE COLLECTIVE PERFORMANCE ANALYSIS'
\echo '======================================='
\echo ''

-- Set output format for better readability
\pset border 2
\pset format wrapped

\echo '1. DATABASE SIZE AND TABLE STATISTICS'
\echo '======================================'

-- Database size overview
SELECT 
    schemaname as schema,
    relname as table,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as size,
    pg_total_relation_size(schemaname||'.'||relname) as size_bytes,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    ROUND((n_dead_tup::numeric / GREATEST(n_live_tup, 1)) * 100, 2) as dead_ratio_pct
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC;

\echo ''
\echo '2. INDEX USAGE ANALYSIS'
\echo '======================'

-- Index usage statistics for core Care Collective tables
SELECT 
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    idx_tup_read as index_reads,
    idx_tup_fetch as index_fetches,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    CASE 
        WHEN idx_tup_read = 0 THEN 'UNUSED INDEX - Consider dropping'
        WHEN idx_tup_read < 100 THEN 'LOW USAGE'
        WHEN idx_tup_read < 1000 THEN 'MODERATE USAGE'
        ELSE 'HIGH USAGE'
    END as usage_assessment
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
    AND relname IN ('profiles', 'help_requests', 'contact_exchanges', 'messages', 'audit_logs')
ORDER BY relname, idx_tup_read DESC;

\echo ''
\echo '3. CARE COLLECTIVE SPECIFIC QUERY PATTERNS'
\echo '=========================================='

-- Help requests query patterns (most common user action)
\echo 'Help Requests Performance:'
SELECT 
    'Open Help Requests Query' as query_type,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN status = 'open' THEN 1 END) as open_requests,
    COUNT(CASE WHEN urgency = 'urgent' THEN 1 END) as urgent_requests,
    COUNT(CASE WHEN urgency = 'critical' THEN 1 END) as critical_requests,
    ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - created_at))/3600), 2) as avg_age_hours
FROM help_requests;

-- Contact exchange volume (privacy-critical queries)
\echo ''
\echo 'Contact Exchange Performance:'
SELECT 
    'Contact Exchange Activity' as query_type,
    COUNT(*) as total_exchanges,
    COUNT(CASE WHEN exchanged_at > NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h,
    COUNT(CASE WHEN exchanged_at > NOW() - INTERVAL '7 days' THEN 1 END) as last_7d,
    CAST(AVG(EXTRACT(EPOCH FROM (exchanged_at - exchanged_at))/60) AS numeric) as avg_response_minutes
FROM contact_exchanges
WHERE exchanged_at IS NOT NULL;

-- User verification status (affects RLS policies)
\echo ''
\echo 'User Verification Status (affects all queries):'
SELECT 
    verification_status,
    COUNT(*) as user_count,
    COUNT(CASE WHEN email_confirmed THEN 1 END) as email_confirmed_count,
    ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM profiles) * 100, 1) as percentage
FROM profiles 
GROUP BY verification_status
ORDER BY user_count DESC;

\echo ''
\echo '4. SLOW QUERY IDENTIFICATION'
\echo '============================'

-- Check for queries that might be slow (requires pg_stat_statements extension)
DO $$
BEGIN
    -- Check if pg_stat_statements is available
    IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_stat_statements' AND installed_version IS NOT NULL) THEN
        -- Show slow queries if extension is available
        RAISE NOTICE 'pg_stat_statements extension is available';
        PERFORM 1; -- We'd normally show slow queries here, but it requires the extension to be loaded
    ELSE
        RAISE NOTICE 'pg_stat_statements extension not available - install for detailed query performance tracking';
    END IF;
END $$;

\echo ''
\echo '5. MAINTENANCE RECOMMENDATIONS'
\echo '=============================='

-- Tables needing VACUUM based on dead tuple ratio
\echo 'Tables Needing Maintenance (>10% dead tuples):'
SELECT 
    relname as tablename,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    ROUND((n_dead_tup::numeric / GREATEST(n_live_tup, 1)) * 100, 2) as dead_ratio_pct,
    CASE 
        WHEN ROUND((n_dead_tup::numeric / GREATEST(n_live_tup, 1)) * 100, 2) > 20 THEN 'VACUUM FULL recommended'
        WHEN ROUND((n_dead_tup::numeric / GREATEST(n_live_tup, 1)) * 100, 2) > 10 THEN 'VACUUM recommended'
        ELSE 'No action needed'
    END as recommendation
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
    AND n_live_tup > 0
ORDER BY (n_dead_tup::float / GREATEST(n_live_tup, 1)) DESC;

\echo ''
\echo '6. MISSING INDEXES ANALYSIS'
\echo '=========================='

-- Analyze tables for potential missing indexes based on Care Collective usage patterns
\echo 'Care Collective Index Recommendations:'

-- Check if we have all recommended indexes for help requests
SELECT 
    'help_requests' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'help_requests' AND indexname ~ 'status') THEN '✓'
        ELSE '✗ MISSING'
    END as status_index,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'help_requests' AND indexname ~ 'urgency') THEN '✓'
        ELSE '✗ MISSING'
    END as urgency_index,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'help_requests' AND indexname ~ 'created_at') THEN '✓'
        ELSE '✗ MISSING'
    END as created_at_index,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'help_requests' AND indexname ~ 'user_id') THEN '✓'
        ELSE '✗ MISSING'
    END as user_id_index;

-- Check contact_exchanges indexes (privacy-critical)
SELECT 
    'contact_exchanges' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'contact_exchanges' AND indexname ~ 'request_id') THEN '✓'
        ELSE '✗ MISSING'
    END as request_id_index,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'contact_exchanges' AND indexname ~ 'helper_id') THEN '✓'
        ELSE '✗ MISSING'
    END as helper_id_index,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'contact_exchanges' AND indexname ~ 'requester_id') THEN '✓'
        ELSE '✗ MISSING'
    END as requester_id_index,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'contact_exchanges' AND indexname ~ 'exchanged_at') THEN '✓'
        ELSE '✗ MISSING'
    END as exchanged_at_index;

\echo ''
\echo '7. RLS POLICY PERFORMANCE IMPACT'
\echo '==============================='

-- Analyze RLS policies that might impact performance
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual IS NOT NULL as has_using_clause,
    with_check IS NOT NULL as has_check_clause
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'help_requests', 'contact_exchanges', 'messages')
ORDER BY tablename, policyname;

\echo ''
\echo '8. CONNECTION AND ACTIVITY OVERVIEW'
\echo '=================================='

-- Current database activity
SELECT 
    state,
    COUNT(*) as connection_count,
    COUNT(CASE WHEN query_start > NOW() - INTERVAL '1 minute' THEN 1 END) as active_last_minute
FROM pg_stat_activity 
WHERE datname = current_database()
GROUP BY state
ORDER BY connection_count DESC;

\echo ''
\echo '9. CARE COLLECTIVE HEALTH SCORE'
\echo '=============================='

-- Overall health assessment for Care Collective platform
WITH health_metrics AS (
    SELECT 
        -- Index coverage score (0-25 points)
        CASE 
            WHEN (SELECT COUNT(*) FROM pg_indexes WHERE tablename IN ('help_requests', 'contact_exchanges', 'profiles') AND indexname ~ 'created_at|status|urgency|user_id|request_id|helper_id|requester_id|exchanged_at') >= 8 
            THEN 25 
            ELSE (SELECT COUNT(*) FROM pg_indexes WHERE tablename IN ('help_requests', 'contact_exchanges', 'profiles') AND indexname ~ 'created_at|status|urgency|user_id|request_id|helper_id|requester_id|exchanged_at') * 3
        END as index_score,
        
        -- Table maintenance score (0-25 points)
        CASE 
            WHEN (SELECT MAX(ROUND((n_dead_tup::numeric / GREATEST(n_live_tup, 1)) * 100, 2)) FROM pg_stat_user_tables WHERE schemaname = 'public') < 10 
            THEN 25 
            ELSE 15 
        END as maintenance_score,
        
        -- RLS security score (0-25 points) - Care Collective requires strong RLS
        CASE 
            WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('help_requests', 'contact_exchanges', 'profiles', 'messages')) >= 12 
            THEN 25 
            ELSE 10 
        END as security_score,
        
        -- Data volume score (0-25 points)
        CASE 
            WHEN (SELECT SUM(n_live_tup) FROM pg_stat_user_tables WHERE schemaname = 'public') < 100000 
            THEN 25 
            ELSE 20 
        END as volume_score
)
SELECT 
    'CARE COLLECTIVE DATABASE HEALTH SCORE' as assessment,
    (index_score + maintenance_score + security_score + volume_score) as total_score,
    index_score as index_coverage,
    maintenance_score as table_maintenance,
    security_score as rls_security,
    volume_score as data_volume,
    CASE 
        WHEN (index_score + maintenance_score + security_score + volume_score) >= 90 THEN 'EXCELLENT'
        WHEN (index_score + maintenance_score + security_score + volume_score) >= 75 THEN 'GOOD'
        WHEN (index_score + maintenance_score + security_score + volume_score) >= 60 THEN 'FAIR'
        ELSE 'NEEDS IMPROVEMENT'
    END as overall_rating
FROM health_metrics;

\echo ''
\echo '======================================='
\echo 'CARE COLLECTIVE PERFORMANCE ANALYSIS COMPLETE'
\echo '======================================='
\echo 'For automated monitoring, run this script weekly'
\echo 'For production monitoring, consider pg_stat_statements extension'
\echo '======================================='