/**
 * @fileoverview Tests for ConversationList component
 * Tests conversation display, filtering, and interaction functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConversationList } from '@/components/messaging/ConversationList';
import { ConversationWithDetails } from '@/lib/messaging/types';

// Mock date functions
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn((date) => {
    const testDate = new Date(date);
    const now = new Date('2025-01-07T15:00:00Z');
    const diffMinutes = Math.floor((now.getTime() - testDate.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    return `${Math.floor(diffMinutes / 1440)} days ago`;
  }),
  format: vi.fn(() => 'Jan 7, 2025 at 2:30 PM'),
}));

describe('ConversationList', () => {
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
          user_id: 'user-1',
          name: 'Alice Johnson',
          location: 'Springfield, MO',
          role: 'member' as const
        },
        {
          user_id: 'user-2',
          name: 'Bob Smith',
          location: 'Branson, MO',
          role: 'member' as const
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
        conversation_id: 'conv-1',
        sender_id: 'user-2',
        recipient_id: 'user-1',
        content: 'I can help with that!',
        message_type: 'text' as const,
        status: 'sent' as const,
        is_flagged: false,
        created_at: '2025-01-07T14:30:00Z',
        updated_at: '2025-01-07T14:30:00Z',
        sender_name: 'Bob Smith'
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
          user_id: 'user-1',
          name: 'Alice Johnson',
          location: 'Springfield, MO',
          role: 'member' as const
        },
        {
          user_id: 'user-3',
          name: 'Charlie Brown',
          location: 'Joplin, MO',
          role: 'member' as const
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
        conversation_id: 'conv-2',
        sender_id: 'user-1',
        recipient_id: 'user-3',
        content: 'What time is your appointment?',
        message_type: 'text' as const,
        status: 'sent' as const,
        is_flagged: false,
        created_at: '2025-01-07T13:15:00Z',
        updated_at: '2025-01-07T13:15:00Z',
        sender_name: 'Alice Johnson'
      }
    },
    {
      id: 'conv-3',
      help_request_id: undefined,
      created_by: 'user-3',
      title: 'General chat',
      status: 'active',
      created_at: '2025-01-06T10:00:00Z',
      updated_at: '2025-01-06T10:00:00Z',
      last_message_at: '2025-01-06T10:00:00Z',
      participants: [
        {
          user_id: 'user-1',
          name: 'Alice Johnson',
          location: 'Springfield, MO',
          role: 'member' as const
        },
        {
          user_id: 'user-3',
          name: 'Charlie Brown',
          location: 'Joplin, MO',
          role: 'member' as const
        }
      ],
      help_request: undefined,
      unread_count: 1,
      last_message: {
        id: 'msg-3',
        conversation_id: 'conv-3',
        sender_id: 'user-3',
        recipient_id: 'user-1',
        content: 'Thank you for your help!',
        message_type: 'text' as const,
        status: 'sent' as const,
        is_flagged: false,
        created_at: '2025-01-06T10:00:00Z',
        updated_at: '2025-01-06T10:00:00Z',
        sender_name: 'Charlie Brown'
      }
    }
  ];

  const mockOnConversationSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders conversation list with all conversations', () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onConversationSelect={mockOnConversationSelect}
        />
      );

      expect(screen.getByText('Help with groceries')).toBeInTheDocument();
      expect(screen.getByText('Transport to doctor')).toBeInTheDocument();
      expect(screen.getByText('General chat')).toBeInTheDocument();
    });

    it('shows total unread count in header', () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onConversationSelect={mockOnConversationSelect}
        />
      );

      // Total unread: 2 + 0 + 1 = 3
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    // TODO: Re-enable when search functionality is implemented
    it.skip('displays search input', () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onConversationSelect={mockOnConversationSelect}
        />
      );

      expect(screen.getByPlaceholderText('Search conversations...')).toBeInTheDocument();
    });
  });

  describe('Conversation Display', () => {
    it('shows participant names excluding current user', () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onConversationSelect={mockOnConversationSelect}
        />
      );

      // First conversation: should show Bob Smith (not Alice Johnson who is current user)
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();

      // Second conversation: should show Charlie Brown
      expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
    });

    it('displays help request context when available', () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onConversationSelect={mockOnConversationSelect}
        />
      );

      expect(screen.getByText('groceries')).toBeInTheDocument();
      expect(screen.getByText('transport')).toBeInTheDocument();
    });

    it('shows last message preview', () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onConversationSelect={mockOnConversationSelect}
        />
      );

      expect(screen.getByText('I can help with that!')).toBeInTheDocument();
      expect(screen.getByText('What time is your appointment?')).toBeInTheDocument();
      expect(screen.getByText('Thank you for your help!')).toBeInTheDocument();
    });

    it('displays timestamps correctly', () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onConversationSelect={mockOnConversationSelect}
        />
      );

      expect(screen.getByText('30 minutes ago')).toBeInTheDocument();
      expect(screen.getByText('105 minutes ago')).toBeInTheDocument();
      expect(screen.getByText('1440 minutes ago')).toBeInTheDocument();
    });

    it('shows unread message badges', () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onConversationSelect={mockOnConversationSelect}
        />
      );

      // Should show unread counts for conversations with unread messages
      const unreadBadges = screen.getAllByText(/^[0-9]+$/).filter(el => 
        el.textContent === '2' || el.textContent === '1'
      );
      expect(unreadBadges).toHaveLength(2);
    });

    it('highlights urgent help requests', () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onConversationSelect={mockOnConversationSelect}
        />
      );

      // Transport conversation has urgent priority
      const urgentBadge = screen.getByText('urgent');
      expect(urgentBadge).toBeInTheDocument();
      expect(urgentBadge).toHaveClass('bg-yellow-100');
    });
  });

  describe('User Interaction', () => {
    it('calls onConversationSelect when conversation is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <ConversationList
          conversations={mockConversations}
          onConversationSelect={mockOnConversationSelect}
        />
      );

      const firstConversation = screen.getByText('Help with groceries').closest('button');
      if (firstConversation) {
        await user.click(firstConversation);
      }

      expect(mockOnConversationSelect).toHaveBeenCalledWith(mockConversations[0]);
    });

    // TODO: Re-enable when search functionality is implemented
    it.skip('handles search input changes', async () => {
      const user = userEvent.setup();
      
      render(
        <ConversationList
          conversations={mockConversations}
          onConversationSelect={mockOnConversationSelect}
        />
      );

      // const searchInput = screen.getByPlaceholderText('Search conversations...');
      // await user.type(searchInput, 'groceries');
      // expect(mockOnSearchChange).toHaveBeenCalledWith('groceries');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <ConversationList
          conversations={mockConversations}
          onConversationSelect={mockOnConversationSelect}
        />
      );

      const firstConversation = screen.getByText('Help with groceries').closest('button');
      if (firstConversation) {
        await user.tab();
        expect(firstConversation).toHaveFocus();

        await user.keyboard('{Enter}');
        expect(mockOnConversationSelect).toHaveBeenCalledWith(mockConversations[0]);
      }
    });
  });

  describe('Empty States', () => {
    it('shows empty state when no conversations exist', () => {
      render(
        <ConversationList
          conversations={[]}
          onConversationSelect={mockOnConversationSelect}
        />
      );

      expect(screen.getByText('No conversations yet')).toBeInTheDocument();
      expect(screen.getByText('Start helping your community by responding to help requests')).toBeInTheDocument();
    });

    // TODO: Re-enable when search functionality is implemented
    it.skip('shows no results state when search has no matches', () => {
      render(
        <ConversationList
          conversations={[]}
          onConversationSelect={mockOnConversationSelect}
        />
      );

      expect(screen.getByText('No conversations found')).toBeInTheDocument();
      // expect(screen.getByText('Try different search terms or clear your search')).toBeInTheDocument();
    });
  });

  describe('Loading and Error States', () => {
    it('shows loading state', () => {
      render(
        <ConversationList
          conversations={[]}
          onConversationSelect={mockOnConversationSelect}
          loading={true}
        />
      );

      expect(screen.getByText('Loading conversations...')).toBeInTheDocument();
    });

    it('displays error message when provided', () => {
      render(
        <ConversationList
          conversations={[]}
          onConversationSelect={mockOnConversationSelect}
          error="Failed to load conversations"
        />
      );

      expect(screen.getByText('Failed to load conversations')).toBeInTheDocument();
      expect(screen.getByText('Try again')).toBeInTheDocument();
    });

    // TODO: Re-enable when retry functionality is implemented
    it.skip('allows retry on error', async () => {
      // const mockOnRetry = vi.fn();
      const user = userEvent.setup();

      render(
        <ConversationList
          conversations={[]}
          onConversationSelect={mockOnConversationSelect}
          error="Network error"
        />
      );

      // const retryButton = screen.getByText('Try again');
      // await user.click(retryButton);
      // expect(mockOnRetry).toHaveBeenCalled();
    });
  });

  describe('Sorting and Organization', () => {
    it('sorts conversations by last message time by default', () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onConversationSelect={mockOnConversationSelect}
        />
      );

      const conversationElements = screen.getAllByRole('button').filter(el => 
        el.textContent?.includes('Help with groceries') || 
        el.textContent?.includes('Transport to doctor') ||
        el.textContent?.includes('General chat')
      );

      // Most recent first (groceries conversation at 14:30)
      expect(conversationElements[0]).toHaveTextContent('Help with groceries');
    });

    it('prioritizes conversations with unread messages', () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onConversationSelect={mockOnConversationSelect}
        />
      );

      // Conversations with unread messages should have visual priority
      const unreadConversations = screen.getAllByRole('button').filter(el =>
        el.querySelector('[class*="bg-sage"]') // Unread indicator styling
      );

      expect(unreadConversations.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for conversations', () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onConversationSelect={mockOnConversationSelect}
        />
      );

      const conversationButton = screen.getByLabelText('Conversation: Help with groceries with Bob Smith, 2 unread messages, last message 30 minutes ago');
      expect(conversationButton).toBeInTheDocument();
    });

    it('includes screen reader text for unread counts', () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onConversationSelect={mockOnConversationSelect}
        />
      );

      expect(screen.getByText('2 unread messages', { selector: '.sr-only' })).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onConversationSelect={mockOnConversationSelect}
        />
      );

      expect(screen.getByRole('heading', { name: 'Messages' })).toBeInTheDocument();
    });

    it('supports screen reader navigation', () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onConversationSelect={mockOnConversationSelect}
        />
      );

      const conversationRegion = screen.getByRole('region', { name: 'Conversation list' });
      expect(conversationRegion).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('updates conversation order when new messages arrive', async () => {
      const { rerender } = render(
        <ConversationList
          conversations={mockConversations}
          onConversationSelect={mockOnConversationSelect}
        />
      );

      // Update the last conversation to have a more recent message
      const updatedConversations = [...mockConversations];
      updatedConversations[2] = {
        ...updatedConversations[2],
        last_message_at: '2025-01-07T15:00:00Z',
        last_message: {
          id: 'msg-4',
          conversation_id: 'conv-3',
          sender_id: 'user-3',
          recipient_id: 'user-1',
          content: 'New message',
          message_type: 'text' as const,
          status: 'sent' as const,
          is_flagged: false,
          created_at: '2025-01-07T15:00:00Z',
          updated_at: '2025-01-07T15:00:00Z',
          sender_name: 'Charlie Brown'
        }
      };

      rerender(
        <ConversationList
          conversations={updatedConversations}
          onConversationSelect={mockOnConversationSelect}
        />
      );

      // Should show the updated message
      expect(screen.getByText('New message')).toBeInTheDocument();
    });

    it('reflects unread count changes', async () => {
      const { rerender } = render(
        <ConversationList
          conversations={mockConversations}
          onConversationSelect={mockOnConversationSelect}
        />
      );

      // Update unread count
      const updatedConversations = [...mockConversations];
      updatedConversations[0] = {
        ...updatedConversations[0],
        unread_count: 5
      };

      rerender(
        <ConversationList
          conversations={updatedConversations}
          onConversationSelect={mockOnConversationSelect}
        />
      );

      // Should show updated unread count
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });
});