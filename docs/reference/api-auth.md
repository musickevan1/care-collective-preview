# API Authentication

Authentication and authorization endpoints for the CARE Collective platform.

**Last Updated**: December 2025

---

## Table of Contents

- [POST /api/auth/login](#post-apiauthlogin)
- [POST /api/auth/logout](#post-apiauthlogout)
- [GET /api/auth/callback](#get-apiauthcallback)
- [Authentication Flow](#authentication-flow)
- [Security Features](#security-features)

---

## POST /api/auth/login

Authenticate user with email and password.

### Overview

**Rate Limiting**: 5 attempts per 15 minutes per IP address

**Authentication**: Not required

### Request

**Endpoint**: `POST /api/auth/login`

**Content-Type**: `application/json`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Validation**:
- `email` (required, string): Valid email address
- `password` (required, string): At least 1 character

### Success Response

**HTTP Status**: `200 OK`

**Response Body**:
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

**Status Values**:
- `approved`: User fully verified → Redirect to `/dashboard`
- `pending`: User awaiting approval → Redirect to `/waitlist`
- `rejected`: User access denied → Redirect to `/access-denied?reason=rejected`
- `unknown`: Unknown status → Redirect to `/waitlist` (safe default)

### Error Responses

#### 400 - Invalid Request Format

```json
{
  "error": "Validation Error",
  "message": "Invalid login credentials format",
  "errors": [
    {
      "path": ["email"],
      "message": "Invalid email address",
      "code": "invalid_string"
    }
  ],
  "timestamp": "2025-12-30T12:00:00.000Z"
}
```

#### 401 - Invalid Credentials

```json
{
  "success": false,
  "error": "Invalid login credentials",
  "timestamp": "2025-12-30T12:00:00.000Z"
}
```

#### 429 - Rate Limit Exceeded

```json
{
  "error": "Too many login attempts. Please try again later.",
  "retry_after": "2025-12-30T12:15:00.000Z",
  "timestamp": "2025-12-30T12:00:00.000Z"
}
```

#### 500 - Server Error

```json
{
  "success": false,
  "error": "An unexpected error occurred during login",
  "timestamp": "2025-12-30T12:00:00.000Z"
}
```

### Behavior

1. **Rate Limit Check**: Apply rate limit (5 attempts per 15 minutes)
2. **Validation**: Validate email format and password presence
3. **Authentication**: Attempt Supabase Auth login
4. **Profile Fetch**: Retrieve user's verification status
5. **Status Check**:
   - `rejected` → Sign out and deny access
   - `pending` → Allow login but redirect to waitlist
   - `approved` → Full access to dashboard
6. **Session Setup**: Set session cookies
7. **Logging**: Log security event
8. **Response**: Return success with redirect path

### Security Features

- **Rate Limiting**: Prevents brute force attacks
- **Email Validation**: Validates email format before auth attempt
- **Verification Status**: Checks verification before allowing access
- **Automatic Rejection**: Blocked users signed out immediately
- **Security Logging**: All attempts logged for audit trail

---

## POST /api/auth/logout

Clear user session and log out.

### Overview

**Authentication**: Required

### Request

**Endpoint**: `POST /api/auth/logout`

**Headers**:
- `Cookie`: Session cookie (automatic)

### Success Response

**HTTP Status**: `200 OK`

**Response Body**:
```json
{
  "success": true,
  "message": "Logged out successfully",
  "timestamp": "2025-12-30T12:00:00.000Z"
}
```

### Error Responses

#### 401 - Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "No active session",
  "timestamp": "2025-12-30T12:00:00.000Z"
}
```

### Behavior

1. **Auth Check**: Verify active session
2. **Supabase Sign Out**: Call Supabase sign out
3. **Cookie Clear**: Clear session cookies
4. **Logging**: Log logout event
5. **Response**: Return success

---

## GET /api/auth/callback

OAuth callback handler for external authentication providers.

### Overview

**Authentication**: Not required

**Rate Limiting**: Not applied

### Request

**Endpoint**: `GET /api/auth/callback`

**Query Parameters**:
- `code` (required, string): Authorization code from OAuth provider
- `state` (required, string): CSRF protection token

### Success Response

**HTTP Status**: `302 Found` (Redirect)

**Redirect**:
- Users with approved status → `/dashboard`
- Users with pending status → `/waitlist`

### Error Responses

#### 400 - Invalid Parameters

```json
{
  "error": "Invalid OAuth parameters",
  "message": "Missing or invalid code or state",
  "timestamp": "2025-12-30T12:00:00.000Z"
}
```

#### 401 - OAuth Failed

```json
{
  "error": "OAuth authentication failed",
  "message": "Unable to exchange authorization code",
  "timestamp": "2025-12-30T12:00:00.000Z"
}
```

### Behavior

1. **Parameter Validation**: Validate code and state presence
2. **Code Exchange**: Exchange authorization code for tokens
3. **User Lookup**: Retrieve or create user profile
4. **Status Check**: Check verification status
5. **Session Creation**: Create user session
6. **Redirect**: Redirect based on verification status

### Supported Providers

- Email/password (default)
- Additional OAuth providers can be configured in Supabase

---

## Authentication Flow

### Complete Login Flow Diagram

```
┌──────────────┐
│   User       │
│   Browser    │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ POST /api/auth/login│
│ email, password    │
└──────┬─────────────┘
       │
       ▼
┌──────────────────────┐
│  Rate Limit Check   │
│ 5 per 15 min      │
└──────┬─────────────┘
       │
   ┌───┴───┐
   ▼         ▼
 Pass      Blocked
   │         │
   ▼         ▼
┌────────────┐  ┌─────────────────┐
│ Validation │  │ 429 Response   │
│ Check     │  │ "Try again..."  │
└──────┬─────┘  └─────────────────┘
       │
   ┌───┴───┐
   ▼         ▼
 Valid     Invalid
   │         │
   ▼         ▼
┌────────────┐  ┌─────────────────┐
│ Supabase   │  │ 400 Response  │
│ Auth       │  │ "Invalid data" │
└──────┬─────┘  └─────────────────┘
       │
   ┌───┴───┐
   ▼         ▼
 Success    Failed
   │         │
   ▼         ▼
┌────────────┐  ┌─────────────────┐
│ Fetch      │  │ 401 Response  │
│ Profile    │  │ "Invalid creds"│
└──────┬─────┘  └─────────────────┘
       │
       ▼
┌──────────────────────┐
│ Check Verification  │
│ Status            │
└──────┬─────────────┘
       │
   ┌───┴────┬────────┐
   ▼         ▼        ▼
Approved   Pending  Rejected
   │         │        │
   ▼         ▼        ▼
┌──────┐ ┌──────┐ ┌──────────────┐
│Redirect││Redirect││ Sign Out    │
│/dashbd││/waitlist││ + Deny      │
└──────┘ └──────┘ └──────────────┘
```

### Registration to Login Flow

```
Signup → Email Verify → Waitlist → Admin Approve → Login → Dashboard
```

1. **Signup**: User creates account (`/signup`)
2. **Verify**: User clicks email link (`/verify-email`)
3. **Waitlist**: Profile created, status = 'pending' (`/waitlist`)
4. **Admin Approve**: Admin approves application (`/admin/applications`)
5. **Login**: User logs in with approved status (`POST /api/auth/login`)
6. **Dashboard**: Access granted (`/dashboard`)

### Logout Flow

```
Logout Request → Supabase Sign Out → Clear Cookies → Redirect to Home
```

---

## Security Features

### Input Validation

All authentication requests validated with Zod schemas:

```typescript
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
```

### Rate Limiting

**Protection Against**: Brute force attacks

**Implementation**:
- 5 attempts per 15 minutes per IP
- Sliding window algorithm
- Automatic block on exceeded limit

**Rate Limit Response**:
```json
{
  "error": "Too many login attempts",
  "retry_after": "2025-12-30T12:15:00.000Z"
}
```

### Verification Status Checking

Every login checks `profiles.verification_status`:

| Status | Behavior |
|--------|----------|
| `approved` | Full access to platform |
| `pending` | Login allowed, but redirected to `/waitlist` |
| `rejected` | Login blocked, signed out immediately |
| `unknown` | Treated as `pending` (safe default) |

### Security Event Logging

All authentication events logged:

```typescript
logSecurityEvent('login_success', request, {
  userId: user.id,
  email: user.email,
  verificationStatus: profile.verification_status
});

logSecurityEvent('login_failed', request, {
  email,
  error: authError.message
});
```

**Events Logged**:
- Successful logins
- Failed logins
- Rate limit violations
- Verification status checks
- Rejected user attempts
- Unknown status events

### Automatic Rejection

Blocked/rejected users are signed out immediately:

```typescript
if (profile.verification_status === 'rejected') {
  await supabase.auth.signOut();
  logSecurityEvent('login_blocked_rejected', request, {
    userId: authData.user.id,
    email: authData.user.email
  });
  return NextResponse.json({
    status: 'rejected',
    redirect: '/access-denied?reason=rejected',
    message: 'Access denied: Account has been rejected'
  });
}
```

### CSRF Protection

OAuth flow includes state token for CSRF protection:

```typescript
// State token generated in auth request
const state = generateRandomState();

// Validated in callback
if (request.query.state !== session.state) {
  throw new Error('CSRF token mismatch');
}
```

### Session Management

- **Session Cookies**: Set by Supabase Auth
- **Cookie Attributes**:
  - `HttpOnly`: Prevents XSS access
  - `Secure`: HTTPS only (production)
  - `SameSite`: CSRF protection
  - Max Age: Configurable

---

## Code Examples

### Login with Fetch

```typescript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword'
  }),
  credentials: 'include'  // Include cookies
});

const data = await response.json();

if (data.success) {
  window.location.href = data.data.redirect;
}
```

### Logout with Fetch

```typescript
const response = await fetch('/api/auth/logout', {
  method: 'POST',
  credentials: 'include'
});

if (response.ok) {
  window.location.href = '/';
}
```

### React Hook for Login

```typescript
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        router.push(data.data.redirect);
        router.refresh();
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
}
```

---

## Common Issues

### "Too Many Login Attempts"

**Cause**: Exceeded rate limit (5 attempts per 15 minutes)

**Solution**: Wait 15 minutes before trying again

### "Access Denied: Account Has Been Rejected"

**Cause**: Account has been rejected by admin

**Solution**: Contact support for more information

### "Account Pending Approval"

**Cause**: Account is still pending admin review

**Solution**: Wait for admin approval or contact support

---

## Additional Resources

- [API Overview](./api-overview.md) - General API reference
- [API Help Requests](./api-requests.md) - Help request endpoints
- [API Messaging](./api-messaging.md) - Messaging endpoints
- [Security Documentation](../security/) - Security implementation details
- [CLAUDE.md](/CLAUDE.md) - Full project guidelines

---

**Last Updated**: December 2025
