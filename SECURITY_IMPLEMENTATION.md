# Security Implementation Guide - Care Collective
*Production-Grade Security for Community Platform*

## 🔐 Security Overview

This document outlines the comprehensive security implementation for the Care Collective platform, ensuring protection of user data, prevention of common attacks, and maintaining community trust through robust security measures.

## 🛡️ Security Layers

### Layer 1: Input Validation & Sanitization
- **Zod Schemas**: Type-safe validation for all user inputs
- **DOMPurify**: XSS prevention through HTML sanitization  
- **SQL Parameterization**: Prevention of SQL injection attacks
- **File Upload Validation**: Type and size restrictions

### Layer 2: Authentication & Authorization
- **Supabase Auth**: Secure authentication provider
- **Row Level Security**: Database-level access control
- **Session Management**: Secure cookie configuration
- **JWT Validation**: Token verification for API access

### Layer 3: Rate Limiting & DDoS Protection  
- **API Rate Limiting**: Request throttling per endpoint
- **Authentication Limits**: Brute force protection
- **Resource Limits**: Prevention of resource exhaustion
- **Geographic Restrictions**: Optional IP-based filtering

### Layer 4: Application Security
- **Content Security Policy**: XSS and injection prevention
- **HTTPS Enforcement**: Encrypted data transmission
- **Security Headers**: Defense-in-depth browser protection
- **CORS Configuration**: Cross-origin request control

### Layer 5: Monitoring & Auditing
- **Security Event Logging**: Comprehensive audit trails
- **Anomaly Detection**: Unusual activity monitoring
- **Error Tracking**: Security incident detection
- **Performance Monitoring**: Resource usage tracking

## 📋 Implementation Details

### 1. Rate Limiting System

#### 1.1 Installation
```bash
npm install @upstash/ratelimit @upstash/redis
```

#### 1.2 Configuration
```typescript
// lib/security/rate-limiter.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest } from 'next/server';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Define rate limiters for different endpoints
export const rateLimiters = {
  // Authentication endpoints - strict limits
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 minutes
    prefix: 'rl:auth',
  }),
  
  // API endpoints - moderate limits
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 requests per minute
    prefix: 'rl:api',
  }),
  
  // Form submissions - prevent spam
  forms: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 submissions per minute
    prefix: 'rl:forms',
  }),
  
  // Strict endpoints - sensitive operations
  strict: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 m'), // 3 requests per minute
    prefix: 'rl:strict',
  }),
};

// Rate limit middleware
export async function rateLimit(
  request: NextRequest,
  limiterType: keyof typeof rateLimiters = 'api'
) {
  const ip = request.ip ?? '127.0.0.1';
  const limiter = rateLimiters[limiterType];
  
  const { success, limit, reset, remaining } = await limiter.limit(ip);
  
  if (!success) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(reset).toISOString(),
      },
    });
  }
  
  return null; // Continue with request
}
```

#### 1.3 API Route Implementation
```typescript
// app/api/help-requests/route.ts
import { rateLimit } from '@/lib/security/rate-limiter';

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await rateLimit(request, 'forms');
  if (rateLimitResponse) return rateLimitResponse;
  
  // Continue with request handling
  // ...
}
```

### 2. Input Validation with Zod

#### 2.1 Schema Definitions
```typescript
// lib/security/validation-schemas.ts
import { z } from 'zod';

// HTML tag detection regex
const htmlTagRegex = /<[^>]*>/g;

// SQL injection patterns
const sqlInjectionPatterns = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER)\b)/i,
  /(--|#|\/\*|\*\/)/,
  /(\bOR\b.*=.*)/i,
];

// Custom validation functions
const noHTML = (val: string) => !htmlTagRegex.test(val);
const noSQL = (val: string) => !sqlInjectionPatterns.some(pattern => pattern.test(val));

// Help Request Schema
export const helpRequestSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters')
    .refine(noHTML, 'HTML tags are not allowed')
    .refine(noSQL, 'Invalid characters detected'),
    
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .refine(noHTML, 'HTML tags are not allowed')
    .optional(),
    
  category: z.enum([
    'transportation', 'household', 'meals', 'childcare',
    'petcare', 'technology', 'companionship', 'respite',
    'emotional', 'groceries', 'medical', 'other'
  ], {
    errorMap: () => ({ message: 'Please select a valid category' })
  }),
  
  urgency: z.enum(['normal', 'urgent', 'critical'], {
    errorMap: () => ({ message: 'Invalid urgency level' })
  }).default('normal'),
  
  location: z.string()
    .max(100, 'Location must be less than 100 characters')
    .refine(noHTML, 'HTML tags are not allowed')
    .optional(),
    
  location_privacy: z.enum(['public', 'helpers_only', 'after_match'])
    .default('helpers_only'),
});

// User Profile Schema
export const profileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .refine(noHTML, 'HTML tags are not allowed')
    .refine(noSQL, 'Invalid characters detected'),
    
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .refine(noHTML, 'HTML tags are not allowed')
    .optional(),
    
  location: z.string()
    .max(100, 'Location must be less than 100 characters')
    .refine(noHTML, 'HTML tags are not allowed')
    .optional(),
    
  skills: z.array(z.string().max(30))
    .max(20, 'Maximum 20 skills allowed')
    .optional(),
    
  email: z.string()
    .email('Invalid email address')
    .optional(),
    
  phone: z.string()
    .regex(/^\+?[\d\s-()]+$/, 'Invalid phone number')
    .optional(),
});

// Contact Exchange Schema
export const contactExchangeSchema = z.object({
  request_id: z.string()
    .uuid('Invalid request ID'),
    
  consent: z.literal(true, {
    errorMap: () => ({ message: 'You must consent to share contact information' })
  }),
  
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(200, 'Message must be less than 200 characters')
    .refine(noHTML, 'HTML tags are not allowed')
    .optional(),
});

// Authentication Schemas
export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .toLowerCase(),
    
  password: z.string()
    .min(8, 'Password must be at least 8 characters'),
});

export const signupSchema = loginSchema.extend({
  confirmPassword: z.string(),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
```

#### 2.2 Validation Middleware
```typescript
// lib/security/validation-middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { ZodError, ZodSchema } from 'zod';

export function validateRequest(schema: ZodSchema) {
  return async function middleware(request: NextRequest) {
    try {
      const body = await request.json();
      const validated = schema.parse(body);
      
      // Attach validated data to request
      (request as any).validatedData = validated;
      
      return null; // Continue with request
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: error.errors,
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }
  };
}
```

### 3. XSS Protection

#### 3.1 Content Sanitization
```typescript
// lib/security/sanitization.ts
import DOMPurify from 'isomorphic-dompurify';

// Strict HTML sanitization - removes all HTML
export function sanitizeText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/[<>\"']/g, '') // Remove potentially dangerous characters
    .trim();
}

// Limited HTML sanitization - allows safe formatting
export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
}

// Markdown sanitization - for rich text areas
export function sanitizeMarkdown(markdown: string): string {
  // Remove script tags and javascript: protocols
  let cleaned = markdown
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
    
  return cleaned;
}

// URL sanitization - prevent javascript: and data: URLs
export function sanitizeURL(url: string): string {
  const parsed = new URL(url, 'http://example.com');
  
  // Only allow http(s) protocols
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return '#';
  }
  
  return url;
}
```

#### 3.2 React Component Protection
```typescript
// components/SafeHTML.tsx
import DOMPurify from 'isomorphic-dompurify';

interface SafeHTMLProps {
  html: string;
  className?: string;
}

export function SafeHTML({ html, className }: SafeHTMLProps) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  });
  
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
```

### 4. Security Headers

#### 4.1 Middleware Configuration
```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Create response
  const response = NextResponse.next();
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
  
  // Set security headers
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // HTTPS enforcement
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### 5. SQL Injection Prevention

#### 5.1 Safe Database Queries
```typescript
// lib/security/database-safety.ts
import { createClient } from '@/lib/supabase/server';

// Safe parameterized queries
export async function safeGetHelpRequest(requestId: string) {
  const supabase = createClient();
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(requestId)) {
    throw new Error('Invalid request ID format');
  }
  
  // Use parameterized query
  const { data, error } = await supabase
    .from('help_requests')
    .select('*')
    .eq('id', requestId) // Parameterized, safe from injection
    .single();
    
  if (error) throw error;
  return data;
}

// Safe search with sanitization
export async function safeSearchRequests(searchTerm: string) {
  const supabase = createClient();
  
  // Sanitize search term
  const sanitized = searchTerm
    .replace(/[%_]/g, '\\$&') // Escape SQL wildcards
    .replace(/[^\w\s]/g, '') // Remove special characters
    .trim();
    
  // Use safe text search
  const { data, error } = await supabase
    .from('help_requests')
    .select('*')
    .textSearch('title', sanitized, {
      type: 'websearch',
      config: 'english',
    });
    
  if (error) throw error;
  return data;
}

// Never use string concatenation
// BAD: .filter('id', 'eq', `${userId}`)
// GOOD: .filter('id', 'eq', userId)
```

### 6. Authentication Security

#### 6.1 Session Management
```typescript
// lib/security/session-config.ts
export const sessionConfig = {
  // Cookie settings
  cookieName: 'care-collective-session',
  cookieOptions: {
    httpOnly: true,        // Prevent XSS access
    secure: true,          // HTTPS only
    sameSite: 'strict',    // CSRF protection
    maxAge: 60 * 60 * 24,  // 24 hours
    path: '/',
  },
  
  // Session settings
  sessionTimeout: 60 * 60 * 24, // 24 hours
  refreshThreshold: 60 * 60,    // Refresh if < 1 hour left
  
  // Security settings
  requireEmailVerification: true,
  maxFailedAttempts: 5,
  lockoutDuration: 15 * 60, // 15 minutes
};
```

#### 6.2 Password Requirements
```typescript
// lib/security/password-validation.ts
export const passwordRequirements = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false, // Optional for usability
};

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < passwordRequirements.minLength) {
    errors.push(`Password must be at least ${passwordRequirements.minLength} characters`);
  }
  
  if (password.length > passwordRequirements.maxLength) {
    errors.push(`Password must be less than ${passwordRequirements.maxLength} characters`);
  }
  
  if (passwordRequirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (passwordRequirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (passwordRequirements.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (passwordRequirements.requireSpecialChars && !/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common passwords
  const commonPasswords = ['password', '12345678', 'qwerty', 'abc123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
```

### 7. File Upload Security

#### 7.1 File Validation
```typescript
// lib/security/file-upload.ts
export const fileUploadConfig = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
};

export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > fileUploadConfig.maxSize) {
    return { 
      valid: false, 
      error: `File size must be less than ${fileUploadConfig.maxSize / 1024 / 1024}MB` 
    };
  }
  
  // Check MIME type
  if (!fileUploadConfig.allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Invalid file type' 
    };
  }
  
  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!fileUploadConfig.allowedExtensions.includes(extension)) {
    return { 
      valid: false, 
      error: 'Invalid file extension' 
    };
  }
  
  // Additional security checks could include:
  // - Virus scanning
  // - Image content analysis
  // - Metadata stripping
  
  return { valid: true };
}
```

### 8. Security Logging & Monitoring

#### 8.1 Security Event Logger
```typescript
// lib/security/security-logger.ts
interface SecurityEvent {
  type: 'auth_failure' | 'rate_limit' | 'validation_error' | 'suspicious_activity' | 'access_denied';
  userId?: string;
  ip?: string;
  userAgent?: string;
  details: any;
  timestamp: Date;
}

export class SecurityLogger {
  private static async logToDatabase(event: SecurityEvent) {
    const supabase = createClient();
    
    await supabase
      .from('security_events')
      .insert({
        event_type: event.type,
        user_id: event.userId,
        ip_address: event.ip,
        user_agent: event.userAgent,
        details: event.details,
        created_at: event.timestamp,
      });
  }
  
  static async logAuthFailure(email: string, ip: string) {
    const event: SecurityEvent = {
      type: 'auth_failure',
      ip,
      details: { email },
      timestamp: new Date(),
    };
    
    await this.logToDatabase(event);
    
    // Check for repeated failures
    await this.checkForBruteForce(email, ip);
  }
  
  static async logRateLimit(ip: string, endpoint: string) {
    const event: SecurityEvent = {
      type: 'rate_limit',
      ip,
      details: { endpoint },
      timestamp: new Date(),
    };
    
    await this.logToDatabase(event);
  }
  
  static async logSuspiciousActivity(userId: string, activity: string, details: any) {
    const event: SecurityEvent = {
      type: 'suspicious_activity',
      userId,
      details: { activity, ...details },
      timestamp: new Date(),
    };
    
    await this.logToDatabase(event);
    
    // Alert administrators
    await this.alertAdmins(event);
  }
  
  private static async checkForBruteForce(email: string, ip: string) {
    // Check recent failed attempts
    const recentAttempts = await this.getRecentAuthFailures(email, ip);
    
    if (recentAttempts > 5) {
      // Trigger additional security measures
      await this.lockAccount(email);
      await this.alertAdmins({
        type: 'suspicious_activity',
        details: { reason: 'Possible brute force attack', email, ip },
        timestamp: new Date(),
      });
    }
  }
  
  private static async alertAdmins(event: SecurityEvent) {
    // Send alerts to admin team
    console.error('Security Alert:', event);
    // Could also send email, Slack notification, etc.
  }
}
```

### 9. CORS Configuration

#### 9.1 CORS Middleware
```typescript
// lib/security/cors-config.ts
import { NextRequest, NextResponse } from 'next/server';

const allowedOrigins = [
  process.env.NEXT_PUBLIC_SITE_URL,
  'http://localhost:3000',
  // Add other trusted origins
].filter(Boolean);

export function corsMiddleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const response = NextResponse.next();
  
  // Check if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');
    
    return new NextResponse(null, { status: 200, headers: response.headers });
  }
  
  return response;
}
```

## 🔍 Security Testing

### Testing Checklist
- [ ] Rate limiting functions correctly
- [ ] Input validation catches malicious input
- [ ] XSS attempts are blocked
- [ ] SQL injection is prevented
- [ ] Authentication is secure
- [ ] Sessions expire correctly
- [ ] File uploads are validated
- [ ] Security headers are present
- [ ] CORS is properly configured
- [ ] Security events are logged

### Security Audit Tools
```bash
# Dependency vulnerability scanning
npm audit

# Security headers test
curl -I https://your-site.com

# SSL/TLS configuration test
openssl s_client -connect your-site.com:443

# Rate limiting test
for i in {1..10}; do curl -X POST https://your-site.com/api/test; done
```

## 📊 Security Metrics

### Key Performance Indicators
- **Failed Login Attempts**: Monitor for brute force
- **Rate Limit Hits**: Identify potential attacks
- **Validation Errors**: Detect injection attempts
- **Security Events**: Track suspicious activities
- **Response Times**: Monitor for DoS attacks

### Monitoring Dashboard
```typescript
// lib/security/metrics.ts
export async function getSecurityMetrics() {
  const supabase = createClient();
  
  const [authFailures, rateLimits, validationErrors] = await Promise.all([
    supabase
      .from('security_events')
      .select('*')
      .eq('event_type', 'auth_failure')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      
    supabase
      .from('security_events')
      .select('*')
      .eq('event_type', 'rate_limit')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      
    supabase
      .from('security_events')
      .select('*')
      .eq('event_type', 'validation_error')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ]);
  
  return {
    authFailures: authFailures.data?.length || 0,
    rateLimits: rateLimits.data?.length || 0,
    validationErrors: validationErrors.data?.length || 0,
  };
}
```

## 🚨 Incident Response

### Response Plan
1. **Detection**: Automated monitoring alerts
2. **Assessment**: Evaluate severity and scope
3. **Containment**: Isolate affected systems
4. **Eradication**: Remove threat
5. **Recovery**: Restore normal operations
6. **Lessons Learned**: Document and improve

### Emergency Contacts
- Security Team Lead: [contact]
- DevOps On-Call: [contact]
- Platform Administrator: [contact]

## 📚 Security Best Practices

### For Developers
1. Never trust user input
2. Use parameterized queries
3. Implement defense in depth
4. Keep dependencies updated
5. Follow principle of least privilege
6. Log security events
7. Test security measures regularly

### For Users
1. Use strong, unique passwords
2. Enable two-factor authentication (when available)
3. Report suspicious activity
4. Keep personal information private
5. Be cautious with contact sharing

## 🔄 Security Maintenance

### Regular Tasks
- **Daily**: Review security logs
- **Weekly**: Check for dependency updates
- **Monthly**: Security metrics review
- **Quarterly**: Security audit
- **Annually**: Penetration testing

### Update Procedures
```bash
# Check for vulnerabilities
npm audit

# Update dependencies
npm update

# Fix vulnerabilities
npm audit fix

# Force fixes if needed (careful!)
npm audit fix --force
```

---

**Document Status**: Active  
**Classification**: Internal  
**Last Updated**: January 2025  
**Next Review**: Monthly  
**Owner**: Security Team  

This security implementation ensures the Care Collective platform maintains the highest standards of security, protecting community members' data and maintaining trust in the platform.