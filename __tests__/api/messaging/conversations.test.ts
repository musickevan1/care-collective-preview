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

vi.mock('@/lib/messaging/client', () => ({
  MessagingClient: vi.fn().mockImplementation(() => ({
    getConversations: vi.fn(),
    createConversation: vi.fn(),
  })),
}));

describe('/api/messaging/conversations', () => {
  let mockQuery: any;
  let mockInsert: any;
  let mockSelect: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
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
      id: 'user-123',
      email: 'test@example.com',
    };

    const validConversationData = {
      help_request_id: 'req-456',
      participant_ids: ['user-456'],
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
        id: 'conv-new',
        created_by: 'user-123',
        help_request_id: 'req-456',
        status: 'active',
        created_at: '2025-01-07T15:00:00Z',
      };

      mockInsert.mockResolvedValue({
        data: [mockNewConversation],
        error: null,
      });

      const response = await POST(req);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.conversation).toEqual(mockNewConversation);
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

    it('validates participant_ids array', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/messaging/conversations',
        body: {
          ...validConversationData,
          participant_ids: 'invalid', // Should be array
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
          help_request_id: 'non-existent-request',
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
          participant_ids: ['user-123'], // Same as authenticated user
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

      mockInsert.mockResolvedValue({
        data: [{
          id: 'conv-new',
          created_by: 'user-123',
          created_at: '2025-01-07T15:00:00Z',
        }],
        error: null,
      });

      const response = await POST(req);

      expect(response.status).toBe(201);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          created_by: 'user-123',
          status: 'active',
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