/**
 * NotificationItem Component
 * Displays individual notification with type-specific icons and styling
 */

'use client';

import { ReactElement } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  MessageCircle,
  HandHeart,
  CheckCircle2,
  XCircle,
  Megaphone,
  Bell,
} from 'lucide-react';
import type { Notification, NotificationType } from '@/lib/notifications';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
  onClick?: (notification: Notification) => void;
}

/**
 * Get icon and color for notification type
 */
function getNotificationStyle(type: NotificationType): {
  Icon: typeof Bell;
  colorClass: string;
  bgColorClass: string;
} {
  switch (type) {
    case 'new_message':
      return {
        Icon: MessageCircle,
        colorClass: 'text-blue-600',
        bgColorClass: 'bg-blue-50',
      };
    case 'help_request_offer':
      return {
        Icon: HandHeart,
        colorClass: 'text-[var(--sage)]',
        bgColorClass: 'bg-green-50',
      };
    case 'help_request_accepted':
      return {
        Icon: CheckCircle2,
        colorClass: 'text-green-600',
        bgColorClass: 'bg-green-50',
      };
    case 'help_request_completed':
      return {
        Icon: CheckCircle2,
        colorClass: 'text-[var(--primary)]',
        bgColorClass: 'bg-orange-50',
      };
    case 'help_request_cancelled':
      return {
        Icon: XCircle,
        colorClass: 'text-red-600',
        bgColorClass: 'bg-red-50',
      };
    case 'system_announcement':
      return {
        Icon: Megaphone,
        colorClass: 'text-purple-600',
        bgColorClass: 'bg-purple-50',
      };
    default:
      return {
        Icon: Bell,
        colorClass: 'text-gray-600',
        bgColorClass: 'bg-gray-50',
      };
  }
}

/**
 * NotificationItem Component
 */
export function NotificationItem({
  notification,
  onClick,
}: NotificationItemProps): ReactElement {
  const { Icon, colorClass, bgColorClass } = getNotificationStyle(notification.type);
  const isUnread = !notification.read_at;

  const handleClick = () => {
    onClick?.(notification);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-all cursor-pointer',
        'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--sage)]',
        isUnread ? 'bg-blue-50/30' : 'bg-white'
      )}
      aria-label={`Notification: ${notification.title}. ${isUnread ? 'Unread' : 'Read'}`}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
          bgColorClass
        )}
        aria-hidden="true"
      >
        <Icon className={cn('w-5 h-5', colorClass)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title */}
        <div className="flex items-start justify-between gap-2">
          <h4
            className={cn(
              'text-sm leading-tight',
              isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
            )}
          >
            {notification.title}
            {isUnread && (
              <span className="ml-2 inline-block w-2 h-2 bg-blue-600 rounded-full" aria-label="Unread" />
            )}
          </h4>
          <time
            className="text-xs text-gray-500 flex-shrink-0"
            dateTime={notification.created_at ?? undefined}
          >
            {formatDistanceToNow(new Date(notification.created_at ?? Date.now()), {
              addSuffix: true,
            })}
          </time>
        </div>

        {/* Content */}
        {notification.content && (
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {notification.content}
          </p>
        )}
      </div>
    </div>
  );
}
