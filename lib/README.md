# Library (lib/) - Core Utilities & Services

The `lib/` directory contains all core utilities, services, and business logic for the Care Collective application.

---

## 📁 Directory Structure

```
lib/
├── api/                    # API client utilities
├── auth/                   # Authentication utilities
├── config/                 # Configuration constants
├── constants/              # Application constants
├── db/                     # Database access layer
├── messaging/              # Messaging service (core client, realtime, moderation)
├── notifications/          # Notification service
├── privacy/                # Privacy control utilities
├── queries/                # Database query builders
├── security/               # Security utilities (privacy tracking, encryption)
├── supabase/              # Supabase client initialization
├── utils/                  # General utility functions
├── validations/            # Zod schema validations
├── error-tracking.ts       # Error tracking service
└── database.types.ts       # Auto-generated Supabase types
```

---

## 📋 Module Documentation

### `api/`
**Purpose**: API client utilities and helpers

**Key files**:
- API request/response handling
- Error interceptors
- Request builders

**When to use**: When making API calls from components or other services

---

### `auth/`
**Purpose**: Authentication utilities and helpers

**Key files**:
- Auth client initialization
- Session management helpers
- Permission checking utilities

**When to use**: For authentication logic, login/logout, session validation

---

### `config/`
**Purpose**: Application configuration constants

**Examples**:
- API endpoints
- Feature flags
- Environment-specific settings

**When to use**: Access config values instead of hardcoding them

---

### `constants/`
**Purpose**: Application-wide constant values

**Examples**:
- Help request categories
- Urgency levels
- Status values
- Error messages
- Validation limits

**When to use**: Instead of magic numbers or strings throughout code

**Example**:
```typescript
// ✅ GOOD
import { HELP_CATEGORIES, URGENCY_LEVELS } from '@/lib/constants';

// ❌ BAD
const category = 'groceries'; // Magic string
```

---

### `db/`
**Purpose**: Database access layer and query functions

**Key files**:
- `queries.ts` - Core query functions
- Query builders
- Data fetching utilities

**When to use**: For all database operations

**Example**:
```typescript
import { getHelpRequests, createRequest } from '@/lib/db/queries';
```

---

### `messaging/`
**Purpose**: Core messaging service and real-time communication

**Key files**:
- `client.ts` (767 lines) - Main messaging client [⚠️ NEEDS SPLIT]
- `realtime.ts` (543 lines) - WebSocket/Realtime handling [⚠️ NEEDS SPLIT]
- `moderation.ts` (597 lines) - Content moderation service [⚠️ NEEDS SPLIT]
- `encryption.ts` - Message encryption
- `types.ts` - TypeScript types

**When to use**:
- Sending/receiving messages
- Real-time updates
- Content moderation checks

**Example**:
```typescript
import { MessagingClient } from '@/lib/messaging/client';
const client = MessagingClient.getInstance();
await client.sendMessage(conversationId, content);
```

**Status**: ⚠️ Files exceed 500-line limit, refactoring needed (see FILE_SIZE_VIOLATIONS.md)

---

### `notifications/`
**Purpose**: Notification service (email, push, in-app)

**Key files**:
- Notification builders
- Delivery service
- Template handling

**When to use**: Sending notifications to users

---

### `privacy/`
**Purpose**: Privacy control utilities and user consent management

**Key files**:
- `user-controls.ts` (697 lines) - User privacy settings [⚠️ NEEDS SPLIT]
- Consent tracking
- Data deletion helpers

**When to use**: For privacy-related operations, consent management

**Example**:
```typescript
import { UserControls } from '@/lib/privacy/user-controls';
const controls = UserControls.getInstance();
await controls.getConsentStatus(userId);
```

**Status**: ⚠️ Files exceed 500-line limit, refactoring needed

---

### `queries/`
**Purpose**: Pre-built database query functions

**Organized by feature**:
- Request queries
- Message queries
- User queries
- Privacy queries

**When to use**: Instead of writing raw SQL/Supabase calls

---

### `security/`
**Purpose**: Security utilities (encryption, privacy tracking, access control)

**Key files**:
- `privacy-event-tracker.ts` (707 lines) - Privacy event logging [⚠️ NEEDS SPLIT]
- `contact-encryption.ts` - Contact info encryption
- Access control helpers

**When to use**:
- Tracking privacy events
- Encrypting sensitive data
- Access control checks

**Status**: ⚠️ Files exceed 500-line limit, refactoring needed

---

### `supabase/`
**Purpose**: Supabase client initialization and configuration

**Key files**:
- `server.ts` - Server-side Supabase client
- `client.ts` - Client-side Supabase client
- Middleware for auth

**When to use**: Import these clients for Supabase operations

**Pattern**:
```typescript
// ✅ Server components
import { createClient } from '@/lib/supabase/server';
const { data } = await createClient().from('table').select('*');

// ✅ Client components
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
```

---

### `utils/`
**Purpose**: General utility functions

**Examples**:
- Date formatting helpers
- String manipulation
- Array utilities
- Type guards

**When to use**: For common utility operations

**Note**: Keep utilities focused and small (under 50 lines each)

---

### `validations/`
**Purpose**: Zod schema definitions for data validation

**Key schemas**:
- `helpRequestSchema` - Help request validation
- `contactExchangeSchema` - Contact exchange validation
- `userSchema` - User profile validation
- `envSchema` - Environment variable validation

**When to use**: For input validation, type-safe parsing

**Example**:
```typescript
import { helpRequestSchema } from '@/lib/validations';

const validated = helpRequestSchema.parse(inputData);
```

---

### `error-tracking.ts`
**Purpose**: Centralized error tracking and reporting

**Key functions**:
- Error logging
- Sentry integration
- Error analytics

**When to use**: Logging errors for monitoring and debugging

**Example**:
```typescript
import { trackError } from '@/lib/error-tracking';
trackError(error, { context: 'messaging', userId });
```

---

### `database.types.ts`
**Purpose**: Auto-generated TypeScript types from Supabase schema

**Note**: This file is auto-generated by Supabase CLI

**Generation**:
```bash
npm run db:types
```

**When to use**: Import for type-safe database operations

**Example**:
```typescript
import { Database } from '@/lib/database.types';
type HelpRequest = Database['public']['Tables']['help_requests']['Row'];
```

---

## 🔴 Files Needing Refactoring

The following files exceed size limits and should be split:

| File | Size | Target Size | Status |
|------|------|------------|--------|
| `/lib/messaging/client.ts` | 767 lines | < 500 | [NEEDS SPLIT](../reference/FILE_SIZE_VIOLATIONS.md) |
| `/lib/messaging/moderation.ts` | 597 lines | < 500 | [NEEDS SPLIT](../reference/FILE_SIZE_VIOLATIONS.md) |
| `/lib/messaging/realtime.ts` | 543 lines | < 500 | [NEEDS SPLIT](../reference/FILE_SIZE_VIOLATIONS.md) |
| `/lib/security/privacy-event-tracker.ts` | 707 lines | < 500 | [NEEDS SPLIT](../reference/FILE_SIZE_VIOLATIONS.md) |
| `/lib/privacy/user-controls.ts` | 697 lines | < 500 | [NEEDS SPLIT](../reference/FILE_SIZE_VIOLATIONS.md) |

See [`docs/reference/FILE_SIZE_VIOLATIONS.md`](../reference/FILE_SIZE_VIOLATIONS.md) for detailed refactoring plans.

---

## 🎯 Best Practices

### 1. Keep Functions Small
```typescript
// ❌ BAD: 60 line function
export function processMessage(msg: Message) {
  // ... 60 lines of logic
}

// ✅ GOOD: Break into smaller functions
export function processMessage(msg: Message) {
  validateMessage(msg);
  enrichMessage(msg);
  storeMessage(msg);
}
```

### 2. Use Singleton Pattern Correctly
```typescript
// ✅ GOOD: Lazy-loaded singleton
export class MessagingClient {
  private static instance: MessagingClient;

  static getInstance() {
    if (!this.instance) {
      this.instance = new MessagingClient();
    }
    return this.instance;
  }

  private async getClient() {
    return await createClient(); // Lazy-load on each method call
  }
}
```

### 3. Organize by Domain
```
lib/
├── messaging/          # All messaging-related code
├── privacy/           # All privacy-related code
├── security/          # All security-related code
```

### 4. Export Type-Safe Results
```typescript
// ✅ GOOD: Type-safe with validation
import { z } from 'zod';

const resultSchema = z.object({ id: z.string(), name: z.string() });
export async function getUser(id: string) {
  const response = await fetch(...);
  return resultSchema.parse(response);
}

// ❌ BAD: Unvalidated any type
export async function getUser(id: string): Promise<any> { }
```

---

## 📚 References

- **Size Limit Violations**: See [`docs/reference/FILE_SIZE_VIOLATIONS.md`](../reference/FILE_SIZE_VIOLATIONS.md)
- **Project Guidelines**: See [`docs/reference/CLAUDE.md`](../reference/CLAUDE.md)
- **Type Definitions**: See `lib/database.types.ts`
- **Validation Schemas**: See `lib/validations/`

---

## 🔄 Refactoring Progress

**Phase**: Architecture Optimization

| Task | Status | Target Date |
|------|--------|-------------|
| Document library structure | ✅ COMPLETE | 11/15/2025 |
| Consolidate hooks directories | ✅ COMPLETE | 11/15/2025 |
| Split oversized services | ⏳ PENDING | TBD |
| Add pre-commit hooks | ⏳ PENDING | TBD |

---

**Last Updated**: November 15, 2025
**Maintainer**: Care Collective Team
**Version**: 1.0
