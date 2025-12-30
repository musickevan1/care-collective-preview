# API Beta & Testing

Beta testing and debug endpoints.

**Last Updated**: December 2025

---

## Use Caution

**These endpoints are for testing only.**
- Only use in development/staging
- Do not use in production
- May expose debugging information
- May be disabled in production

---

## Endpoints

### POST /api/beta/bug-report

Submit bug report during beta testing.

**Authentication**: Required

**Request Body**:
```json
{
  "title": "Button not working on mobile",
  "description": "The 'Offer Help' button doesn't respond on iOS Safari",
  "steps_to_reproduce": "1. Open request detail 2. Tap 'Offer Help' 3. Nothing happens",
  "category": "ui",
  "severity": "high",
  "browser": "iOS Safari 17",
  "url": "https://carecollective.com/requests/abc-123"
}
```

**Success Response** (201):
```json
{
  "success": true,
  "report_id": "uuid",
  "message": "Bug report submitted. Thank you for your feedback!"
}
```

**Category Values**: `ui`, `functionality`, `performance`, `security`, `other`

**Severity Values**: `low`, `medium`, `high`, `critical`

---

### POST /api/notify

Test notification system.

**Authentication**: Required

**Request Body**:
```json
{
  "user_id": "uuid",
  "type": "test",
  "message": "Test notification message"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Notification sent"
}
```

---

### GET /api/privacy/user-data

Retrieve user's personal data (GDPR compliance).

**Authentication**: Required

**Success Response** (200):
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2025-12-01T00:00:00.000Z"
  },
  "profile": {
    "location": "Springfield, MO",
    "bio": "About me"
  },
  "requests": [
    {
      "id": "uuid",
      "title": "Need groceries",
      "created_at": "2025-12-30T12:00:00.000Z"
    }
  ],
  "messages": [
    {
      "id": "uuid",
      "content": "Hello!",
      "created_at": "2025-12-30T12:00:00.000Z"
    }
  ],
  "export_date": "2025-12-30T12:00:00.000Z"
}
```

---

### POST /api/error-tracking

Report client-side errors.

**Authentication**: Not required

**Request Body**:
```json
{
  "message": "Uncaught TypeError: Cannot read property 'foo' of undefined",
  "stack": "TypeError: Cannot read property 'foo' of undefined\n  at ...",
  "url": "https://carecollective.com/dashboard",
  "line": 42,
  "column": 7,
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...",
  "additional_context": {
    "userId": "uuid",
    "component": "Dashboard"
  }
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Error tracked"
}
```

---

### GET /api/debug/my-profile

Debug endpoint for profile issues.

**Authentication**: Required

**Success Response** (200):
```json
{
  "profile": {
    "id": "uuid",
    "name": "John Doe",
    "location": "Springfield, MO"
  },
  "auth_user": {
    "id": "uuid",
    "email": "john@example.com",
    "created_at": "2025-12-01T00:00:00.000Z"
  },
  "restrictions": null,
  "verification_status": "approved"
}
```

---

### POST /api/email/test

Test email delivery system.

**Authentication**: Required

**Request Body**:
```json
{
  "to": "test@example.com",
  "subject": "Test Email",
  "body": "This is a test email"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Email sent successfully"
}
```

---

### GET /api/test-auth

Test authentication flow.

**Authentication**: Not required (tests current state)

**Success Response** (200):
```json
{
  "authenticated": true,
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "role": "user",
    "verification_status": "approved"
  },
  "timestamp": "2025-12-30T12:00:00.000Z"
}
```

---

### GET /api/test-service-role

Test service role access.

**Authentication**: Required
**Authorization**: Admin role only

**Success Response** (200):
```json
{
  "service_role_active": true,
  "permissions": [
    "select",
    "insert",
    "update",
    "delete"
  ],
  "timestamp": "2025-12-30T12:00:00.000Z"
}
```

**Error Response** (403):
```json
{
  "error": "Forbidden",
  "message": "Admin access required"
}
```

---

## Development vs Production

### Development Mode

All endpoints enabled
- Debug information included
- No rate limiting (optional)
- Verbose error messages

### Production Mode

Some endpoints disabled:
- `GET /api/debug/my-profile` → Disabled
- `GET /api/test-auth` → Disabled
- `GET /api/test-service-role` → Disabled
- `POST /api/email/test` → Admin only

---

## See Also

- [API Overview](./api-overview.md) - General reference
- [Testing Guide](../guides/testing.md) - Testing procedures
- [Security Documentation](../security/) - Security guidelines

---

**Last Updated**: December 2025
