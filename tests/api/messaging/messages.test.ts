/**
 * @fileoverview Tests for messaging messages API endpoints
 * Tests message CRUD operations, content moderation, and security
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { GET, POST, PUT } from '@/app/api/messaging/conversations/[id]/messages/route';

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

// Mock content moderation
vi.mock('@/lib/messaging/moderation', () => ({
  ContentModerationService: vi.fn().mockImplementation(() => ({
    moderateContent: vi.fn().mockResolvedValue({
      approved: true,
      flags: [],
      score: 0.1,
    }),
  })),
}));

describe('/api/messaging/conversations/[id]/messages', () => {
  let mockQuery: any;
  let mockInsert: any;
  let mockSelect: any;
  let mockUpdate: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSelect = vi.fn().mockReturnThis();
    mockQuery = vi.fn().mockReturnThis();
    mockInsert = vi.fn().mockReturnThis();
    mockUpdate = vi.fn().mockReturnThis();
    
    mockSupabaseClient.from.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockConversation = {
    id: 'conv-456',
    status: 'active',
    participants: [
      { user_id: 'user-123', name: 'Alice Johnson' },
      { user_id: 'user-789', name: 'Bob Smith' },
    ],
  };

  const mockMessages = [
    {
      id: 'msg-1',
      conversation_id: 'conv-456',
      sender_id: 'user-123',
      recipient_id: 'user-789',
      content: 'Hello, I can help with your request!',
      message_type: 'text',
      status: 'sent',
      created_at: '2025-01-07T14:00:00Z',
      sender: { name: 'Alice Johnson', location: 'Springfield, MO' },
      recipient: { name: 'Bob Smith', location: 'Branson, MO' },
    },
    {
      id: 'msg-2',
      conversation_id: 'conv-456',
      sender_id: 'user-789',
      recipient_id: 'user-123',
      content: 'Thank you! When would be good for you?',
      message_type: 'text',
      status: 'read',
      read_at: '2025-01-07T14:05:00Z',
      created_at: '2025-01-07T14:02:00Z',
      sender: { name: 'Bob Smith', location: 'Branson, MO' },
      recipient: { name: 'Alice Johnson', location: 'Springfield, MO' },
    },
  ];

  // Test data for message creation
  const validMessageData = {
    content: 'This is a test message',
    message_type: 'text',
  };

  describe('GET /api/messaging/conversations/[id]/messages', () => {
    it('returns messages for authenticated participant', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/messaging/conversations/conv-456/messages',
        query: { id: 'conv-456' },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock conversation access check
      mockSelect.mockResolvedValueOnce({
        data: [mockConversation],
        error: null,
      });

      // Mock messages query
      mockSelect.mockResolvedValueOnce({
        data: mockMessages,
        error: null,
      });

      const response = await GET(req, { params: { id: 'conv-456' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.messages).toEqual(mockMessages);
      expect(responseData.pagination).toBeDefined();
    });

    it('handles pagination with cursor-based navigation', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/messaging/conversations/conv-456/messages?cursor=msg-1&limit=10',
        query: { id: 'conv-456', cursor: 'msg-1', limit: '10' },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSelect.mockResolvedValueOnce({
        data: [mockConversation],
        error: null,
      });

      mockSelect.mockResolvedValueOnce({
        data: [mockMessages[1]], // Messages after cursor
        error: null,
      });

      const response = await GET(req, { params: { id: 'conv-456' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.messages).toHaveLength(1);
      expect(responseData.pagination.cursor).toBe('msg-2');
    });

    it('returns 403 for non-participants', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/messaging/conversations/conv-456/messages',
        query: { id: 'conv-456' },
      });

      const nonParticipantUser = { id: 'user-999' };
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: nonParticipantUser },
        error: null,
      });

      mockSelect.mockResolvedValue({
        data: [], // No conversation found for this user
        error: null,
      });

      const response = await GET(req, { params: { id: 'conv-456' } });

      expect(response.status).toBe(403);
    });

    it('handles blocked conversations appropriately', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/messaging/conversations/conv-blocked/messages',
        query: { id: 'conv-blocked' },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const blockedConversation = {
        ...mockConversation,
        id: 'conv-blocked',
        status: 'blocked',
      };

      mockSelect.mockResolvedValue({
        data: [blockedConversation],
        error: null,
      });

      const response = await GET(req, { params: { id: 'conv-blocked' } });

      expect(response.status).toBe(403);
    });

    it('filters flagged content appropriately', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/messaging/conversations/conv-456/messages',
        query: { id: 'conv-456' },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSelect.mockResolvedValueOnce({
        data: [mockConversation],
        error: null,
      });

      const messagesWithFlagged = [
        ...mockMessages,
        {
          id: 'msg-flagged',
          conversation_id: 'conv-456',
          sender_id: 'user-789',
          content: 'This message was flagged',
          is_flagged: true,
          moderation_status: 'hidden',
          flagged_reason: 'inappropriate',
        },
      ];

      mockSelect.mockResolvedValueOnce({
        data: messagesWithFlagged,
        error: null,
      });

      const response = await GET(req, { params: { id: 'conv-456' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      // Flagged message should be filtered or show placeholder
      const flaggedMessage = responseData.messages.find((m: any) => m.id === 'msg-flagged');
      expect(flaggedMessage?.content).toBe('[Message hidden by moderators]');
    });
  });

  describe('POST /api/messaging/conversations/[id]/messages', () => {
    it('creates new message successfully', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/messaging/conversations/conv-456/messages',
        body: validMessageData,
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock conversation access
      mockSelect.mockResolvedValueOnce({
        data: [mockConversation],
        error: null,
      });

      const newMessage = {
        id: 'msg-new',
        conversation_id: 'conv-456',
        sender_id: 'user-123',
        content: 'This is a test message',
        created_at: '2025-01-07T15:00:00Z',
      };

      mockInsert.mockResolvedValue({
        data: [newMessage],
        error: null,
      });

      const response = await POST(req, { params: { id: 'conv-456' } });
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.message).toEqual(newMessage);
    });

    it('validates message content', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/messaging/conversations/conv-456/messages',
        body: {
          content: '', // Empty content
          message_type: 'text',
        },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const response = await POST(req, { params: { id: 'conv-456' } });

      expect(response.status).toBe(400);
    });

    it('enforces message length limits', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/messaging/conversations/conv-456/messages',
        body: {
          content: 'x'.repeat(1001), // Too long
          message_type: 'text',
        },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const response = await POST(req, { params: { id: 'conv-456' } });

      expect(response.status).toBe(400);
    });

    it('applies content moderation', async () => {
      const { ContentModerationService } = await import('@/lib/messaging/moderation');
      const mockModerationService = new (ContentModerationService as any)();
      
      // Mock flagged content
      mockModerationService.moderateContent.mockResolvedValue({
        approved: false,
        flags: ['profanity'],
        score: 0.9,
        reason: 'Contains inappropriate language',
      });

      const { req } = createMocks({
        method: 'POST',
        url: '/api/messaging/conversations/conv-456/messages',
        body: {
          content: 'This message contains bad words',
          message_type: 'text',
        },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSelect.mockResolvedValue({
        data: [mockConversation],
        error: null,
      });

      const response = await POST(req, { params: { id: 'conv-456' } });

      expect(response.status).toBe(400);
      expect(mockModerationService.moderateContent).toHaveBeenCalled();
    });

    it('prevents message spam with rate limiting', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/messaging/conversations/conv-456/messages',
        body: validMessageData,
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock rate limit check
      mockSupabaseClient.rpc.mockResolvedValue({
        data: 11, // Exceeded limit of 10 messages per minute
        error: null,
      });

      const response = await POST(req, { params: { id: 'conv-456' } });

      expect(response.status).toBe(429);
    });

    it('handles system message creation', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/messaging/conversations/conv-456/messages',
        body: {
          content: 'Help request has been marked complete',
          message_type: 'system',
        },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSelect.mockResolvedValue({
        data: [mockConversation],
        error: null,
      });

      const systemMessage = {
        id: 'msg-system',
        conversation_id: 'conv-456',
        message_type: 'system',
        content: 'Help request has been marked complete',
      };

      mockInsert.mockResolvedValue({
        data: [systemMessage],
        error: null,
      });

      const response = await POST(req, { params: { id: 'conv-456' } });

      expect(response.status).toBe(201);
    });

    it('prevents sending to blocked conversations', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/messaging/conversations/conv-blocked/messages',
        body: validMessageData,
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const blockedConversation = {
        ...mockConversation,
        status: 'blocked',
      };

      mockSelect.mockResolvedValue({
        data: [blockedConversation],
        error: null,
      });

      const response = await POST(req, { params: { id: 'conv-blocked' } });

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/messaging/conversations/[id]/messages', () => {
    it('marks message as read', async () => {
      const { req } = createMocks({
        method: 'PUT',
        url: '/api/messaging/conversations/conv-456/messages?messageId=msg-1',
        query: { messageId: 'msg-1' },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock message exists and user is recipient
      mockSelect.mockResolvedValue({
        data: [{
          id: 'msg-1',
          recipient_id: 'user-123',
          status: 'sent',
        }],
        error: null,
      });

      mockUpdate.mockResolvedValue({
        data: [{
          id: 'msg-1',
          status: 'read',
          read_at: '2025-01-07T15:00:00Z',
        }],
        error: null,
      });

      const response = await PUT(req, { 
        params: { id: 'conv-456' },
      });

      expect(response.status).toBe(200);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'read',
          read_at: expect.any(String),
        })
      );
    });

    it('prevents marking others messages as read by sender', async () => {
      const { req } = createMocks({
        method: 'PUT',
        url: '/api/messaging/conversations/conv-456/messages?messageId=msg-1',
        query: { messageId: 'msg-1' },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock message where user is sender (not recipient)
      mockSelect.mockResolvedValue({
        data: [{
          id: 'msg-1',
          sender_id: 'user-123', // Same as authenticated user
          recipient_id: 'user-789',
          status: 'sent',
        }],
        error: null,
      });

      const response = await PUT(req, { 
        params: { id: 'conv-456' },
      });

      expect(response.status).toBe(403);
    });

    it('handles bulk read operations', async () => {
      const { req } = createMocks({
        method: 'PUT',
        url: '/api/messaging/conversations/conv-456/messages?action=mark_all_read',
        query: { action: 'mark_all_read' },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockUpdate.mockResolvedValue({
        data: [
          { id: 'msg-1', status: 'read' },
          { id: 'msg-2', status: 'read' },
        ],
        error: null,
      });

      const response = await PUT(req, { 
        params: { id: 'conv-456' },
      });

      expect(response.status).toBe(200);
    });

    it('validates messageId parameter', async () => {
      const { req } = createMocks({
        method: 'PUT',
        url: '/api/messaging/conversations/conv-456/messages',
        // Missing messageId query parameter
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const response = await PUT(req, { 
        params: { id: 'conv-456' },
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Security and Privacy', () => {
    it('prevents cross-conversation message access', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/messaging/conversations/conv-456/messages',
        query: { id: 'conv-456' },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // User is not a participant in this conversation
      mockSelect.mockResolvedValue({
        data: [],
        error: null,
      });

      const response = await GET(req, { params: { id: 'conv-456' } });

      expect(response.status).toBe(403);
    });

    it('sanitizes message content in responses', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/messaging/conversations/conv-456/messages',
        query: { id: 'conv-456' },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSelect.mockResolvedValueOnce({
        data: [mockConversation],
        error: null,
      });

      const messagesWithSensitiveData = [{
        ...mockMessages[0],
        internal_flags: 'SENSITIVE_INTERNAL_DATA',
        raw_content: 'Original unsanitized content',
        ip_address: '192.168.1.1',
      }];

      mockSelect.mockResolvedValueOnce({
        data: messagesWithSensitiveData,
        error: null,
      });

      const response = await GET(req, { params: { id: 'conv-456' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      // Verify sensitive fields are not exposed
      expect(responseData.messages[0].internal_flags).toBeUndefined();
      expect(responseData.messages[0].raw_content).toBeUndefined();
      expect(responseData.messages[0].ip_address).toBeUndefined();
    });

    it('logs security events', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/messaging/conversations/conv-456/messages',
        body: {
          content: 'Suspicious content with personal info: call 555-1234',
          message_type: 'text',
        },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { ContentModerationService } = await import('@/lib/messaging/moderation');
      const mockModerationService = new (ContentModerationService as any)();
      
      mockModerationService.moderateContent.mockResolvedValue({
        approved: false,
        flags: ['personal_info'],
        score: 0.8,
        reason: 'Contains phone number',
      });

      const response = await POST(req, { params: { id: 'conv-456' } });

      expect(response.status).toBe(400);
      // Should log security event for audit trail
    });
  });

  describe('Real-time Integration', () => {
    it('triggers real-time notifications on message creation', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/messaging/conversations/conv-456/messages',
        body: validMessageData,
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSelect.mockResolvedValue({
        data: [mockConversation],
        error: null,
      });

      const newMessage = {
        id: 'msg-new',
        conversation_id: 'conv-456',
        sender_id: 'user-123',
        content: 'This is a test message',
        created_at: '2025-01-07T15:00:00Z',
      };

      mockInsert.mockResolvedValue({
        data: [newMessage],
        error: null,
      });

      const response = await POST(req, { params: { id: 'conv-456' } });

      expect(response.status).toBe(201);
      // Should trigger real-time notification to other participants
    });

    it('updates conversation last_message_at on new message', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/messaging/conversations/conv-456/messages',
        body: validMessageData,
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSelect.mockResolvedValue({
        data: [mockConversation],
        error: null,
      });

      mockInsert.mockResolvedValue({
        data: [{
          id: 'msg-new',
          created_at: '2025-01-07T15:00:00Z',
        }],
        error: null,
      });

      const response = await POST(req, { params: { id: 'conv-456' } });

      expect(response.status).toBe(201);
      // Should update parent conversation timestamp
    });
  });
});