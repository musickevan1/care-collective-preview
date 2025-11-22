/**
 * React Query hooks for messaging - Phase 2.2 Performance Optimization
 *
 * Provides intelligent caching and automatic refetching for messaging data.
 * Eliminates redundant API calls and improves perceived performance.
 */

'use client';

import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseInfiniteQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { messagingClient } from '@/lib/messaging/client';
import { sendMessage as sendMessageService } from '@/lib/messaging/service-v2';
import type {
  ConversationWithDetails,
  MessageWithSender,
  ConversationsResponse,
  MessagesResponse,
} from '@/lib/messaging/types';

/**
 * Hook to fetch conversations list with automatic caching
 */
export function useConversations(
  userId: string,
  options?: {
    status?: string;
    page?: number;
    limit?: number;
    enabled?: boolean;
  }
): UseQueryResult<ConversationsResponse, Error> {
  const { status, page = 1, limit = 20, enabled = true } = options || {};

  return useQuery({
    queryKey: queryKeys.conversations.list(status),
    queryFn: async () => {
      return await messagingClient.getConversations(userId, { page, limit });
    },
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes (shorter for real-time feel)
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchInterval: 30000, // Poll every 30s as fallback to real-time
  });
}

/**
 * Hook to fetch a single conversation with details
 */
export function useConversation(
  conversationId: string | null,
  userId: string,
  options?: { enabled?: boolean }
): UseQueryResult<ConversationWithDetails, Error> {
  const { enabled = true } = options || {};

  return useQuery({
    queryKey: queryKeys.conversations.detail(conversationId || ''),
    queryFn: async () => {
      if (!conversationId) throw new Error('Conversation ID required');
      return await messagingClient.getConversationDetails(conversationId, userId);
    },
    enabled: enabled && !!conversationId && !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
}

/**
 * Hook to fetch messages with cursor-based infinite scroll
 */
export function useInfiniteMessages(
  conversationId: string | null,
  userId: string,
  options?: {
    limit?: number;
    enabled?: boolean;
  }
): UseInfiniteQueryResult<MessagesResponse, Error> {
  const { limit = 50, enabled = true } = options || {};

  return useInfiniteQuery({
    queryKey: queryKeys.messages.list(conversationId || ''),
    queryFn: async ({ pageParam }) => {
      if (!conversationId) throw new Error('Conversation ID required');

      return await messagingClient.getMessages(conversationId, userId, {
        limit,
        cursor: pageParam as string | undefined,
        direction: 'older',
      });
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.next_cursor || undefined;
    },
    initialPageParam: undefined,
    enabled: enabled && !!conversationId && !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutes (messages are immutable)
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Hook to fetch messages with standard pagination (for non-infinite scroll UI)
 */
export function useMessages(
  conversationId: string | null,
  userId: string,
  options?: {
    limit?: number;
    cursor?: string;
    enabled?: boolean;
  }
): UseQueryResult<MessagesResponse, Error> {
  const { limit = 50, cursor, enabled = true } = options || {};

  return useQuery({
    queryKey: [...queryKeys.messages.list(conversationId || ''), cursor],
    queryFn: async () => {
      if (!conversationId) throw new Error('Conversation ID required');

      return await messagingClient.getMessages(conversationId, userId, {
        limit,
        cursor,
        direction: 'older',
      });
    },
    enabled: enabled && !!conversationId && !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Mutation hook to send a message with optimistic updates
 */
export function useSendMessage(): UseMutationResult<
  any,
  Error,
  { conversationId: string; content: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, content }) => {
      return await sendMessageService(conversationId, content);
    },
    onMutate: async ({ conversationId, content }) => {
      // Cancel outgoing queries for this conversation
      await queryClient.cancelQueries({
        queryKey: queryKeys.messages.list(conversationId),
      });

      // Snapshot previous value for rollback
      const previousMessages = queryClient.getQueryData(
        queryKeys.messages.list(conversationId)
      );

      // Optimistically update messages (for infinite query)
      queryClient.setQueryData(
        queryKeys.messages.list(conversationId),
        (old: any) => {
          if (!old) return old;

          // Add optimistic message to the first page
          const optimisticMessage = {
            id: `temp-${Date.now()}`,
            content,
            created_at: new Date().toISOString(),
            sender_id: 'current-user', // Will be replaced by real data
            conversation_id: conversationId,
            is_optimistic: true,
          };

          if (old.pages) {
            // Infinite query format
            return {
              ...old,
              pages: old.pages.map((page: any, index: number) =>
                index === 0
                  ? {
                      ...page,
                      messages: [optimisticMessage, ...page.messages],
                    }
                  : page
              ),
            };
          } else {
            // Standard query format
            return {
              ...old,
              messages: [optimisticMessage, ...(old.messages || [])],
            };
          }
        }
      );

      return { previousMessages };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.messages.list(_variables.conversationId),
          context.previousMessages
        );
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.list(variables.conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.all,
      });
    },
  });
}

/**
 * Hook to manually update message cache (for real-time subscriptions)
 */
export function useUpdateMessageCache() {
  const queryClient = useQueryClient();

  return {
    addMessage: (conversationId: string, message: MessageWithSender) => {
      // Update infinite query cache
      queryClient.setQueryData(
        queryKeys.messages.list(conversationId),
        (old: any) => {
          if (!old) return old;

          if (old.pages) {
            // Infinite query format - add to first page
            return {
              ...old,
              pages: old.pages.map((page: any, index: number) =>
                index === 0
                  ? {
                      ...page,
                      messages: [message, ...page.messages],
                    }
                  : page
              ),
            };
          } else {
            // Standard query format
            return {
              ...old,
              messages: [message, ...(old.messages || [])],
            };
          }
        }
      );

      // Invalidate conversations to update last message
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.all,
      });
    },

    markAsRead: (conversationId: string, messageId: string) => {
      queryClient.setQueryData(
        queryKeys.messages.list(conversationId),
        (old: any) => {
          if (!old) return old;

          const updateMessage = (msg: any) =>
            msg.id === messageId ? { ...msg, read_at: new Date().toISOString() } : msg;

          if (old.pages) {
            return {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                messages: page.messages.map(updateMessage),
              })),
            };
          } else {
            return {
              ...old,
              messages: (old.messages || []).map(updateMessage),
            };
          }
        }
      );
    },
  };
}
