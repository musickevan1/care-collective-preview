-- CARE COLLECTIVE ADVANCED MONITORING SETUP
-- Enterprise-grade monitoring views, functions, and alerting system
-- Version: 5.0 (Enterprise Operations)
--
-- This script sets up comprehensive monitoring infrastructure for:
-- - Real-time performance tracking
-- - Automated health scoring
-- - Critical alert detection
-- - Care Collective specific metrics
-- - Security monitoring

\echo '==============================================='
\echo 'CARE COLLECTIVE MONITORING SETUP v5.0'
\echo 'Enterprise Monitoring Infrastructure'
\echo '==============================================='
\echo ''

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

\echo '1. CORE MONITORING VIEWS'
\echo '========================'

-- Real-time performance metrics view
CREATE OR REPLACE VIEW monitoring_performance_metrics AS
SELECT 
  'database_performance' as metric_type,
  NOW() as timestamp,
  
  -- Connection metrics
  (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
  (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'idle') as idle_connections,
  (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'idle in transaction') as idle_in_transaction,
  
  -- Query performance metrics
  (SELECT COUNT(*) FROM pg_stat_activity 
   WHERE query_start < NOW() - INTERVAL '30 seconds' 
     AND state = 'active') as slow_queries_30s,
  (SELECT COUNT(*) FROM pg_stat_activity 
   WHERE query_start < NOW() - INTERVAL '5 minutes' 
     AND state = 'active') as very_slow_queries,
  
  -- Table scan metrics
  (SELECT SUM(seq_scan) FROM pg_stat_user_tables WHERE schemaname = 'public') as total_seq_scans,
  (SELECT SUM(idx_scan) FROM pg_stat_user_tables WHERE schemaname = 'public') as total_idx_scans,
  
  -- Database size metrics
  (SELECT pg_database_size(current_database())) as database_size_bytes,
  (SELECT COUNT(*) FROM pg_stat_user_tables WHERE schemaname = 'public') as table_count,
  
  -- Lock metrics
  (SELECT COUNT(*) FROM pg_locks WHERE mode LIKE '%ExclusiveLock%') as exclusive_locks,
  (SELECT COUNT(*) FROM pg_locks WHERE NOT granted) as waiting_locks,
  
  -- Health status calculation
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_stat_activity WHERE query_start < NOW() - INTERVAL '30 seconds' AND state = 'active') > 5 THEN 'DEGRADED'
    WHEN (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active') > 25 THEN 'HIGH_LOAD'
    WHEN (SELECT COUNT(*) FROM pg_locks WHERE NOT granted) > 3 THEN 'LOCK_CONTENTION'
    ELSE 'HEALTHY'
  END as health_status;

\echo 'Created: monitoring_performance_metrics view'

-- Table-level health monitoring
CREATE OR REPLACE VIEW monitoring_table_health AS
SELECT 
  relname as table_name,
  schemaname,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  ROUND((n_dead_tup::numeric / GREATEST(n_live_tup, 1)) * 100, 2) as dead_ratio_pct,
  
  -- Access patterns
  seq_scan as sequential_scans,
  seq_tup_read as sequential_reads,
  idx_scan as index_scans,
  idx_tup_fetch as index_fetches,
  
  -- Modification patterns
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_tup_hot_upd as hot_updates,
  
  -- Size metrics
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as total_size,
  pg_total_relation_size(schemaname||'.'||relname) as size_bytes,
  
  -- Health assessment
  CASE 
    WHEN n_dead_tup::numeric / GREATEST(n_live_tup, 1) > 0.3 THEN 'CRITICAL_VACUUM_NEEDED'
    WHEN n_dead_tup::numeric / GREATEST(n_live_tup, 1) > 0.2 THEN 'VACUUM_RECOMMENDED'
    WHEN n_dead_tup::numeric / GREATEST(n_live_tup, 1) > 0.1 THEN 'MONITOR_CLOSELY'
    WHEN seq_scan > idx_scan * 3 AND n_live_tup > 1000 THEN 'INDEX_OPTIMIZATION_NEEDED'
    WHEN n_live_tup = 0 AND relname IN ('profiles', 'help_requests', 'messages') THEN 'EMPTY_CRITICAL_TABLE'
    ELSE 'HEALTHY'
  END as table_health,
  
  -- Maintenance recommendations
  CASE 
    WHEN n_dead_tup::numeric / GREATEST(n_live_tup, 1) > 0.2 THEN 'VACUUM ANALYZE ' || quote_ident(relname)
    WHEN seq_scan > idx_scan * 2 AND n_live_tup > 1000 THEN 'ANALYZE INDEX USAGE FOR ' || quote_ident(relname)
    ELSE 'NO ACTION NEEDED'
  END as maintenance_recommendation
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC;

\echo 'Created: monitoring_table_health view'

-- Care Collective platform-specific metrics
CREATE OR REPLACE VIEW monitoring_platform_metrics AS
SELECT 
  'platform_health' as metric_type,
  NOW() as timestamp,
  
  -- User metrics
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM profiles WHERE created_at > NOW() - INTERVAL '24 hours') as new_users_today,
  (SELECT COUNT(*) FROM profiles WHERE created_at > NOW() - INTERVAL '7 days') as new_users_week,
  
  -- Help request metrics
  (SELECT COUNT(*) FROM help_requests WHERE status = 'open') as open_requests,
  (SELECT COUNT(*) FROM help_requests WHERE status = 'open' AND urgency = 'critical') as critical_requests,
  (SELECT COUNT(*) FROM help_requests WHERE status = 'open' AND urgency = 'urgent') as urgent_requests,
  (SELECT COUNT(*) FROM help_requests WHERE created_at > NOW() - INTERVAL '1 hour') as requests_last_hour,
  (SELECT COUNT(*) FROM help_requests WHERE created_at > NOW() - INTERVAL '24 hours') as requests_today,
  
  -- Contact exchange metrics (privacy critical)
  (SELECT COUNT(*) FROM contact_exchanges) as total_exchanges,
  (SELECT COUNT(*) FROM contact_exchanges WHERE exchanged_at > NOW() - INTERVAL '1 hour') as exchanges_last_hour,
  (SELECT COUNT(*) FROM contact_exchanges WHERE confirmed_at IS NULL) as unconfirmed_exchanges,
  (SELECT COUNT(*) FROM contact_exchanges WHERE confirmed_at IS NULL AND exchanged_at < NOW() - INTERVAL '24 hours') as stale_unconfirmed,
  
  -- Messaging system metrics
  (SELECT COUNT(*) FROM messages) as total_messages,
  (SELECT COUNT(*) FROM messages WHERE created_at > NOW() - INTERVAL '1 hour') as messages_last_hour,
  (SELECT COUNT(*) FROM messages WHERE is_flagged = true) as flagged_messages,
  (SELECT COUNT(*) FROM messages WHERE is_flagged = true AND moderation_status = 'pending') as pending_moderation,
  
  -- Conversation metrics
  (SELECT COUNT(*) FROM conversations WHERE status = 'active') as active_conversations,
  (SELECT COUNT(*) FROM conversations WHERE last_message_at > NOW() - INTERVAL '24 hours') as active_conversations_today,
  
  -- System health indicators
  CASE 
    WHEN (SELECT COUNT(*) FROM help_requests WHERE status = 'open' AND urgency = 'critical') > 10 THEN 'HIGH_CRITICAL_DEMAND'
    WHEN (SELECT COUNT(*) FROM contact_exchanges WHERE confirmed_at IS NULL AND exchanged_at < NOW() - INTERVAL '24 hours') > 5 THEN 'PRIVACY_CONCERN'
    WHEN (SELECT COUNT(*) FROM messages WHERE is_flagged = true AND moderation_status = 'pending') > 15 THEN 'MODERATION_BACKLOG'
    WHEN (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active') > 20 THEN 'HIGH_DATABASE_LOAD'
    ELSE 'HEALTHY'
  END as platform_status,
  
  -- Community engagement score (0-100)
  LEAST(100, GREATEST(0, 
    (SELECT 
      CASE 
        WHEN total_users = 0 THEN 0
        ELSE (
          (COUNT(CASE WHEN hr.created_at > NOW() - INTERVAL '7 days' THEN 1 END) * 10) +
          (COUNT(CASE WHEN ce.exchanged_at > NOW() - INTERVAL '7 days' THEN 1 END) * 20) +
          (COUNT(CASE WHEN m.created_at > NOW() - INTERVAL '7 days' THEN 1 END) * 5)
        ) / GREATEST(total_users, 1)
      END
    FROM profiles p
    LEFT JOIN help_requests hr ON p.id = hr.user_id
    LEFT JOIN contact_exchanges ce ON p.id = ce.helper_id OR p.id = ce.requester_id  
    LEFT JOIN messages m ON p.id = m.sender_id
    CROSS JOIN (SELECT COUNT(*) as total_users FROM profiles) totals
    )
  )) as engagement_score;

\echo 'Created: monitoring_platform_metrics view'

\echo ''
\echo '2. HEALTH SCORING FUNCTIONS'
\echo '=========================='

-- Comprehensive health score calculation
CREATE OR REPLACE FUNCTION calculate_health_score()
RETURNS INTEGER AS $$
DECLARE
  index_score INTEGER := 0;
  maintenance_score INTEGER := 0;
  security_score INTEGER := 0;
  performance_score INTEGER := 0;
  total_score INTEGER := 0;
BEGIN
  -- Index optimization score (0-25 points)
  SELECT CASE 
    WHEN COUNT(*) >= 8 THEN 25
    WHEN COUNT(*) >= 6 THEN 20
    WHEN COUNT(*) >= 4 THEN 15
    ELSE 10
  END INTO index_score
  FROM pg_indexes 
  WHERE tablename IN ('help_requests', 'contact_exchanges', 'profiles', 'messages')
    AND indexname ~ 'created_at|status|urgency|user_id|request_id|helper_id|requester_id|exchanged_at|conversation_id';
  
  -- Table maintenance score (0-25 points)
  SELECT CASE 
    WHEN MAX(dead_ratio) < 10 THEN 25
    WHEN MAX(dead_ratio) < 20 THEN 20
    WHEN MAX(dead_ratio) < 30 THEN 15
    ELSE 10
  END INTO maintenance_score
  FROM (
    SELECT ROUND((n_dead_tup::numeric / GREATEST(n_live_tup, 1)) * 100, 2) as dead_ratio
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public' AND n_live_tup > 0
  ) dead_ratios;
  
  -- Security score (0-25 points) - RLS policies critical for Care Collective
  SELECT CASE 
    WHEN COUNT(*) >= 20 THEN 25  -- All expected policies in place
    WHEN COUNT(*) >= 15 THEN 20  -- Most policies in place
    WHEN COUNT(*) >= 10 THEN 15  -- Basic policies in place
    ELSE 5
  END INTO security_score
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename IN ('help_requests', 'contact_exchanges', 'profiles', 'messages', 'conversations');
  
  -- Performance score (0-25 points)
  SELECT CASE 
    WHEN slow_queries = 0 AND active_connections < 15 THEN 25
    WHEN slow_queries <= 2 AND active_connections < 20 THEN 20
    WHEN slow_queries <= 5 AND active_connections < 25 THEN 15
    ELSE 10
  END INTO performance_score
  FROM (
    SELECT 
      COUNT(CASE WHEN query_start < NOW() - INTERVAL '30 seconds' AND state = 'active' THEN 1 END) as slow_queries,
      COUNT(CASE WHEN state = 'active' THEN 1 END) as active_connections
    FROM pg_stat_activity
  ) perf_metrics;
  
  total_score := index_score + maintenance_score + security_score + performance_score;
  
  RETURN total_score;
END;
$$ LANGUAGE plpgsql;

\echo 'Created: calculate_health_score() function'

\echo ''
\echo '3. CRITICAL ALERT DETECTION'
\echo '=========================='

-- Function to detect critical conditions requiring immediate alerts
CREATE OR REPLACE FUNCTION check_critical_alerts()
RETURNS TABLE (
  alert_type TEXT,
  severity TEXT,
  message TEXT,
  metric_value NUMERIC,
  threshold_value NUMERIC,
  timestamp TIMESTAMPTZ,
  recommended_action TEXT
) AS $$
BEGIN
  -- Database performance alerts
  RETURN QUERY
  SELECT 
    'SLOW_QUERIES' as alert_type,
    'CRITICAL' as severity,
    'Multiple queries running longer than 30 seconds' as message,
    (SELECT COUNT(*)::numeric FROM pg_stat_activity WHERE query_start < NOW() - INTERVAL '30 seconds' AND state = 'active') as metric_value,
    3::numeric as threshold_value,
    NOW() as timestamp,
    'Investigate slow queries, consider killing long-running queries, check for lock contention' as recommended_action
  WHERE (SELECT COUNT(*) FROM pg_stat_activity WHERE query_start < NOW() - INTERVAL '30 seconds' AND state = 'active') > 3;
  
  -- Connection pool exhaustion
  RETURN QUERY
  SELECT 
    'CONNECTION_POOL' as alert_type,
    'WARNING' as severity,
    'High number of active database connections' as message,
    (SELECT COUNT(*)::numeric FROM pg_stat_activity WHERE state = 'active') as metric_value,
    20::numeric as threshold_value,
    NOW() as timestamp,
    'Check application connection pooling, investigate connection leaks' as recommended_action
  WHERE (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active') > 20;
  
  -- Dead tuple ratio (vacuum needed)
  RETURN QUERY
  SELECT 
    'VACUUM_NEEDED' as alert_type,
    CASE 
      WHEN max_dead_ratio > 40 THEN 'CRITICAL'
      WHEN max_dead_ratio > 25 THEN 'HIGH'
      ELSE 'MEDIUM'
    END as severity,
    'Tables require immediate vacuum: ' || tables_needing_vacuum as message,
    max_dead_ratio as metric_value,
    25::numeric as threshold_value,
    NOW() as timestamp,
    'Run VACUUM ANALYZE on affected tables: ' || tables_needing_vacuum as recommended_action
  FROM (
    SELECT 
      MAX(ROUND((n_dead_tup::numeric / GREATEST(n_live_tup, 1)) * 100, 2)) as max_dead_ratio,
      STRING_AGG(relname, ', ') as tables_needing_vacuum
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public' 
      AND n_dead_tup::numeric / GREATEST(n_live_tup, 1) > 0.25
  ) vacuum_metrics
  WHERE max_dead_ratio > 25;
  
  -- Lock contention
  RETURN QUERY
  SELECT 
    'LOCK_CONTENTION' as alert_type,
    'HIGH' as severity,
    'Multiple queries waiting for locks' as message,
    (SELECT COUNT(*)::numeric FROM pg_locks WHERE NOT granted) as metric_value,
    3::numeric as threshold_value,
    NOW() as timestamp,
    'Investigate blocking queries and consider terminating long-running transactions' as recommended_action
  WHERE (SELECT COUNT(*) FROM pg_locks WHERE NOT granted) > 3;
  
  -- Care Collective specific alerts
  
  -- Privacy concern: unconfirmed contact exchanges
  RETURN QUERY
  SELECT 
    'PRIVACY_VIOLATION' as alert_type,
    'HIGH' as severity,
    'Contact exchanges without confirmation detected' as message,
    (SELECT COUNT(*)::numeric FROM contact_exchanges WHERE confirmed_at IS NULL AND exchanged_at < NOW() - INTERVAL '24 hours') as metric_value,
    5::numeric as threshold_value,
    NOW() as timestamp,
    'Review unconfirmed contact exchanges, ensure privacy compliance' as recommended_action
  WHERE (SELECT COUNT(*) FROM contact_exchanges WHERE confirmed_at IS NULL AND exchanged_at < NOW() - INTERVAL '24 hours') > 5;
  
  -- High critical request load
  RETURN QUERY
  SELECT 
    'CRITICAL_REQUESTS' as alert_type,
    'HIGH' as severity,
    'Unusually high number of critical help requests' as message,
    (SELECT COUNT(*)::numeric FROM help_requests WHERE status = 'open' AND urgency = 'critical') as metric_value,
    8::numeric as threshold_value,
    NOW() as timestamp,
    'Review critical help requests, consider additional community outreach' as recommended_action
  WHERE (SELECT COUNT(*) FROM help_requests WHERE status = 'open' AND urgency = 'critical') > 8;
  
  -- Moderation backlog
  RETURN QUERY
  SELECT 
    'MODERATION_BACKLOG' as alert_type,
    'MEDIUM' as severity,
    'Messages pending moderation review' as message,
    (SELECT COUNT(*)::numeric FROM messages WHERE is_flagged = true AND moderation_status = 'pending') as metric_value,
    10::numeric as threshold_value,
    NOW() as timestamp,
    'Review flagged messages, update moderation procedures if needed' as recommended_action
  WHERE (SELECT COUNT(*) FROM messages WHERE is_flagged = true AND moderation_status = 'pending') > 10;
  
  -- Empty critical tables (data integrity issue)
  RETURN QUERY
  SELECT 
    'DATA_INTEGRITY' as alert_type,
    'CRITICAL' as severity,
    'Critical table is empty: ' || relname as message,
    0::numeric as metric_value,
    1::numeric as threshold_value,
    NOW() as timestamp,
    'Investigate data loss, restore from backup if necessary' as recommended_action
  FROM pg_stat_user_tables 
  WHERE schemaname = 'public' 
    AND relname IN ('profiles', 'help_requests')
    AND n_live_tup = 0;
END;
$$ LANGUAGE plpgsql;

\echo 'Created: check_critical_alerts() function'

\echo ''
\echo '4. SECURITY MONITORING'
\echo '====================='

-- Security monitoring view
CREATE OR REPLACE VIEW monitoring_security_metrics AS
SELECT 
  'security_monitoring' as metric_type,
  NOW() as timestamp,
  
  -- Authentication metrics
  (SELECT COUNT(*) FROM audit_logs WHERE action LIKE '%login%' AND created_at > NOW() - INTERVAL '1 hour') as login_attempts_hour,
  (SELECT COUNT(*) FROM audit_logs WHERE action LIKE '%failed%' AND created_at > NOW() - INTERVAL '1 hour') as failed_operations_hour,
  
  -- Privacy metrics
  (SELECT COUNT(*) FROM audit_logs WHERE action = 'contact_access' AND created_at > NOW() - INTERVAL '1 hour') as contact_access_hour,
  (SELECT COUNT(*) FROM audit_logs WHERE action = 'unauthorized_access' AND created_at > NOW() - INTERVAL '1 hour') as unauthorized_attempts,
  
  -- Data modification patterns
  (SELECT COUNT(*) FROM audit_logs WHERE action IN ('mass_delete', 'bulk_update') AND created_at > NOW() - INTERVAL '1 hour') as mass_operations,
  (SELECT COUNT(*) FROM audit_logs WHERE action = 'rls_violation' AND created_at > NOW() - INTERVAL '1 hour') as rls_violations,
  
  -- System security status
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as active_rls_policies,
  (SELECT COUNT(*) FROM pg_stat_user_tables WHERE row_security = false AND schemaname = 'public') as tables_without_rls,
  
  -- Security assessment
  CASE 
    WHEN (SELECT COUNT(*) FROM audit_logs WHERE action LIKE '%failed%' AND created_at > NOW() - INTERVAL '1 hour') > 10 THEN 'HIGH_FAILURE_RATE'
    WHEN (SELECT COUNT(*) FROM audit_logs WHERE action = 'unauthorized_access' AND created_at > NOW() - INTERVAL '1 hour') > 3 THEN 'SECURITY_CONCERN'
    WHEN (SELECT COUNT(*) FROM pg_stat_user_tables WHERE row_security = false AND schemaname = 'public') > 0 THEN 'RLS_NOT_ENABLED'
    ELSE 'SECURE'
  END as security_status;

\echo 'Created: monitoring_security_metrics view'

\echo ''
\echo '5. AUTOMATED MAINTENANCE FUNCTIONS'
\echo '================================='

-- Automated maintenance response function
CREATE OR REPLACE FUNCTION automated_maintenance_response()
RETURNS TEXT AS $$
DECLARE
  maintenance_actions TEXT[] := ARRAY[]::TEXT[];
  table_record RECORD;
  action_count INTEGER := 0;
BEGIN
  -- Auto-vacuum tables with high dead tuple ratio
  FOR table_record IN 
    SELECT relname, ROUND((n_dead_tup::numeric / GREATEST(n_live_tup, 1)) * 100, 2) as dead_ratio
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public' 
      AND n_dead_tup::numeric / GREATEST(n_live_tup, 1) > 0.2
      AND n_live_tup > 100  -- Only for tables with substantial data
  LOOP
    EXECUTE 'VACUUM ANALYZE ' || quote_ident(table_record.relname);
    maintenance_actions := array_append(maintenance_actions, 
      'VACUUM ANALYZE ' || table_record.relname || ' (dead ratio: ' || table_record.dead_ratio || '%)');
    action_count := action_count + 1;
  END LOOP;
  
  -- Update table statistics for tables with high modification rates
  FOR table_record IN
    SELECT relname, (n_tup_ins + n_tup_upd + n_tup_del) as modifications
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
      AND (n_tup_ins + n_tup_upd + n_tup_del) > 1000
  LOOP
    EXECUTE 'ANALYZE ' || quote_ident(table_record.relname);
    maintenance_actions := array_append(maintenance_actions,
      'ANALYZE ' || table_record.relname || ' (' || table_record.modifications || ' modifications)');
    action_count := action_count + 1;
  END LOOP;
  
  -- Log maintenance actions
  IF action_count > 0 THEN
    INSERT INTO audit_logs (action, table_name, metadata, created_at)
    VALUES ('automated_maintenance', 'system', 
      jsonb_build_object(
        'actions_taken', maintenance_actions,
        'action_count', action_count,
        'timestamp', NOW()
      ), 
      NOW());
  END IF;
  
  -- Return summary
  IF action_count > 0 THEN
    RETURN 'Automated maintenance completed: ' || action_count || ' actions taken. ' || 
           array_to_string(maintenance_actions, '; ');
  ELSE
    RETURN 'No maintenance actions required.';
  END IF;
END;
$$ LANGUAGE plpgsql;

\echo 'Created: automated_maintenance_response() function'

\echo ''
\echo '6. MONITORING CONFIGURATION'
\echo '=========================='

-- Create monitoring configuration table
CREATE TABLE IF NOT EXISTS monitoring_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL UNIQUE,
  threshold_warning NUMERIC,
  threshold_critical NUMERIC,
  check_interval_seconds INTEGER DEFAULT 300,
  alert_enabled BOOLEAN DEFAULT true,
  notification_channels TEXT[] DEFAULT ARRAY['slack'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default monitoring thresholds
INSERT INTO monitoring_config (metric_name, threshold_warning, threshold_critical, check_interval_seconds, notification_channels)
VALUES 
  ('active_connections', 15, 25, 60, ARRAY['slack']),
  ('slow_queries', 2, 5, 30, ARRAY['slack', 'email']),
  ('dead_tuple_ratio', 15, 25, 300, ARRAY['slack']),
  ('critical_help_requests', 5, 10, 60, ARRAY['slack', 'email']),
  ('unconfirmed_exchanges', 3, 7, 300, ARRAY['slack', 'email']),
  ('pending_moderation', 8, 15, 180, ARRAY['slack']),
  ('database_health_score', 75, 60, 300, ARRAY['slack', 'email']),
  ('lock_contention', 2, 5, 30, ARRAY['slack']),
  ('rls_violations', 1, 3, 60, ARRAY['email', 'pagerduty'])
ON CONFLICT (metric_name) DO NOTHING;

\echo 'Created: monitoring_config table with default thresholds'

-- Create alert history table
CREATE TABLE IF NOT EXISTS alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  metric_value NUMERIC,
  threshold_value NUMERIC,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

\echo 'Created: alert_history table'

-- Create index for alert history queries
CREATE INDEX IF NOT EXISTS idx_alert_history_created_at ON alert_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_history_severity ON alert_history(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_history_unresolved ON alert_history(resolved_at) WHERE resolved_at IS NULL;

\echo 'Created: alert_history indexes'

\echo ''
\echo '7. NOTIFICATION FUNCTIONS'
\echo '========================'

-- Function to log alerts to history
CREATE OR REPLACE FUNCTION log_alert(
  p_alert_type TEXT,
  p_severity TEXT,
  p_message TEXT,
  p_metric_value NUMERIC DEFAULT NULL,
  p_threshold_value NUMERIC DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  alert_id UUID;
BEGIN
  INSERT INTO alert_history (alert_type, severity, message, metric_value, threshold_value)
  VALUES (p_alert_type, p_severity, p_message, p_metric_value, p_threshold_value)
  RETURNING id INTO alert_id;
  
  -- Use pg_notify for real-time alert notifications
  PERFORM pg_notify('care_collective_alert', 
    json_build_object(
      'id', alert_id,
      'type', p_alert_type,
      'severity', p_severity,
      'message', p_message,
      'value', p_metric_value,
      'threshold', p_threshold_value,
      'timestamp', NOW()
    )::text
  );
  
  RETURN alert_id;
END;
$$ LANGUAGE plpgsql;

\echo 'Created: log_alert() function'

-- Function to resolve alerts
CREATE OR REPLACE FUNCTION resolve_alert(
  p_alert_id UUID,
  p_resolution_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE alert_history 
  SET resolved_at = NOW(),
      resolution_notes = p_resolution_notes
  WHERE id = p_alert_id 
    AND resolved_at IS NULL;
  
  IF FOUND THEN
    PERFORM pg_notify('care_collective_alert_resolved',
      json_build_object(
        'id', p_alert_id,
        'resolved_at', NOW(),
        'notes', p_resolution_notes
      )::text
    );
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql;

\echo 'Created: resolve_alert() function'

\echo ''
\echo '8. MONITORING SUMMARY'
\echo '===================='

-- Summary function for monitoring dashboard
CREATE OR REPLACE FUNCTION get_monitoring_summary()
RETURNS JSON AS $$
DECLARE
  summary JSON;
BEGIN
  SELECT json_build_object(
    'timestamp', NOW(),
    'health_score', calculate_health_score(),
    'performance', (
      SELECT json_build_object(
        'active_connections', active_connections,
        'slow_queries', slow_queries_30s,
        'health_status', health_status
      )
      FROM monitoring_performance_metrics
    ),
    'platform', (
      SELECT json_build_object(
        'open_requests', open_requests,
        'critical_requests', critical_requests,
        'exchanges_hour', exchanges_last_hour,
        'messages_hour', messages_last_hour,
        'platform_status', platform_status
      )
      FROM monitoring_platform_metrics
    ),
    'security', (
      SELECT json_build_object(
        'active_policies', active_rls_policies,
        'security_status', security_status,
        'failed_ops_hour', failed_operations_hour
      )
      FROM monitoring_security_metrics
    ),
    'critical_alerts', (
      SELECT COUNT(*) FROM check_critical_alerts() WHERE severity = 'CRITICAL'
    ),
    'unresolved_alerts', (
      SELECT COUNT(*) FROM alert_history WHERE resolved_at IS NULL
    )
  ) INTO summary;
  
  RETURN summary;
END;
$$ LANGUAGE plpgsql;

\echo 'Created: get_monitoring_summary() function'

\echo ''
\echo '==============================================='
\echo 'CARE COLLECTIVE MONITORING SETUP COMPLETE'
\echo '==============================================='
\echo ''
\echo 'Monitoring Infrastructure Created:'
\echo '• Real-time performance monitoring views'
\echo '• Automated health scoring (calculate_health_score)'
\echo '• Critical alert detection (check_critical_alerts)'
\echo '• Care Collective specific metrics tracking'
\echo '• Security monitoring and alerting'
\echo '• Automated maintenance functions'
\echo '• Alert history and notification system'
\echo ''
\echo 'Quick Test Commands:'
\echo '• SELECT * FROM get_monitoring_summary();'
\echo '• SELECT calculate_health_score();'
\echo '• SELECT * FROM check_critical_alerts();'
\echo '• SELECT * FROM monitoring_performance_metrics;'
\echo '• SELECT * FROM monitoring_platform_metrics;'
\echo ''
\echo 'Next Steps:'
\echo '1. Set up external notification webhooks (Slack, email)'
\echo '2. Configure monitoring daemon (scripts/monitoring-daemon.sh)'
\echo '3. Set up monitoring dashboard'
\echo '4. Test alert escalation procedures'
\echo '==============================================='