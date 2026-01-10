/**
 * @fileoverview V2 Messaging Service - Client-side methods
 * CLIENT-SAFE - Only uses fetch() to call API endpoints
 * For server-side methods, use service-v2-server.ts
 */

export interface V2RPCResult {
  success: boolean;
  conversation_id?: string;
  message_id?: string;
  conversation?: any;
  conversations?: any[];
  messages?: any[];
  error?: string;
  message?: string;
  details?: string;
}

export class MessagingServiceV2Client {
  /**
   * Accept a pending help offer
   * Changes conversation status from 'pending' to 'accepted'
   */
  async acceptOffer(conversationId: string): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const response = await fetch('/api/messaging/accept-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });

      return await response.json();
    } catch (error) {
      console.error('[MessagingServiceV2Client.acceptOffer] Error:', error);
      return { success: false, error: 'Failed to accept offer' };
    }
  }

  /**
   * Reject a pending help offer
   * Changes conversation status from 'pending' to 'rejected'
   */
  async rejectOffer(
    conversationId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const response = await fetch('/api/messaging/reject-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, reason }),
      });

      return await response.json();
    } catch (error) {
      console.error('[MessagingServiceV2Client.rejectOffer] Error:', error);
      return { success: false, error: 'Failed to reject offer' };
    }
  }
}

// Export singleton instance
export const messagingServiceV2Client = new MessagingServiceV2Client();

/**
 * Send a message in a conversation
 * Client-side wrapper for the messaging API
 */
export async function sendMessage(
  conversationId: string,
  content: string
): Promise<{ success: boolean; message?: any; error?: string }> {
  try {
    const response = await fetch('/api/messaging/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, content }),
    });

    return await response.json();
  } catch (error) {
    console.error('[sendMessage] Error:', error);
    return { success: false, error: 'Failed to send message' };
  }
}
