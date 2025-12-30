# API Admin

Administrative endpoints for platform management.

**Last Updated**: December 2025

---

## Authorization

**All admin endpoints require:**
- Authentication
- Admin role (`profiles.role = 'admin'`)

---

## Endpoints

### Applications

#### GET /api/admin/applications

List all membership applications.

**Query Parameters**:
- `status`: Filter by status (`pending`, `approved`, `rejected`)
- `page`, `limit`: Pagination

**Success Response** (200):
```json
{
  "applications": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "status": "pending",
      "submitted_at": "2025-12-30T12:00:00.000Z"
    }
  ]
}
```

#### POST /api/admin/applications

Approve or reject application.

**Request Body**:
```json
{
  "user_id": "uuid",
  "status": "approved",
  "rejection_reason": "Optional reason"
}
```

---

### Users

#### GET /api/admin/users

List all users.

**Query Parameters**:
- `page`, `limit`: Pagination
- `role`: Filter by role
- `status`: Filter by verification status
- `search`: Search by name or email

#### GET /api/admin/users/[userId]/details

Get detailed user information.

**Success Response** (200):
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "verification_status": "approved",
    "profile": {
      "location": "Springfield, MO",
      "bio": "...",
      "created_requests": 5,
      "completed_help": 10
    },
    "restrictions": {
      "restriction_level": "none"
    }
  }
}
```

#### POST /api/admin/users/[userId]/actions

Perform administrative actions.

**Request Body**:
```json
{
  "action": "ban",
  "reason": "Violated community guidelines",
  "duration": 30
}
```

**Actions**:
- `approve`: Approve pending user
- `reject`: Reject pending user
- `ban`: Ban user (permanent)
- `suspend`: Suspend user (temporary)
- `unban`: Remove ban/suspension
- `reset_password`: Send password reset

---

### Moderation

#### GET /api/admin/moderation/queue

Get moderation queue.

**Success Response** (200):
```json
{
  "queue": [
    {
      "id": "uuid",
      "type": "message",
      "reported_by": "uuid",
      "reason": "Inappropriate content",
      "status": "pending",
      "created_at": "2025-12-30T12:00:00.000Z"
    }
  ]
}
```

#### POST /api/admin/moderation/[id]/process

Process moderation report.

**Request Body**:
```json
{
  "action": "delete_content",
  "notes": "Content violated policy"
}
```

**Actions**:
- `approve`: No action needed
- `reject`: Mark as false positive
- `warning`: Send warning to user
- `delete_content`: Remove content
- `ban_user`: Ban reporting user

---

### Metrics & Reports

#### GET /api/admin/metrics

Get platform metrics.

**Success Response** (200):
```json
{
  "metrics": {
    "total_users": 1000,
    "active_users": 250,
    "total_requests": 500,
    "open_requests": 50,
    "completed_requests": 450,
    "total_conversations": 300,
    "active_conversations": 75,
    "messages_sent": 2500
  },
  "period": {
    "start": "2025-12-01T00:00:00.000Z",
    "end": "2025-12-30T00:00:00.000Z"
  }
}
```

#### GET /api/admin/stats

Get statistical data.

**Query Parameters**:
- `period`: `day` | `week` | `month` | `year`
- `metric`: Specific metric to retrieve

---

### CMS

#### Calendar Events

- `GET /api/admin/cms/calendar-events`
- `POST /api/admin/cms/calendar-events`
- `GET /api/admin/cms/calendar-events/[id]`
- `POST /api/admin/cms/calendar-events/[id]`
- `POST /api/admin/cms/calendar-events/[id]/publish`

#### Categories

- `GET /api/admin/cms/categories`
- `POST /api/admin/cms/categories`
- `GET /api/admin/cms/categories/[id]`
- `POST /api/admin/cms/categories/[id]`

#### Community Updates

- `GET /api/admin/cms/community-updates`
- `POST /api/admin/cms/community-updates`
- `GET /api/admin/cms/community-updates/[id]`
- `POST /api/admin/cms/community-updates/[id]`
- `POST /api/admin/cms/community-updates/[id]/publish`

#### Site Content

- `GET /api/admin/cms/site-content`
- `GET /api/admin/cms/site-content/[key]`
- `POST /api/admin/cms/site-content/[key]`
- `POST /api/admin/cms/site-content/[key]/publish`

---

### Export

#### GET /api/admin/export/[type]

Export data in various formats.

**Path Parameters**:
- `type`: `users` | `requests` | `conversations` | `messages`

**Query Parameters**:
- `format`: `json` | `csv` (default: `json`)
- `start_date`: ISO 8601 start date
- `end_date`: ISO 8601 end date

**Response**: File download with appropriate content-type

---

## See Also

- [API Overview](./api-overview.md) - General reference
- [Pages Reference](./pages-reference.md) - Admin pages
- [Security Documentation](../security/) - Moderation and security

---

**Last Updated**: December 2025
