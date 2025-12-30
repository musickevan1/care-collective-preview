# API Notifications

Endpoints for notification management.

**Last Updated**: December 2025

---

## Endpoints

### GET /api/notifications

List notifications for current user.

**Authentication**: Required
**Rate Limiting**: Standard API limit

**Query Parameters**:
- `limit` (int, default: 20, max: 100): Notifications to return
- `offset` (int, default: 0): Pagination offset
- `unread_only` (boolean, default: false): Filter to unread only

**Success Response** (200):
```json
{
  "notifications": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "type": "new_message",
      "title": "New message",
      "body": "You received a new message from John",
      "link": "/messages",
      "read": false,
      "created_at": "2025-12-30T12:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 50,
    "has_more": true
  }
}
```

**Error Responses**:
- `400` - Invalid parameters
- `401` - Unauthorized

---

### POST /api/notifications/[id]/read

Mark notification as read.

**Authentication**: Required (owner only)

**Success Response** (200):
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

### POST /api/notifications/read-all

Mark all notifications as read.

**Authentication**: Required

**Success Response** (200):
```json
{
  "success": true,
  "count": 25,
  "message": "All notifications marked as read"
}
```

---

### GET /api/notifications/unread-count

Get count of unread notifications.

**Authentication**: Required

**Success Response** (200):
```json
{
  "count": 15
}
```

---

## Notification Types

| Type | Description | Link |
|-------|-------------|-------|
| `new_message` | New message received | `/messages` |
| `offer_received` | Help offer received | `/requests/[id]` |
| `offer_accepted` | Offer accepted by requester | `/messages` |
| `offer_rejected` | Offer rejected | `/messages` |
| `request_complete` | Request completed | `/my-requests` |
| `system` | System announcement | `/dashboard` |

---

## See Also

- [API Overview](./api-overview.md) - General reference
- [API Messaging](./api-messaging.md) - Messaging endpoints
- [Pages Reference](./pages-reference.md) - Messages page

---

**Last Updated**: December 2025
