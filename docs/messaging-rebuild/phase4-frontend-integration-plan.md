# Phase 4: Front-End Integration & UX Hardening Plan

**Date**: October 30, 2025
**Status**: Planning
**Priority**: CRITICAL - Fixes 100% conversation creation failure rate

---

## Executive Summary

This document details the front-end integration strategy for the Messaging V2 system. The primary goal is to replace broken V1 conversation creation flows with atomic V2 APIs while maintaining backward compatibility during transition.

**Critical Path**: The "Offer Help" button flow is currently experiencing 100% failure rate due to V1 race conditions. V2 atomic RPC calls will resolve this.

**Migration Strategy**: Parallel operation (V1 and V2 coexist) with feature flag control, allowing gradual rollout.

---

## Table of Contents

1. [Component Inventory & Direct Supabase Usage Audit](#1-component-inventory--direct-supabase-usage-audit)
2. [Data Flow Architecture](#2-data-flow-architecture)
3. [Component-Level Refactor Details](#3-component-level-refactor-details)
4. [UI State Management](#4-ui-state-management)
5. [Real-Time & Analytics Strategy](#5-real-time--analytics-strategy)
6. [Component Refactor Priority Map](#6-component-refactor-priority-map)
7. [Testing Plan](#7-testing-plan)
8. [Implementation Checklist](#8-implementation-checklist)

---

## 1. Component Inventory & Direct Supabase Usage Audit

### 1.1 Pages

#### `app/messages/page.tsx`
**Purpose**: Main messaging dashboard (Server Component)

**Current Direct Supabase Usage**:
- ✅ **Line 20-38**: `getUser()` - Auth check via `supabase.auth.getUser()`
- ✅ **Line 28-32**: Profile fetch via `supabase.from('profiles').select()`
- ❌ **Line 46-50**: V1-specific `conversation_participants` query
- ❌ **Line 59-84**: V1 conversation fetch with `!inner` join on `conversation_participants`
- ❌ **Line 92-96**: V1 unread count query on `messages` table
- ❌ **Line 103-154**: Complex V1 data transformation with N+1 queries

**V1 Assumptions**:
- Expects `conversation_participants` table to exist
- Assumes `messages` table (not `messages_v2`)
- Uses N+1 queries to fetch last message for each conversation
- Relies on `conversation_participants.left_at` for filtering

**Required Changes**:
1. Keep `getUser()` and profile fetch (auth logic unchanged)
2. Replace `getMessagingData()` with:
   - Option A: Call V2 RPC function `get_user_conversations_v2(user_id)`
   - Option B: Fetch from new API route `/api/messaging/v2/conversations`
3. Add feature flag check to route to V1 or V2
4. Update `ConversationWithDetails` type to handle both V1 and V2 structures

**Migration Path**:
```typescript
async function getMessagingData(userId: string) {
  const supabase = await createClient();
  const isV2Enabled = await checkFeatureFlag('messaging_v2_enabled');

  if (isV2Enabled) {
    // V2 atomic query via RPC
    const { data, error } = await supabase.rpc('get_user_conversations_v2', {
      p_user_id: userId,
      p_limit: 20
    });

    if (error) {
      console.error('V2 conversations fetch failed:', error);
      // Fallback to V1 or return empty
    }

    return {
      conversations: data?.conversations || [],
      unreadCount: data?.total_unread || 0,
      activeConversations: data?.conversations?.length || 0
    };
  } else {
    // Existing V1 logic (current implementation)
    // ...
  }
}
```

---

### 1.2 Components

#### `components/messaging/MessagingDashboard.tsx`
**Purpose**: Client-side messaging UI (two-pane layout, real-time updates)

**Current Direct Supabase Usage**:
- ❌ **Line 69**: `createClient()` - Direct Supabase client
- ❌ **Line 102-146**: V1 conversation fetch with `conversation_participants` join
- ❌ **Line 128-146**: V1 messages query on `messages` table
- ❌ **Line 169-176**: V1 mark-as-read update on `messages` table
- ❌ **Line 201-211**: V1 message insert on `messages` table
- ❌ **Line 257-303**: V1 real-time subscription to `messages` table

**V1 Assumptions**:
- Direct database access from client
- V1 table structure (`messages`, `conversation_participants`)
- Manual recipient ID resolution from participants array
- Client-side conversation fetching

**Required Changes**:
1. **Remove direct Supabase client usage** - All data operations via API routes
2. **Refactor `loadMessages()`** to call `/api/messaging/conversations/[id]/messages`
3. **Refactor `handleSendMessage()`** to call POST `/api/messaging/conversations/[id]/messages`
4. **Update real-time subscription** to listen to both `messages` (V1) and `messages_v2` (V2) tables
5. **Add optimistic updates** for better UX during send

**New Implementation Pattern**:
```typescript
// Replace direct Supabase calls with API routes
const loadMessages = useCallback(async (conversationId: string) => {
  setMessageThread(prev => ({ ...prev, loading: true, error: null }));

  try {
    const response = await fetch(`/api/messaging/conversations/${conversationId}/messages`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to load messages');
    }

    const data = await response.json();

    setMessageThread({
      messages: data.messages || [],
      conversation: data.conversation,
      loading: false,
      error: null
    });

    // Mark as read via API
    await fetch(`/api/messaging/conversations/${conversationId}/messages/mark-read`, {
      method: 'PUT'
    });

  } catch (error) {
    setMessageThread({
      messages: [],
      conversation: null,
      loading: false,
      error: error instanceof Error ? error.message : 'Failed to load messages'
    });
  }
}, []);

const handleSendMessage = useCallback(async (content: string) => {
  if (!selectedConversation) return;

  // Optimistic update
  const optimisticMessage = {
    id: `temp-${Date.now()}`,
    content,
    sender_id: userId,
    created_at: new Date().toISOString(),
    status: 'sending' as const,
    sender: { id: userId, name: userName || 'You' }
  };

  setMessageThread(prev => ({
    ...prev,
    messages: [...prev.messages, optimisticMessage]
  }));

  try {
    const response = await fetch(`/api/messaging/conversations/${selectedConversation}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send message');
    }

    const data = await response.json();

    // Replace optimistic message with server response
    setMessageThread(prev => ({
      ...prev,
      messages: prev.messages.map(msg =>
        msg.id === optimisticMessage.id ? data.message : msg
      )
    }));

  } catch (error) {
    // Mark optimistic message as failed
    setMessageThread(prev => ({
      ...prev,
      messages: prev.messages.map(msg =>
        msg.id === optimisticMessage.id
          ? { ...msg, status: 'failed' as const, error: error.message }
          : msg
      )
    }));

    throw error; // Re-throw for UI error handling
  }
}, [selectedConversation, userId, userName]);
```

**Real-Time Subscription Strategy** (Dual V1/V2 Support):
```typescript
useEffect(() => {
  if (!enableRealtime || !selectedConversation) return;

  // Subscribe to both V1 and V2 message tables during transition
  const messagesV1Channel = supabase
    .channel(`messages:${selectedConversation}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${selectedConversation}`
    }, handleNewMessage)
    .subscribe();

  const messagesV2Channel = supabase
    .channel(`messages_v2:${selectedConversation}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages_v2',
      filter: `conversation_id=eq.${selectedConversation}`
    }, handleNewMessage)
    .subscribe();

  return () => {
    supabase.removeChannel(messagesV1Channel);
    supabase.removeChannel(messagesV2Channel);
  };
}, [enableRealtime, selectedConversation]);

const handleNewMessage = async (payload: any) => {
  const newMessage = payload.new;

  // Fetch full message with sender/recipient profiles
  const { data: messageWithProfiles } = await fetch(
    `/api/messaging/messages/${newMessage.id}`
  ).then(r => r.json());

  if (messageWithProfiles) {
    setMessageThread(prev => {
      // Deduplicate
      const exists = prev.messages.some(msg => msg.id === messageWithProfiles.id);
      if (exists) return prev;

      return {
        ...prev,
        messages: [...prev.messages, messageWithProfiles]
      };
    });
  }
};
```

---

#### `components/messaging/ConversationList.tsx`
**Purpose**: Display list of conversations with unread counts

**Current Direct Supabase Usage**:
- ✅ None (receives data via props)

**V1 Assumptions**:
- Expects `conversation.participants` array
- Assumes `last_message` structure from V1 queries

**Required Changes**:
1. **Add type guard** to detect V1 vs V2 conversation structures
2. **Render both** conversation types gracefully
3. **Update participant display** logic to handle V2's `requester_id`/`helper_id` fields

**Implementation**:
```typescript
interface ConversationListProps {
  conversations: Array<ConversationV1 | ConversationV2>;
  // ... existing props
}

// Type guard
function isV2Conversation(conv: any): conv is ConversationV2 {
  return 'requester_id' in conv && 'helper_id' in conv;
}

function ConversationItem({ conversation }: { conversation: ConversationV1 | ConversationV2 }) {
  // Extract other participant based on conversation type
  const otherParticipant = isV2Conversation(conversation)
    ? conversation.requester_id === currentUserId
      ? conversation.helper_profile
      : conversation.requester_profile
    : conversation.participants.find(p => p.user_id !== currentUserId);

  const lastMessage = isV2Conversation(conversation)
    ? conversation.initial_message // V2 stores initial message
    : conversation.last_message;

  // ... rest of component
}
```

---

#### `components/messaging/MessageInput.tsx`
**Purpose**: Message composition with character count, validation, typing indicators

**Current Direct Supabase Usage**:
- ✅ None (calls parent `onSendMessage` callback)

**V1 Assumptions**:
- Expects parent to handle message sending
- Uses V1 validation schema

**Required Changes**:
1. **Keep existing implementation** (no direct Supabase usage)
2. **Update validation** to use V2 schemas if needed
3. **Add retry mechanism** for failed messages
4. **Improve error messages** with specific error codes

**Enhanced Error Handling**:
```typescript
const handleSendMessage = async () => {
  try {
    await onSendMessage(content.trim());
    setContent('');
    setError(null);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send message';

    // Parse error codes for user-friendly messages
    if (errorMessage.includes('rate_limited')) {
      setError('You are sending messages too quickly. Please wait a moment.');
    } else if (errorMessage.includes('content_moderated')) {
      setError('Your message was blocked by content filters. Please revise and try again.');
    } else if (errorMessage.includes('permission_denied')) {
      setError('You do not have permission to send messages in this conversation.');
    } else {
      setError('Failed to send message. Please try again.');
    }
  }
};
```

---

#### `components/help-requests/HelpRequestCardWithMessaging.tsx`
**Purpose**: "Offer Help" button - CRITICAL BROKEN COMPONENT

**Current Direct Supabase Usage**:
- ✅ None (calls API route)

**Current Issues** (100% failure rate):
- ❌ **Line 134**: Calls `/api/messaging/help-requests/[id]/start-conversation`
- ❌ API route experiences race conditions creating conversation
- ❌ Returns generic 500 error with no recovery options
- ❌ No error-specific handling (duplicate conversation, permissions, etc.)
- ❌ No loading/error/success states visible to user

**V1 Assumptions**:
- Expects conversation creation to succeed atomically (it doesn't)
- Assumes simple success/failure (no error codes)

**Required Changes** (HIGHEST PRIORITY):

1. **Enhanced Error Handling**:
```typescript
const handleSubmitOffer = async () => {
  if (!offerMessage.trim() || submitting) return;

  setSubmitting(true);
  setError(null);

  try {
    const response = await fetch(
      `/api/messaging/help-requests/${request.id}/start-conversation`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initial_message: offerMessage.trim() })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();

      // Handle specific error codes
      switch (errorData.error?.code) {
        case 'conversation_exists':
          // User already has a conversation for this request
          toast.info('You already have a conversation for this request');

          // Navigate to existing conversation
          if (errorData.conversation_id) {
            router.push(`/messages?conversation=${errorData.conversation_id}`);
          } else {
            router.push('/messages');
          }
          setShowOfferDialog(false);
          return;

        case 'help_request_unavailable':
          toast.error('This help request is no longer available');
          setError('This help request has been closed or removed.');
          break;

        case 'permission_denied':
          toast.error('You must be approved to offer help');
          setError('Your account needs approval before you can offer help. Please complete verification.');
          break;

        case 'user_restricted':
          toast.error('You are temporarily restricted from starting conversations');
          setError('Your account has messaging restrictions. Please contact support.');
          break;

        case 'rate_limited':
          toast.warning('Too many help offers');
          setError('You have offered help on too many requests recently. Please wait a few minutes.');
          break;

        default:
          toast.error('Failed to start conversation');
          setError(errorData.error || 'Failed to start conversation. Please try again.');
      }

      return;
    }

    const data = await response.json();

    if (!data.success || !data.conversation_id) {
      throw new Error('Invalid response from server');
    }

    // Success!
    setSuccess(true);
    toast.success('Conversation started! You can now coordinate help.');

    // Notify parent component
    onConversationStarted?.(data.conversation_id);

    // Auto-navigate after brief success message
    setTimeout(() => {
      setShowOfferDialog(false);
      setSuccess(false);
      setOfferMessage('');
      router.push(`/messages?conversation=${data.conversation_id}`);
    }, 1500);

  } catch (err) {
    console.error('Unexpected error starting conversation:', err);
    toast.error('Network error. Please check your connection.');
    setError('Network error. Please check your connection and try again.');
  } finally {
    setSubmitting(false);
  }
};
```

2. **Enhanced UI States**:
```typescript
{/* Loading State */}
{submitting && (
  <div className="flex items-center justify-center p-4">
    <Loader2 className="w-6 h-6 animate-spin text-sage" />
    <span className="ml-2 text-muted-foreground">Starting conversation...</span>
  </div>
)}

{/* Success State */}
{success && (
  <div className="text-center py-8 space-y-4">
    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
      <CheckCircle className="w-8 h-8 text-green-600" />
    </div>
    <div>
      <h3 className="text-lg font-semibold text-green-700">Conversation Started!</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Redirecting to your messages...
      </p>
    </div>
  </div>
)}

{/* Error State */}
{error && !submitting && (
  <Alert variant="destructive" className="mb-4">
    <AlertCircle className="w-4 h-4" />
    <AlertDescription>
      {error}
      {error.includes('approval') && (
        <Button
          variant="link"
          size="sm"
          className="mt-2"
          onClick={() => router.push('/settings/verification')}
        >
          Complete Verification →
        </Button>
      )}
    </AlertDescription>
  </Alert>
)}
```

3. **Retry Mechanism**:
```typescript
const [retryCount, setRetryCount] = useState(0);
const MAX_RETRIES = 3;

const handleRetry = () => {
  if (retryCount < MAX_RETRIES) {
    setRetryCount(prev => prev + 1);
    setError(null);
    handleSubmitOffer();
  } else {
    setError('Maximum retry attempts reached. Please try again later.');
  }
};

// In error UI
{error && (
  <div className="flex items-center gap-2 mt-2">
    <Button
      variant="outline"
      size="sm"
      onClick={handleRetry}
      disabled={retryCount >= MAX_RETRIES}
    >
      {retryCount > 0 ? `Retry (${MAX_RETRIES - retryCount} left)` : 'Retry'}
    </Button>
    {retryCount >= MAX_RETRIES && (
      <span className="text-xs text-muted-foreground">
        Please contact support if this persists
      </span>
    )}
  </div>
)}
```

---

### 1.3 API Routes

#### `app/api/messaging/help-requests/[id]/start-conversation/route.ts`
**Purpose**: Backend for conversation creation - CRITICAL FAILURE POINT

**Current Direct Supabase Usage**:
- ❌ **Line 143-161**: V1 help request fetch
- ❌ **Line 228-282**: Complex duplicate conversation check (N+1 queries, RLS recursion risk)
- ❌ **Line 296**: Calls `messagingClient.startHelpConversation()` which has race conditions

**Current Issues**:
- Race condition between conversation creation and participant insertion
- RLS policies cause recursion in `!inner` joins
- No transaction support (multi-table writes not atomic)
- Generic error messages

**Required Changes** (V2 Integration):

1. **Replace with Atomic RPC Call**:
```typescript
// V2 implementation using atomic RPC
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const helpRequestId = params.id;
    const body = await request.json();

    // Validate input
    const validation = messagingValidation.helpRequestConversation.safeParse({
      help_request_id: helpRequestId,
      ...body
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          code: 'invalid_input',
          details: validation.error.issues
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check feature flag
    const isV2Enabled = await checkFeatureFlag('messaging_v2_enabled');

    if (isV2Enabled) {
      // V2 atomic RPC call (single database round-trip)
      const { data, error } = await supabase.rpc('create_help_conversation_v2', {
        p_help_request_id: helpRequestId,
        p_helper_id: user.id,
        p_initial_message: validation.data.initial_message
      });

      if (error) {
        // Parse specific error codes from RPC function
        if (error.message.includes('duplicate_conversation')) {
          return NextResponse.json(
            {
              error: 'You already have a conversation about this help request',
              code: 'conversation_exists',
              conversation_id: error.details?.conversation_id
            },
            { status: 409 }
          );
        }

        if (error.message.includes('help_request_closed')) {
          return NextResponse.json(
            {
              error: 'This help request is no longer accepting offers',
              code: 'help_request_unavailable'
            },
            { status: 400 }
          );
        }

        if (error.message.includes('permission_denied')) {
          return NextResponse.json(
            {
              error: 'You do not have permission to offer help',
              code: 'permission_denied'
            },
            { status: 403 }
          );
        }

        // Generic error fallback
        console.error('V2 conversation creation failed:', error);
        return NextResponse.json(
          {
            error: 'Failed to start conversation',
            code: 'server_error'
          },
          { status: 500 }
        );
      }

      // Success!
      return NextResponse.json({
        success: true,
        conversation_id: data.conversation_id,
        message: 'Conversation started successfully'
      }, { status: 201 });

    } else {
      // V1 fallback (existing implementation)
      // ... current logic
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'server_error'
      },
      { status: 500 }
    );
  }
}
```

2. **V2 RPC Function** (to be created in Phase 3 implementation):
```sql
CREATE OR REPLACE FUNCTION create_help_conversation_v2(
  p_help_request_id uuid,
  p_helper_id uuid,
  p_initial_message text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id uuid;
  v_requester_id uuid;
  v_help_request_status text;
  v_existing_conversation_id uuid;
BEGIN
  -- 1. Validate help request exists and is open
  SELECT user_id, status INTO v_requester_id, v_help_request_status
  FROM help_requests
  WHERE id = p_help_request_id;

  IF v_requester_id IS NULL THEN
    RAISE EXCEPTION 'help_request_not_found';
  END IF;

  IF v_help_request_status != 'open' THEN
    RAISE EXCEPTION 'help_request_closed';
  END IF;

  -- Prevent self-help
  IF v_requester_id = p_helper_id THEN
    RAISE EXCEPTION 'cannot_help_own_request';
  END IF;

  -- 2. Check for existing conversation (atomic)
  SELECT id INTO v_existing_conversation_id
  FROM conversations_v2
  WHERE help_request_id = p_help_request_id
    AND requester_id = v_requester_id
    AND helper_id = p_helper_id;

  IF v_existing_conversation_id IS NOT NULL THEN
    RAISE EXCEPTION 'duplicate_conversation: %', json_build_object(
      'conversation_id', v_existing_conversation_id
    )::text;
  END IF;

  -- 3. Create conversation (atomic with message)
  INSERT INTO conversations_v2 (
    help_request_id,
    requester_id,
    helper_id,
    initial_message,
    created_at,
    last_message_at
  ) VALUES (
    p_help_request_id,
    v_requester_id,
    p_helper_id,
    p_initial_message,
    now(),
    now()
  )
  RETURNING id INTO v_conversation_id;

  -- 4. Create initial message
  INSERT INTO messages_v2 (
    conversation_id,
    sender_id,
    content,
    message_type,
    created_at
  ) VALUES (
    v_conversation_id,
    p_helper_id,
    p_initial_message,
    'text',
    now()
  );

  -- 5. Return result
  RETURN json_build_object(
    'conversation_id', v_conversation_id,
    'created_at', now()
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;
```

---

#### `app/api/messaging/conversations/[id]/messages/route.ts`
**Purpose**: Send and fetch messages for a conversation

**Current Direct Supabase Usage**:
- ❌ **Line 89**: Calls `messagingClient.getMessages()` (V1)
- ❌ **Line 199**: Calls `messagingClient.sendMessage()` (V1)
- ❌ **Line 206-223**: V1 message fetch with joins

**Required Changes**:

1. **Add V2 Support via Feature Flag**:
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const conversationId = params.id;
  const isV2Enabled = await checkFeatureFlag('messaging_v2_enabled');

  if (isV2Enabled) {
    // V2 implementation
    const { data, error } = await supabase.rpc('get_conversation_messages_v2', {
      p_conversation_id: conversationId,
      p_user_id: user.id,
      p_limit: 50
    });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    return NextResponse.json(data);
  } else {
    // V1 fallback (existing implementation)
    // ...
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const conversationId = params.id;
  const body = await request.json();

  const isV2Enabled = await checkFeatureFlag('messaging_v2_enabled');

  if (isV2Enabled) {
    // V2 atomic message send
    const { data, error } = await supabase.rpc('send_message_v2', {
      p_conversation_id: conversationId,
      p_sender_id: user.id,
      p_content: body.content,
      p_message_type: body.message_type || 'text'
    });

    if (error) {
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json({ message: data }, { status: 201 });
  } else {
    // V1 fallback (existing implementation)
    // ...
  }
}
```

---

### 1.4 Custom Hooks

#### `hooks/useMessaging.ts`
**Purpose**: React hook for conversation list management

**Current Direct Supabase Usage**:
- ✅ None (calls API routes)

**V1 Assumptions**:
- Expects `/api/messaging/conversations` to return V1 structure
- Uses `conversation.unread_count` for badge display

**Required Changes**:
1. **Add version detection** to handle V1 and V2 responses
2. **Normalize response** to common interface
3. **Add error recovery** strategies

**Implementation**:
```typescript
export function useMessaging({ userId }: UseMessagingOptions) {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshConversations = useCallback(async () => {
    try {
      setError(null);

      const response = await fetch('/api/messaging/conversations');

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();

      // Normalize V1 and V2 responses
      const normalizedConversations = data.conversations.map((conv: any) => {
        if (isV2Conversation(conv)) {
          // V2 structure
          return {
            id: conv.id,
            help_request_id: conv.help_request_id,
            last_message_at: conv.last_message_at,
            unread_count: conv.unread_count || 0,
            other_participant: conv.requester_id === userId
              ? conv.helper_profile
              : conv.requester_profile,
            help_request: conv.help_request,
            last_message: conv.initial_message ? {
              content: conv.initial_message,
              created_at: conv.created_at
            } : undefined
          };
        } else {
          // V1 structure (as-is)
          return conv;
        }
      });

      setConversations(normalizedConversations);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ... rest of hook
}
```

---

## 2. Data Flow Architecture

### 2.1 Decision: Server Components + API Routes (Hybrid)

**Rationale**:
- **Server Components** for initial data load (SEO, performance)
- **API Routes** for mutations and real-time updates (security, validation)
- **Client Components** for interactivity (typing indicators, optimistic updates)

**Architecture Diagram**:
```
┌─────────────────────────────────────────────────────────────────┐
│                    app/messages/page.tsx                         │
│                    (Server Component)                            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Server-Side Data Fetching                                 │   │
│  │ - getUser() - Auth check                                  │   │
│  │ - getMessagingData(userId) - Fetch conversations          │   │
│  │   → V2: supabase.rpc('get_user_conversations_v2')        │   │
│  │   → V1: Direct Supabase queries (fallback)               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ <MessagingDashboard                                       │   │
│  │   initialConversations={conversations}                    │   │
│  │   userId={user.id}                                        │   │
│  │ />                                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│        components/messaging/MessagingDashboard.tsx               │
│                 (Client Component)                               │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Client-Side Operations (via API Routes)                   │   │
│  │                                                           │   │
│  │ loadMessages(conversationId)                              │   │
│  │   → GET /api/messaging/conversations/[id]/messages       │   │
│  │                                                           │   │
│  │ handleSendMessage(content)                                │   │
│  │   → POST /api/messaging/conversations/[id]/messages      │   │
│  │                                                           │   │
│  │ Real-Time Subscriptions (Supabase Realtime)              │   │
│  │   → supabase.channel('messages:${conversationId}')       │   │
│  │   → supabase.channel('messages_v2:${conversationId}')    │   │
│  │                                                           │   │
│  │ Optimistic Updates (local state)                         │   │
│  │   → Add message immediately, replace on server response   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              API Routes (Server-Side)                            │
│                                                                  │
│  /api/messaging/conversations                                   │
│    GET - List user's conversations                              │
│    POST - Create new conversation                               │
│                                                                  │
│  /api/messaging/conversations/[id]/messages                     │
│    GET - Fetch messages for conversation                        │
│    POST - Send new message                                      │
│    PUT - Mark messages as read                                  │
│                                                                  │
│  /api/messaging/help-requests/[id]/start-conversation           │
│    POST - Start conversation from help request (CRITICAL)       │
│                                                                  │
│  Feature Flag Check (all routes):                               │
│    if (isV2Enabled) → Use V2 RPC functions                      │
│    else → Use V1 Supabase queries                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Database Layer                                │
│                                                                  │
│  V2 RPC Functions (Atomic, Transaction-Safe)                    │
│    - create_help_conversation_v2(...)                           │
│    - get_user_conversations_v2(...)                             │
│    - get_conversation_messages_v2(...)                          │
│    - send_message_v2(...)                                       │
│                                                                  │
│  V1 Direct Queries (Fallback)                                   │
│    - conversations + conversation_participants joins            │
│    - messages table queries                                     │
│                                                                  │
│  Tables:                                                        │
│    - conversations_v2 (requester_id, helper_id, initial_message)│
│    - messages_v2 (conversation_id, sender_id, content)          │
│    - conversations (V1 - for backward compatibility)            │
│    - messages (V1 - for backward compatibility)                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 State Management: React Query (Recommended)

**Why React Query**:
- Automatic caching with smart invalidation
- Built-in loading/error states
- Optimistic updates support
- Real-time integration via Supabase Realtime
- SSR/ISR support with Next.js

**Alternative: Zustand** (if React Query adds too much complexity)

**Implementation Example**:
```typescript
// lib/messaging/queries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const messagingKeys = {
  all: ['messaging'] as const,
  conversations: () => [...messagingKeys.all, 'conversations'] as const,
  conversation: (id: string) => [...messagingKeys.all, 'conversation', id] as const,
  messages: (conversationId: string) => [...messagingKeys.conversation(conversationId), 'messages'] as const,
};

// Query: List conversations
export function useConversations(userId: string) {
  return useQuery({
    queryKey: messagingKeys.conversations(),
    queryFn: async () => {
      const response = await fetch('/api/messaging/conversations');
      if (!response.ok) throw new Error('Failed to fetch conversations');
      return response.json();
    },
    staleTime: 30_000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

// Query: Conversation messages
export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: messagingKeys.messages(conversationId),
    queryFn: async () => {
      const response = await fetch(`/api/messaging/conversations/${conversationId}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    staleTime: 10_000, // 10 seconds
    enabled: !!conversationId,
  });
}

// Mutation: Send message
export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/messaging/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }
      return response.json();
    },
    onMutate: async (content) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: messagingKeys.messages(conversationId) });

      const previousMessages = queryClient.getQueryData(messagingKeys.messages(conversationId));

      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        content,
        sender_id: userId,
        created_at: new Date().toISOString(),
        status: 'sending' as const,
      };

      queryClient.setQueryData(
        messagingKeys.messages(conversationId),
        (old: any) => ({
          ...old,
          messages: [...(old?.messages || []), optimisticMessage],
        })
      );

      return { previousMessages };
    },
    onError: (err, content, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          messagingKeys.messages(conversationId),
          context.previousMessages
        );
      }
      toast.error('Failed to send message');
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: messagingKeys.messages(conversationId) });
      queryClient.invalidateQueries({ queryKey: messagingKeys.conversations() });
    },
  });
}

// Mutation: Start help conversation
export function useStartHelpConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ helpRequestId, message }: { helpRequestId: string; message: string }) => {
      const response = await fetch(`/api/messaging/help-requests/${helpRequestId}/start-conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initial_message: message }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const error = new Error(errorData.error || 'Failed to start conversation');
        (error as any).code = errorData.code;
        (error as any).conversation_id = errorData.conversation_id;
        throw error;
      }

      return response.json();
    },
    onSuccess: () => {
      // Refresh conversations list
      queryClient.invalidateQueries({ queryKey: messagingKeys.conversations() });
      toast.success('Conversation started successfully!');
    },
    onError: (error: any) => {
      // Error handling in component
      console.error('Failed to start conversation:', error);
    },
  });
}
```

**Usage in Components**:
```typescript
// components/messaging/MessagingDashboard.tsx
'use client';

import { useConversations, useMessages, useSendMessage } from '@/lib/messaging/queries';

export function MessagingDashboard({ userId, initialConversations }: Props) {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  // Conversations query (with initial data from SSR)
  const { data: conversationsData, isLoading, error } = useConversations(userId);
  const conversations = conversationsData?.conversations || initialConversations;

  // Messages query (only when conversation selected)
  const { data: messagesData, isLoading: messagesLoading } = useMessages(selectedConversation!);
  const messages = messagesData?.messages || [];

  // Send message mutation
  const sendMessageMutation = useSendMessage(selectedConversation!);

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessageMutation.mutateAsync(content);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // ... rest of component
}
```

---

## 3. Component-Level Refactor Details

### 3.1 Summary of All Components

| Component | Direct Supabase? | V1 Dependencies | Refactor Priority | Changes Required |
|-----------|------------------|-----------------|-------------------|------------------|
| `app/messages/page.tsx` | ✅ Yes | `conversation_participants`, `messages` | HIGH | Replace data fetching with V2 RPC |
| `MessagingDashboard.tsx` | ✅ Yes | `conversation_participants`, `messages` | HIGH | API routes, dual real-time subscriptions |
| `ConversationList.tsx` | ❌ No | V1 data structure | MEDIUM | Type guards for V1/V2 conversations |
| `MessageInput.tsx` | ❌ No | V1 validation | LOW | Enhanced error handling |
| `MessageBubble.tsx` | ❌ No | V1 message structure | LOW | None (prop-based) |
| `VirtualizedMessageList.tsx` | ❌ No | V1 message structure | LOW | None (prop-based) |
| `HelpRequestCardWithMessaging.tsx` | ❌ No | V1 API response | CRITICAL | Enhanced error handling with codes |
| `/api/.../start-conversation/route.ts` | ✅ Yes | V1 tables, race conditions | CRITICAL | V2 atomic RPC call |
| `/api/.../messages/route.ts` | ✅ Yes | V1 `messages` table | HIGH | V2 RPC for send/fetch |
| `hooks/useMessaging.ts` | ❌ No | V1 API response | MEDIUM | Normalize V1/V2 responses |

---

## 4. UI State Management

### 4.1 Loading States

#### Skeleton Loaders (Initial Load)
```typescript
// ConversationList loading state
<div className="space-y-4 p-4">
  {Array.from({ length: 3 }).map((_, i) => (
    <Card key={i} className="p-4 animate-pulse">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-muted rounded-full" />
            <div className="w-24 h-4 bg-muted rounded" />
          </div>
          <div className="w-6 h-4 bg-muted rounded-full" />
        </div>
        <div className="w-full h-3 bg-muted rounded" />
        <div className="w-3/4 h-3 bg-muted rounded" />
      </div>
    </Card>
  ))}
</div>
```

#### Inline Loading (Pagination, Actions)
```typescript
// Load more messages
{hasMore && (
  <Button
    variant="ghost"
    size="sm"
    onClick={loadMoreMessages}
    disabled={isLoadingMore}
    className="w-full"
  >
    {isLoadingMore ? (
      <>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading more...
      </>
    ) : (
      'Load older messages'
    )}
  </Button>
)}

// Sending message
<Button
  type="submit"
  disabled={!content.trim() || sending}
  className="bg-sage hover:bg-sage-dark text-white min-h-[44px]"
>
  {sending ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Sending...
    </>
  ) : (
    <>
      <Send className="w-4 h-4 mr-2" />
      Send
    </>
  )}
</Button>
```

### 4.2 Empty States

#### No Conversations
```typescript
<EmptyState
  icon={<MessageCircle className="w-16 h-16 text-muted-foreground/50" />}
  title="No conversations yet"
  description="Offer help on a request to start a conversation with community members."
  action={
    <Button
      onClick={() => router.push('/requests')}
      className="bg-sage hover:bg-sage-dark text-white"
    >
      Browse Help Requests
    </Button>
  }
/>
```

#### No Messages in Conversation
```typescript
<EmptyState
  icon={<MessageSquareIcon className="w-12 h-12 text-muted-foreground/50" />}
  title="Start the conversation"
  description="Send a message to coordinate help and build community connections."
  compact
/>
```

#### No Search Results
```typescript
<EmptyState
  icon={<SearchIcon className="w-12 h-12 text-muted-foreground/50" />}
  title="No conversations found"
  description="Try adjusting your search or browse all conversations."
  action={
    <Button variant="outline" onClick={() => setSearchQuery('')}>
      Clear search
    </Button>
  }
/>
```

### 4.3 Error States

#### Error State Component (Reusable)
```typescript
// components/ui/error-state.tsx
interface ErrorStateProps {
  title: string;
  description: string;
  error?: Error | string;
  action?: {
    label: string;
    onClick: () => void;
  };
  showDetails?: boolean;
}

export function ErrorState({ title, description, error, action, showDetails = false }: ErrorStateProps) {
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
      <AlertCircle className="w-12 h-12 text-destructive" />

      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}

      {showDetails && errorMessage && (
        <div className="mt-4 w-full max-w-md">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowErrorDetails(!showErrorDetails)}
            className="text-xs text-muted-foreground"
          >
            {showErrorDetails ? 'Hide' : 'Show'} error details
          </Button>

          {showErrorDetails && (
            <pre className="mt-2 p-3 bg-muted rounded text-xs text-left overflow-auto max-h-32">
              {errorMessage}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
```

#### Usage Examples
```typescript
// Failed to load conversations
{error && (
  <ErrorState
    title="Couldn't load conversations"
    description="We're having trouble loading your conversations. Please try again."
    error={error}
    action={{
      label: 'Retry',
      onClick: refreshConversations,
    }}
    showDetails={process.env.NODE_ENV === 'development'}
  />
)}

// Failed to send message (non-blocking toast)
{sendError && (
  <Alert variant="destructive" className="mb-4">
    <AlertCircle className="w-4 h-4" />
    <AlertDescription>
      Failed to send message: {sendError}
      <Button
        variant="link"
        size="sm"
        onClick={retrySendMessage}
        className="ml-2"
      >
        Retry
      </Button>
    </AlertDescription>
  </Alert>
)}

// Network error
{networkError && (
  <ErrorState
    title="Connection lost"
    description="Check your internet connection and try again."
    error={networkError}
    action={{
      label: 'Reconnect',
      onClick: () => window.location.reload(),
    }}
  />
)}
```

### 4.4 Optimistic Updates

#### Pattern 1: Optimistic Message Send
```typescript
const [messages, setMessages] = useState<MessageWithSender[]>([]);
const [optimisticMessages, setOptimisticMessages] = useState<Map<string, OptimisticMessage>>(new Map());

interface OptimisticMessage {
  id: string;
  content: string;
  status: 'sending' | 'failed';
  error?: string;
  retryFn?: () => void;
}

const handleSendMessage = async (content: string) => {
  const optimisticId = `temp-${Date.now()}`;
  const optimisticMessage = {
    id: optimisticId,
    content,
    sender_id: userId,
    sender: { id: userId, name: userName },
    created_at: new Date().toISOString(),
    status: 'sending' as const,
  };

  // 1. Add to messages immediately
  setMessages(prev => [...prev, optimisticMessage]);
  setOptimisticMessages(prev => new Map(prev).set(optimisticId, {
    id: optimisticId,
    content,
    status: 'sending',
  }));

  try {
    // 2. Make API call
    const response = await fetch(`/api/messaging/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send message');
    }

    const data = await response.json();

    // 3. Replace optimistic message with server response
    setMessages(prev => prev.map(msg =>
      msg.id === optimisticId ? data.message : msg
    ));
    setOptimisticMessages(prev => {
      const next = new Map(prev);
      next.delete(optimisticId);
      return next;
    });

  } catch (error) {
    // 4. Mark as failed, allow retry
    const errorMessage = error instanceof Error ? error.message : 'Failed to send';

    setMessages(prev => prev.map(msg =>
      msg.id === optimisticId
        ? { ...msg, status: 'failed' as const, error: errorMessage }
        : msg
    ));

    setOptimisticMessages(prev => new Map(prev).set(optimisticId, {
      id: optimisticId,
      content,
      status: 'failed',
      error: errorMessage,
      retryFn: () => {
        // Remove failed message and retry
        setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
        setOptimisticMessages(prev => {
          const next = new Map(prev);
          next.delete(optimisticId);
          return next;
        });
        handleSendMessage(content);
      },
    }));

    toast.error(errorMessage);
  }
};
```

#### Pattern 2: Optimistic Unread Count Update
```typescript
const markConversationAsRead = async (conversationId: string) => {
  // Optimistically update unread count
  setConversations(prev =>
    prev.map(conv =>
      conv.id === conversationId
        ? { ...conv, unread_count: 0 }
        : conv
    )
  );

  try {
    await fetch(`/api/messaging/conversations/${conversationId}/mark-read`, {
      method: 'PUT',
    });
  } catch (error) {
    // Rollback on error
    console.error('Failed to mark as read:', error);
    // Could refetch to get correct state
    refreshConversations();
  }
};
```

#### UI for Optimistic Messages
```typescript
// MessageBubble.tsx - Show status for optimistic messages
export function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  const isOptimistic = message.id.startsWith('temp-');
  const isFailed = message.status === 'failed';

  return (
    <div className={cn("message-bubble", isFailed && "opacity-50")}>
      {/* Message content */}
      <p>{message.content}</p>

      {/* Status indicator */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {isOptimistic && message.status === 'sending' && (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Sending...</span>
          </>
        )}

        {isFailed && (
          <>
            <AlertTriangle className="w-3 h-3 text-destructive" />
            <span className="text-destructive">Failed to send</span>
            {message.retryFn && (
              <Button
                variant="link"
                size="sm"
                onClick={message.retryFn}
                className="h-auto p-0 ml-1 text-xs"
              >
                Retry
              </Button>
            )}
          </>
        )}

        {!isOptimistic && (
          <time>{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}</time>
        )}
      </div>
    </div>
  );
}
```

---

## 5. Real-Time & Analytics Strategy

### 5.1 Supabase Realtime Integration

#### Dual Subscription Strategy (V1 + V2)
```typescript
// hooks/useRealtimeMessages.ts
import { useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UseRealtimeMessagesOptions {
  conversationId: string;
  userId: string;
  onNewMessage: (message: MessageWithSender) => void;
  enabled?: boolean;
}

export function useRealtimeMessages({
  conversationId,
  userId,
  onNewMessage,
  enabled = true,
}: UseRealtimeMessagesOptions) {
  const supabase = createClient();
  const channelsRef = useRef<any[]>([]);

  const handleMessageInsert = useCallback(async (payload: any) => {
    const newMessage = payload.new;

    // Fetch full message with sender/recipient profiles
    try {
      const response = await fetch(`/api/messaging/messages/${newMessage.id}`);
      if (!response.ok) {
        console.error('Failed to fetch new message details');
        return;
      }

      const data = await response.json();
      onNewMessage(data.message);

    } catch (error) {
      console.error('Error fetching new message:', error);
    }
  }, [onNewMessage]);

  useEffect(() => {
    if (!enabled || !conversationId) return;

    // Subscribe to V1 messages table
    const v1Channel = supabase
      .channel(`messages_v1:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, handleMessageInsert)
      .subscribe();

    // Subscribe to V2 messages table
    const v2Channel = supabase
      .channel(`messages_v2:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages_v2',
        filter: `conversation_id=eq.${conversationId}`,
      }, handleMessageInsert)
      .subscribe();

    channelsRef.current = [v1Channel, v2Channel];

    return () => {
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [enabled, conversationId, supabase, handleMessageInsert]);

  return {
    unsubscribe: () => {
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    },
  };
}
```

#### Presence and Typing Indicators
```typescript
// hooks/usePresence.ts
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface PresenceState {
  userId: string;
  userName: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: string;
}

export function usePresence(conversationId: string, currentUserId: string, currentUserName: string) {
  const [presence, setPresence] = useState<Record<string, PresenceState>>({});
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase.channel(`presence:${conversationId}`, {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const presenceMap: Record<string, PresenceState> = {};

        Object.entries(state).forEach(([userId, presences]: [string, any[]]) => {
          const presence = presences[0] as PresenceState;
          presenceMap[userId] = presence;
        });

        setPresence(presenceMap);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: currentUserId,
            userName: currentUserName,
            status: 'online',
            lastSeen: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId, currentUserId, currentUserName, supabase]);

  return presence;
}

// hooks/useTypingIndicator.ts
export function useTypingIndicator(conversationId: string, userId: string, userName: string) {
  const [typingUsers, setTypingUsers] = useState<Record<string, { name: string; lastTyped: number }>>({});
  const supabase = createClient();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const broadcastTyping = useCallback(() => {
    const channel = supabase.channel(`typing:${conversationId}`);

    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId, userName, timestamp: Date.now() },
    });

    // Clear typing after 3 seconds of inactivity
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      channel.send({
        type: 'broadcast',
        event: 'stop_typing',
        payload: { userId },
      });
    }, 3000);
  }, [conversationId, userId, userName, supabase]);

  useEffect(() => {
    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId: typingUserId, userName: typingUserName, timestamp } = payload.payload;

        // Ignore own typing events
        if (typingUserId === userId) return;

        setTypingUsers(prev => ({
          ...prev,
          [typingUserId]: { name: typingUserName, lastTyped: timestamp },
        }));

        // Remove after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => {
            const next = { ...prev };
            delete next[typingUserId];
            return next;
          });
        }, 3000);
      })
      .on('broadcast', { event: 'stop_typing' }, (payload) => {
        const { userId: stoppedUserId } = payload.payload;
        setTypingUsers(prev => {
          const next = { ...prev };
          delete next[stoppedUserId];
          return next;
        });
      })
      .subscribe();

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      channel.unsubscribe();
    };
  }, [conversationId, userId, supabase]);

  return {
    typingUsers: Object.values(typingUsers).map(u => u.name),
    broadcastTyping,
  };
}
```

### 5.2 Analytics & Telemetry

#### Event Tracking Schema
```typescript
// lib/analytics/messaging-events.ts
export const MessagingEvents = {
  // Conversation events
  CONVERSATION_CREATED: 'messaging.conversation.created',
  CONVERSATION_VIEWED: 'messaging.conversation.viewed',
  CONVERSATION_CLOSED: 'messaging.conversation.closed',

  // Message events
  MESSAGE_SENT: 'messaging.message.sent',
  MESSAGE_RECEIVED: 'messaging.message.received',
  MESSAGE_READ: 'messaging.message.read',
  MESSAGE_FAILED: 'messaging.message.failed',

  // Help request integration
  HELP_OFFER_INITIATED: 'messaging.help_offer.initiated',
  HELP_OFFER_SUCCESS: 'messaging.help_offer.success',
  HELP_OFFER_FAILED: 'messaging.help_offer.failed',

  // Errors
  ERROR_OCCURRED: 'messaging.error',
  ERROR_RECOVERED: 'messaging.error.recovered',

  // Feature usage
  TYPING_INDICATOR_SHOWN: 'messaging.typing_indicator.shown',
  PRESENCE_UPDATED: 'messaging.presence.updated',
} as const;

interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  timestamp?: string;
  userId?: string;
}

export class MessagingAnalytics {
  private static track(event: AnalyticsEvent) {
    // Integration with analytics provider (PostHog, Mixpanel, etc.)
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track(event.event, {
        ...event.properties,
        timestamp: event.timestamp || new Date().toISOString(),
        userId: event.userId,
      });
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', event.event, event.properties);
    }
  }

  static conversationCreated(data: {
    conversationId: string;
    helpRequestId?: string;
    messagingVersion: 'v1' | 'v2';
    durationMs: number;
  }) {
    this.track({
      event: MessagingEvents.CONVERSATION_CREATED,
      properties: {
        conversation_id: data.conversationId,
        help_request_id: data.helpRequestId,
        messaging_version: data.messagingVersion,
        duration_ms: data.durationMs,
      },
    });
  }

  static messageSent(data: {
    messageId: string;
    conversationId: string;
    messageLength: number;
    messagingVersion: 'v1' | 'v2';
    isOptimistic: boolean;
  }) {
    this.track({
      event: MessagingEvents.MESSAGE_SENT,
      properties: {
        message_id: data.messageId,
        conversation_id: data.conversationId,
        message_length: data.messageLength,
        messaging_version: data.messagingVersion,
        is_optimistic: data.isOptimistic,
      },
    });
  }

  static helpOfferInitiated(data: {
    helpRequestId: string;
    category: string;
    urgency: string;
  }) {
    this.track({
      event: MessagingEvents.HELP_OFFER_INITIATED,
      properties: {
        help_request_id: data.helpRequestId,
        category: data.category,
        urgency: data.urgency,
      },
    });
  }

  static helpOfferSuccess(data: {
    helpRequestId: string;
    conversationId: string;
    durationMs: number;
    messagingVersion: 'v1' | 'v2';
  }) {
    this.track({
      event: MessagingEvents.HELP_OFFER_SUCCESS,
      properties: {
        help_request_id: data.helpRequestId,
        conversation_id: data.conversationId,
        duration_ms: data.durationMs,
        messaging_version: data.messagingVersion,
      },
    });
  }

  static helpOfferFailed(data: {
    helpRequestId: string;
    errorCode: string;
    errorMessage: string;
    durationMs: number;
    messagingVersion: 'v1' | 'v2';
  }) {
    this.track({
      event: MessagingEvents.HELP_OFFER_FAILED,
      properties: {
        help_request_id: data.helpRequestId,
        error_code: data.errorCode,
        error_message: data.errorMessage,
        duration_ms: data.durationMs,
        messaging_version: data.messagingVersion,
      },
    });
  }

  static errorOccurred(data: {
    action: string;
    errorCode: string;
    errorMessage: string;
    context?: Record<string, any>;
  }) {
    this.track({
      event: MessagingEvents.ERROR_OCCURRED,
      properties: {
        action: data.action,
        error_code: data.errorCode,
        error_message: data.errorMessage,
        context: data.context,
      },
    });
  }
}
```

#### Usage in Components
```typescript
// HelpRequestCardWithMessaging.tsx
const handleSubmitOffer = async () => {
  const startTime = Date.now();

  // Track initiation
  MessagingAnalytics.helpOfferInitiated({
    helpRequestId: request.id,
    category: request.category,
    urgency: request.urgency,
  });

  try {
    const response = await fetch(`/api/messaging/help-requests/${request.id}/start-conversation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initial_message: offerMessage }),
    });

    const durationMs = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json();

      // Track failure
      MessagingAnalytics.helpOfferFailed({
        helpRequestId: request.id,
        errorCode: errorData.code || 'unknown',
        errorMessage: errorData.error || 'Unknown error',
        durationMs,
        messagingVersion: 'v2', // Or detect based on feature flag
      });

      // Handle error...
      return;
    }

    const data = await response.json();

    // Track success
    MessagingAnalytics.helpOfferSuccess({
      helpRequestId: request.id,
      conversationId: data.conversation_id,
      durationMs,
      messagingVersion: 'v2',
    });

    // Continue with success flow...

  } catch (error) {
    const durationMs = Date.now() - startTime;

    MessagingAnalytics.helpOfferFailed({
      helpRequestId: request.id,
      errorCode: 'network_error',
      errorMessage: error instanceof Error ? error.message : 'Network error',
      durationMs,
      messagingVersion: 'v2',
    });
  }
};
```

#### A/B Testing V1 vs V2
```typescript
// Track both versions to compare success rates
const messagingVersion = isV2Enabled ? 'v2' : 'v1';

MessagingAnalytics.conversationCreated({
  conversationId: data.conversation_id,
  helpRequestId: request.id,
  messagingVersion, // 'v1' or 'v2'
  durationMs: Date.now() - startTime,
});

// Later, analyze in analytics dashboard:
// - V1 success rate: 0% (100% failure)
// - V2 success rate: 98%+ (target)
// - Migration decision: Enable V2 for all users
```

---

## 6. Component Refactor Priority Map

### Priority 1: Critical Path (Conversation Creation)

**Goal**: Fix 100% failure rate on "Offer Help" flow

**Components**:
1. **`app/api/messaging/help-requests/[id]/start-conversation/route.ts`**
   - **Current**: V1 race conditions, RLS recursion
   - **Changes**: Replace with V2 atomic RPC `create_help_conversation_v2()`
   - **Estimated Effort**: 4 hours
   - **Testing**: Unit tests for RPC, integration test for full flow
   - **Success Criteria**: 95%+ success rate on conversation creation

2. **`components/help-requests/HelpRequestCardWithMessaging.tsx`**
   - **Current**: Generic error handling, no recovery
   - **Changes**: Enhanced error codes, retry logic, success/error states
   - **Estimated Effort**: 3 hours
   - **Testing**: Error scenario tests (duplicate, permissions, rate limit)
   - **Success Criteria**: All error codes handled gracefully

**Total Priority 1 Effort**: 7 hours

---

### Priority 2: Core Messaging (Send/Receive Messages)

**Goal**: Migrate message send/receive to V2 APIs

**Components**:
3. **`app/api/messaging/conversations/[id]/messages/route.ts`**
   - **Current**: V1 direct Supabase queries
   - **Changes**: V2 RPC for send (`send_message_v2`) and fetch (`get_conversation_messages_v2`)
   - **Estimated Effort**: 3 hours
   - **Testing**: Send message, fetch messages, mark as read
   - **Success Criteria**: Messages send/receive with V2 schema

4. **`components/messaging/MessagingDashboard.tsx`**
   - **Current**: Direct Supabase client, V1 tables
   - **Changes**: API routes for all operations, dual real-time subscriptions
   - **Estimated Effort**: 6 hours
   - **Testing**: Load messages, send message, real-time updates
   - **Success Criteria**: No direct Supabase calls from client

5. **`components/messaging/MessageInput.tsx`**
   - **Current**: Basic error handling
   - **Changes**: Enhanced error messages, retry mechanism
   - **Estimated Effort**: 2 hours
   - **Testing**: Send success, send failure, retry
   - **Success Criteria**: User-friendly error messages

**Total Priority 2 Effort**: 11 hours

---

### Priority 3: Conversation List & Display

**Goal**: Support both V1 and V2 conversation structures

**Components**:
6. **`app/messages/page.tsx`**
   - **Current**: V1 data fetching (N+1 queries)
   - **Changes**: V2 RPC `get_user_conversations_v2()` with feature flag
   - **Estimated Effort**: 4 hours
   - **Testing**: SSR data load, V1/V2 fallback
   - **Success Criteria**: Single RPC call instead of N+1

7. **`components/messaging/ConversationList.tsx`**
   - **Current**: V1 data structure assumptions
   - **Changes**: Type guards for V1/V2, normalize display
   - **Estimated Effort**: 3 hours
   - **Testing**: Render V1 conversations, render V2 conversations
   - **Success Criteria**: Both V1 and V2 conversations display correctly

8. **`hooks/useMessaging.ts`**
   - **Current**: V1 API responses
   - **Changes**: Normalize V1/V2 responses to common interface
   - **Estimated Effort**: 2 hours
   - **Testing**: V1 response handling, V2 response handling
   - **Success Criteria**: Unified interface for both versions

**Total Priority 3 Effort**: 9 hours

---

### Priority 4: UX Polish & Error States

**Goal**: Improve user experience with comprehensive error handling

**Components**:
9. **Create `components/ui/error-state.tsx`**
   - **Current**: N/A (new component)
   - **Changes**: Reusable error state component
   - **Estimated Effort**: 2 hours
   - **Testing**: Visual testing for various error types
   - **Success Criteria**: Consistent error UI across app

10. **Create `components/ui/empty-state.tsx`**
    - **Current**: N/A (new component)
    - **Changes**: Reusable empty state component
    - **Estimated Effort**: 1 hour
    - **Testing**: Visual testing for various empty states
    - **Success Criteria**: Consistent empty state UI

11. **Add optimistic updates to `MessagingDashboard.tsx`**
    - **Current**: No optimistic updates
    - **Changes**: Optimistic message send, rollback on failure
    - **Estimated Effort**: 3 hours
    - **Testing**: Optimistic update success, rollback on failure
    - **Success Criteria**: Messages appear instantly, rollback cleanly

**Total Priority 4 Effort**: 6 hours

---

### Summary Table

| Priority | Components | Total Effort | Dependencies | Success Criteria |
|----------|-----------|--------------|--------------|------------------|
| **P1** | Conversation creation (2 components) | 7 hours | V2 RPC functions | 95%+ creation success rate |
| **P2** | Send/receive messages (3 components) | 11 hours | P1 complete | API routes replace direct Supabase |
| **P3** | Conversation list (3 components) | 9 hours | P2 complete | V1/V2 coexistence |
| **P4** | UX polish (3 components) | 6 hours | P3 complete | Consistent error/empty states |
| **TOTAL** | **11 components** | **33 hours** | Sequential | Full V2 integration |

---

## 7. Testing Plan

### 7.1 Component Tests (Vitest + React Testing Library)

#### Test: HelpRequestCardWithMessaging
```typescript
// components/help-requests/__tests__/HelpRequestCardWithMessaging.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelpRequestCardWithMessaging } from '../HelpRequestCardWithMessaging';

describe('HelpRequestCardWithMessaging', () => {
  const mockRequest = {
    id: 'help-123',
    user_id: 'user-456',
    title: 'Need groceries',
    category: 'groceries',
    urgency: 'urgent' as const,
    status: 'open' as const,
    created_at: new Date().toISOString(),
    profiles: {
      id: 'user-456',
      name: 'Alice',
      location: 'Springfield, MO',
    },
  };

  const mockCurrentUserId = 'user-789';

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('opens offer dialog when "Offer Help" button clicked', async () => {
    const user = userEvent.setup();
    render(<HelpRequestCardWithMessaging request={mockRequest} currentUserId={mockCurrentUserId} />);

    const offerButton = screen.getByRole('button', { name: /offer help/i });
    await user.click(offerButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/your message/i)).toBeInTheDocument();
  });

  it('creates conversation and navigates on success', async () => {
    const user = userEvent.setup();
    const mockRouter = { push: jest.fn() };
    jest.mock('next/navigation', () => ({
      useRouter: () => mockRouter,
    }));

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        conversation_id: 'conv-123',
      }),
    });

    render(<HelpRequestCardWithMessaging request={mockRequest} currentUserId={mockCurrentUserId} />);

    const offerButton = screen.getByRole('button', { name: /offer help/i });
    await user.click(offerButton);

    const messageInput = screen.getByLabelText(/your message/i);
    await user.type(messageInput, 'I can help with groceries');

    const sendButton = screen.getByRole('button', { name: /send & start conversation/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/conversation started/i)).toBeInTheDocument();
    });

    expect(mockRouter.push).toHaveBeenCalledWith('/messages?conversation=conv-123');
  });

  it('shows error message for duplicate conversation', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'You already have a conversation about this help request',
        code: 'conversation_exists',
        conversation_id: 'conv-existing',
      }),
    });

    render(<HelpRequestCardWithMessaging request={mockRequest} currentUserId={mockCurrentUserId} />);

    const offerButton = screen.getByRole('button', { name: /offer help/i });
    await user.click(offerButton);

    const messageInput = screen.getByLabelText(/your message/i);
    await user.type(messageInput, 'I can help');

    const sendButton = screen.getByRole('button', { name: /send & start conversation/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/already have a conversation/i)).toBeInTheDocument();
    });
  });

  it('shows retry button after network error', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<HelpRequestCardWithMessaging request={mockRequest} currentUserId={mockCurrentUserId} />);

    const offerButton = screen.getByRole('button', { name: /offer help/i });
    await user.click(offerButton);

    const messageInput = screen.getByLabelText(/your message/i);
    await user.type(messageInput, 'I can help');

    const sendButton = screen.getByRole('button', { name: /send & start conversation/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('prevents offering help on own request', async () => {
    const user = userEvent.setup();
    render(<HelpRequestCardWithMessaging request={mockRequest} currentUserId={mockRequest.user_id} />);

    const offerButton = screen.getByRole('button', { name: /offer help/i });
    await user.click(offerButton);

    await waitFor(() => {
      expect(screen.getByText(/cannot offer help on your own request/i)).toBeInTheDocument();
    });
  });

  it('disables send button when message is empty', async () => {
    const user = userEvent.setup();
    render(<HelpRequestCardWithMessaging request={mockRequest} currentUserId={mockCurrentUserId} />);

    const offerButton = screen.getByRole('button', { name: /offer help/i });
    await user.click(offerButton);

    const sendButton = screen.getByRole('button', { name: /send & start conversation/i });
    expect(sendButton).toBeDisabled();

    const messageInput = screen.getByLabelText(/your message/i);
    await user.type(messageInput, 'I can help');

    expect(sendButton).not.toBeDisabled();
  });
});
```

#### Test: MessagingDashboard
```typescript
// components/messaging/__tests__/MessagingDashboard.test.tsx
describe('MessagingDashboard', () => {
  it('loads messages for selected conversation', async () => {
    const mockConversations = [
      {
        id: 'conv-1',
        help_request_id: 'help-1',
        last_message_at: new Date().toISOString(),
        unread_count: 2,
        other_participant: { id: 'user-2', name: 'Bob' },
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        messages: [
          {
            id: 'msg-1',
            content: 'Hello',
            sender_id: 'user-2',
            created_at: new Date().toISOString(),
          },
        ],
        conversation: mockConversations[0],
      }),
    });

    render(
      <MessagingDashboard
        initialConversations={mockConversations}
        userId="user-1"
        selectedConversationId="conv-1"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
  });

  it('sends message and updates UI optimistically', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: {
          id: 'msg-2',
          content: 'Test message',
          sender_id: 'user-1',
          created_at: new Date().toISOString(),
        },
      }),
    });

    render(
      <MessagingDashboard
        initialConversations={[]}
        userId="user-1"
        selectedConversationId="conv-1"
      />
    );

    const input = screen.getByPlaceholderText(/type your message/i);
    await user.type(input, 'Test message');

    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);

    // Optimistic message should appear immediately
    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByText(/sending/i)).toBeInTheDocument();

    // After server response, "sending" should disappear
    await waitFor(() => {
      expect(screen.queryByText(/sending/i)).not.toBeInTheDocument();
    });
  });

  it('shows error state when message send fails', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(
      <MessagingDashboard
        initialConversations={[]}
        userId="user-1"
        selectedConversationId="conv-1"
      />
    );

    const input = screen.getByPlaceholderText(/type your message/i);
    await user.type(input, 'Test message');

    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to send/i)).toBeInTheDocument();
    });
  });
});
```

### 7.2 Integration Tests (Playwright)

#### E2E Test: Offer Help Flow
```typescript
// tests/e2e/messaging/offer-help.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Offer Help Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('/auth/signin');
    await page.fill('[name="email"]', 'testuser@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('successfully offers help on a request', async ({ page }) => {
    // Navigate to help requests
    await page.goto('/requests');

    // Find an open request
    const requestCard = page.locator('[data-testid="help-request-card"]').first();
    await expect(requestCard).toBeVisible();

    // Click "Offer Help" button
    const offerButton = requestCard.locator('button:has-text("Offer Help")');
    await offerButton.click();

    // Dialog should open
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Type message
    const messageInput = dialog.locator('textarea[name="message"]');
    await messageInput.fill('I can help with this! When would be a good time?');

    // Submit
    const sendButton = dialog.locator('button:has-text("Send & Start Conversation")');
    await sendButton.click();

    // Should see success message
    await expect(page.locator('text=Conversation started')).toBeVisible({ timeout: 5000 });

    // Should redirect to messages
    await page.waitForURL('/messages?conversation=*');

    // Should see the conversation in the list
    await expect(page.locator('[data-testid="conversation-list"]')).toContainText('I can help');
  });

  test('handles duplicate conversation error gracefully', async ({ page }) => {
    // Navigate to request where conversation already exists
    await page.goto('/requests/test-request-with-existing-conversation');

    // Click "Offer Help"
    const offerButton = page.locator('button:has-text("Offer Help")');
    await offerButton.click();

    // Fill message
    const messageInput = page.locator('textarea[name="message"]');
    await messageInput.fill('I can help');

    // Submit
    const sendButton = page.locator('button:has-text("Send & Start Conversation")');
    await sendButton.click();

    // Should see error about existing conversation
    await expect(page.locator('text=already have a conversation')).toBeVisible();

    // Should have option to view existing conversation
    const viewButton = page.locator('button:has-text("View Conversation")');
    await expect(viewButton).toBeVisible();
  });

  test('shows loading state during submission', async ({ page }) => {
    await page.goto('/requests');

    const requestCard = page.locator('[data-testid="help-request-card"]').first();
    const offerButton = requestCard.locator('button:has-text("Offer Help")');
    await offerButton.click();

    const messageInput = page.locator('textarea[name="message"]');
    await messageInput.fill('Test message');

    const sendButton = page.locator('button:has-text("Send & Start Conversation")');
    await sendButton.click();

    // Should see loading spinner
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();

    // Button should be disabled
    await expect(sendButton).toBeDisabled();
  });
});
```

### 7.3 API Tests

#### Test: Start Conversation Endpoint
```typescript
// tests/api/messaging/start-conversation.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@/lib/supabase/server';

describe('POST /api/messaging/help-requests/[id]/start-conversation', () => {
  let authToken: string;
  let testHelpRequestId: string;

  beforeAll(async () => {
    // Setup: Create test user and help request
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: 'testuser@example.com',
      password: 'password123',
    });
    authToken = authData.session?.access_token!;

    // Create test help request
    const { data: helpRequest } = await supabase
      .from('help_requests')
      .insert({
        user_id: 'other-user-id',
        title: 'Test request',
        category: 'groceries',
        urgency: 'normal',
        status: 'open',
      })
      .select()
      .single();
    testHelpRequestId = helpRequest!.id;
  });

  it('creates conversation successfully with V2', async () => {
    const response = await fetch(
      `http://localhost:3000/api/messaging/help-requests/${testHelpRequestId}/start-conversation`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          initial_message: 'I can help with this!',
        }),
      }
    );

    expect(response.status).toBe(201);
    const data = await response.json();

    expect(data).toMatchObject({
      success: true,
      conversation_id: expect.any(String),
      message: expect.any(String),
    });
  });

  it('returns 409 for duplicate conversation', async () => {
    // First request
    await fetch(
      `http://localhost:3000/api/messaging/help-requests/${testHelpRequestId}/start-conversation`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ initial_message: 'First message' }),
      }
    );

    // Second request (duplicate)
    const response = await fetch(
      `http://localhost:3000/api/messaging/help-requests/${testHelpRequestId}/start-conversation`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ initial_message: 'Second message' }),
      }
    );

    expect(response.status).toBe(409);
    const data = await response.json();

    expect(data).toMatchObject({
      error: expect.stringContaining('already have a conversation'),
      code: 'conversation_exists',
      conversation_id: expect.any(String),
    });
  });

  it('returns 400 for closed help request', async () => {
    // Close the help request
    const supabase = await createClient();
    await supabase
      .from('help_requests')
      .update({ status: 'closed' })
      .eq('id', testHelpRequestId);

    const response = await fetch(
      `http://localhost:3000/api/messaging/help-requests/${testHelpRequestId}/start-conversation`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ initial_message: 'Message' }),
      }
    );

    expect(response.status).toBe(400);
    const data = await response.json();

    expect(data).toMatchObject({
      error: expect.stringContaining('no longer accepting'),
      code: 'help_request_unavailable',
    });
  });

  it('validates message length', async () => {
    const response = await fetch(
      `http://localhost:3000/api/messaging/help-requests/${testHelpRequestId}/start-conversation`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ initial_message: 'Hi' }), // Too short
      }
    );

    expect(response.status).toBe(400);
    const data = await response.json();

    expect(data).toMatchObject({
      error: expect.stringContaining('Invalid'),
      code: 'invalid_input',
    });
  });
});
```

---

## 8. Implementation Checklist

### 8.1 Prerequisites (Before Code Changes)

- [ ] **Review Phase 3 Service Layer Design** - Understand V2 RPC functions
- [ ] **Database V2 Schema Deployed** - Ensure `conversations_v2`, `messages_v2` tables exist
- [ ] **V2 RPC Functions Created** - `create_help_conversation_v2`, `send_message_v2`, etc.
- [ ] **Feature Flag System** - Implement `checkFeatureFlag('messaging_v2_enabled')`
- [ ] **Analytics Setup** - Ensure event tracking is configured
- [ ] **Testing Environment** - Supabase test project with V2 schema

### 8.2 Phase 1: Critical Path (Week 1)

- [ ] **Day 1-2**: Conversation Creation Backend
  - [ ] Implement V2 RPC `create_help_conversation_v2()` in Supabase
  - [ ] Update `/api/messaging/help-requests/[id]/start-conversation/route.ts` to use V2 RPC
  - [ ] Add feature flag check (default V1, enable V2 manually)
  - [ ] Write API tests for success, duplicate, closed request scenarios
  - [ ] Test with Postman/cURL

- [ ] **Day 3-4**: Conversation Creation Frontend
  - [ ] Update `HelpRequestCardWithMessaging.tsx` with error code handling
  - [ ] Add loading/success/error states to UI
  - [ ] Implement retry logic (max 3 attempts)
  - [ ] Add analytics tracking for offer help flow
  - [ ] Write component tests

- [ ] **Day 5**: Integration Testing
  - [ ] E2E test for successful offer help flow
  - [ ] E2E test for duplicate conversation error
  - [ ] E2E test for permissions error
  - [ ] Manual QA on test environment
  - [ ] Fix any bugs discovered

### 8.3 Phase 2: Send/Receive Messages (Week 2)

- [ ] **Day 1-2**: Message Backend
  - [ ] Implement V2 RPC `send_message_v2()` and `get_conversation_messages_v2()`
  - [ ] Update `/api/messaging/conversations/[id]/messages/route.ts` with V2 support
  - [ ] Add feature flag routing
  - [ ] Write API tests for send, fetch, mark as read

- [ ] **Day 3-4**: Message Frontend
  - [ ] Refactor `MessagingDashboard.tsx` to use API routes (remove direct Supabase)
  - [ ] Implement optimistic updates for message sending
  - [ ] Add dual real-time subscriptions (V1 + V2 tables)
  - [ ] Update `MessageInput.tsx` error handling

- [ ] **Day 5**: Integration Testing
  - [ ] E2E test for send message flow
  - [ ] E2E test for real-time message receipt
  - [ ] E2E test for optimistic updates and rollback
  - [ ] Performance test (1000+ messages)

### 8.4 Phase 3: Conversation List (Week 3)

- [ ] **Day 1-2**: Conversation List Backend
  - [ ] Implement V2 RPC `get_user_conversations_v2()`
  - [ ] Update `app/messages/page.tsx` to use V2 RPC
  - [ ] Add feature flag check

- [ ] **Day 3-4**: Conversation List Frontend
  - [ ] Add type guards to `ConversationList.tsx` for V1/V2 conversations
  - [ ] Update `hooks/useMessaging.ts` to normalize V1/V2 responses
  - [ ] Ensure unread counts work for both versions

- [ ] **Day 5**: Integration Testing
  - [ ] E2E test for conversation list display (V1 and V2 mixed)
  - [ ] Visual regression test for conversation cards
  - [ ] Performance test (100+ conversations)

### 8.5 Phase 4: UX Polish (Week 4)

- [ ] **Day 1**: Reusable Components
  - [ ] Create `components/ui/error-state.tsx`
  - [ ] Create `components/ui/empty-state.tsx`
  - [ ] Add Storybook stories for both components

- [ ] **Day 2-3**: Error Handling Improvements
  - [ ] Apply error states to all messaging components
  - [ ] Add retry logic to all mutation operations
  - [ ] Implement comprehensive error tracking

- [ ] **Day 4**: Analytics & Monitoring
  - [ ] Add analytics events to all messaging actions
  - [ ] Set up error monitoring dashboard
  - [ ] Create success/failure rate metrics

- [ ] **Day 5**: Final QA
  - [ ] Full regression testing (V1 and V2)
  - [ ] Accessibility audit (screen reader, keyboard navigation)
  - [ ] Performance audit (Lighthouse, Core Web Vitals)
  - [ ] Browser compatibility testing (Chrome, Firefox, Safari, Mobile)

### 8.6 Deployment & Rollout

- [ ] **Week 5**: Gradual Rollout
  - [ ] Deploy to staging with V2 enabled
  - [ ] Test with small group of beta users
  - [ ] Monitor error rates and performance
  - [ ] Enable V2 for 10% of production users
  - [ ] Monitor for 48 hours, increase to 50% if successful
  - [ ] Full rollout to 100% after 1 week of stable operation

- [ ] **Week 6**: V1 Deprecation (Optional)
  - [ ] Announce V1 deprecation timeline
  - [ ] Migrate remaining V1 conversations to V2
  - [ ] Remove V1 code paths
  - [ ] Archive V1 database tables

---

## Appendix A: V1 vs V2 Comparison

| Aspect | V1 (Current) | V2 (New) |
|--------|--------------|----------|
| **Conversation Creation** | Multi-step (INSERT conversation → INSERT participants) | Atomic RPC with transaction |
| **Race Conditions** | ✅ Yes (100% failure rate) | ❌ No (handled atomically) |
| **Database Queries** | N+1 queries (conversation + participants + messages) | Single RPC call |
| **Duplicate Prevention** | Complex client-side check (RLS recursion) | Server-side atomic check in RPC |
| **Error Handling** | Generic 500 errors | Specific error codes (duplicate, permissions, etc.) |
| **Performance** | 3-5 round trips to database | 1 round trip to database |
| **RLS Complexity** | High (recursive joins cause issues) | Low (RPC bypasses RLS) |
| **Participant Management** | Separate `conversation_participants` table | Embedded `requester_id`/`helper_id` fields |
| **Initial Message** | Separate insert after conversation creation | Atomic with conversation creation |
| **Testing Complexity** | High (multiple failure points) | Low (single function to test) |

---

## Appendix B: Feature Flag Implementation

### Feature Flag Schema
```sql
CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name text UNIQUE NOT NULL,
  enabled boolean DEFAULT false,
  rollout_percentage integer DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  user_whitelist uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

INSERT INTO feature_flags (flag_name, enabled, rollout_percentage)
VALUES ('messaging_v2_enabled', false, 0);
```

### Feature Flag Service
```typescript
// lib/features/flags.ts
import { createClient } from '@/lib/supabase/server';

export async function checkFeatureFlag(
  flagName: string,
  userId?: string
): Promise<boolean> {
  const supabase = await createClient();

  const { data: flag } = await supabase
    .from('feature_flags')
    .select('*')
    .eq('flag_name', flagName)
    .single();

  if (!flag) return false;

  // Global enable/disable
  if (!flag.enabled) return false;

  // User whitelist check
  if (userId && flag.user_whitelist?.includes(userId)) {
    return true;
  }

  // Rollout percentage (deterministic based on user ID)
  if (userId && flag.rollout_percentage > 0) {
    const hash = hashUserId(userId); // Consistent hash function
    const userPercentile = hash % 100;
    return userPercentile < flag.rollout_percentage;
  }

  // If no userId provided, use global enabled flag
  return flag.enabled;
}

function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
```

### Usage in API Routes
```typescript
// app/api/messaging/help-requests/[id]/start-conversation/route.ts
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const isV2Enabled = await checkFeatureFlag('messaging_v2_enabled', user.id);

  if (isV2Enabled) {
    // V2 implementation
    return handleV2ConversationCreation(params.id, user.id);
  } else {
    // V1 fallback
    return handleV1ConversationCreation(params.id, user.id);
  }
}
```

---

## Appendix C: Error Code Reference

### Conversation Creation Errors

| Error Code | HTTP Status | User Message | Recovery Action |
|-----------|-------------|--------------|-----------------|
| `conversation_exists` | 409 | "You already have a conversation for this request" | Navigate to existing conversation |
| `help_request_unavailable` | 400 | "This help request is no longer available" | Refresh request status |
| `help_request_closed` | 400 | "This help request is closed" | Browse other requests |
| `permission_denied` | 403 | "You must be approved to offer help" | Complete verification |
| `user_restricted` | 403 | "Your account has messaging restrictions" | Contact support |
| `cannot_help_own_request` | 400 | "You cannot offer help on your own request" | None |
| `rate_limited` | 429 | "Too many help offers recently" | Wait before retrying |
| `invalid_input` | 400 | "Message must be 10-1000 characters" | Fix message length |
| `network_error` | N/A | "Network error. Check your connection." | Retry |
| `server_error` | 500 | "Something went wrong. Please try again." | Retry, contact support |

### Message Send Errors

| Error Code | HTTP Status | User Message | Recovery Action |
|-----------|-------------|--------------|-----------------|
| `content_moderated` | 400 | "Message blocked by content filters" | Revise message |
| `rate_limited` | 429 | "You are sending messages too quickly" | Wait before retrying |
| `permission_denied` | 403 | "You cannot send messages in this conversation" | None |
| `conversation_not_found` | 404 | "Conversation not found" | Refresh conversation list |
| `invalid_input` | 400 | "Message cannot be empty" | Fix message content |

---

**End of Phase 4 Front-End Integration & UX Hardening Plan**
