/**
 * @fileoverview Database client for Care Collective messaging system
 * Provides type-safe database operations with validation and error handling
 */

import { createClient } from '@/lib/supabase/server';
import { 
  Conversation, 
  ConversationWithDetails, 
  Message, 
  MessageWithSender, 
  MessagingPreferences,
  MessageReport,
  messagingValidation,
  MessagingError,
  MESSAGING_ERRORS,
  ConversationsResponse,
  MessagesResponse,
  PaginationParams,
  CursorPagination
} from './types';
import { z } from 'zod';

export class MessagingClient {
  // Lazy-load Supabase client to avoid calling cookies() at module load time
  private async getClient() {
    return await createClient();
  }

  /**
   * Get user's conversations with pagination
   */
  async getConversations(
    userId: string,
    pagination: PaginationParams = {}
  ): Promise<ConversationsResponse> {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const supabase = await this.getClient();

    // Use optimized RPC function to eliminate N+1 queries (40+ queries → 1)
    const { data, error } = await supabase.rpc('get_conversations_optimized', {
      p_user_id: userId,
      p_status: null,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      throw new MessagingError(
        `Failed to fetch conversations: ${error.message}`,
        MESSAGING_ERRORS.CONVERSATION_NOT_FOUND,
        { userId, pagination }
      );
    }

    const result = data as { conversations: any[]; total: number };
    const conversations = result?.conversations || [];
    const total = result?.total || 0;

    return {
      conversations: conversations as ConversationWithDetails[],
      pagination: {
        page,
        limit,
        total,
        has_more: total > offset + limit,
      },
    };
  }

  /**
   * Get messages in a conversation with cursor-based pagination
   */
  async getMessages(
    conversationId: string,
    userId: string,
    pagination: CursorPagination = { limit: 50, direction: 'older' }
  ): Promise<MessagesResponse> {
    // Verify user has access to this conversation
    const hasAccess = await this.verifyConversationAccess(conversationId, userId);
    if (!hasAccess) {
      throw new MessagingError(
        'You do not have access to this conversation',
        MESSAGING_ERRORS.PERMISSION_DENIED,
        { conversationId, userId }
      );
    }

    const supabase = await this.getClient();
    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey (
          id,
          name,
          location
        ),
        recipient:profiles!messages_recipient_id_fkey (
          id,
          name,
          location
        )
      `)
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .limit(pagination.limit);

    // Apply cursor-based pagination
    if (pagination.cursor) {
      const operator = pagination.direction === 'older' ? 'lt' : 'gt';
      query = query.filter('created_at', operator, pagination.cursor);
    }

    // Order by creation time
    const ascending = pagination.direction === 'newer';
    query = query.order('created_at', { ascending });

    const { data: messages, error } = await query;

    if (error) {
      throw new MessagingError(
        `Failed to fetch messages: ${error.message}`,
        MESSAGING_ERRORS.MESSAGE_NOT_FOUND,
        { conversationId, pagination }
      );
    }

    // Get conversation details
    const conversation = await this.getConversationDetails(conversationId, userId);

    return {
      messages: messages || [],
      conversation,
      pagination: {
        cursor: messages && messages.length > 0 
          ? messages[messages.length - 1].created_at 
          : undefined,
        limit: pagination.limit,
        has_more: (messages?.length || 0) === pagination.limit,
      },
    };
  }

  /**
   * Create a new conversation
   */
  async createConversation(
    creatorId: string,
    params: z.infer<typeof messagingValidation.createConversation>
  ): Promise<Conversation> {
    const validated = messagingValidation.createConversation.parse(params);

    // CRITICAL FIX: Help request conversations bypass privacy settings
    // This allows users to offer help on any open help request, regardless of the recipient's privacy preferences
    // Direct messages (non-help-request) still require privacy check
    const isHelpRequestConversation = !!validated.help_request_id;

    if (!isHelpRequestConversation) {
      // Only check privacy settings for direct messages
      const canMessage = await this.canUserMessage(creatorId, validated.recipient_id);
      if (!canMessage) {
        throw new MessagingError(
          'You cannot message this user based on their privacy settings',
          MESSAGING_ERRORS.PERMISSION_DENIED,
          { creatorId, recipientId: validated.recipient_id }
        );
      }
    }

    const supabase = await this.getClient();
    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        help_request_id: validated.help_request_id,
        created_by: creatorId,
      })
      .select()
      .single();

    if (convError) {
      throw new MessagingError(
        `Failed to create conversation: ${convError.message}`,
        MESSAGING_ERRORS.INVALID_INPUT,
        params
      );
    }

    // Add participants
    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: conversation.id, user_id: creatorId },
        { conversation_id: conversation.id, user_id: validated.recipient_id },
      ]);

    if (participantsError) {
      // Clean up conversation if participants insertion fails
      await supabase
        .from('conversations')
        .delete()
        .eq('id', conversation.id);

      throw new MessagingError(
        `Failed to add conversation participants: ${participantsError.message}`,
        MESSAGING_ERRORS.INVALID_INPUT,
        params
      );
    }

    // Send initial message
    await this.sendMessage(creatorId, {
      conversation_id: conversation.id,
      content: validated.initial_message,
    });

    return conversation;
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(
    senderId: string,
    params: z.infer<typeof messagingValidation.sendMessage>
  ): Promise<Message> {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[sendMessage:${requestId}] Starting`, {
      senderId,
      conversationId: params.conversation_id,
      contentLength: params.content?.length
    });

    try {
      const validated = messagingValidation.sendMessage.parse(params);
      console.log(`[sendMessage:${requestId}] Validation passed`);

      // Verify conversation access
      console.log(`[sendMessage:${requestId}] Checking conversation access`);
      const hasAccess = await this.verifyConversationAccess(validated.conversation_id, senderId);
      console.log(`[sendMessage:${requestId}] Access check result`, { hasAccess });

      if (!hasAccess) {
        console.error(`[sendMessage:${requestId}] Access denied`);
        throw new MessagingError(
          'You do not have access to this conversation',
          MESSAGING_ERRORS.PERMISSION_DENIED,
          { conversationId: validated.conversation_id, senderId }
        );
      }

      // Get recipient ID
      console.log(`[sendMessage:${requestId}] Getting recipient ID`);
      const recipientId = await this.getConversationRecipient(validated.conversation_id, senderId);
      console.log(`[sendMessage:${requestId}] Recipient ID`, { recipientId });

      if (!recipientId) {
        console.error(`[sendMessage:${requestId}] No recipient found`);
        throw new MessagingError(
          'Could not determine message recipient',
          MESSAGING_ERRORS.CONVERSATION_NOT_FOUND,
          { conversationId: validated.conversation_id }
        );
      }

      const supabase = await this.getClient();
      console.log(`[sendMessage:${requestId}] Getting help request ID`);

      // Get help request ID if this conversation is related to one
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('help_request_id')
        .eq('id', validated.conversation_id)
        .single();

      if (convError) {
        console.error(`[sendMessage:${requestId}] Error fetching conversation`, {
          error: convError.message,
          code: convError.code
        });
      }
      console.log(`[sendMessage:${requestId}] Help request ID`, {
        helpRequestId: conversation?.help_request_id
      });

      console.log(`[sendMessage:${requestId}] Inserting message`);
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: validated.conversation_id,
          sender_id: senderId,
          recipient_id: recipientId,
          help_request_id: conversation?.help_request_id,
          content: validated.content,
          message_type: validated.message_type,
        })
        .select()
        .single();

      if (error) {
        console.error(`[sendMessage:${requestId}] Message insert failed`, {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw new MessagingError(
          `Failed to send message: ${error.message}`,
          MESSAGING_ERRORS.INVALID_INPUT,
          params
        );
      }

      console.log(`[sendMessage:${requestId}] Message sent successfully`, {
        messageId: message.id
      });
      return message;

    } catch (error: any) {
      console.error(`[sendMessage:${requestId}] CRITICAL ERROR`, {
        error: error?.message,
        stack: error?.stack,
        code: error?.code
      });
      throw error;
    }
  }

  /**
   * Mark a message as read
   */
  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    const supabase = await this.getClient();
    const { error } = await supabase
      .from('messages')
      .update({ 
        read_at: new Date().toISOString(),
        status: 'read' 
      })
      .eq('id', messageId)
      .eq('recipient_id', userId)
      .is('read_at', null);

    if (error) {
      throw new MessagingError(
        `Failed to mark message as read: ${error.message}`,
        MESSAGING_ERRORS.MESSAGE_NOT_FOUND,
        { messageId, userId }
      );
    }
  }

  /**
   * Get user's messaging preferences
   */
  async getMessagingPreferences(userId: string): Promise<MessagingPreferences> {
    const supabase = await this.getClient();
    const { data: preferences, error } = await supabase
      .from('messaging_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      throw new MessagingError(
        `Failed to fetch messaging preferences: ${error.message}`,
        MESSAGING_ERRORS.INVALID_INPUT,
        { userId }
      );
    }

    // Return default preferences if none exist
    return preferences || {
      user_id: userId,
      can_receive_from: 'help_connections',
      auto_accept_help_requests: true,
      email_notifications: true,
      push_notifications: true,
      quiet_hours_start: undefined,
      quiet_hours_end: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Update user's messaging preferences
   */
  async updateMessagingPreferences(
    userId: string,
    preferences: z.infer<typeof messagingValidation.messagingPreferences>
  ): Promise<MessagingPreferences> {
    const validated = messagingValidation.messagingPreferences.parse(preferences);

    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('messaging_preferences')
      .upsert({
        user_id: userId,
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new MessagingError(
        `Failed to update messaging preferences: ${error.message}`,
        MESSAGING_ERRORS.INVALID_INPUT,
        { userId, preferences: validated }
      );
    }

    return data;
  }

  /**
   * Report a message for moderation
   */
  async reportMessage(
    reporterId: string,
    params: z.infer<typeof messagingValidation.reportMessage>
  ): Promise<MessageReport> {
    const validated = messagingValidation.reportMessage.parse(params);

    const supabase = await this.getClient();
    // Verify the message exists and reporter has access
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('conversation_id')
      .eq('id', validated.message_id)
      .single();

    if (messageError) {
      throw new MessagingError(
        'Message not found',
        MESSAGING_ERRORS.MESSAGE_NOT_FOUND,
        { messageId: validated.message_id }
      );
    }

    const hasAccess = await this.verifyConversationAccess(message.conversation_id, reporterId);
    if (!hasAccess) {
      throw new MessagingError(
        'You cannot report this message',
        MESSAGING_ERRORS.PERMISSION_DENIED,
        { messageId: validated.message_id, reporterId }
      );
    }

    const { data: report, error } = await supabase
      .from('message_reports')
      .insert({
        message_id: validated.message_id,
        reported_by: reporterId,
        reason: validated.reason,
        description: validated.description,
      })
      .select()
      .single();

    if (error) {
      throw new MessagingError(
        `Failed to report message: ${error.message}`,
        MESSAGING_ERRORS.INVALID_INPUT,
        params
      );
    }

    // Flag the message for review
    await supabase
      .from('messages')
      .update({ 
        is_flagged: true, 
        flagged_reason: validated.reason,
        moderation_status: 'pending' 
      })
      .eq('id', validated.message_id);

    return report;
  }

  // Helper methods

  private async verifyConversationAccess(conversationId: string, userId: string): Promise<boolean> {
    console.log('[verifyConversationAccess] Checking', { conversationId, userId });
    const supabase = await this.getClient();
    const { count, error } = await supabase
      .from('conversation_participants')
      .select('*', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .is('left_at', null);

    if (error) {
      console.error('[verifyConversationAccess] Query error', {
        error: error.message,
        code: error.code
      });
    }

    const hasAccess = (count || 0) > 0;
    console.log('[verifyConversationAccess] Result', { count, hasAccess });
    return hasAccess;
  }

  private async getUnreadMessageCount(conversationId: string, userId: string): Promise<number> {
    const supabase = await this.getClient();
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .eq('recipient_id', userId)
      .is('read_at', null);

    return count || 0;
  }

  private async getLastMessage(conversationId: string): Promise<MessageWithSender | undefined> {
    const supabase = await this.getClient();
    const { data: message } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey (
          id,
          name,
          location
        )
      `)
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return message || undefined;
  }

  private async getConversationDetails(conversationId: string, userId: string): Promise<ConversationWithDetails> {
    const supabase = await this.getClient();
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select(`
        *,
        help_requests (
          id,
          title,
          category,
          urgency,
          status
        ),
        conversation_participants (
          user_id,
          role,
          profiles (
            id,
            name,
            location
          )
        )
      `)
      .eq('id', conversationId)
      .single();

    if (error) {
      throw new MessagingError(
        'Conversation not found',
        MESSAGING_ERRORS.CONVERSATION_NOT_FOUND,
        { conversationId }
      );
    }

    const [unreadCount, lastMessage] = await Promise.all([
      this.getUnreadMessageCount(conversationId, userId),
      this.getLastMessage(conversationId)
    ]);

    return {
      ...conversation,
      participants: conversation.conversation_participants.map((cp: any) => ({
        user_id: cp.profiles.id,
        name: cp.profiles.name,
        location: cp.profiles.location,
        role: cp.role,
      })),
      help_request: conversation.help_requests,
      last_message: lastMessage,
      unread_count: unreadCount,
    };
  }

  private async getConversationRecipient(conversationId: string, senderId: string): Promise<string | null> {
    console.log('[getConversationRecipient] Fetching', { conversationId, senderId });
    const supabase = await this.getClient();
    const { data: participants, error } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .neq('user_id', senderId)
      .is('left_at', null);

    if (error) {
      console.error('[getConversationRecipient] Query error', {
        error: error.message,
        code: error.code
      });
      return null;
    }

    console.log('[getConversationRecipient] Participants found', {
      count: participants?.length || 0,
      participants: participants?.map(p => p.user_id)
    });

    if (!participants || participants.length === 0) {
      // No other participants in conversation
      console.warn('[getConversationRecipient] No participants found');
      return null;
    }

    // For 1-to-1 conversations, return the single recipient
    // For group conversations, return first participant (message visible to all via conversation_id)
    if (participants.length > 1) {
      console.warn(`Group conversation detected (${conversationId}) with ${participants.length} participants. Using first participant as recipient_id.`);
    }

    const recipientId = participants[0].user_id;
    console.log('[getConversationRecipient] Recipient', { recipientId });
    return recipientId;
  }

  private async canUserMessage(senderId: string, recipientId: string): Promise<boolean> {
    // Get recipient's preferences
    const preferences = await this.getMessagingPreferences(recipientId);

    switch (preferences.can_receive_from) {
      case 'nobody':
        return false;
      case 'anyone':
        return true;
      case 'help_connections':
        // FIXED: Check if users have existing help request-based conversations
        // This implements the logic that was previously incomplete (empty array)
        const supabase = await this.getClient();

        // Step 1: Get all conversations where sender is a participant
        const { data: senderConversations } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', senderId)
          .is('left_at', null);

        if (!senderConversations || senderConversations.length === 0) {
          return false;
        }

        const senderConvIds = senderConversations.map(c => c.conversation_id);

        // Step 2: Get all conversations where recipient is a participant AND in sender's conversations
        const { data: recipientConversations } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', recipientId)
          .in('conversation_id', senderConvIds)
          .is('left_at', null);

        if (!recipientConversations || recipientConversations.length === 0) {
          return false;
        }

        // Step 3: Check if any shared conversation is help request-based
        const sharedConvIds = recipientConversations.map(c => c.conversation_id);
        const { count } = await supabase
          .from('conversations')
          .select('id', { count: 'exact' })
          .in('id', sharedConvIds)
          .not('help_request_id', 'is', null);

        return (count || 0) > 0;
      default:
        return false;
    }
  }

  /**
   * Start a conversation specifically for a help request
   */
  async startHelpConversation(
    senderId: string,
    params: z.infer<typeof messagingValidation.helpRequestConversation>
  ): Promise<Conversation> {
    const validated = messagingValidation.helpRequestConversation.parse(params);

    const supabase = await this.getClient();
    // Verify help request exists
    const { data: helpRequest, error: helpError } = await supabase
      .from('help_requests')
      .select('user_id, status')
      .eq('id', validated.help_request_id)
      .single();

    if (helpError) {
      throw new MessagingError(
        'Help request not found',
        MESSAGING_ERRORS.INVALID_INPUT,
        { helpRequestId: validated.help_request_id }
      );
    }

    if (helpRequest.status !== 'open') {
      throw new MessagingError(
        'This help request is no longer open',
        MESSAGING_ERRORS.PERMISSION_DENIED,
        { helpRequestId: validated.help_request_id }
      );
    }

    // Use the help request owner as the recipient
    return this.createConversation(senderId, {
      recipient_id: helpRequest.user_id,
      help_request_id: validated.help_request_id,
      initial_message: validated.initial_message,
    });
  }
}

// Export a singleton instance
export const messagingClient = new MessagingClient();