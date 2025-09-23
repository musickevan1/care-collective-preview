# Care Collective Supabase Setup Guide

**Version**: 2.0  
**Updated**: January 2025  
**Target Audience**: Developers, DevOps, Project Maintainers  

## 🎯 Overview

This comprehensive guide covers proper Supabase setup for the Care Collective mutual aid platform, including CLI/MCP configuration, environment management, and best practices for database operations.

---

## 🛠️ Prerequisites & Installation

### System Requirements
- **Node.js**: >= 18.0.0
- **npm/yarn**: Latest version
- **Docker**: For local Supabase development
- **Git**: For version control

### Install Supabase CLI
```bash
# Using npm (recommended for Care Collective)
npm install -g @supabase/cli@latest

# Verify installation
supabase --version
# Expected: supabase version 1.XX.X

# Login to Supabase (required for project management)
supabase login
```

### Alternative: MCP Integration Setup
If using Model Context Protocol (MCP) for AI-assisted database management:

```json
// Add to your MCP configuration
{
  "mcpServers": {
    "supabase": {
      "command": "supabase",
      "args": ["--help"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "your_access_token_here"
      }
    }
  }
}
```

---

## 🏗️ Environment Configuration

### Development Environment Setup

#### 1. Initialize Supabase in Project
```bash
# Navigate to Care Collective project root
cd /path/to/care-collective-preview

# Initialize Supabase (if not already done)
supabase init

# Link to existing project (Care Collective specific)
supabase link --project-ref kecureoyekeqhrxkmjuh
```

#### 2. Environment Variables Configuration

**File**: `.env.local` (Development)
```env
# === SUPABASE CONFIGURATION ===
# Project: Care Collective Preview
NEXT_PUBLIC_SUPABASE_URL=https://kecureoyekeqhrxkmjuh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# === APPLICATION CONFIGURATION ===
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development

# === AUTHENTICATION CONFIGURATION ===
NEXT_PUBLIC_SUPABASE_AUTH_FLOW_TYPE=pkce
SUPABASE_AUTH_EXTERNAL_COOKIE_DOMAIN=localhost

# === ADMIN CONFIGURATION ===
NEXT_PUBLIC_PREVIEW_ADMIN=1
NEXT_PUBLIC_ADMIN_ALLOWLIST=admin@care-collective.org,dev@care-collective.org

# === FEATURE FLAGS ===
NEXT_PUBLIC_FEATURE_REALTIME=true
NEXT_PUBLIC_FEATURE_MESSAGING=true
NEXT_PUBLIC_FEATURE_ADVANCED_PROFILES=false
NEXT_PUBLIC_FEATURE_SMART_MATCHING=false
NEXT_PUBLIC_FEATURE_GROUPS=false
NEXT_PUBLIC_FEATURE_EVENTS=false
NEXT_PUBLIC_FEATURE_PWA=false

# === EXTERNAL SERVICES ===
RESEND_API_KEY=re_your_api_key_here

# === DEBUGGING (Development Only) ===
NEXT_PUBLIC_DEBUG_MODE=true
SUPABASE_DEBUG=true
```

**File**: `.env.production` (Production)
```env
# === SUPABASE CONFIGURATION ===
NEXT_PUBLIC_SUPABASE_URL=https://kecureoyekeqhrxkmjuh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# === APPLICATION CONFIGURATION ===
NEXT_PUBLIC_SITE_URL=https://care-collective-preview.vercel.app
NODE_ENV=production

# === AUTHENTICATION CONFIGURATION ===
NEXT_PUBLIC_SUPABASE_AUTH_FLOW_TYPE=pkce
SUPABASE_AUTH_EXTERNAL_COOKIE_DOMAIN=care-collective-preview.vercel.app

# === ADMIN CONFIGURATION ===
NEXT_PUBLIC_PREVIEW_ADMIN=0  # Disable admin features in production
NEXT_PUBLIC_ADMIN_ALLOWLIST=admin@care-collective.org

# === FEATURE FLAGS ===
NEXT_PUBLIC_FEATURE_REALTIME=true
NEXT_PUBLIC_FEATURE_MESSAGING=true
NEXT_PUBLIC_FEATURE_ADVANCED_PROFILES=false
NEXT_PUBLIC_FEATURE_SMART_MATCHING=false
NEXT_PUBLIC_FEATURE_GROUPS=false
NEXT_PUBLIC_FEATURE_EVENTS=false
NEXT_PUBLIC_FEATURE_PWA=true

# === EXTERNAL SERVICES ===
RESEND_API_KEY=re_your_production_api_key_here

# === SECURITY ===
SUPABASE_DEBUG=false
NEXT_PUBLIC_DEBUG_MODE=false
```

#### 3. Supabase Configuration File
**File**: `supabase/config.toml`
```toml
# Care Collective Supabase Configuration

project_id = "kecureoyekeqhrxkmjuh"

[api]
enabled = true
port = 54321
schemas = ["public", "storage", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 54322
major_version = 15

[studio]
enabled = true
port = 54323

[inbucket]
enabled = true
port = 54324
smtp_port = 54325
pop3_port = 54326

[storage]
enabled = true
port = 54327
image_transformation = true
file_size_limit = "50MiB"

[auth]
enabled = true
port = 54328
site_url = "http://localhost:3000"
additional_redirect_urls = ["https://care-collective-preview.vercel.app"]
jwt_expiry = 3600
refresh_token_rotation_enabled = true
security_refresh_token_reuse_interval = 10
security_captcha_enabled = false

[auth.email]
enable_signup = false  # Care Collective uses waitlist/approval system
double_confirm_changes = true
enable_confirmations = true

[auth.sms]
enable_signup = false
enable_confirmations = false

[auth.external.apple]
enabled = false

[auth.external.azure]
enabled = false

[auth.external.bitbucket]
enabled = false

[auth.external.discord]
enabled = false

[auth.external.facebook]
enabled = false

[auth.external.github]
enabled = false

[auth.external.gitlab]
enabled = false

[auth.external.google]
enabled = false

[auth.external.keycloak]
enabled = false

[auth.external.linkedin]
enabled = false

[auth.external.notion]
enabled = false

[auth.external.twitch]
enabled = false

[auth.external.twitter]
enabled = false

[auth.external.slack]
enabled = false

[auth.external.spotify]
enabled = false

[auth.external.workos]
enabled = false

[auth.external.zoom]
enabled = false

[analytics]
enabled = false
```

---

## 🔧 CLI Commands & Workflows

### Essential Daily Commands

#### Database Operations
```bash
# Start local development environment
supabase start

# Stop local development environment  
supabase stop

# Reset local database (⚠️ Destroys data)
supabase db reset

# Create new migration
supabase migration new your_migration_name

# Apply migrations locally
supabase db reset  # Applies all migrations from scratch

# Generate TypeScript types (run after schema changes)
supabase gen types typescript --project-id kecureoyekeqhrxkmjuh > lib/database.types.ts
```

#### Migration Management
```bash
# Check migration status
supabase migration list

# Create migration from database changes
supabase db diff --schema public --file new_migration_name

# Repair migration history (if needed)
supabase migration repair --status reverted 20240101000000

# Apply specific migration
supabase migration up --to 20240101000000
```

#### Production Operations
```bash
# Deploy migrations to production (⚠️ Use with caution)
supabase db push --project-ref kecureoyekeqhrxkmjuh

# Create production backup before major changes
pg_dump "postgresql://postgres:[PASSWORD]@db.kecureoyekeqhrxkmjuh.supabase.co:5432/postgres" > backup_$(date +%Y%m%d).sql

# Monitor production logs
supabase logs --project-ref kecureoyekeqhrxkmjuh --level error

# Check production health
supabase inspect db --project-ref kecureoyekeqhrxkmjuh
```

---

## 🚀 Development Workflow

### 1. Setting Up Local Development

```bash
# Clone the Care Collective repository
git clone https://github.com/your-org/care-collective-preview.git
cd care-collective-preview

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Start local Supabase
supabase start

# Verify connection
supabase status
```

Expected output:
```
API URL: http://localhost:54321
GraphQL URL: http://localhost:54321/graphql/v1
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
Inbucket URL: http://localhost:54324
JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Making Schema Changes

```bash
# 1. Make changes via Supabase Studio (http://localhost:54323)
# OR modify migration files directly

# 2. Generate migration from changes
supabase db diff --schema public --file add_your_feature

# 3. Review generated migration
cat supabase/migrations/20250109_add_your_feature.sql

# 4. Test migration locally
supabase db reset

# 5. Update TypeScript types
npm run db:types
```

### 3. Testing Migrations

```bash
# Test with fresh database
supabase db reset

# Test with production schema dump (if available)
psql "postgresql://postgres:postgres@localhost:54322/postgres" < production_backup.sql
supabase migration up

# Verify RLS policies are working
npm run test:rls-policies  # Custom test script
```

---

## 🔒 Security Best Practices

### Row Level Security (RLS) Validation

#### Automated RLS Testing
**File**: `scripts/test-rls-policies.js`
```javascript
#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

async function testRLSPolicies() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  console.log('🔒 Testing RLS Policies...')

  // Test 1: Unauthenticated access should be denied
  const { data: publicData, error: publicError } = await supabase
    .from('profiles')
    .select('*')

  if (publicData && publicData.length > 0) {
    console.error('❌ SECURITY ISSUE: Unauthenticated users can access profiles')
    process.exit(1)
  } else {
    console.log('✅ Unauthenticated access properly denied')
  }

  // Test 2: Contact exchanges should be completely inaccessible to anonymous users
  const { data: contactData, error: contactError } = await supabase
    .from('contact_exchanges')
    .select('*')

  if (contactData && contactData.length > 0) {
    console.error('❌ SECURITY ISSUE: Contact exchanges accessible to anonymous users')
    process.exit(1)
  } else {
    console.log('✅ Contact exchanges properly protected')
  }

  console.log('🔒 All RLS tests passed!')
}

testRLSPolicies().catch(console.error)
```

#### Manual Security Checklist
```bash
# Add to package.json scripts:
{
  "scripts": {
    "db:test-rls": "node scripts/test-rls-policies.js",
    "db:security-audit": "supabase inspect db --schema=public --project-ref=kecureoyekeqhrxkmjuh"
  }
}
```

### Environment Security

#### Production Secrets Management
```bash
# Never commit these to version control:
.env.local
.env.production
supabase/.env

# Use Vercel environment variables for production:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY  
vercel env add SUPABASE_SERVICE_ROLE
```

#### Database Access Control
```sql
-- Verify permissions are not overpermissive
SELECT 
  schemaname, 
  tablename, 
  grantor, 
  grantee, 
  privilege_type 
FROM information_schema.table_privileges 
WHERE grantee IN ('anon', 'authenticated') 
AND schemaname = 'public';

-- Should show limited permissions, not ALL privileges
```

---

## 📊 Performance Optimization

### Query Performance Monitoring

#### Setup Performance Monitoring
```bash
# Install pg_stat_statements extension (if not already enabled)
# This is typically enabled by default in Supabase

# Monitor slow queries locally
supabase logs --level=info | grep -i "slow"

# Production monitoring
supabase logs --project-ref kecureoyekeqhrxkmjuh --level=info | grep -i "slow"
```

#### Index Optimization Script
**File**: `scripts/analyze-query-performance.sql`
```sql
-- Care Collective Query Performance Analysis

-- 1. Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  seq_scan as table_scans,
  n_tup_upd + n_tup_ins + n_tup_del as write_activity
FROM pg_stat_user_indexes 
JOIN pg_stat_user_tables USING (schemaname, tablename)
WHERE schemaname = 'public'
ORDER BY seq_scan DESC;

-- 2. Find missing indexes for Care Collective queries
EXPLAIN ANALYZE SELECT * FROM help_requests WHERE status = 'open' ORDER BY created_at DESC LIMIT 20;
EXPLAIN ANALYZE SELECT * FROM messages WHERE recipient_id = 'user-uuid' AND read = false;
EXPLAIN ANALYZE SELECT * FROM contact_exchanges WHERE request_id = 'request-uuid';

-- 3. Table sizes and statistics
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count,
  n_dead_tup as dead_rows,
  last_vacuum,
  last_analyze
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
```

### Database Maintenance

#### Automated Maintenance Script
**File**: `scripts/db-maintenance.sh`
```bash
#!/bin/bash

# Care Collective Database Maintenance Script
# Run weekly in production, daily in development

echo "🔧 Starting database maintenance..."

# 1. Update table statistics
echo "📊 Updating table statistics..."
supabase db remote commit --schema=public --project-ref=kecureoyekeqhrxkmjuh --message="Weekly maintenance: Update statistics"

# 2. Check for unused indexes
echo "🔍 Checking for unused indexes..."
psql "$DATABASE_URL" -c "
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes 
WHERE idx_scan = 0 
AND schemaname = 'public';"

# 3. Generate fresh TypeScript types
echo "🔧 Updating TypeScript types..."
supabase gen types typescript --project-id kecureoyekeqhrxkmjuh > lib/database.types.ts

# 4. Run RLS policy tests
echo "🔒 Testing RLS policies..."
npm run db:test-rls

echo "✅ Database maintenance completed!"
```

---

## 🧪 Testing & Validation

### Pre-Deployment Testing

#### Migration Testing Workflow
```bash
# 1. Test migration on production data copy
pg_dump "postgresql://postgres:[PASSWORD]@db.kecureoyekeqhrxkmjuh.supabase.co:5432/postgres" > test_data.sql
supabase db reset
psql "postgresql://postgres:postgres@localhost:54322/postgres" < test_data.sql

# 2. Apply new migrations
supabase migration up

# 3. Verify data integrity
npm run test:data-integrity

# 4. Performance test
npm run test:performance

# 5. RLS validation
npm run db:test-rls
```

#### Integration Testing
**File**: `tests/database-integration.test.js`
```javascript
const { createClient } = require('@supabase/supabase-js')

describe('Database Integration Tests', () => {
  let supabase

  beforeAll(() => {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  })

  test('User registration flow', async () => {
    // Test complete user registration and profile creation
    const { data, error } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'testpassword123',
      options: {
        data: {
          name: 'Test User',
          location: 'Test City',
          application_reason: 'Testing purposes'
        }
      }
    })

    expect(error).toBeNull()
    expect(data.user).toBeDefined()

    // Verify profile was created
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    expect(profileError).toBeNull()
    expect(profile.verification_status).toBe('pending')
  })

  test('Help request creation and RLS', async () => {
    // Test help request creation and proper access control
    // ... test implementation
  })

  test('Contact exchange privacy', async () => {
    // Test contact exchange RLS policies
    // ... test implementation
  })
})
```

---

## 📚 Troubleshooting Guide

### Common Issues & Solutions

#### Issue 1: "Connection refused" when starting Supabase
```bash
# Check Docker is running
docker ps

# Check for port conflicts
lsof -i :54321
lsof -i :54322
lsof -i :54323

# Reset Supabase completely
supabase stop
supabase start --ignore-health-check
```

#### Issue 2: Migration conflicts
```bash
# Check migration status
supabase migration list

# Fix migration history
supabase migration repair --status reverted [TIMESTAMP]

# Force reset if needed (⚠️ destroys local data)
supabase db reset --linked
```

#### Issue 3: TypeScript type errors after schema changes
```bash
# Regenerate types
supabase gen types typescript --project-id kecureoyekeqhrxkmjuh > lib/database.types.ts

# If still errors, check for:
# - Missing tables in generated types
# - Changed column names
# - New required fields
```

#### Issue 4: RLS policy errors
```bash
# Test RLS policies
npm run db:test-rls

# Check policy syntax in migration files
# Verify user permissions in Supabase Studio
# Review audit logs for policy violations
```

#### Issue 5: Performance issues
```bash
# Check for missing indexes
psql "$DATABASE_URL" -c "SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;"

# Analyze slow queries
supabase logs --level=info | grep -i "slow"

# Review query execution plans
EXPLAIN ANALYZE SELECT * FROM your_slow_query;
```

---

## 📋 Maintenance Schedules

### Daily (Automated)
- [ ] Run RLS policy tests
- [ ] Check error logs
- [ ] Monitor query performance
- [ ] Verify backup status

### Weekly (Manual)
- [ ] Update TypeScript types
- [ ] Review and apply pending migrations
- [ ] Performance analysis
- [ ] Security audit
- [ ] Clean up test data

### Monthly (Planned)
- [ ] Full database backup verification
- [ ] Index optimization review
- [ ] Migration history cleanup
- [ ] Access permission audit
- [ ] Documentation updates

---

## 🎯 Success Metrics

### Development Productivity
- Migration creation time: < 5 minutes
- Local development setup: < 10 minutes  
- Type generation: < 30 seconds
- Test suite execution: < 2 minutes

### Production Reliability
- Database uptime: > 99.9%
- Query response time: < 100ms (95th percentile)
- Migration success rate: 100%
- Zero security incidents

### Developer Experience
- Clear error messages
- Comprehensive documentation
- Automated testing
- Consistent workflows

---

## 📖 Additional Resources

### Documentation Links
- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Migration Best Practices](https://supabase.com/docs/guides/database/migrations)

### Care Collective Specific
- `DATABASE_ANALYSIS_REPORT.md` - Current state analysis
- `DATABASE_ISSUES_AND_FIXES.md` - Specific fix implementations
- `CLAUDE.md` - Project development guidelines

### Team Contacts
- **Database Admin**: [Your DBA contact]
- **DevOps Lead**: [Your DevOps contact]  
- **Security Team**: [Your security contact]

This setup guide provides comprehensive guidance for managing the Care Collective Supabase database infrastructure effectively and securely.