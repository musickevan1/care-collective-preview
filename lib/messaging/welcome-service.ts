/**
 * @fileoverview Welcome Message Service for Care Collective
 *
 * Creates welcome conversations from CARE Team for new users.
 * Triggered after profile completion to onboard users to the messaging system.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { NotificationService } from '@/lib/notifications/NotificationService';
import { WELCOME_BOT_USER_ID, WELCOME_MESSAGE_CONTENT, WELCOME_BOT_NAME } from './welcome-bot';

export interface WelcomeConversationResult {
  success: boolean;
  conversationId?: string;
  error?: string;
}

/**
 * Create a welcome conversation from CARE Team for a new user
 *
 * This function:
 * 1. Creates a system conversation using the RPC function
 * 2. Sends an in-app notification to the user
 *
 * @param userId - The user ID to create welcome conversation for
 * @returns Result indicating success/failure with conversation ID
 */
export async function createWelcomeConversation(
  userId: string
): Promise<WelcomeConversationResult> {
  try {
    // Use admin client since create_system_conversation requires service_role
    const supabase = createAdminClient();

    // Call RPC to create system conversation
    // Note: Type assertion needed until database types are regenerated with new RPC function
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('create_system_conversation', {
      p_user_id: userId,
      p_system_user_id: WELCOME_BOT_USER_ID,
      p_message: WELCOME_MESSAGE_CONTENT
    });

    if (error) {
      console.error('[WelcomeService] RPC error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Handle RPC response
    const result = data as {
      success: boolean;
      conversation_id?: string;
      error?: string;
      existing_conversation_id?: string;
    };

    if (!result.success) {
      // If conversation already exists, that's okay - not an error
      if (result.existing_conversation_id) {
        console.log('[WelcomeService] Welcome conversation already exists:', result.existing_conversation_id);
        return {
          success: true,
          conversationId: result.existing_conversation_id
        };
      }

      console.warn('[WelcomeService] Failed to create conversation:', result.error);
      return {
        success: false,
        error: result.error
      };
    }

    const conversationId = result.conversation_id;

    // Create notification for the welcome message
    try {
      await NotificationService.createNotification({
        userId,
        type: 'new_message',
        title: `Welcome to Care Collective!`,
        content: `${WELCOME_BOT_NAME} sent you a message`,
        relatedId: conversationId,
        relatedType: 'conversation',
        actionUrl: `/messages?conversation=${conversationId}`
      });
    } catch (notifyError) {
      // Log but don't fail if notification fails
      console.warn('[WelcomeService] Failed to create notification:', notifyError);
    }

    console.log('[WelcomeService] Welcome conversation created:', conversationId);
    return {
      success: true,
      conversationId
    };

  } catch (error) {
    console.error('[WelcomeService] Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if a user already has a welcome conversation
 *
 * @param userId - The user ID to check
 * @returns True if welcome conversation exists
 */
export async function hasWelcomeConversation(userId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('conversations_v2')
      .select('id')
      .is('help_request_id', null)
      .eq('requester_id', userId)
      .eq('helper_id', WELCOME_BOT_USER_ID)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is expected
      console.error('[WelcomeService] Error checking welcome conversation:', error);
    }

    return !!data;
  } catch (error) {
    console.error('[WelcomeService] Error checking welcome conversation:', error);
    return false;
  }
}
