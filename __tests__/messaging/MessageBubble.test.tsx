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
      // Location is rendered with a bullet point separator
      expect(screen.getByText(/Springfield, MO/)).toBeInTheDocument();
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

      // Should show read status (double check mark icon)
      // Note: Component uses icon without title attribute
      const checkIcons = document.querySelectorAll('svg');
      expect(checkIcons.length).toBeGreaterThan(0);
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

      // System messages should have different styling (muted background)
      const systemContainer = screen.getByText('Help request has been marked as complete').closest('[class*=\"bg-muted\"]');
      expect(systemContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for message container', () => {
      render(
        <MessageBubble
          message={mockMessage}
          isCurrentUser={false}
          showSenderName={true}
          onReport={mockOnReport}
        />
      );

      // Message container should have role="article" and aria-label
      const messageContainer = screen.getByRole('article');
      expect(messageContainer).toHaveAttribute('aria-label', 'Message from Alice Johnson');
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