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
