/**
 * @fileoverview Tests for MessageBubble component
 * Tests message display, styling, and interaction features
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageBubble } from '@/components/messaging/MessageBubble';
import { MessageWithSender } from '@/lib/messaging/types';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

// Mock date functions
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '5 minutes ago'),
  format: vi.fn(() => 'Jan 7, 2025 at 2:30 PM'),
}));

describe('MessageBubble', () => {
  const mockMessage: MessageWithSender = {
    id: 'msg-123',
    conversation_id: 'conv-123',
    sender_id: 'user-456',
    recipient_id: 'user-789',
    content: 'Hello, this is a test message!',
    message_type: 'text',
    status: 'read',
    read_at: '2025-01-07T14:30:00Z',
    is_flagged: false,
    created_at: '2025-01-07T14:25:00Z',
    updated_at: '2025-01-07T14:30:00Z',
    sender: {
      id: 'user-456',
      name: 'Alice Johnson',
      location: 'Springfield, MO'
    },
    recipient: {
      id: 'user-789',
      name: 'Bob Smith',
      location: 'Joplin, MO'
    }
  };

  const mockOnReport = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Message Display', () => {
    it('displays message content correctly', () => {
      render(
        <MessageBubble
          message={mockMessage}
          isCurrentUser={false}
          onReport={mockOnReport}
        />
      );

      expect(screen.getByText('Hello, this is a test message!')).toBeInTheDocument();
    });

    it('shows sender name and location when showSenderName is true', () => {
      render(
        <MessageBubble
          message={mockMessage}
          isCurrentUser={false}
          showSenderName={true}
          onReport={mockOnReport}
        />
      );

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Springfield, MO')).toBeInTheDocument();
    });

    it('displays relative timestamp by default', () => {
      render(
        <MessageBubble
          message={mockMessage}
          isCurrentUser={false}
          onReport={mockOnReport}
        />
      );

      expect(screen.getByText('5 minutes ago')).toBeInTheDocument();
    });

    it('shows full timestamp when clicked', async () => {
      render(
        <MessageBubble
          message={mockMessage}
          isCurrentUser={false}
          onReport={mockOnReport}
        />
      );

      const timeButton = screen.getByText('5 minutes ago');
      await userEvent.click(timeButton);

      expect(screen.getByText('Jan 7, 2025 at 2:30 PM')).toBeInTheDocument();
    });
  });

  describe('Message Styling', () => {
    it('applies correct styling for own messages', () => {
      render(
        <MessageBubble
          message={mockMessage}
          isCurrentUser={true}
          onReport={mockOnReport}
        />
      );

      const messageContainer = screen.getByText('Hello, this is a test message!').closest('.message-bubble-sent, [class*=\"bg-sage\"]');
      expect(messageContainer).toBeInTheDocument();
    });

    it('applies correct styling for received messages', () => {
      render(
        <MessageBubble
          message={mockMessage}
          isCurrentUser={false}
          onReport={mockOnReport}
        />
      );

      const messageContainer = screen.getByText('Hello, this is a test message!').closest('[class*=\"bg-white\"]');
      expect(messageContainer).toBeInTheDocument();
    });

    it('shows correct message status icons for own messages', () => {
      const readMessage = {
        ...mockMessage,
        status: 'read' as const
      };

      render(
        <MessageBubble
          message={readMessage}
          isCurrentUser={true}
          onReport={mockOnReport}
        />
      );

      // Should show read status (double check mark)
      expect(document.querySelector('[title=\"Read\"]')).toBeInTheDocument();
    });
  });

  describe('Message Actions', () => {
    it('shows message actions menu on hover', async () => {
      render(
        <MessageBubble
          message={mockMessage}
          isCurrentUser={false}
          onReport={mockOnReport}
        />
      );

      const messageContainer = screen.getByText('Hello, this is a test message!').closest('div');
      
      // Trigger hover by finding the group element
      const groupElement = messageContainer?.closest('.group');
      if (groupElement) {
        fireEvent.mouseEnter(groupElement);
      }

      // Look for the more options button (should be visible on hover)
      await waitFor(() => {
        const moreButton = document.querySelector('[aria-haspopup=\"menu\"]');
        expect(moreButton).toBeInTheDocument();
      });
    });

    it('copies message content to clipboard', async () => {
      const user = userEvent.setup();
      
      render(
        <MessageBubble
          message={mockMessage}
          isCurrentUser={false}
          onReport={mockOnReport}
        />
      );

      // Find and click the more options button
      const moreButton = document.querySelector('[aria-haspopup=\"menu\"]');
      if (moreButton) {
        await user.click(moreButton as Element);
      }

      // Click copy option
      const copyOption = screen.getByText('Copy message');
      await user.click(copyOption);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Hello, this is a test message!');
    });

    it('calls onReport when report option is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <MessageBubble
          message={mockMessage}
          isCurrentUser={false}
          onReport={mockOnReport}
        />
      );

      // Find and click the more options button
      const moreButton = document.querySelector('[aria-haspopup=\"menu\"]');
      if (moreButton) {
        await user.click(moreButton as Element);
      }

      // Click report option
      const reportOption = screen.getByText('Report message');
      await user.click(reportOption);

      expect(mockOnReport).toHaveBeenCalled();
    });

    it('does not show report option for own messages', async () => {
      const user = userEvent.setup();
      
      render(
        <MessageBubble
          message={mockMessage}
          isCurrentUser={true}
          onReport={mockOnReport}
        />
      );

      // Find and click the more options button
      const moreButton = document.querySelector('[aria-haspopup=\"menu\"]');
      if (moreButton) {
        await user.click(moreButton as Element);
      }

      expect(screen.queryByText('Report message')).not.toBeInTheDocument();
    });
  });

  describe('System Messages', () => {
    it('renders system messages with special styling', () => {
      const systemMessage = {
        ...mockMessage,
        message_type: 'system' as const,
        content: 'Help request has been marked as complete'
      };

      render(
        <MessageBubble
          message={systemMessage}
          isCurrentUser={false}
          onReport={mockOnReport}
        />
      );

      expect(screen.getByText('Help request has been marked as complete')).toBeInTheDocument();
      
      // System messages should have different styling
      const systemContainer = screen.getByText('Help request has been marked as complete').closest('[class*=\"bg-blue\"]');
      expect(systemContainer).toBeInTheDocument();
    });
  });

  describe('Moderated Messages', () => {
    it('shows moderated message placeholder for hidden content', () => {
      const moderatedMessage = {
        ...mockMessage,
        is_flagged: true,
        moderation_status: 'hidden' as const,
        flagged_reason: 'inappropriate'
      };

      render(
        <MessageBubble
          message={moderatedMessage}
          isCurrentUser={false}
          onReport={mockOnReport}
        />
      );

      expect(screen.getByText('This message has been hidden by moderators')).toBeInTheDocument();
      expect(screen.getByText('Reason: inappropriate')).toBeInTheDocument();
    });

    it('shows flagged indicator for under review messages', () => {
      const flaggedMessage = {
        ...mockMessage,
        is_flagged: true,
        moderation_status: 'pending' as const
      };

      render(
        <MessageBubble
          message={flaggedMessage}
          isCurrentUser={false}
          onReport={mockOnReport}
        />
      );

      expect(screen.getByText('Under review')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for timestamps', () => {
      render(
        <MessageBubble
          message={mockMessage}
          isCurrentUser={false}
          onReport={mockOnReport}
        />
      );

      const timeButton = screen.getByTitle('Jan 7, 2025 at 2:30 PM');
      expect(timeButton).toBeInTheDocument();
    });

    it('has proper ARIA labels for avatars when shown', () => {
      render(
        <MessageBubble
          message={mockMessage}
          isCurrentUser={false}
          showSenderName={true}
          onReport={mockOnReport}
        />
      );

      const avatar = screen.getByLabelText('Alice Johnson\'s avatar');
      expect(avatar).toBeInTheDocument();
    });

    it('supports keyboard navigation for interactive elements', async () => {
      render(
        <MessageBubble
          message={mockMessage}
          isCurrentUser={false}
          onReport={mockOnReport}
        />
      );

      const timeButton = screen.getByText('5 minutes ago');
      
      // Should be focusable
      timeButton.focus();
      expect(timeButton).toHaveFocus();

      // Should respond to Enter key
      fireEvent.keyDown(timeButton, { key: 'Enter' });
      expect(screen.getByText('Jan 7, 2025 at 2:30 PM')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles messages with empty content gracefully', () => {
      const emptyMessage = {
        ...mockMessage,
        content: ''
      };

      render(
        <MessageBubble
          message={emptyMessage}
          isCurrentUser={false}
          onReport={mockOnReport}
        />
      );

      // Should still render the message container
      expect(screen.getByText('5 minutes ago')).toBeInTheDocument();
    });

    it('handles messages with very long content', () => {
      const longMessage = {
        ...mockMessage,
        content: 'A'.repeat(1000) // Very long message
      };

      render(
        <MessageBubble
          message={longMessage}
          isCurrentUser={false}
          onReport={mockOnReport}
        />
      );

      expect(screen.getByText('A'.repeat(1000))).toBeInTheDocument();
    });

    it('handles messages without sender location', () => {
      const messageNoLocation = {
        ...mockMessage,
        sender: {
          ...mockMessage.sender,
          location: undefined
        }
      };

      render(
        <MessageBubble
          message={messageNoLocation}
          isCurrentUser={false}
          showSenderName={true}
          onReport={mockOnReport}
        />
      );

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.queryByText('Springfield, MO')).not.toBeInTheDocument();
    });
  });
});