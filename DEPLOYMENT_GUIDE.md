# Deployment Guide - Care Collective
*Complete Guide for Production Deployment and CI/CD*

## 🚀 Deployment Overview

This guide covers the complete deployment process for the Care Collective platform, including environment setup, continuous integration, production deployment, and monitoring.

### Deployment Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │───►│    Staging      │───►│   Production    │
│   localhost     │    │  staging.app    │    │ care-collective │
│                 │    │                 │    │      .app       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Supabase Local  │    │ Supabase Staging│    │Supabase Production│
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Environment Setup

### Prerequisites

**Local Development:**
```bash
# Node.js (18.0+)
node --version  # v18.0.0+
npm --version   # v9.0.0+

# Git
git --version  # v2.30.0+

# Supabase CLI
npm install -g supabase@latest
supabase --version  # v1.100.0+
```

**Production Requirements:**
- Vercel Account (recommended) or similar hosting
- Supabase Account (database and auth)
- GitHub Account (CI/CD)
- Domain name (optional, custom domain)
- Upstash Account (Redis for rate limiting)

### Environment Variables

#### Development (.env.local)
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key

# Site Configuration  
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Feature Flags
NEXT_PUBLIC_FEATURE_REALTIME=true
NEXT_PUBLIC_FEATURE_MESSAGING=false
NEXT_PUBLIC_FEATURE_GROUPS=false

# Development Tools
NODE_ENV=development
NEXT_PUBLIC_ENV=development
```

#### Staging (.env.staging)
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-staging-service-role-key

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://care-collective-staging.vercel.app

# Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://your-staging-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-staging-redis-token

# Feature Flags
NEXT_PUBLIC_FEATURE_REALTIME=true
NEXT_PUBLIC_FEATURE_MESSAGING=false
NEXT_PUBLIC_FEATURE_GROUPS=false

# Environment
NODE_ENV=production
NEXT_PUBLIC_ENV=staging

# Monitoring
SENTRY_DSN=https://your-staging-sentry-dsn
VERCEL_ANALYTICS_ID=your-staging-analytics-id
```

#### Production (.env.production)
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://care-collective.app

# Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://your-production-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-production-redis-token

# Security
RATE_LIMIT_ENABLED=true
CSP_ENABLED=true

# Feature Flags
NEXT_PUBLIC_FEATURE_REALTIME=true
NEXT_PUBLIC_FEATURE_MESSAGING=true
NEXT_PUBLIC_FEATURE_GROUPS=false

# Environment
NODE_ENV=production
NEXT_PUBLIC_ENV=production

# Monitoring
SENTRY_DSN=https://your-production-sentry-dsn
VERCEL_ANALYTICS_ID=your-production-analytics-id

# Admin Configuration
NEXT_PUBLIC_ADMIN_EMAILS=admin@care-collective.app,support@care-collective.app
```

## 🏗️ Infrastructure Setup

### 1. Supabase Setup

#### Create New Project
```bash
# Create new Supabase project
supabase projects create care-collective-production

# Link local project
supabase link --project-ref your-project-id

# Set up database schema
supabase db push
```

#### Database Configuration
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Set up Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create initial tables
\i supabase/migrations/20240811000000_initial_schema.sql
\i supabase/migrations/20250115_contact_exchange.sql
\i supabase/migrations/20250811082915_add_request_status_tracking.sql
\i supabase/migrations/20250811090000_add_admin_support.sql

-- Verify setup
SELECT schemaname, tablename FROM pg_tables 
WHERE schemaname = 'public';
```

#### Row Level Security Policies
```sql
-- Help requests policies
CREATE POLICY "Users can view public help requests" ON help_requests
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own help requests" ON help_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own help requests" ON help_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- Contact exchange policies
CREATE POLICY "Users can view their own exchanges" ON contact_exchanges
  FOR SELECT USING (helper_id = auth.uid() OR requester_id = auth.uid());

-- Profile policies
CREATE POLICY "Users can view public profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### 2. Redis Setup (Upstash)

#### Create Redis Instance
```bash
# Visit https://console.upstash.com/
# Create new Redis database
# Choose region closest to your users
# Copy REST URL and token
```

#### Test Connection
```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-redis-url.upstash.io/get/test
```

### 3. Vercel Setup

#### Install Vercel CLI
```bash
npm install -g vercel@latest
vercel --version
```

#### Project Configuration
```bash
# Initialize Vercel project
vercel

# Configure project settings
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN

# Set up domains
vercel domains add care-collective.app
vercel domains add staging.care-collective.app
```

#### vercel.json Configuration
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "X-Requested-With, Content-Type, Authorization"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/home",
      "destination": "/",
      "permanent": false
    }
  ],
  "rewrites": [
    {
      "source": "/api/v1/(.*)",
      "destination": "/api/$1"
    }
  ]
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

#### `.github/workflows/deploy.yml`
```yaml
name: Deploy Care Collective

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
  SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run type checking
        run: npm run type-check

      - name: Run linting
        run: npm run lint

      - name: Run unit tests
        run: npm run test:coverage

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: |
            test-results/
            playwright-report/

  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

      - name: Audit npm dependencies
        run: npm audit --audit-level moderate

  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: [test, security-scan]
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: |
            .next/
            public/

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [build]
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          github-comment: true
          vercel-args: '--env NODE_ENV=production --env NEXT_PUBLIC_ENV=staging'

      - name: Run database migrations
        run: |
          npx supabase migration up --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [build]
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_PROD }}
          vercel-args: '--prod --env NODE_ENV=production --env NEXT_PUBLIC_ENV=production'

      - name: Run database migrations
        run: |
          npx supabase migration up --project-ref ${{ secrets.SUPABASE_PROD_PROJECT_ID }}

      - name: Notify team
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()

  lighthouse:
    name: Lighthouse CI
    runs-on: ubuntu-latest
    needs: [deploy-staging]
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install Lighthouse CI
        run: npm install -g @lhci/cli@0.12.x

      - name: Run Lighthouse CI
        run: lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

### Deployment Scripts

#### `scripts/deploy.sh`
```bash
#!/bin/bash
set -e

# Deployment script for Care Collective
# Usage: ./scripts/deploy.sh [staging|production]

ENVIRONMENT=${1:-staging}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEPLOY_LOG="deploy_${ENVIRONMENT}_${TIMESTAMP}.log"

echo "🚀 Starting deployment to $ENVIRONMENT..."
echo "📝 Logging to: $DEPLOY_LOG"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$DEPLOY_LOG"
}

# Function to handle errors
handle_error() {
    log "❌ ERROR: $1"
    log "📧 Sending failure notification..."
    # Add notification logic here
    exit 1
}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    handle_error "Invalid environment. Use 'staging' or 'production'"
fi

# Pre-deployment checks
log "🔍 Running pre-deployment checks..."

# Check Node.js version
NODE_VERSION=$(node --version)
log "Node.js version: $NODE_VERSION"

# Check if build is clean
if [ -d ".next" ]; then
    log "🧹 Cleaning previous build..."
    rm -rf .next
fi

# Run tests
log "🧪 Running test suite..."
npm run test:ci || handle_error "Tests failed"

# Security audit
log "🔒 Running security audit..."
npm audit --audit-level moderate || handle_error "Security vulnerabilities found"

# Build application
log "🏗️ Building application..."
npm run build || handle_error "Build failed"

# Database migrations
if [ "$ENVIRONMENT" = "production" ]; then
    log "📊 Running production database migrations..."
    npx supabase migration up --project-ref "$SUPABASE_PROD_PROJECT_ID" || handle_error "Database migration failed"
else
    log "📊 Running staging database migrations..."
    npx supabase migration up --project-ref "$SUPABASE_STAGING_PROJECT_ID" || handle_error "Database migration failed"
fi

# Deploy to Vercel
log "🚀 Deploying to Vercel..."
if [ "$ENVIRONMENT" = "production" ]; then
    vercel --prod --confirm || handle_error "Production deployment failed"
    DEPLOY_URL="https://care-collective.app"
else
    vercel --confirm || handle_error "Staging deployment failed"
    DEPLOY_URL="https://care-collective-staging.vercel.app"
fi

# Health check
log "🏥 Running health checks..."
sleep 30  # Wait for deployment to be ready

HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOY_URL/api/health")
if [ "$HEALTH_CHECK" != "200" ]; then
    handle_error "Health check failed (HTTP $HEALTH_CHECK)"
fi

log "✅ Health check passed"

# Performance check
log "⚡ Running Lighthouse audit..."
npx lhci autorun --upload.target=temporary-public-storage || log "⚠️  Lighthouse audit completed with warnings"

# Success notification
log "🎉 Deployment to $ENVIRONMENT completed successfully!"
log "🌐 URL: $DEPLOY_URL"
log "📊 Build time: $(date)"

# Clean up
log "🧹 Cleaning up temporary files..."
# Add cleanup logic if needed

echo "✨ Deployment complete! Check $DEPLOY_LOG for details."
```

#### `scripts/rollback.sh`
```bash
#!/bin/bash
set -e

# Rollback script for Care Collective
# Usage: ./scripts/rollback.sh [staging|production] [deployment-id]

ENVIRONMENT=${1:-staging}
DEPLOYMENT_ID=${2}

if [ -z "$DEPLOYMENT_ID" ]; then
    echo "❌ Please provide deployment ID to rollback to"
    echo "Usage: ./scripts/rollback.sh [staging|production] [deployment-id]"
    exit 1
fi

echo "🔄 Rolling back $ENVIRONMENT to deployment $DEPLOYMENT_ID..."

# Rollback Vercel deployment
vercel rollback "$DEPLOYMENT_ID" || {
    echo "❌ Rollback failed"
    exit 1
}

# Health check
sleep 30
DEPLOY_URL=$([ "$ENVIRONMENT" = "production" ] && echo "https://care-collective.app" || echo "https://care-collective-staging.vercel.app")
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOY_URL/api/health")

if [ "$HEALTH_CHECK" = "200" ]; then
    echo "✅ Rollback completed successfully"
    echo "🌐 URL: $DEPLOY_URL"
else
    echo "❌ Health check failed after rollback (HTTP $HEALTH_CHECK)"
    exit 1
fi
```

## 📊 Monitoring & Observability

### Health Checks

#### API Health Endpoints
```typescript
// app/api/health/route.ts - Basic health check
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NEXT_PUBLIC_ENV || 'development'
  });
}

// app/api/health/deep/route.ts - Comprehensive health check
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    external_services: await checkExternalServices()
  };
  
  const isHealthy = Object.values(checks).every(check => check === 'healthy');
  
  return NextResponse.json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString()
  }, {
    status: isHealthy ? 200 : 503
  });
}
```

#### Monitoring Configuration
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana

  uptime-kuma:
    image: louislam/uptime-kuma:latest
    ports:
      - "3002:3001"
    volumes:
      - uptime-kuma:/app/data

volumes:
  grafana-data:
  uptime-kuma:
```

### Logging Configuration

#### Structured Logging
```typescript
// lib/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'care-collective',
    environment: process.env.NEXT_PUBLIC_ENV || 'development'
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Add remote logging in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.Http({
    host: 'logs.example.com',
    port: 443,
    path: '/api/logs',
    ssl: true
  }));
}

export default logger;
```

### Error Tracking (Sentry)

#### Sentry Configuration
```typescript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  beforeSend(event) {
    // Filter out development errors
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    return event;
  },
  integrations: [
    new Sentry.BrowserTracing({
      // Set sampling rate for performance monitoring
      tracingOrigins: ['localhost', /^https:\/\/care-collective\.app/],
    }),
  ]
});
```

## 🔒 Security Deployment Checklist

### Pre-Deployment Security
- [ ] Environment variables secured
- [ ] No secrets in code
- [ ] Database credentials rotated
- [ ] SSL certificates configured
- [ ] Security headers implemented
- [ ] Rate limiting enabled
- [ ] Input validation active
- [ ] SQL injection protection verified
- [ ] XSS protection verified
- [ ] CSRF protection enabled

### Production Security
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] Database RLS policies applied
- [ ] Admin access restricted
- [ ] Monitoring and alerting active
- [ ] Backup and recovery tested
- [ ] Incident response plan ready

### Security Monitoring
```bash
# Security monitoring commands
# Check SSL/TLS configuration
openssl s_client -connect care-collective.app:443 -servername care-collective.app

# Verify security headers
curl -I https://care-collective.app | grep -E "(Strict-Transport-Security|Content-Security-Policy|X-Frame-Options)"

# Test rate limiting
for i in {1..15}; do curl -w "\n%{http_code} " -X POST https://care-collective.app/api/health; done
```

## 📈 Performance Optimization

### Build Optimization

#### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable SWC compiler
  swcMinify: true,
  
  // Compress output
  compress: true,
  
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Enable experimental features
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Bundle analyzer (development only)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      config.plugins.push(
        new (require('@next/bundle-analyzer'))({
          enabled: true,
        })
      );
      return config;
    },
  }),
  
  // Headers for performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          }
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=600'
          }
        ],
      }
    ];
  },
};

module.exports = nextConfig;
```

### Database Performance

#### Connection Pooling
```typescript
// lib/supabase/connection-pool.ts
import { createPool } from 'generic-pool';
import { createClient } from '@supabase/supabase-js';

const factory = {
  create: async () => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        db: {
          schema: 'public',
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  },
  destroy: async (client: any) => {
    // Cleanup if needed
  },
};

export const connectionPool = createPool(factory, {
  max: 10, // Maximum connections
  min: 2,  // Minimum connections
});

// Usage
export async function withDatabase<T>(
  operation: (client: any) => Promise<T>
): Promise<T> {
  const client = await connectionPool.acquire();
  try {
    return await operation(client);
  } finally {
    await connectionPool.release(client);
  }
}
```

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] SSL certificates ready
- [ ] DNS configuration complete
- [ ] Monitoring setup verified
- [ ] Backup procedures tested
- [ ] Rollback plan prepared

### Deployment
- [ ] Deploy to staging first
- [ ] Run smoke tests
- [ ] Database migrations applied
- [ ] Health checks passing
- [ ] Performance metrics acceptable
- [ ] Deploy to production
- [ ] Verify all features working
- [ ] Monitor error rates
- [ ] Check response times
- [ ] Validate security measures

### Post-Deployment
- [ ] Monitor application logs
- [ ] Check error tracking
- [ ] Verify monitoring alerts
- [ ] Test critical user flows
- [ ] Update documentation
- [ ] Notify stakeholders
- [ ] Schedule post-mortem if needed
- [ ] Plan next release

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear Next.js cache
rm -rf .next
npm run build

# Check Node.js version
node --version  # Should be 18.0.0+

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Database Connection Issues
```bash
# Test Supabase connection
npx supabase status

# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Test database query
curl -X POST 'https://your-project.supabase.co/rest/v1/help_requests' \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  --data '{"select":"id"}'
```

#### Performance Issues
```bash
# Analyze bundle size
npm run build
npm run analyze

# Check memory usage
node --max-old-space-size=4096 node_modules/.bin/next build

# Profile application
npm run dev -- --profile
```

### Emergency Procedures

#### Immediate Rollback
```bash
# Get recent deployments
vercel list

# Rollback to previous version
vercel rollback [deployment-url]

# Or use automated script
./scripts/rollback.sh production [deployment-id]
```

#### Database Recovery
```bash
# Create backup before changes
pg_dump "postgresql://user:pass@host:port/db" > backup_$(date +%Y%m%d).sql

# Restore from backup
psql "postgresql://user:pass@host:port/db" < backup_20250120.sql

# Supabase backup
supabase db dump --project-ref your-project-id > backup.sql
```

---

**Document Status**: Active  
**Last Updated**: January 2025  
**Next Review**: After major releases  
**Maintained by**: DevOps Team  

This deployment guide ensures reliable, secure, and performant deployment of the Care Collective platform with comprehensive monitoring and recovery procedures.