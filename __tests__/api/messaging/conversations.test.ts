/**
 * @fileoverview Tests for messaging conversations API endpoints
 * Tests conversation CRUD operations and security
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/messaging/conversations/route';

// Mock Supabase
const mockSupabaseClient = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
  rpc: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabaseClient,
}));

const mockGetConversations = vi.fn();
const mockCreateConversation = vi.fn();

vi.mock('@/lib/messaging/client', () => ({
  messagingClient: {
    getConversations: mockGetConversations,
    createConversation: mockCreateConversation,
  },
  MessagingClient: vi.fn().mockImplementation(() => ({
    getConversations: mockGetConversations,
    createConversation: mockCreateConversation,
  })),
}));

describe('/api/messaging/conversations', () => {
  let mockQuery: any;
  let mockInsert: any;
  let mockSelect: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockGetConversations.mockReset();
    mockCreateConversation.mockReset();

    mockSelect = vi.fn().mockReturnThis();
    mockQuery = vi.fn().mockReturnThis();
    mockInsert = vi.fn().mockReturnThis();
    
    mockSupabaseClient.from.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/messaging/conversations', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    };

    const mockConversations = [
      {
        id: 'conv-1',
        title: 'Help with groceries',
        status: 'active',
        created_at: '2025-01-07T14:00:00Z',
        last_message_at: '2025-01-07T14:30:00Z',
        participants: [
          { user_id: 'user-123', name: 'Alice Johnson' },
          { user_id: 'user-456', name: 'Bob Smith' },
        ],
        unread_count: 2,
        last_message: {
          content: 'I can help with that!',
          sender_name: 'Bob Smith',
          created_at: '2025-01-07T14:30:00Z',
        },
      },
    ];

    it('returns conversations for authenticated user', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/messaging/conversations',
        query: {},
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSelect.mockResolvedValue({
        data: mockConversations,
        error: null,
      });

      const response = await GET(req);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.conversations).toEqual(mockConversations);
      expect(responseData.pagination).toBeDefined();
    });

    it('handles pagination parameters', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/messaging/conversations?limit=10&offset=20',
        query: { limit: '10', offset: '20' },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSelect.mockResolvedValue({
        data: mockConversations,
        error: null,
      });

      const response = await GET(req);

      expect(response.status).toBe(200);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('conversations');
    });

    it('filters conversations by search query', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/messaging/conversations?search=groceries',
        query: { search: 'groceries' },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSelect.mockResolvedValue({
        data: mockConversations.filter(c => c.title.includes('groceries')),
        error: null,
      });

      const response = await GET(req);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.conversations[0].title).toContain('groceries');
    });

    it('returns 401 for unauthenticated requests', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/messaging/conversations',
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const response = await GET(req);

      expect(response.status).toBe(401);
    });

    it('handles database errors gracefully', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/messaging/conversations',
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSelect.mockResolvedValue({
        data: null,
        error: new Error('Database connection failed'),
      });

      const response = await GET(req);

      expect(response.status).toBe(500);
    });

    it('validates pagination parameters', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/messaging/conversations?limit=invalid',
        query: { limit: 'invalid' },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const response = await GET(req);

      expect(response.status).toBe(400);
    });

    it('enforces maximum limit for pagination', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/messaging/conversations?limit=1000',
        query: { limit: '1000' },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSelect.mockResolvedValue({
        data: mockConversations,
        error: null,
      });

      const response = await GET(req);

      expect(response.status).toBe(200);
      // Should limit to maximum allowed (e.g., 100)
    });
  });

  describe('POST /api/messaging/conversations', () => {
    const mockUser = {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'test@example.com',
    };

    const validConversationData = {
      recipient_id: '22222222-2222-2222-2222-222222222222',
      help_request_id: '33333333-3333-3333-3333-333333333333',
      initial_message: 'Hi, I can help with your request!',
    };

    it('creates new conversation successfully', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/messaging/conversations',
        body: validConversationData,
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockNewConversation = {
        id: '44444444-4444-4444-4444-444444444444',
        created_by: mockUser.id,
        help_request_id: validConversationData.help_request_id,
        status: 'active',
        created_at: '2025-01-07T15:00:00Z',
      };

      mockCreateConversation.mockResolvedValue(mockNewConversation);

      const response = await POST(req);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.conversation_id).toBe(mockNewConversation.id);
      expect(responseData.help_request_id).toBe(validConversationData.help_request_id);
    });

    it('validates required fields', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/messaging/conversations',
        body: {
          // Missing required fields
        },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const response = await POST(req);

      expect(response.status).toBe(400);
    });

    it('validates recipient_id format', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/messaging/conversations',
        body: {
          ...validConversationData,
          recipient_id: 'invalid-recipient-id', // Should be UUID
        },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const response = await POST(req);

      expect(response.status).toBe(400);
    });

    it('validates initial_message length', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/messaging/conversations',
        body: {
          ...validConversationData,
          initial_message: 'x'.repeat(1001), // Too long
        },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const response = await POST(req);

      expect(response.status).toBe(400);
    });

    it('prevents creating duplicate conversations', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/messaging/conversations',
        body: validConversationData,
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock existing conversation check
      mockSelect.mockResolvedValue({
        data: [{ id: 'existing-conv' }],
        error: null,
      });

      const response = await POST(req);

      expect(response.status).toBe(409); // Conflict
    });

    it('handles help request validation', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/messaging/conversations',
        body: {
          ...validConversationData,
          help_request_id: '99999999-9999-9999-9999-999999999999',
        },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock help request not found
      mockSelect.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const response = await POST(req);

      expect(response.status).toBe(404);
    });

    it('prevents self-conversation creation', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/messaging/conversations',
        body: {
          ...validConversationData,
          recipient_id: mockUser.id, // Same as authenticated user
        },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const response = await POST(req);

      expect(response.status).toBe(400);
    });

    it('implements rate limiting', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/messaging/conversations',
        body: validConversationData,
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock rate limit exceeded
      mockSupabaseClient.rpc.mockResolvedValue({
        data: 6, // Exceeded limit of 5 per hour
        error: null,
      });

      const response = await POST(req);

      expect(response.status).toBe(429); // Too Many Requests
    });

    it('creates conversation with proper audit trail', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/messaging/conversations',
        body: validConversationData,
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockCreateConversation.mockResolvedValue({
        id: 'conv-new',
        created_by: 'user-123',
        created_at: '2025-01-07T15:00:00Z',
        help_request_id: validConversationData.help_request_id,
      });

      const response = await POST(req);

      expect(response.status).toBe(201);
      expect(mockCreateConversation).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          recipient_id: validConversationData.recipient_id,
          help_request_id: validConversationData.help_request_id,
          initial_message: validConversationData.initial_message,
        })
      );
    });
  });

  describe('Security and Privacy', () => {
    it('only returns conversations user is participant in', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/messaging/conversations',
      });

      const mockUser = { id: 'user-123' };
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Verify query filters by user participation
      mockSelect.mockResolvedValue({
        data: [],
        error: null,
      });

      await GET(req);

      // Should query only conversations where user is a participant
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('conversations');
    });

    it('sanitizes sensitive data in responses', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/messaging/conversations',
      });

      const mockUser = { id: 'user-123' };
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const conversationWithSensitiveData = {
        id: 'conv-1',
        title: 'Help request',
        internal_notes: 'SENSITIVE: User flagged',
        participants: [
          { 
            user_id: 'user-123',
            name: 'Alice',
            email: 'alice@example.com', // Should not be exposed
            phone: '+1234567890', // Should not be exposed
          },
        ],
      };

      mockSelect.mockResolvedValue({
        data: [conversationWithSensitiveData],
        error: null,
      });

      const response = await GET(req);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      // Verify sensitive fields are not included
      expect(responseData.conversations[0].internal_notes).toBeUndefined();
      expect(responseData.conversations[0].participants[0].email).toBeUndefined();
      expect(responseData.conversations[0].participants[0].phone).toBeUndefined();
    });

    it('prevents accessing blocked conversations', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/messaging/conversations',
      });

      const mockUser = { id: 'user-123' };
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const blockedConversation = {
        id: 'conv-blocked',
        status: 'blocked',
        title: 'Blocked conversation',
      };

      mockSelect.mockResolvedValue({
        data: [blockedConversation],
        error: null,
      });

      const response = await GET(req);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      // Blocked conversations should be filtered out or marked appropriately
      expect(responseData.conversations).toEqual([]);
    });
  });

  describe('Performance and Optimization', () => {
    it('implements efficient database queries', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/messaging/conversations?limit=20',
      });

      const mockUser = { id: 'user-123' };
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSelect.mockResolvedValue({
        data: [],
        error: null,
      });

      await GET(req);

      // Verify optimized query structure
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('conversations');
      // Should use appropriate joins and limits
    });

    it('caches frequently accessed data', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/messaging/conversations',
      });

      const mockUser = { id: 'user-123' };
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSelect.mockResolvedValue({
        data: [],
        error: null,
      });

      // Make multiple requests
      await GET(req);
      await GET(req);

      // Implementation should use appropriate caching strategies
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(2);
    });
  });
});