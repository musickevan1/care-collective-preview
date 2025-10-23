/**
 * @fileoverview TypeScript types for the Care Collective messaging system
 * Based on the comprehensive messaging database schema
 */

import { z } from 'zod';

// Database types
export interface Conversation {
  id: string;
  help_request_id?: string;
  created_by: string;
  title?: string;
  status: 'active' | 'closed' | 'blocked';
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

export interface ConversationParticipant {
  conversation_id: string;
  user_id: string;
  joined_at: string;
  left_at?: string;
  role: 'member' | 'moderator';
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  help_request_id?: string;
  content: string;
  message_type: 'text' | 'system' | 'help_request_update';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  read_at?: string;
  is_flagged: boolean;
  flagged_reason?: string;
  moderation_status?: 'pending' | 'approved' | 'hidden' | 'removed';
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface MessagingPreferences {
  user_id: string;
  can_receive_from: 'anyone' | 'help_connections' | 'nobody';
  auto_accept_help_requests: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  created_at: string;
  updated_at: string;
}

export interface MessageReport {
  id: string;
  message_id: string;
  reported_by: string;
  reason: 'spam' | 'harassment' | 'inappropriate' | 'scam' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'action_taken';
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface MessageAuditLog {
  id: string;
  message_id?: string;
  action_type: 'sent' | 'delivered' | 'read' | 'reported' | 'deleted' | 'moderated';
  user_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// Extended types with relations for UI components
export interface ConversationWithDetails extends Conversation {
  participants: Array<{
    user_id: string;
    name: string;
    location?: string;
    role: 'member' | 'moderator';
  }>;
  help_request?: {
    id: string;
    title: string;
    category: string;
    urgency: string;
    status: string;
  };
  last_message?: Message & {
    sender_name: string;
  };
  unread_count: number;
}

export interface MessageWithSender extends Message {
  sender: {
    id: string;
    name: string;
    location?: string;
  };
  recipient: {
    id: string;
    name: string;
    location?: string;
  };
}

// Validation schemas with Care Collective specific rules
export const messagingValidation = {
  // Message content validation
  messageContent: z.string()
    .min(1, "Message cannot be empty")
    .max(1000, "Message too long (max 1000 characters)")
    .refine(
      (content) => content.trim().length > 0,
      "Message cannot be only whitespace"
    ),

  // Conversation creation
  createConversation: z.object({
    recipient_id: z.string().uuid("Invalid recipient ID"),
    help_request_id: z.string().uuid().optional(),
    initial_message: z.string()
      .min(10, "Initial message must be at least 10 characters")
      .max(1000, "Message too long"),
  }),

  // Send message
  sendMessage: z.object({
    conversation_id: z.string().uuid("Invalid conversation ID"),
    content: z.string()
      .min(1, "Message cannot be empty")
      .max(1000, "Message too long"),
    message_type: z.enum(['text', 'system', 'help_request_update']).default('text'),
  }),

  // Messaging preferences
  messagingPreferences: z.object({
    can_receive_from: z.enum(['anyone', 'help_connections', 'nobody']),
    auto_accept_help_requests: z.boolean(),
    email_notifications: z.boolean(),
    push_notifications: z.boolean(),
    quiet_hours_start: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format").optional(),
    quiet_hours_end: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format").optional(),
  }),

  // Report message
  reportMessage: z.object({
    message_id: z.string().uuid("Invalid message ID"),
    reason: z.enum(['spam', 'harassment', 'inappropriate', 'scam', 'other']),
    description: z.string()
      .max(500, "Description too long")
      .optional(),
  }),

  // Mark message as read
  markAsRead: z.object({
    message_id: z.string().uuid("Invalid message ID"),
  }),

  // Help request conversation starter
  helpRequestConversation: z.object({
    help_request_id: z.string().uuid("Invalid help request ID"),
    recipient_id: z.string().uuid("Invalid recipient ID").optional(),
    initial_message: z.string()
      .min(10, "Message must be at least 10 characters")
      .max(1000, "Message too long")
      .default("Hi! I'd like to help with your request."),
  }),
};

// Type guards for runtime type checking
export const isValidMessageStatus = (status: string): status is Message['status'] => {
  return ['sent', 'delivered', 'read', 'failed'].includes(status);
};

export const isValidConversationStatus = (status: string): status is Conversation['status'] => {
  return ['active', 'closed', 'blocked'].includes(status);
};

export const isValidMessageType = (type: string): type is Message['message_type'] => {
  return ['text', 'system', 'help_request_update'].includes(type);
};

// Utility types for API responses
export interface ConversationsResponse {
  conversations: ConversationWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
}

export interface MessagesResponse {
  messages: MessageWithSender[];
  conversation: ConversationWithDetails;
  pagination: {
    cursor?: string;
    limit: number;
    has_more: boolean;
  };
}

export interface MessageStatusUpdate {
  message_id: string;
  status: Message['status'];
  timestamp: string;
  user_id: string;
}

// Real-time event types for WebSocket messaging
export interface TypingEvent {
  conversation_id: string;
  user_id: string;
  user_name: string;
  is_typing: boolean;
}

export interface NewMessageEvent {
  message: MessageWithSender;
  conversation_id: string;
}

export interface MessageStatusEvent {
  message_id: string;
  status: Message['status'];
  updated_at: string;
}

// Error types for better error handling
export class MessagingError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'MessagingError';
  }
}

// Common messaging errors
export const MESSAGING_ERRORS = {
  CONVERSATION_NOT_FOUND: 'CONVERSATION_NOT_FOUND',
  MESSAGE_NOT_FOUND: 'MESSAGE_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  USER_BLOCKED: 'USER_BLOCKED',
  CONTENT_MODERATED: 'CONTENT_MODERATED',
  RATE_LIMITED: 'RATE_LIMITED',
  INVALID_INPUT: 'INVALID_INPUT',
} as const;

// Content moderation types
export interface ContentModerationResult {
  flagged: boolean;
  confidence: number;
  categories: string[];
  suggested_action: 'allow' | 'review' | 'block';
  explanation: string;
}

// Pagination helpers
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface CursorPagination {
  cursor?: string;
  limit: number;
  direction: 'newer' | 'older';
}

// Hook types for React components
export interface UseMessagingReturn {
  conversations: ConversationWithDetails[];
  loading: boolean;
  error: string | null;
  createConversation: (params: z.infer<typeof messagingValidation.createConversation>) => Promise<Conversation>;
  refreshConversations: () => Promise<void>;
}

export interface UseMessageThreadReturn {
  messages: MessageWithSender[];
  conversation: ConversationWithDetails | null;
  loading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  hasMore: boolean;
}

// Admin moderation types
export interface ModerationQueueItem {
  id: string;
  message: MessageWithSender;
  report: MessageReport;
  reporter: {
    id: string;
    name: string;
  };
  context: {
    conversation_title?: string;
    help_request_title?: string;
  };
}

export interface UserModerationScore {
  user_id: string;
  reports_received: number;
  reports_verified: number;
  trust_score: number;
  restriction_level: 'none' | 'limited' | 'suspended' | 'banned';
  restrictions: {
    can_send_messages: boolean;
    can_start_conversations: boolean;
    requires_pre_approval: boolean;
    message_limit_per_day: number;
  };
}