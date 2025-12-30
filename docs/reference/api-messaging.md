# API Messaging

Endpoints for messaging and conversation management.

**Last Updated**: December 2025

---

## Endpoints

### GET /api/messaging/conversations

List user's conversations with pagination.

**Authentication**: Required
**Rate Limiting**: Standard message limit

**Query Parameters**:
- `page` (int, default: 1): Page number
- `limit` (int, default: 20, max: 50): Items per page

**Success Response** (200):
```json
{
  "conversations": [
    {
      "id": "uuid",
      "help_request_id": "uuid",
      "updated_at": "2025-12-30T12:00:00.000Z",
      "participants": [
        {
          "id": "uuid",
          "name": "John Doe"
        }
      ],
      "last_message": {
        "content": "Hello!",
        "created_at": "2025-12-30T12:00:00.000Z",
        "sender_id": "uuid"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "has_more": true
  }
}
```

**Error Responses**:
- `400` - Invalid pagination
- `401` - Unauthorized
- `429` - Rate limit exceeded

---

### POST /api/messaging/conversations

Create a new conversation.

**Authentication**: Required
**Rate Limiting**: Strict limit (10 per 15 min)

**Request Body**:
```json
{
  "recipient_id": "uuid",
  "help_request_id": "uuid",
  "initial_message": "I'd like to help with your request"
}
```

**Success Response** (201):
```json
{
  "success": true,
  "conversation_id": "uuid",
  "help_request_id": "uuid",
  "message": "Conversation created successfully"
}
```

**Error Responses**:
- `400` - Invalid data / self-messaging
- `403` - User restricted / help request closed
- `404` - Recipient or help request not found
- `409` - Conversation already exists

---

### GET /api/messaging/conversations/[id]/messages

Fetch messages for conversation.

**Authentication**: Required (participant only)

**Success Response** (200):
```json
{
  "messages": [
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "sender_id": "uuid",
      "content": "Message content",
      "created_at": "2025-12-30T12:00:00.000Z",
      "read_at": "2025-12-30T12:05:00.000Z"
    }
  ]
}
```

---

### POST /api/messaging/accept-offer

Accept a help offer.

**Authentication**: Required

**Request Body**:
```json
{
  "conversation_id": "uuid",
  "help_request_id": "uuid",
  "helper_id": "uuid"
}
```

---

### POST /api/messaging/reject-offer

Reject a help offer.

**Authentication**: Required

**Request Body**:
```json
{
  "conversation_id": "uuid",
  "help_request_id": "uuid",
  "helper_id": "uuid",
  "reason": "Not a good match"
}
```

---

### POST /api/messaging/messages/[id]/report

Report inappropriate message.

**Authentication**: Required

**Request Body**:
```json
{
  "reason": "Harassment",
  "description": "The message contains inappropriate content"
}
```

---

### GET /api/messaging/preferences

Get user's messaging preferences.

**Authentication**: Required

**Success Response** (200):
```json
{
  "allow_messages_from": "verified",
  "email_notifications": true,
  "push_notifications": true,
  "message_sound": true
}
```

---

## User Restrictions

Messaging endpoint checks `user_restrictions` table:

```typescript
{
  restriction_level: 'none' | 'limited' | 'suspended' | 'banned',
  can_send_messages: boolean,
  requires_pre_approval: boolean,
  message_limit_per_day: number
}
```

**Restrictions Applied**:
- `suspended` / `banned`: Cannot start conversations
- `limited`: Daily message limit enforced
- `requires_pre_approval`: Conversations need approval

---

## See Also

- [API Overview](./api-overview.md) - General reference
- [API Notifications](./api-notifications.md) - Notification system
- [API Admin](./api-admin.md) - Moderation endpoints

---

**Last Updated**: December 2025
