# API Help Requests

Endpoints for help request management.

**Last Updated**: December 2025

---

## Endpoints

### GET /api/requests/[id]

Fetch individual help request with profile data.

**Authentication**: Required
**Rate Limiting**: Standard API limit

**Path Parameters**:
- `id` (string, UUID): Help request ID

**Success Response** (200):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "helper_id": "uuid",
  "title": "Need groceries",
  "description": "I need help picking up groceries",
  "category": "groceries",
  "urgency": "normal",
  "status": "open",
  "created_at": "2025-12-30T12:00:00.000Z",
  "profiles": {
    "id": "uuid",
    "name": "John Doe",
    "location": "Springfield, MO"
  },
  "helper": null
}
```

**Error Responses**:
- `400` - Invalid UUID format
- `401` - Unauthorized
- `404` - Request not found
- `410` - Request cancelled (Gone status)

---

### POST /api/requests/[id]/cancel

Cancel a help request.

**Authentication**: Required (owner only)

**Success Response** (200):
```json
{
  "success": true,
  "message": "Request cancelled successfully",
  "timestamp": "2025-12-30T12:00:00.000Z"
}
```

---

### POST /api/requests/[id]/complete

Mark a help request as complete.

**Authentication**: Required (owner only)

**Success Response** (200):
```json
{
  "success": true,
  "message": "Request marked as complete",
  "timestamp": "2025-12-30T12:00:00.000Z"
}
```

---

### POST /api/requests/[id]/edit

Update help request details.

**Authentication**: Required (owner only)

**Request Body**:
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "category": "transport",
  "urgency": "urgent"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Request updated successfully",
  "timestamp": "2025-12-30T12:00:00.000Z"
}
```

---

## Help Request Fields

| Field | Type | Required | Description |
|-------|-------|-----------|-------------|
| `id` | UUID | Auto | Unique identifier |
| `user_id` | UUID | Auto | Requester ID |
| `helper_id` | UUID | Optional | Assigned helper ID |
| `title` | String (5-100) | Required | Request title |
| `description` | String (max 500) | Optional | Additional details |
| `category` | Enum | Required | `groceries`, `transport`, `household`, `medical`, `other` |
| `urgency` | Enum | Default: `normal` | `normal`, `urgent`, `critical` |
| `status` | Enum | Default: `open` | `open`, `in_progress`, `closed`, `cancelled` |

## See Also

- [API Overview](./api-overview.md) - General reference
- [API Messaging](./api-messaging.md) - Conversation management
- [Pages Reference](./pages-reference.md) - Page structure

---

**Last Updated**: December 2025
