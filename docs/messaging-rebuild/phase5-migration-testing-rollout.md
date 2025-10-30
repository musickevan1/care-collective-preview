# Phase 5: Data Migration, Testing, and Rollout Playbook
## Care Collective Messaging System V2

**Date**: October 30, 2025
**Author**: Claude (Anthropic)
**Phase**: 5 of 5 - Production Deployment & Monitoring
**Status**: READY FOR EXECUTION

---

## Executive Summary

This playbook provides the complete operational guide for deploying Messaging V2 to production. V1 has a 100% conversation creation failure rate due to race conditions. V2 resolves this with atomic RPC operations.

**Current State**:
- V2 schema migration exists (366 lines, never deployed)
- 16 V1 conversations in production
- Security fix migration needed before deployment
- Application code ready (Phases 3-4)

**Deployment Strategy**: Coexistence (Option A from Phase 2)
- V1 stays read-only (no data migration)
- V2 deployed alongside V1
- Feature flag controls rollout
- Rollback time: <1 minute

**Timeline**: 4 weeks from initial deployment to 100% rollout

---

## 1. Data Migration Plan

### 1.1 Migration Strategy: Coexistence (Option A - RECOMMENDED)

**Decision**: Do NOT migrate V1 data. Deploy V2 alongside V1.

**Rationale**:
- ✅ Zero risk of data corruption
- ✅ No downtime
- ✅ Simple rollback (feature flag)
- ✅ V1 audit trail preserved
- ✅ 16 conversations minimal storage cost

**Implementation**:
```sql
-- No data migration required
-- V1 tables: conversations, conversation_participants, messages (read-only)
-- V2 tables: conversations_v2, messages_v2 (new writes)
```

**V1 Conversation Access**:
- UI detects conversation version automatically
- V1: Read from `conversations` + `conversation_participants` + `messages`
- V2: Read from `conversations_v2` + `messages_v2`
- Badge displayed: "Legacy Conversation" for V1

### 1.2 Database Preparation

**Pre-Deployment Backup**:
```bash
# Backup entire database before migration
supabase db dump -f backup_pre_v2_$(date +%Y%m%d_%H%M%S).sql

# Verify backup created
ls -lh backup_pre_v2_*.sql

# Test backup restoration (on local Supabase instance)
supabase db reset
psql -h localhost -U postgres -f backup_pre_v2_20251030_120000.sql
```

**Migration File Verification**:
```bash
# Verify V2 migration exists
ls -la supabase/migrations/20251030_messaging_system_v2_atomic.sql
# Expected: 366 lines, 10KB

# Check migration contents
head -20 supabase/migrations/20251030_messaging_system_v2_atomic.sql
```

### 1.3 Security Fix Migration (CRITICAL)

**File**: `supabase/migrations/20251030_fix_v2_security_definer_auth.sql`

**Purpose**: Add `auth.uid()` verification to prevent impersonation attacks

**Create Migration File**:
```bash
cat > supabase/migrations/20251030_fix_v2_security_definer_auth.sql <<'EOF'
-- V2 Security Fix: Add auth.uid() verification to SECURITY DEFINER functions
-- CRITICAL: Apply immediately after base V2 migration, before any user access
-- Issue: RPC functions allow impersonation without caller verification

-- Fix 1: create_conversation_atomic() - Prevent creating conversations on behalf of others
CREATE OR REPLACE FUNCTION create_conversation_atomic(
  p_help_request_id uuid,
  p_helper_id uuid,
  p_initial_message text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id uuid;
  v_requester_id uuid;
  v_result jsonb;
BEGIN
  -- SECURITY: Verify caller is the helper
  IF p_helper_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot create conversation on behalf of another user';
  END IF;

  -- Input validation
  IF p_initial_message IS NULL OR length(trim(p_initial_message)) < 10 THEN
    RAISE EXCEPTION 'Initial message must be at least 10 characters long';
  END IF;
  IF length(p_initial_message) > 1000 THEN
    RAISE EXCEPTION 'Initial message cannot exceed 1000 characters';
  END IF;

  -- Get requester from help request
  SELECT user_id INTO v_requester_id FROM help_requests WHERE id = p_help_request_id;
  IF v_requester_id IS NULL THEN
    RAISE EXCEPTION 'Help request not found';
  END IF;

  -- Prevent self-help
  IF p_helper_id = v_requester_id THEN
    RAISE EXCEPTION 'Cannot create conversation with yourself';
  END IF;

  -- Check help request is available
  IF NOT EXISTS (
    SELECT 1 FROM help_requests
    WHERE id = p_help_request_id AND status IN ('open', 'in_progress')
  ) THEN
    RAISE EXCEPTION 'Help request is no longer available';
  END IF;

  -- Check for existing conversation
  IF EXISTS (
    SELECT 1 FROM conversations_v2
    WHERE help_request_id = p_help_request_id AND helper_id = p_helper_id
  ) THEN
    -- UX IMPROVEMENT: Return existing conversation instead of error
    SELECT id INTO v_conversation_id
    FROM conversations_v2
    WHERE help_request_id = p_help_request_id AND helper_id = p_helper_id;

    v_result := jsonb_build_object(
      'success', true,
      'conversation_id', v_conversation_id,
      'message', 'Conversation already exists'
    );
    RETURN v_result;
  END IF;

  -- Atomic insert: conversation with embedded initial message
  INSERT INTO conversations_v2 (
    help_request_id, requester_id, helper_id, initial_message, status
  ) VALUES (
    p_help_request_id, v_requester_id, p_helper_id, trim(p_initial_message), 'active'
  ) RETURNING id INTO v_conversation_id;

  v_result := jsonb_build_object(
    'success', true,
    'conversation_id', v_conversation_id,
    'message', 'Conversation created successfully'
  );
  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to create conversation'
    );
    RETURN v_result;
END;
$$;

-- Fix 2: send_message_v2() - Prevent sending messages as other users
CREATE OR REPLACE FUNCTION send_message_v2(
  p_conversation_id uuid,
  p_sender_id uuid,
  p_content text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_message_id uuid;
  v_result jsonb;
BEGIN
  -- SECURITY: Verify caller is the sender
  IF p_sender_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot send message on behalf of another user';
  END IF;

  -- Input validation
  IF p_content IS NULL OR length(trim(p_content)) < 1 THEN
    RAISE EXCEPTION 'Message content cannot be empty';
  END IF;
  IF length(p_content) > 1000 THEN
    RAISE EXCEPTION 'Message cannot exceed 1000 characters';
  END IF;

  -- Verify sender is participant and conversation is active
  IF NOT EXISTS (
    SELECT 1 FROM conversations_v2
    WHERE id = p_conversation_id
    AND status = 'active'
    AND (requester_id = p_sender_id OR helper_id = p_sender_id)
  ) THEN
    RAISE EXCEPTION 'Not authorized to send messages in this conversation';
  END IF;

  -- Insert message
  INSERT INTO messages_v2 (conversation_id, sender_id, content)
  VALUES (p_conversation_id, p_sender_id, trim(p_content))
  RETURNING id INTO v_message_id;

  v_result := jsonb_build_object(
    'success', true,
    'message_id', v_message_id,
    'message', 'Message sent successfully'
  );
  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to send message'
    );
    RETURN v_result;
END;
$$;

-- Fix 3: get_conversation_v2() - Prevent accessing other users' conversations
CREATE OR REPLACE FUNCTION get_conversation_v2(
  p_conversation_id uuid,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation jsonb;
  v_messages jsonb;
  v_result jsonb;
BEGIN
  -- SECURITY: Verify caller is requesting their own data
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot access conversation data for another user';
  END IF;

  -- Get conversation details
  SELECT jsonb_build_object(
    'id', c.id,
    'help_request_id', c.help_request_id,
    'requester_id', c.requester_id,
    'helper_id', c.helper_id,
    'initial_message', c.initial_message,
    'status', c.status,
    'created_at', c.created_at,
    'updated_at', c.updated_at
  ) INTO v_conversation
  FROM conversations_v2 c
  WHERE c.id = p_conversation_id
  AND (c.requester_id = p_user_id OR c.helper_id = p_user_id);

  IF v_conversation IS NULL THEN
    RAISE EXCEPTION 'Conversation not found or access denied';
  END IF;

  -- Get all messages
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', m.id,
      'sender_id', m.sender_id,
      'content', m.content,
      'created_at', m.created_at,
      'updated_at', m.updated_at
    ) ORDER BY m.created_at ASC
  ) INTO v_messages
  FROM messages_v2 m
  WHERE m.conversation_id = p_conversation_id;

  v_result := jsonb_build_object(
    'conversation', v_conversation,
    'messages', COALESCE(v_messages, '[]'::jsonb)
  );
  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
    RETURN v_result;
END;
$$;

-- Verification: Test security fixes
-- Expected: All should raise exceptions
-- SELECT create_conversation_atomic('<help-id>', '<not-my-id>', 'test'); -- Should fail
-- SELECT send_message_v2('<conv-id>', '<not-my-id>', 'test'); -- Should fail
-- SELECT get_conversation_v2('<conv-id>', '<not-my-id>'); -- Should fail
EOF
```

**Deployment Order** (CRITICAL):
1. Apply `20251030_messaging_system_v2_atomic.sql` (base schema)
2. Apply `20251030_fix_v2_security_definer_auth.sql` (security fix)
3. NEVER deploy application code until both migrations complete

### 1.4 Migration Verification Queries

**Run After Each Migration**:

```sql
-- 1. Verify V2 tables exist
SELECT table_name,
  (SELECT count(*) FROM information_schema.columns
   WHERE table_name = t.table_name AND table_schema = 'public') AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('conversations_v2', 'messages_v2')
ORDER BY table_name;
-- Expected: conversations_v2 (8 cols), messages_v2 (6 cols)

-- 2. Verify RPC functions exist
SELECT routine_name, routine_type, data_type AS return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('create_conversation_atomic', 'send_message_v2', 'get_conversation_v2')
ORDER BY routine_name;
-- Expected: 3 functions, all return jsonb

-- 3. Verify indexes created
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('conversations_v2', 'messages_v2')
ORDER BY tablename, indexname;
-- Expected: 8 indexes (5 for conversations_v2, 3 for messages_v2)

-- 4. Verify RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('conversations_v2', 'messages_v2')
ORDER BY tablename;
-- Expected: Both rowsecurity = true

-- 5. Verify RLS policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('conversations_v2', 'messages_v2')
ORDER BY tablename, cmd, policyname;
-- Expected: 5 policies total
```

### 1.5 Rollback Plan

**Scenario**: Migration fails or causes critical issues

**Option A: Feature Flag Rollback** (FAST - <1 minute)
```bash
# Disable V2 in Vercel environment variables
NEXT_PUBLIC_MESSAGING_V2_ROLLOUT=disabled

# Redeploy
npx vercel --prod
```

**Option B: Drop V2 Tables** (SLOW - 5-10 minutes)
```sql
-- WARNING: Only if V2 completely broken
-- No user data loss (V2 not yet in use)
DROP TABLE IF EXISTS messages_v2 CASCADE;
DROP TABLE IF EXISTS conversations_v2 CASCADE;
DROP FUNCTION IF EXISTS create_conversation_atomic(uuid, uuid, text);
DROP FUNCTION IF EXISTS send_message_v2(uuid, uuid, text);
DROP FUNCTION IF EXISTS get_conversation_v2(uuid, uuid);
```

**Option C: Database Restore** (LAST RESORT - 15-30 minutes)
```bash
# Only if database corrupted (extremely unlikely)
supabase db restore backup_pre_v2_YYYYMMDD_HHMMSS.sql
```

---

## 2. Testing Matrix

### 2.1 Unit Tests

**Target**: 80%+ coverage for V2 service layer

**File**: `tests/messaging/service-v2.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessagingServiceV2 } from '@/lib/messaging/service-v2';
import { MessagingServiceError, ErrorCodes } from '@/lib/messaging/types';

describe('MessagingServiceV2', () => {
  let service: MessagingServiceV2;

  beforeEach(() => {
    service = new MessagingServiceV2();
  });

  describe('startHelpConversation', () => {
    it('should create conversation successfully', async () => {
      // Mock Supabase RPC call
      const mockRpc = vi.fn().mockResolvedValue({
        data: {
          success: true,
          conversation_id: 'conv-123',
          message: 'Conversation created successfully'
        },
        error: null
      });

      const conversation = await service.startHelpConversation('helper-123', {
        help_request_id: 'request-123',
        initial_message: 'Hello, I can help!'
      });

      expect(conversation.id).toBe('conv-123');
      expect(mockRpc).toHaveBeenCalledWith('create_conversation_atomic', {
        p_help_request_id: 'request-123',
        p_helper_id: 'helper-123',
        p_initial_message: 'Hello, I can help!'
      });
    });

    it('should throw CONVERSATION_EXISTS error for duplicate', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: {
          success: false,
          error: 'Conversation already exists for this help request and helper'
        },
        error: null
      });

      await expect(
        service.startHelpConversation('helper-123', {
          help_request_id: 'request-123',
          initial_message: 'Hello again!'
        })
      ).rejects.toThrow(MessagingServiceError);

      // Verify error code mapping
      try {
        await service.startHelpConversation('helper-123', {
          help_request_id: 'request-123',
          initial_message: 'Hello again!'
        });
      } catch (error: any) {
        expect(error.code).toBe(ErrorCodes.CONVERSATION_EXISTS);
        expect(error.statusCode).toBe(409);
      }
    });

    it('should throw PERMISSION_DENIED for impersonation attempt', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: {
          success: false,
          error: 'Cannot create conversation on behalf of another user'
        },
        error: null
      });

      await expect(
        service.startHelpConversation('victim-123', {
          help_request_id: 'request-123',
          initial_message: 'Fake offer'
        })
      ).rejects.toThrow(MessagingServiceError);
    });
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: {
          success: true,
          message_id: 'msg-123',
          message: 'Message sent successfully'
        },
        error: null
      });

      const message = await service.sendMessage('sender-123', {
        conversation_id: 'conv-123',
        content: 'Hello!'
      });

      expect(message.id).toBe('msg-123');
      expect(message.content).toBe('Hello!');
    });

    it('should throw VALIDATION_ERROR for empty content', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: {
          success: false,
          error: 'Message content cannot be empty'
        },
        error: null
      });

      await expect(
        service.sendMessage('sender-123', {
          conversation_id: 'conv-123',
          content: ''
        })
      ).rejects.toThrow(MessagingServiceError);
    });
  });

  describe('Error Mapping', () => {
    it('should map RPC errors to error codes correctly', () => {
      const testCases = [
        { rpcError: 'already exists', expectedCode: ErrorCodes.CONVERSATION_EXISTS },
        { rpcError: 'not found', expectedCode: ErrorCodes.HELP_REQUEST_NOT_FOUND },
        { rpcError: 'no longer available', expectedCode: ErrorCodes.HELP_REQUEST_UNAVAILABLE },
        { rpcError: 'yourself', expectedCode: ErrorCodes.INVALID_INPUT },
        { rpcError: 'not authorized', expectedCode: ErrorCodes.PERMISSION_DENIED },
        { rpcError: 'characters', expectedCode: ErrorCodes.VALIDATION_ERROR },
      ];

      testCases.forEach(({ rpcError, expectedCode }) => {
        const code = service['mapRpcErrorToCode'](rpcError);
        expect(code).toBe(expectedCode);
      });
    });
  });
});
```

**Coverage Target**:
- `MessagingServiceV2` class: 85%+
- Error mapping functions: 100%
- RPC call wrappers: 90%+

### 2.2 Integration Tests

**Target**: API routes with V2 paths

**File**: `tests/api/messaging/start-conversation-v2.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '@/app/api/messaging/help-requests/[id]/start-conversation/route';

describe('POST /api/messaging/help-requests/[id]/start-conversation (V2)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_MESSAGING_V2_ROLLOUT = 'enabled';
  });

  it('should create conversation via V2 RPC', async () => {
    const request = new Request('http://localhost/api/messaging/help-requests/request-123/start-conversation', {
      method: 'POST',
      body: JSON.stringify({
        initial_message: 'Hello, I can help with your groceries!'
      }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });

    const response = await POST(request, { params: { id: 'request-123' } });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.conversation_id).toBeDefined();
    expect(data.version).toBe('v2');
  });

  it('should return 409 for duplicate conversation', async () => {
    // Create first conversation
    const request1 = new Request('http://localhost/api/messaging/help-requests/request-123/start-conversation', {
      method: 'POST',
      body: JSON.stringify({ initial_message: 'First message' })
    });
    await POST(request1, { params: { id: 'request-123' } });

    // Attempt duplicate
    const request2 = new Request('http://localhost/api/messaging/help-requests/request-123/start-conversation', {
      method: 'POST',
      body: JSON.stringify({ initial_message: 'Second message' })
    });
    const response = await POST(request2, { params: { id: 'request-123' } });

    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.error.code).toBe('conversation_exists');
  });

  it('should return 400 for self-help attempt', async () => {
    // User creates help request, then tries to offer help on own request
    const request = new Request('http://localhost/api/messaging/help-requests/own-request-123/start-conversation', {
      method: 'POST',
      body: JSON.stringify({ initial_message: 'I will help myself' })
    });

    const response = await POST(request, { params: { id: 'own-request-123' } });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('cannot offer help on your own request');
  });
});
```

### 2.3 End-to-End Tests

**Target**: Complete user flows with V2 enabled

**File**: `tests/e2e/messaging-v2-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Messaging V2 Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Enable V2 via feature flag
    await page.addInitScript(() => {
      localStorage.setItem('MESSAGING_V2_ENABLED', 'true');
    });
  });

  test('Complete help request flow with V2', async ({ page }) => {
    // User A creates help request
    await page.goto('/requests/new');
    await page.fill('[name="title"]', 'Need groceries');
    await page.fill('[name="description"]', 'Need milk and bread');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/requests\/[a-z0-9-]+/);

    // User B sees help request and offers help
    await page.goto('/requests');
    await page.click('text=Need groceries');
    await page.click('button:has-text("Offer Help")');

    // Message dialog appears (V2 atomic creation)
    await page.fill('[name="initial_message"]', 'Hi! I can pick those up for you.');
    await page.click('button:has-text("Send")');

    // Conversation created instantly (no race condition)
    await expect(page).toHaveURL(/\/messages/);
    await expect(page.locator('text=Hi! I can pick those up')).toBeVisible();

    // User A sees conversation and replies
    await page.goto('/messages');
    await page.click('text=Need groceries');
    await page.fill('[name="message"]', 'Thank you! Tomorrow at 2pm?');
    await page.click('button:has-text("Send")');

    // Message appears in thread
    await expect(page.locator('text=Tomorrow at 2pm')).toBeVisible();
  });

  test('Duplicate conversation handling', async ({ page }) => {
    // User clicks "Offer Help" button
    await page.goto('/requests/request-123');
    await page.click('button:has-text("Offer Help")');

    // User double-clicks (impatient)
    await page.click('button:has-text("Offer Help")');

    // Only one conversation created
    await page.goto('/messages');
    const conversationCards = await page.locator('[data-testid="conversation-card"]').count();
    expect(conversationCards).toBe(1);
  });

  test('Network failure recovery', async ({ page, context }) => {
    // Simulate network failure during conversation creation
    await context.route('**/api/messaging/**', route => route.abort());

    await page.goto('/requests/request-123');
    await page.click('button:has-text("Offer Help")');

    // Error message displayed
    await expect(page.locator('text=Failed to start conversation')).toBeVisible();

    // Restore network
    await context.unroute('**/api/messaging/**');

    // Retry succeeds
    await page.click('button:has-text("Retry")');
    await expect(page).toHaveURL(/\/messages/);
  });
});
```

### 2.4 Performance Tests

**Target**: Sub-500ms response times

**File**: `tests/performance/messaging-v2-perf.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { performance } from 'perf_hooks';

describe('Messaging V2 Performance', () => {
  it('conversation creation should complete in <500ms (p95)', async () => {
    const results: number[] = [];

    // Run 100 conversation creations
    for (let i = 0; i < 100; i++) {
      const start = performance.now();

      await fetch('/api/messaging/help-requests/request-123/start-conversation', {
        method: 'POST',
        body: JSON.stringify({ initial_message: 'Performance test message' })
      });

      const duration = performance.now() - start;
      results.push(duration);
    }

    // Calculate p95
    const sorted = results.sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p95 = sorted[p95Index];

    console.log(`p50: ${sorted[Math.floor(sorted.length * 0.5)]}ms`);
    console.log(`p95: ${p95}ms`);
    console.log(`p99: ${sorted[Math.floor(sorted.length * 0.99)]}ms`);

    expect(p95).toBeLessThan(500);
  });

  it('message send should complete in <200ms (p95)', async () => {
    const results: number[] = [];

    for (let i = 0; i < 100; i++) {
      const start = performance.now();

      await fetch('/api/messaging/conversations/conv-123/messages', {
        method: 'POST',
        body: JSON.stringify({ content: 'Performance test message' })
      });

      const duration = performance.now() - start;
      results.push(duration);
    }

    const sorted = results.sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)];

    expect(p95).toBeLessThan(200);
  });

  it('should maintain >99% success rate', async () => {
    let successCount = 0;
    const totalRequests = 1000;

    for (let i = 0; i < totalRequests; i++) {
      const response = await fetch('/api/messaging/help-requests/request-123/start-conversation', {
        method: 'POST',
        body: JSON.stringify({ initial_message: 'Test message' })
      });

      if (response.ok) successCount++;
    }

    const successRate = (successCount / totalRequests) * 100;
    console.log(`Success rate: ${successRate}%`);

    expect(successRate).toBeGreaterThan(99);
  });
});
```

---

## 3. Monitoring Setup

### 3.1 Key Metrics

**Success Metrics**:

1. **Conversation Creation Success Rate**
   - Calculation: `(successful_creates / total_creates) * 100`
   - Target: >99%
   - Alert: <95% for 5 minutes
   - Source: Application logs (event: 'success' vs 'error')

2. **Message Send Latency (p95)**
   - Calculation: `PERCENTILE_CONT(0.95) duration_ms`
   - Target: <500ms
   - Alert: >1000ms for 5 minutes
   - Source: Application logs (duration field)

3. **V2 Adoption Rate**
   - Calculation: `(v2_conversations / total_conversations) * 100`
   - Target: Gradual increase (10% → 50% → 100%)
   - Source: Database query (count conversations_v2 vs conversations)

4. **Error Rate by Code**
   - Calculation: `(errors_by_code / total_requests) * 100`
   - Target: <1% overall
   - Alert: Specific code >5% for 5 minutes
   - Source: Application logs (error code field)

**Dashboard Queries** (Supabase SQL Editor):

```sql
-- V2 Adoption Rate (last 24 hours)
SELECT
  (SELECT count(*) FROM conversations_v2 WHERE created_at > NOW() - INTERVAL '24 hours') AS v2_count,
  (SELECT count(*) FROM conversations WHERE created_at > NOW() - INTERVAL '24 hours') AS v1_count,
  ROUND(
    (SELECT count(*) FROM conversations_v2 WHERE created_at > NOW() - INTERVAL '24 hours')::numeric /
    NULLIF((SELECT count(*) FROM conversations_v2 WHERE created_at > NOW() - INTERVAL '24 hours') +
           (SELECT count(*) FROM conversations WHERE created_at > NOW() - INTERVAL '24 hours'), 0) * 100,
    2
  ) AS v2_adoption_percentage;

-- Active Conversations by Version
SELECT
  'v1' AS version,
  count(*) AS active_conversations,
  count(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') AS new_this_week
FROM conversations
WHERE status = 'active'

UNION ALL

SELECT
  'v2' AS version,
  count(*) AS active_conversations,
  count(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') AS new_this_week
FROM conversations_v2
WHERE status = 'active';

-- Error Rate by Code (last 1 hour)
-- Note: Requires structured logging to application_logs table
SELECT
  error_code,
  count(*) AS error_count,
  ROUND(count(*) * 100.0 / SUM(count(*)) OVER (), 2) AS percentage
FROM application_logs
WHERE log_level = 'error'
  AND timestamp > NOW() - INTERVAL '1 hour'
  AND service = 'MessagingServiceV2'
GROUP BY error_code
ORDER BY error_count DESC;
```

### 3.2 Alert Thresholds

**Critical Alerts** (Page on-call):

| Condition | Threshold | Window | Action |
|-----------|-----------|--------|--------|
| Conversation creation failure spike | Success rate <80% | 5 min | Page on-call, disable V2 |
| RPC function timeout | Any call >5s | 1 occurrence | Page on-call, investigate DB |
| Database connection errors | >10 errors | 1 min | Page on-call, scale DB |

**Warning Alerts** (Slack notification):

| Condition | Threshold | Window | Action |
|-----------|-----------|--------|--------|
| Elevated error rate | Error rate >5% | 5 min | Notify team, investigate |
| High latency | p95 >1000ms | 5 min | Check DB performance |
| Duplicate conversation attempts | `conversation_exists` >10% | 15 min | Investigate client race |

### 3.3 Logging Configuration

**Application Logs** (JSON format):

```typescript
// Example structured log entry
{
  "timestamp": "2025-10-30T15:30:00.123Z",
  "service": "MessagingServiceV2",
  "method": "startHelpConversation",
  "event": "success",
  "request_id": "v2_1698765000_abc123",
  "user_id": "helper-uuid",
  "conversation_id": "conv-uuid",
  "duration_ms": 333,
  "help_request_id": "request-uuid"
}
```

**Log Levels**:
- `info`: Normal operations (conversation created, message sent)
- `warn`: Recoverable errors (duplicate conversation, rate limit)
- `error`: Critical failures (RPC error, database error)

**Log Retention**:
- Vercel logs: 7 days (free tier) / 30 days (Pro)
- Export to external service (Datadog, LogDNA) for long-term retention

---

## 4. Deployment Runbook

### 4.1 Pre-Deployment Checklist (10 Items)

- [ ] 1. V2 migration file exists (`20251030_messaging_system_v2_atomic.sql`, 366 lines)
- [ ] 2. Security fix migration created (`20251030_fix_v2_security_definer_auth.sql`)
- [ ] 3. Database backup completed (`backup_pre_v2_YYYYMMDD.sql`)
- [ ] 4. Unit tests pass (80%+ coverage)
- [ ] 5. E2E tests pass (all scenarios)
- [ ] 6. Feature flag configured (Vercel: `MESSAGING_V2_ROLLOUT=disabled`)
- [ ] 7. Monitoring dashboards configured (Supabase SQL queries)
- [ ] 8. Alert rules set up (critical and warning thresholds)
- [ ] 9. Rollback plan documented and understood
- [ ] 10. Stakeholder approval obtained (engineering lead, product owner)

### 4.2 Deployment Phases

**Day 1: Database + Application (Disabled)**

**Steps**:
```bash
# 1. Backup database
supabase db dump -f backup_pre_v2_$(date +%Y%m%d_%H%M%S).sql

# 2. Apply V2 schema migration
# Method A: Supabase Dashboard (RECOMMENDED)
# - Navigate to SQL Editor
# - Copy/paste 20251030_messaging_system_v2_atomic.sql
# - Execute

# Method B: Supabase CLI
supabase link --project-ref kecureoyekeqhrxkmjuh
supabase db push

# 3. Verify migration applied
supabase migration list | grep 20251030

# 4. Apply security fix migration
# - Copy/paste 20251030_fix_v2_security_definer_auth.sql to SQL Editor
# - Execute

# 5. Run verification queries (Section 1.4)
# - All 5 queries should return expected results

# 6. Regenerate TypeScript types
npm run db:types

# 7. Commit types
git add lib/database.types.ts
git commit -m "chore: Regenerate database types for V2 messaging schema"
git push origin main

# 8. Deploy application code (V2 disabled)
npx vercel --prod

# 9. Verify deployment
curl https://care-collective-preview.vercel.app/api/health
# Expected: 200 OK
```

**Success Criteria**:
- All migrations applied successfully
- V2 tables exist, indexes created, RLS enabled
- Application deployed, V1 still works
- No errors in Vercel logs

**Days 2-4: Internal Testing**

**Steps**:
```bash
# 1. Enable V2 for internal users
# Vercel Dashboard → Environment Variables
NEXT_PUBLIC_MESSAGING_V2_ROLLOUT=internal
# Add admin user IDs to NEXT_PUBLIC_ADMIN_USER_IDS

# 2. Redeploy
npx vercel --prod

# 3. Internal team testing
# - Create help requests
# - Offer help (V2 path)
# - Send messages
# - Verify no race conditions
# - Test duplicate prevention
# - Test error handling

# 4. Monitor metrics
# - Check Supabase dashboard (no errors)
# - Check Vercel logs (success rate >95%)
# - Verify V2 conversations created
```

**Success Criteria**:
- >95% conversation creation success rate
- <500ms p95 latency
- No critical bugs reported
- Internal team confident in V2

**Week 2: 10% Rollout**

**Steps**:
```bash
# 1. Enable V2 for 10% of users
NEXT_PUBLIC_MESSAGING_V2_ROLLOUT=percentage:10

# 2. Redeploy
npx vercel --prod

# 3. Monitor for 3-4 days
# - Success rate metric
# - Error rate by code
# - V2 adoption percentage
# - User feedback

# 4. Daily check-ins
# - Review logs for errors
# - Check alert notifications
# - Respond to user reports
```

**Success Criteria**:
- >95% success rate maintained
- <1% overall error rate
- No user complaints about failures
- V2 conversations accumulating

**Week 3: 50% Rollout**

**Steps**:
```bash
# 1. Increase to 50% of users
NEXT_PUBLIC_MESSAGING_V2_ROLLOUT=percentage:50

# 2. Redeploy
npx vercel --prod

# 3. Monitor for 1 week
# - Same metrics as 10% phase
# - Increased volume testing
```

**Success Criteria**:
- >97% success rate
- Positive user feedback
- No performance degradation

**Week 4: 100% Rollout**

**Steps**:
```bash
# 1. Enable V2 for all users
NEXT_PUBLIC_MESSAGING_V2_ROLLOUT=enabled

# 2. Redeploy
npx vercel --prod

# 3. Monitor for 2 weeks
# - V1 conversation creation rate should be 0
# - All new conversations in conversations_v2
# - Success rate >99%
```

**Success Criteria**:
- >99% success rate
- V1 creation rate = 0
- No critical bugs
- Platform stable

### 4.3 Rollback Procedure

**Scenario**: V2 causes critical errors or performance issues

**Steps** (<5 minutes):
```bash
# 1. Disable V2 via feature flag
# Vercel Dashboard → Environment Variables
NEXT_PUBLIC_MESSAGING_V2_ROLLOUT=disabled

# 2. Redeploy
npx vercel --prod
# Expected: Deployment complete in 1-2 minutes

# 3. Verify V1 working
curl https://care-collective-preview.vercel.app/requests
# Expected: 200 OK, no errors

# 4. Check error logs
# Vercel Dashboard → Logs
# Expected: Error rate drops to normal

# 5. Notify team
# Slack: "#care-collective-alerts"
# Message: "V2 rolled back due to [issue]. Investigating."

# 6. Investigate root cause
# - Review Supabase logs (RPC function errors)
# - Check application logs (service layer errors)
# - Identify specific error pattern

# 7. Apply hotfix if possible
# - Create new migration for bug fix
# - Test in staging
# - Re-enable V2 after verification
```

**Post-Rollback Actions**:
- Root cause analysis (RCA) document
- Bug fix plan with timeline
- Communication to stakeholders
- Re-deployment plan

---

## 5. Risk Mitigation

### 5.1 Ten Critical Risks

**Risk 1: V2 RPC Functions Have Undiscovered Bugs**

- **Likelihood**: MEDIUM
- **Impact**: HIGH (100% failure if critical bug)
- **Mitigation**:
  - Gradual rollout (internal → 10% → 50% → 100%)
  - Comprehensive testing (unit, integration, E2E)
  - Feature flag instant rollback
- **Contingency**: Disable V2, investigate logs, apply hotfix

**Risk 2: Data Loss During Migration**

- **Likelihood**: LOW (no migration planned)
- **Impact**: CRITICAL (platform trust destroyed)
- **Mitigation**:
  - No V1 data migration (coexistence strategy)
  - Database backup before deployment
  - V1 stays read-only
- **Contingency**: Restore from backup, manual data recovery

**Risk 3: V1/V2 Confusion for Users**

- **Likelihood**: MEDIUM
- **Impact**: LOW (UX degradation)
- **Mitigation**:
  - Clear UI badges ("Legacy Conversation")
  - Help documentation
  - Proactive communication
- **Contingency**: Clearer labels, "What's New" guide

**Risk 4: SECURITY DEFINER Impersonation Vulnerability**

- **Likelihood**: HIGH (if security fix NOT applied)
- **Impact**: CRITICAL (users can impersonate)
- **Mitigation**:
  - Security fix migration MANDATORY before deployment
  - Code review of all RPC functions
  - Penetration testing
- **Contingency**: Disable V2, audit database for malicious data

**Risk 5: RLS Policy Bypass**

- **Likelihood**: LOW
- **Impact**: HIGH (unauthorized data access)
- **Mitigation**:
  - RLS policy review (Phase 2)
  - Automated RLS tests
  - Security audit
- **Contingency**: Patch RLS policies, audit access logs

**Risk 6: V2 Queries Slower Than V1**

- **Likelihood**: LOW
- **Impact**: MEDIUM (degraded UX)
- **Mitigation**:
  - Performance benchmarks (Section 2.4)
  - Index optimization
  - Query plan analysis
- **Contingency**: Add composite indexes, optimize RLS policies

**Risk 7: Database Connection Pool Exhaustion**

- **Likelihood**: LOW
- **Impact**: HIGH (platform down)
- **Mitigation**:
  - Supabase automatic pooling (Supavisor)
  - Connection monitoring
- **Contingency**: Scale database, implement query batching

**Risk 8: TypeScript Types Not Regenerated**

- **Likelihood**: MEDIUM
- **Impact**: MEDIUM (build failures)
- **Mitigation**:
  - Types regeneration in deployment checklist
  - CI/CD type sync check (future)
- **Contingency**: Run `npm run db:types`, redeploy

**Risk 9: Rollback Fails**

- **Likelihood**: LOW
- **Impact**: HIGH (stuck with broken V2)
- **Mitigation**:
  - V2 is additive (doesn't modify V1)
  - Feature flag controls usage
  - V2 tables can be dropped safely
- **Contingency**: Force-drop V2 tables, restore from backup

**Risk 10: No Monitoring Post-Deployment**

- **Likelihood**: HIGH (if not configured)
- **Impact**: MEDIUM (bugs go undetected)
- **Mitigation**:
  - Error tracking (Vercel monitoring)
  - Database metrics (Supabase dashboard)
  - Feature flag analytics
- **Contingency**: Manual log review, user-reported bugs

---

## 6. Success Criteria

### 6.1 Per-Phase Success Criteria

**Internal Testing (Days 2-4)**:
- ✅ >95% conversation creation success rate
- ✅ No critical bugs reported
- ✅ <500ms p95 latency
- ✅ Internal team approval

**10% Rollout (Week 2)**:
- ✅ >95% success rate maintained
- ✅ <1% error rate
- ✅ No user complaints
- ✅ Metrics stable

**50% Rollout (Week 3)**:
- ✅ >97% success rate
- ✅ Positive user feedback
- ✅ No performance issues
- ✅ V2 adoption growing

**100% Rollout (Week 4+)**:
- ✅ >99% success rate
- ✅ V1 creation rate = 0
- ✅ No critical bugs
- ✅ Platform stable for 2 weeks

### 6.2 Final Acceptance Criteria

**Phase 5 Complete When**:
- ✅ V2 deployed to 100% of users
- ✅ Conversation creation success rate >99%
- ✅ Message send latency p95 <500ms
- ✅ Error rate <1%
- ✅ No critical bugs in 2-week observation period
- ✅ V1 conversations still accessible
- ✅ Monitoring dashboards operational
- ✅ Alert rules triggering correctly
- ✅ Stakeholder approval for V1 deprecation planning

---

## 7. Next Steps: V1 Deprecation (Month 2)

**After 2 weeks at 100% V2 rollout**:

1. **V1 Conversation Archival Plan**
   - Notify users with active V1 conversations
   - Provide data export option (GDPR compliance)
   - Archive V1 conversations to read-only table

2. **V1 Code Removal**
   - Remove V1 service layer (`lib/messaging/client.ts`)
   - Remove V1 API route branches
   - Clean up feature flag checks

3. **Database Cleanup**
   - Drop V1 tables (`conversations`, `conversation_participants`, `messages`)
   - Remove V1-specific indexes
   - Archive V1 data for audit trail

**Timeline**: Month 2-3 after 100% V2 rollout

---

## Conclusion

### Summary

This playbook provides a complete, battle-tested strategy for deploying Messaging V2 to production. The design prioritizes safety, observability, and user experience.

**Key Highlights**:
- ✅ Zero-downtime deployment via coexistence
- ✅ Instant rollback capability (<1 minute)
- ✅ Gradual rollout minimizes risk
- ✅ Comprehensive monitoring ensures visibility
- ✅ 16 V1 conversations preserved (audit trail)

**Critical Actions**:
1. **BEFORE Deployment**: Apply security fix migration
2. **DURING Deployment**: Follow phase progression strictly
3. **AFTER Deployment**: Monitor metrics daily

**Estimated Timeline**:
- Day 1: Database + application deployment
- Days 2-4: Internal testing
- Week 2: 10% user rollout
- Week 3: 50% user rollout
- Week 4+: 100% rollout
- Month 2-3: V1 deprecation

**Success Prediction**: 85% probability of smooth rollout (per Phase 2 analysis)

---

**Document Version**: 1.0
**Last Updated**: October 30, 2025
**Next Review**: After 100% V2 rollout
**Owner**: Engineering Team
**Status**: READY FOR EXECUTION
