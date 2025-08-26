# Claude Integration Guide - Care Collective Stable Version

## 🎯 Project Context

The Care Collective is a community mutual aid platform built with Next.js, Supabase, and TypeScript. We're implementing a comprehensive security-first approach following the FEATURE_IMPLEMENTATION_PLAN.md roadmap.

## 📋 Current Implementation Status

### ✅ Completed Features
- **Security Infrastructure** (Phase 1, Day 1) - COMPLETE
  - Rate limiting with Upstash Redis
  - Input validation with Zod schemas
  - XSS protection and content sanitization
  - SQL injection prevention
  - Security event logging
  - Security headers and CSP
  - Database security tables and functions

### 🔄 In Progress Features
- Testing framework setup (Phase 1, Day 3)
- Error handling & monitoring (Phase 1, Day 2)

### 📅 Upcoming Features
- Contact Exchange System (Phase 2, Days 4-5)
- Real-time features (Phase 2, Days 6-7)
- Advanced profiles (Phase 3)
- PWA features

## 🔧 Development Commands

```bash
# Development server
npm run dev

# Database operations
npm run db:start      # Start local Supabase
npm run db:push       # Push schema changes
npm run db:reset      # Reset database
npm run db:migration  # Create new migration
npm run db:types      # Generate TypeScript types

# Build and deployment
npm run build         # Production build
npm run start         # Start production server
npm run lint          # Run linting

# Verification
npm run verify        # Verify setup
npm run setup:check   # Check configuration
```

## 🔐 Security Implementation

### Environment Variables Required
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# Application
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NODE_ENV=production
```

### Security Features Implemented

1. **Rate Limiting** (`/lib/security/rate-limiter.ts`)
   - Authentication: 5 attempts per 15 minutes
   - API endpoints: 60 requests per minute
   - Forms: 10 submissions per minute
   - Strict operations: 3 requests per minute

2. **Input Validation** (`/lib/security/validation-schemas.ts`)
   - Zod schemas for all user inputs
   - HTML tag and SQL injection detection
   - Email, phone, and URL sanitization

3. **XSS Protection** (`/lib/security/sanitization.ts`)
   - DOMPurify integration
   - Safe HTML component (`/components/SafeHTML.tsx`)
   - Content sanitization utilities

4. **Security Headers** (`/middleware.ts`)
   - Content Security Policy (CSP)
   - XSS protection headers
   - HSTS in production
   - Frame options and MIME sniffing protection

5. **Security Logging** (`/lib/security/security-logger.ts`)
   - Comprehensive event tracking
   - Brute force detection
   - Admin alerting system
   - Security metrics collection

6. **Database Security** (`/supabase/migrations/20250126_security_infrastructure.sql`)
   - Security events table
   - Contact preferences and exchanges
   - Account locks and failed attempts
   - Row Level Security policies
   - Security functions and triggers

## 📊 Usage Examples

### Rate Limiting in API Routes
```typescript
import { rateLimit } from '@/lib/security/rate-limiter';

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await rateLimit(request, 'forms');
  if (rateLimitResponse) return rateLimitResponse;
  
  // Continue with request handling...
}
```

### Input Validation
```typescript
import { validateForm } from '@/lib/security/validation-middleware';
import { helpRequestSchema } from '@/lib/security/validation-schemas';

const { data, errors } = validateForm(helpRequestSchema, formData);
if (errors) {
  // Handle validation errors
}
```

### Security Logging
```typescript
import { SecurityLogger } from '@/lib/security/security-logger';

// Log authentication failure
await SecurityLogger.logAuthFailure(email, ip, userAgent, reason);

// Log suspicious activity
await SecurityLogger.logSuspiciousActivity(userId, 'unusual_access', details, ip);
```

### Safe Database Operations
```typescript
import { safeGetHelpRequest, safeSearchRequests } from '@/lib/security/database-safety';

// Safe parameterized query
const request = await safeGetHelpRequest(requestId);

// Safe search with sanitization
const results = await safeSearchRequests(searchTerm, filters);
```

## 🧪 Testing Security Features

### Manual Testing Commands

```bash
# Test rate limiting
for i in {1..10}; do curl -X POST http://localhost:3000/api/test; done

# Check security headers
curl -I http://localhost:3000

# Verify CSP headers
curl -H "Accept: text/html" -I http://localhost:3000
```

### Validation Testing
Test inputs with malicious content:
- HTML tags: `<script>alert('xss')</script>`
- SQL injection: `'; DROP TABLE users; --`
- Path traversal: `../../etc/passwd`

Expected: All should be blocked or sanitized

## 📁 Project Structure

```
care-collective-stable/
├── lib/security/
│   ├── rate-limiter.ts           # Rate limiting configuration
│   ├── validation-schemas.ts     # Zod validation schemas
│   ├── validation-middleware.ts  # Validation utilities
│   ├── sanitization.ts          # XSS protection
│   ├── database-safety.ts       # SQL injection prevention
│   ├── password-validation.ts   # Password security
│   └── security-logger.ts       # Event logging
├── components/
│   └── SafeHTML.tsx             # Safe HTML rendering
├── supabase/migrations/
│   └── 20250126_security_infrastructure.sql
└── middleware.ts                # Security headers
```

## 🔄 Development Workflow

### Git Workflow
1. **Feature Branches**: `feature/security-implementation`
2. **Commit Messages**: `feat: Add rate limiting to API endpoints`
3. **Small Commits**: After each feature section
4. **Deploy Preview**: After each commit
5. **Testing**: Before merging to main

### Security Checklist
- [ ] Rate limiting configured and tested
- [ ] Input validation covers all forms
- [ ] XSS protection implemented
- [ ] SQL injection prevention in place
- [ ] Security headers properly configured
- [ ] Security events logged
- [ ] Database migrations applied
- [ ] Environment variables configured

## 🚀 Deployment Notes

### Pre-Deployment
1. Run security migration: `npm run db:push`
2. Set up Upstash Redis account
3. Configure environment variables
4. Test rate limiting and validation
5. Verify security headers

### Production Checklist
- [ ] All environment variables set
- [ ] Database migration applied
- [ ] Redis connection working
- [ ] Security headers verified
- [ ] Rate limiting functional
- [ ] Logging system active

## 🛡️ Security Monitoring

### Security Metrics to Monitor
- Failed login attempts per IP/email
- Rate limit hits by endpoint
- Validation errors and patterns
- Suspicious activity alerts
- Account locks and unlocks

### Admin Dashboard Queries
```sql
-- Recent security events
SELECT * FROM security_events 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Brute force attempts
SELECT email, ip_address, COUNT(*) as attempts
FROM failed_login_attempts 
WHERE attempted_at >= NOW() - INTERVAL '1 hour'
GROUP BY email, ip_address
HAVING COUNT(*) >= 5;
```

## 🔗 Next Implementation Tasks

### Phase 1 Remaining (Days 2-3)
1. **Error Handling & Monitoring**
   - Error boundaries for React components
   - Global error handler
   - Performance monitoring

2. **Testing Framework**
   - Vitest configuration
   - Component testing setup
   - Security feature testing

### Phase 2 Priorities (Days 4-7)
1. **Contact Exchange System**
   - Database schema extension
   - Privacy-focused contact sharing
   - Consent management

2. **Real-time Features**
   - Supabase realtime subscriptions
   - Live notifications
   - Activity feed

## 🆘 Common Issues & Solutions

### Rate Limiting Not Working
- Check Upstash Redis connection
- Verify environment variables
- Ensure middleware is properly configured

### Validation Errors
- Check Zod schema definitions
- Verify input data structure
- Test with valid sample data

### Security Headers Missing
- Check middleware configuration
- Verify CSP domain allowlist
- Test in production environment

### Database Migration Issues
- Verify Supabase connection
- Check migration file syntax
- Run `npm run db:reset` if needed

## 📚 Key Documentation References

1. `FEATURE_IMPLEMENTATION_PLAN.md` - Master roadmap
2. `SECURITY_IMPLEMENTATION.md` - Detailed security specs
3. `API_DOCUMENTATION.md` - API endpoint specifications
4. `CLIENT_REQUIREMENTS_TRACKER.md` - Client feedback and requirements

## 🎯 Success Criteria

### Phase 1 Security Goals ✅
- [x] Rate limiting prevents abuse
- [x] Input validation blocks malicious content
- [x] XSS protection sanitizes user content
- [x] SQL injection prevention implemented
- [x] Security events logged comprehensively
- [x] Security headers properly configured
- [x] Database security measures in place

### Next Phase Goals
- [ ] 80% test coverage achieved
- [ ] Contact exchange system functional
- [ ] Real-time features implemented
- [ ] Performance benchmarks met

---

**Last Updated**: January 26, 2025  
**Current Phase**: Phase 1 - Security Infrastructure ✅  
**Next Tasks**: Error handling and testing framework setup

This document should be updated after each major feature implementation or when significant changes are made to the security infrastructure.