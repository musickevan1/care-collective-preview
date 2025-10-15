#!/bin/bash

# Security Monitoring Script for Care Collective
# Run this weekly to check security health

echo "=========================================="
echo "Care Collective Security Health Check"
echo "Date: $(date)"
echo "=========================================="
echo ""

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install it first:"
    echo "   https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "📋 Running security checks..."
echo ""

# Create a temporary SQL file
cat > /tmp/security-check.sql << 'EOF'
-- 1. Check for pending session invalidations
SELECT
  '🔍 Pending Session Invalidations' as check_name,
  COUNT(*) as count
FROM verification_status_changes
WHERE session_invalidated = false
  AND new_status = 'rejected'
  AND changed_at > NOW() - INTERVAL '1 hour';

-- 2. Recent verification status changes
SELECT
  '📝 Status Changes (Last 24h)' as check_name,
  COUNT(*) as count
FROM verification_status_changes
WHERE changed_at > NOW() - INTERVAL '24 hours';

-- 3. Check RLS is enabled on critical tables
SELECT
  '🔒 Tables with RLS Enabled' as check_name,
  COUNT(*) as count
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'help_requests', 'messages', 'verification_status_changes')
  AND rowsecurity = true;

-- 4. Count of rejected users attempting access (from logs)
SELECT
  '⛔ Rejected User Access Attempts' as check_name,
  COUNT(*) as count
FROM verification_status_changes
WHERE new_status = 'rejected'
  AND changed_at > NOW() - INTERVAL '7 days';

-- 5. Verify monitoring functions exist
SELECT
  '⚙️  Monitoring Functions Present' as check_name,
  COUNT(*) as count
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'has_pending_session_invalidation',
    'mark_session_invalidated',
    'log_verification_status_change'
  );

EOF

echo "Connecting to production database..."
echo ""

# Run the checks
psql "$DATABASE_URL" -f /tmp/security-check.sql 2>&1 || {
    echo ""
    echo "❌ Could not connect to database."
    echo ""
    echo "To use this script, set your DATABASE_URL environment variable:"
    echo "  export DATABASE_URL='postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres'"
    echo ""
    echo "Or run the checks manually in Supabase SQL Editor:"
    echo "  https://supabase.com/dashboard/project/kecureoyekeqhrxkmjuh"
    echo ""
    rm /tmp/security-check.sql
    exit 1
}

# Cleanup
rm /tmp/security-check.sql

echo ""
echo "=========================================="
echo "✅ Security health check complete!"
echo "=========================================="
echo ""
echo "📊 Key Metrics to Monitor:"
echo "  - Pending invalidations should be 0"
echo "  - All 4 critical tables should have RLS"
echo "  - All 3 monitoring functions should exist"
echo ""
echo "📖 For detailed monitoring, run:"
echo "  psql \$DATABASE_URL -f scripts/database/rls-performance-monitoring.sql"
echo ""
