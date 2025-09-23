# Care Collective Environment Setup Guide
## Complete Configuration for All Deployment Scenarios

**Date**: September 9, 2025  
**Session**: Session 4 Environment Standardization  
**Priority**: Medium Priority - Operational Excellence  

---

## 📋 Overview

This guide provides comprehensive environment configuration for the Care Collective platform across all deployment scenarios: development, testing, staging, and production.

### Environment Templates Available
- ✅ `.env.example` - Development environment template
- ✅ `.env.production.example` - Production deployment template  
- ✅ `.env.staging.example` - Staging/testing environment template
- ✅ `.env.test.example` - Automated testing configuration

---

## 🚀 Quick Start

### For New Developers
```bash
# 1. Copy the development template
cp .env.example .env.local

# 2. Update with your Supabase credentials
# Edit .env.local with your actual values

# 3. Start development
npm run dev
```

### For Production Deployment
```bash
# 1. Use production template as reference
cp .env.production.example .env.production

# 2. Set environment variables in your hosting platform
# (Never commit .env.production with real secrets)

# 3. Deploy with proper environment configuration
```

---

## 🏗️ Environment Architecture

### Environment Separation Strategy
```
Development  → Local development with debug features
    ↓
Testing      → Automated CI/CD testing with mocks
    ↓  
Staging      → Production-like testing environment
    ↓
Production   → Live platform with strict security
```

### Variable Exposure Levels
- **Public Variables** (`NEXT_PUBLIC_*`): Exposed to browser, safe for client-side
- **Server Variables**: Server-side only, never exposed to client
- **Secret Variables**: Sensitive credentials, encrypted storage required

---

## 🔧 Configuration Details

### Required Variables (All Environments)

#### Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=         # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Anonymous key (client-safe)
SUPABASE_SERVICE_ROLE=            # Service role key (SECRET!)
```

#### Site Configuration  
```bash
NEXT_PUBLIC_SITE_URL=             # Base URL for your deployment
NODE_ENV=                         # Environment indicator
```

### Optional Variables (Feature-Dependent)

#### Care Collective Features
```bash
NEXT_PUBLIC_PREVIEW_ADMIN=        # Enable admin panel (1/0)
NEXT_PUBLIC_ADMIN_ALLOWLIST=      # Comma-separated admin emails
NEXT_PUBLIC_DEV_MODE=             # Development features (1/0)
CONTACT_EXCHANGE_RATE_LIMIT=      # Rate limiting (number per hour)
```

#### Security Configuration
```bash
NEXT_PUBLIC_STRICT_SECURITY=      # Enable security headers (1/0)
```

#### Monitoring and Analytics
```bash
SENTRY_DSN=                       # Error tracking
ANALYTICS_ID=                     # Usage analytics
ENABLE_PERFORMANCE_MONITORING=    # Performance tracking (1/0)
```

#### Email Services
```bash
EMAIL_FROM=                       # Sender email address
RESEND_API_KEY=                   # Email service API key
```

---

## 🌍 Environment-Specific Configuration

### Development Environment

**Purpose**: Local development and debugging  
**Template**: `.env.example`  
**Security Level**: Low (debugging enabled)

```bash
# Key characteristics
NODE_ENV=development
NEXT_PUBLIC_DEV_MODE=1           # Debug features enabled
NEXT_PUBLIC_PREVIEW_ADMIN=1      # Admin panel accessible
NEXT_PUBLIC_STRICT_SECURITY=0    # Relaxed security for development
DATABASE_DEBUG=1                 # Database debugging enabled
AUTH_DEBUG=1                     # Authentication debugging enabled
```

**Features Enabled**:
- ✅ Debug modes and detailed error messages
- ✅ Admin panel preview
- ✅ Development tools
- ✅ Local testing features
- ✅ Relaxed rate limiting

### Testing Environment  

**Purpose**: Automated testing (CI/CD)  
**Template**: `.env.test.example`  
**Security Level**: Mock (isolated testing)

```bash
# Key characteristics
NODE_ENV=test
NEXT_PUBLIC_TEST_MODE=1          # Test mode enabled
MOCK_SUPABASE=1                  # Mock external services
TEST_COVERAGE_THRESHOLD=80       # Required test coverage
```

**Features Enabled**:
- ✅ Mock external services
- ✅ Isolated test environment
- ✅ High test coverage requirements
- ✅ Comprehensive security testing
- ✅ Performance benchmarking

### Staging Environment

**Purpose**: Production-like testing  
**Template**: `.env.staging.example`  
**Security Level**: Medium (realistic testing)

```bash
# Key characteristics  
NODE_ENV=staging
NEXT_PUBLIC_STRICT_SECURITY=1    # Production-like security
NEXT_PUBLIC_PREVIEW_ADMIN=1      # Admin features for testing
ENABLE_PERFORMANCE_MONITORING=1  # Performance tracking
```

**Features Enabled**:
- ✅ Production-like security measures
- ✅ Admin features for testing
- ✅ Performance monitoring
- ✅ Error tracking
- ✅ Realistic user flows

### Production Environment

**Purpose**: Live platform for community use  
**Template**: `.env.production.example`  
**Security Level**: High (maximum security)

```bash
# Key characteristics
NODE_ENV=production
NEXT_PUBLIC_STRICT_SECURITY=1    # Maximum security enabled
NEXT_PUBLIC_DEV_MODE=0           # No development features
ENABLE_PERFORMANCE_MONITORING=1  # Production monitoring
```

**Features Enabled**:
- ✅ Maximum security measures
- ✅ Production monitoring and alerting
- ✅ Optimized performance
- ✅ Comprehensive audit logging
- ✅ Community safety features

---

## 🔐 Security Guidelines

### Variable Security Classification

#### 🟢 Safe for Public Exposure
```bash
NEXT_PUBLIC_SUPABASE_URL         # Project URL (safe to expose)
NEXT_PUBLIC_SITE_URL             # Site URL (public information)
NEXT_PUBLIC_DEV_MODE             # Feature flag (non-sensitive)
NODE_ENV                         # Environment indicator (standard)
```

#### 🟡 Limited Exposure (Client-Safe)
```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY    # Limited permissions via RLS
NEXT_PUBLIC_ADMIN_ALLOWLIST      # User emails (semi-public)
NEXT_PUBLIC_PREVIEW_ADMIN        # Feature flag (low risk)
```

#### 🔴 Highly Sensitive (Server-Only)
```bash
SUPABASE_SERVICE_ROLE            # Full database access - NEVER expose!
RESEND_API_KEY                   # Email service access
SENTRY_DSN                       # Error tracking access
```

### Security Best Practices

#### Development
- ✅ Use test/demo data only
- ✅ Different Supabase project from production
- ✅ Debug features enabled for troubleshooting
- ✅ Relaxed rate limiting for testing

#### Staging
- ✅ Production-like security enabled
- ✅ Separate Supabase project
- ✅ Realistic but non-sensitive test data
- ✅ Monitor for security issues

#### Production
- ✅ Maximum security measures enabled
- ✅ Dedicated Supabase project
- ✅ Real user data protection
- ✅ Comprehensive monitoring and alerting
- ✅ Regular security audits

---

## 📚 Setup Instructions

### Development Setup

1. **Copy Template**
   ```bash
   cp .env.example .env.local
   ```

2. **Get Supabase Credentials**
   - Visit [Supabase Dashboard](https://app.supabase.com)
   - Create a new project or use existing
   - Copy URL and anon key from Settings > API

3. **Update Configuration**
   ```bash
   # Edit .env.local
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

### Production Setup

1. **Environment Variables in Hosting Platform**
   - Vercel: Project Settings > Environment Variables
   - Netlify: Site Settings > Environment Variables  
   - Railway: Variables tab
   - Custom: Server environment configuration

2. **Required Production Variables**
   ```bash
   NODE_ENV=production
   NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=prod_anon_key
   SUPABASE_SERVICE_ROLE=prod_service_role_key
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   NEXT_PUBLIC_STRICT_SECURITY=1
   ```

3. **Optional Production Enhancements**
   ```bash
   SENTRY_DSN=https://your-sentry-dsn
   EMAIL_FROM=noreply@your-domain.com
   RESEND_API_KEY=your_resend_key
   NEXT_PUBLIC_ADMIN_ALLOWLIST=admin@your-domain.com
   ```

### Testing Setup

1. **Copy Test Template**
   ```bash
   cp .env.test.example .env.test
   ```

2. **Run Tests**
   ```bash
   npm run test
   npm run test:coverage
   npm run db:security-audit
   ```

---

## 🔍 Troubleshooting

### Common Issues

#### "Supabase client error"
```bash
# Check these variables are set correctly:
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]

# Verify URL format (must start with https://)
# Verify key length (Supabase keys are long)
```

#### "Authentication not working"
```bash
# Check site URL matches your deployment:
NEXT_PUBLIC_SITE_URL=https://your-actual-domain.com

# Verify in Supabase Auth settings:
# - Site URL configured correctly
# - Redirect URLs include your domain
```

#### "Admin features not showing"
```bash
# Check admin configuration:
NEXT_PUBLIC_PREVIEW_ADMIN=1
NEXT_PUBLIC_ADMIN_ALLOWLIST=your-email@domain.com

# Verify your account:
# - Email matches exactly
# - Account is approved in database
```

#### "Contact exchange not working"
```bash
# Check RLS policies are active:
# - Run security audit: npm run db:security-audit
# - Verify user approval status
# - Check rate limiting settings
```

### Environment Validation

```bash
# Run environment verification
npm run verify

# Check specific configurations
npm run setup:check

# Validate database connectivity
npm run db:start
npm run db:reset  # Should complete without errors
```

---

## 📊 Environment Monitoring

### Key Metrics to Monitor

#### Development
- ✅ Local server startup time
- ✅ Database connection success
- ✅ Authentication flow completion
- ✅ Test suite pass rate

#### Staging  
- ✅ Deployment success rate
- ✅ User flow completion
- ✅ Performance benchmarks
- ✅ Security test results

#### Production
- ✅ Application uptime
- ✅ User authentication success
- ✅ Help request creation rate
- ✅ Contact exchange completion
- ✅ Error rates and types
- ✅ Performance metrics

### Alerting Thresholds

```bash
# Error rates
ERROR_RATE_THRESHOLD=1%           # Alert if >1% error rate
RESPONSE_TIME_THRESHOLD=2000ms    # Alert if >2s response time
UPTIME_THRESHOLD=99.9%            # Alert if <99.9% uptime

# Security events
FAILED_AUTH_THRESHOLD=10          # Alert if >10 failed auths/hour
RATE_LIMIT_THRESHOLD=5            # Alert if rate limiting triggered

# Performance
DATABASE_QUERY_THRESHOLD=500ms    # Alert if queries >500ms
MEMORY_USAGE_THRESHOLD=80%        # Alert if memory >80%
```

---

## ✅ Environment Checklist

### Development Environment
- [ ] `.env.local` created from template
- [ ] Supabase credentials configured
- [ ] Local server starts without errors
- [ ] Authentication works locally
- [ ] Database migrations run successfully
- [ ] Admin features accessible (if needed)
- [ ] Tests pass locally

### Staging Environment  
- [ ] Separate Supabase project configured
- [ ] Environment variables set in hosting platform
- [ ] Production-like security enabled
- [ ] User flows work end-to-end
- [ ] Error tracking configured
- [ ] Performance monitoring active

### Production Environment
- [ ] Dedicated Supabase project
- [ ] All security measures enabled
- [ ] Custom domain configured
- [ ] SSL certificates active
- [ ] Error tracking operational
- [ ] Monitoring and alerting configured
- [ ] Admin access restricted and tested
- [ ] Backup procedures in place

### Security Verification
- [ ] No secrets in client-side code
- [ ] Service role key properly secured
- [ ] RLS policies active and tested
- [ ] Contact exchange privacy protected
- [ ] Rate limiting operational
- [ ] Admin privileges properly restricted

---

## 🎯 Best Practices Summary

### Configuration Management
1. **Never commit secrets** - Use environment variables
2. **Separate environments** - Different projects for dev/staging/prod
3. **Document thoroughly** - Keep this guide updated
4. **Test configurations** - Verify in staging before production
5. **Monitor actively** - Set up alerts for critical metrics

### Security Practices
1. **Principle of least privilege** - Only grant necessary permissions
2. **Defense in depth** - Multiple security layers
3. **Regular audits** - Monthly security reviews
4. **Incident response** - Procedures for security events
5. **Key rotation** - Regular credential updates

### Team Practices
1. **Onboarding checklist** - New developers follow this guide
2. **Environment documentation** - Keep current and accurate
3. **Change management** - Review environment changes
4. **Testing standards** - All environments thoroughly tested
5. **Knowledge sharing** - Team understands configuration

---

**Guide Completed**: September 9, 2025  
**Next Review**: December 9, 2025  
**Maintained By**: Care Collective Development Team  
**Status**: 🎯 **COMPLETE** - Ready for operational excellence