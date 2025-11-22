/**
 * React Query client configuration for Care Collective
 *
 * Optimized for messaging performance:
 * - 5min stale time: Data stays fresh without excessive refetch
 * - 10min cache time: Keeps data in memory for quick access
 * - Retry logic: Handles network failures gracefully
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Consider data stale after 5 minutes
      staleTime: 1000 * 60 * 5,

      // Keep unused data in cache for 10 minutes
      gcTime: 1000 * 60 * 10,

      // Retry failed requests up to 3 times
      retry: 3,

      // Exponential backoff: 1s, 2s, 4s
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus for real-time feel
      refetchOnWindowFocus: true,

      // Don't refetch on mount if data is fresh
      refetchOnMount: false,

      // Don't refetch on reconnect (real-time handles this)
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,

      // 5s timeout for mutations
      retryDelay: 5000,
    },
  },
});

/**
 * Query keys factory for consistent key management
 */
export const queryKeys = {
  // Conversations
  conversations: {
    all: ['conversations'] as const,
    lists: () => [...queryKeys.conversations.all, 'list'] as const,
    list: (status?: string) => [...queryKeys.conversations.lists(), { status }] as const,
    details: () => [...queryKeys.conversations.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.conversations.details(), id] as const,
  },

  // Messages
  messages: {
    all: ['messages'] as const,
    lists: () => [...queryKeys.messages.all, 'list'] as const,
    list: (conversationId: string) => [...queryKeys.messages.lists(), conversationId] as const,
  },

  // Pending offers
  pendingOffers: {
    all: ['pending-offers'] as const,
  },

  // User profiles
  profiles: {
    all: ['profiles'] as const,
    detail: (id: string) => [...queryKeys.profiles.all, id] as const,
  },
} as const;
