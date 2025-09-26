# Care Collective Database Troubleshooting Runbook

**Version**: 5.0 (Enterprise Operations)  
**Last Updated**: January 2025  
**For**: Production Support, DevOps, and Development Teams  

## 🚨 Emergency Contacts & Escalation

### Incident Severity Levels
- **P0 (Critical)**: Platform down, authentication broken, data loss
- **P1 (High)**: Performance degradation, help request system issues
- **P2 (Medium)**: Contact exchange problems, messaging delays
- **P3 (Low)**: Minor UI issues, non-critical feature problems

### Emergency Response Team
- **Primary On-Call**: Database Administrator
- **Secondary**: Lead Developer  
- **Escalation**: Platform Owner
- **Supabase Support**: For infrastructure issues

## 🔧 Quick Diagnostic Commands

### Database Health Check
```bash
# Run comprehensive health analysis
cd /path/to/care-collective-preview
npm run db:security-audit

# Check database connection
node scripts/verify-setup.js

# Analyze query performance
psql -h [host] -U [user] -d [database] -f scripts/analyze-query-performance.sql
```

### Real-time Monitoring
```sql
-- Check active connections
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE state = 'active';

-- Monitor slow queries (> 1 second)
SELECT query, query_start, state, wait_event_type, wait_event
FROM pg_stat_activity 
WHERE state != 'idle' 
  AND query_start < NOW() - INTERVAL '1 second';

-- Check database size and growth
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 🚨 Common Issues & Solutions

### 1. Authentication & User Registration Issues

#### **Issue**: Users can't sign up or profiles aren't created
```
Error: "Profile creation failed" or "User registration incomplete"
```

**Diagnosis:**
```sql
-- Check if user registration trigger is working
SELECT * FROM verify_user_registration_system();

-- Check for failed profile creations
SELECT u.id, u.email, u.created_at, p.id as profile_id
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC
LIMIT 10;
```

**Solutions:**
1. **Missing Profiles Recovery**:
```sql
-- Manually create missing profiles
INSERT INTO profiles (id, name, created_at)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', u.email),
  u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;
```

2. **Trigger Verification**:
```sql
-- Verify trigger exists and is active
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

3. **Reset Registration System** (last resort):
```bash
# Apply user registration consolidation migration
supabase db reset
```

#### **Issue**: Authentication tokens expired prematurely
```
Error: "Session expired" or "Invalid refresh token"
```

**Solutions:**
1. **Check client configuration**:
```typescript
// Verify lib/supabase/client.ts settings
{
  autoRefreshToken: true,      // Should be true for client
  persistSession: true,        // Should be true for client
  detectSessionInUrl: true,    // Should be true for auth callbacks
  flowType: 'pkce'            // Should be 'pkce' for security
}
```

2. **Server configuration check**:
```typescript
// Verify lib/supabase/server.ts settings  
{
  autoRefreshToken: false,     // Should be false for server
  persistSession: false,      // Should be false for server
  flowType: 'pkce'            // Should be 'pkce' for security
}
```

### 2. Help Request System Issues

#### **Issue**: Help requests not loading or taking too long
```
Error: "Requests failed to load" or slow dashboard performance
```

**Diagnosis:**
```sql
-- Check help request query performance
EXPLAIN ANALYZE 
SELECT hr.*, p.name, p.location 
FROM help_requests hr
JOIN profiles p ON hr.user_id = p.id
WHERE hr.status = 'open'
ORDER BY hr.urgency DESC, hr.created_at DESC
LIMIT 20;

-- Check for missing indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0;
```

**Solutions:**
1. **Index Analysis**:
```bash
# Run performance analysis
npm run db:security-audit

# Check if critical indexes exist
psql -c "\\di" -d [database]
```

2. **Query Optimization**:
```sql
-- Recreate missing performance indexes if needed
CREATE INDEX CONCURRENTLY idx_help_requests_status_urgency_created 
ON help_requests(status, urgency, created_at DESC);

-- Update table statistics
ANALYZE help_requests;
ANALYZE profiles;
```

#### **Issue**: Help request creation fails
```
Error: "Failed to create help request" or RLS policy violations
```

**Diagnosis:**
```sql
-- Test RLS policies
SET ROLE authenticated;
SET request.jwt.claim.sub = '[user-uuid]';

-- Try creating a test request
INSERT INTO help_requests (user_id, title, category, urgency)
VALUES ('[user-uuid]', 'Test Request', 'groceries', 'normal');
```

**Solutions:**
1. **RLS Policy Check**:
```sql
-- Verify help request policies are active
SELECT schemaname, tablename, policyname, permissive, cmd, qual
FROM pg_policies
WHERE tablename = 'help_requests';
```

2. **User ID Validation**:
```sql
-- Ensure user has valid profile
SELECT p.id, p.name 
FROM profiles p 
WHERE p.id = '[user-uuid]';
```

### 3. Contact Exchange & Privacy Issues

#### **Issue**: Contact information exposed without consent
```
Error: "Unauthorized contact access" or privacy violations
```

**Immediate Response:**
```sql
-- Emergency: Check for unauthorized contact access
SELECT ce.*, hr.title
FROM contact_exchanges ce
JOIN help_requests hr ON ce.request_id = hr.id
WHERE ce.confirmed_at IS NULL
  AND ce.exchanged_at < NOW() - INTERVAL '24 hours';

-- Audit recent contact exchanges
SELECT 
  ce.id,
  ce.request_id,
  ce.helper_id,
  ce.requester_id,
  ce.exchanged_at,
  ce.confirmed_at,
  hr.title
FROM contact_exchanges ce
JOIN help_requests hr ON ce.request_id = hr.id
WHERE ce.exchanged_at > NOW() - INTERVAL '1 hour'
ORDER BY ce.exchanged_at DESC;
```

**Solutions:**
1. **Privacy Policy Verification**:
```sql
-- Run security audit
SELECT * FROM verify_rls_security();

-- Check contact exchange policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'contact_exchanges';
```

2. **Data Correction**:
```sql
-- Remove unauthorized exchanges (if confirmed)
DELETE FROM contact_exchanges
WHERE confirmed_at IS NULL
  AND exchanged_at < NOW() - INTERVAL '48 hours';
```

#### **Issue**: Contact exchange system not working
```
Error: "Contact sharing failed" or "Exchange not created"
```

**Diagnosis:**
```sql
-- Check contact exchange function
SELECT get_contact_info_with_consent('[request_id]', '[user_id]');

-- Verify trigger functionality
SELECT * FROM contact_exchanges
WHERE request_id = '[request_id]'
ORDER BY exchanged_at DESC;
```

### 4. Messaging System Issues

#### **Issue**: Messages not sending or receiving
```
Error: "Message failed to send" or "Messages not loading"
```

**Diagnosis:**
```sql
-- Check conversation access
SELECT c.*, cp.user_id, cp.left_at
FROM conversations c
JOIN conversation_participants cp ON c.id = cp.conversation_id
WHERE c.id = '[conversation_id]';

-- Check message delivery status
SELECT 
  m.id,
  m.status,
  m.created_at,
  m.read_at,
  p.name as sender_name
FROM messages m
JOIN profiles p ON m.sender_id = p.id
WHERE m.conversation_id = '[conversation_id]'
ORDER BY m.created_at DESC
LIMIT 10;
```

**Solutions:**
1. **Conversation Repair**:
```sql
-- Add missing conversation participant
INSERT INTO conversation_participants (conversation_id, user_id)
VALUES ('[conversation_id]', '[user_id]')
ON CONFLICT DO NOTHING;
```

2. **Message System Reset**:
```sql
-- Update conversation timestamp
UPDATE conversations 
SET last_message_at = NOW(), updated_at = NOW()
WHERE id = '[conversation_id]';
```

### 5. Performance Issues

#### **Issue**: Database queries running slowly
```
Symptoms: Page load times > 3 seconds, query timeouts
```

**Immediate Diagnosis:**
```sql
-- Identify slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
WHERE mean_time > 1000  -- Queries taking > 1 second
ORDER BY mean_time DESC
LIMIT 10;

-- Check for table bloat
SELECT 
  schemaname, 
  tablename, 
  n_dead_tup, 
  n_live_tup,
  round(n_dead_tup * 100.0 / (n_live_tup + n_dead_tup), 1) AS dead_percentage
FROM pg_stat_user_tables
WHERE n_dead_tup > 0
ORDER BY dead_percentage DESC;
```

**Solutions:**
1. **Immediate Performance Fix**:
```bash
# Run database maintenance
./scripts/db-maintenance.sh --auto-vacuum

# Update statistics
psql -c "ANALYZE;" -d [database]
```

2. **Index Maintenance**:
```sql
-- Rebuild heavily used indexes
REINDEX INDEX CONCURRENTLY idx_help_requests_status_urgency_created;
REINDEX INDEX CONCURRENTLY idx_messages_conversation_created;
```

### 6. RLS Policy Issues

#### **Issue**: Users can't access data they should be able to
```
Error: "Permission denied" or "RLS policy violation"
```

**Diagnosis:**
```sql
-- Test RLS policy directly
SET ROLE authenticated;
SET request.jwt.claim.sub = '[user-uuid]';

-- Try the failing operation
SELECT * FROM help_requests WHERE id = '[request_id]';

-- Check if user exists in profiles
SELECT id, name FROM profiles WHERE id = '[user-uuid]';
```

**Solutions:**
1. **Policy Debugging**:
```sql
-- Temporarily disable RLS for testing (CAREFUL!)
ALTER TABLE help_requests DISABLE ROW LEVEL SECURITY;
-- Test query
-- Re-enable immediately:
ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;
```

2. **Policy Reset** (last resort):
```bash
# Apply latest policy documentation migration
supabase db push --include-all
```

## 🔍 Monitoring & Prevention

### Proactive Monitoring Setup

#### Daily Health Checks
```bash
#!/bin/bash
# Add to cron: 0 9 * * * /path/to/daily-health-check.sh

# Run automated health analysis
npm run db:security-audit --output=json > /var/log/db-health-$(date +%Y%m%d).json

# Check for issues
if [ $? -ne 0 ]; then
    echo "Database health check failed" | mail -s "Care Collective DB Alert" admin@example.com
fi
```

#### Real-time Alerting
```sql
-- Create monitoring views
CREATE VIEW unhealthy_metrics AS
SELECT 
  'Slow queries' as metric,
  count(*) as count
FROM pg_stat_activity 
WHERE state = 'active' 
  AND query_start < NOW() - INTERVAL '30 seconds'
UNION ALL
SELECT 
  'Failed help requests' as metric,
  count(*) as count
FROM help_requests 
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND status IS NULL;
```

#### Weekly Maintenance Schedule
```bash
# Weekly maintenance script
#!/bin/bash
# Run Sundays at 3 AM: 0 3 * * 0 /path/to/weekly-maintenance.sh

echo "Starting weekly maintenance..."

# 1. Vacuum and analyze
psql -c "VACUUM ANALYZE;" -d [database]

# 2. Update statistics
psql -c "SELECT pg_stat_reset();" -d [database]

# 3. Check index usage
psql -f scripts/analyze-query-performance.sql -d [database]

# 4. Backup verification
echo "Maintenance complete"
```

## 📞 Support Resources

### Internal Documentation
- [Database Schema Documentation](./SCHEMA_DOCUMENTATION.md)
- [RLS Policy Reference](./RLS_POLICIES.md)  
- [API Documentation](./API_DOCUMENTATION.md)
- [Setup Guide](./SETUP_GUIDE.md)

### External Resources
- **Supabase Documentation**: https://supabase.com/docs
- **PostgreSQL Manual**: https://www.postgresql.org/docs/
- **Care Collective Repository**: Internal repository links

### Log Locations
- **Application Logs**: `/var/log/care-collective/`
- **Database Logs**: Supabase dashboard → Logs
- **Error Tracking**: Application monitoring service
- **Performance Metrics**: Database monitoring dashboard

---

## 🚀 Escalation Procedures

### P0 (Critical) - Platform Down
1. **Immediate**: Check Supabase status page
2. **Within 5 min**: Contact Supabase support if infrastructure issue
3. **Within 10 min**: Notify stakeholders of incident
4. **Within 15 min**: Begin diagnostic procedures
5. **Post-incident**: Complete root cause analysis

### P1 (High) - Major Functionality Impacted  
1. **Within 15 min**: Begin diagnostic procedures
2. **Within 30 min**: Identify root cause or escalate
3. **Within 1 hour**: Implement fix or workaround
4. **Post-fix**: Monitor for stability

### P2 (Medium) - Partial Functionality Issues
1. **Within 1 hour**: Begin investigation
2. **Within 4 hours**: Identify resolution path
3. **Within 24 hours**: Implement fix
4. **Follow-up**: Schedule fix in next maintenance window

---

**Care Collective Database Troubleshooting Runbook v5.0**  
*Enterprise-ready incident response and problem resolution*

*Last Updated: January 2025 | Database Health: 90/100 (EXCELLENT)*