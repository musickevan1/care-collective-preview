/**
 * NotificationDropdown Component
 * Bell icon with dropdown panel showing notifications
 */

'use client';

import { ReactElement, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import type { Notification } from '@/lib/notifications';
import { cn } from '@/lib/utils';

interface NotificationDropdownProps {
  className?: string;
}

/**
 * NotificationDropdown Component
 */
export function NotificationDropdown({
  className,
}: NotificationDropdownProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    hasMore,
    fetchMore,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read_at) {
      await markAsRead(notification.id);
    }

    // Navigate to action URL if available
    if (notification.action_url) {
      router.push(notification.action_url);
      setIsOpen(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleLoadMore = async () => {
    await fetchMore();
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={handleToggle}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--sage)]',
          isOpen && 'bg-gray-100'
        )}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-600 rounded-full"
            aria-label={`${unreadCount} unread notifications`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className={cn(
            'absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)]',
            'bg-white rounded-lg shadow-lg border border-gray-200',
            'z-50 overflow-hidden'
          )}
          role="dialog"
          aria-label="Notifications panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 text-sm font-medium',
                  'text-[var(--sage)] hover:text-[var(--sage)]/80',
                  'hover:bg-gray-50 rounded-md transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--sage)]'
                )}
                aria-label="Mark all as read"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-[32rem] overflow-y-auto">
            {/* Loading State */}
            {isLoading && notifications.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[var(--sage)] animate-spin" />
                <span className="sr-only">Loading notifications...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && notifications.length === 0 && (
              <div className="px-4 py-12 text-center">
                <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-900 mb-1">No notifications</p>
                <p className="text-sm text-gray-500">
                  You&apos;re all caught up! Check back later for updates.
                </p>
              </div>
            )}

            {/* Notification List */}
            {!isLoading && !error && notifications.length > 0 && (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={handleNotificationClick}
                  />
                ))}

                {/* Load More */}
                {hasMore && (
                  <div className="px-4 py-3">
                    <button
                      onClick={handleLoadMore}
                      className={cn(
                        'w-full py-2 text-sm font-medium text-[var(--sage)]',
                        'hover:text-[var(--sage)]/80 transition-colors',
                        'focus:outline-none focus:ring-2 focus:ring-[var(--sage)] rounded-md'
                      )}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading...
                        </span>
                      ) : (
                        'Load more'
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
