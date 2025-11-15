/**
 * @fileoverview Tests for MessagingDashboard component
 * Ensures the messaging dashboard renders and reacts to user interaction
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessagingDashboard } from '@/components/messaging/MessagingDashboard';
import { ConversationWithDetails } from '@/lib/messaging/types';

// Sample conversations used throughout the tests
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
        role: 'member',
      },
      {
        user_id: 'user-2',
        name: 'Bob Smith',
        location: 'Branson, MO',
        role: 'member',
      },
    ],
    help_request: {
      id: 'req-1',
      title: 'Need help with weekly groceries',
      category: 'groceries',
      urgency: 'normal',
      status: 'open',
    },
    unread_count: 2,
    last_message: {
      id: 'msg-1',
      conversation_id: 'conv-1',
      sender_id: 'user-2',
      recipient_id: 'user-1',
      content: 'I can help with that!',
      message_type: 'text',
      status: 'sent',
      is_flagged: false,
      created_at: '2025-01-07T14:30:00Z',
      updated_at: '2025-01-07T14:30:00Z',
      sender_name: 'Bob Smith',
    },
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
        role: 'member',
      },
      {
        user_id: 'user-3',
        name: 'Charlie Brown',
        location: 'Joplin, MO',
        role: 'member',
      },
    ],
    help_request: {
      id: 'req-2',
      title: 'Need ride to medical appointment',
      category: 'transport',
      urgency: 'urgent',
      status: 'in_progress',
    },
    unread_count: 0,
    last_message: {
      id: 'msg-2',
      conversation_id: 'conv-2',
      sender_id: 'user-1',
      recipient_id: 'user-3',
      content: 'What time is your appointment?',
      message_type: 'text',
      status: 'sent',
      is_flagged: false,
      created_at: '2025-01-07T13:15:00Z',
      updated_at: '2025-01-07T13:15:00Z',
      sender_name: 'Alice Johnson',
    },
  },
];

// Mock child components to isolate dashboard behaviour
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

// Create a chainable query builder that returns deterministic data
function createQueryBuilder(getResult: (builder: any) => { data: any; error: any }) {
  const builder: any = { __filters: {} as Record<string, any> };

  builder.select = vi.fn().mockReturnValue(builder);
  builder.eq = vi.fn((column: string, value: any) => {
    builder.__filters[column] = value;
    return builder;
  });
  builder.is = vi.fn().mockReturnValue(builder);
  builder.order = vi.fn().mockReturnValue(builder);
  builder.update = vi.fn().mockReturnValue(builder);
  builder.single = vi.fn(() => Promise.resolve(getResult(builder)));
  builder.then = (resolve: any, reject: any) =>
    Promise.resolve(getResult(builder)).then(resolve, reject);

  return builder;
}

// Hoist Supabase client mock so component imports receive it immediately
const supabaseBuilders = vi.hoisted(() => ({
  from: vi.fn(),
  channel: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: supabaseBuilders.from,
    channel: supabaseBuilders.channel,
    rpc: supabaseBuilders.rpc,
  }),
}));

const mockFetch = vi.fn();

global.fetch = mockFetch as any;

// Hoist messaging client mock to avoid module evaluation issues
const messagingClientMocks = vi.hoisted(() => ({
  getConversations: vi.fn(),
}));

vi.mock('@/lib/messaging/client', () => ({
  messagingClient: {
    getConversations: messagingClientMocks.getConversations,
  },
  MessagingClient: vi.fn().mockImplementation(() => ({
    getConversations: messagingClientMocks.getConversations,
  })),
}));

describe('MessagingDashboard', () => {
  const currentUserId = 'user-1';

  beforeEach(() => {
    vi.clearAllMocks();

    const conversationBuilder = createQueryBuilder(builder => {
      const targetId = builder.__filters.id ?? mockConversations[0].id;
      const baseConversation =
        mockConversations.find(conv => conv.id === targetId) ?? mockConversations[0];

      return {
        data: {
          ...baseConversation,
          conversation_participants: baseConversation.participants.map(participant => ({
            user_id: participant.user_id,
            role: participant.role,
            profiles: {
              id: participant.user_id,
              name: participant.name,
              location: participant.location,
            },
          })),
          help_requests: baseConversation.help_request,
        },
        error: null,
      };
    });

    const messagesBuilder = createQueryBuilder(() => ({ data: [], error: null }));
    const updateBuilder = createQueryBuilder(() => ({ data: null, error: null }));
    const channelMock: any = {
      on: vi.fn().mockReturnThis(),
      track: vi.fn(),
      send: vi.fn(),
      subscribe: vi.fn().mockImplementation((callback?: (status: string) => void) => {
        callback?.('SUBSCRIBED');
        return channelMock;
      }),
      unsubscribe: vi.fn(),
    };

    supabaseBuilders.channel.mockReturnValue(channelMock);
    supabaseBuilders.rpc.mockResolvedValue({ data: null, error: null });

    supabaseBuilders.from.mockImplementation((table: string) => {
      if (table === 'conversations') {
        return conversationBuilder;
      }

      if (table === 'messages') {
        return {
          ...messagesBuilder,
          update: vi.fn().mockReturnValue(updateBuilder),
        };
      }

      return createQueryBuilder(() => ({ data: null, error: null }));
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        conversations: mockConversations,
        pagination: { has_more: false, total: mockConversations.length, page: 1, limit: 20 },
      }),
      text: async () => JSON.stringify({
        conversations: mockConversations,
        pagination: { has_more: false, total: mockConversations.length, page: 1, limit: 20 },
      }),
    });
  });

  describe('Initial Rendering', () => {
    it('renders the main dashboard structure', async () => {
      render(<MessagingDashboard userId={currentUserId} initialConversations={mockConversations} />);

      expect(screen.getByText('Messages')).toBeInTheDocument();
      expect(screen.getByTestId('conversation-list')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Help with groceries')).toBeInTheDocument();
      });
    });

    it('displays total conversation count in header', async () => {
      render(<MessagingDashboard userId={currentUserId} initialConversations={mockConversations} />);

      await waitFor(() => {
        expect(screen.getByText(new RegExp(`${mockConversations.length}\\s+unread messages`))).toBeInTheDocument();
      });
    });
  });

  describe('User interactions', () => {
    it('allows selecting a conversation', async () => {
      render(<MessagingDashboard userId={currentUserId} initialConversations={mockConversations} />);

      const conversationButton = await screen.findByTestId('conversation-conv-2');
      await userEvent.click(conversationButton);

      await screen.findByLabelText('Send message');
    });
  });
});
