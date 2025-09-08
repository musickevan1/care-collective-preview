/**
 * @fileoverview Hook for messaging integration throughout platform
 * Provides real-time messaging data and status for platform components
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface MessagingData {
  unreadCount: number;
  activeConversations: number;
  recentMessages: Array<{
    id: string;
    content: string;
    sender_name: string;
    created_at: string;
    conversation_id: string;
  }>;
}

interface UseMessagingIntegrationReturn {
  messagingData: MessagingData;
  isLoading: boolean;
  error: string | null;
  refreshMessagingData: () => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
}

export function useMessagingIntegration(userId?: string): UseMessagingIntegrationReturn {
  const [messagingData, setMessagingData] = useState<MessagingData>({
    unreadCount: 0,
    activeConversations: 0,
    recentMessages: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchMessagingData = useCallback(async () => {
    if (!userId) {
      setMessagingData({
        unreadCount: 0,
        activeConversations: 0,
        recentMessages: []
      });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get user's active conversations
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          id,
          last_message_at,
          conversation_participants!inner (
            user_id
          )
        `)
        .eq('conversation_participants.user_id', userId)
        .is('conversation_participants.left_at', null)
        .order('last_message_at', { ascending: false });

      if (conversationsError) {
        throw conversationsError;
      }

      const activeConversations = conversations?.length || 0;

      // Get unread message count
      const { count: unreadCount, error: unreadError } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('recipient_id', userId)
        .is('read_at', null);

      if (unreadError) {
        throw unreadError;
      }

      // Get recent messages for notifications
      const { data: recentMessages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          conversation_id,
          sender:profiles!messages_sender_id_fkey (
            name
          )
        `)
        .eq('recipient_id', userId)
        .is('read_at', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (messagesError) {
        throw messagesError;
      }

      const formattedMessages = recentMessages?.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender_name: msg.sender?.name || 'Unknown',
        created_at: msg.created_at,
        conversation_id: msg.conversation_id
      })) || [];

      setMessagingData({
        unreadCount: unreadCount || 0,
        activeConversations,
        recentMessages: formattedMessages
      });

    } catch (err) {
      console.error('Error fetching messaging data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messaging data');
    } finally {
      setIsLoading(false);
    }
  }, [userId, supabase]);

  const markAsRead = useCallback(async (conversationId: string) => {
    if (!userId) return;

    try {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('recipient_id', userId)
        .is('read_at', null);

      // Refresh data after marking as read
      await fetchMessagingData();
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  }, [userId, supabase, fetchMessagingData]);

  const refreshMessagingData = useCallback(async () => {
    await fetchMessagingData();
  }, [fetchMessagingData]);

  // Initial data load
  useEffect(() => {
    fetchMessagingData();
  }, [fetchMessagingData]);

  // Set up real-time subscriptions for messaging updates
  useEffect(() => {
    if (!userId) return;

    const messagesSubscription = supabase
      .channel('user-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`
        },
        () => {
          // Refresh messaging data when new messages arrive
          fetchMessagingData();
        }
      )
      .subscribe();

    const conversationsSubscription = supabase
      .channel('user-conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_participants',
          filter: `user_id=eq.${userId}`
        },
        () => {
          // Refresh when user joins/leaves conversations
          fetchMessagingData();
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
      conversationsSubscription.unsubscribe();
    };
  }, [userId, supabase, fetchMessagingData]);

  return {
    messagingData,
    isLoading,
    error,
    refreshMessagingData,
    markAsRead
  };
}