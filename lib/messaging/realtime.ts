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
  onConnectionStatusChange?: (status: 'connected' | 'disconnected' | 'reconnecting' | 'error') => void;
}

interface ReconnectionState {
  conversationId: string;
  retryCount: number;
  lastAttempt: number;
  timeout: NodeJS.Timeout | null;
}

export class RealtimeMessaging {
  private supabase;
  private subscriptions: Map<string, any> = new Map();
  private userId: string;
  private options: RealtimeMessagingOptions;
  private reconnectionStates: Map<string, ReconnectionState> = new Map();
  private readonly MAX_RETRY_ATTEMPTS = 5;
  private readonly INITIAL_RETRY_DELAY = 1000; // 1 second
  private readonly MAX_RETRY_DELAY = 30000; // 30 seconds

  constructor(options: RealtimeMessagingOptions) {
    this.supabase = createClient();
    this.userId = options.userId;
    this.options = options;
  }

  /**
   * Calculate exponential backoff delay for reconnection attempts
   */
  private getReconnectionDelay(retryCount: number): number {
    const delay = Math.min(
      this.INITIAL_RETRY_DELAY * Math.pow(2, retryCount),
      this.MAX_RETRY_DELAY
    );
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }

  /**
   * Attempt to reconnect to a conversation after connection failure
   */
  private async attemptReconnection(conversationId: string): Promise<void> {
    const state = this.reconnectionStates.get(conversationId);

    if (!state) {
      console.warn(`No reconnection state found for conversation ${conversationId}`);
      return;
    }

    if (state.retryCount >= this.MAX_RETRY_ATTEMPTS) {
      console.error(`❌ Max retry attempts (${this.MAX_RETRY_ATTEMPTS}) reached for conversation ${conversationId}`);
      this.notifyConnectionStatus('error');
      this.reconnectionStates.delete(conversationId);
      return;
    }

    state.retryCount++;
    state.lastAttempt = Date.now();

    const delay = this.getReconnectionDelay(state.retryCount);
    console.log(`🔄 Reconnecting to conversation ${conversationId} (attempt ${state.retryCount}/${this.MAX_RETRY_ATTEMPTS}) in ${Math.round(delay / 1000)}s`);

    this.notifyConnectionStatus('reconnecting');

    state.timeout = setTimeout(() => {
      console.log(`🔌 Attempting reconnection to conversation ${conversationId}`);
      this.subscribeToConversation(conversationId);
    }, delay);
  }

  /**
   * Notify connection status change to listeners
   */
  private notifyConnectionStatus(status: 'connected' | 'disconnected' | 'reconnecting' | 'error'): void {
    if (this.options.onConnectionStatusChange) {
      this.options.onConnectionStatusChange(status);
    }
  }

  /**
   * Reset reconnection state after successful connection
   */
  private resetReconnectionState(conversationId: string): void {
    const state = this.reconnectionStates.get(conversationId);
    if (state?.timeout) {
      clearTimeout(state.timeout);
    }
    this.reconnectionStates.delete(conversationId);
  }

  /**
   * Subscribe to real-time updates for a specific conversation
   */
  subscribeToConversation(conversationId: string): void {
    // Unsubscribe from existing conversation subscription
    this.unsubscribeFromConversation(conversationId);

    // Subscribe to new messages in this conversation
    // NOTE (Dual-Schema): Subscribe to V1 'messages' table (not 'messages_v2')
    // New messages are written to messages_v2, then synced to messages via trigger
    // We listen to 'messages' for backward compatibility during V1→V2 migration
    // See: docs/database/dual-schema-sync-strategy.md
    const messageChannel = this.supabase
      .channel(`conversation:${conversationId}:messages`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',  // V1 table receives synced data from messages_v2
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
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Subscribed to conversation ${conversationId} messages`);
          // Reset reconnection state on successful connection
          this.resetReconnectionState(conversationId);
          this.notifyConnectionStatus('connected');
        } else if (status === 'CLOSED') {
          console.log(`❌ Connection closed for conversation ${conversationId}`);
          this.notifyConnectionStatus('disconnected');

          // Initialize reconnection state if not already present
          if (!this.reconnectionStates.has(conversationId)) {
            this.reconnectionStates.set(conversationId, {
              conversationId,
              retryCount: 0,
              lastAttempt: Date.now(),
              timeout: null
            });
            this.attemptReconnection(conversationId);
          }
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Channel error for conversation ${conversationId}:`, err);
          this.notifyConnectionStatus('error');

          // Attempt reconnection on channel error
          if (!this.reconnectionStates.has(conversationId)) {
            this.reconnectionStates.set(conversationId, {
              conversationId,
              retryCount: 0,
              lastAttempt: Date.now(),
              timeout: null
            });
            this.attemptReconnection(conversationId);
          }
        } else if (status === 'TIMED_OUT') {
          console.warn(`⏱️ Connection timed out for conversation ${conversationId}`);
          this.notifyConnectionStatus('disconnected');

          // Attempt reconnection on timeout
          if (!this.reconnectionStates.has(conversationId)) {
            this.reconnectionStates.set(conversationId, {
              conversationId,
              retryCount: 0,
              lastAttempt: Date.now(),
              timeout: null
            });
            this.attemptReconnection(conversationId);
          }
        } else {
          console.log(`ℹ️ Subscription status for conversation ${conversationId}: ${status}`);
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
        const users = Object.keys(state).map(userId => {
          const presenceData: any = state[userId][0];
          return {
            userId,
            status: presenceData?.status || 'away'
          };
        });

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
    // Cancel all pending reconnection attempts
    for (const [conversationId, state] of this.reconnectionStates) {
      if (state.timeout) {
        clearTimeout(state.timeout);
        console.log(`🧹 Cancelled reconnection attempt for conversation ${conversationId}`);
      }
    }
    this.reconnectionStates.clear();

    // Remove all channel subscriptions
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
import { useEffect, useRef, useCallback, useState } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface UseRealtimeMessagingOptions extends RealtimeMessagingOptions {
  conversationId?: string;
  enablePresence?: boolean;
  enableGlobalUpdates?: boolean;
}

export function useRealtimeMessaging(options: UseRealtimeMessagingOptions) {
  const realtimeRef = useRef<RealtimeMessaging | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting' | 'error'>('disconnected');

  // Monitor network status
  const { networkStatus } = useNetworkStatus({
    enablePing: true,
    pingInterval: 30000,
    onConnectionChange: (isOnline) => {
      console.log(`🌐 Network status changed: ${isOnline ? 'online' : 'offline'}`);

      if (isOnline && options.conversationId && realtimeRef.current) {
        // Reconnect when network comes back online
        console.log('🔌 Network restored, resubscribing to conversation...');
        realtimeRef.current.subscribeToConversation(options.conversationId);

        if (options.enablePresence) {
          realtimeRef.current.subscribeToPresence(options.conversationId);
        }
      } else if (!isOnline) {
        // Update connection status when offline
        setConnectionStatus('disconnected');
      }
    }
  });

  // Initialize realtime messaging with connection status callback
  useEffect(() => {
    realtimeRef.current = new RealtimeMessaging({
      ...options,
      onConnectionStatusChange: (status) => {
        console.log(`🔌 Realtime connection status: ${status}`);
        setConnectionStatus(status);
      }
    });

    // Subscribe to global user conversations if enabled
    if (options.enableGlobalUpdates) {
      realtimeRef.current.subscribeToUserConversations();
    }

    return () => {
      realtimeRef.current?.cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.userId]);

  // Subscribe to specific conversation (only when online)
  useEffect(() => {
    if (options.conversationId && realtimeRef.current && networkStatus.isOnline) {
      console.log(`🔌 Subscribing to conversation ${options.conversationId} (network online)`);
      realtimeRef.current.subscribeToConversation(options.conversationId);

      if (options.enablePresence) {
        realtimeRef.current.subscribeToPresence(options.conversationId);
      }

      return () => {
        if (realtimeRef.current && options.conversationId) {
          realtimeRef.current.unsubscribeFromConversation(options.conversationId);
        }
      };
    } else if (options.conversationId && !networkStatus.isOnline) {
      console.log(`⚠️ Cannot subscribe to conversation ${options.conversationId}: network offline`);
    }
  }, [options.conversationId, options.enablePresence, networkStatus.isOnline]);

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
    },
    connectionStatus,
    isOnline: networkStatus.isOnline,
    networkStatus
  };
}