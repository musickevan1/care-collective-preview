/**
 * Timestamp Formatting Utilities
 *
 * Provides hybrid relative/absolute timestamp formatting for messaging UI.
 * Based on patterns from iOS Messages, Telegram, and WhatsApp.
 *
 * @module relative-time
 */

import {
  differenceInMinutes,
  differenceInHours,
  format,
  isToday,
  isYesterday,
  isSameYear,
} from 'date-fns';

/**
 * Formats a message timestamp using hybrid relative/absolute strategy
 *
 * Format rules:
 * - < 1 min: "Just now"
 * - < 1 hour: "Xm ago"
 * - < 12 hours (today): "Xh ago"
 * - > 12 hours (today): "3:45 PM"
 * - Yesterday: "Yesterday at 3:45 PM"
 * - This week: "Mon at 3:45 PM"
 * - This year: "Jan 12 at 3:45 PM"
 * - Past years: "Jan 12, 2025"
 *
 * @param date - The timestamp to format
 * @returns Formatted timestamp string
 *
 * @example
 * formatMessageTimestamp(new Date()) // "Just now"
 * formatMessageTimestamp(subMinutes(new Date(), 5)) // "5m ago"
 * formatMessageTimestamp(subHours(new Date(), 3)) // "3h ago"
 * formatMessageTimestamp(subDays(new Date(), 1)) // "Yesterday at 3:45 PM"
 */
export function formatMessageTimestamp(date: Date | string): string {
  const messageDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  // Validate date
  if (isNaN(messageDate.getTime())) {
    return 'Invalid date';
  }

  const diffMinutes = differenceInMinutes(now, messageDate);

  // Real-time (< 1 minute)
  if (diffMinutes < 1) {
    return 'Just now';
  }

  // Recent (< 1 hour) - show minutes
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = differenceInHours(now, messageDate);

  // Today - show hours if < 12 hours, otherwise show time
  if (isToday(messageDate)) {
    if (diffHours < 12) {
      return `${diffHours}h ago`;
    }
    return format(messageDate, 'h:mm a'); // "3:45 PM"
  }

  // Yesterday
  if (isYesterday(messageDate)) {
    return `Yesterday at ${format(messageDate, 'h:mm a')}`;
  }

  // This week (within 7 days from yesterday)
  const diffDays = Math.floor(diffMinutes / 1440); // Minutes to days
  if (diffDays < 7) {
    return format(messageDate, "EEE 'at' h:mm a"); // "Mon at 3:45 PM"
  }

  // This year
  if (isSameYear(now, messageDate)) {
    return format(messageDate, "MMM d 'at' h:mm a"); // "Jan 12 at 3:45 PM"
  }

  // Past years
  return format(messageDate, 'MMM d, yyyy'); // "Jan 12, 2025"
}

/**
 * Formats a date separator (shown between message groups on different days)
 *
 * Format rules:
 * - Today: "Today"
 * - Yesterday: "Yesterday"
 * - This week: "Monday"
 * - This year: "January 12"
 * - Past years: "January 12, 2025"
 *
 * @param date - The date to format
 * @returns Formatted date separator string
 *
 * @example
 * formatDateSeparator(new Date()) // "Today"
 * formatDateSeparator(subDays(new Date(), 1)) // "Yesterday"
 * formatDateSeparator(subDays(new Date(), 3)) // "Monday"
 * formatDateSeparator(subMonths(new Date(), 2)) // "November 12"
 */
export function formatDateSeparator(date: Date | string): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  // Validate date
  if (isNaN(targetDate.getTime())) {
    return 'Invalid date';
  }

  // Today
  if (isToday(targetDate)) {
    return 'Today';
  }

  // Yesterday
  if (isYesterday(targetDate)) {
    return 'Yesterday';
  }

  // This week (show day name)
  const diffDays = Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return format(targetDate, 'EEEE'); // "Monday"
  }

  // This year (show month and day)
  if (isSameYear(now, targetDate)) {
    return format(targetDate, 'MMMM d'); // "January 12"
  }

  // Past years (show full date)
  return format(targetDate, 'MMMM d, yyyy'); // "January 12, 2025"
}

/**
 * Formats a timestamp for accessibility (screen readers)
 * Always uses absolute format for clarity
 *
 * @param date - The timestamp to format
 * @returns Formatted timestamp for screen readers
 *
 * @example
 * formatTimestampForA11y(new Date()) // "Monday, January 13, 2026 at 3:45 PM"
 */
export function formatTimestampForA11y(date: Date | string): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(targetDate.getTime())) {
    return 'Invalid date';
  }

  return format(targetDate, "EEEE, MMMM d, yyyy 'at' h:mm a");
  // Example: "Monday, January 13, 2026 at 3:45 PM"
}
