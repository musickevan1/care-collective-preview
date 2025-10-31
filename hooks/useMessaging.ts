/**
 * @fileoverview Custom React hook for messaging functionality
 * Provides messaging state management and real-time updates
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ConversationWithDetails, MessageWithSender, MessagingPreferences } from '@/lib/messaging/types';

interface UseMessagingOptions {
  userId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseMessagingReturn {
  conversations: ConversationWithDetails[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  preferences: MessagingPreferences | null;
  
  // Actions
  refreshConversations: () => Promise<void>;
  createConversation: (recipientId: string, helpRequestId?: string, message?: string) => Promise<string>;
  startHelpConversation: (helpRequestId: string, message?: string) => Promise<string>;
  updatePreferences: (prefs: Partial<MessagingPreferences>) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export function useMessaging({ 
  userId, 
  autoRefresh = true, 
  refreshInterval = 30000 
}: UseMessagingOptions): UseMessagingReturn {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<MessagingPreferences | null>(null);
  
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Calculate total unread count
  const unreadCount = conversations.reduce((total, conv) => total + conv.unread_count, 0);

  // Refresh conversations
  const refreshConversations = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      setError(null);
      const response = await fetch('/api/messaging/conversations');
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      
      const data = await response.json();
      
      if (mountedRef.current) {
        setConversations(data.conversations || []);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load conversations');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Load messaging preferences
  const loadPreferences = useCallback(async () => {
    try {
      const response = await fetch('/api/messaging/preferences');
      if (response.ok) {
        const data = await response.json();
        if (mountedRef.current) {
          setPreferences(data.preferences);
        }
      }
    } catch (err) {
      console.error('Failed to load messaging preferences:', err);
    }
  }, []);

  // Create a new conversation
  const createConversation = useCallback(async (
    recipientId: string, 
    helpRequestId?: string, 
    message: string = "Hi! I'd like to connect with you."
  ): Promise<string> => {
    const response = await fetch('/api/messaging/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient_id: recipientId,
        help_request_id: helpRequestId,
        initial_message: message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create conversation');
    }

    const data = await response.json();

    const conversationId = data.conversation_id ?? data.conversation?.id;

    if (!conversationId) {
      throw new Error('Conversation created but no identifier was returned');
    }

    // Refresh conversations to include the new one
    refreshConversations();

    return conversationId;
  }, [refreshConversations]);

  // Start a help request conversation
  const startHelpConversation = useCallback(async (
    helpRequestId: string,
    message: string = "Hi! I'd like to help with your request."
  ): Promise<string> => {
    const response = await fetch(`/api/messaging/help-requests/${helpRequestId}/start-conversation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        initial_message: message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to start help conversation');
    }

    const data = await response.json();

    const conversationId = data.conversation_id ?? data.conversation?.id;

    if (!conversationId) {
      throw new Error('Help conversation created but no identifier was returned');
    }

    // Refresh conversations to include the new one
    refreshConversations();

    return conversationId;
  }, [refreshConversations]);

  // Update messaging preferences
  const updatePreferences = useCallback(async (prefs: Partial<MessagingPreferences>) => {
    const response = await fetch('/api/messaging/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(prefs),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update preferences');
    }

    const data = await response.json();
    setPreferences(data.preferences);
  }, []);

  // Mark all conversations as read
  const markAllAsRead = useCallback(async () => {
    try {
      await Promise.all(
        conversations
          .filter(conv => conv.unread_count > 0)
          .map(conv => 
            fetch(`/api/messaging/conversations/${conv.id}/messages?markAllRead=true`, {
              method: 'PUT'
            })
          )
      );
      
      // Update local state
      setConversations(prevConversations =>
        prevConversations.map(conv => ({ ...conv, unread_count: 0 }))
      );
    } catch (err) {
      console.error('Failed to mark all messages as read:', err);
    }
  }, [conversations]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const scheduleRefresh = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      refreshTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          refreshConversations();
          scheduleRefresh();
        }
      }, refreshInterval);
    };

    scheduleRefresh();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, refreshConversations]);

  // Initial load
  useEffect(() => {
    refreshConversations();
    loadPreferences();
  }, [refreshConversations, loadPreferences]);

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Browser visibility change handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mountedRef.current) {
        refreshConversations();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshConversations]);

  return {
    conversations,
    loading,
    error,
    unreadCount,
    preferences,
    refreshConversations,
    createConversation,
    startHelpConversation,
    updatePreferences,
    markAllAsRead,
  };
}

/**
 * Hook for managing individual message thread
 */
interface UseMessageThreadOptions {
  conversationId: string;
  userId: string;
  autoRefresh?: boolean;
  markAsRead?: boolean;
}

interface UseMessageThreadReturn {
  messages: MessageWithSender[];
  conversation: ConversationWithDetails | null;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  sending: boolean;
  
  // Actions
  sendMessage: (content: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  reportMessage: (messageId: string, reason: string, description?: string) => Promise<void>;
  refreshMessages: () => Promise<void>;
}

export function useMessageThread({
  conversationId,
  userId,
  autoRefresh = true,
  markAsRead = true
}: UseMessageThreadOptions): UseMessageThreadReturn {
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [conversation, setConversation] = useState<ConversationWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [sending, setSending] = useState(false);
  
  const lastMessageRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  // Load messages
  const loadMessages = useCallback(async (cursor?: string, direction: 'older' | 'newer' = 'older') => {
    try {
      setError(null);
      const params = new URLSearchParams({
        limit: '50',
        direction,
        ...(cursor && { cursor })
      });

      const response = await fetch(`/api/messaging/conversations/${conversationId}/messages?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to load messages');
      }
      
      const data = await response.json();
      
      if (mountedRef.current) {
        if (direction === 'newer') {
          setMessages(prev => [...prev, ...data.messages]);
        } else {
          setMessages(direction === 'older' && cursor ? 
            [...data.messages, ...messages] : 
            data.messages
          );
        }
        
        setConversation(data.conversation);
        setHasMore(data.pagination.has_more);

        // Auto-mark new messages as read
        if (markAsRead) {
          const unreadMessages = data.messages.filter(
            (msg: MessageWithSender) => 
              msg.recipient.id === userId && 
              !msg.read_at &&
              msg.id !== lastMessageRef.current
          );

          unreadMessages.forEach((msg: MessageWithSender) => {
            markMessageAsRead(msg.id);
          });
        }

        if (data.messages.length > 0) {
          lastMessageRef.current = data.messages[data.messages.length - 1].id;
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load messages');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [conversationId, userId, markAsRead, messages]);

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (sending || !content.trim()) return;

    setSending(true);
    try {
      const response = await fetch(`/api/messaging/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data = await response.json();
      
      if (mountedRef.current) {
        setMessages(prev => [...prev, data.message]);
      }
    } catch (err) {
      throw err; // Let the component handle the error
    } finally {
      setSending(false);
    }
  }, [conversationId, sending]);

  // Mark message as read
  const markMessageAsRead = useCallback(async (messageId: string) => {
    try {
      await fetch(`/api/messaging/conversations/${conversationId}/messages?messageId=${messageId}`, {
        method: 'PUT',
      });

      if (mountedRef.current) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId
              ? { ...msg, read_at: new Date().toISOString(), status: 'read' }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  }, [conversationId]);

  // Report message
  const reportMessage = useCallback(async (messageId: string, reason: string, description?: string) => {
    const response = await fetch(`/api/messaging/messages/${messageId}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason, description }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to report message');
    }

    // Hide the message locally
    if (mountedRef.current) {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, is_flagged: true, flagged_reason: reason }
            : msg
        )
      );
    }
  }, []);

  // Load more messages
  const loadMoreMessages = useCallback(() => {
    if (hasMore && messages.length > 0) {
      return loadMessages(messages[0].created_at, 'older');
    }
    return Promise.resolve();
  }, [hasMore, messages, loadMessages]);

  // Refresh messages
  const refreshMessages = useCallback(() => {
    return loadMessages();
  }, [loadMessages]);

  // Initial load
  useEffect(() => {
    loadMessages();
  }, [conversationId]);

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    messages,
    conversation,
    loading,
    error,
    hasMore,
    sending,
    sendMessage,
    loadMoreMessages,
    markAsRead: markMessageAsRead,
    reportMessage,
    refreshMessages,
  };
}