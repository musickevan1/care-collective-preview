/**
 * NotificationService - Handles all notification operations
 * Part of Care Collective Notification System Phase 2
 */

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/database.types';

export type NotificationType = Database['public']['Tables']['notifications']['Row']['type'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  content?: string;
  relatedId?: string;
  relatedType?: string;
  actionUrl?: string;
}

export interface NotificationListOptions {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}

export interface NotificationListResult {
  notifications: Notification[];
  total: number;
  hasMore: boolean;
}

/**
 * NotificationService class for managing in-app notifications
 */
export class NotificationService {
  /**
   * Create a new notification for a user
   */
  static async createNotification(
    params: CreateNotificationParams
  ): Promise<Notification | null> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: params.userId,
          type: params.type,
          title: params.title,
          content: params.content,
          related_id: params.relatedId,
          related_type: params.relatedType,
          action_url: params.actionUrl,
        })
        .select()
        .single();

      if (error) {
        console.error('[NotificationService] Error creating notification:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[NotificationService] Unexpected error:', error);
      return null;
    }
  }

  /**
   * Get notifications for the current user with pagination
   */
  static async getUserNotifications(
    options: NotificationListOptions = {}
  ): Promise<NotificationListResult> {
    try {
      const supabase = createClient();
      const { limit = 20, offset = 0, unreadOnly = false } = options;

      // Build query
      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Filter for unread only if specified
      if (unreadOnly) {
        query = query.is('read_at', null);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('[NotificationService] Error fetching notifications:', error);
        return { notifications: [], total: 0, hasMore: false };
      }

      return {
        notifications: data || [],
        total: count || 0,
        hasMore: (count || 0) > offset + limit,
      };
    } catch (error) {
      console.error('[NotificationService] Unexpected error:', error);
      return { notifications: [], total: 0, hasMore: false };
    }
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const supabase = createClient();

      const { error } = await supabase.rpc('mark_notification_read', {
        notification_id: notificationId,
      });

      if (error) {
        console.error('[NotificationService] Error marking notification as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[NotificationService] Unexpected error:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for the current user
   */
  static async markAllAsRead(): Promise<boolean> {
    try {
      const supabase = createClient();

      const { error } = await supabase.rpc('mark_all_notifications_read');

      if (error) {
        console.error('[NotificationService] Error marking all as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[NotificationService] Unexpected error:', error);
      return false;
    }
  }

  /**
   * Get the count of unread notifications for the current user
   */
  static async getUnreadCount(): Promise<number> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase.rpc('get_unread_notification_count');

      if (error) {
        console.error('[NotificationService] Error getting unread count:', error);
        return 0;
      }

      return Number(data) || 0;
    } catch (error) {
      console.error('[NotificationService] Unexpected error:', error);
      return 0;
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('[NotificationService] Error deleting notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[NotificationService] Unexpected error:', error);
      return false;
    }
  }

  /**
   * Delete all read notifications for the current user
   */
  static async deleteAllRead(): Promise<boolean> {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('notifications')
        .delete()
        .not('read_at', 'is', null);

      if (error) {
        console.error('[NotificationService] Error deleting read notifications:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[NotificationService] Unexpected error:', error);
      return false;
    }
  }

  /**
   * Helper: Build action URL based on notification type
   */
  static buildActionUrl(
    type: NotificationType,
    relatedId: string,
    relatedType?: string
  ): string {
    switch (type) {
      case 'new_message':
        return `/messages?conversation=${relatedId}`;
      case 'help_request_offer':
      case 'help_request_accepted':
      case 'help_request_completed':
      case 'help_request_cancelled':
        return `/requests/${relatedId}`;
      case 'system_announcement':
        return '/dashboard';
      default:
        return '/dashboard';
    }
  }
}
