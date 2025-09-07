/**
 * @fileoverview Real-time messaging functionality using Supabase Realtime
 * Provides live message updates, typing indicators, and presence features
 */

'use client';

import { createClient } from '@/lib/supabase/client';
import { MessageWithSender, NewMessageEvent, MessageStatusEvent, TypingEvent } from './types';

export interface RealtimeMessagingOptions {
  userId: string;
  onNewMessage?: (event: NewMessageEvent) => void;
  onMessageStatusUpdate?: (event: MessageStatusEvent) => void;
  onTypingUpdate?: (event: TypingEvent) => void;
  onUserPresenceUpdate?: (users: Array<{ userId: string; status: 'online' | 'away' }>) => void;
}

export class RealtimeMessaging {
  private supabase;
  private subscriptions: Map<string, any> = new Map();
  private userId: string;
  private options: RealtimeMessagingOptions;

  constructor(options: RealtimeMessagingOptions) {
    this.supabase = createClient();
    this.userId = options.userId;
    this.options = options;
  }

  /**
   * Subscribe to real-time updates for a specific conversation
   */
  subscribeToConversation(conversationId: string): void {
    // Unsubscribe from existing conversation subscription
    this.unsubscribeFromConversation(conversationId);

    // Subscribe to new messages in this conversation
    const messageChannel = this.supabase
      .channel(`conversation:${conversationId}:messages`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Get full message data with sender info
          const { data: messageWithSender } = await this.supabase
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
            .eq('id', newMessage.id)
            .single();

          if (messageWithSender && this.options.onNewMessage) {
            this.options.onNewMessage({
              message: messageWithSender,
              conversation_id: conversationId
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const updatedMessage = payload.new as any;
          
          if (this.options.onMessageStatusUpdate) {
            this.options.onMessageStatusUpdate({
              message_id: updatedMessage.id,
              status: updatedMessage.status,
              updated_at: updatedMessage.updated_at
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Subscribed to conversation ${conversationId} messages`);
        } else if (status === 'CLOSED') {
          console.log(`❌ Connection closed for conversation ${conversationId}`);
        }
      });

    // Subscribe to typing indicators for this conversation
    const typingChannel = this.supabase
      .channel(`conversation:${conversationId}:typing`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.user_id !== this.userId && this.options.onTypingUpdate) {
          this.options.onTypingUpdate({
            conversation_id: conversationId,
            user_id: payload.payload.user_id,
            user_name: payload.payload.user_name,
            is_typing: payload.payload.is_typing
          });
        }
      })
      .subscribe();

    // Store subscriptions for cleanup
    this.subscriptions.set(`${conversationId}:messages`, messageChannel);
    this.subscriptions.set(`${conversationId}:typing`, typingChannel);
  }

  /**
   * Unsubscribe from a conversation's real-time updates
   */
  unsubscribeFromConversation(conversationId: string): void {
    const messageChannel = this.subscriptions.get(`${conversationId}:messages`);
    const typingChannel = this.subscriptions.get(`${conversationId}:typing`);

    if (messageChannel) {
      this.supabase.removeChannel(messageChannel);
      this.subscriptions.delete(`${conversationId}:messages`);
    }

    if (typingChannel) {
      this.supabase.removeChannel(typingChannel);
      this.subscriptions.delete(`${conversationId}:typing`);
    }
  }

  /**
   * Subscribe to all conversations for the user (for dashboard updates)
   */
  subscribeToUserConversations(): void {
    // Subscribe to message updates across all user conversations
    const userMessagesChannel = this.supabase
      .channel(`user:${this.userId}:messages`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${this.userId}`
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Get full message data
          const { data: messageWithSender } = await this.supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!messages_sender_id_fkey (
                id,
                name,
                location
              )
            `)
            .eq('id', newMessage.id)
            .single();

          if (messageWithSender && this.options.onNewMessage) {
            this.options.onNewMessage({
              message: messageWithSender,
              conversation_id: newMessage.conversation_id
            });
          }
        }
      )
      .subscribe();

    this.subscriptions.set('user:conversations', userMessagesChannel);
  }

  /**
   * Subscribe to user presence updates
   */
  subscribeToPresence(conversationId: string): void {
    const presenceChannel = this.supabase
      .channel(`conversation:${conversationId}:presence`)
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const users = Object.keys(state).map(userId => ({
          userId,
          status: state[userId][0]?.status || 'away'
        }));

        if (this.options.onUserPresenceUpdate) {
          this.options.onUserPresenceUpdate(users);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track user as online
          await presenceChannel.track({
            user_id: this.userId,
            status: 'online',
            online_at: new Date().toISOString()
          });
        }
      });

    this.subscriptions.set(`${conversationId}:presence`, presenceChannel);
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(conversationId: string, isTyping: boolean, userName: string): Promise<void> {
    const typingChannel = this.subscriptions.get(`${conversationId}:typing`);
    
    if (typingChannel) {
      await typingChannel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: this.userId,
          user_name: userName,
          is_typing: isTyping,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Update user presence status
   */
  async updatePresenceStatus(conversationId: string, status: 'online' | 'away'): Promise<void> {
    const presenceChannel = this.subscriptions.get(`${conversationId}:presence`);
    
    if (presenceChannel) {
      await presenceChannel.track({
        user_id: this.userId,
        status,
        online_at: status === 'online' ? new Date().toISOString() : null
      });
    }
  }

  /**
   * Clean up all subscriptions
   */
  cleanup(): void {
    for (const [key, channel] of this.subscriptions) {
      this.supabase.removeChannel(channel);
      console.log(`🧹 Cleaned up subscription: ${key}`);
    }
    this.subscriptions.clear();
  }
}

/**
 * React hook for real-time messaging
 */
import { useEffect, useRef, useCallback } from 'react';

interface UseRealtimeMessagingOptions extends RealtimeMessagingOptions {
  conversationId?: string;
  enablePresence?: boolean;
  enableGlobalUpdates?: boolean;
}

export function useRealtimeMessaging(options: UseRealtimeMessagingOptions) {
  const realtimeRef = useRef<RealtimeMessaging | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize realtime messaging
  useEffect(() => {
    realtimeRef.current = new RealtimeMessaging(options);

    // Subscribe to global user conversations if enabled
    if (options.enableGlobalUpdates) {
      realtimeRef.current.subscribeToUserConversations();
    }

    return () => {
      realtimeRef.current?.cleanup();
    };
  }, [options.userId]);

  // Subscribe to specific conversation
  useEffect(() => {
    if (options.conversationId && realtimeRef.current) {
      realtimeRef.current.subscribeToConversation(options.conversationId);

      if (options.enablePresence) {
        realtimeRef.current.subscribeToPresence(options.conversationId);
      }

      return () => {
        if (realtimeRef.current && options.conversationId) {
          realtimeRef.current.unsubscribeFromConversation(options.conversationId);
        }
      };
    }
  }, [options.conversationId, options.enablePresence]);

  // Handle page visibility changes for presence
  useEffect(() => {
    if (!options.conversationId || !options.enablePresence) return;

    const handleVisibilityChange = () => {
      const status = document.hidden ? 'away' : 'online';
      realtimeRef.current?.updatePresenceStatus(options.conversationId!, status);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [options.conversationId, options.enablePresence]);

  // Typing indicator with debouncing
  const sendTypingIndicator = useCallback(
    (isTyping: boolean, userName: string) => {
      if (!options.conversationId || !realtimeRef.current) return;

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (isTyping) {
        // Send typing start
        realtimeRef.current.sendTypingIndicator(options.conversationId, true, userName);

        // Auto-stop typing after 3 seconds
        typingTimeoutRef.current = setTimeout(() => {
          realtimeRef.current?.sendTypingIndicator(options.conversationId!, false, userName);
        }, 3000);
      } else {
        // Send typing stop immediately
        realtimeRef.current.sendTypingIndicator(options.conversationId, false, userName);
      }
    },
    [options.conversationId]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    sendTypingIndicator,
    updatePresenceStatus: (status: 'online' | 'away') => {
      if (options.conversationId) {
        realtimeRef.current?.updatePresenceStatus(options.conversationId, status);
      }
    }
  };
}