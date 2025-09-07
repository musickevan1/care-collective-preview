/**
 * @fileoverview Tests for MessagingDashboard component
 * Tests main messaging interface with conversation list and message threads
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessagingDashboard } from '@/components/messaging/MessagingDashboard';
import { ConversationWithDetails } from '@/lib/messaging/types';

// Mock the child components
vi.mock('@/components/messaging/ConversationList', () => ({
  ConversationList: ({ onConversationSelect, conversations, loading, error }: any) => (
    <div data-testid="conversation-list">
      <div>ConversationList</div>
      {loading && <div>Loading conversations...</div>}
      {error && <div>Error: {error}</div>}
      {conversations.map((conv: any) => (
        <button
          key={conv.id}
          onClick={() => onConversationSelect(conv)}
          data-testid={`conversation-${conv.id}`}
        >
          {conv.title}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('@/components/messaging/MessageThread', () => ({
  MessageThread: ({ conversation, onMessageSent }: any) => (
    <div data-testid="message-thread">
      <div>MessageThread for {conversation?.title}</div>
      <button onClick={onMessageSent}>Send Message</button>
    </div>
  ),
}));

vi.mock('@/components/messaging/MessageThreadRealtime', () => ({
  MessageThreadRealtime: ({ conversation, onMessageSent }: any) => (
    <div data-testid="message-thread-realtime">
      <div>MessageThreadRealtime for {conversation?.title}</div>
      <button onClick={onMessageSent}>Send Message (Realtime)</button>
    </div>
  ),
}));

// Mock the messaging client
vi.mock('@/lib/messaging/client', () => ({
  MessagingClient: vi.fn().mockImplementation(() => ({
    getConversations: vi.fn(),
  })),
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('MessagingDashboard', () => {
  const mockConversations: ConversationWithDetails[] = [
    {
      id: 'conv-1',
      help_request_id: 'req-1',
      created_by: 'user-1',
      title: 'Help with groceries',
      status: 'active',
      created_at: '2025-01-07T14:00:00Z',
      updated_at: '2025-01-07T14:30:00Z',
      last_message_at: '2025-01-07T14:30:00Z',
      participants: [
        {
          id: 'part-1',
          conversation_id: 'conv-1',
          user_id: 'user-1',
          joined_at: '2025-01-07T14:00:00Z',
          name: 'Alice Johnson',
          location: 'Springfield, MO'
        },
        {
          id: 'part-2',
          conversation_id: 'conv-1',
          user_id: 'user-2',
          joined_at: '2025-01-07T14:00:00Z',
          name: 'Bob Smith',
          location: 'Branson, MO'
        }
      ],
      help_request: {
        id: 'req-1',
        title: 'Need help with weekly groceries',
        category: 'groceries',
        urgency: 'normal',
        status: 'open'
      },
      unread_count: 2,
      last_message: {
        id: 'msg-1',
        content: 'I can help with that!',
        sender_name: 'Bob Smith',
        created_at: '2025-01-07T14:30:00Z'
      }
    },
    {
      id: 'conv-2',
      help_request_id: 'req-2',
      created_by: 'user-2',
      title: 'Transport to doctor',
      status: 'active',
      created_at: '2025-01-07T13:00:00Z',
      updated_at: '2025-01-07T13:15:00Z',
      last_message_at: '2025-01-07T13:15:00Z',
      participants: [
        {
          id: 'part-3',
          conversation_id: 'conv-2',
          user_id: 'user-1',
          joined_at: '2025-01-07T13:00:00Z',
          name: 'Alice Johnson',
          location: 'Springfield, MO'
        },
        {
          id: 'part-4',
          conversation_id: 'conv-2',
          user_id: 'user-3',
          joined_at: '2025-01-07T13:00:00Z',
          name: 'Charlie Brown',
          location: 'Joplin, MO'
        }
      ],
      help_request: {
        id: 'req-2',
        title: 'Need ride to medical appointment',
        category: 'transport',
        urgency: 'urgent',
        status: 'in_progress'
      },
      unread_count: 0,
      last_message: {
        id: 'msg-2',
        content: 'What time is your appointment?',
        sender_name: 'Alice Johnson',
        created_at: '2025-01-07T13:15:00Z'
      }
    }
  ];

  const currentUserId = 'user-1';

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        conversations: mockConversations,
        pagination: { has_more: false, total_count: 2 }
      }),
    });
  });

  describe('Initial Rendering', () => {
    it('renders the main dashboard structure', async () => {
      render(<MessagingDashboard userId={currentUserId} />);

      expect(screen.getByText('Messages')).toBeInTheDocument();
      expect(screen.getByTestId('conversation-list')).toBeInTheDocument();

      // Wait for conversations to load
      await waitFor(() => {
        expect(screen.getByText('Help with groceries')).toBeInTheDocument();
      });
    });

    it('shows loading state initially', () => {
      (global.fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<MessagingDashboard userId={currentUserId} />);

      expect(screen.getByText('Loading conversations...')).toBeInTheDocument();
    });

    it('displays conversation count in header', async () => {
      render(<MessagingDashboard userId={currentUserId} />);

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // Total conversations
      });
    });
  });

  describe('Responsive Layout', () => {
    it('shows conversation list by default on mobile', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // Mobile width
      });

      render(<MessagingDashboard userId={currentUserId} />);

      await waitFor(() => {
        expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
      });

      // Should not show message thread initially on mobile
      expect(screen.queryByTestId('message-thread')).not.toBeInTheDocument();
    });

    it('shows both panels on desktop', async () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024, // Desktop width
      });

      render(<MessagingDashboard userId={currentUserId} />);

      await waitFor(() => {
        expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
      });

      // On desktop, should show welcome state when no conversation selected
      expect(screen.getByText('Select a conversation to start messaging')).toBeInTheDocument();
    });

    it('switches to message thread when conversation selected on mobile', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<MessagingDashboard userId={currentUserId} />);

      // Wait for conversations to load
      await waitFor(() => {
        expect(screen.getByTestId('conversation-conv-1')).toBeInTheDocument();
      });

      // Click on a conversation
      const conversationButton = screen.getByTestId('conversation-conv-1');
      fireEvent.click(conversationButton);

      // Should switch to message thread view
      expect(screen.getByTestId('message-thread')).toBeInTheDocument();
      expect(screen.queryByTestId('conversation-list')).not.toBeInTheDocument();
    });

    it('provides back navigation on mobile message view', async () => {
      const user = userEvent.setup();
      Object.defineProperty(window, 'innerWidth', { value: 375 });

      render(<MessagingDashboard userId={currentUserId} />);

      await waitFor(() => {
        expect(screen.getByTestId('conversation-conv-1')).toBeInTheDocument();
      });

      // Select conversation
      fireEvent.click(screen.getByTestId('conversation-conv-1'));

      // Should show back button
      const backButton = screen.getByLabelText('Back to conversations');
      expect(backButton).toBeInTheDocument();

      // Click back button
      await user.click(backButton);

      // Should return to conversation list
      expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
      expect(screen.queryByTestId('message-thread')).not.toBeInTheDocument();
    });
  });

  describe('Conversation Management', () => {
    it('loads conversations on mount', async () => {
      render(<MessagingDashboard userId={currentUserId} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/messaging/conversations?limit=50',
          expect.any(Object)
        );
      });
    });

    it('handles conversation selection', async () => {
      render(<MessagingDashboard userId={currentUserId} />);

      await waitFor(() => {
        expect(screen.getByTestId('conversation-conv-1')).toBeInTheDocument();
      });

      // Select a conversation
      fireEvent.click(screen.getByTestId('conversation-conv-1'));

      // Should show message thread for selected conversation
      expect(screen.getByText('MessageThread for Help with groceries')).toBeInTheDocument();
    });

    it('updates conversation list after message sent', async () => {
      render(<MessagingDashboard userId={currentUserId} />);

      await waitFor(() => {
        expect(screen.getByTestId('conversation-conv-1')).toBeInTheDocument();
      });

      // Select conversation and "send" message
      fireEvent.click(screen.getByTestId('conversation-conv-1'));
      
      const sendButton = screen.getByText('Send Message');
      fireEvent.click(sendButton);

      // Should trigger conversation refresh
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2); // Initial load + refresh
      });
    });

    it('handles search functionality', async () => {
      const user = userEvent.setup();
      render(<MessagingDashboard userId={currentUserId} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search conversations...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search conversations...');
      await user.type(searchInput, 'groceries');

      // Should filter conversations (mocked component will show filtered results)
      expect(searchInput).toHaveValue('groceries');
    });
  });

  describe('Real-time Features', () => {
    it('uses real-time message thread when enabled', async () => {
      render(<MessagingDashboard userId={currentUserId} enableRealtime={true} />);

      await waitFor(() => {
        expect(screen.getByTestId('conversation-conv-1')).toBeInTheDocument();
      });

      // Select conversation
      fireEvent.click(screen.getByTestId('conversation-conv-1'));

      // Should show real-time message thread
      expect(screen.getByText('MessageThreadRealtime for Help with groceries')).toBeInTheDocument();
    });

    it('falls back to regular message thread when realtime disabled', async () => {
      render(<MessagingDashboard userId={currentUserId} enableRealtime={false} />);

      await waitFor(() => {
        expect(screen.getByTestId('conversation-conv-1')).toBeInTheDocument();
      });

      // Select conversation
      fireEvent.click(screen.getByTestId('conversation-conv-1'));

      // Should show regular message thread
      expect(screen.getByText('MessageThread for Help with groceries')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error when conversation loading fails', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      render(<MessagingDashboard userId={currentUserId} />);

      await waitFor(() => {
        expect(screen.getByText('Error: Failed to load conversations')).toBeInTheDocument();
      });
    });

    it('allows retry after error', async () => {
      const user = userEvent.setup();
      (global.fetch as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ conversations: mockConversations, pagination: { has_more: false } })
        });

      render(<MessagingDashboard userId={currentUserId} />);

      await waitFor(() => {
        expect(screen.getByText('Error: Failed to load conversations')).toBeInTheDocument();
      });

      // Should have retry option (implementation specific)
      const retryButton = screen.getByText('Try again');
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Help with groceries')).toBeInTheDocument();
      });
    });

    it('handles API errors gracefully', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      });

      render(<MessagingDashboard userId={currentUserId} />);

      await waitFor(() => {
        expect(screen.getByText('Error: Failed to load conversations')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('implements conversation list virtualization for large datasets', async () => {
      // Create large dataset
      const largeConversationList = Array.from({ length: 100 }, (_, i) => ({
        ...mockConversations[0],
        id: `conv-${i}`,
        title: `Conversation ${i}`
      }));

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          conversations: largeConversationList,
          pagination: { has_more: false, total_count: 100 }
        }),
      });

      render(<MessagingDashboard userId={currentUserId} />);

      await waitFor(() => {
        expect(screen.getByText('Conversation 0')).toBeInTheDocument();
      });

      // Should handle large lists efficiently (implementation dependent)
      const conversationItems = screen.getAllByText(/^Conversation \d+$/);
      expect(conversationItems.length).toBeLessThanOrEqual(50); // Virtual scrolling limits
    });

    it('implements pagination for conversation loading', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          conversations: mockConversations,
          pagination: { has_more: true, total_count: 10 }
        }),
      });

      render(<MessagingDashboard userId={currentUserId} />);

      await waitFor(() => {
        expect(screen.getByText('Help with groceries')).toBeInTheDocument();
      });

      // Should show load more option when more conversations available
      expect(screen.getByText('Load more conversations')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', async () => {
      render(<MessagingDashboard userId={currentUserId} />);

      expect(screen.getByRole('heading', { name: 'Messages' })).toBeInTheDocument();
    });

    it('supports keyboard navigation between panels', async () => {
      const user = userEvent.setup();
      render(<MessagingDashboard userId={currentUserId} />);

      await waitFor(() => {
        expect(screen.getByTestId('conversation-conv-1')).toBeInTheDocument();
      });

      // Tab to conversation list
      await user.tab();
      
      // Enter to select conversation
      await user.keyboard('{Enter}');

      // Should focus message input in message thread
      const messageThread = screen.getByTestId('message-thread');
      expect(messageThread).toBeInTheDocument();
    });

    it('provides screen reader announcements for state changes', async () => {
      render(<MessagingDashboard userId={currentUserId} />);

      await waitFor(() => {
        expect(screen.getByTestId('conversation-conv-1')).toBeInTheDocument();
      });

      // Select conversation
      fireEvent.click(screen.getByTestId('conversation-conv-1'));

      // Should announce conversation selection to screen readers
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent('Conversation selected: Help with groceries');
    });

    it('maintains focus management during navigation', async () => {
      const user = userEvent.setup();
      Object.defineProperty(window, 'innerWidth', { value: 375 });

      render(<MessagingDashboard userId={currentUserId} />);

      await waitFor(() => {
        expect(screen.getByTestId('conversation-conv-1')).toBeInTheDocument();
      });

      const conversationButton = screen.getByTestId('conversation-conv-1');
      conversationButton.focus();
      expect(conversationButton).toHaveFocus();

      await user.keyboard('{Enter}');

      // After navigation, focus should be on back button or message input
      const backButton = screen.getByLabelText('Back to conversations');
      expect(backButton).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty conversation list gracefully', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          conversations: [],
          pagination: { has_more: false, total_count: 0 }
        }),
      });

      render(<MessagingDashboard userId={currentUserId} />);

      await waitFor(() => {
        expect(screen.getByText('No conversations yet')).toBeInTheDocument();
      });
    });

    it('handles conversation deletion during viewing', async () => {
      render(<MessagingDashboard userId={currentUserId} />);

      await waitFor(() => {
        expect(screen.getByTestId('conversation-conv-1')).toBeInTheDocument();
      });

      // Select conversation
      fireEvent.click(screen.getByTestId('conversation-conv-1'));

      // Simulate conversation being deleted (refresh returns different list)
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          conversations: [mockConversations[1]], // Only second conversation remains
          pagination: { has_more: false, total_count: 1 }
        }),
      });

      // Trigger refresh
      const sendButton = screen.getByText('Send Message');
      fireEvent.click(sendButton);

      await waitFor(() => {
        // Should handle deleted conversation gracefully
        expect(screen.queryByText('Help with groceries')).not.toBeInTheDocument();
        expect(screen.getByText('Transport to doctor')).toBeInTheDocument();
      });
    });

    it('handles network connectivity issues', async () => {
      render(<MessagingDashboard userId={currentUserId} />);

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      // Should show offline indicator
      fireEvent(window, new Event('offline'));

      expect(screen.getByText('You are currently offline')).toBeInTheDocument();
    });
  });
});