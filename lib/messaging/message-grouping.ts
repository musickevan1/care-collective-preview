/**
 * Message Grouping Utility
 *
 * Groups consecutive messages from the same sender within a time window.
 * Based on industry patterns from iOS Messages, Telegram, and WhatsApp.
 */

import { differenceInMinutes } from 'date-fns';
import type { MessageWithSender } from './types';

/**
 * Represents a group of messages from the same sender
 */
export interface MessageGroup {
  id: string;
  senderId: string;
  messages: MessageWithSender[];
  firstMessageTime: Date;
  lastMessageTime: Date;
}

/**
 * Extended message type with grouping metadata
 */
export interface MessageWithGrouping extends MessageWithSender {
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  groupId: string;
}

/**
 * Groups messages by sender and time window
 *
 * @param messages - Array of messages to group (sorted by created_at ascending)
 * @param timeWindowMinutes - Maximum time gap between messages in same group (default: 5)
 * @returns Array of message groups
 *
 * @example
 * const messages = await getConversationMessages(conversationId);
 * const groups = groupMessages(messages, 5);
 */
export function groupMessages(
  messages: MessageWithSender[],
  timeWindowMinutes: number = 5
): MessageGroup[] {
  if (!messages || messages.length === 0) {
    return [];
  }

  const groups: MessageGroup[] = [];
  let currentGroup: MessageGroup | null = null;

  for (const message of messages) {
    // Skip system messages (they're not grouped)
    if (message.message_type === 'system') {
      // Finalize current group if exists
      if (currentGroup) {
        groups.push(currentGroup);
        currentGroup = null;
      }

      // Create single-message group for system message
      groups.push({
        id: `group-${message.id}`,
        senderId: message.sender_id,
        messages: [message],
        firstMessageTime: new Date(message.created_at),
        lastMessageTime: new Date(message.created_at),
      });

      continue;
    }

    const messageTime = new Date(message.created_at);

    // Check if message belongs to current group
    const belongsToGroup =
      currentGroup &&
      currentGroup.senderId === message.sender_id &&
      differenceInMinutes(messageTime, currentGroup.lastMessageTime) <= timeWindowMinutes;

    if (belongsToGroup && currentGroup) {
      // Add to existing group
      currentGroup.messages.push(message);
      currentGroup.lastMessageTime = messageTime;
    } else {
      // Finalize previous group
      if (currentGroup) {
        groups.push(currentGroup);
      }

      // Start new group
      currentGroup = {
        id: `group-${message.id}`,
        senderId: message.sender_id,
        messages: [message],
        firstMessageTime: messageTime,
        lastMessageTime: messageTime,
      };
    }
  }

  // Add final group
  if (currentGroup) {
    groups.push(currentGroup);
  }

  return groups;
}

/**
 * Adds grouping metadata to messages
 *
 * @param messages - Array of messages to annotate
 * @param timeWindowMinutes - Time window for grouping (default: 5)
 * @returns Array of messages with grouping flags
 *
 * @example
 * const messagesWithGrouping = addGroupingMetadata(messages);
 * messagesWithGrouping.forEach(msg => {
 *   console.log(msg.isFirstInGroup, msg.isLastInGroup);
 * });
 */
export function addGroupingMetadata(
  messages: MessageWithSender[],
  timeWindowMinutes: number = 5
): MessageWithGrouping[] {
  const groups = groupMessages(messages, timeWindowMinutes);
  const messagesWithGrouping: MessageWithGrouping[] = [];

  for (const group of groups) {
    group.messages.forEach((message, index) => {
      messagesWithGrouping.push({
        ...message,
        isFirstInGroup: index === 0,
        isLastInGroup: index === group.messages.length - 1,
        groupId: group.id,
      });
    });
  }

  return messagesWithGrouping;
}

/**
 * Determines if a date separator should be shown between two messages
 *
 * @param currentMessage - The current message
 * @param previousMessage - The previous message (or undefined if first)
 * @returns true if date separator should be shown
 */
export function shouldShowDateSeparator(
  currentMessage: MessageWithSender,
  previousMessage?: MessageWithSender
): boolean {
  if (!previousMessage) {
    return true; // Always show date for first message
  }

  const currentDate = new Date(currentMessage.created_at);
  const previousDate = new Date(previousMessage.created_at);

  // Check if dates are different days
  return (
    currentDate.getFullYear() !== previousDate.getFullYear() ||
    currentDate.getMonth() !== previousDate.getMonth() ||
    currentDate.getDate() !== previousDate.getDate()
  );
}
