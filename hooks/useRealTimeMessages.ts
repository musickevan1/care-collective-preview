/**
 * @fileoverview Enhanced Real-time Messaging Hook
 * Provides real-time message updates, typing indicators, and presence management
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageWithSender } from '@/lib/messaging/types';
import { MessageEncryptionService } from '@/lib/messaging/encryption';
import { errorTracker } from '@/lib/error-tracking';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface QueuedMessage {
  id: string; // Temporary client-side ID
  content: string;
  messageType: 'standard' | 'contact_exchange' | 'sensitive';
  timestamp: number;
  retryCount: number;
}

export interface RealTimeMessagingState {
  messages: MessageWithSender[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  typing: {
    users: Array<{ id: string; name: string }>;
    isTyping: boolean;
  };
  presence: {
    online_users: Array<{ id: string; name: string; last_seen: string }>;
    total_participants: number;
  };
  unreadCount: number;
  queuedMessages: QueuedMessage[]; // Messages waiting to be sent when online
  isOnline: boolean;
}

export interface UseRealTimeMessagesOptions {
  enabled?: boolean;
  encryptionEnabled?: boolean;
  pageSize?: number;
  autoMarkRead?: boolean;
  presenceEnabled?: boolean;
}

export interface UseRealTimeMessagesResult extends RealTimeMessagingState {
  sendMessage: (content: string, messageType?: 'standard' | 'contact_exchange' | 'sensitive') => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: () => Promise<void>;
  setTyping: (isTyping: boolean) => void;
  updatePresence: (status: 'online' | 'away' | 'busy' | 'offline') => void;
  retryConnection: () => void;
  replyToMessage: (parentMessageId: string, content: string) => Promise<void>;
  getMessageThread: (threadId: string) => Promise<MessageWithSender[]>;
}

/**
 * Enhanced real-time messaging hook with encryption, presence, and threading support
 * Provides comprehensive messaging functionality including real-time updates, typing indicators,
 * message encryption, presence management, and message threading capabilities
 *
 * @param conversationId - Unique identifier for the conversation (null if not yet selected)
 * @param userId - Current user's unique identifier
 * @param userName - Display name for the current user (optional, used for presence)
 * @param options - Configuration options for messaging behavior
 * @returns Complete messaging state and action functions
 *
 * @example
 * ```typescript
 * const {
 *   messages,
 *   loading,
 *   sendMessage,
 *   setTyping,
 *   presence
 * } = useRealTimeMessages(
 *   'conv123',
 *   'user456',
 *   'John Doe',
 *   { encryptionEnabled: true, presenceEnabled: true }
 * );
 *
 * // Send a message
 * await sendMessage('Hello there!', 'standard');
 *
 * // Set typing indicator
 * setTyping(true);
 *
 * // Reply to a message (threading)
 * await replyToMessage('msg789', 'This is a reply');
 * ```
 */
export function useRealTimeMessages(
  conversationId: string | null,
  userId: string,
  userName?: string,
  options: UseRealTimeMessagesOptions = {}
): UseRealTimeMessagesResult {
  const {
    enabled = true,
    encryptionEnabled = false,
    pageSize = 50,
    autoMarkRead = true,
    presenceEnabled = true
  } = options;

  const [state, setState] = useState<RealTimeMessagingState>({
    messages: [],
    loading: false,
    error: null,
    hasMore: true,
    typing: { users: [], isTyping: false },
    presence: { online_users: [], total_participants: 0 },
    unreadCount: 0,
    queuedMessages: [],
    isOnline: true
  });

  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef(true);

  // Monitor network status for offline message queue
  const { networkStatus } = useNetworkStatus({
    enablePing: true,
    pingInterval: 30000,
    onConnectionChange: (isOnline) => {
      console.log(`🌐 Network status changed in useRealTimeMessages: ${isOnline ? 'online' : 'offline'}`);
      setState(prev => ({ ...prev, isOnline }));
    }
  });

  // Load messages for conversation
  const loadMessages = useCallback(async (append = false) => {
    if (!conversationId || !enabled) return;

    setState(prev => ({ ...prev, loading: !append, error: null }));

    try {
      const { data: messages, error } = await supabase
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
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(pageSize)
        .range(append ? state.messages.length : 0, (append ? state.messages.length : 0) + pageSize - 1);

      if (error) throw error;

      let processedMessages: MessageWithSender[] = messages || [];

      // Decrypt messages if encryption is enabled
      if (encryptionEnabled && messages?.length) {
        processedMessages = await Promise.all(
          messages.map(async (message) => {
            if (message.encryption_status === 'encrypted') {
              try {
                const decryptionResult = await MessageEncryptionService.getInstance().decryptMessage(
                  message.content,
                  message.sender_id,
                  message.recipient_id,
                  conversationId,
                  userId
                );

                return {
                  ...message,
                  content: decryptionResult.success ? decryptionResult.decrypted_content : '[Decryption failed]',
                  decryption_error: decryptionResult.success ? undefined : decryptionResult.error
                };
              } catch (error) {
                errorTracker.captureError(error as Error, {
                  component: 'useRealTimeMessages',
                  action: 'decrypt_message',
                  severity: 'medium'
                });

                return {
                  ...message,
                  content: '[Decryption failed]',
                  decryption_error: 'Failed to decrypt message'
                };
              }
            }
            return message;
          })
        );
      }

      // Reverse for chronological order (oldest first)
      const orderedMessages = processedMessages.reverse();

      setState(prev => ({
        ...prev,
        messages: append ? [...prev.messages, ...orderedMessages] : orderedMessages,
        loading: false,
        hasMore: orderedMessages.length === pageSize,
        error: null
      }));

      // Auto-mark messages as read
      if (autoMarkRead && !append && orderedMessages.length > 0) {
        await markMessagesAsRead();
      }

      // Update last message ID for real-time filtering
      if (orderedMessages.length > 0) {
        lastMessageIdRef.current = orderedMessages[orderedMessages.length - 1].id;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load messages';

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      errorTracker.captureError(error as Error, {
        component: 'useRealTimeMessages',
        action: 'load_messages',
        severity: 'medium',
        tags: { conversation_id: conversationId, user_id: userId }
      });
    }
  }, [conversationId, enabled, supabase, pageSize, encryptionEnabled, userId, autoMarkRead, state.messages.length]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async () => {
    if (!conversationId || !userId) return;

    try {
      const { error } = await supabase
        .rpc('mark_messages_read', {
          user_uuid: userId,
          conversation_uuid: conversationId
        });

      if (error) throw error;

      // Update unread count
      setState(prev => ({ ...prev, unreadCount: 0 }));

    } catch (error) {
      errorTracker.captureError(error as Error, {
        component: 'useRealTimeMessages',
        action: 'mark_messages_read',
        severity: 'low'
      });
    }
  }, [conversationId, userId, supabase]);

  // Process queued messages when back online
  const processQueuedMessages = useCallback(async () => {
    if (!conversationId || state.queuedMessages.length === 0) return;

    console.log(`📤 Processing ${state.queuedMessages.length} queued messages...`);

    const queue = [...state.queuedMessages];
    const MAX_RETRIES = 3;

    for (const queuedMsg of queue) {
      try {
        // Attempt to send the queued message
        await sendMessageInternal(queuedMsg.content, queuedMsg.messageType);

        // Remove from queue on success
        setState(prev => ({
          ...prev,
          queuedMessages: prev.queuedMessages.filter(m => m.id !== queuedMsg.id)
        }));

        console.log(`✅ Sent queued message ${queuedMsg.id}`);

      } catch (error) {
        console.error(`❌ Failed to send queued message ${queuedMsg.id}:`, error);

        // Increment retry count
        setState(prev => ({
          ...prev,
          queuedMessages: prev.queuedMessages.map(m =>
            m.id === queuedMsg.id
              ? { ...m, retryCount: m.retryCount + 1 }
              : m
          )
        }));

        // Remove if max retries reached
        if (queuedMsg.retryCount >= MAX_RETRIES) {
          console.warn(`⚠️ Max retries reached for message ${queuedMsg.id}, removing from queue`);
          setState(prev => ({
            ...prev,
            queuedMessages: prev.queuedMessages.filter(m => m.id !== queuedMsg.id),
            error: `Failed to send message after ${MAX_RETRIES} attempts`
          }));
        }
      }
    }
  }, [conversationId, state.queuedMessages]);

  // Internal send function (used by both direct send and queue processor)
  const sendMessageInternal = useCallback(async (
    content: string,
    messageType: 'standard' | 'contact_exchange' | 'sensitive' = 'standard'
  ) => {
    if (!conversationId || !userId || !content.trim()) return;

    try {
      // Check if message should be encrypted
      let encryptedContent = content;
      let encryptionStatus: 'none' | 'encrypted' | 'failed' = 'none';

      if (encryptionEnabled || messageType !== 'standard') {
        const encryptionResult = await MessageEncryptionService.getInstance().encryptMessage(
          content,
          userId,
          '', // Recipient will be determined by conversation
          conversationId,
          messageType
        );

        encryptedContent = encryptionResult.encrypted_content;
        encryptionStatus = encryptionResult.encryption_status;
      }

      // Get conversation participants to determine recipient
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select(`
          id,
          conversation_participants!inner (
            user_id,
            profiles (id, name)
          )
        `)
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;

      const recipient = conversation.conversation_participants
        .find(p => p.user_id !== userId);

      if (!recipient) throw new Error('No recipient found');

      // Send message
      const { data: newMessage, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          recipient_id: recipient.user_id,
          content: encryptedContent,
          message_type: messageType,
          encryption_status: encryptionStatus
        })
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey (
            id,
            name,
            location
          )
        `)
        .single();

      if (error) throw error;

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      // Clear typing indicator
      setTyping(false);

      // Optimistically add to local state (will be overridden by real-time update)
      const processedMessage = {
        ...newMessage,
        content: content // Show original content locally
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, processedMessage]
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';

      setState(prev => ({
        ...prev,
        error: errorMessage
      }));

      errorTracker.captureError(error as Error, {
        component: 'useRealTimeMessages',
        action: 'send_message',
        severity: 'high',
        tags: { conversation_id: conversationId, user_id: userId }
      });

      throw error;
    }
  }, [conversationId, userId, encryptionEnabled, supabase]);

  // Public sendMessage function with offline queue support
  const sendMessage = useCallback(async (
    content: string,
    messageType: 'standard' | 'contact_exchange' | 'sensitive' = 'standard'
  ) => {
    if (!conversationId || !userId || !content.trim()) return;

    // Check if online
    if (!networkStatus.isOnline) {
      // Add to offline queue
      const queuedMessage: QueuedMessage = {
        id: `queued-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content,
        messageType,
        timestamp: Date.now(),
        retryCount: 0
      };

      setState(prev => ({
        ...prev,
        queuedMessages: [...prev.queuedMessages, queuedMessage]
      }));

      console.log(`📥 Message queued for sending when online: ${queuedMessage.id}`);

      // Show optimistic message with "sending..." indicator
      const tempMessage = {
        id: queuedMessage.id,
        content,
        sender_id: userId,
        recipient_id: '', // Will be filled when actually sent
        conversation_id: conversationId,
        created_at: new Date().toISOString(),
        message_type: messageType,
        status: 'sending' as const,
        sender: { id: userId, name: userName || 'You', location: null }
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, tempMessage as any]
      }));

      return;
    }

    // Online - send immediately
    try {
      await sendMessageInternal(content, messageType);
    } catch (error) {
      // On error, queue the message for retry
      console.warn('Failed to send message, adding to queue for retry');
      const queuedMessage: QueuedMessage = {
        id: `queued-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content,
        messageType,
        timestamp: Date.now(),
        retryCount: 0
      };

      setState(prev => ({
        ...prev,
        queuedMessages: [...prev.queuedMessages, queuedMessage]
      }));

      throw error;
    }
  }, [conversationId, userId, userName, networkStatus.isOnline, sendMessageInternal]);

  // Process queue when network comes back online
  useEffect(() => {
    if (networkStatus.isOnline && state.queuedMessages.length > 0) {
      console.log(`🌐 Network online - processing ${state.queuedMessages.length} queued messages`);
      processQueuedMessages();
    }
  }, [networkStatus.isOnline, state.queuedMessages.length, processQueuedMessages]);

  // Reply to message (threading)
  const replyToMessage = useCallback(async (parentMessageId: string, content: string) => {
    if (!conversationId || !userId || !content.trim()) return;

    try {
      // Get parent message info
      const { data: parentMessage, error: parentError } = await supabase
        .from('messages')
        .select('thread_id, sender_id, recipient_id')
        .eq('id', parentMessageId)
        .single();

      if (parentError) throw parentError;

      // Determine recipient (opposite of current user)
      const recipientId = parentMessage.sender_id === userId
        ? parentMessage.recipient_id
        : parentMessage.sender_id;

      // Send threaded message
      const { data: threadMessage, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          recipient_id: recipientId,
          content: content,
          parent_message_id: parentMessageId,
          message_type: 'thread_reply'
        })
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey (
            id,
            name,
            location
          )
        `)
        .single();

      if (error) throw error;

      // Update state optimistically
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, threadMessage]
      }));

    } catch (error) {
      errorTracker.captureError(error as Error, {
        component: 'useRealTimeMessages',
        action: 'reply_to_message',
        severity: 'medium'
      });

      throw error;
    }
  }, [conversationId, userId, supabase]);

  // Get message thread
  const getMessageThread = useCallback(async (threadId: string): Promise<MessageWithSender[]> => {
    try {
      const { data: threadMessages, error } = await supabase
        .rpc('get_message_thread', {
          thread_uuid: threadId,
          user_uuid: userId
        });

      if (error) throw error;

      return threadMessages || [];
    } catch (error) {
      errorTracker.captureError(error as Error, {
        component: 'useRealTimeMessages',
        action: 'get_message_thread',
        severity: 'low'
      });

      return [];
    }
  }, [supabase, userId]);

  // Set typing indicator
  const setTyping = useCallback((isTyping: boolean) => {
    if (!conversationId || !userId || !enabled) return;

    setState(prev => ({
      ...prev,
      typing: { ...prev.typing, isTyping }
    }));

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    supabase.rpc('update_user_presence', {
      user_uuid: userId,
      new_status: 'online',
      conversation_uuid: conversationId,
      typing_in_conversation: isTyping ? conversationId : null
    });

    if (isTyping) {
      // Auto-clear typing after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
      }, 3000);
    }
  }, [conversationId, userId, enabled, supabase]);

  // Update presence
  const updatePresence = useCallback((status: 'online' | 'away' | 'busy' | 'offline') => {
    if (!userId || !presenceEnabled) return;

    supabase.rpc('update_user_presence', {
      user_uuid: userId,
      new_status: status,
      conversation_uuid: conversationId,
      typing_in_conversation: null
    });
  }, [userId, presenceEnabled, conversationId, supabase]);

  // Load more messages
  const loadMore = useCallback(() => loadMessages(true), [loadMessages]);

  // Retry connection
  const retryConnection = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    loadMessages();
  }, [loadMessages]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!conversationId || !enabled) return;

    // Clean up previous channel before creating new one
    if (channelRef.current) {
      console.debug('[useRealTimeMessages] Cleaning up previous channel before new subscription');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase.channel(`conversation:${conversationId}`, {
      config: {
        broadcast: { self: false }, // Don't receive own messages via broadcast
        presence: { key: userId }
      }
    })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, async (payload) => {
        const newMessage = payload.new as any;

        // Get sender info
        const { data: sender } = await supabase
          .from('profiles')
          .select('id, name, location')
          .eq('id', newMessage.sender_id)
          .single();

        const messageWithSender = {
          ...newMessage,
          sender: sender || { id: newMessage.sender_id, name: 'Unknown', location: null }
        };

        // Decrypt if needed
        let processedMessage = messageWithSender;
        if (encryptionEnabled && newMessage.encryption_status === 'encrypted') {
          try {
            const decryptionResult = await MessageEncryptionService.getInstance().decryptMessage(
              newMessage.content,
              newMessage.sender_id,
              newMessage.recipient_id,
              conversationId,
              userId
            );

            processedMessage = {
              ...messageWithSender,
              content: decryptionResult.success ? decryptionResult.decrypted_content : '[Decryption failed]'
            };
          } catch (error) {
            processedMessage = {
              ...messageWithSender,
              content: '[Decryption failed]'
            };
          }
        }

        // Add message to state with deduplication check
        // This prevents duplicates from race conditions, network lag, and offline sync
        setState(prev => {
          // Check if message already exists by ID
          const messageExists = prev.messages.some(msg => msg.id === newMessage.id);
          if (messageExists) {
            console.debug(`Skipping duplicate message: ${newMessage.id}`);
            return prev; // Skip duplicate, return unchanged state
          }

          return {
            ...prev,
            messages: [...prev.messages, processedMessage],
            unreadCount: newMessage.recipient_id === userId
              ? prev.unreadCount + 1
              : prev.unreadCount
          };
        });

        lastMessageIdRef.current = newMessage.id;
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'user_presence'
      }, (payload) => {
        const presence = payload.new as any;

        setState(prev => ({
          ...prev,
          typing: {
            ...prev.typing,
            users: presence.is_typing_in_conversation === conversationId && presence.user_id !== userId
              ? [{ id: presence.user_id, name: 'User' }] // Would need to fetch name
              : prev.typing.users.filter(u => u.id !== presence.user_id)
          }
        }));
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.debug('[useRealTimeMessages] Successfully subscribed to conversation:', conversationId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[useRealTimeMessages] Channel error for conversation:', conversationId);
        }
      });

    channelRef.current = channel;

    // Initial load
    if (isInitialLoadRef.current) {
      loadMessages();
      isInitialLoadRef.current = false;
    }

    return () => {
      console.debug('[useRealTimeMessages] Cleaning up channel for conversation:', conversationId);

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      // Properly remove channel (better than unsubscribe alone)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId, enabled, userId, encryptionEnabled, supabase, loadMessages]);

  // Update presence on mount and unmount
  useEffect(() => {
    if (presenceEnabled && userId && conversationId) {
      updatePresence('online');

      return () => {
        updatePresence('offline');
      };
    }
  }, [presenceEnabled, userId, conversationId, updatePresence]);

  return {
    ...state,
    sendMessage,
    loadMore,
    markAsRead: markMessagesAsRead,
    setTyping,
    updatePresence,
    retryConnection,
    replyToMessage,
    getMessageThread
  };
}