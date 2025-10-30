import { describe, it, expect, vi, beforeEach } from 'vitest';
import { messagingServiceV2, MessagingServiceV2 } from './service-v2';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('MessagingServiceV2', () => {
  let mockRpc: any;
  let service: MessagingServiceV2;

  beforeEach(() => {
    mockRpc = vi.fn();
    (createClient as any).mockResolvedValue({
      rpc: mockRpc,
    });
    service = new MessagingServiceV2();
    vi.clearAllMocks();
  });

  describe('createHelpConversation', () => {
    it('calls create_conversation_atomic RPC with correct params', async () => {
      mockRpc.mockResolvedValue({
        data: { success: true, conversation_id: 'conv-123' },
        error: null,
      });

      const result = await service.createHelpConversation({
        help_request_id: '550e8400-e29b-41d4-a716-446655440000',
        helper_id: '550e8400-e29b-41d4-a716-446655440001',
        initial_message: 'I can help with groceries!',
      });

      expect(mockRpc).toHaveBeenCalledWith('create_conversation_atomic', {
        p_help_request_id: '550e8400-e29b-41d4-a716-446655440000',
        p_helper_id: '550e8400-e29b-41d4-a716-446655440001',
        p_initial_message: 'I can help with groceries!',
      });

      expect(result.success).toBe(true);
      expect(result.conversation_id).toBe('conv-123');
    });

    it('returns error for duplicate conversation', async () => {
      mockRpc.mockResolvedValue({
        data: {
          success: false,
          error: 'conversation_exists',
          message: 'Conversation already exists for this help request and helper',
          conversation_id: 'existing-conv',
        },
        error: null,
      });

      const result = await service.createHelpConversation({
        help_request_id: '550e8400-e29b-41d4-a716-446655440000',
        helper_id: '550e8400-e29b-41d4-a716-446655440001',
        initial_message: 'Test message that is long enough',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('conversation_exists');
      expect(result.conversation_id).toBe('existing-conv');
    });

    it('handles RPC database errors', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', code: 'PGRST301' },
      });

      const result = await service.createHelpConversation({
        help_request_id: '550e8400-e29b-41d4-a716-446655440000',
        helper_id: '550e8400-e29b-41d4-a716-446655440001',
        initial_message: 'Test message that is long enough',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('rpc_error');
      expect(result.details).toBe('Database connection failed');
    });

    it('validates message length (too short)', async () => {
      await expect(
        service.createHelpConversation({
          help_request_id: '550e8400-e29b-41d4-a716-446655440000',
          helper_id: '550e8400-e29b-41d4-a716-446655440001',
          initial_message: 'Short',
        })
      ).rejects.toThrow();
    });

    it('validates message length (too long)', async () => {
      const longMessage = 'a'.repeat(1001);

      await expect(
        service.createHelpConversation({
          help_request_id: '550e8400-e29b-41d4-a716-446655440000',
          helper_id: '550e8400-e29b-41d4-a716-446655440001',
          initial_message: longMessage,
        })
      ).rejects.toThrow();
    });

    it('validates UUID format for help_request_id', async () => {
      await expect(
        service.createHelpConversation({
          help_request_id: 'invalid-uuid',
          helper_id: '550e8400-e29b-41d4-a716-446655440001',
          initial_message: 'Test message that is long enough',
        })
      ).rejects.toThrow();
    });

    it('validates UUID format for helper_id', async () => {
      await expect(
        service.createHelpConversation({
          help_request_id: '550e8400-e29b-41d4-a716-446655440000',
          helper_id: 'not-a-uuid',
          initial_message: 'Test message that is long enough',
        })
      ).rejects.toThrow();
    });

    it('logs success when conversation created', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      mockRpc.mockResolvedValue({
        data: { success: true, conversation_id: 'conv-456' },
        error: null,
      });

      await service.createHelpConversation({
        help_request_id: '550e8400-e29b-41d4-a716-446655440000',
        helper_id: '550e8400-e29b-41d4-a716-446655440001',
        initial_message: 'Test message that is long enough',
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[MessagingServiceV2.createHelpConversation] Success',
        expect.objectContaining({
          conversation_id: 'conv-456',
        })
      );

      consoleSpy.mockRestore();
    });

    it('logs warning when business logic error occurs', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockRpc.mockResolvedValue({
        data: {
          success: false,
          error: 'conversation_exists',
          message: 'Conversation already exists',
        },
        error: null,
      });

      await service.createHelpConversation({
        help_request_id: '550e8400-e29b-41d4-a716-446655440000',
        helper_id: '550e8400-e29b-41d4-a716-446655440001',
        initial_message: 'Test message that is long enough',
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[MessagingServiceV2.createHelpConversation] Business logic error',
        expect.any(Object)
      );

      consoleWarnSpy.mockRestore();
    });

    it('logs error when RPC fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockRpc.mockResolvedValue({
        data: null,
        error: {
          message: 'Connection timeout',
          code: 'TIMEOUT',
          details: 'Network error',
        },
      });

      await service.createHelpConversation({
        help_request_id: '550e8400-e29b-41d4-a716-446655440000',
        helper_id: '550e8400-e29b-41d4-a716-446655440001',
        initial_message: 'Test message that is long enough',
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[MessagingServiceV2.createHelpConversation] RPC error',
        expect.any(Object)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('sendMessage', () => {
    it('calls send_message_v2 RPC with correct params', async () => {
      mockRpc.mockResolvedValue({
        data: { success: true, message_id: 'msg-123' },
        error: null,
      });

      const result = await service.sendMessage({
        conversation_id: '550e8400-e29b-41d4-a716-446655440002',
        sender_id: '550e8400-e29b-41d4-a716-446655440003',
        content: 'This is a test message',
      });

      expect(mockRpc).toHaveBeenCalledWith('send_message_v2', {
        p_conversation_id: '550e8400-e29b-41d4-a716-446655440002',
        p_sender_id: '550e8400-e29b-41d4-a716-446655440003',
        p_content: 'This is a test message',
      });

      expect(result.success).toBe(true);
      expect(result.message_id).toBe('msg-123');
    });

    it('returns error for unauthorized sender', async () => {
      mockRpc.mockResolvedValue({
        data: {
          success: false,
          error: 'permission_denied',
          message: 'Not authorized to send messages in this conversation',
        },
        error: null,
      });

      const result = await service.sendMessage({
        conversation_id: '550e8400-e29b-41d4-a716-446655440002',
        sender_id: '550e8400-e29b-41d4-a716-446655440003',
        content: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('permission_denied');
    });

    it('returns error for conversation not found', async () => {
      mockRpc.mockResolvedValue({
        data: {
          success: false,
          error: 'not_found',
          message: 'Conversation not found',
        },
        error: null,
      });

      const result = await service.sendMessage({
        conversation_id: '550e8400-e29b-41d4-a716-446655440002',
        sender_id: '550e8400-e29b-41d4-a716-446655440003',
        content: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('not_found');
    });

    it('validates message content (empty)', async () => {
      await expect(
        service.sendMessage({
          conversation_id: '550e8400-e29b-41d4-a716-446655440002',
          sender_id: '550e8400-e29b-41d4-a716-446655440003',
          content: '',
        })
      ).rejects.toThrow();
    });

    it('validates message content (too long)', async () => {
      const longContent = 'a'.repeat(1001);

      await expect(
        service.sendMessage({
          conversation_id: '550e8400-e29b-41d4-a716-446655440002',
          sender_id: '550e8400-e29b-41d4-a716-446655440003',
          content: longContent,
        })
      ).rejects.toThrow();
    });

    it('validates UUID format for conversation_id', async () => {
      await expect(
        service.sendMessage({
          conversation_id: 'invalid-uuid',
          sender_id: '550e8400-e29b-41d4-a716-446655440003',
          content: 'Test message',
        })
      ).rejects.toThrow();
    });

    it('validates UUID format for sender_id', async () => {
      await expect(
        service.sendMessage({
          conversation_id: '550e8400-e29b-41d4-a716-446655440002',
          sender_id: 'not-a-uuid',
          content: 'Test message',
        })
      ).rejects.toThrow();
    });

    it('handles RPC database errors', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Connection timeout', code: 'TIMEOUT' },
      });

      const result = await service.sendMessage({
        conversation_id: '550e8400-e29b-41d4-a716-446655440002',
        sender_id: '550e8400-e29b-41d4-a716-446655440003',
        content: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('rpc_error');
      expect(result.details).toBe('Connection timeout');
    });

    it('logs error when RPC fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'PGRST301' },
      });

      await service.sendMessage({
        conversation_id: '550e8400-e29b-41d4-a716-446655440002',
        sender_id: '550e8400-e29b-41d4-a716-446655440003',
        content: 'Test message',
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[MessagingServiceV2.sendMessage] RPC error',
        expect.any(Object)
      );

      consoleErrorSpy.mockRestore();
    });

    it('logs warning when business logic error occurs', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockRpc.mockResolvedValue({
        data: {
          success: false,
          error: 'permission_denied',
          message: 'Not authorized',
        },
        error: null,
      });

      await service.sendMessage({
        conversation_id: '550e8400-e29b-41d4-a716-446655440002',
        sender_id: '550e8400-e29b-41d4-a716-446655440003',
        content: 'Test message',
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[MessagingServiceV2.sendMessage] Business logic error',
        expect.any(Object)
      );

      consoleWarnSpy.mockRestore();
    });

    it('allows minimum valid message length (1 character)', async () => {
      mockRpc.mockResolvedValue({
        data: { success: true, message_id: 'msg-456' },
        error: null,
      });

      const result = await service.sendMessage({
        conversation_id: '550e8400-e29b-41d4-a716-446655440002',
        sender_id: '550e8400-e29b-41d4-a716-446655440003',
        content: 'a',
      });

      expect(result.success).toBe(true);
    });

    it('allows maximum valid message length (1000 characters)', async () => {
      const validMessage = 'a'.repeat(1000);
      mockRpc.mockResolvedValue({
        data: { success: true, message_id: 'msg-789' },
        error: null,
      });

      const result = await service.sendMessage({
        conversation_id: '550e8400-e29b-41d4-a716-446655440002',
        sender_id: '550e8400-e29b-41d4-a716-446655440003',
        content: validMessage,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('getConversation', () => {
    it('calls get_conversation_v2 RPC with correct params', async () => {
      mockRpc.mockResolvedValue({
        data: {
          success: true,
          conversation: { id: 'conv-123', status: 'active' },
          messages: [
            { id: 'msg-1', content: 'Hello' },
            { id: 'msg-2', content: 'Hi there' },
          ],
        },
        error: null,
      });

      const result = await service.getConversation(
        'conv-123',
        '550e8400-e29b-41d4-a716-446655440004'
      );

      expect(mockRpc).toHaveBeenCalledWith('get_conversation_v2', {
        p_conversation_id: 'conv-123',
        p_user_id: '550e8400-e29b-41d4-a716-446655440004',
      });

      expect(result.success).toBe(true);
      expect(result.conversation).toBeDefined();
      expect(result.messages).toHaveLength(2);
    });

    it('returns error for conversation not found', async () => {
      mockRpc.mockResolvedValue({
        data: {
          success: false,
          error: 'not_found',
          message: 'Conversation not found or you do not have access',
        },
        error: null,
      });

      const result = await service.getConversation(
        'conv-999',
        '550e8400-e29b-41d4-a716-446655440004'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('not_found');
    });

    it('handles RPC database errors', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Connection timeout', code: 'TIMEOUT' },
      });

      const result = await service.getConversation(
        'conv-123',
        '550e8400-e29b-41d4-a716-446655440004'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('rpc_error');
    });

    it('returns conversation with multiple messages', async () => {
      mockRpc.mockResolvedValue({
        data: {
          success: true,
          conversation: {
            id: 'conv-456',
            status: 'active',
            created_at: '2025-01-15T10:00:00Z',
          },
          messages: [
            { id: 'msg-1', content: 'First message', created_at: '2025-01-15T10:05:00Z' },
            { id: 'msg-2', content: 'Second message', created_at: '2025-01-15T10:10:00Z' },
            { id: 'msg-3', content: 'Third message', created_at: '2025-01-15T10:15:00Z' },
          ],
        },
        error: null,
      });

      const result = await service.getConversation(
        'conv-456',
        '550e8400-e29b-41d4-a716-446655440004'
      );

      expect(result.success).toBe(true);
      expect(result.messages).toHaveLength(3);
      expect(result.conversation.id).toBe('conv-456');
    });

    it('logs error when RPC fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      await service.getConversation(
        'conv-123',
        '550e8400-e29b-41d4-a716-446655440004'
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[MessagingServiceV2.getConversation] RPC error',
        expect.any(Object)
      );

      consoleErrorSpy.mockRestore();
    });

    it('returns empty messages array when no messages exist', async () => {
      mockRpc.mockResolvedValue({
        data: {
          success: true,
          conversation: { id: 'conv-empty', status: 'active' },
          messages: [],
        },
        error: null,
      });

      const result = await service.getConversation(
        'conv-empty',
        '550e8400-e29b-41d4-a716-446655440004'
      );

      expect(result.success).toBe(true);
      expect(result.messages).toEqual([]);
    });

    it('returns error for permission denied', async () => {
      mockRpc.mockResolvedValue({
        data: {
          success: false,
          error: 'permission_denied',
          message: 'You do not have access to this conversation',
        },
        error: null,
      });

      const result = await service.getConversation(
        'conv-123',
        '550e8400-e29b-41d4-a716-446655440005'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('permission_denied');
    });
  });

  describe('singleton instance', () => {
    it('exports a singleton instance', () => {
      expect(messagingServiceV2).toBeInstanceOf(MessagingServiceV2);
    });

    it('singleton instance has all required methods', () => {
      expect(typeof messagingServiceV2.createHelpConversation).toBe('function');
      expect(typeof messagingServiceV2.sendMessage).toBe('function');
      expect(typeof messagingServiceV2.getConversation).toBe('function');
    });
  });

  describe('Zod schema validation', () => {
    describe('V2CreateConversationSchema', () => {
      it('validates correct input', () => {
        const { V2CreateConversationSchema } = require('./service-v2');
        const validInput = {
          help_request_id: '550e8400-e29b-41d4-a716-446655440000',
          helper_id: '550e8400-e29b-41d4-a716-446655440001',
          initial_message: 'This is a valid message',
        };

        expect(() => V2CreateConversationSchema.parse(validInput)).not.toThrow();
      });

      it('rejects message shorter than 10 characters', () => {
        const { V2CreateConversationSchema } = require('./service-v2');
        const invalidInput = {
          help_request_id: '550e8400-e29b-41d4-a716-446655440000',
          helper_id: '550e8400-e29b-41d4-a716-446655440001',
          initial_message: 'Short',
        };

        expect(() => V2CreateConversationSchema.parse(invalidInput)).toThrow();
      });
    });

    describe('V2SendMessageSchema', () => {
      it('validates correct input', () => {
        const { V2SendMessageSchema } = require('./service-v2');
        const validInput = {
          conversation_id: '550e8400-e29b-41d4-a716-446655440002',
          sender_id: '550e8400-e29b-41d4-a716-446655440003',
          content: 'Valid message',
        };

        expect(() => V2SendMessageSchema.parse(validInput)).not.toThrow();
      });

      it('rejects empty content', () => {
        const { V2SendMessageSchema } = require('./service-v2');
        const invalidInput = {
          conversation_id: '550e8400-e29b-41d4-a716-446655440002',
          sender_id: '550e8400-e29b-41d4-a716-446655440003',
          content: '',
        };

        expect(() => V2SendMessageSchema.parse(invalidInput)).toThrow();
      });
    });
  });

  describe('Error handling and edge cases', () => {
    it('handles null data with error in createHelpConversation', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Unexpected error', code: 'UNEXPECTED' },
      });

      const result = await service.createHelpConversation({
        help_request_id: '550e8400-e29b-41d4-a716-446655440000',
        helper_id: '550e8400-e29b-41d4-a716-446655440001',
        initial_message: 'Test message that is long enough',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('rpc_error');
    });

    it('handles null data with error in sendMessage', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Unexpected error', code: 'UNEXPECTED' },
      });

      const result = await service.sendMessage({
        conversation_id: '550e8400-e29b-41d4-a716-446655440002',
        sender_id: '550e8400-e29b-41d4-a716-446655440003',
        content: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('rpc_error');
    });

    it('handles null data with error in getConversation', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Unexpected error', code: 'UNEXPECTED' },
      });

      const result = await service.getConversation(
        'conv-123',
        '550e8400-e29b-41d4-a716-446655440004'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('rpc_error');
    });

    it('handles various RPC error codes', async () => {
      const errorCodes = [
        'PGRST301', // DB connection error
        'TIMEOUT', // Network timeout
        'RATE_LIMIT', // Rate limiting
        'INVALID_OPERATION', // Invalid operation
      ];

      for (const errorCode of errorCodes) {
        mockRpc.mockResolvedValue({
          data: null,
          error: { message: `Error with code ${errorCode}`, code: errorCode },
        });

        const result = await service.createHelpConversation({
          help_request_id: '550e8400-e29b-41d4-a716-446655440000',
          helper_id: '550e8400-e29b-41d4-a716-446655440001',
          initial_message: 'Test message that is long enough',
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe('rpc_error');
      }
    });

    it('preserves message content with special characters', async () => {
      const specialMessage = 'Message with emoji 🎉, special chars !@#$%^&*()';
      mockRpc.mockResolvedValue({
        data: { success: true, message_id: 'msg-special' },
        error: null,
      });

      const result = await service.sendMessage({
        conversation_id: '550e8400-e29b-41d4-a716-446655440002',
        sender_id: '550e8400-e29b-41d4-a716-446655440003',
        content: specialMessage,
      });

      expect(mockRpc).toHaveBeenCalledWith(
        'send_message_v2',
        expect.objectContaining({
          p_content: specialMessage,
        })
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Integration scenarios', () => {
    it('handles successful conversation creation with message flow', async () => {
      // Create conversation
      mockRpc.mockResolvedValueOnce({
        data: { success: true, conversation_id: 'conv-flow-test' },
        error: null,
      });

      const createResult = await service.createHelpConversation({
        help_request_id: '550e8400-e29b-41d4-a716-446655440000',
        helper_id: '550e8400-e29b-41d4-a716-446655440001',
        initial_message: 'Initial message for conversation',
      });

      expect(createResult.success).toBe(true);

      // Send follow-up message
      mockRpc.mockResolvedValueOnce({
        data: { success: true, message_id: 'msg-follow-up' },
        error: null,
      });

      const sendResult = await service.sendMessage({
        conversation_id: 'conv-flow-test',
        sender_id: '550e8400-e29b-41d4-a716-446655440001',
        content: 'Follow-up message',
      });

      expect(sendResult.success).toBe(true);

      // Retrieve conversation
      mockRpc.mockResolvedValueOnce({
        data: {
          success: true,
          conversation: { id: 'conv-flow-test', status: 'active' },
          messages: [
            { id: 'msg-1', content: 'Initial message for conversation' },
            { id: 'msg-follow-up', content: 'Follow-up message' },
          ],
        },
        error: null,
      });

      const getResult = await service.getConversation(
        'conv-flow-test',
        '550e8400-e29b-41d4-a716-446655440001'
      );

      expect(getResult.success).toBe(true);
      expect(getResult.messages).toHaveLength(2);
    });
  });
});
