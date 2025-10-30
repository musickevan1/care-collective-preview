# Phase 3: Service/Service Layer Rebuild - Design Blueprint
## Care Collective Messaging System V2

**Date**: October 30, 2025
**Author**: Claude (Anthropic)
**Phase**: 3 of 5 - Server/Service Layer Integration
**Status**: DESIGN COMPLETE - READY FOR IMPLEMENTATION

---

## Executive Summary

This document provides a detailed implementation blueprint for integrating the V2 atomic messaging system (deployed in Phase 2) with the application service layer. The design focuses on creating a clean, type-safe abstraction over V2 RPC functions while maintaining backward compatibility with V1.

**Key Decisions**:
- **Architecture**: Option A (New V2 Service Module) - Separate `service-v2.ts` for safe parallel operation
- **Migration Strategy**: Feature-flagged gradual rollout with V1 fallback
- **Error Handling**: Structured error codes with detailed context
- **Observability**: Structured logging with request tracing

**Deployment Risk**: LOW (additive changes, instant rollback via feature flag)

---

## 1. Service Module Design

### 1.1 Architecture Decision: Option A - New V2 Service Module

**Selected Approach**: Create separate `lib/messaging/service-v2.ts` alongside existing `lib/messaging/client.ts`

**Rationale**:

✅ **Safe Parallel Operation**
- V1 and V2 can coexist without interference
- Feature flag controls which service is used
- Instant rollback by reverting to V1 service

✅ **Gradual Migration Path**
- Migrate API routes one at a time
- Test V2 in isolation before full cutover
- Maintain V1 as fallback for critical bugs

✅ **Clear Code Separation**
- V1 logic remains untouched (no regression risk)
- V2 implementation is self-contained
- Easier code review and testing

❌ **Temporary Code Duplication**
- Read operations duplicated across V1 and V2
- Feature flag checks throughout codebase
- Additional maintenance during transition period

**Alternative (Rejected): Option B - Refactor Existing Client**

Adding V2 methods to existing `client.ts` would:
- Increase complexity of already large file (769 lines → 1200+ lines)
- Risk breaking V1 functionality
- Make feature flag logic more convoluted
- Harder to remove V1 code post-migration

**File Structure**:
```
lib/messaging/
├── client.ts              # V1 MessagingClient (existing, unchanged)
├── service-v2.ts          # V2 MessagingServiceV2 (NEW)
├── types.ts               # Shared types, V1 and V2 schemas
├── types-v2.ts            # V2-specific types (NEW)
├── moderation.ts          # Content moderation (shared)
├── encryption.ts          # Message encryption (shared)
└── realtime.ts            # Real-time subscriptions (shared)
```

### 1.2 Service Contract: TypeScript Interface

**File**: `lib/messaging/service-v2.ts`

```typescript
/**
 * V2 Messaging Service
 *
 * Provides type-safe wrappers around V2 atomic RPC functions.
 * All write operations go through SECURITY DEFINER functions.
 * Read operations use direct Supabase queries with RLS enforcement.
 */

import { createClient } from '@/lib/supabase/server';
import {
  ConversationV2,
  MessageV2,
  ConversationWithMessagesV2,
  CreateConversationParamsV2,
  SendMessageParamsV2,
  ConversationListResponseV2,
  PaginationParams,
} from './types-v2';
import { MessagingServiceError, ErrorCodes } from './types';

export class MessagingServiceV2 {
  /**
   * Lazy-load Supabase client to avoid calling cookies() at module load time
   */
  private async getClient() {
    return await createClient();
  }

  /**
   * Start a conversation for a help request (Atomic Operation)
   *
   * Calls V2 RPC: create_conversation_atomic()
   * - Validates help request availability
   * - Prevents duplicates via UNIQUE constraint
   * - Prevents self-help
   * - Embeds initial message in conversation row
   *
   * @throws MessagingServiceError - Structured error with error code
   */
  async startHelpConversation(
    helperId: string,
    params: CreateConversationParamsV2
  ): Promise<ConversationV2> {
    const requestId = this.generateRequestId();
    this.log('startHelpConversation', 'start', { requestId, helperId, ...params });

    try {
      const supabase = await this.getClient();

      // Call V2 atomic RPC function
      const { data, error } = await supabase.rpc('create_conversation_atomic', {
        p_help_request_id: params.help_request_id,
        p_helper_id: helperId,
        p_initial_message: params.initial_message,
      });

      if (error) {
        this.log('startHelpConversation', 'rpc_error', { requestId, error });
        throw new MessagingServiceError(
          ErrorCodes.RPC_FUNCTION_ERROR,
          `RPC call failed: ${error.message}`,
          500,
          { helperId, ...params, error }
        );
      }

      // V2 RPC returns JSONB: { success: boolean, conversation_id?: uuid, error?: string }
      if (!data.success) {
        const errorCode = this.mapRpcErrorToCode(data.error);
        this.log('startHelpConversation', 'function_error', {
          requestId,
          rpcError: data.error,
          mappedCode: errorCode
        });

        throw new MessagingServiceError(
          errorCode,
          data.error,
          this.getStatusCodeForError(errorCode),
          { helperId, ...params }
        );
      }

      // Fetch created conversation with full details
      const conversation = await this.getConversation(data.conversation_id, helperId);

      this.log('startHelpConversation', 'success', {
        requestId,
        conversationId: data.conversation_id,
        duration: Date.now() - this.extractTimestamp(requestId)
      });

      return conversation;

    } catch (error: any) {
      // Re-throw MessagingServiceError as-is
      if (error instanceof MessagingServiceError) {
        throw error;
      }

      // Wrap unexpected errors
      this.log('startHelpConversation', 'critical_error', {
        requestId,
        error: error?.message,
        stack: error?.stack
      });

      throw new MessagingServiceError(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Unexpected error creating conversation',
        500,
        { helperId, ...params, originalError: error?.message }
      );
    }
  }

  /**
   * Get conversation by ID with full details
   *
   * Uses V2 RPC: get_conversation_v2()
   * Returns conversation + initial message + follow-up messages
   */
  async getConversation(
    conversationId: string,
    userId: string
  ): Promise<ConversationWithMessagesV2> {
    const requestId = this.generateRequestId();
    this.log('getConversation', 'start', { requestId, conversationId, userId });

    try {
      const supabase = await this.getClient();

      // Call V2 RPC to get conversation with messages
      const { data, error } = await supabase.rpc('get_conversation_v2', {
        p_conversation_id: conversationId,
        p_user_id: userId,
      });

      if (error) {
        this.log('getConversation', 'rpc_error', { requestId, error });
        throw new MessagingServiceError(
          ErrorCodes.RPC_FUNCTION_ERROR,
          `Failed to fetch conversation: ${error.message}`,
          500,
          { conversationId, userId, error }
        );
      }

      if (!data || data.success === false) {
        throw new MessagingServiceError(
          ErrorCodes.CONVERSATION_NOT_FOUND,
          'Conversation not found or access denied',
          404,
          { conversationId, userId }
        );
      }

      this.log('getConversation', 'success', { requestId, conversationId });
      return data as ConversationWithMessagesV2;

    } catch (error: any) {
      if (error instanceof MessagingServiceError) {
        throw error;
      }

      throw new MessagingServiceError(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Unexpected error fetching conversation',
        500,
        { conversationId, userId, originalError: error?.message }
      );
    }
  }

  /**
   * List user's conversations (V2 + V1 compatibility)
   *
   * Direct Supabase query with RLS enforcement
   * Returns V2 conversations only (V1 conversations handled by legacy client)
   */
  async listConversations(
    userId: string,
    options: PaginationParams = { page: 1, limit: 20 }
  ): Promise<ConversationListResponseV2> {
    const requestId = this.generateRequestId();
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    this.log('listConversations', 'start', { requestId, userId, page, limit });

    try {
      const supabase = await this.getClient();

      // Query V2 conversations where user is participant
      const { data: conversations, error, count } = await supabase
        .from('conversations_v2')
        .select(`
          id,
          help_request_id,
          requester_id,
          helper_id,
          initial_message,
          status,
          created_at,
          updated_at,
          help_requests (
            id,
            title,
            category,
            urgency,
            status
          )
        `, { count: 'exact' })
        .or(`requester_id.eq.${userId},helper_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        this.log('listConversations', 'query_error', { requestId, error });
        throw new MessagingServiceError(
          ErrorCodes.DATABASE_ERROR,
          `Failed to fetch conversations: ${error.message}`,
          500,
          { userId, options, error }
        );
      }

      // Get unread count and last message for each conversation
      const conversationsWithDetails = await Promise.all(
        (conversations || []).map(async (conv: any) => {
          const [unreadCount, lastMessage] = await Promise.all([
            this.getUnreadMessageCount(conv.id, userId),
            this.getLastMessage(conv.id),
          ]);

          return {
            ...conv,
            unread_count: unreadCount,
            last_message: lastMessage,
          };
        })
      );

      this.log('listConversations', 'success', {
        requestId,
        count: conversationsWithDetails.length,
        total: count || 0
      });

      return {
        conversations: conversationsWithDetails,
        pagination: {
          page,
          limit,
          total: count || 0,
          has_more: (count || 0) > offset + limit,
        },
      };

    } catch (error: any) {
      if (error instanceof MessagingServiceError) {
        throw error;
      }

      throw new MessagingServiceError(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Unexpected error listing conversations',
        500,
        { userId, options, originalError: error?.message }
      );
    }
  }

  /**
   * Send message in existing conversation (Atomic Operation)
   *
   * Calls V2 RPC: send_message_v2()
   * - Validates sender is participant
   * - Validates conversation is active
   * - Enforces content length limits
   */
  async sendMessage(
    senderId: string,
    params: SendMessageParamsV2
  ): Promise<MessageV2> {
    const requestId = this.generateRequestId();
    this.log('sendMessage', 'start', { requestId, senderId, ...params });

    try {
      const supabase = await this.getClient();

      // Call V2 RPC function
      const { data, error } = await supabase.rpc('send_message_v2', {
        p_conversation_id: params.conversation_id,
        p_sender_id: senderId,
        p_content: params.content,
      });

      if (error) {
        this.log('sendMessage', 'rpc_error', { requestId, error });
        throw new MessagingServiceError(
          ErrorCodes.RPC_FUNCTION_ERROR,
          `RPC call failed: ${error.message}`,
          500,
          { senderId, ...params, error }
        );
      }

      if (!data.success) {
        const errorCode = this.mapRpcErrorToCode(data.error);
        this.log('sendMessage', 'function_error', {
          requestId,
          rpcError: data.error,
          mappedCode: errorCode
        });

        throw new MessagingServiceError(
          errorCode,
          data.error,
          this.getStatusCodeForError(errorCode),
          { senderId, ...params }
        );
      }

      // Fetch created message with details
      const { data: message, error: fetchError } = await supabase
        .from('messages_v2')
        .select('*')
        .eq('id', data.message_id)
        .single();

      if (fetchError) {
        this.log('sendMessage', 'fetch_error', { requestId, fetchError });
        throw new MessagingServiceError(
          ErrorCodes.MESSAGE_NOT_FOUND,
          'Message created but failed to fetch details',
          500,
          { messageId: data.message_id }
        );
      }

      this.log('sendMessage', 'success', {
        requestId,
        messageId: data.message_id,
        duration: Date.now() - this.extractTimestamp(requestId)
      });

      return message as MessageV2;

    } catch (error: any) {
      if (error instanceof MessagingServiceError) {
        throw error;
      }

      throw new MessagingServiceError(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Unexpected error sending message',
        500,
        { senderId, ...params, originalError: error?.message }
      );
    }
  }

  /**
   * Get messages in a conversation (Direct Query)
   *
   * Uses cursor-based pagination for efficient scrolling
   * RLS enforces participant access
   */
  async getMessages(
    conversationId: string,
    userId: string,
    options: CursorPaginationParams = { limit: 50, direction: 'older' }
  ): Promise<MessageListResponseV2> {
    const requestId = this.generateRequestId();
    this.log('getMessages', 'start', { requestId, conversationId, userId, options });

    try {
      // Verify user has access to conversation (RLS will also enforce this)
      await this.verifyConversationAccess(conversationId, userId);

      const supabase = await this.getClient();
      let query = supabase
        .from('messages_v2')
        .select('*')
        .eq('conversation_id', conversationId)
        .limit(options.limit);

      // Apply cursor-based pagination
      if (options.cursor) {
        const operator = options.direction === 'older' ? 'lt' : 'gt';
        query = query.filter('created_at', operator, options.cursor);
      }

      // Order by creation time
      const ascending = options.direction === 'newer';
      query = query.order('created_at', { ascending });

      const { data: messages, error } = await query;

      if (error) {
        this.log('getMessages', 'query_error', { requestId, error });
        throw new MessagingServiceError(
          ErrorCodes.DATABASE_ERROR,
          `Failed to fetch messages: ${error.message}`,
          500,
          { conversationId, options, error }
        );
      }

      this.log('getMessages', 'success', {
        requestId,
        count: messages?.length || 0
      });

      return {
        messages: messages || [],
        pagination: {
          cursor: messages && messages.length > 0
            ? messages[messages.length - 1].created_at
            : undefined,
          limit: options.limit,
          has_more: (messages?.length || 0) === options.limit,
        },
      };

    } catch (error: any) {
      if (error instanceof MessagingServiceError) {
        throw error;
      }

      throw new MessagingServiceError(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Unexpected error fetching messages',
        500,
        { conversationId, userId, options, originalError: error?.message }
      );
    }
  }

  // ============================================
  // HELPER METHODS (Private)
  // ============================================

  /**
   * Verify user has access to conversation
   */
  private async verifyConversationAccess(
    conversationId: string,
    userId: string
  ): Promise<void> {
    const supabase = await this.getClient();
    const { count, error } = await supabase
      .from('conversations_v2')
      .select('id', { count: 'exact' })
      .eq('id', conversationId)
      .or(`requester_id.eq.${userId},helper_id.eq.${userId}`)
      .limit(1);

    if (error || (count || 0) === 0) {
      throw new MessagingServiceError(
        ErrorCodes.PERMISSION_DENIED,
        'You do not have access to this conversation',
        403,
        { conversationId, userId }
      );
    }
  }

  /**
   * Get unread message count for a conversation
   */
  private async getUnreadMessageCount(
    conversationId: string,
    userId: string
  ): Promise<number> {
    // TODO: V2 doesn't have read_at field yet
    // For now, return 0 (feature enhancement for future)
    return 0;
  }

  /**
   * Get last message in a conversation
   */
  private async getLastMessage(conversationId: string): Promise<MessageV2 | null> {
    const supabase = await this.getClient();
    const { data: message } = await supabase
      .from('messages_v2')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return message || null;
  }

  /**
   * Map RPC error string to error code
   */
  private mapRpcErrorToCode(errorMessage: string): string {
    if (!errorMessage) return ErrorCodes.INTERNAL_SERVER_ERROR;

    const message = errorMessage.toLowerCase();

    if (message.includes('already exists')) return ErrorCodes.CONVERSATION_EXISTS;
    if (message.includes('not found')) return ErrorCodes.HELP_REQUEST_NOT_FOUND;
    if (message.includes('no longer available')) return ErrorCodes.HELP_REQUEST_UNAVAILABLE;
    if (message.includes('yourself')) return ErrorCodes.INVALID_INPUT;
    if (message.includes('not authorized') || message.includes('behalf of another')) {
      return ErrorCodes.PERMISSION_DENIED;
    }
    if (message.includes('characters')) return ErrorCodes.VALIDATION_ERROR;

    return ErrorCodes.INTERNAL_SERVER_ERROR;
  }

  /**
   * Get HTTP status code for error code
   */
  private getStatusCodeForError(errorCode: string): number {
    const statusMap: Record<string, number> = {
      [ErrorCodes.CONVERSATION_EXISTS]: 409,
      [ErrorCodes.HELP_REQUEST_NOT_FOUND]: 404,
      [ErrorCodes.HELP_REQUEST_UNAVAILABLE]: 400,
      [ErrorCodes.INVALID_INPUT]: 400,
      [ErrorCodes.VALIDATION_ERROR]: 400,
      [ErrorCodes.PERMISSION_DENIED]: 403,
      [ErrorCodes.UNAUTHORIZED]: 401,
      [ErrorCodes.RATE_LIMIT_EXCEEDED]: 429,
      [ErrorCodes.INTERNAL_SERVER_ERROR]: 500,
    };

    return statusMap[errorCode] || 500;
  }

  /**
   * Generate unique request ID for tracing
   */
  private generateRequestId(): string {
    return `v2_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Extract timestamp from request ID
   */
  private extractTimestamp(requestId: string): number {
    const parts = requestId.split('_');
    return parseInt(parts[1]) || Date.now();
  }

  /**
   * Structured logging helper
   */
  private log(
    method: string,
    event: string,
    context: Record<string, any>
  ): void {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      service: 'MessagingServiceV2',
      method,
      event,
      ...context,
    }));
  }
}

// Export singleton instance
export const messagingServiceV2 = new MessagingServiceV2();
```

### 1.3 V2-Specific Types

**File**: `lib/messaging/types-v2.ts`

```typescript
import { z } from 'zod';
import { Database } from '@/lib/database.types';

// Database types
export type ConversationV2 = Database['public']['Tables']['conversations_v2']['Row'];
export type MessageV2 = Database['public']['Tables']['messages_v2']['Row'];

// Extended types with relationships
export interface ConversationWithDetailsV2 extends ConversationV2 {
  help_request?: {
    id: string;
    title: string;
    category: string;
    urgency: string;
    status: string;
  };
  unread_count: number;
  last_message: MessageV2 | null;
}

export interface ConversationWithMessagesV2 extends ConversationV2 {
  messages: MessageV2[];
}

// Request/Response types
export interface CreateConversationParamsV2 {
  help_request_id: string;
  initial_message: string;
}

export interface SendMessageParamsV2 {
  conversation_id: string;
  content: string;
}

export interface ConversationListResponseV2 {
  conversations: ConversationWithDetailsV2[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
}

export interface MessageListResponseV2 {
  messages: MessageV2[];
  pagination: {
    cursor?: string;
    limit: number;
    has_more: boolean;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface CursorPaginationParams {
  cursor?: string;
  limit: number;
  direction: 'older' | 'newer';
}

// Validation schemas
export const createConversationSchemaV2 = z.object({
  help_request_id: z.string().uuid(),
  initial_message: z.string().min(10).max(1000),
});

export const sendMessageSchemaV2 = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().min(1).max(1000),
});
```

### 1.4 Error Handling Enhancement

**File**: `lib/messaging/types.ts` (additions)

```typescript
/**
 * Error codes for messaging service
 */
export const ErrorCodes = {
  // Conversation errors
  CONVERSATION_EXISTS: 'conversation_exists',
  CONVERSATION_NOT_FOUND: 'conversation_not_found',

  // Help request errors
  HELP_REQUEST_NOT_FOUND: 'help_request_not_found',
  HELP_REQUEST_UNAVAILABLE: 'help_request_unavailable',

  // Authorization errors
  UNAUTHORIZED: 'unauthorized',
  PERMISSION_DENIED: 'permission_denied',

  // Validation errors
  VALIDATION_ERROR: 'validation_error',
  INVALID_INPUT: 'invalid_input',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',

  // Database errors
  DATABASE_ERROR: 'database_error',
  RPC_FUNCTION_ERROR: 'rpc_function_error',
  MESSAGE_NOT_FOUND: 'message_not_found',

  // Internal errors
  INTERNAL_SERVER_ERROR: 'internal_server_error',
} as const;

/**
 * Structured error class for messaging service
 */
export class MessagingServiceError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'MessagingServiceError';
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.context,
      },
    };
  }
}
```

---

## 2. API Route Refactor Plan

### 2.1 Route: `POST /api/messaging/help-requests/[id]/start-conversation`

**Current State** (V1 - 3-step process):
```typescript
// Line 293-309 of current route.ts
conversation = await messagingClient.startHelpConversation(user.id, validation.data);
  // ↓ Calls createConversation()
    // ↓ INSERT conversations
    // ↓ INSERT conversation_participants × 2
    // ↓ sendMessage() ← FAILS HERE (race condition)
```

**New State** (V2 - atomic RPC call):
```typescript
import { messagingServiceV2 } from '@/lib/messaging/service-v2';
import { isMessagingV2Enabled } from '@/lib/features';

// Simplified conversation creation
const conversation = await messagingServiceV2.startHelpConversation(user.id, {
  help_request_id: helpRequestId,
  initial_message: validation.data.initial_message,
});
```

**File Changes**:

**File**: `app/api/messaging/help-requests/[id]/start-conversation/route.ts`

```typescript
// Lines 1-10 (imports)
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { messagingClient } from '@/lib/messaging/client'; // V1 client
import { messagingServiceV2 } from '@/lib/messaging/service-v2'; // V2 service (NEW)
import { messagingValidation } from '@/lib/messaging/types';
import { createConversationSchemaV2 } from '@/lib/messaging/types-v2'; // V2 schema (NEW)
import { moderationService } from '@/lib/messaging/moderation';
import { isMessagingV2Enabled } from '@/lib/features'; // Feature flag (NEW)
import { MessagingServiceError } from '@/lib/messaging/types'; // Error handling (NEW)

// Lines 47-376 (POST function - refactored)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[start-conversation:${requestId}] Request started`, {
    helpRequestId: params.id,
    timestamp: new Date().toISOString()
  });

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user restrictions (same as V1)
    let restrictionCheck;
    try {
      restrictionCheck = await moderationService.checkUserRestrictions(user.id, 'start_conversation');
    } catch (restrictionError: any) {
      console.warn(`[start-conversation:${requestId}] Restriction check failed, using fallback`, {
        error: restrictionError?.message,
      });
      restrictionCheck = { allowed: true };
    }

    if (!restrictionCheck.allowed) {
      return NextResponse.json(
        {
          error: restrictionCheck.reason || 'You are restricted from starting new conversations.',
          restriction_level: restrictionCheck.restrictionLevel
        },
        { status: 403 }
      );
    }

    // Rate limiting (same as V1)
    if (!checkHelpConversationRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'You have started too many help conversations recently.' },
        { status: 429 }
      );
    }

    const helpRequestId = params.id;
    if (!helpRequestId || !/^[0-9a-f-]{36}$/i.test(helpRequestId)) {
      return NextResponse.json(
        { error: 'Invalid help request ID format' },
        { status: 400 }
      );
    }

    // Check user verification status (same as V1)
    const supabase = await createClient();
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('verification_status')
      .eq('id', user.id)
      .single();

    if (!userProfile || userProfile.verification_status !== 'approved') {
      return NextResponse.json(
        {
          error: 'Your account must be approved to offer help.',
          requiresApproval: true
        },
        { status: 403 }
      );
    }

    // Fetch help request (same as V1, but simplified response handling)
    const { data: helpRequest, error: helpError } = await supabase
      .from('help_requests')
      .select('id, user_id, title, category, urgency, status')
      .eq('id', helpRequestId)
      .single();

    if (helpError || !helpRequest) {
      return NextResponse.json(
        { error: 'Help request not found or you do not have access to view it' },
        { status: 404 }
      );
    }

    if (helpRequest.status !== 'open') {
      return NextResponse.json(
        { error: `This help request is ${helpRequest.status} and no longer accepting offers` },
        { status: 400 }
      );
    }

    if (helpRequest.user_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot offer help on your own request' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Feature flag: V2 or V1?
    const useV2 = isMessagingV2Enabled(user.id);
    console.log(`[start-conversation:${requestId}] Using ${useV2 ? 'V2' : 'V1'} messaging system`);

    let conversation;

    if (useV2) {
      // ==========================================
      // V2 PATH: Atomic RPC call
      // ==========================================

      // Validate request body
      const validation = createConversationSchemaV2.safeParse({
        help_request_id: helpRequestId,
        initial_message: body.initial_message,
      });

      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid request data', details: validation.error.issues },
          { status: 400 }
        );
      }

      try {
        // Single atomic operation - no race condition
        conversation = await messagingServiceV2.startHelpConversation(
          user.id,
          validation.data
        );

        console.log(`[start-conversation:${requestId}] V2 conversation created successfully`, {
          conversationId: conversation.id
        });

      } catch (error: any) {
        console.error(`[start-conversation:${requestId}] V2 conversation creation failed`, {
          error: error?.message,
          code: error?.code,
          stack: error?.stack
        });

        // Handle structured errors from service layer
        if (error instanceof MessagingServiceError) {
          return NextResponse.json(error.toJSON(), { status: error.statusCode });
        }

        // Handle unexpected errors
        return NextResponse.json(
          { error: 'Failed to start conversation. Please try again.' },
          { status: 500 }
        );
      }

    } else {
      // ==========================================
      // V1 PATH: Legacy multi-step process
      // ==========================================

      // [Keep existing V1 logic unchanged - lines 201-309 of current route.ts]
      // This includes:
      // - Duplicate check (3-step query)
      // - messagingClient.startHelpConversation()
      // - Error handling for V1 race conditions

      // ... (existing V1 code)
    }

    // Update help request status (same for V1 and V2)
    const { data: existingConversations } = await supabase
      .from(useV2 ? 'conversations_v2' : 'conversations')
      .select('id')
      .eq('help_request_id', helpRequestId);

    if (!existingConversations || existingConversations.length <= 1) {
      await supabase
        .from('help_requests')
        .update({ status: 'in_progress' })
        .eq('id', helpRequestId);
    }

    console.log(`[start-conversation:${requestId}] Conversation created successfully`);

    // Return minimal response (same for V1 and V2)
    return NextResponse.json({
      success: true,
      conversation_id: conversation.id,
      help_request_id: helpRequestId,
      message: 'Conversation started successfully.',
      version: useV2 ? 'v2' : 'v1', // For debugging
    }, { status: 201 });

  } catch (error: any) {
    console.error(`[start-conversation:${requestId}] CRITICAL ERROR:`, {
      error: error?.message,
      stack: error?.stack
    });

    return NextResponse.json(
      { error: 'Failed to start conversation. Please try again.' },
      { status: 500 }
    );
  }
}
```

**Key Changes**:
1. ✅ Added V2 service import
2. ✅ Added feature flag check
3. ✅ Conditional V2/V1 path
4. ✅ Simplified V2 error handling (service layer handles complexity)
5. ✅ Removed duplicate check for V2 (handled in RPC function)
6. ✅ Backward compatible - V1 code unchanged

### 2.2 Route: `POST /api/messaging/conversations/[id]/messages`

**File**: `app/api/messaging/conversations/[id]/messages/route.ts`

**Changes** (lines 125-252):

```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user restrictions (same as V1)
    const restrictionCheck = await moderationService.checkUserRestrictions(user.id, 'send_message');
    if (!restrictionCheck.allowed) {
      return NextResponse.json(
        {
          error: restrictionCheck.reason || 'You are restricted from sending messages.',
          restriction_level: restrictionCheck.restrictionLevel,
        },
        { status: 403 }
      );
    }

    // Rate limiting (same as V1)
    if (!checkMessageRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'You are sending messages too quickly.' },
        { status: 429 }
      );
    }

    const conversationId = params.id;
    if (!/^[0-9a-f-]{36}$/i.test(conversationId)) {
      return NextResponse.json(
        { error: 'Invalid conversation ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate message content (same schema for V1 and V2)
    const validation = sendMessageSchemaV2.safeParse({
      conversation_id: conversationId,
      content: body.content,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid message data', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Content moderation (same as V1)
    const content = validation.data.content.trim();
    if (containsProhibitedContent(content)) {
      return NextResponse.json(
        { error: 'Message contains prohibited content.' },
        { status: 400 }
      );
    }

    // Feature flag: Determine if conversation is V2 or V1
    const supabase = await createClient();
    const { count: v2Count } = await supabase
      .from('conversations_v2')
      .select('id', { count: 'exact' })
      .eq('id', conversationId)
      .limit(1);

    const isV2Conversation = (v2Count || 0) > 0;
    console.log(`[send-message] Conversation ${conversationId} is ${isV2Conversation ? 'V2' : 'V1'}`);

    let message;

    if (isV2Conversation) {
      // ==========================================
      // V2 PATH: RPC function
      // ==========================================

      try {
        message = await messagingServiceV2.sendMessage(user.id, {
          conversation_id: conversationId,
          content: validation.data.content,
        });

      } catch (error: any) {
        if (error instanceof MessagingServiceError) {
          return NextResponse.json(error.toJSON(), { status: error.statusCode });
        }
        throw error;
      }

    } else {
      // ==========================================
      // V1 PATH: Legacy client
      // ==========================================

      message = await messagingClient.sendMessage(user.id, {
        conversation_id: conversationId,
        content: validation.data.content,
        message_type: 'text',
      });
    }

    return NextResponse.json({
      message,
      status: 'sent',
      version: isV2Conversation ? 'v2' : 'v1',
    }, { status: 201 });

  } catch (error) {
    console.error('Error sending message:', error);

    if (error instanceof Error && error.message.includes('access')) {
      return NextResponse.json(
        { error: 'You do not have access to this conversation' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
```

**Key Changes**:
1. ✅ Detect V2 vs V1 conversation automatically
2. ✅ Use appropriate service (V2 or V1) based on conversation type
3. ✅ Unified response format
4. ✅ No breaking changes to existing V1 conversations

### 2.3 Route: `GET /api/messaging/conversations`

**Minimal Changes**: V2 conversations returned separately from V1

**File**: `app/api/messaging/conversations/route.ts`

```typescript
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    // Fetch V1 and V2 conversations in parallel
    const [v1Response, v2Response] = await Promise.all([
      messagingClient.getConversations(user.id, { page, limit }),
      messagingServiceV2.listConversations(user.id, { page, limit }),
    ]);

    // Merge and sort by created_at
    const allConversations = [
      ...v1Response.conversations.map(c => ({ ...c, version: 'v1' })),
      ...v2Response.conversations.map(c => ({ ...c, version: 'v2' })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({
      conversations: allConversations.slice(0, limit),
      pagination: {
        page,
        limit,
        total: v1Response.pagination.total + v2Response.pagination.total,
        has_more: allConversations.length > limit,
      },
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
```

---

## 3. Feature Flag Strategy

### 3.1 Environment Variable Configuration

**File**: `.env.local` (development) / Vercel Environment Variables (production)

```bash
# Messaging V2 Rollout Flag
# Options:
#   - "disabled" : V2 completely disabled, all users use V1
#   - "internal" : V2 enabled for admin/internal users only
#   - "percentage:10" : V2 enabled for 10% of users (consistent hashing)
#   - "enabled" : V2 enabled for all users
NEXT_PUBLIC_MESSAGING_V2_ROLLOUT=disabled
```

### 3.2 Feature Flag Utility

**File**: `lib/features.ts` (additions)

```typescript
/**
 * Check if Messaging V2 is enabled for a user
 *
 * @param userId - Optional user ID for percentage rollout
 * @returns boolean - True if V2 should be used
 */
export function isMessagingV2Enabled(userId?: string): boolean {
  const rollout = process.env.NEXT_PUBLIC_MESSAGING_V2_ROLLOUT || 'disabled';

  // Fully disabled
  if (rollout === 'disabled') {
    return false;
  }

  // Fully enabled
  if (rollout === 'enabled') {
    return true;
  }

  // Internal testing (admin users only)
  if (rollout === 'internal') {
    // Check if user has admin role (via Supabase query or cached metadata)
    // For now, check against hardcoded admin UUIDs (replace with real logic)
    const adminUserIds = process.env.NEXT_PUBLIC_ADMIN_USER_IDS?.split(',') || [];
    return userId ? adminUserIds.includes(userId) : false;
  }

  // Percentage rollout (e.g., "percentage:10" = 10% of users)
  if (rollout.startsWith('percentage:')) {
    const percentage = parseInt(rollout.split(':')[1], 10);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      console.error('Invalid percentage in MESSAGING_V2_ROLLOUT:', rollout);
      return false; // Fail safe
    }

    if (!userId) {
      return false; // No user ID, cannot determine bucket
    }

    // Consistent hashing: same user always gets same result
    const hash = hashUserId(userId);
    return (hash % 100) < percentage;
  }

  // Unknown rollout value - fail safe to disabled
  console.error('Unknown MESSAGING_V2_ROLLOUT value:', rollout);
  return false;
}

/**
 * Simple hash function for consistent user bucketing
 * Same user ID always produces same hash
 */
function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Log feature flag status (for debugging)
 */
export function logMessagingV2Status(userId?: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Feature Flag] Messaging V2:', {
      rollout: process.env.NEXT_PUBLIC_MESSAGING_V2_ROLLOUT,
      enabled: isMessagingV2Enabled(userId),
      userId: userId || 'anonymous',
    });
  }
}
```

### 3.3 Rollout Plan

**Phase 1: Internal Testing** (Days 1-3)
```bash
NEXT_PUBLIC_MESSAGING_V2_ROLLOUT=internal
```
- Only admin/internal users use V2
- Test all critical flows (conversation creation, messaging, listing)
- Monitor for errors, performance issues

**Phase 2: 10% Rollout** (Days 4-7)
```bash
NEXT_PUBLIC_MESSAGING_V2_ROLLOUT=percentage:10
```
- 10% of users randomly assigned to V2 (consistent per user)
- Monitor error rates, latency, user feedback
- Target: < 1% error rate, < 500ms p95 latency

**Phase 3: 50% Rollout** (Days 8-14)
```bash
NEXT_PUBLIC_MESSAGING_V2_ROLLOUT=percentage:50
```
- Increase to 50% of users
- Continued monitoring
- Prepare for full rollout

**Phase 4: 100% Rollout** (Day 15+)
```bash
NEXT_PUBLIC_MESSAGING_V2_ROLLOUT=enabled
```
- All users on V2
- V1 remains accessible for reading legacy conversations
- Monitor for 2 weeks before V1 deprecation

**Emergency Rollback**:
```bash
NEXT_PUBLIC_MESSAGING_V2_ROLLOUT=disabled
```
- Instant rollback to V1 via environment variable change
- Redeploy with `vercel --prod`
- < 1 minute downtime

---

## 4. Error & Observability Strategy

### 4.1 Error Categories

**Client Errors (400-499)**:
```typescript
ErrorCodes.VALIDATION_ERROR          // 400 - Invalid input
ErrorCodes.INVALID_INPUT             // 400 - Business logic failure
ErrorCodes.HELP_REQUEST_UNAVAILABLE  // 400 - Help request closed
ErrorCodes.UNAUTHORIZED              // 401 - Not authenticated
ErrorCodes.PERMISSION_DENIED         // 403 - Not authorized
ErrorCodes.CONVERSATION_NOT_FOUND    // 404 - Resource not found
ErrorCodes.CONVERSATION_EXISTS       // 409 - Duplicate conflict
ErrorCodes.RATE_LIMIT_EXCEEDED       // 429 - Too many requests
```

**Server Errors (500-599)**:
```typescript
ErrorCodes.DATABASE_ERROR            // 500 - Supabase query failed
ErrorCodes.RPC_FUNCTION_ERROR        // 500 - V2 RPC call failed
ErrorCodes.INTERNAL_SERVER_ERROR     // 500 - Unexpected error
```

### 4.2 Error Response Format

**Structured JSON Response**:
```typescript
interface ErrorResponse {
  error: {
    code: string;          // Machine-readable error code
    message: string;       // Human-readable error message
    details?: Record<string, any>; // Optional context
  };
  request_id?: string;     // Trace ID for debugging
}
```

**Example Error Responses**:

**409 Conflict (Duplicate Conversation)**:
```json
{
  "error": {
    "code": "conversation_exists",
    "message": "Conversation already exists for this help request and helper",
    "details": {
      "help_request_id": "ac7847d9-ac76-462e-a48b-354169011e9b",
      "helper_id": "5d500369-e88e-41a4-9f05-53623f493653"
    }
  },
  "request_id": "v2_1698765432_abc123"
}
```

**500 Internal Server Error**:
```json
{
  "error": {
    "code": "rpc_function_error",
    "message": "RPC call failed: permission denied for function create_conversation_atomic",
    "details": {
      "help_request_id": "...",
      "error": "permission denied for function create_conversation_atomic"
    }
  },
  "request_id": "v2_1698765432_xyz789"
}
```

### 4.3 Logging Strategy

**Structured Logging Format** (JSON):

```typescript
interface LogEntry {
  timestamp: string;       // ISO 8601
  service: string;         // "MessagingServiceV2"
  method: string;          // "startHelpConversation"
  event: string;           // "start" | "success" | "error"
  request_id: string;      // Trace ID
  user_id?: string;        // Authenticated user
  duration_ms?: number;    // Request duration
  [key: string]: any;      // Additional context
}
```

**Example Log Entries**:

**Conversation Creation Start**:
```json
{
  "timestamp": "2025-10-30T15:30:00.123Z",
  "service": "MessagingServiceV2",
  "method": "startHelpConversation",
  "event": "start",
  "request_id": "v2_1698765000_abc123",
  "user_id": "helper-uuid",
  "help_request_id": "request-uuid",
  "initial_message_length": 45
}
```

**Conversation Creation Success**:
```json
{
  "timestamp": "2025-10-30T15:30:00.456Z",
  "service": "MessagingServiceV2",
  "method": "startHelpConversation",
  "event": "success",
  "request_id": "v2_1698765000_abc123",
  "conversation_id": "conv-uuid",
  "duration_ms": 333
}
```

**RPC Function Error**:
```json
{
  "timestamp": "2025-10-30T15:30:00.456Z",
  "service": "MessagingServiceV2",
  "method": "startHelpConversation",
  "event": "rpc_error",
  "request_id": "v2_1698765000_abc123",
  "error": "Conversation already exists for this help request and helper",
  "code": "conversation_exists"
}
```

### 4.4 Metrics to Track

**Key Performance Indicators (KPIs)**:

1. **Conversation Creation Success Rate**
   - Metric: `conversation_creation_success_rate`
   - Target: > 99%
   - Alert: If < 95% for 5 minutes

2. **Message Send Latency**
   - Metric: `message_send_latency_p95`
   - Target: < 500ms
   - Alert: If > 1000ms for 5 minutes

3. **RPC Function Call Count**
   - Metric: `rpc_create_conversation_calls_total`
   - Tracking: V2 adoption rate

4. **Error Rate by Code**
   - Metric: `messaging_errors_total` (labeled by `code`)
   - Target: < 1% overall error rate
   - Alert: If specific error code > 5% for 5 minutes

5. **Active Conversations**
   - Metric: `active_conversations_v2_total`
   - Tracking: V2 usage growth

6. **Messages Sent Per Day**
   - Metric: `messages_sent_v2_daily`
   - Tracking: Platform engagement

**Dashboard Queries** (Vercel Analytics / Datadog / Prometheus):

```sql
-- Conversation creation success rate (last 24 hours)
SELECT
  COUNT(*) FILTER (WHERE event = 'success') / COUNT(*) AS success_rate
FROM logs
WHERE service = 'MessagingServiceV2'
  AND method = 'startHelpConversation'
  AND timestamp > NOW() - INTERVAL '24 hours';

-- Message send latency (p50, p95, p99)
SELECT
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY duration_ms) AS p50,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms) AS p99
FROM logs
WHERE service = 'MessagingServiceV2'
  AND method = 'sendMessage'
  AND event = 'success'
  AND timestamp > NOW() - INTERVAL '1 hour';

-- Error rate by code (last 1 hour)
SELECT
  error_code,
  COUNT(*) AS error_count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () AS error_percentage
FROM logs
WHERE service = 'MessagingServiceV2'
  AND event = 'error'
  AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY error_code
ORDER BY error_count DESC;
```

### 4.5 Alerting Rules

**Critical Alerts** (Page on-call engineer):

1. **Conversation Creation Failure Spike**
   - Condition: Success rate < 80% for 5 minutes
   - Action: Page on-call, disable V2 via feature flag

2. **RPC Function Timeout**
   - Condition: Any RPC call takes > 5 seconds
   - Action: Page on-call, investigate database

3. **Database Connection Pool Exhaustion**
   - Condition: Connection errors > 10 per minute
   - Action: Page on-call, scale database

**Warning Alerts** (Slack notification):

1. **Elevated Error Rate**
   - Condition: Error rate > 5% for 5 minutes
   - Action: Notify team, investigate

2. **High Latency**
   - Condition: p95 latency > 1000ms for 5 minutes
   - Action: Notify team, check database performance

3. **Duplicate Conversation Attempts**
   - Condition: `conversation_exists` errors > 10% of total attempts
   - Action: Investigate client-side race conditions

---

## 5. Service Contract Documentation

### 5.1 Public API Endpoints

**File**: `docs/messaging-rebuild/service-contract-v2.md`

```markdown
# Messaging Service V2 - API Contract

## Endpoints

### POST /api/messaging/help-requests/[id]/start-conversation

Start a conversation to offer help on a help request.

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "initial_message": "Hello! I can help with your groceries. When do you need them?"
}
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "help_request_id": "ac7847d9-ac76-462e-a48b-354169011e9b",
  "message": "Conversation started successfully.",
  "version": "v2"
}
```

**Error Responses**:

- **400 Bad Request** - Invalid input, help request closed, or self-help attempt
- **403 Forbidden** - User not approved or restricted
- **404 Not Found** - Help request not found
- **409 Conflict** - Conversation already exists
- **429 Too Many Requests** - Rate limit exceeded (10 conversations/hour)
- **500 Internal Server Error** - Database or RPC error

**Validation Rules**:
- `initial_message`: 10-1000 characters, trimmed
- Help request must exist and be `open` or `in_progress`
- Helper cannot be help request owner

---

### POST /api/messaging/conversations/[id]/messages

Send a message in an existing conversation.

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "content": "I'm available tomorrow at 2pm. Does that work for you?"
}
```

**Success Response** (201 Created):
```json
{
  "message": {
    "id": "msg-uuid",
    "conversation_id": "conv-uuid",
    "sender_id": "user-uuid",
    "content": "I'm available tomorrow at 2pm. Does that work for you?",
    "created_at": "2025-10-30T15:30:00.000Z",
    "updated_at": "2025-10-30T15:30:00.000Z"
  },
  "status": "sent",
  "version": "v2"
}
```

**Error Responses**:
- **400 Bad Request** - Invalid message content or prohibited content
- **403 Forbidden** - User not participant in conversation or restricted
- **404 Not Found** - Conversation not found
- **429 Too Many Requests** - Rate limit exceeded (50 messages/minute)
- **500 Internal Server Error** - Database or RPC error

**Validation Rules**:
- `content`: 1-1000 characters, trimmed
- Sender must be participant (requester or helper)
- Conversation must be `active` (not archived)

---

### GET /api/messaging/conversations

List user's conversations.

**Authentication**: Required (Bearer token)

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20, max: 100)

**Success Response** (200 OK):
```json
{
  "conversations": [
    {
      "id": "conv-uuid",
      "help_request_id": "request-uuid",
      "requester_id": "requester-uuid",
      "helper_id": "helper-uuid",
      "initial_message": "Hello! I can help...",
      "status": "active",
      "created_at": "2025-10-30T15:00:00.000Z",
      "updated_at": "2025-10-30T15:30:00.000Z",
      "help_request": {
        "id": "request-uuid",
        "title": "Need groceries",
        "category": "groceries",
        "urgency": "normal",
        "status": "in_progress"
      },
      "unread_count": 2,
      "last_message": {
        "id": "msg-uuid",
        "content": "Sounds good!",
        "created_at": "2025-10-30T15:30:00.000Z"
      },
      "version": "v2"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "has_more": false
  }
}
```

---

### GET /api/messaging/conversations/[id]/messages

Get messages in a conversation.

**Authentication**: Required (Bearer token)

**Query Parameters**:
- `cursor` (optional): Pagination cursor (ISO timestamp)
- `limit` (optional): Results per page (default: 50, max: 100)
- `direction` (optional): `older` (default) or `newer`

**Success Response** (200 OK):
```json
{
  "messages": [
    {
      "id": "msg-uuid",
      "conversation_id": "conv-uuid",
      "sender_id": "user-uuid",
      "content": "Hello!",
      "created_at": "2025-10-30T15:00:00.000Z",
      "updated_at": "2025-10-30T15:00:00.000Z"
    }
  ],
  "pagination": {
    "cursor": "2025-10-30T15:00:00.000Z",
    "limit": 50,
    "has_more": false
  }
}
```

## Internal Service Methods

### MessagingServiceV2.startHelpConversation()

**Signature**:
```typescript
async startHelpConversation(
  helperId: string,
  params: CreateConversationParamsV2
): Promise<ConversationV2>
```

**Parameters**:
- `helperId`: UUID of user offering help
- `params.help_request_id`: UUID of help request
- `params.initial_message`: Initial message (10-1000 chars)

**Returns**: `ConversationV2` object

**Throws**:
- `MessagingServiceError` with error code

**Side Effects**:
- INSERT into `conversations_v2` table
- Updates help request status to `in_progress` (if first conversation)

**Database Contract**: Calls RPC `create_conversation_atomic()`

---

### MessagingServiceV2.sendMessage()

**Signature**:
```typescript
async sendMessage(
  senderId: string,
  params: SendMessageParamsV2
): Promise<MessageV2>
```

**Parameters**:
- `senderId`: UUID of message sender
- `params.conversation_id`: UUID of conversation
- `params.content`: Message content (1-1000 chars)

**Returns**: `MessageV2` object

**Throws**:
- `MessagingServiceError` with error code

**Side Effects**:
- INSERT into `messages_v2` table
- Triggers Supabase Realtime event for subscribers

**Database Contract**: Calls RPC `send_message_v2()`

## Database Contracts

### RPC: create_conversation_atomic()

**Signature**:
```sql
create_conversation_atomic(
  p_help_request_id uuid,
  p_helper_id uuid,
  p_initial_message text
) RETURNS jsonb
```

**Success Response**:
```json
{
  "success": true,
  "conversation_id": "uuid",
  "message": "Conversation created successfully"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Conversation already exists for this help request and helper",
  "message": "Failed to create conversation"
}
```

**Error Messages**:
- `"Initial message must be at least 10 characters long"`
- `"Initial message cannot exceed 1000 characters"`
- `"Help request not found"`
- `"Cannot create conversation with yourself"`
- `"Help request is no longer available"`
- `"Conversation already exists for this help request and helper"`

**Transaction**: Atomic (single INSERT with validation)

**RLS Bypass**: SECURITY DEFINER (runs with elevated privileges)

---

### RPC: send_message_v2()

**Signature**:
```sql
send_message_v2(
  p_conversation_id uuid,
  p_sender_id uuid,
  p_content text
) RETURNS jsonb
```

**Success Response**:
```json
{
  "success": true,
  "message_id": "uuid",
  "message": "Message sent successfully"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Not authorized to send messages in this conversation",
  "message": "Failed to send message"
}
```

**Error Messages**:
- `"Message content cannot be empty"`
- `"Message cannot exceed 1000 characters"`
- `"Not authorized to send messages in this conversation"`
- `"Cannot send message on behalf of another user"` (security check)

**Transaction**: Atomic (single INSERT with validation)

**RLS Bypass**: SECURITY DEFINER (runs with elevated privileges)

---

### Tables: RLS Policies

**conversations_v2**:
- SELECT: `auth.uid() = requester_id OR auth.uid() = helper_id`
- INSERT: `auth.uid() = helper_id AND help_request exists and is open`
- UPDATE: `auth.uid() = requester_id OR auth.uid() = helper_id`

**messages_v2**:
- SELECT: User is participant in parent conversation
- INSERT: `auth.uid() = sender_id AND user is participant AND conversation is active`
```

---

## 6. Implementation Checklist

### 6.1 Pre-Implementation

- [x] Phase 2 V2 schema deployed to production
- [x] Security fix applied (auth.uid() verification in RPC functions)
- [x] TypeScript types regenerated (`npm run db:types`)
- [x] Phase 3 design approved by engineering lead

### 6.2 Code Implementation

- [ ] Create `lib/messaging/service-v2.ts` (MessagingServiceV2 class)
- [ ] Create `lib/messaging/types-v2.ts` (V2-specific types)
- [ ] Update `lib/messaging/types.ts` (add ErrorCodes, MessagingServiceError)
- [ ] Update `lib/features.ts` (add isMessagingV2Enabled function)
- [ ] Refactor `app/api/messaging/help-requests/[id]/start-conversation/route.ts` (V2 support)
- [ ] Refactor `app/api/messaging/conversations/[id]/messages/route.ts` (V2 support)
- [ ] Update `app/api/messaging/conversations/route.ts` (merge V1/V2 results)
- [ ] Create service contract documentation (`docs/messaging-rebuild/service-contract-v2.md`)

### 6.3 Testing

- [ ] Unit tests for MessagingServiceV2 class
- [ ] Unit tests for error mapping logic
- [ ] Integration tests for API routes (V2 paths)
- [ ] E2E test: Help request → offer help → create conversation → send message
- [ ] E2E test: Duplicate conversation attempt (should return existing)
- [ ] E2E test: Self-help prevention
- [ ] E2E test: Closed help request rejection
- [ ] Feature flag tests (internal, percentage, enabled, disabled)

### 6.4 Deployment Preparation

- [ ] Configure feature flag in Vercel environment variables (`MESSAGING_V2_ROLLOUT=disabled`)
- [ ] Set up monitoring dashboards (error rates, latency, success rates)
- [ ] Set up alerting rules (critical and warning thresholds)
- [ ] Document rollback procedure
- [ ] Brief support team on V2 changes and feature flag

### 6.5 Deployment Execution

- [ ] Deploy V2 service code to production (feature flag `disabled`)
- [ ] Run smoke tests (verify V1 still works, V2 code loaded but inactive)
- [ ] Enable V2 for internal users (`MESSAGING_V2_ROLLOUT=internal`)
- [ ] Internal testing (2-3 days)
- [ ] Enable V2 for 10% of users (`MESSAGING_V2_ROLLOUT=percentage:10`)
- [ ] Monitor for 3-4 days
- [ ] Enable V2 for 50% of users (`MESSAGING_V2_ROLLOUT=percentage:50`)
- [ ] Monitor for 1 week
- [ ] Enable V2 for 100% of users (`MESSAGING_V2_ROLLOUT=enabled`)
- [ ] Monitor for 2 weeks before V1 deprecation planning

### 6.6 Post-Deployment Validation

- [ ] Conversation creation success rate > 99%
- [ ] Message send latency p95 < 500ms
- [ ] Error rate < 1%
- [ ] No critical bugs reported
- [ ] V1 conversations still readable
- [ ] Real-time updates working for V2
- [ ] Feature flag rollout smooth (no user complaints)

---

## 7. Rollback Plan

### 7.1 Instant Rollback (Feature Flag)

**Scenario**: V2 has critical bug, users experiencing failures.

**Steps**:
1. Set `NEXT_PUBLIC_MESSAGING_V2_ROLLOUT=disabled` in Vercel environment variables
2. Redeploy with `vercel --prod`
3. Verify V1 conversations working
4. Monitor error rates (should drop to normal)

**Duration**: < 1 minute (environment variable change + redeploy)

**Risk**: LOW - V1 code unchanged, no data loss

### 7.2 Code Rollback

**Scenario**: V2 code breaks V1 functionality.

**Steps**:
1. Revert Git commit with V2 changes (`git revert <commit-hash>`)
2. Push to main branch
3. Vercel auto-deploys
4. Verify V1 working

**Duration**: 2-5 minutes (Git revert + auto-deploy)

**Risk**: LOW - Git history preserved, clean revert

### 7.3 Database Rollback (LAST RESORT)

**Scenario**: V2 deployment corrupted database (highly unlikely with additive migrations).

**Steps**:
1. Restore from pre-V2 backup (`supabase db restore backup_pre_v2_*.sql`)
2. Drop V2 tables (`DROP TABLE messages_v2 CASCADE; DROP TABLE conversations_v2 CASCADE;`)
3. Drop V2 RPC functions
4. Redeploy V1-only code

**Duration**: 15-30 minutes (database restore)

**Risk**: HIGH - Data loss (V2 conversations created during deployment lost)

**Prevention**: Never run this unless database actually corrupted (extremely rare)

---

## Conclusion

### Summary

This blueprint provides a complete implementation plan for Phase 3 (Service Layer Integration) of the Messaging V2 rebuild. The design prioritizes:

✅ **Safety**: Parallel V1/V2 operation with instant rollback capability
✅ **Simplicity**: V2 service encapsulates RPC complexity, API routes simplified
✅ **Observability**: Structured logging, error codes, metrics tracking
✅ **Backward Compatibility**: V1 conversations remain accessible

### Key Design Decisions

1. **New V2 Service Module** (Option A) - Safe, gradual migration
2. **Feature Flag Rollout** - Internal → 10% → 50% → 100%
3. **Structured Error Handling** - Error codes, detailed context, HTTP status codes
4. **Dual Conversation Support** - API routes detect V1 vs V2 automatically

### Next Steps

1. **Implement service-v2.ts** and types-v2.ts
2. **Refactor API routes** to support V2
3. **Deploy with feature flag disabled**
4. **Internal testing** (2-3 days)
5. **Gradual rollout** (10% → 50% → 100% over 2 weeks)

### Success Criteria

**Phase 3 Complete When**:
- ✅ V2 API endpoints functional and tested
- ✅ Feature flag controls V1/V2 usage
- ✅ No breaking changes to V1 flows
- ✅ Structured error handling implemented
- ✅ Observability (logging, metrics) configured
- ✅ 80%+ test coverage for V2 code
- ✅ Internal testing successful (< 1% error rate)

---

**Document Version**: 1.0
**Last Updated**: October 30, 2025
**Next Phase**: Phase 4 (Front-End Integration)
**Owner**: Engineering Team
**Classification**: INTERNAL - Technical Specification
