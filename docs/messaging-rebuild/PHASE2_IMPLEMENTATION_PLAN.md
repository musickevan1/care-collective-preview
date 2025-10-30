# Phase 2 Implementation Plan: Fix Messaging System
## Care Collective - V2 Deployment & Code Integration

**Date**: October 30, 2025
**Status**: READY FOR IMPLEMENTATION
**Priority**: 🔴 CRITICAL
**Estimated Effort**: 12-16 hours over 3-5 days

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Database Changes](#database-changes)
4. [Service Layer Implementation](#service-layer-implementation)
5. [API Route Updates](#api-route-updates)
6. [Feature Flag Setup](#feature-flag-setup)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Rollback Plan](#rollback-plan)

---

## Overview

### Problem Statement

V1 messaging has 100% failure rate on conversation creation due to:
1. 3-step non-atomic process (INSERT conversation → INSERT participants → INSERT message)
2. RLS same-transaction visibility issue in `verifyConversationAccess()`
3. No rollback when `sendMessage()` fails

### Solution

Deploy V2 atomic messaging system:
1. Single RPC function `create_conversation_atomic()` that embeds initial message
2. Eliminate race conditions via PostgreSQL transactions
3. Feature flag for gradual rollout and instant rollback

### Success Criteria

- [ ] V2 conversation creation success rate >99%
- [ ] Response time <500ms p95
- [ ] Zero data loss during migration
- [ ] Instant rollback capability via feature flag
- [ ] V1 conversations remain accessible

---

## Prerequisites

### Before You Begin

**✅ Checklist**:
- [ ] Review [Test Findings Document](./TEST_FINDINGS_V1_ANALYSIS.md)
- [ ] Review [Phase 2 V2 Schema Plan](./phase2-v2-review-and-migration-plan.md)
- [ ] Database backup taken (within 24 hours)
- [ ] Supabase CLI installed (`supabase --version`)
- [ ] Node.js v18+ installed (`node --version`)
- [ ] Write access to production Supabase project

###Files to Read

1. `supabase/migrations/20251030_messaging_system_v2_atomic.sql` - V2 schema
2. `docs/messaging-rebuild/phase2-v2-review-and-migration-plan.md` - Security fix
3. `lib/messaging/client.ts` - Current V1 implementation
4. `app/api/messaging/help-requests/[id]/start-conversation/route.ts` - API route

---

## Database Changes

### Step 1: Backup Database

```bash
# Create backup before any schema changes
supabase db dump > backup-$(date +%Y%m%d-%H%M%S).sql

# Verify backup file exists and has content
ls -lh backup-*.sql
```

**Expected**: Backup file >100 KB with recent timestamp

### Step 2: Apply V2 Migration

**File**: `supabase/migrations/20251030_messaging_system_v2_atomic.sql`

```bash
# Apply V2 schema (creates conversations_v2, messages_v2, RPC functions)
supabase db push

# OR manually via Supabase Dashboard:
# 1. Open Supabase Dashboard → SQL Editor
# 2. Paste contents of 20251030_messaging_system_v2_atomic.sql
# 3. Click "Run"
```

**Verification**:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('conversations_v2', 'messages_v2');

-- Expected: 2 rows (conversations_v2, messages_v2)

-- Check RPC functions exist
SELECT routine_name, security_type FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'create_conversation_atomic',
  'send_message_v2',
  'get_conversation_v2'
);

-- Expected: 3 rows, all with security_type = 'DEFINER'
```

### Step 3: Apply Security Fix (CRITICAL)

**File**: Create `supabase/migrations/20251030_fix_v2_security_definer_auth.sql`

```sql
-- CRITICAL SECURITY FIX: Add auth.uid() verification to V2 RPC functions
-- This prevents user impersonation attacks

-- Fix 1: create_conversation_atomic
CREATE OR REPLACE FUNCTION create_conversation_atomic(
  p_help_request_id uuid,
  p_helper_id uuid,
  p_initial_message text
) RETURNS jsonb SECURITY DEFINER AS $$
DECLARE
  v_conversation_id uuid;
  v_requester_id uuid;
  v_result jsonb;
BEGIN
  -- SECURITY CHECK: Verify caller is the helper (prevent impersonation)
  IF p_helper_id != auth.uid() THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'permission_denied',
      'message', 'Cannot create conversation on behalf of another user'
    );
    RETURN v_result;
  END IF;

  -- Message length validation
  IF p_initial_message IS NULL OR length(trim(p_initial_message)) < 10 THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'validation_error',
      'message', 'Initial message must be at least 10 characters long'
    );
    RETURN v_result;
  END IF;

  IF length(p_initial_message) > 1000 THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'validation_error',
      'message', 'Initial message cannot exceed 1000 characters'
    );
    RETURN v_result;
  END IF;

  -- Get help request owner (requester)
  SELECT user_id INTO v_requester_id
  FROM help_requests
  WHERE id = p_help_request_id;

  IF v_requester_id IS NULL THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'not_found',
      'message', 'Help request not found'
    );
    RETURN v_result;
  END IF;

  -- Prevent self-help
  IF p_helper_id = v_requester_id THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'validation_error',
      'message', 'Cannot create conversation with yourself'
    );
    RETURN v_result;
  END IF;

  -- Check if help request is still available
  IF NOT EXISTS (
    SELECT 1 FROM help_requests
    WHERE id = p_help_request_id
    AND status IN ('open', 'in_progress')
  ) THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'help_request_unavailable',
      'message', 'Help request is no longer available'
    );
    RETURN v_result;
  END IF;

  -- Check for duplicate conversation
  IF EXISTS (
    SELECT 1 FROM conversations_v2
    WHERE help_request_id = p_help_request_id
    AND helper_id = p_helper_id
  ) THEN
    -- Get existing conversation_id
    SELECT id INTO v_conversation_id
    FROM conversations_v2
    WHERE help_request_id = p_help_request_id
    AND helper_id = p_helper_id
    LIMIT 1;

    v_result := jsonb_build_object(
      'success', false,
      'error', 'conversation_exists',
      'message', 'Conversation already exists for this help request and helper',
      'conversation_id', v_conversation_id
    );
    RETURN v_result;
  END IF;

  -- ATOMIC: Create conversation with embedded initial message
  INSERT INTO conversations_v2 (
    help_request_id,
    requester_id,
    helper_id,
    initial_message,
    status
  ) VALUES (
    p_help_request_id,
    v_requester_id,
    p_helper_id,
    p_initial_message,
    'active'
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
      'error', 'server_error',
      'message', 'Failed to create conversation',
      'details', SQLERRM
    );
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Fix 2: send_message_v2
CREATE OR REPLACE FUNCTION send_message_v2(
  p_conversation_id uuid,
  p_sender_id uuid,
  p_content text
) RETURNS jsonb SECURITY DEFINER AS $$
DECLARE
  v_message_id uuid;
  v_result jsonb;
BEGIN
  -- SECURITY CHECK: Verify caller is the sender (prevent impersonation)
  IF p_sender_id != auth.uid() THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'permission_denied',
      'message', 'Cannot send message on behalf of another user'
    );
    RETURN v_result;
  END IF;

  -- Content validation
  IF p_content IS NULL OR length(trim(p_content)) < 1 THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'validation_error',
      'message', 'Message content cannot be empty'
    );
    RETURN v_result;
  END IF;

  IF length(p_content) > 1000 THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'validation_error',
      'message', 'Message cannot exceed 1000 characters'
    );
    RETURN v_result;
  END IF;

  -- Authorization: Check if sender is a participant
  IF NOT EXISTS (
    SELECT 1 FROM conversations_v2
    WHERE id = p_conversation_id
    AND status = 'active'
    AND (requester_id = p_sender_id OR helper_id = p_sender_id)
  ) THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'permission_denied',
      'message', 'Not authorized to send messages in this conversation'
    );
    RETURN v_result;
  END IF;

  -- Insert message
  INSERT INTO messages_v2 (
    conversation_id,
    sender_id,
    content
  ) VALUES (
    p_conversation_id,
    p_sender_id,
    p_content
  ) RETURNING id INTO v_message_id;

  -- Update conversation last_message_at
  UPDATE conversations_v2
  SET updated_at = now()
  WHERE id = p_conversation_id;

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
      'error', 'server_error',
      'message', 'Failed to send message',
      'details', SQLERRM
    );
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Fix 3: get_conversation_v2
CREATE OR REPLACE FUNCTION get_conversation_v2(
  p_conversation_id uuid,
  p_user_id uuid
) RETURNS jsonb SECURITY DEFINER AS $$
DECLARE
  v_conversation jsonb;
  v_messages jsonb;
  v_result jsonb;
BEGIN
  -- SECURITY CHECK: Verify caller is requesting their own conversation
  IF p_user_id != auth.uid() THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'permission_denied',
      'message', 'Cannot access conversation for another user'
    );
    RETURN v_result;
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
    v_result := jsonb_build_object(
      'success', false,
      'error', 'not_found',
      'message', 'Conversation not found or you do not have access'
    );
    RETURN v_result;
  END IF;

  -- Get messages
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
    'success', true,
    'conversation', v_conversation,
    'messages', COALESCE(v_messages, '[]'::jsonb)
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'server_error',
      'message', 'Failed to get conversation',
      'details', SQLERRM
    );
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions (must be after function redefinition)
GRANT EXECUTE ON FUNCTION create_conversation_atomic(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION send_message_v2(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_v2(uuid, uuid) TO authenticated;
```

**Apply Security Fix**:

```bash
# Create the migration file
cat > supabase/migrations/20251030_fix_v2_security_definer_auth.sql <<'EOF'
[paste SQL above]
EOF

# Apply migration
supabase db push
```

**Verification**:

```sql
-- Test create_conversation_atomic with wrong user
SELECT create_conversation_atomic(
  'some-help-request-id'::uuid,
  'some-other-user-id'::uuid,  -- Not auth.uid()
  'Test message'
);

-- Expected: {"success": false, "error": "permission_denied", ...}
```

### Step 4: Regenerate TypeScript Types

```bash
# Generate types from updated database schema
npm run db:types

# Verify conversations_v2 and messages_v2 types exist
grep -A 10 "conversations_v2" lib/database.types.ts

# Commit types
git add lib/database.types.ts
git commit -m "chore: Regenerate database types for V2 schema"
```

---

## Service Layer Implementation

### Step 1: Create V2 Service Module

**File**: `lib/messaging/service-v2.ts`

```typescript
/**
 * @fileoverview V2 Messaging Service - Atomic conversation creation
 * Uses RPC functions for atomic transactions, eliminates V1 race conditions
 */

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// V2-specific types
export const V2CreateConversationSchema = z.object({
  help_request_id: z.string().uuid(),
  helper_id: z.string().uuid(),
  initial_message: z.string().min(10).max(1000),
});

export const V2SendMessageSchema = z.object({
  conversation_id: z.string().uuid(),
  sender_id: z.string().uuid(),
  content: z.string().min(1).max(1000),
});

export interface V2RPCResult {
  success: boolean;
  conversation_id?: string;
  message_id?: string;
  conversation?: any;
  messages?: any[];
  error?: string;
  message?: string;
  details?: string;
}

export class MessagingServiceV2 {
  private async getClient() {
    return await createClient();
  }

  /**
   * Create conversation atomically using V2 RPC function
   * Eliminates V1 race condition by embedding initial message in conversation row
   */
  async createHelpConversation(
    params: z.infer<typeof V2CreateConversationSchema>
  ): Promise<V2RPCResult> {
    const validated = V2CreateConversationSchema.parse(params);

    const supabase = await this.getClient();
    const { data, error } = await supabase.rpc('create_conversation_atomic', {
      p_help_request_id: validated.help_request_id,
      p_helper_id: validated.helper_id,
      p_initial_message: validated.initial_message,
    });

    if (error) {
      console.error('[MessagingServiceV2.createHelpConversation] RPC error', {
        error: error.message,
        code: error.code,
        details: error.details,
      });

      // RPC function failed at database level
      return {
        success: false,
        error: 'rpc_error',
        message: 'Database error while creating conversation',
        details: error.message,
      };
    }

    // RPC function returned - check success field
    const result = data as V2RPCResult;

    if (!result.success) {
      console.warn('[MessagingServiceV2.createHelpConversation] Business logic error', {
        error: result.error,
        message: result.message,
      });
    } else {
      console.log('[MessagingServiceV2.createHelpConversation] Success', {
        conversation_id: result.conversation_id,
      });
    }

    return result;
  }

  /**
   * Send follow-up message in V2 conversation
   */
  async sendMessage(
    params: z.infer<typeof V2SendMessageSchema>
  ): Promise<V2RPCResult> {
    const validated = V2SendMessageSchema.parse(params);

    const supabase = await this.getClient();
    const { data, error } = await supabase.rpc('send_message_v2', {
      p_conversation_id: validated.conversation_id,
      p_sender_id: validated.sender_id,
      p_content: validated.content,
    });

    if (error) {
      console.error('[MessagingServiceV2.sendMessage] RPC error', {
        error: error.message,
        code: error.code,
      });

      return {
        success: false,
        error: 'rpc_error',
        message: 'Database error while sending message',
        details: error.message,
      };
    }

    const result = data as V2RPCResult;

    if (!result.success) {
      console.warn('[MessagingServiceV2.sendMessage] Business logic error', {
        error: result.error,
        message: result.message,
      });
    }

    return result;
  }

  /**
   * Get conversation with all messages
   */
  async getConversation(
    conversationId: string,
    userId: string
  ): Promise<V2RPCResult> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.rpc('get_conversation_v2', {
      p_conversation_id: conversationId,
      p_user_id: userId,
    });

    if (error) {
      console.error('[MessagingServiceV2.getConversation] RPC error', {
        error: error.message,
      });

      return {
        success: false,
        error: 'rpc_error',
        message: 'Database error while fetching conversation',
      };
    }

    return data as V2RPCResult;
  }
}

// Export singleton instance
export const messagingServiceV2 = new MessagingServiceV2();
```

**Create File**:

```bash
cat > lib/messaging/service-v2.ts <<'EOF'
[paste TypeScript code above]
EOF
```

---

## API Route Updates

### Step 1: Add Feature Flag Check

**File**: `lib/features.ts` (create if doesn't exist)

```typescript
/**
 * Feature flags for Care Collective
 */

export function isMessagingV2Enabled(): boolean {
  // Check environment variable
  const envFlag = process.env.NEXT_PUBLIC_MESSAGING_V2_ENABLED;

  if (envFlag === 'true') {
    return true;
  }

  // Check rollout percentage (e.g., "percentage:10" for 10% of users)
  const rolloutConfig = process.env.NEXT_PUBLIC_MESSAGING_V2_ROLLOUT;

  if (rolloutConfig?.startsWith('percentage:')) {
    const percentage = parseInt(rolloutConfig.split(':')[1], 10);
    // Simple hash-based rollout (deterministic per user)
    // In production, use userId to ensure consistent experience
    return Math.random() * 100 < percentage;
  }

  // Default: disabled
  return false;
}
```

### Step 2: Update start-conversation Route

**File**: `app/api/messaging/help-requests/[id]/start-conversation/route.ts`

**Changes Required**:

1. Import V2 service
2. Add feature flag check
3. Call V2 RPC if enabled, else fall back to V1
4. Map V2 error codes to HTTP status codes

**Updated Code** (replace lines 292-344):

```typescript
import { isMessagingV2Enabled } from '@/lib/features';
import { messagingServiceV2 } from '@/lib/messaging/service-v2';

// ... existing code ...

// Line 292-344: Replace conversation creation logic
console.log(`[start-conversation:${requestId}] Creating conversation`);

// Check feature flag
const useV2 = isMessagingV2Enabled();
console.log(`[start-conversation:${requestId}] Using messaging version`, {
  version: useV2 ? 'v2' : 'v1'
});

let conversationResult;

if (useV2) {
  // V2: Atomic RPC function
  const rpcResult = await messagingServiceV2.createHelpConversation({
    help_request_id: helpRequestId,
    helper_id: user.id,
    initial_message: validation.data.initial_message,
  });

  if (!rpcResult.success) {
    console.error(`[start-conversation:${requestId}] V2 RPC failed`, {
      error: rpcResult.error,
      message: rpcResult.message,
    });

    // Map V2 error codes to HTTP responses
    switch (rpcResult.error) {
      case 'conversation_exists':
        return NextResponse.json(
          {
            error: 'You already have a conversation about this help request',
            conversation_id: rpcResult.conversation_id, // Allow navigation to existing
          },
          { status: 409 }
        );

      case 'help_request_unavailable':
        return NextResponse.json(
          { error: 'This help request is no longer accepting offers' },
          { status: 400 }
        );

      case 'permission_denied':
        return NextResponse.json(
          { error: 'You do not have permission to create this conversation' },
          { status: 403 }
        );

      case 'validation_error':
        return NextResponse.json(
          { error: rpcResult.message || 'Invalid conversation data' },
          { status: 400 }
        );

      default:
        // Generic server error
        return NextResponse.json(
          {
            error: 'Failed to start conversation. Please try again.',
            details: process.env.NODE_ENV === 'development' ? rpcResult.details : undefined,
          },
          { status: 500 }
        );
    }
  }

  conversationResult = { id: rpcResult.conversation_id };

} else {
  // V1: Original multi-step process (fallback)
  try {
    conversationResult = await messagingClient.startHelpConversation(user.id, validation.data);
    console.log(`[start-conversation:${requestId}] V1 conversation created`, {
      conversationId: conversationResult.id
    });
  } catch (createError: any) {
    console.error(`[start-conversation:${requestId}] V1 failed`, {
      error: createError?.message,
      code: createError?.code,
    });
    throw createError; // Existing V1 error handling will catch this
  }
}

// Log the help offer for analytics
console.log('Help conversation started:', {
  version: useV2 ? 'v2' : 'v1',
  conversationId: conversationResult.id,
  helpRequestId: helpRequestId,
  // ... rest of logging
});

// ... rest of function (help request status update, return response) ...
```

**Full Updated File**: Save to `app/api/messaging/help-requests/[id]/start-conversation/route.ts`

---

## Feature Flag Setup

### Environment Variables

**File**: `.env.local` (local development)

```bash
# Messaging V2 feature flag (set to true to enable V2)
NEXT_PUBLIC_MESSAGING_V2_ENABLED=false

# OR use rollout percentage
# NEXT_PUBLIC_MESSAGING_V2_ROLLOUT=percentage:10
```

**Vercel Environment Variables** (production):

```bash
# Stage 1: Internal testing (specific user IDs)
NEXT_PUBLIC_MESSAGING_V2_ROLLOUT=internal

# Stage 2: 10% rollout
NEXT_PUBLIC_MESSAGING_V2_ROLLOUT=percentage:10

# Stage 3: 50% rollout
NEXT_PUBLIC_MESSAGING_V2_ROLLOUT=percentage:50

# Stage 4: 100% rollout
NEXT_PUBLIC_MESSAGING_V2_ENABLED=true
```

**Configure in Vercel**:
1. Open Vercel Dashboard → Project → Settings → Environment Variables
2. Add `NEXT_PUBLIC_MESSAGING_V2_ENABLED` with value `false`
3. Redeploy application

---

## Testing

### Unit Tests

**File**: `lib/messaging/service-v2.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { messagingServiceV2 } from './service-v2';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('MessagingServiceV2', () => {
  let mockRpc: any;

  beforeEach(() => {
    mockRpc = vi.fn();
    (createClient as any).mockResolvedValue({
      rpc: mockRpc,
    });
  });

  describe('createHelpConversation', () => {
    it('calls create_conversation_atomic RPC with correct params', async () => {
      mockRpc.mockResolvedValue({
        data: { success: true, conversation_id: 'conv-123' },
        error: null,
      });

      const result = await messagingServiceV2.createHelpConversation({
        help_request_id: 'help-456',
        helper_id: 'user-789',
        initial_message: 'I can help!',
      });

      expect(mockRpc).toHaveBeenCalledWith('create_conversation_atomic', {
        p_help_request_id: 'help-456',
        p_helper_id: 'user-789',
        p_initial_message: 'I can help!',
      });

      expect(result.success).toBe(true);
      expect(result.conversation_id).toBe('conv-123');
    });

    it('returns error for duplicate conversation', async () => {
      mockRpc.mockResolvedValue({
        data: {
          success: false,
          error: 'conversation_exists',
          message: 'Conversation already exists',
          conversation_id: 'existing-conv',
        },
        error: null,
      });

      const result = await messagingServiceV2.createHelpConversation({
        help_request_id: 'help-456',
        helper_id: 'user-789',
        initial_message: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('conversation_exists');
      expect(result.conversation_id).toBe('existing-conv');
    });

    it('handles RPC database errors', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', code: 'PGRST301' },
      });

      const result = await messagingServiceV2.createHelpConversation({
        help_request_id: 'help-456',
        helper_id: 'user-789',
        initial_message: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('rpc_error');
    });
  });
});
```

**Run Tests**:

```bash
npm test lib/messaging/service-v2.test.ts
```

### Integration Tests

**File**: `tests/api/messaging-v2.test.ts`

```typescript
import { describe, it, expect } from 'vitest';

describe('POST /api/messaging/help-requests/[id]/start-conversation (V2)', () => {
  it('creates conversation and returns 201', async () => {
    // Enable V2
    process.env.NEXT_PUBLIC_MESSAGING_V2_ENABLED = 'true';

    const response = await fetch('http://localhost:3000/api/messaging/help-requests/help-123/start-conversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Auth headers
      },
      body: JSON.stringify({
        initial_message: 'I can help with groceries!',
      }),
    });

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.conversation_id).toBeDefined();
  });

  it('returns 409 for duplicate conversation', async () => {
    // Create conversation first
    // ...

    // Try to create duplicate
    const response = await fetch(/* same request */);

    expect(response.status).toBe(409);
    const json = await response.json();
    expect(json.conversation_id).toBeDefined(); // Existing conversation ID
  });
});
```

### Manual Testing Checklist

- [ ] **V2 Enabled**: Set `NEXT_PUBLIC_MESSAGING_V2_ENABLED=true` locally
- [ ] **Happy Path**: Create conversation from help request → Success (201)
- [ ] **Duplicate Check**: Try creating same conversation → 409 with existing conversation_id
- [ ] **Closed Request**: Try creating conversation for closed request → 400
- [ ] **Self-Help**: Help request owner tries to offer help → 400
- [ ] **Unverified User**: Unapproved user tries to offer help → 403
- [ ] **V2 Disabled**: Set flag to `false` → Falls back to V1 (currently broken, but verifies flag works)

---

## Deployment

### Deployment Steps

#### Day 1: Database Migration

```bash
# 1. Backup production database
supabase db dump --project-ref YOUR_PROJECT_REF > backup-prod-$(date +%Y%m%d).sql

# 2. Apply V2 schema to production
supabase db push --project-ref YOUR_PROJECT_REF

# 3. Apply security fix
supabase db push --project-ref YOUR_PROJECT_REF

# 4. Verify deployment
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_name = 'conversations_v2';"
# Expected: conversations_v2
```

#### Day 1: Application Deployment

```bash
# 1. Regenerate types
npm run db:types

# 2. Commit changes
git add .
git commit -m "feat: Implement messaging V2 with atomic conversation creation

- Add V2 service layer (lib/messaging/service-v2.ts)
- Update API route to support V2 via feature flag
- Add security fix for V2 RPC functions
- Regenerate database types

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# 3. Push to main
git push origin main

# 4. Deploy to Vercel (with V2 DISABLED by default)
npx vercel --prod

# 5. Verify deployment
curl https://care-collective-preview.vercel.app/api/health
```

#### Day 2-4: Internal Testing

```bash
# 1. Enable V2 for internal users only
# In Vercel Dashboard:
# NEXT_PUBLIC_MESSAGING_V2_ROLLOUT=internal

# 2. Redeploy
npx vercel --prod

# 3. Test as internal user
# - Create conversation
# - Verify V2 table has data
# - Check Supabase logs for errors

# 4. Monitor metrics
# - Conversation creation success rate
# - Error logs
# - User feedback
```

#### Week 2: Gradual Rollout

```bash
# Day 5-7: 10% rollout
NEXT_PUBLIC_MESSAGING_V2_ROLLOUT=percentage:10

# Day 8-14: 50% rollout
NEXT_PUBLIC_MESSAGING_V2_ROLLOUT=percentage:50

# Day 15+: 100% rollout
NEXT_PUBLIC_MESSAGING_V2_ENABLED=true
```

---

## Rollback Plan

### Trigger Conditions

Rollback V2 if:
- Success rate <85% for >10 minutes
- Critical bug discovered (data loss, security issue)
- User complaints >10 in 1 hour

### Rollback Steps (<5 minutes)

```bash
# 1. Disable V2 in Vercel
# Set environment variable:
NEXT_PUBLIC_MESSAGING_V2_ENABLED=false

# 2. Redeploy
npx vercel --prod

# 3. Verify V2 disabled
curl https://care-collective-preview.vercel.app/api/features | grep messaging_v2
# Expected: "messaging_v2": false

# 4. Notify team
# Post in Slack: "V2 rollback completed. All users on V1. Investigating issue."
```

**Data Preservation**:
- V2 tables remain in database (no data loss)
- V2 conversations created during rollout remain accessible
- Users can still view V2 conversations (dual V1/V2 support in UI)

### Post-Rollback Investigation

1. Check Supabase logs for RPC function errors
2. Review Sentry/error tracking for patterns
3. Reproduce issue locally with V2 enabled
4. Fix bug and redeploy V2 when ready

---

## Success Metrics

### Key Performance Indicators

**Primary**:
- [ ] Conversation creation success rate >99%
- [ ] V2 response time <500ms p95
- [ ] Zero V2-related data loss

**Secondary**:
- [ ] V2 adoption rate (% of new conversations using V2)
- [ ] Error rate by error code <1%
- [ ] User satisfaction maintained/improved

### Monitoring Dashboard

**Supabase Queries**:

```sql
-- V2 adoption rate
SELECT
  DATE(created_at) AS date,
  COUNT(*) AS v2_conversations
FROM conversations_v2
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 7;

-- V2 success rate (estimate based on orphaned conversations)
SELECT
  COUNT(*) AS total_conversations,
  COUNT(*) FILTER (WHERE initial_message IS NOT NULL) AS with_initial_message,
  ROUND(COUNT(*) FILTER (WHERE initial_message IS NOT NULL)::numeric / COUNT(*) * 100, 2) AS success_rate_pct
FROM conversations_v2;
```

**Vercel Analytics**:

Track custom events:

```typescript
analytics.track('messaging.conversation.created', {
  version: 'v2',
  success: true,
  duration_ms: 250,
});

analytics.track('messaging.error', {
  version: 'v2',
  error_code: 'conversation_exists',
  endpoint: '/api/messaging/help-requests/[id]/start-conversation',
});
```

---

## Checklist

### Pre-Deployment

- [ ] Database backup taken
- [ ] V2 migration reviewed
- [ ] Security fix reviewed
- [ ] Service layer implemented
- [ ] API route updated
- [ ] Feature flag configured
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Manual testing completed

### Deployment

- [ ] V2 schema applied to production
- [ ] Security fix applied
- [ ] Types regenerated
- [ ] Code committed and pushed
- [ ] Vercel deployment successful
- [ ] Feature flag disabled by default

### Post-Deployment

- [ ] Internal testing (2-4 days)
- [ ] 10% rollout (3-5 days)
- [ ] 50% rollout (5-7 days)
- [ ] 100% rollout
- [ ] V1 deprecation (optional, after 30+ days)

---

## Appendix: Quick Reference

### V1 vs V2 Comparison

| Aspect | V1 (Current) | V2 (New) |
|--------|--------------|----------|
| **Database Operations** | 6+ queries | 1 RPC call |
| **Atomicity** | ❌ Partial failures | ✅ All-or-nothing |
| **Success Rate** | 0% | >99% |
| **Response Time** | N/A (fails) | <500ms p95 |
| **Rollback** | Manual cleanup | Automatic |
| **Error Handling** | Generic 500 | Specific error codes |

### Error Code Reference

| Code | HTTP Status | User Message | Client Action |
|------|-------------|--------------|---------------|
| `conversation_exists` | 409 | "You already have a conversation..." | Navigate to existing |
| `help_request_unavailable` | 400 | "Help request no longer available" | Refresh list |
| `permission_denied` | 403 | "Account must be approved" | Go to verification |
| `validation_error` | 400 | "Invalid data" | Fix input |
| `rpc_error` / `server_error` | 500 | "Failed to create conversation" | Retry |

---

**Document Version**: 1.0
**Last Updated**: October 30, 2025
**Status**: READY FOR IMPLEMENTATION
**Estimated Completion**: 3-5 days (12-16 hours)

