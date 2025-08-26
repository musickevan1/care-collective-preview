# API Documentation - Care Collective
*RESTful API Reference for Community Mutual Aid Platform*

## 🌐 Base Information

### Base URL
```
Production: https://care-collective.app/api
Staging: https://care-collective-staging.vercel.app/api
Development: http://localhost:3000/api
```

### Authentication
All authenticated endpoints require a valid Supabase JWT token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

### Content Type
All request bodies should be JSON:

```http
Content-Type: application/json
```

### Rate Limits
- **Authentication**: 5 requests per 15 minutes
- **General API**: 60 requests per minute
- **Form submissions**: 10 requests per minute
- **Sensitive operations**: 3 requests per minute

## 📋 Response Format

### Success Response
```json
{
  "data": <response_data>,
  "meta": {
    "timestamp": "2025-01-20T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

### Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields are invalid",
    "details": [
      {
        "field": "title",
        "message": "Title must be at least 5 characters"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-01-20T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## 🏥 Health Check Endpoints

### GET /health
Basic health check for uptime monitoring.

```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-20T10:30:00Z",
  "uptime": 86400
}
```

### GET /health/deep
Comprehensive health check including database connectivity.

```http
GET /api/health/deep
```

**Response:**
```json
{
  "status": "healthy",
  "checks": {
    "database": "healthy",
    "cache": "healthy",
    "external_services": "healthy"
  },
  "timestamp": "2025-01-20T10:30:00Z"
}
```

### GET /health/ready
Kubernetes readiness probe endpoint.

```http
GET /api/health/ready
```

**Response:**
```json
{
  "status": "ready",
  "version": "1.0.0",
  "environment": "production"
}
```

## 🔐 Authentication Endpoints

### POST /auth/logout
Logout current user session.

**Authentication:** Required

```http
POST /api/auth/logout
```

**Response:**
```json
{
  "message": "Logout successful"
}
```

**Errors:**
- `401` - Not authenticated

---

## 🙋 Help Requests API

### GET /help-requests
Retrieve paginated list of help requests.

```http
GET /api/help-requests?page=1&limit=20&status=open&category=groceries
```

**Query Parameters:**
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, max 50, default 20
- `status` (optional): Filter by status (`open`, `in_progress`, `closed`)
- `category` (optional): Filter by category
- `urgency` (optional): Filter by urgency (`normal`, `urgent`, `critical`)
- `search` (optional): Search in title and description
- `location` (optional): Filter by location
- `created_after` (optional): ISO date string
- `created_before` (optional): ISO date string

**Response:**
```json
{
  "data": [
    {
      "id": "req_abc123",
      "title": "Need help with groceries",
      "description": "Cannot get to store this week due to mobility issues",
      "category": "groceries",
      "urgency": "normal",
      "status": "open",
      "location": "Springfield, MO",
      "location_privacy": "helpers_only",
      "created_at": "2025-01-20T10:00:00Z",
      "updated_at": "2025-01-20T10:00:00Z",
      "user": {
        "id": "user_def456",
        "name": "Jane Doe",
        "avatar_url": null
      },
      "helper": null,
      "response_count": 3,
      "is_urgent": false
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "total_pages": 3,
      "has_next": true,
      "has_prev": false
    },
    "filters": {
      "status": "open",
      "category": "groceries"
    }
  }
}
```

### GET /help-requests/{id}
Get specific help request by ID.

```http
GET /api/help-requests/req_abc123
```

**Response:**
```json
{
  "data": {
    "id": "req_abc123",
    "title": "Need help with groceries",
    "description": "Cannot get to store this week due to mobility issues",
    "category": "groceries",
    "urgency": "normal",
    "status": "open",
    "location": "Springfield, MO",
    "location_privacy": "helpers_only",
    "location_override": null,
    "created_at": "2025-01-20T10:00:00Z",
    "updated_at": "2025-01-20T10:00:00Z",
    "user": {
      "id": "user_def456",
      "name": "Jane Doe",
      "bio": "Community member since 2024",
      "location": "Springfield, MO",
      "avatar_url": null,
      "karma_points": 15,
      "verified": false
    },
    "helper": null,
    "contact_exchange": null,
    "can_view_contact": false,
    "can_modify": false
  }
}
```

**Errors:**
- `404` - Request not found
- `403` - Access denied (private request)

### POST /help-requests
Create a new help request.

**Authentication:** Required

```http
POST /api/help-requests
Content-Type: application/json

{
  "title": "Need help with groceries",
  "description": "Cannot get to store this week due to mobility issues",
  "category": "groceries",
  "urgency": "normal",
  "location": "Springfield, MO",
  "location_privacy": "helpers_only",
  "location_override": null
}
```

**Request Body:**
- `title` (required): String, 5-100 characters
- `description` (optional): String, max 500 characters  
- `category` (required): Enum - see [Categories](#categories)
- `urgency` (optional): Enum (`normal`, `urgent`, `critical`), default `normal`
- `location` (optional): String, max 100 characters
- `location_privacy` (optional): Enum (`public`, `helpers_only`, `after_match`), default `helpers_only`
- `location_override` (optional): String, max 100 characters

**Response:**
```json
{
  "data": {
    "id": "req_new789",
    "title": "Need help with groceries",
    "description": "Cannot get to store this week due to mobility issues",
    "category": "groceries",
    "urgency": "normal",
    "status": "open",
    "location": "Springfield, MO",
    "location_privacy": "helpers_only",
    "created_at": "2025-01-20T11:00:00Z",
    "updated_at": "2025-01-20T11:00:00Z",
    "user_id": "user_def456"
  }
}
```

**Errors:**
- `400` - Validation error
- `401` - Not authenticated
- `429` - Too many requests

### PUT /help-requests/{id}
Update help request (owner only).

**Authentication:** Required

```http
PUT /api/help-requests/req_abc123
Content-Type: application/json

{
  "title": "Updated title",
  "description": "Updated description",
  "status": "closed"
}
```

**Request Body:**
Same as POST, plus:
- `status` (optional): Enum (`open`, `closed`) - only owner can modify

**Response:**
```json
{
  "data": {
    "id": "req_abc123",
    "title": "Updated title",
    "description": "Updated description",
    "status": "closed",
    "updated_at": "2025-01-20T12:00:00Z"
  }
}
```

**Errors:**
- `400` - Validation error
- `401` - Not authenticated
- `403` - Not authorized (not owner)
- `404` - Request not found

### DELETE /help-requests/{id}
Delete help request (owner only).

**Authentication:** Required

```http
DELETE /api/help-requests/req_abc123
```

**Response:**
```json
{
  "message": "Help request deleted successfully"
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Not authorized (not owner)
- `404` - Request not found
- `409` - Cannot delete (has active responses)

---

## 🤝 Contact Exchange API

### POST /contact-exchange
Initiate contact exchange when offering help.

**Authentication:** Required

```http
POST /api/contact-exchange
Content-Type: application/json

{
  "request_id": "req_abc123",
  "message": "I'd be happy to help with your grocery shopping!",
  "consent": true
}
```

**Request Body:**
- `request_id` (required): UUID of help request
- `message` (optional): String, 10-200 characters, message to requester
- `consent` (required): Boolean, must be `true` - explicit consent to share contact info

**Response:**
```json
{
  "data": {
    "id": "exchange_xyz789",
    "request_id": "req_abc123",
    "helper_id": "user_ghi012",
    "requester_id": "user_def456",
    "status": "active",
    "exchange_type": "display",
    "created_at": "2025-01-20T11:30:00Z",
    "contact_info": {
      "helper": {
        "name": "John Helper",
        "email": "john@example.com",
        "phone": "+1-555-0123"
      },
      "requester": {
        "name": "Jane Doe", 
        "email": "jane@example.com",
        "phone": null
      }
    },
    "message": "I'd be happy to help with your grocery shopping!"
  }
}
```

**Errors:**
- `400` - Validation error (missing consent, invalid request, etc.)
- `401` - Not authenticated
- `403` - Cannot offer help (own request, already helping, etc.)
- `404` - Request not found
- `409` - Exchange already exists

### GET /contact-exchange/{id}
Get contact exchange details (participants only).

**Authentication:** Required

```http
GET /api/contact-exchange/exchange_xyz789
```

**Response:**
```json
{
  "data": {
    "id": "exchange_xyz789",
    "request_id": "req_abc123",
    "status": "active",
    "exchange_type": "display",
    "created_at": "2025-01-20T11:30:00Z",
    "contact_info": {
      "name": "John Helper",
      "email": "john@example.com",
      "phone": "+1-555-0123"
    },
    "message": "I'd be happy to help with your grocery shopping!"
  }
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Not authorized (not participant)
- `404` - Exchange not found

### PUT /contact-exchange/{id}/status
Update exchange status (participants only).

**Authentication:** Required

```http
PUT /api/contact-exchange/exchange_xyz789/status
Content-Type: application/json

{
  "status": "completed"
}
```

**Request Body:**
- `status` (required): Enum (`active`, `completed`, `cancelled`)

**Response:**
```json
{
  "data": {
    "id": "exchange_xyz789",
    "status": "completed",
    "updated_at": "2025-01-20T15:00:00Z"
  }
}
```

---

## 👤 User Profiles API

### GET /profile/{id}
Get user profile (public information only).

```http
GET /api/profile/user_def456
```

**Response:**
```json
{
  "data": {
    "id": "user_def456",
    "name": "Jane Doe",
    "bio": "Community member passionate about mutual aid",
    "location": "Springfield, MO",
    "avatar_url": "https://example.com/avatar.jpg",
    "karma_points": 25,
    "verified": false,
    "member_since": "2024-03-15T00:00:00Z",
    "skills": [
      {
        "name": "Grocery Shopping",
        "category": "daily_tasks"
      },
      {
        "name": "Pet Care", 
        "category": "caregiving"
      }
    ],
    "stats": {
      "requests_created": 3,
      "requests_helped": 12,
      "completion_rate": 0.95
    }
  }
}
```

**Errors:**
- `404` - Profile not found
- `403` - Profile private

### GET /profile/me
Get current user's full profile.

**Authentication:** Required

```http
GET /api/profile/me
```

**Response:**
```json
{
  "data": {
    "id": "user_def456",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "bio": "Community member passionate about mutual aid",
    "location": "Springfield, MO",
    "phone": "+1-555-0456",
    "avatar_url": "https://example.com/avatar.jpg",
    "karma_points": 25,
    "verified": false,
    "preferences": {
      "email_notifications": true,
      "sms_notifications": false,
      "location_privacy": "city_only",
      "contact_sharing": "after_match"
    },
    "skills": [...],
    "availability": [...],
    "created_at": "2024-03-15T12:00:00Z",
    "updated_at": "2025-01-20T10:00:00Z"
  }
}
```

**Errors:**
- `401` - Not authenticated

### PUT /profile/me
Update current user's profile.

**Authentication:** Required

```http
PUT /api/profile/me
Content-Type: application/json

{
  "name": "Jane Smith",
  "bio": "Updated bio text",
  "location": "Springfield, MO",
  "phone": "+1-555-0789",
  "preferences": {
    "email_notifications": false,
    "location_privacy": "full_address"
  }
}
```

**Request Body:**
- `name` (optional): String, 2-50 characters
- `bio` (optional): String, max 500 characters
- `location` (optional): String, max 100 characters
- `phone` (optional): String, valid phone format
- `preferences` (optional): Object with preference settings

**Response:**
```json
{
  "data": {
    "id": "user_def456",
    "name": "Jane Smith",
    "bio": "Updated bio text",
    "updated_at": "2025-01-20T12:30:00Z"
  }
}
```

**Errors:**
- `400` - Validation error
- `401` - Not authenticated

---

## 💬 Messaging API (Future Implementation)

### GET /messages/threads
Get user's message threads.

**Authentication:** Required

```http
GET /api/messages/threads?page=1&limit=20
```

**Response:**
```json
{
  "data": [
    {
      "id": "thread_abc123",
      "request_id": "req_def456",
      "participants": [
        {
          "id": "user_123",
          "name": "John Doe"
        }
      ],
      "last_message": {
        "content": "Thanks for the help!",
        "sent_at": "2025-01-20T15:30:00Z",
        "sender_name": "John Doe"
      },
      "unread_count": 2,
      "updated_at": "2025-01-20T15:30:00Z"
    }
  ]
}
```

### GET /messages/threads/{id}
Get messages in specific thread.

**Authentication:** Required

```http
GET /api/messages/threads/thread_abc123?page=1&limit=50
```

**Response:**
```json
{
  "data": {
    "id": "thread_abc123",
    "request_id": "req_def456",
    "participants": [...],
    "messages": [
      {
        "id": "msg_789",
        "sender_id": "user_123",
        "sender_name": "John Doe",
        "content": "Hi, I can help with your request!",
        "sent_at": "2025-01-20T14:00:00Z",
        "read": true
      },
      {
        "id": "msg_790",
        "sender_id": "user_456",
        "sender_name": "Jane Doe",
        "content": "That would be great, thank you!",
        "sent_at": "2025-01-20T14:15:00Z",
        "read": true
      }
    ]
  }
}
```

### POST /messages/threads/{id}/messages
Send message to thread.

**Authentication:** Required

```http
POST /api/messages/threads/thread_abc123/messages
Content-Type: application/json

{
  "content": "What time works best for you?"
}
```

**Request Body:**
- `content` (required): String, 1-1000 characters

**Response:**
```json
{
  "data": {
    "id": "msg_791",
    "content": "What time works best for you?",
    "sent_at": "2025-01-20T16:00:00Z"
  }
}
```

---

## 🏢 Admin API

### GET /admin/stats
Get platform statistics (admin only).

**Authentication:** Required (Admin)

```http
GET /api/admin/stats?period=30d
```

**Query Parameters:**
- `period` (optional): Time period (`24h`, `7d`, `30d`, `90d`), default `30d`

**Response:**
```json
{
  "data": {
    "requests": {
      "total": 1247,
      "open": 89,
      "in_progress": 156,
      "completed": 1002
    },
    "users": {
      "total": 3456,
      "active": 892,
      "new": 67
    },
    "exchanges": {
      "total": 2103,
      "successful": 1987,
      "cancelled": 116
    },
    "categories": {
      "groceries": 456,
      "transportation": 234,
      "household": 189,
      "medical": 123
    },
    "period": "30d",
    "generated_at": "2025-01-20T16:00:00Z"
  }
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Not authorized (not admin)

### GET /admin/users
Get user list for admin management.

**Authentication:** Required (Admin)

```http
GET /api/admin/users?page=1&limit=50&search=jane&status=active
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page, max 100
- `search` (optional): Search by name or email
- `status` (optional): Filter by status
- `sort` (optional): Sort by field (`created_at`, `name`, `karma_points`)
- `order` (optional): Sort order (`asc`, `desc`)

**Response:**
```json
{
  "data": [
    {
      "id": "user_def456",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "status": "active",
      "karma_points": 25,
      "verified": false,
      "created_at": "2024-03-15T12:00:00Z",
      "last_active": "2025-01-20T10:30:00Z",
      "stats": {
        "requests_created": 3,
        "requests_helped": 12,
        "reports_against": 0
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 156
    }
  }
}
```

---

## 🎨 Categories Reference

### Available Categories

```json
{
  "categories": [
    {
      "id": "transportation",
      "label": "Transportation",
      "icon": "🚗",
      "description": "Rides, vehicle assistance, public transit help"
    },
    {
      "id": "household",
      "label": "Household Tasks", 
      "icon": "🏠",
      "description": "Cleaning, repairs, maintenance, organization"
    },
    {
      "id": "meals",
      "label": "Meal Preparation",
      "icon": "🍽️",
      "description": "Cooking, meal prep, food delivery"
    },
    {
      "id": "childcare",
      "label": "Childcare & Family",
      "icon": "👶",
      "description": "Babysitting, child activities, family support"
    },
    {
      "id": "petcare",
      "label": "Pet Care",
      "icon": "🐾",
      "description": "Pet sitting, walking, veterinary trips"
    },
    {
      "id": "technology",
      "label": "Technology Help",
      "icon": "💻",
      "description": "Computer help, phone setup, digital literacy"
    },
    {
      "id": "companionship",
      "label": "Companionship",
      "icon": "👥",
      "description": "Social visits, conversation, activities together"
    },
    {
      "id": "respite",
      "label": "Respite Care",
      "icon": "💆",
      "description": "Caregiver breaks, temporary care assistance"
    },
    {
      "id": "emotional",
      "label": "Emotional Support",
      "icon": "💝",
      "description": "Listening, counseling, mental health support"
    },
    {
      "id": "groceries",
      "label": "Groceries & Shopping",
      "icon": "🛒",
      "description": "Grocery pickup, shopping assistance, errands"
    },
    {
      "id": "medical",
      "label": "Medical & Pharmacy",
      "icon": "💊",
      "description": "Medical appointments, prescription pickup, health support"
    },
    {
      "id": "other",
      "label": "Other",
      "icon": "📋",
      "description": "Miscellaneous community support needs"
    }
  ]
}
```

## 🚨 Error Codes Reference

### Validation Errors (400)
- `VALIDATION_ERROR` - General validation failure
- `MISSING_REQUIRED_FIELD` - Required field not provided
- `INVALID_FORMAT` - Field format invalid (email, phone, etc.)
- `VALUE_TOO_LONG` - Field exceeds maximum length
- `VALUE_TOO_SHORT` - Field below minimum length
- `INVALID_ENUM_VALUE` - Value not in allowed options

### Authentication Errors (401)
- `MISSING_TOKEN` - Authorization header missing
- `INVALID_TOKEN` - JWT token invalid or expired
- `SESSION_EXPIRED` - User session expired

### Authorization Errors (403)
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
- `RESOURCE_ACCESS_DENIED` - Cannot access specific resource
- `ADMIN_REQUIRED` - Admin privileges required

### Not Found Errors (404)
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `ENDPOINT_NOT_FOUND` - API endpoint doesn't exist

### Rate Limiting Errors (429)
- `RATE_LIMIT_EXCEEDED` - Too many requests in time window
- `DAILY_LIMIT_EXCEEDED` - Daily quota reached

### Server Errors (500)
- `INTERNAL_ERROR` - General server error
- `DATABASE_ERROR` - Database connection/query error
- `EXTERNAL_SERVICE_ERROR` - Third-party service error

## 🔧 Development & Testing

### API Testing Examples

```bash
# Health check
curl -X GET http://localhost:3000/api/health

# Get help requests
curl -X GET "http://localhost:3000/api/help-requests?status=open&limit=5"

# Create help request (requires auth)
curl -X POST http://localhost:3000/api/help-requests \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Need help with groceries",
    "description": "Cannot get to store today",
    "category": "groceries",
    "urgency": "normal"
  }'

# Offer help (initiate contact exchange)
curl -X POST http://localhost:3000/api/contact-exchange \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "request_id": "req_abc123",
    "consent": true,
    "message": "I can help with this!"
  }'
```

### Rate Limit Testing

```bash
# Test rate limiting
for i in {1..15}; do
  curl -w "\n%{http_code} " -X POST http://localhost:3000/api/help-requests \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"title":"Test request '$i'","category":"other"}'
done
```

### Postman Collection
A complete Postman collection is available at:
`/docs/api/Care-Collective.postman_collection.json`

## 📚 SDK & Client Libraries

### JavaScript/TypeScript SDK

```typescript
// Install: npm install @care-collective/sdk

import { CareCollectiveAPI } from '@care-collective/sdk';

const api = new CareCollectiveAPI({
  baseURL: 'https://care-collective.app/api',
  token: 'your-jwt-token'
});

// Get help requests
const requests = await api.helpRequests.list({
  status: 'open',
  category: 'groceries',
  limit: 20
});

// Create help request
const newRequest = await api.helpRequests.create({
  title: 'Need help with groceries',
  description: 'Cannot get to store today',
  category: 'groceries',
  urgency: 'normal'
});

// Offer help
const exchange = await api.contactExchange.create({
  request_id: newRequest.id,
  consent: true,
  message: 'I can help with this!'
});
```

## 🔄 Webhooks (Future)

### Event Types
- `help_request.created`
- `help_request.updated`
- `help_request.completed`
- `contact_exchange.created`
- `contact_exchange.completed`
- `user.verified`

### Webhook Format

```json
{
  "event": "help_request.created",
  "data": {
    "id": "req_abc123",
    "title": "Need help with groceries",
    "category": "groceries",
    "urgency": "normal",
    "user_id": "user_def456"
  },
  "timestamp": "2025-01-20T10:00:00Z",
  "webhook_id": "wh_xyz789"
}
```

---

**Document Status**: Active  
**API Version**: v1  
**Last Updated**: January 2025  
**Next Review**: After major feature releases  
**Maintained by**: Development Team  

This API documentation provides comprehensive information for integrating with the Care Collective platform, enabling developers to build applications that facilitate community mutual aid and support.