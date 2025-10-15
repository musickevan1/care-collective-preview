# Security Monitoring Guide

**Care Collective Platform**
**Last Updated:** October 13, 2025

## Overview

This guide covers monitoring the security improvements implemented for Care Collective, including rate limiting, session invalidation, and RLS policies.

---

## 🚨 Critical Alerts (Set These Up First)

### 1. Pending Session Invalidations

**Alert When:** A user has been rejected but their session hasn't been invalidated for > 5 minutes

**Why It Matters:** Security gap - rejected users still have access

**How to Check:**
```sql
-- Run in Supabase SQL Editor
SELECT
  user_id,
  new_status,
  changed_at,
  EXTRACT(MINUTE FROM (NOW() - changed_at)) as minutes_ago
FROM verification_status_changes
WHERE session_invalidated = false
  AND new_status = 'rejected'
  AND changed_at > NOW() - INTERVAL '1 hour';
```

**Expected Result:** 0 rows (no pending invalidations)

**Alert Setup:**
- **Frequency:** Every hour
- **Threshold:** > 0 pending invalidations
- **Action:** Investigate middleware logs, may need manual intervention

---

### 2. Rate Limit Hit Rate

**Alert When:** Login rate limiting is being hit frequently (> 10 hits/hour)

**Why It Matters:** Possible brute force attack or misconfiguration

**How to Check:**
- Monitor Vercel logs for HTTP 429 responses
- Check `/api/auth/login` endpoint logs

**Alert Setup:**
- **Frequency:** Every hour
- **Threshold:** > 10 rate limit hits
- **Action:** Review IP addresses, consider adjusting limits or blocking IPs

---

### 3. Tables Without RLS

**Alert When:** A critical table has RLS disabled

**Why It Matters:** Data exposure risk

**How to Check:**
```sql
-- Run weekly
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
  AND tablename IN (
    'profiles',
    'help_requests',
    'messages',
    'contact_exchanges',
    'verification_status_changes'
  );
```

**Expected Result:** 0 rows (all tables have RLS enabled)

**Alert Setup:**
- **Frequency:** Daily
- **Threshold:** Any table without RLS
- **Action:** Immediate fix - enable RLS

---

## 📊 Weekly Monitoring Tasks

### 1. Run Security Health Check

**Script:** `scripts/monitoring/security-check.sh`

```bash
# Set your database URL (get from Supabase dashboard)
export DATABASE_URL='postgresql://postgres:[PASSWORD]@db.kecureoyekeqhrxkmjuh.supabase.co:5432/postgres'

# Run the check
./scripts/monitoring/security-check.sh
```

**What to Look For:**
- ✅ 0 pending invalidations
- ✅ Recent status changes are reasonable (not mass rejections)
- ✅ All RLS policies are enabled
- ✅ All monitoring functions exist

---

### 2. Run RLS Performance Analysis

**Script:** `scripts/database/rls-performance-monitoring.sql`

```bash
psql $DATABASE_URL -f scripts/database/rls-performance-monitoring.sql
```

**What to Look For:**
- Query execution times < 100ms
- No unused indexes
- No slow queries in pg_stat_statements
- Index scans (not sequential scans) for common queries

**Red Flags:**
- 🚨 Queries consistently > 100ms
- 🚨 Sequential scans on large tables
- 🚨 High `calls` count with low `idx_scan` (unused indexes)

---

### 3. Review Verification Status Changes

**Query:**
```sql
-- Last 50 status changes
SELECT
  vsc.user_id,
  p.email,
  p.name,
  vsc.old_status,
  vsc.new_status,
  vsc.changed_at,
  vsc.session_invalidated,
  vsc.notes
FROM verification_status_changes vsc
LEFT JOIN profiles p ON p.id = vsc.user_id
ORDER BY vsc.changed_at DESC
LIMIT 50;
```

**What to Look For:**
- Are rejections justified?
- Are sessions being invalidated properly?
- Any unusual patterns (mass rejections, rapid status changes)?

---

## 📈 Monthly Analysis

### 1. Authentication Metrics

**Questions to Answer:**
- How many login attempts per day?
- What's the rate limit hit rate?
- Are there patterns in failed logins (time of day, IP ranges)?

**Vercel Analytics:**
- Go to: https://vercel.com/musickevan1s-projects/care-collective-preview/analytics
- Filter by `/api/auth/login` endpoint
- Review:
  - Total requests
  - 401 responses (failed logins)
  - 429 responses (rate limited)
  - Response times

---

### 2. Security Posture Review

**Checklist:**
- [ ] All critical tables have RLS enabled
- [ ] All monitoring functions are working
- [ ] No pending session invalidations
- [ ] Rate limiting is effective
- [ ] No unusual patterns in logs

**Documentation Review:**
- [ ] Team is following RLS patterns from docs
- [ ] New features include security considerations
- [ ] Test coverage is maintained

---

### 3. Performance Optimization

**Run Full Performance Report:**
```bash
psql $DATABASE_URL -f scripts/database/rls-performance-monitoring.sql > monthly-performance-report.txt
```

**Review:**
- Slowest queries
- Missing indexes
- RLS policy overhead
- Table sizes and growth

---

## 🔧 Monitoring Tools

### Option 1: Supabase Dashboard (Built-in)

**Pros:** Free, built-in, easy to use
**Cons:** Limited alerting

**Setup:**
1. Go to: https://supabase.com/dashboard/project/kecureoyekeqhrxkmjuh
2. Navigate to: **Database** → **Logs**
3. Set up log filters for security events

---

### Option 2: External Monitoring (Recommended for Production)

**Options:**
- **Better Stack** (formerly Logtail) - Good for logs
- **DataDog** - Comprehensive monitoring
- **Sentry** - Error tracking
- **Grafana** - Custom dashboards

**Setup:**
1. Choose a monitoring service
2. Configure Vercel log drains
3. Set up PostgreSQL monitoring
4. Create custom dashboards for security metrics

---

### Option 3: Custom Cron Jobs

**Setup:**
```bash
# Add to your server's crontab:

# Hourly: Check pending invalidations
0 * * * * /path/to/scripts/monitoring/security-check.sh | grep "Pending Session" | grep -v "0" && notify-admin "Pending session invalidations detected"

# Daily: Security health check
0 9 * * * /path/to/scripts/monitoring/security-check.sh | mail -s "Daily Security Report" admin@example.com

# Weekly: Full RLS performance report
0 0 * * 0 psql $DATABASE_URL -f /path/to/scripts/database/rls-performance-monitoring.sql > /var/log/weekly-rls-report.txt
```

---

## 🎯 Key Metrics Dashboard

### Security Health Scorecard

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Pending Invalidations | 0 | ? | ⏳ Check |
| Tables with RLS | 5/5 | ? | ⏳ Check |
| Monitoring Functions | 3/3 | ? | ⏳ Check |
| Avg Query Time | < 50ms | ? | ⏳ Check |
| Rate Limit Hit Rate | < 5/hour | ? | ⏳ Check |

**Update this weekly** by running the security health check.

---

## 🚨 Incident Response

### If You Detect Issues:

**1. Pending Session Invalidation:**
```sql
-- Manually invalidate sessions
SELECT mark_session_invalidated('[USER_ID]'::uuid);

-- Check middleware logs for errors
```

**2. High Rate Limit Hits:**
```sql
-- Review IPs hitting rate limit (check Vercel logs)
-- Consider blocking repeat offenders at CDN level
```

**3. Slow RLS Queries:**
```sql
-- Check for missing indexes
EXPLAIN ANALYZE [slow query];

-- Add indexes as needed
CREATE INDEX idx_[table]_[column] ON [table]([column]);
```

**4. RLS Disabled:**
```sql
-- Re-enable immediately
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

-- Investigate why it was disabled
```

---

## 📚 Additional Resources

- **RLS Best Practices:** `docs/security/RLS_PATTERNS_AND_BEST_PRACTICES.md`
- **Implementation Summary:** `docs/security/SECURITY_IMPROVEMENTS_SUMMARY.md`
- **Performance Monitoring:** `scripts/database/rls-performance-monitoring.sql`
- **Security Health Check:** `scripts/monitoring/security-check.sh`

---

## 📞 Quick Reference Commands

```bash
# Security health check
./scripts/monitoring/security-check.sh

# Full RLS performance analysis
psql $DATABASE_URL -f scripts/database/rls-performance-monitoring.sql

# Check pending invalidations
psql $DATABASE_URL -c "SELECT COUNT(*) FROM verification_status_changes WHERE session_invalidated = false AND new_status = 'rejected';"

# View recent status changes
psql $DATABASE_URL -c "SELECT * FROM verification_status_changes ORDER BY changed_at DESC LIMIT 10;"

# Test rate limiting
./test-rate-limiting.sh
```

---

## ✅ Monitoring Setup Checklist

- [ ] Database URL configured
- [ ] Security health check script tested
- [ ] Weekly performance monitoring scheduled
- [ ] Critical alerts configured (pending invalidations)
- [ ] Rate limit monitoring enabled
- [ ] Team trained on monitoring procedures
- [ ] Incident response procedures documented
- [ ] Monthly review meetings scheduled

---

**Remember:** Security monitoring is an ongoing process. Set up automated checks and review regularly to maintain your security posture!
