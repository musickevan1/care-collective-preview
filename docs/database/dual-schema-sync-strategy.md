# Dual-Schema Messaging Sync Strategy

**Status**: Active (Phase 1B)
**Created**: 2025-11-02
**Purpose**: Document the temporary V1/V2 messaging schema coexistence strategy

## Overview

The Care Collective messaging system currently maintains two parallel schemas (`messages` and `messages_v2`) with a database trigger synchronizing data between them. This is a transitional architecture implemented during the V2 messaging system rebuild.

## Architecture Decision Record (ADR)

### Context

During Phase 1B, we rebuilt the messaging system to use a simpler V2 schema. However, existing real-time subscriptions and some UI components still rely on the V1 schema. A complete cutover would have required extensive changes across the codebase.

### Decision

Implement a **dual-schema sync pattern** where:
- New messages are written to `messages_v2` (simple schema)
- A database trigger automatically syncs to `messages` (V1 schema with metadata)
- Real-time subscriptions listen to `messages` (V1) for backward compatibility
- Gradual migration path toward single-schema architecture

### Consequences

**Advantages**:
- ✅ Zero downtime migration
- ✅ Backward compatibility with existing real-time subscriptions
- ✅ Simpler write path (V2 schema has fewer fields)
- ✅ Gradual migration reduces risk

**Disadvantages**:
- ⚠️ Increased database storage (duplicate message content)
- ⚠️ Slight write overhead (trigger execution)
- ⚠️ Technical debt requiring future cleanup
- ⚠️ Potential confusion for new developers

## Schema Comparison

### messages_v2 (New - Write Target)

```sql
CREATE TABLE messages_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations_v2(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  content text NOT NULL CHECK (length(content) >= 1 AND length(content) <= 1000),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Characteristics**:
- Minimal fields (6 columns)
- Simple schema, easy to reason about
- No denormalized data (no `recipient_id`)
- Enforces content length constraints

### messages (V1 - Read Target for Real-time)

```sql
CREATE TABLE messages (
  id uuid PRIMARY KEY,
  conversation_id uuid REFERENCES conversations(id),
  sender_id uuid REFERENCES auth.users(id),
  recipient_id uuid REFERENCES auth.users(id),  -- Denormalized
  content text,
  message_type text DEFAULT 'text',
  status text DEFAULT 'sent',
  read_at timestamptz,
  moderation_status text DEFAULT 'approved',
  is_flagged boolean DEFAULT false,
  flagged_reason text,
  parent_message_id uuid,
  thread_id uuid,
  created_at timestamptz,
  updated_at timestamptz
);
```

**Characteristics**:
- Rich metadata (15+ columns)
- Denormalized `recipient_id` for query optimization
- Moderation and threading fields
- Legacy structure from initial design

## Sync Mechanism

### Trigger Function

**File**: `supabase/migrations/20251101000002_sync_messages_v2_to_messages.sql`

```sql
CREATE OR REPLACE FUNCTION sync_messages_v2_to_messages()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_conversation RECORD;
  v_recipient_id uuid;
BEGIN
  -- Get conversation details to determine recipient
  SELECT requester_id, helper_id
  INTO v_conversation
  FROM conversations_v2
  WHERE id = NEW.conversation_id;

  -- Determine recipient (opposite of sender)
  IF NEW.sender_id = v_conversation.requester_id THEN
    v_recipient_id := v_conversation.helper_id;
  ELSE
    v_recipient_id := v_conversation.requester_id;
  END IF;

  -- Insert into messages table (V1) for backward compatibility
  INSERT INTO messages (
    id, conversation_id, sender_id, recipient_id, content,
    message_type, status, moderation_status, is_flagged,
    created_at, updated_at
  ) VALUES (
    NEW.id, NEW.conversation_id, NEW.sender_id, v_recipient_id, NEW.content,
    'text', 'sent', 'approved', false,
    NEW.created_at, NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    content = EXCLUDED.content,
    updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_messages_v2_insert
  AFTER INSERT ON messages_v2
  FOR EACH ROW
  EXECUTE FUNCTION sync_messages_v2_to_messages();
```

### Sync Behavior

1. **Write Path**: Application writes to `messages_v2`
2. **Trigger Execution**: `sync_messages_v2_insert` fires
3. **Recipient Lookup**: Joins to `conversations_v2` to determine recipient
4. **Data Sync**: Inserts/updates corresponding row in `messages`
5. **Real-time Broadcast**: `messages` table change triggers Supabase real-time notification

### Performance Characteristics

- **Write Latency**: +5-10ms per insert (negligible for user experience)
- **Trigger Overhead**: Single JOIN query per message
- **Idempotency**: `ON CONFLICT DO UPDATE` handles retries
- **Transaction Safety**: Trigger runs in same transaction as INSERT

## Current Usage

### Write Operations (Use V2)

```typescript
// API Route: app/api/messaging/conversations/[id]/messages/route.ts
const result = await messagingServiceV2.sendMessage({
  conversation_id: conversationId,
  sender_id: user.id,
  content: validation.data.content
});
```

### Real-time Subscriptions (Listen to V1)

```typescript
// lib/messaging/realtime.ts
.on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',  // V1 table (receives synced data from trigger)
    filter: `conversation_id=eq.${conversationId}`
  },
  async (payload) => {
    // Handle new message...
  }
)
```

## Migration Path

### Phase 2.X: Single Schema Migration

**Target**: Q1 2026 (after public beta stability)

**Steps**:
1. Update all real-time subscriptions to listen to `messages_v2`
2. Update UI components to use `messages_v2` schema
3. Migrate historical data from `messages` → `messages_v2` (one-time migration)
4. Drop `messages` table and sync trigger
5. Rename `messages_v2` → `messages`

**Prerequisites**:
- ✅ All real-time subscriptions migrated
- ✅ All UI components using V2 schema
- ✅ No active references to V1 schema
- ✅ Comprehensive test coverage

## Monitoring & Debugging

### Verify Sync is Working

```sql
-- Check if V1 and V2 message counts match
SELECT
  (SELECT COUNT(*) FROM messages) AS v1_count,
  (SELECT COUNT(*) FROM messages_v2) AS v2_count,
  (SELECT COUNT(*) FROM messages) - (SELECT COUNT(*) FROM messages_v2) AS difference;
```

### Check for Orphaned Messages

```sql
-- Messages in V2 but not V1 (sync failure)
SELECT id, conversation_id, sender_id, created_at
FROM messages_v2
WHERE id NOT IN (SELECT id FROM messages);

-- Messages in V1 but not V2 (direct V1 writes - should not happen)
SELECT id, conversation_id, sender_id, created_at
FROM messages
WHERE id NOT IN (SELECT id FROM messages_v2);
```

### Trigger Performance Monitoring

```sql
-- Check trigger execution stats (requires pg_stat_statements extension)
SELECT
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE query LIKE '%sync_messages_v2_to_messages%'
ORDER BY mean_exec_time DESC;
```

## Known Limitations

1. **No V2 → V1 Sync for Updates**: Only INSERTs are synced. Message edits (if implemented) would require UPDATE trigger.
2. **Recipient Calculation Overhead**: Every insert requires JOIN to determine recipient.
3. **Storage Duplication**: Message content stored twice (~2x storage cost).
4. **Schema Drift Risk**: Changes to V1 schema don't auto-apply to V2.

## Best Practices

### For Developers

1. **Always write to `messages_v2`**: Never directly insert into `messages`
2. **Subscribe to `messages` for real-time**: Until full V2 migration complete
3. **Test both schemas**: Verify sync trigger works after schema changes
4. **Document new fields**: If adding to V1 schema, document sync impact

### For Database Migrations

```sql
-- ✅ GOOD: Add field to V1 with safe default
ALTER TABLE messages ADD COLUMN new_field text DEFAULT 'default_value';

-- ⚠️ CAUTION: Adding NOT NULL field without default
-- Trigger will fail if V2 doesn't provide value
ALTER TABLE messages ADD COLUMN required_field text NOT NULL;  -- Don't do this!

-- ✅ SAFE APPROACH: Add with default, then migrate
ALTER TABLE messages ADD COLUMN required_field text DEFAULT 'migrated';
-- Update trigger to provide value from V2
-- Remove default after migration complete
```

## Troubleshooting

### Issue: Messages appear in V2 but not in real-time

**Cause**: Trigger not executing or failed
**Solution**:
```sql
-- Check trigger exists
SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'sync_messages_v2_insert';

-- Re-create trigger if missing
\i supabase/migrations/20251101000002_sync_messages_v2_to_messages.sql
```

### Issue: Trigger errors with "violates foreign key constraint"

**Cause**: Conversation exists in `conversations_v2` but not `conversations`
**Solution**: Ensure conversation sync is also working (similar dual-schema pattern)

## References

- [Migration File](../../supabase/migrations/20251101000002_sync_messages_v2_to_messages.sql)
- [Phase 1B Deployment Summary](../PHASE_1B_DEPLOYMENT_SUMMARY.md)
- [Realtime Service](../../lib/messaging/realtime.ts) (lines 119-145)
- [Messaging Service V2](../../lib/messaging/messaging-service-v2.ts)

## Changelog

- **2025-11-02**: Initial documentation (Phase 1C)
- **2025-11-01**: Trigger implemented (Phase 1B)
- **2025-10-30**: V2 schema created

---

**Maintained by**: Engineering Team
**Review Cycle**: Quarterly until single-schema migration complete
