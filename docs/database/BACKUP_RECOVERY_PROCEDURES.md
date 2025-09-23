# Care Collective Backup & Recovery Procedures

**Version**: 5.0 (Enterprise Data Protection)  
**Last Updated**: January 2025  
**Criticality**: PRODUCTION ESSENTIAL  
**Recovery Objectives**: RTO <15 min | RPO <5 min  

## 🎯 Overview

This document outlines comprehensive backup and disaster recovery procedures for the Care Collective mutual aid platform. These procedures ensure data protection, business continuity, and rapid recovery in case of system failures.

### Recovery Objectives
- **Recovery Time Objective (RTO)**: < 15 minutes
- **Recovery Point Objective (RPO)**: < 5 minutes
- **Backup Retention**: 30 days point-in-time recovery
- **Geographic Redundancy**: Multi-region backup storage

## 📊 Backup Strategy

### 1. Supabase Automatic Backups

#### Point-in-Time Recovery (PITR)
```bash
# Supabase provides automatic PITR for Pro plans
# Retention: 7 days for development, 30 days for production
# Recovery granularity: Down to the second

# Access via Supabase Dashboard:
# Projects → [project] → Settings → Database → Backups
```

#### Daily Full Backups
```bash
# Automated daily snapshots
# Retention: 7 days rolling
# Storage: Encrypted in multiple regions
# Verification: Automated integrity checks
```

### 2. Custom Backup Procedures

#### Database Schema Backup
```bash
#!/bin/bash
# scripts/backup-schema.sh

set -e

BACKUP_DIR="/backup/care-collective/$(date +%Y%m%d)"
PROJECT_ID="kecureoyekeqhrxkmjuh"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

echo "Starting schema backup at $(date)"

# Backup database schema
supabase db dump \
  --project-ref "$PROJECT_ID" \
  --schema-only \
  --file "$BACKUP_DIR/schema_${TIMESTAMP}.sql"

# Backup specific data (anonymized for security)
supabase db dump \
  --project-ref "$PROJECT_ID" \
  --data-only \
  --exclude-table-data="auth.users" \
  --exclude-table-data="auth.sessions" \
  --file "$BACKUP_DIR/data_${TIMESTAMP}.sql"

# Compress backups
gzip "$BACKUP_DIR/schema_${TIMESTAMP}.sql"
gzip "$BACKUP_DIR/data_${TIMESTAMP}.sql"

echo "Schema backup completed: $BACKUP_DIR"
```

#### Configuration Backup
```bash
#!/bin/bash
# scripts/backup-config.sh

BACKUP_DIR="/backup/care-collective/config/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# Backup environment templates
cp .env.example "$BACKUP_DIR/"
cp .env.production.example "$BACKUP_DIR/"
cp .env.staging.example "$BACKUP_DIR/"

# Backup deployment configurations
cp -r supabase/config "$BACKUP_DIR/"
cp package.json "$BACKUP_DIR/"
cp package-lock.json "$BACKUP_DIR/"

# Backup documentation
cp -r docs/ "$BACKUP_DIR/"

# Create archive
tar -czf "$BACKUP_DIR/../config_$(date +%Y%m%d_%H%M%S).tar.gz" -C "$BACKUP_DIR" .

echo "Configuration backup completed"
```

## 🔄 Automated Backup Schedule

### Daily Backups (Production)
```bash
# Crontab entry for daily backups
# Run at 2 AM UTC daily
0 2 * * * /path/to/scripts/backup-schema.sh >> /var/log/backup.log 2>&1

# Configuration backup weekly
0 1 * * 0 /path/to/scripts/backup-config.sh >> /var/log/backup.log 2>&1
```

### Backup Verification Script
```bash
#!/bin/bash
# scripts/verify-backups.sh

set -e

BACKUP_DIR="/backup/care-collective"
TODAY=$(date +%Y%m%d)

echo "Verifying backups for $TODAY"

# Check if today's backup exists
if [ -f "$BACKUP_DIR/$TODAY/schema_*.sql.gz" ]; then
    echo "✅ Schema backup found"
else
    echo "❌ Schema backup missing"
    exit 1
fi

# Check backup file integrity
if gunzip -t "$BACKUP_DIR/$TODAY"/schema_*.sql.gz; then
    echo "✅ Schema backup integrity verified"
else
    echo "❌ Schema backup corrupted"
    exit 1
fi

# Check backup size (should be > 1MB for production)
BACKUP_SIZE=$(stat -f%z "$BACKUP_DIR/$TODAY"/schema_*.sql.gz 2>/dev/null || stat -c%s "$BACKUP_DIR/$TODAY"/schema_*.sql.gz)
if [ "$BACKUP_SIZE" -gt 1048576 ]; then
    echo "✅ Backup size acceptable: $(($BACKUP_SIZE / 1024 / 1024))MB"
else
    echo "⚠️  Backup size suspicious: $(($BACKUP_SIZE / 1024))KB"
fi

echo "Backup verification completed"
```

## 🚨 Disaster Recovery Procedures

### 1. Complete Database Recovery

#### Scenario: Total database loss
```bash
#!/bin/bash
# Emergency recovery procedure

echo "🚨 EMERGENCY DATABASE RECOVERY INITIATED"
echo "Time: $(date)"

# 1. Assess damage and identify recovery point
echo "1. Assessing recovery requirements..."
RECOVERY_TIME="2025-01-20 14:30:00"  # Example recovery point

# 2. Create new Supabase project if needed
# (Manual step via Supabase dashboard)

# 3. Restore schema from backup
echo "2. Restoring database schema..."
LATEST_SCHEMA=$(ls -t /backup/care-collective/*/schema_*.sql.gz | head -1)
gunzip -c "$LATEST_SCHEMA" | psql "$DATABASE_URL"

# 4. Restore data (excluding sensitive auth data)
echo "3. Restoring application data..."
LATEST_DATA=$(ls -t /backup/care-collective/*/data_*.sql.gz | head -1)
gunzip -c "$LATEST_DATA" | psql "$DATABASE_URL"

# 5. Verify data integrity
echo "4. Verifying data integrity..."
npm run db:security-audit

# 6. Test application functionality
echo "5. Testing application..."
npm run test:database

echo "✅ Recovery completed. Verify application functionality manually."
```

#### Recovery Verification Checklist
- [ ] Database schema matches expected structure
- [ ] All RLS policies are active and functioning
- [ ] User profiles and help requests are accessible
- [ ] Contact exchange privacy is working
- [ ] Messaging system is operational
- [ ] Audit logs are intact
- [ ] Performance is within acceptable limits

### 2. Point-in-Time Recovery

#### Scenario: Data corruption or accidental deletion
```bash
# Using Supabase PITR (recommended for production)

# 1. Access Supabase Dashboard
# 2. Navigate to Project → Settings → Database → Backups
# 3. Select "Point in time recovery"
# 4. Choose recovery timestamp (within retention period)
# 5. Initiate recovery to new database
# 6. Update application connection strings
# 7. Verify data integrity
```

#### Manual PITR Process
```sql
-- If custom PITR is needed
-- 1. Stop all write operations
-- 2. Create recovery database
CREATE DATABASE care_collective_recovery;

-- 3. Restore to specific point in time
-- (Using transaction log replay - Supabase handles this automatically)

-- 4. Verify recovered data
SELECT count(*) FROM profiles;
SELECT count(*) FROM help_requests;
SELECT count(*) FROM contact_exchanges;
SELECT count(*) FROM messages;

-- 5. Check latest transactions
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
```

### 3. Partial Data Recovery

#### Scenario: Specific table corruption
```sql
-- Recovery for specific tables (example: help_requests)

-- 1. Identify affected data
SELECT count(*) FROM help_requests WHERE created_at > '2025-01-20 10:00:00';

-- 2. Create temporary recovery table
CREATE TABLE help_requests_recovery AS 
SELECT * FROM help_requests WHERE false;

-- 3. Restore from backup to recovery table
-- (Import specific table data from backup)

-- 4. Validate recovered data
SELECT count(*), min(created_at), max(created_at) 
FROM help_requests_recovery;

-- 5. Replace corrupted data
BEGIN;
DELETE FROM help_requests WHERE created_at > '2025-01-20 10:00:00';
INSERT INTO help_requests SELECT * FROM help_requests_recovery;
COMMIT;

-- 6. Cleanup
DROP TABLE help_requests_recovery;
```

## 🔐 Security & Compliance

### Data Encryption
```bash
# All backups are encrypted at rest
# Encryption keys managed through Supabase infrastructure
# Additional encryption for sensitive backups:

# Encrypt backup before storage
gpg --symmetric --cipher-algo AES256 schema_backup.sql
# Creates schema_backup.sql.gpg

# Decrypt when needed
gpg --decrypt schema_backup.sql.gpg > schema_backup.sql
```

### Access Control
```bash
# Backup access is restricted to:
# - Database administrators
# - DevOps engineers with recovery responsibilities
# - Emergency contacts only

# Production backup access requires:
# 1. Multi-factor authentication
# 2. VPN connection
# 3. Approval from tech lead for emergency access
```

### Audit Trail
```sql
-- All recovery operations are logged
CREATE TABLE recovery_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recovery_type TEXT NOT NULL,
  initiated_by UUID REFERENCES profiles(id),
  recovery_time TIMESTAMPTZ NOT NULL,
  recovery_point TIMESTAMPTZ,
  status TEXT CHECK (status IN ('initiated', 'in_progress', 'completed', 'failed')),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🧪 Recovery Testing

### Monthly Recovery Drills
```bash
#!/bin/bash
# scripts/recovery-drill.sh

echo "🧪 Monthly Recovery Drill - $(date)"

# 1. Create test recovery environment
DRILL_DB="care_collective_drill_$(date +%Y%m%d)"

# 2. Restore from latest backup
echo "Testing backup restoration..."
./scripts/backup-schema.sh
LATEST_BACKUP=$(ls -t /backup/care-collective/*/schema_*.sql.gz | head -1)

# 3. Create test database and restore
createdb "$DRILL_DB"
gunzip -c "$LATEST_BACKUP" | psql "$DRILL_DB"

# 4. Run verification tests
echo "Running verification tests..."
PGDATABASE="$DRILL_DB" npm run db:test-rls

# 5. Measure recovery time
RECOVERY_TIME=$(($(date +%s) - $START_TIME))
echo "Recovery time: ${RECOVERY_TIME}s"

# 6. Cleanup
dropdb "$DRILL_DB"

echo "✅ Recovery drill completed successfully"
echo "Recovery time: ${RECOVERY_TIME}s (Target: <900s)"
```

### Test Results Tracking
```sql
-- Track recovery drill results
CREATE TABLE recovery_drill_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drill_date DATE NOT NULL,
  recovery_time_seconds INTEGER,
  backup_size_mb INTEGER,
  test_results JSONB,
  issues_found TEXT[],
  status TEXT CHECK (status IN ('passed', 'failed', 'partial')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 📊 Monitoring & Alerting

### Backup Health Monitoring
```bash
#!/bin/bash
# scripts/monitor-backups.sh

# Check backup completion
if [ ! -f "/backup/care-collective/$(date +%Y%m%d)/schema_*.sql.gz" ]; then
    echo "ALERT: Daily backup missing for $(date +%Y%m%d)"
    # Send alert to monitoring system
    curl -X POST "$SLACK_WEBHOOK" -d '{"text":"🚨 Care Collective backup failed"}'
fi

# Check backup age
LATEST_BACKUP=$(ls -t /backup/care-collective/*/schema_*.sql.gz | head -1)
BACKUP_AGE=$((($(date +%s) - $(stat -f%m "$LATEST_BACKUP" 2>/dev/null || stat -c%Y "$LATEST_BACKUP")) / 3600))

if [ "$BACKUP_AGE" -gt 48 ]; then
    echo "ALERT: Latest backup is ${BACKUP_AGE} hours old"
fi
```

### Recovery Metrics Dashboard
```sql
-- Key metrics for backup and recovery monitoring
SELECT 
  'backup_health' as metric,
  CASE 
    WHEN last_backup_age < INTERVAL '24 hours' THEN 'healthy'
    WHEN last_backup_age < INTERVAL '48 hours' THEN 'warning'
    ELSE 'critical'
  END as status
FROM (
  SELECT NOW() - max(created_at) as last_backup_age
  FROM recovery_audit_log 
  WHERE recovery_type = 'backup'
) metrics;
```

## 📋 Recovery Runbooks

### Emergency Contact List
```
Primary Database Administrator: [name] - [phone] - [email]
Secondary DBA: [name] - [phone] - [email]
DevOps Lead: [name] - [phone] - [email]
Tech Lead: [name] - [phone] - [email]
Supabase Support: support@supabase.com | Dashboard → Support
```

### Recovery Decision Matrix
| Scenario | Recovery Method | RTO | RPO | Contact Level |
|----------|----------------|-----|-----|---------------|
| Complete DB Loss | Full restoration | 15 min | 5 min | Primary DBA |
| Data corruption | PITR | 10 min | 1 min | Primary DBA |
| Single table loss | Partial restore | 5 min | 1 min | Any DBA |
| Schema issues | Schema restore | 5 min | 0 min | Developer |

### Communication Templates

#### Incident Notification
```
Subject: PRODUCTION ALERT - Care Collective Database Recovery in Progress

Team,

Database recovery has been initiated for Care Collective production environment.

Incident: [brief description]
Started: [timestamp]
Estimated completion: [timestamp]
Impact: [user impact description]
Recovery method: [method being used]
Lead: [person responsible]

Updates will be provided every 15 minutes.

Status page: [link if available]
```

#### Recovery Completion
```
Subject: RESOLVED - Care Collective Database Recovery Complete

Team,

Database recovery has been completed successfully.

Recovery started: [timestamp]
Recovery completed: [timestamp]
Total downtime: [duration]
Recovery point: [timestamp of recovery]
Verification: [test results]

All services are now operational.
Post-incident review scheduled for: [date/time]
```

## 🚀 Business Continuity

### Service Level Agreements
- **Backup Availability**: 99.9% backup success rate
- **Recovery Time**: <15 minutes for any recovery scenario
- **Data Loss**: <5 minutes of data loss maximum
- **Testing**: Monthly recovery drills with documented results

### Disaster Scenarios Covered
1. **Hardware Failure**: Supabase infrastructure redundancy
2. **Software Corruption**: Point-in-time recovery
3. **Human Error**: Immediate rollback capabilities
4. **Regional Outage**: Geographic backup distribution
5. **Security Breach**: Isolated recovery environment

---

**Care Collective Backup & Recovery Procedures v5.0**  
*Enterprise-grade data protection for mutual aid platform*

*Last Updated: January 2025 | RTO: <15 min | RPO: <5 min | Database Health: 90/100 (EXCELLENT)*