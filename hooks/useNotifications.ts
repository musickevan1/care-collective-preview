/**
 * useNotifications Hook
 * Manages notification state with real-time updates
 * Part of Care Collective Notification System Phase 2
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Notification } from '@/lib/notifications';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseNotificationsOptions {
  limit?: number;
  autoRefresh?: boolean;
  unreadOnly?: boolean;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  fetchMore: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook to manage notifications with real-time updates
 */
export function useNotifications(
  options: UseNotificationsOptions = {}
): UseNotificationsReturn {
  const { limit = 20, autoRefresh = true, unreadOnly = false } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [offset, setOffset] = useState<number>(0);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  /**
   * Fetch notifications from API
   */
  const fetchNotifications = useCallback(
    async (newOffset = 0, append = false) => {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: newOffset.toString(),
          unread_only: unreadOnly.toString(),
        });

        const response = await fetch(`/api/notifications?${params}`);

        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }

        const data = await response.json();

        setNotifications((prev) =>
          append ? [...prev, ...data.notifications] : data.notifications
        );
        setHasMore(data.hasMore);
        setOffset(newOffset);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('[useNotifications] Error fetching notifications:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [limit, unreadOnly]
  );

  /**
   * Fetch unread count
   */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/unread-count');

      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }

      const data = await response.json();
      setUnreadCount(data.count);
    } catch (err) {
      console.error('[useNotifications] Error fetching unread count:', err);
    }
  }, []);

  /**
   * Mark a notification as read
   */
  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        const response = await fetch(`/api/notifications/${notificationId}/read`, {
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error('Failed to mark as read');
        }

        // Optimistically update local state
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId
              ? { ...notif, read_at: new Date().toISOString() }
              : notif
          )
        );

        // Update unread count
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('[useNotifications] Error marking as read:', err);
      }
    },
    []
  );

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to mark all as read');
      }

      // Optimistically update local state
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read_at: new Date().toISOString() }))
      );

      setUnreadCount(0);
    } catch (err) {
      console.error('[useNotifications] Error marking all as read:', err);
    }
  }, []);

  /**
   * Fetch more notifications (pagination)
   */
  const fetchMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await fetchNotifications(offset + limit, true);
  }, [hasMore, isLoading, offset, limit, fetchNotifications]);

  /**
   * Refresh notifications
   */
  const refresh = useCallback(async () => {
    await fetchNotifications(0, false);
    await fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  /**
   * Set up real-time subscription
   */
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        // Subscribe to notification changes
        const channel = supabase
          .channel('notifications')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              // Add new notification to the top of the list
              setNotifications((prev) => [payload.new as Notification, ...prev]);
              setUnreadCount((prev) => prev + 1);
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              // Update notification in the list
              setNotifications((prev) =>
                prev.map((notif) =>
                  notif.id === payload.new.id ? (payload.new as Notification) : notif
                )
              );
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              // Remove notification from the list
              setNotifications((prev) =>
                prev.filter((notif) => notif.id !== payload.old.id)
              );
            }
          )
          .subscribe();

        channelRef.current = channel;
      } catch (err) {
        console.error('[useNotifications] Error setting up realtime:', err);
      }
    };

    setupRealtimeSubscription();

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [supabase]);

  /**
   * Initial fetch and auto-refresh on focus
   */
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // Auto-refresh on window focus
    if (autoRefresh) {
      const handleFocus = () => {
        refresh();
      };

      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
  }, [fetchNotifications, fetchUnreadCount, autoRefresh, refresh]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    hasMore,
    fetchMore,
    markAsRead,
    markAllAsRead,
    refresh,
  };
}
