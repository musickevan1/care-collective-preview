import { describe, it, expect } from 'vitest';
import { groupMessages, addGroupingMetadata, shouldShowDateSeparator } from './message-grouping';
import type { MessageWithSender } from './types';

// Helper function to create test messages
function createMessage(
  id: string,
  senderId: string,
  createdAt: string,
  messageType: 'text' | 'system' | 'help_request_update' = 'text'
): MessageWithSender {
  return {
    id,
    conversation_id: 'conv1',
    sender_id: senderId,
    recipient_id: 'user-recipient',
    content: `Message ${id}`,
    message_type: messageType,
    status: 'sent',
    is_flagged: false,
    created_at: createdAt,
    updated_at: createdAt,
    sender: {
      id: senderId,
      name: `User ${senderId}`,
      location: 'Test City',
    },
    recipient: {
      id: 'user-recipient',
      name: 'Recipient User',
    },
  };
}

describe('groupMessages', () => {
  it('groups consecutive messages from same sender within 5 minutes', () => {
    const messages: MessageWithSender[] = [
      createMessage('1', 'user1', '2026-01-13T10:00:00Z'),
      createMessage('2', 'user1', '2026-01-13T10:02:00Z'), // 2 minutes later
      createMessage('3', 'user1', '2026-01-13T10:04:00Z'), // 4 minutes from first
    ];

    const groups = groupMessages(messages, 5);

    expect(groups).toHaveLength(1); // All in one group
    expect(groups[0].messages).toHaveLength(3);
    expect(groups[0].senderId).toBe('user1');
  });

  it('creates new group when time window exceeded', () => {
    const messages: MessageWithSender[] = [
      createMessage('1', 'user1', '2026-01-13T10:00:00Z'),
      createMessage('2', 'user1', '2026-01-13T10:06:00Z'), // 6 minutes later (exceeds 5-minute window)
    ];

    const groups = groupMessages(messages, 5);

    expect(groups).toHaveLength(2); // Two separate groups
    expect(groups[0].messages).toHaveLength(1);
    expect(groups[1].messages).toHaveLength(1);
  });

  it('creates new group when sender changes', () => {
    const messages: MessageWithSender[] = [
      createMessage('1', 'user1', '2026-01-13T10:00:00Z'),
      createMessage('2', 'user2', '2026-01-13T10:01:00Z'), // Different sender
    ];

    const groups = groupMessages(messages, 5);

    expect(groups).toHaveLength(2);
    expect(groups[0].senderId).toBe('user1');
    expect(groups[1].senderId).toBe('user2');
  });

  it('does not group system messages', () => {
    const messages: MessageWithSender[] = [
      createMessage('1', 'system', '2026-01-13T10:00:00Z', 'system'),
      createMessage('2', 'system', '2026-01-13T10:01:00Z', 'system'),
    ];

    const groups = groupMessages(messages, 5);

    expect(groups).toHaveLength(2); // System messages always separate
    expect(groups[0].messages).toHaveLength(1);
    expect(groups[1].messages).toHaveLength(1);
  });

  it('handles empty message array', () => {
    const groups = groupMessages([], 5);
    expect(groups).toHaveLength(0);
  });

  it('handles single message', () => {
    const messages = [createMessage('1', 'user1', '2026-01-13T10:00:00Z')];
    const groups = groupMessages(messages, 5);

    expect(groups).toHaveLength(1);
    expect(groups[0].messages).toHaveLength(1);
  });

  it('groups multiple senders correctly', () => {
    const messages: MessageWithSender[] = [
      createMessage('1', 'user1', '2026-01-13T10:00:00Z'),
      createMessage('2', 'user1', '2026-01-13T10:01:00Z'),
      createMessage('3', 'user2', '2026-01-13T10:02:00Z'),
      createMessage('4', 'user2', '2026-01-13T10:03:00Z'),
      createMessage('5', 'user1', '2026-01-13T10:04:00Z'),
    ];

    const groups = groupMessages(messages, 5);

    expect(groups).toHaveLength(3);
    expect(groups[0].senderId).toBe('user1');
    expect(groups[0].messages).toHaveLength(2);
    expect(groups[1].senderId).toBe('user2');
    expect(groups[1].messages).toHaveLength(2);
    expect(groups[2].senderId).toBe('user1');
    expect(groups[2].messages).toHaveLength(1);
  });
});

describe('addGroupingMetadata', () => {
  it('marks first and last messages in group', () => {
    const messages: MessageWithSender[] = [
      createMessage('1', 'user1', '2026-01-13T10:00:00Z'),
      createMessage('2', 'user1', '2026-01-13T10:01:00Z'),
      createMessage('3', 'user1', '2026-01-13T10:02:00Z'),
    ];

    const result = addGroupingMetadata(messages, 5);

    expect(result[0].isFirstInGroup).toBe(true);
    expect(result[0].isLastInGroup).toBe(false);

    expect(result[1].isFirstInGroup).toBe(false);
    expect(result[1].isLastInGroup).toBe(false);

    expect(result[2].isFirstInGroup).toBe(false);
    expect(result[2].isLastInGroup).toBe(true);
  });

  it('marks single message as both first and last', () => {
    const messages = [createMessage('1', 'user1', '2026-01-13T10:00:00Z')];
    const result = addGroupingMetadata(messages, 5);

    expect(result[0].isFirstInGroup).toBe(true);
    expect(result[0].isLastInGroup).toBe(true);
  });

  it('assigns group IDs correctly', () => {
    const messages: MessageWithSender[] = [
      createMessage('1', 'user1', '2026-01-13T10:00:00Z'),
      createMessage('2', 'user1', '2026-01-13T10:01:00Z'),
      createMessage('3', 'user2', '2026-01-13T10:02:00Z'),
    ];

    const result = addGroupingMetadata(messages, 5);

    expect(result[0].groupId).toBe('group-1');
    expect(result[1].groupId).toBe('group-1');
    expect(result[2].groupId).toBe('group-3');
  });

  it('handles empty array', () => {
    const result = addGroupingMetadata([], 5);
    expect(result).toHaveLength(0);
  });
});

describe('shouldShowDateSeparator', () => {
  it('shows separator for first message', () => {
    const message = createMessage('1', 'user1', '2026-01-13T10:00:00Z');
    expect(shouldShowDateSeparator(message, undefined)).toBe(true);
  });

  it('shows separator when date changes', () => {
    const message1 = createMessage('1', 'user1', '2026-01-13T23:59:00Z');
    const message2 = createMessage('2', 'user1', '2026-01-14T00:01:00Z'); // Next day

    expect(shouldShowDateSeparator(message2, message1)).toBe(true);
  });

  it('does not show separator for same day', () => {
    const message1 = createMessage('1', 'user1', '2026-01-13T10:00:00Z');
    const message2 = createMessage('2', 'user1', '2026-01-13T15:00:00Z'); // Same day, 5 hours later

    expect(shouldShowDateSeparator(message2, message1)).toBe(false);
  });

  it('shows separator when month changes', () => {
    const message1 = createMessage('1', 'user1', '2026-01-31T23:59:00Z');
    const message2 = createMessage('2', 'user1', '2026-02-01T00:01:00Z'); // Next month

    expect(shouldShowDateSeparator(message2, message1)).toBe(true);
  });

  it('shows separator when year changes', () => {
    const message1 = createMessage('1', 'user1', '2025-12-31T23:59:00Z');
    const message2 = createMessage('2', 'user1', '2026-01-01T00:01:00Z'); // Next year

    expect(shouldShowDateSeparator(message2, message1)).toBe(true);
  });
});
