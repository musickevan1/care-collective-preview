# Documentation Summary

Comprehensive API and Pages documentation for Care Collective platform.

**Last Updated**: December 2025

---

## Documentation Structure

This reference documentation is organized into focused, maintainable sections:

### Quick Start
- **[README](./README.md)** - This document (overview and quick reference)

### Page Structure
- **[Pages Reference](./pages-reference.md)** - Complete page navigation structure (1087 lines)

### API Reference
- **[API Overview](./api-overview.md)** - Authentication, rate limiting, error handling, user journeys (908 lines)
- **[API Authentication](./api-auth.md)** - Login, logout, OAuth callbacks (572 lines)
- **[API Help Requests](./api-requests.md)** - Help request management endpoints (132 lines)
- **[API Messaging](./api-messaging.md)** - Conversations and messages (214 lines)
- **[API Notifications](./api-notifications.md)** - Notification system (122 lines)
- **[API Admin](./api-admin.md)** - Admin panel endpoints (260 lines)
- **[API Health & Monitoring](./api-health-monitoring.md)** - Health checks and monitoring (219 lines)
- **[API Beta & Testing](./api-beta-testing.md)** - Beta testing and debug endpoints (282 lines)

### Legacy Documents
- **[CLAUDE.md](./CLAUDE.md)** - Copy of root CLAUDE.md (511 lines)
- **[FILE_SIZE_VIOLATIONS.md](./FILE_SIZE_VIOLATIONS.md)** - File size tracking (211 lines)

---

## Quick Reference

### Page Routes

| Route | Type | Purpose |
|--------|-------|---------|
| `/` | Public | Homepage |
| `/login`, `/signup` | Public | Authentication |
| `/dashboard`, `/profile` | Authenticated | User hub |
| `/requests`, `/messages` | Authenticated | Core features |
| `/admin/*` | Admin | Admin panel |
| `/waitlist` | Authenticated (pending) | Pending approval |
| `/access-denied` | Public | Access denied |

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

### Common API Patterns

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
  "error": "Brief error message",
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
| **Health** | 60 requests |1 min | Health checks |

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

## Navigation

### By Topic

**I want to...** → **Go to...**

- Understand page structure → [Pages Reference](./pages-reference.md)
- Learn about authentication → [API Authentication](./api-auth.md)
- Create help requests → [API Help Requests](./api-requests.md)
- Build messaging features → [API Messaging](./api-messaging.md)
- Add notifications → [API Notifications](./api-notifications.md)
- Build admin features → [API Admin](./api-admin.md)
- Monitor system health → [API Health & Monitoring](./api-health-monitoring.md)
- Test beta features → [API Beta & Testing](./api-beta-testing.md)
- Understand general patterns → [API Overview](./api-overview.md)

### By Type

**API Reference**:
- [API Overview](./api-overview.md) - Start here for general API knowledge
- [API Authentication](./api-auth.md) - Login/logout flows
- [API Help Requests](./api-requests.md) - Help request CRUD
- [API Messaging](./api-messaging.md) - Conversations/messages
- [API Notifications](./api-notifications.md) - Notification system
- [API Admin](./api-admin.md) - Admin operations
- [API Health & Monitoring](./api-health-monitoring.md) - Health checks
- [API Beta & Testing](./api-beta-testing.md) - Debug endpoints

**Page Reference**:
- [Pages Reference](./pages-reference.md) - All page routes

**Developer Guides**:
- [Getting Started](../guides/getting-started.md)
- [Testing Guide](../guides/testing.md)
- [Adding Features](../guides/adding-features.md)

---

## Documentation Standards

### File Organization

- **Max 500 lines** per file (for maintainability)
- **Focused topics** - One topic per file
- **Consistent structure** - Headers, tables, examples
- **Code examples** - TypeScript and JSON
- **Cross-references** - Links between related docs

### Naming Convention

- `api-{topic}.md` - API endpoint documentation
- `pages-reference.md` - Page navigation structure
- `api-overview.md` - General API patterns
- `README.md` - This document (index)

### Maintenance

- Update after each API change
- Review monthly for outdated content
- Remove deprecated endpoints
- Add new endpoints promptly
- Update examples as platform evolves

---

## Contributing

When adding new API endpoints:

1. **Update the appropriate reference file**:
   - Auth endpoints → `api-auth.md`
   - Help requests → `api-requests.md`
   - Messaging → `api-messaging.md`
   - Notifications → `api-notifications.md`
   - Admin → `api-admin.md`
   - Health/Monitoring → `api-health-monitoring.md`
   - Beta/Testing → `api-beta-testing.md`

2. **Include in documentation**:
   - Endpoint path and method
   - Authentication requirements
   - Request/response examples
   - Error responses
   - Use cases
   - Code examples

3. **Update this README**:
   - Add to quick reference table
   - Add to navigation by topic
   - Update last updated date

---

## Additional Resources

- [Getting Started Guide](../guides/getting-started.md) - New to project
- [Testing Guide](../guides/testing.md) - Write and run tests
- [Security Documentation](../security/) - Security patterns
- [Database Schema](../database/) - Data models
- [CLAUDE.md](/CLAUDE.md) - Full project guidelines
- [PROJECT_STATUS.md](/PROJECT_STATUS.md) - Current project status

---

**Last Updated**: December 2025
**Version**: 1.0.0
**Maintained By**: Development Team
