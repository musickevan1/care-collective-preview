# Notification System Implementation - Phases 2, 3, 4

**Status**: Phase 1 Complete ✅ | Ready for Phase 2
**Last Updated**: November 2, 2025
**Document Purpose**: Complete planning guide for implementing full notification system across Care Collective platform

---

## 📊 Current State (Phase 1 Complete)

### ✅ What's Working Now:
- **Unread Message Counters**: Display actual counts from database (not hardcoded `0`)
- **V1 Tables**: Using `messages` table with full read tracking (`read_at` column)
- **Database Functions**:
  - `get_unread_message_count(user_uuid)` - Returns total unread count
  - `mark_messages_read(user_uuid, conversation_uuid)` - Marks conversation as read
- **API Endpoints**:
  - `PUT /api/messaging/conversations/[id]/messages?markAllRead=true`
  - `PUT /api/messaging/conversations/[id]/messages?messageId=uuid`
- **UI Displays**: Counters in PlatformLayout navigation, ConversationList badges, bell icon

### 📁 Files Modified in Phase 1:
- `app/messages/page.tsx` - Uses V1 unread count queries
- `app/api/messaging/conversations/[id]/messages/route.ts` - Mark as read endpoints

### 🚧 Known Issues:
1. **V2 Migration Blocked**: Local database `supabase db reset` fails due to syntax error in `20251030_fix_v2_security_definer_auth.sql`
2. **V2 Tables Missing Read Tracking**: `conversations_v2` and `messages_v2` don't exist in local DB
3. **Migration Ready**: `20251102000005_add_v2_read_tracking.sql` created but not applied

---

## 🎯 Phase 2: In-App Notification System

**Goal**: Build notification center with history, bell dropdown, and multi-event support
**Estimated Time**: 8-10 hours
**Priority**: HIGH - Core notification infrastructure

### 2.1: Database Schema (1-2 hours)

**Migration File**: `supabase/migrations/20251102000006_create_notifications_system.sql`

#### Tables to Create:

```sql
-- Main notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Notification type
  type TEXT NOT NULL CHECK (type IN (
    'new_message',
    'help_request_offer',
    'help_request_accepted',
    'help_request_completed',
    'help_request_cancelled',
    'system_announcement'
  )),

  -- Content
  title TEXT NOT NULL CHECK (length(title) <= 100),
  body TEXT NOT NULL CHECK (length(body) <= 500),
  link TEXT, -- Deep link to relevant page (e.g., '/messages/conv-id')

  -- Status
  read_at TIMESTAMPTZ DEFAULT NULL,

  -- Metadata (flexible JSON for event-specific data)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Optional expiration

  -- Indexes for performance
  CONSTRAINT notifications_title_length CHECK (length(trim(title)) > 0),
  CONSTRAINT notifications_body_length CHECK (length(trim(body)) > 0)
);

-- Performance indexes
CREATE INDEX idx_notifications_user_unread
  ON notifications(user_id, read_at)
  WHERE read_at IS NULL;

CREATE INDEX idx_notifications_user_created
  ON notifications(user_id, created_at DESC);

CREATE INDEX idx_notifications_type
  ON notifications(type);

CREATE INDEX idx_notifications_expires
  ON notifications(expires_at)
  WHERE expires_at IS NOT NULL;

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_update_own_notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Only system can create notifications (via service role)
CREATE POLICY "service_role_insert_notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

#### Functions to Create:

```sql
-- Get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM notifications
  WHERE user_id = user_uuid
    AND read_at IS NULL
    AND (expires_at IS NULL OR expires_at > NOW());

  RETURN COALESCE(unread_count, 0);
END;
$$;

-- Mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE notifications
  SET read_at = NOW()
  WHERE id = notification_uuid
    AND user_id = auth.uid()
    AND read_at IS NULL;

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$;

-- Mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  -- Verify caller is the user
  IF user_uuid != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE notifications
  SET read_at = NOW()
  WHERE user_id = user_uuid
    AND read_at IS NULL
    AND (expires_at IS NULL OR expires_at > NOW());

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated;
END;
$$;

-- Cleanup expired notifications (run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_deleted INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE expires_at < NOW();

  GET DIAGNOSTICS rows_deleted = ROW_COUNT;
  RETURN rows_deleted;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_unread_notification_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read(UUID) TO authenticated;
```

#### Update Preferences Table:

```sql
-- Add notification event preferences
ALTER TABLE messaging_preferences
ADD COLUMN IF NOT EXISTS notification_types JSONB DEFAULT '{
  "new_message": true,
  "help_request_offer": true,
  "help_request_accepted": true,
  "help_request_completed": true,
  "help_request_cancelled": true,
  "system_announcement": true
}'::jsonb;
```

### 2.2: NotificationService Class (2 hours)

**File**: `lib/notifications/service.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
export const NotificationTypeSchema = z.enum([
  'new_message',
  'help_request_offer',
  'help_request_accepted',
  'help_request_completed',
  'help_request_cancelled',
  'system_announcement'
]);

export const CreateNotificationSchema = z.object({
  user_id: z.string().uuid(),
  type: NotificationTypeSchema,
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  link: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  expires_at: z.string().datetime().optional()
});

export type NotificationType = z.infer<typeof NotificationTypeSchema>;
export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>;

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  read_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  expires_at?: string;
}

export class NotificationService {
  /**
   * Create a new notification for a user
   */
  static async createNotification(
    input: CreateNotificationInput
  ): Promise<{ success: boolean; notification_id?: string; error?: string }> {
    try {
      const validated = CreateNotificationSchema.parse(input);

      const supabase = await createClient();

      // Check user preferences - don't create if disabled
      const { data: prefs } = await supabase
        .from('messaging_preferences')
        .select('notification_types')
        .eq('user_id', validated.user_id)
        .single();

      if (prefs?.notification_types?.[validated.type] === false) {
        return { success: false, error: 'User has disabled this notification type' };
      }

      // Create notification
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: validated.user_id,
          type: validated.type,
          title: validated.title,
          body: validated.body,
          link: validated.link,
          metadata: validated.metadata || {},
          expires_at: validated.expires_at
        })
        .select('id')
        .single();

      if (error) {
        console.error('[NotificationService] Create error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, notification_id: data.id };
    } catch (error) {
      console.error('[NotificationService] Unexpected error:', error);
      return { success: false, error: 'Failed to create notification' };
    }
  }

  /**
   * Get paginated notifications for a user
   */
  static async getNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      types?: NotificationType[];
    } = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    const { limit = 20, offset = 0, unreadOnly = false, types } = options;

    const supabase = await createClient();

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.is('read_at', null);
    }

    if (types && types.length > 0) {
      query = query.in('type', types);
    }

    // Exclude expired
    query = query.or('expires_at.is.null,expires_at.gt.now()');

    const { data, error, count } = await query;

    if (error) {
      console.error('[NotificationService] Get error:', error);
      return { notifications: [], total: 0 };
    }

    return {
      notifications: (data as Notification[]) || [],
      total: count || 0
    };
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .rpc('get_unread_notification_count', { user_uuid: userId });

    if (error) {
      console.error('[NotificationService] Unread count error:', error);
      return 0;
    }

    return data || 0;
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .rpc('mark_notification_read', { notification_uuid: notificationId });

    if (error) {
      console.error('[NotificationService] Mark read error:', error);
      return false;
    }

    return data || false;
  }

  /**
   * Mark all notifications as read for user
   */
  static async markAllAsRead(userId: string): Promise<number> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .rpc('mark_all_notifications_read', { user_uuid: userId });

    if (error) {
      console.error('[NotificationService] Mark all read error:', error);
      return 0;
    }

    return data || 0;
  }

  /**
   * Delete old notifications (cleanup)
   */
  static async deleteNotifications(notificationIds: string[]): Promise<number> {
    const supabase = await createClient();

    const { error, count } = await supabase
      .from('notifications')
      .delete({ count: 'exact' })
      .in('id', notificationIds);

    if (error) {
      console.error('[NotificationService] Delete error:', error);
      return 0;
    }

    return count || 0;
  }
}
```

### 2.3: Event Triggers (2 hours)

**File**: `lib/notifications/triggers.ts`

```typescript
import { NotificationService } from './service';
import { createClient } from '@/lib/supabase/server';

/**
 * Trigger notifications for messaging events
 */
export class NotificationTriggers {
  /**
   * When a new message is sent, notify the recipient
   */
  static async onNewMessage(messageData: {
    sender_id: string;
    recipient_id: string;
    conversation_id: string;
    content: string;
  }) {
    try {
      // Get sender name
      const supabase = await createClient();
      const { data: sender } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', messageData.sender_id)
        .single();

      const senderName = sender?.name || 'Someone';

      // Create notification
      await NotificationService.createNotification({
        user_id: messageData.recipient_id,
        type: 'new_message',
        title: `New message from ${senderName}`,
        body: messageData.content.substring(0, 100) + (messageData.content.length > 100 ? '...' : ''),
        link: `/messages?conversation=${messageData.conversation_id}`,
        metadata: {
          sender_id: messageData.sender_id,
          conversation_id: messageData.conversation_id
        }
      });
    } catch (error) {
      console.error('[NotificationTriggers] New message error:', error);
    }
  }

  /**
   * When someone offers to help on a request
   */
  static async onHelpRequestOffer(offerData: {
    help_request_id: string;
    helper_id: string;
    requester_id: string;
    initial_message: string;
  }) {
    try {
      const supabase = await createClient();

      // Get helper name and request title
      const [helperData, requestData] = await Promise.all([
        supabase.from('profiles').select('name').eq('id', offerData.helper_id).single(),
        supabase.from('help_requests').select('title').eq('id', offerData.help_request_id).single()
      ]);

      const helperName = helperData.data?.name || 'Someone';
      const requestTitle = requestData.data?.title || 'your request';

      await NotificationService.createNotification({
        user_id: offerData.requester_id,
        type: 'help_request_offer',
        title: `${helperName} wants to help`,
        body: `Offered to help with "${requestTitle}"`,
        link: `/requests/${offerData.help_request_id}`,
        metadata: {
          helper_id: offerData.helper_id,
          help_request_id: offerData.help_request_id
        }
      });
    } catch (error) {
      console.error('[NotificationTriggers] Help offer error:', error);
    }
  }

  /**
   * When a help offer is accepted
   */
  static async onOfferAccepted(acceptData: {
    help_request_id: string;
    helper_id: string;
    requester_id: string;
  }) {
    try {
      const supabase = await createClient();
      const { data: requestData } = await supabase
        .from('help_requests')
        .select('title')
        .eq('id', acceptData.help_request_id)
        .single();

      const requestTitle = requestData?.title || 'a help request';

      await NotificationService.createNotification({
        user_id: acceptData.helper_id,
        type: 'help_request_accepted',
        title: 'Your help offer was accepted!',
        body: `Your offer to help with "${requestTitle}" was accepted`,
        link: `/requests/${acceptData.help_request_id}`,
        metadata: {
          help_request_id: acceptData.help_request_id,
          requester_id: acceptData.requester_id
        }
      });
    } catch (error) {
      console.error('[NotificationTriggers] Offer accepted error:', error);
    }
  }

  /**
   * When a help request is completed
   */
  static async onHelpRequestCompleted(completionData: {
    help_request_id: string;
    helper_id: string;
    requester_id: string;
  }) {
    try {
      const supabase = await createClient();
      const { data: requestData } = await supabase
        .from('help_requests')
        .select('title')
        .eq('id', completionData.help_request_id)
        .single();

      const requestTitle = requestData?.title || 'Help request';

      // Notify both parties
      await Promise.all([
        // Notify helper
        NotificationService.createNotification({
          user_id: completionData.helper_id,
          type: 'help_request_completed',
          title: 'Help request completed',
          body: `"${requestTitle}" has been marked as completed`,
          link: `/requests/${completionData.help_request_id}`,
          metadata: { help_request_id: completionData.help_request_id }
        }),
        // Notify requester
        NotificationService.createNotification({
          user_id: completionData.requester_id,
          type: 'help_request_completed',
          title: 'Your request is complete',
          body: `"${requestTitle}" has been marked as completed`,
          link: `/requests/${completionData.help_request_id}`,
          metadata: { help_request_id: completionData.help_request_id }
        })
      ]);
    } catch (error) {
      console.error('[NotificationTriggers] Completion error:', error);
    }
  }

  /**
   * System announcements (admin-created)
   */
  static async createAnnouncement(announcementData: {
    user_ids?: string[]; // If null, send to all users
    title: string;
    body: string;
    link?: string;
    expires_at?: string;
  }) {
    try {
      let targetUserIds = announcementData.user_ids;

      // If no user_ids specified, send to all active users
      if (!targetUserIds || targetUserIds.length === 0) {
        const supabase = await createClient();
        const { data: users } = await supabase
          .from('profiles')
          .select('id')
          .eq('verification_status', 'approved');

        targetUserIds = users?.map(u => u.id) || [];
      }

      // Create notification for each user
      await Promise.all(
        targetUserIds.map(userId =>
          NotificationService.createNotification({
            user_id: userId,
            type: 'system_announcement',
            title: announcementData.title,
            body: announcementData.body,
            link: announcementData.link,
            expires_at: announcementData.expires_at,
            metadata: { announcement: true }
          })
        )
      );
    } catch (error) {
      console.error('[NotificationTriggers] Announcement error:', error);
    }
  }
}
```

### 2.4: UI Components (3 hours)

#### NotificationDropdown Component
**File**: `components/notifications/NotificationDropdown.tsx`

```typescript
'use client';

import { ReactElement, useState, useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { NotificationItem } from './NotificationItem';
import { useNotifications } from '@/hooks/useNotifications';

export function NotificationDropdown(): ReactElement {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead
  } = useNotifications({ limit: 10 });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications (${unreadCount} unread)`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-2">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead()}
              className="h-auto p-1 text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <DropdownMenuSeparator />

        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={() => markAsRead(notification.id)}
              />
            ))}
          </div>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <a href="/notifications" className="w-full text-center text-sm text-sage cursor-pointer">
            View all notifications
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

#### NotificationItem Component
**File**: `components/notifications/NotificationItem.tsx`

```typescript
'use client';

import { ReactElement } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Package, CheckCircle, XCircle, Megaphone } from 'lucide-react';
import type { Notification } from '@/lib/notifications/service';

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: () => void;
}

const iconMap = {
  new_message: MessageCircle,
  help_request_offer: Package,
  help_request_accepted: CheckCircle,
  help_request_completed: CheckCircle,
  help_request_cancelled: XCircle,
  system_announcement: Megaphone
};

const colorMap = {
  new_message: 'text-blue-500',
  help_request_offer: 'text-green-500',
  help_request_accepted: 'text-emerald-500',
  help_request_completed: 'text-sage',
  help_request_cancelled: 'text-gray-500',
  system_announcement: 'text-purple-500'
};

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps): ReactElement {
  const Icon = iconMap[notification.type] || MessageCircle;
  const iconColor = colorMap[notification.type] || 'text-gray-500';
  const isUnread = !notification.read_at;

  const handleClick = () => {
    if (isUnread) {
      onMarkRead();
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
        isUnread ? 'bg-blue-50/50' : ''
      }`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      <div className="flex gap-3">
        <div className={`flex-shrink-0 mt-1 ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`text-sm font-medium ${isUnread ? 'font-semibold' : ''}`}>
              {notification.title}
            </h4>
            {isUnread && (
              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5" aria-label="Unread" />
            )}
          </div>

          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
            {notification.body}
          </p>

          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );
}
```

### 2.5: useNotifications Hook (1 hour)

**File**: `hooks/useNotifications.ts`

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Notification } from '@/lib/notifications/service';

interface UseNotificationsOptions {
  limit?: number;
  unreadOnly?: boolean;
  autoRefresh?: boolean;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { limit = 20, unreadOnly = false, autoRefresh = true } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get notifications
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (unreadOnly) {
        query = query.is('read_at', null);
      }

      query = query.or('expires_at.is.null,expires_at.gt.now()');

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setNotifications((data as Notification[]) || []);

      // Get unread count
      const { data: countData, error: countError } = await supabase
        .rpc('get_unread_notification_count', { user_uuid: user.id });

      if (!countError) {
        setUnreadCount(countData || 0);
      }
    } catch (err) {
      console.error('[useNotifications] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [supabase, limit, unreadOnly]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .rpc('mark_notification_read', { notification_uuid: notificationId });

      if (!error) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('[useNotifications] Mark read error:', err);
    }
  }, [supabase]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .rpc('mark_all_notifications_read', { user_uuid: user.id });

      if (!error) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('[useNotifications] Mark all read error:', err);
    }
  }, [supabase]);

  // Real-time subscription
  useEffect(() => {
    if (!autoRefresh) return;

    const { data: { user } } = supabase.auth.getUser();
    user.then(userData => {
      if (!userData.user) return;

      const channel = supabase
        .channel(`notifications:${userData.user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userData.user.id}`
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            setNotifications(prev => [newNotification, ...prev].slice(0, limit));
            setUnreadCount(prev => prev + 1);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userData.user.id}`
          },
          (payload) => {
            const updated = payload.new as Notification;
            setNotifications(prev =>
              prev.map(n => (n.id === updated.id ? updated : n))
            );
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    });
  }, [supabase, limit, autoRefresh]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications
  };
}
```

### 2.6: Update PlatformLayout (30 min)

**File**: `components/layout/PlatformLayout.tsx`

Add NotificationDropdown to the header:

```typescript
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';

// In the header section, replace the simple bell icon with:
<NotificationDropdown />
```

### 2.7: Notification Preferences UI (1 hour)

**File**: `app/settings/notifications/page.tsx`

```typescript
// Create settings page for managing notification preferences
// - Toggle individual notification types
// - Quiet hours
// - Email/push preferences
```

---

## 🎯 Phase 3: Email Notification Infrastructure

**Goal**: Send emails for auth flows and notification events
**Estimated Time**: 10-12 hours
**Priority**: MEDIUM - User engagement & retention

### 3.1: Email Service Integration (2 hours)

**Provider**: Resend (recommended for Next.js)

```bash
npm install resend @react-email/components
```

**File**: `lib/email/service.ts`

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService {
  static async send(params: {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }) {
    const { data, error } = await resend.emails.send({
      from: params.from || 'Care Collective <noreply@care-collective.org>',
      to: params.to,
      subject: params.subject,
      html: params.html
    });

    if (error) {
      console.error('[EmailService] Send error:', error);
      throw error;
    }

    return data;
  }
}
```

### 3.2: Email Templates (3 hours)

Create React Email templates:
- `WelcomeEmail.tsx` - Account signup
- `PasswordResetEmail.tsx` - Password reset
- `NewMessageEmail.tsx` - New message notification
- `HelpRequestOfferEmail.tsx` - Offer received
- `DigestEmail.tsx` - Daily/weekly summary

### 3.3: Auth Flow Integration (2 hours)

Update signup/password reset to send emails.

### 3.4: Email Dispatcher (2 hours)

**File**: `lib/notifications/email-dispatcher.ts`

Integrate with NotificationService to send emails when notifications are created.

### 3.5: Preferences & Unsubscribe (1 hour)

Create unsubscribe tokens and handler.

---

## 🎯 Phase 4: Browser Push Notifications

**Goal**: Native browser notifications when app is closed
**Estimated Time**: 6-8 hours
**Priority**: LOW - Nice to have

### 4.1: Service Worker Updates (2 hours)

Add push event handlers to `public/sw.js`.

### 4.2: Push Subscription Management (2 hours)

Create `push_subscriptions` table and management API.

### 4.3: Push Prompt Component (1 hour)

Smart permission request UI.

### 4.4: Server Push Sending (2 hours)

Implement `web-push` library for sending.

### 4.5: Integration (1 hour)

Connect to NotificationService.

---

## 📋 Implementation Checklist

### Before Starting:
- [ ] Review Phase 1 implementation
- [ ] Ensure local database is working (`supabase db reset` succeeds)
- [ ] Fix V2 migration syntax errors if needed
- [ ] Create feature branch for Phase 2

### Phase 2 Tasks:
- [ ] Create and apply database migration
- [ ] Build NotificationService class
- [ ] Implement event triggers
- [ ] Create UI components (NotificationDropdown, NotificationItem)
- [ ] Build useNotifications hook
- [ ] Update PlatformLayout
- [ ] Create notification preferences page
- [ ] Test notification creation and display
- [ ] Test real-time updates
- [ ] Test mark as read functionality
- [ ] Verify accessibility (WCAG 2.1 AA)
- [ ] Write unit tests (80% coverage)
- [ ] Commit and deploy

### Phase 3 Tasks:
- [ ] Sign up for Resend account
- [ ] Add RESEND_API_KEY to environment
- [ ] Create EmailService class
- [ ] Build React Email templates
- [ ] Integrate with auth flows
- [ ] Create EmailDispatcher
- [ ] Implement unsubscribe functionality
- [ ] Test email sending
- [ ] Commit and deploy

### Phase 4 Tasks:
- [ ] Update service worker
- [ ] Generate VAPID keys
- [ ] Create push_subscriptions table
- [ ] Build PushNotificationService
- [ ] Create permission prompt UI
- [ ] Implement server-side push sending
- [ ] Test on multiple browsers
- [ ] Commit and deploy

---

## 🚀 Quick Start for Next Session

```bash
# 1. Pull latest changes
git pull origin main

# 2. Start Supabase
supabase start

# 3. Apply Phase 2 migration
supabase db reset  # If this fails, fix migration errors first

# 4. Create Phase 2 branch
git checkout -b feature/notification-system-phase-2

# 5. Start coding!
# Begin with: supabase/migrations/20251102000006_create_notifications_system.sql
```

---

## 📊 Success Metrics

### Phase 2:
- ✅ Notification bell shows accurate unread count
- ✅ Dropdown displays last 10 notifications
- ✅ Real-time updates work (new notifications appear instantly)
- ✅ Mark as read updates counter immediately
- ✅ Notification history page loads paginated data
- ✅ Preferences control which events trigger notifications

### Phase 3:
- ✅ Welcome emails sent on signup
- ✅ Password reset emails work
- ✅ Message notifications sent via email (respecting preferences)
- ✅ Unsubscribe links work

### Phase 4:
- ✅ Browser push notifications work when tab closed
- ✅ Users can manage subscriptions
- ✅ Works on Chrome, Firefox, Edge, Safari

---

## 🛟 Troubleshooting

### Database Issues:
- **Migration fails**: Check syntax in `20251030_fix_v2_security_definer_auth.sql`
- **V2 tables missing**: Either fix V2 migrations or continue with V1 (current approach)

### Real-time Issues:
- **Notifications don't appear**: Check `ALTER PUBLICATION supabase_realtime ADD TABLE notifications`
- **Multiple updates**: Check for duplicate channel subscriptions

### Email Issues:
- **Emails not sending**: Verify RESEND_API_KEY in `.env.local`
- **Emails in spam**: Configure SPF/DKIM records

### Push Issues:
- **Permission denied**: Browser blocked - test in incognito
- **Subscription fails**: Check VAPID keys are correct

---

**Ready to implement? Start with Phase 2.1: Database Schema!**
