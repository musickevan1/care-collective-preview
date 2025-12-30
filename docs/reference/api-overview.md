# API Overview

General API reference including authentication, rate limiting, error handling, and user journey flows.

**Last Updated**: December 2025

---

## Table of Contents

- [Authentication & Authorization](#authentication--authorization)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [User Journey Flows](#user-journey-flows)
- [Security Features](#security-features)
- [Development Notes](#development-notes)

---

## Authentication & Authorization

### Authentication Flow

The platform uses Supabase Auth with an additional verification layer for community safety.

#### Step 1: User Registration

**Route**: `/signup`

1. User creates account via Supabase Auth
2. Email verification sent automatically
3. `profiles.verification_status` set to `pending`

#### Step 2: Email Verification

**Route**: `/verify-email`

1. User clicks verification link from email
2. Supabase confirms email validity
3. Status remains `pending` until manual admin approval

#### Step 3: Admin Approval

**Route**: `/admin/applications`

1. Admin reviews application manually
2. Admin approves or rejects via admin panel
3. `profiles.verification_status` updated:
   - `approved` → Full access
   - `rejected` → Access denied

#### Step 4: User Login

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "status": "approved",
    "redirect": "/dashboard",
    "message": "Login successful"
  },
  "timestamp": "2025-12-30T12:00:00.000Z"
}
```

**Redirect Behavior**:
- `approved` → `/dashboard`
- `pending` → `/waitlist`
- `rejected` → `/access-denied?reason=rejected`

**Rate Limiting**: 5 attempts per 15 minutes per IP

**Security Features**:
- Email validation
- Verification status checking
- Security event logging
- Automatic rejection of blocked users

---

### Authorization Levels

| Level | Description | Required For | Access |
|-------|-------------|--------------|--------|
| **Public** | No authentication | None | Homepage, help docs, API health endpoints |
| **Authenticated** | Logged in user | Supabase session | Dashboard, requests, messages, profile |
| **Verified** | Admin-approved account | `verification_status = 'approved'` | All authenticated features + create requests |
| **Admin** | Admin role | `profiles.role = 'admin'` | `/admin/*`, `/api/admin/*` |

---

### Role-Based Access Control

#### User Roles

**`user`**: Standard authenticated user
- View help requests
- Offer help
- Send messages
- Manage profile
- View notifications

**`admin`**: Full administrative access
- All user permissions
- Approve/reject applications
- Moderate content
- Manage users (ban, suspend)
- Access all admin endpoints
- View analytics and reports

#### Verification Status

**`pending`**: Account created, awaiting admin approval
- Can login but redirected to `/waitlist`
- Cannot create requests
- Cannot send messages
- Limited access

**`approved`**: Account fully verified and active
- Full platform access
- All features available
- Standard user restrictions apply

**`rejected`**: Account denied access
- Login blocked immediately
- Redirected to `/access-denied?reason=rejected`

---

### User Restrictions

For users who need behavioral restrictions (moderation):

**Database Table**: `user_restrictions`

```typescript
{
  id: uuid;
  user_id: uuid;
  restriction_level: 'none' | 'limited' | 'suspended' | 'banned';
  can_send_messages: boolean;           // Default: true
  requires_pre_approval: boolean;        // Default: false
  message_limit_per_day: integer;       // Default: 50
  restriction_reason: text;
  expires_at: timestamptz;           // Optional
}
```

**Restriction Levels**:

| Level | Messaging | Requests | Approval Required | Duration |
|-------|----------|----------|----------------|----------|
| `none` | Unrestricted | Unrestricted | No | N/A |
| `limited` | Daily limit | Full | Optional | Configurable |
| `suspended` | Blocked | Full | N/A | Temporary |
| `banned` | Blocked | Blocked | N/A | Permanent |

---

## Rate Limiting

### Rate Limit Categories

| Category | Limit | Window | Applied To | Priority |
|----------|-------|--------|-------------|----------|
| **Auth** | 5 requests | 15 minutes | Login attempts per IP | High |
| **Standard API** | 100 requests | 15 minutes | General API endpoints | Normal |
| **Message Rate** | 50 messages | 15 minutes | Sending messages | High |
| **Strict** | 10 requests | 15 minutes | Conversation creation | High |
| **Health Check** | 60 requests | 1 minute | Health endpoints | Low |

### Rate Limit Response Format

When rate limit is exceeded, the API returns:

**HTTP Status**: `429 Too Many Requests`

**Response Body**:
```json
{
  "error": "Too many requests. Please slow down.",
  "retry_after": "2025-12-30T12:15:00.000Z"
}
```

**Response Headers**:
```
Retry-After: 900                    // Seconds until reset
X-RateLimit-Limit: 100             // Total limit
X-RateLimit-Remaining: 0           // Requests remaining
X-RateLimit-Reset: 1735560900      // Unix timestamp reset
```

### Implementation Pattern

Rate limiting uses centralized module: `lib/security/rate-limiter.ts`

```typescript
import { messageRateLimiter } from '@/lib/security/rate-limiter';

// Check rate limit for a specific user
const rateLimitResult = await messageRateLimiter.check(
  request,
  `user:${userId}`  // Unique identifier
);

if (!rateLimitResult.success) {
  return NextResponse.json(
    {
      error: 'Too many requests. Please slow down.',
      retry_after: new Date(rateLimitResult.reset).toISOString()
    },
    { status: 429 }
  );
}

// Proceed with request
```

### Rate Limit Types

**Auth Rate Limiter** (`authRateLimiter`):
- Applied to login attempts
- 5 attempts per 15 minutes per IP address
- Tracks failed attempts to prevent brute force

**Message Rate Limiter** (`messageRateLimiter`):
- Applied to message sending
- 50 messages per 15 minutes per user
- Helps prevent spam and abuse

**Strict Rate Limiter** (`strictRateLimiter`):
- Applied to sensitive operations (conversation creation)
- 10 requests per 15 minutes per user
- Prevents mass messaging campaigns

**Standard API Rate Limiter** (`apiRateLimiter`):
- Applied to general API endpoints
- 100 requests per 15 minutes
- Prevents API abuse

---

## Error Handling

### Standard Error Response Format

All API errors follow a consistent format:

```json
{
  "error": "Brief error message",
  "message": "Detailed explanation (optional)",
  "details": {
    "field": "Validation error details"
  },
  "timestamp": "2025-12-30T12:00:00.000Z",
  "request_id": "req_abc123xyz"
}
```

### HTTP Status Codes

| Code | Meaning | Example Usage |
|------|---------|---------------|
| **200** | OK | Successful GET/POST/DELETE |
| **201** | Created | Resource created successfully |
| **400** | Bad Request | Invalid input data, validation error |
| **401** | Unauthorized | Missing or invalid authentication |
| **403** | Forbidden | Insufficient permissions |
| **404** | Not Found | Resource does not exist |
| **409** | Conflict | Duplicate resource, state conflict |
| **410** | Gone | Resource existed but no longer available |
| **429** | Too Many Requests | Rate limit exceeded |
| **500** | Internal Server Error | Unexpected server error |
| **503** | Service Unavailable | Service temporarily unavailable |

### Error Categories

#### 1. Validation Errors (400)

**Cause**: Invalid request data

**Examples**:
- Missing required fields
- Invalid email format
- Invalid enum values
- Invalid UUID format

**Response**:
```json
{
  "error": "Validation Error",
  "message": "Invalid request data",
  "details": [
    {
      "path": ["email"],
      "message": "Invalid email address",
      "code": "invalid_string"
    }
  ],
  "timestamp": "2025-12-30T12:00:00.000Z"
}
```

#### 2. Authentication Errors (401)

**Cause**: Missing or invalid authentication

**Examples**:
- No session cookie
- Invalid/expired JWT token
- Session timeout

**Response**:
```json
{
  "error": "Unauthorized",
  "message": "Authentication required",
  "timestamp": "2025-12-30T12:00:00.000Z"
}
```

#### 3. Authorization Errors (403)

**Cause**: Insufficient permissions

**Examples**:
- User lacks admin role
- User restricted from action
- Resource owned by another user
- Verification status not approved

**Response**:
```json
{
  "error": "Forbidden",
  "message": "You are restricted from starting new conversations.",
  "restriction_level": "limited",
  "timestamp": "2025-12-30T12:00:00.000Z"
}
```

#### 4. Resource Errors (404)

**Cause**: Resource does not exist

**Examples**:
- Request ID not found
- User not found
- Help request not found
- Conversation not found

**Response**:
```json
{
  "error": "Not Found",
  "message": "Request not found",
  "timestamp": "2025-12-30T12:00:00.000Z"
}
```

#### 5. Rate Limit Errors (429)

**Cause**: Rate limit exceeded

**Examples**:
- Too many login attempts
- Exceeded message limits
- Conversation creation throttled

**Response**:
```json
{
  "error": "Too Many Requests",
  "message": "Please slow down",
  "retry_after": "2025-12-30T12:15:00.000Z",
  "timestamp": "2025-12-30T12:00:00.000Z"
}
```

#### 6. Server Errors (500)

**Cause**: Unexpected server error

**Examples**:
- Database connection failed
- Unhandled exception
- Internal logic error
- External API failure

**Response**:
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "timestamp": "2025-12-30T12:00:00.000Z",
  "request_id": "req_abc123xyz"
}
```

### Error Tracking & Logging

All errors are tracked through multiple channels:

**1. Console Logging**:
```typescript
console.error('[API /endpoint] Error:', error);
```

**2. Structured Logger Service**:
```typescript
Logger.getInstance().error('Operation failed', error, {
  endpoint: '/api/example',
  method: 'POST',
  category: 'api_error'
});
```

**3. Centralized Error Tracking**:
```typescript
errorTracker.captureError(error, {
  component: 'ExampleAPI',
  action: 'perform_action',
  severity: 'high',
  tags: {
    endpoint: '/api/example',
    method: 'POST',
    feature: 'example'
  },
  extra: {
    userId,
    timestamp: new Date().toISOString()
  }
});
```

**4. Security Event Logging**:
```typescript
logSecurityEvent('event_name', request, {
  userId,
  reason,
  additional_context
});
```

---

## User Journey Flows

### New User Registration Flow

```
┌─────────────┐
│ Landing Page│
│     /      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Sign Up     │
│  /signup    │
└──────┬──────┘
       │
       ▼
┌──────────────────────┐
│ Create Account      │
│ (email, password)  │
└──────┬─────────────┘
       │
       ▼
┌──────────────────────┐
│ Supabase Auth      │
│ Creates Account     │
└──────┬─────────────┘
       │
       ▼
┌──────────────────────┐
│ Email Verification  │
│ Sent to User       │
└──────┬─────────────┘
       │
       ▼
┌──────────────────────┐
│ Verify Email       │
│ /verify-email     │
└──────┬─────────────┘
       │
       ▼
┌──────────────────────┐
│ Profile Created     │
│ status='pending'   │
└──────┬─────────────┘
       │
       ▼
┌─────────────┐
│  Waitlist   │
│ /waitlist   │
└──────┬──────┘
       │
       ▼
┌──────────────────────┐
│ Admin Reviews      │
│ /admin/applications│
└──────┬─────────────┘
       │
   ┌───┴───┐
   ▼         ▼
Approved    Rejected
   │         │
   ▼         ▼
┌──────┐  ┌─────────────┐
│Dashboard│  │Access Denied│
│/dashboard│  │/access-denied│
└──────┘  └─────────────┘
```

### Help Request Lifecycle

```
┌─────────────┐
│   Login     │
│            │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Dashboard  │
│            │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Create Request    │
│ /requests/new    │
└──────┬──────────┘
       │
       ▼
┌─────────────────────┐
│ Fill Form        │
│ (title, category, │
│  urgency, desc)  │
└──────┬──────────┘
       │
       ▼
┌─────────────────────┐
│ Request Created   │
│ status='open'     │
└──────┬──────────┘
       │
       ▼
┌─────────────┐
│ Listed on  │
│ /requests   │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ User Views       │
│ /requests/[id]   │
└──────┬──────────┘
       │
       ▼
┌─────────────────────┐
│ Click "Offer     │
│     Help"       │
└──────┬──────────┘
       │
       ▼
┌─────────────────────┐
│ Start Convers.   │
│ Create conversation│
└──────┬──────────┘
       │
       ▼
┌─────────────────────┐
│ Messaging        │
│ /messages       │
└──────┬──────────┘
       │
       ▼
┌─────────────────────┐
│ Accept Offer     │
│ Assign helper    │
└──────┬──────────┘
       │
       ▼
┌─────────────────────┐
│ Complete Request │
│ status='closed'   │
└───────────────────┘
```

### Messaging Flow

```
┌─────────────┐
│ View Open  │
│ Requests   │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Click Request    │
│ /requests/[id]   │
└──────┬──────────┘
       │
       ▼
┌─────────────────────┐
│ Offer Help      │
│ Click button    │
└──────┬──────────┘
       │
       ▼
┌─────────────────────┐
│ Start Convers.  │
│ Create + initial │
└──────┬──────────┘
       │
       ▼
┌─────────────────────┐
│ Open Messages  │
│ /messages       │
└──────┬──────────┘
       │
       ▼
┌─────────────────────┐
│ View Conv List  │
│ GET /conv        │
└──────┬──────────┘
       │
       ▼
┌─────────────────────┐
│ Select Conv     │
│ GET messages     │
└──────┬──────────┘
       │
       ▼
┌─────────────────────┐
│ Send Message   │
│ POST message    │
└──────┬──────────┘
       │
       ▼
┌─────────────────────┐
│ Real-time      │
│ Supabase WS    │
└──────┬──────────┘
       │
       ▼
┌─────────────────────┐
│ Complete Help   │
│ Mark done       │
└───────────────────┘
```

### Admin Moderation Flow

```
┌─────────────┐
│ Login as   │
│  Admin     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Admin Panel│
│  /admin    │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ View Mod Queue │
│ /admin/moderation│
└──────┬──────────┘
       │
       ▼
┌─────────────────────┐
│ Review Report   │
│ View details    │
└──────┬──────────┘
       │
       ▼
┌─────────────────────┐
│ Take Action     │
│ Approve/Reject/ │
│ Ban/Delete      │
└──────┬──────────┘
       │
       ▼
┌─────────────────────┐
│ Update User    │
│ Restrictions   │
└──────┬──────────┘
       │
       ▼
┌─────────────────────┐
│ Notify User    │
│ Email + Notify  │
└───────────────────┘
```

---

## Security Features

### Input Validation

All API endpoints validate input using Zod schemas:

```typescript
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const validation = loginSchema.safeParse(requestBody);
if (!validation.success) {
  return NextResponse.json(
    {
      error: 'Validation Error',
      details: validation.error.issues
    },
    { status: 400 }
  );
}
```

### Privacy Protection

**Contact Information**:
- Never exposed without explicit consent
- Contact exchange requires user consent checkbox
- Encrypted for sensitive messages

**Message Content**:
- Moderated for PII (Personally Identifiable Information)
- Content filter for policy violations
- Option to encrypt sensitive content

**Profile Data**:
- Only public fields exposed in requests
- Private fields require consent to share

### Security Headers

All API responses include security headers:

```typescript
// Applied via middleware
addSecurityHeaders(response);

// Headers included:
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: ...
```

### Audit Logging

All security events are logged:

```typescript
logSecurityEvent('login_failed', request, {
  email,
  error: authError.message,
  timestamp: new Date().toISOString(),
  ip: request.headers.get('x-forwarded-for')
});
```

**Events Logged**:
- Login attempts (success/failure)
- Rate limit violations
- Permission denials
- User restriction changes
- Content moderation actions
- Data access attempts

---

## Development Notes

### Testing Endpoints

Use these endpoints only in development/testing:

- `GET /api/debug/my-profile` - Debug profile data
- `GET /api/test-auth` - Test authentication
- `GET /api/test-service-role` - Test admin access
- `POST /api/email/test` - Test email delivery

### Adding New Endpoints

Follow this pattern:

```typescript
// 1. Create route file
// app/api/[category]/[name]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { apiRateLimiter } from '@/lib/security/rate-limiter';

// 2. Define validation schema
const schema = z.object({
  // Define fields
});

// 3. Implement GET/POST/PUT/DELETE
export async function GET(request: NextRequest) {
  // 4. Rate limit check
  const rateLimitResponse = await apiRateLimiter.middleware(request);
  if (rateLimitResponse) return rateLimitResponse;

  // 5. Authenticate
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 6. Validate input
  const body = await request.json();
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid data', details: validation.error.issues },
      { status: 400 }
    );
  }

  // 7. Implement logic
  try {
    // Your logic here
    return NextResponse.json({ success: true });
  } catch (error) {
    // 8. Error handling
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: 'Operation failed' },
      { status: 500 }
    );
  }
}
```

### Database Connection Pattern

Always use the centralized Supabase client:

```typescript
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();

// Always use prepared queries
const { data, error } = await supabase
  .from('table_name')
  .select('column1, column2')
  .eq('field', value)
  .single();

if (error) {
  console.error('Database error:', error);
  throw new Error('Operation failed');
}

return data;
```

---

## Additional Resources

- [Pages Reference](./pages-reference.md) - Complete page navigation structure
- [API Authentication](./api-auth.md) - Authentication endpoints
- [API Help Requests](./api-requests.md) - Help request management
- [API Messaging](./api-messaging.md) - Conversations and messages
- [API Notifications](./api-notifications.md) - Notification system
- [API Admin](./api-admin.md) - Admin panel endpoints
- [API Health & Monitoring](./api-health-monitoring.md) - Health checks
- [API Beta & Testing](./api-beta-testing.md) - Beta testing endpoints

- [Getting Started Guide](../guides/getting-started.md)
- [Testing Guide](../guides/testing.md)
- [Security Documentation](../security/)
- [Database Schema](../database/)
- [CLAUDE.md](/CLAUDE.md)

---

**Last Updated**: December 2025
**Version**: 1.0.0
