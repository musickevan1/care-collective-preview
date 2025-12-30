# API and Pages Reference

Complete reference documentation for Care Collective's page structure and API endpoints.

**Last Updated**: December 2025
**Status**: Current (Phase 2.3)

---

## Table of Contents

This reference documentation is organized into the following sections:

### Page Structure
- [Pages Reference](./pages-reference.md) - Complete page navigation structure

### API Endpoints
- [API Authentication](./api-auth.md) - Authentication and login endpoints
- [API Help Requests](./api-requests.md) - Help request management
- [API Messaging](./api-messaging.md) - Conversations and messages
- [API Notifications](./api-notifications.md) - Notification system
- [API Admin](./api-admin.md) - Admin panel endpoints
- [API Health & Monitoring](./api-health-monitoring.md) - Health checks and monitoring
- [API Beta & Testing](./api-beta-testing.md) - Beta testing and debug endpoints

### General Reference
- [API Overview](./api-overview.md) - Authentication, rate limiting, error handling, user journeys

---

## Quick Reference

### Page Routes

| Route | Auth Required | Purpose |
|--------|--------------|---------|
| `/` | No | Homepage |
| `/login`, `/signup` | No | Authentication |
| `/dashboard`, `/profile` | Yes | User pages |
| `/requests`, `/messages` | Yes | Core features |
| `/admin/*` | Admin | Admin panel |
| `/waitlist` | Yes (pending) | Pending approval |
| `/access-denied` | No | Access denied |

### API Endpoints Summary

| Category | Base Path | Purpose |
|----------|-----------|---------|
| **Auth** | `/api/auth/` | Login, logout, callback |
| **Requests** | `/api/requests/` | Help request CRUD |
| **Messaging** | `/api/messaging/` | Conversations, messages |
| **Notifications** | `/api/notifications/` | User notifications |
| **Admin** | `/api/admin/` | Admin operations |
| **Health** | `/api/health/` | Health checks |
| **Beta** | `/api/beta/` | Bug reports, testing |

### Common Patterns

All API endpoints follow these patterns:

**Request Headers**:
- `Content-Type: application/json`
- `Authorization: Bearer <token>` (for authenticated endpoints)

**Response Format**:
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-12-30T12:00:00.000Z"
}
```

**Error Response**:
```json
{
  "error": "Error message",
  "details": { ... },
  "timestamp": "2025-12-30T12:00:00.000Z"
}
```

---

## Authentication Levels

| Level | Description | Example Access |
|-------|-------------|---------------|
| **Public** | No authentication | Homepage, help docs, API health |
| **Authenticated** | Logged in user | Dashboard, requests, messages |
| **Verified** | Approved user | All authenticated features |
| **Admin** | Admin role | `/admin/*`, `/api/admin/*` |

---

## Rate Limiting

| Category | Limit | Window | Endpoints |
|----------|-------|--------|-----------|
| **Auth** | 5 requests | 15 min | Login attempts |
| **Standard** | 100 requests | 15 min | General API |
| **Message** | 50 messages | 15 min | Send messages |
| **Strict** | 10 requests | 15 min | Create conversations |
| **Health** | 60 requests | 1 min | Health checks |

When rate limited:
```json
{
  "error": "Too many requests. Please slow down.",
  "retry_after": "2025-12-30T12:15:00.000Z"
}
```

---

## HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|--------|
| 200 | OK | Successful operation |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid auth |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource |
| 410 | Gone | Resource existed but removed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected error |
| 503 | Service Unavailable | Service down |

---

## User Journey Overview

### New User Registration
```
Homepage → Signup → Email Verify → Waitlist → Admin Approve → Dashboard
```

### Help Request Flow
```
Dashboard → Create Request → List → View Details → Offer Help → Message → Complete
```

### Admin Workflow
```
Admin Panel → Review Applications → Approve/Reject → Moderate Content → Manage Users
```

---

## Development Quick Start

### Creating a New API Endpoint

1. Create route file: `app/api/[category]/[name]/route.ts`
2. Add authentication check (if needed)
3. Apply rate limiting
4. Validate input with Zod
5. Implement error handling
6. Add security headers
7. Log security events
8. Update documentation

### Example Route Structure

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  // validation schema
});

export async function GET(request: NextRequest) {
  // implementation
}

export async function POST(request: NextRequest) {
  // implementation
}
```

---

## Additional Resources

- [Getting Started Guide](../guides/getting-started.md)
- [Testing Guide](../guides/testing.md)
- [Security Documentation](../security/)
- [Database Schema](../database/)
- [CLAUDE.md](/CLAUDE.md) - Full project guidelines

---

**Last Updated**: December 2025
**Version**: 1.0.0
**Maintained By**: Development Team
