/**
 * @fileoverview Tests for messaging conversations API endpoints
 * Covers conversation listing and creation flows with simplified payloads
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/messaging/conversations/route';
import { messagingValidation } from '@/lib/messaging/types';

// Hoisted mocks so they are available when the route module evaluates
const messagingClientMocks = vi.hoisted(() => ({
  getConversations: vi.fn(),
  createConversation: vi.fn(),
}));

const moderationServiceMocks = vi.hoisted(() => ({
  checkUserRestrictions: vi.fn(),
}));

const loggerMocks = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

const errorTrackerMocks = vi.hoisted(() => ({
  captureError: vi.fn(),
  captureWarning: vi.fn(),
}));

vi.mock('@/lib/messaging/client', () => ({
  messagingClient: {
    getConversations: messagingClientMocks.getConversations,
    createConversation: messagingClientMocks.createConversation,
  },
  MessagingClient: vi.fn().mockImplementation(() => ({
    getConversations: messagingClientMocks.getConversations,
    createConversation: messagingClientMocks.createConversation,
  })),
}));

vi.mock('@/lib/messaging/moderation', () => ({
  moderationService: {
    checkUserRestrictions: moderationServiceMocks.checkUserRestrictions,
  },
}));

vi.mock('@/lib/logger', () => ({
  Logger: {
    getInstance: () => loggerMocks,
  },
}));

vi.mock('@/lib/error-tracking', () => ({
  errorTracker: errorTrackerMocks,
}));

const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => mockSupabaseClient,
}));

type TableResult = { data: any; error: any };

function createQueryBuilder(initialResult: TableResult = { data: null, error: null }) {
  let result: TableResult = initialResult;
  const builder: any = {};

  builder.select = vi.fn().mockReturnValue(builder);
  builder.eq = vi.fn().mockReturnValue(builder);
  builder.is = vi.fn().mockReturnValue(builder);
  builder.order = vi.fn().mockReturnValue(builder);
  builder.limit = vi.fn().mockReturnValue(builder);
  builder.range = vi.fn().mockReturnValue(builder);
  builder.single = vi.fn(() => Promise.resolve(result));
  builder.maybeSingle = vi.fn(() => Promise.resolve(result));
  builder.__setResult = (next: TableResult) => {
    result = next;
  };
  builder.then = (onFulfilled: any, onRejected: any) =>
    Promise.resolve(result).then(onFulfilled, onRejected);

  return builder;
}

const mockUser = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'test@example.com',
};

const validConversationData = {
  recipient_id: '22222222-2222-2222-2222-222222222222',
  help_request_id: '33333333-3333-3333-3333-333333333333',
  initial_message: 'Hi, I can help with your request!',
};

const mockGetConversations = messagingClientMocks.getConversations;
const mockCreateConversation = messagingClientMocks.createConversation;

const mockCheckUserRestrictions = moderationServiceMocks.checkUserRestrictions;

const loggerInstance = loggerMocks;
const mockErrorTracker = errorTrackerMocks;

function createPostRequest(body: any): NextRequest {
  const request = new Request('http://localhost/api/messaging/conversations', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
    // @ts-expect-error Node fetch requires duplex for request bodies in tests
    duplex: 'half',
  });

  return request as unknown as NextRequest;
}

describe('/api/messaging/conversations', () => {
  let profilesTable: any;
  let helpRequestsTable: any;
  let conversationsTable: any;
  let participantsTable: any;

  beforeEach(() => {
    vi.clearAllMocks();

    profilesTable = createQueryBuilder();
    helpRequestsTable = createQueryBuilder();
    conversationsTable = createQueryBuilder();
    participantsTable = createQueryBuilder();

    mockSupabaseClient.from.mockImplementation((table: string) => {
      switch (table) {
        case 'profiles':
          return profilesTable;
        case 'help_requests':
          return helpRequestsTable;
        case 'conversations':
          return conversationsTable;
        case 'conversation_participants':
          return participantsTable;
        default:
          return createQueryBuilder();
      }
    });

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockCheckUserRestrictions.mockResolvedValue({
      allowed: true,
      restrictionLevel: 'none',
    });

    profilesTable.__setResult({
      data: { id: validConversationData.recipient_id, name: 'Recipient User' },
      error: null,
    });

    helpRequestsTable.__setResult({
      data: {
        id: validConversationData.help_request_id,
        user_id: validConversationData.recipient_id,
        status: 'open',
        title: 'Request',
      },
      error: null,
    });

    conversationsTable.__setResult({ data: [], error: null });
    participantsTable.__setResult({ data: [], error: null });
  });

  describe('GET /api/messaging/conversations', () => {
    it('returns conversations for authenticated user', async () => {
      mockGetConversations.mockResolvedValue({
        conversations: [{ id: 'conv-1' }],
        pagination: { page: 1, limit: 20, total: 1, has_more: false },
      });

      const request = new Request('http://localhost/api/messaging/conversations', {
        method: 'GET',
      });

      const response = await GET(request as unknown as NextRequest);
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.conversations).toEqual([{ id: 'conv-1' }]);
      expect(mockGetConversations).toHaveBeenCalledWith(mockUser.id, { page: 1, limit: 20 });
    });

    it('returns 401 for unauthenticated requests', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const request = new Request('http://localhost/api/messaging/conversations', {
        method: 'GET',
      });

      const response = await GET(request as unknown as NextRequest);
      expect(response.status).toBe(401);
    });

    it('handles messaging client errors gracefully', async () => {
      mockGetConversations.mockRejectedValueOnce(new Error('Database failure'));

      const request = new Request('http://localhost/api/messaging/conversations?page=2&limit=10', {
        method: 'GET',
      });

      const response = await GET(request as unknown as NextRequest);

      expect(response.status).toBe(500);
      expect(loggerInstance.error).toHaveBeenCalledWith(
        'Messaging conversations fetch failed',
        expect.any(Error),
        expect.objectContaining({ method: 'GET' })
      );
      expect(mockErrorTracker.captureError).toHaveBeenCalled();
    });
  });

  describe('POST /api/messaging/conversations', () => {
    it('creates a new conversation and returns identifier payload', async () => {
      const mockConversation = {
        id: '44444444-4444-4444-4444-444444444444',
        created_by: mockUser.id,
        help_request_id: validConversationData.help_request_id,
      };

      mockCreateConversation.mockResolvedValue(mockConversation);
      const safeParseSpy = vi
        .spyOn(messagingValidation.createConversation, 'safeParse')
        .mockReturnValue({ success: true, data: validConversationData } as any);

      const response = await POST(createPostRequest(validConversationData));
      const payload = await response.json();

      expect(response.status).toBe(201);
      expect(payload).toMatchObject({
        success: true,
        conversation_id: mockConversation.id,
        help_request_id: validConversationData.help_request_id,
      });
      expect(mockCreateConversation).toHaveBeenCalledWith(mockUser.id, expect.objectContaining(validConversationData));
      expect(loggerInstance.info).toHaveBeenCalledWith(
        'Messaging conversation created',
        expect.objectContaining({ conversationId: mockConversation.id })
      );

      safeParseSpy.mockRestore();
    });

    it('validates request body schema', async () => {
      const response = await POST(createPostRequest({}));

      expect(response.status).toBe(400);
      const payload = await response.json();
      expect(payload.error).toBe('Invalid request data');
    });

    it('rejects conversation when user is restricted', async () => {
      mockCheckUserRestrictions.mockResolvedValueOnce({
        allowed: false,
        restrictionLevel: 'suspended',
        reason: 'You are suspended',
      });

      const safeParseSpy = vi
        .spyOn(messagingValidation.createConversation, 'safeParse')
        .mockReturnValue({ success: true, data: validConversationData } as any);

      const response = await POST(createPostRequest(validConversationData));

      expect(response.status).toBe(403);
      const payload = await response.json();
      expect(payload.error).toContain('You are suspended');
      expect(mockCreateConversation).not.toHaveBeenCalled();

      safeParseSpy.mockRestore();
    });

    it('returns 404 when recipient does not exist', async () => {
      profilesTable.__setResult({ data: null, error: new Error('Not found') });

      const safeParseSpy = vi
        .spyOn(messagingValidation.createConversation, 'safeParse')
        .mockReturnValue({ success: true, data: validConversationData } as any);

      const response = await POST(createPostRequest(validConversationData));

      expect(response.status).toBe(404);
      const payload = await response.json();
      expect(payload.error).toBe('Recipient not found');

      safeParseSpy.mockRestore();
    });

    it('prevents duplicate conversations between same users for help request', async () => {
      conversationsTable.__setResult({ data: [{ id: 'existing-conv' }], error: null });
      participantsTable.__setResult({
        data: [
          { user_id: mockUser.id },
          { user_id: validConversationData.recipient_id },
        ],
        error: null,
      });

      const safeParseSpy = vi
        .spyOn(messagingValidation.createConversation, 'safeParse')
        .mockReturnValue({ success: true, data: validConversationData } as any);

      const response = await POST(createPostRequest(validConversationData));

      expect(response.status).toBe(409);
      const payload = await response.json();
      expect(payload.conversation_id).toBe('existing-conv');
      expect(mockCreateConversation).not.toHaveBeenCalled();

      safeParseSpy.mockRestore();
    });
  });
});
