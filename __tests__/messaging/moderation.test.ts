/**
 * @fileoverview Tests for content moderation service
 * Tests automated content screening, user scoring, and moderation policies
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Supabase client using vi.hoisted for proper timing
const { mockSupabaseClient } = vi.hoisted(() => {
  const mockSupabaseClient = {
    from: vi.fn(),
    rpc: vi.fn(),
  };
  return { mockSupabaseClient };
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabaseClient,
}));

// Now import the service after mocking
import { ContentModerationService, ContentModerationResult } from '@/lib/messaging/moderation';

describe.skip('ContentModerationService', () => {
  let moderationService: ContentModerationService;
  let mockInsert: any;
  let mockSelect: any;
  let mockUpdate: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSelect = vi.fn().mockReturnThis();
    mockInsert = vi.fn().mockReturnThis();
    mockUpdate = vi.fn().mockReturnThis();
    
    mockSupabaseClient.from.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
    });
    
    moderationService = new ContentModerationService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Content Analysis', () => {
    it('approves clean content', async () => {
      const content = 'Hello, I can help with your grocery shopping request!';
      const result = await moderationService.moderateContent(content, 'user-123');

      expect(result.approved).toBe(true);
      expect(result.flags).toEqual([]);
      expect(result.score).toBeLessThan(0.3);
    });

    it('detects profanity', async () => {
      const content = 'This is a damn test with bad words';
      const result = await moderationService.moderateContent(content, 'user-123');

      expect(result.approved).toBe(false);
      expect(result.flags).toContain('profanity');
      expect(result.score).toBeGreaterThan(0.5);
      expect(result.reason).toContain('inappropriate language');
    });

    it('detects personal information', async () => {
      const content = 'Call me at 555-123-4567 or email test@example.com';
      const result = await moderationService.moderateContent(content, 'user-123');

      expect(result.approved).toBe(false);
      expect(result.flags).toContain('personal_info');
      expect(result.reason).toContain('personal information');
    });

    it('detects phone numbers in various formats', async () => {
      const phoneNumbers = [
        'Call 555-123-4567',
        'Phone: (555) 123-4567',
        'My number is 555.123.4567',
        'Text 5551234567',
        '+1-555-123-4567',
      ];

      for (const content of phoneNumbers) {
        const result = await moderationService.moderateContent(content, 'user-123');
        expect(result.flags).toContain('personal_info');
        expect(result.approved).toBe(false);
      }
    });

    it('detects email addresses', async () => {
      const emailContent = [
        'Email me at user@example.com',
        'Contact: test.user+tag@domain.co.uk',
        'My email is firstname.lastname@company.org',
      ];

      for (const content of emailContent) {
        const result = await moderationService.moderateContent(content, 'user-123');
        expect(result.flags).toContain('personal_info');
        expect(result.approved).toBe(false);
      }
    });

    it('detects spam patterns', async () => {
      const spamContent = [
        'URGENT!!! ACT NOW!!! LIMITED TIME OFFER!!!',
        'Make money fast! Click here now!',
        'FREE FREE FREE - Get rich quick scheme',
        '🔥🔥🔥 AMAZING DEAL 🔥🔥🔥 CLICK NOW!!!',
      ];

      for (const content of spamContent) {
        const result = await moderationService.moderateContent(content, 'user-123');
        expect(result.flags).toContain('spam');
        expect(result.approved).toBe(false);
      }
    });

    it('detects scam attempts', async () => {
      const scamContent = [
        'Send me $100 and I\'ll help you move',
        'Pay upfront fee for guaranteed job',
        'Wire money for emergency assistance',
        'Give me your credit card for verification',
      ];

      for (const content of scamContent) {
        const result = await moderationService.moderateContent(content, 'user-123');
        expect(result.flags).toContain('scam');
        expect(result.approved).toBe(false);
      }
    });

    it('detects harassment language', async () => {
      const harassmentContent = [
        'You\'re such an idiot and waste of space',
        'I hate you and wish you would disappear',
        'Kill yourself, nobody likes you',
      ];

      for (const content of harassmentContent) {
        const result = await moderationService.moderateContent(content, 'user-123');
        expect(result.flags).toContain('harassment');
        expect(result.approved).toBe(false);
      }
    });

    it('handles mixed violations', async () => {
      const content = 'F*** this, call me at 555-1234 for URGENT money making opportunity!!!';
      const result = await moderationService.moderateContent(content, 'user-123');

      expect(result.approved).toBe(false);
      expect(result.flags).toEqual(
        expect.arrayContaining(['profanity', 'personal_info', 'spam'])
      );
      expect(result.score).toBeGreaterThan(0.7);
    });

    it('allows borderline acceptable content', async () => {
      const borderlineContent = [
        'This is a great opportunity to help!',
        'I can assist with your request, contact through app',
        'Available Monday-Friday for grocery help',
      ];

      for (const content of borderlineContent) {
        const result = await moderationService.moderateContent(content, 'user-123');
        expect(result.approved).toBe(true);
        expect(result.score).toBeLessThan(0.5);
      }
    });
  });

  describe('User Reputation Scoring', () => {
    it('calculates user moderation score', async () => {
      const userId = 'user-123';
      
      // Mock user's moderation history
      mockSupabaseClient.rpc.mockResolvedValue({
        data: 0.2, // Low violation rate
        error: null,
      });

      const score = await moderationService.getUserModerationScore(userId);

      expect(score).toBe(0.2);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
        'get_user_moderation_score',
        { user_id: userId }
      );
    });

    it('applies progressive enforcement based on user history', async () => {
      const userId = 'user-repeat-offender';
      
      // Mock high violation rate
      mockSupabaseClient.rpc.mockResolvedValue({
        data: 0.8, // High violation rate
        error: null,
      });

      const content = 'Slightly questionable but not terrible content';
      const result = await moderationService.moderateContent(content, userId);

      // Should be more strict for repeat offenders
      expect(result.approved).toBe(false);
      expect(result.reason).toContain('user history');
    });

    it('is lenient with new users for minor violations', async () => {
      const userId = 'user-new';
      
      // Mock low/no violation history
      mockSupabaseClient.rpc.mockResolvedValue({
        data: 0.0,
        error: null,
      });

      const content = 'Damn, I really need help with this';
      const result = await moderationService.moderateContent(content, userId);

      // Should be more lenient with new users
      expect(result.approved).toBe(true);
      expect(result.flags).toContain('minor_profanity');
      expect(result.reason).toContain('warning');
    });
  });

  describe('Moderation Logging', () => {
    it('logs moderation results', async () => {
      mockInsert.mockResolvedValue({
        data: [{ id: 'log-123' }],
        error: null,
      });

      const content = 'Test content for logging';
      await moderationService.moderateContent(content, 'user-123');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('moderation_logs');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          content: content,
          approved: true,
          flags: [],
          score: expect.any(Number),
        })
      );
    });

    it('logs flagged content with details', async () => {
      mockInsert.mockResolvedValue({
        data: [{ id: 'log-456' }],
        error: null,
      });

      const content = 'This is spam content with phone 555-1234';
      await moderationService.moderateContent(content, 'user-123');

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          approved: false,
          flags: expect.arrayContaining(['spam', 'personal_info']),
          score: expect.any(Number),
          reason: expect.any(String),
        })
      );
    });

    it('handles logging errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockInsert.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      const content = 'Test content';
      const result = await moderationService.moderateContent(content, 'user-123');

      // Should still return moderation result despite logging error
      expect(result.approved).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to log moderation result:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Administrative Actions', () => {
    it('flags user for review', async () => {
      const userId = 'user-problematic';
      const reason = 'Multiple policy violations';

      mockInsert.mockResolvedValue({
        data: [{ id: 'flag-123' }],
        error: null,
      });

      await moderationService.flagUserForReview(userId, reason);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_flags');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          reason: reason,
          status: 'pending',
          flagged_at: expect.any(String),
        })
      );
    });

    it('temporarily restricts user messaging', async () => {
      const userId = 'user-restricted';
      const reason = 'Spam behavior';
      const duration = 24; // 24 hours

      mockInsert.mockResolvedValue({
        data: [{ id: 'restriction-123' }],
        error: null,
      });

      await moderationService.restrictUser(userId, reason, duration);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_restrictions');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          restriction_type: 'messaging',
          reason: reason,
          expires_at: expect.any(String),
        })
      );
    });

    it('checks if user is restricted', async () => {
      const userId = 'user-check';
      
      mockSelect.mockResolvedValue({
        data: [{ 
          id: 'restriction-active',
          restriction_type: 'messaging',
          expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        }],
        error: null,
      });

      const isRestricted = await moderationService.isUserRestricted(userId, 'messaging');

      expect(isRestricted).toBe(true);
    });

    it('handles expired restrictions', async () => {
      const userId = 'user-check';
      
      mockSelect.mockResolvedValue({
        data: [{
          id: 'restriction-expired',
          restriction_type: 'messaging',
          expires_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        }],
        error: null,
      });

      const isRestricted = await moderationService.isUserRestricted(userId, 'messaging');

      expect(isRestricted).toBe(false);
    });
  });

  describe('Content Patterns and Edge Cases', () => {
    it('handles empty content', async () => {
      const result = await moderationService.moderateContent('', 'user-123');

      expect(result.approved).toBe(false);
      expect(result.reason).toContain('empty');
    });

    it('handles very long content', async () => {
      const longContent = 'A'.repeat(2000);
      const result = await moderationService.moderateContent(longContent, 'user-123');

      expect(result.approved).toBe(false);
      expect(result.flags).toContain('excessive_length');
    });

    it('handles special characters and Unicode', async () => {
      const unicodeContent = '🚨 Help needed! 🆘 Emoji content with special chars: ñáéíóú';
      const result = await moderationService.moderateContent(unicodeContent, 'user-123');

      expect(result.approved).toBe(true);
      // Should not flag legitimate Unicode content
    });

    it('detects repeated character spam', async () => {
      const repeatedContent = 'HELLOOOOOOOOOO PLEEEEEEASE HEEEELP MEEEEEE';
      const result = await moderationService.moderateContent(repeatedContent, 'user-123');

      expect(result.flags).toContain('spam');
      expect(result.approved).toBe(false);
    });

    it('allows legitimate urgent requests', async () => {
      const urgentContent = 'URGENT: Need immediate help with medical emergency transport';
      const result = await moderationService.moderateContent(urgentContent, 'user-123');

      expect(result.approved).toBe(true);
      // Should not flag legitimate urgent requests
    });

    it('detects URL sharing attempts', async () => {
      const urlContent = [
        'Visit my website at https://scam-site.com',
        'Check out www.suspicious-link.net',
        'Go to bit.ly/suspicious for more info',
      ];

      for (const content of urlContent) {
        const result = await moderationService.moderateContent(content, 'user-123');
        expect(result.flags).toContain('external_link');
        expect(result.approved).toBe(false);
      }
    });

    it('allows Care Collective related links', async () => {
      const validLinks = [
        'Check the app help section',
        'Refer to community guidelines',
        'Use the emergency resources feature',
      ];

      for (const content of validLinks) {
        const result = await moderationService.moderateContent(content, 'user-123');
        expect(result.approved).toBe(true);
      }
    });
  });

  describe('Contextual Moderation', () => {
    it('applies different rules for help requests vs general chat', async () => {
      const content = 'I can provide transportation for $20';
      
      // Should be flagged in general messaging (payment solicitation)
      const generalResult = await moderationService.moderateContent(
        content, 
        'user-123', 
        { messageType: 'general' }
      );
      expect(generalResult.approved).toBe(false);
      expect(generalResult.flags).toContain('payment_request');

      // Might be acceptable in help request context (legitimate service)
      const helpRequestResult = await moderationService.moderateContent(
        content, 
        'user-123', 
        { messageType: 'help_request', category: 'transport' }
      );
      expect(helpRequestResult.approved).toBe(true);
    });

    it('considers conversation history', async () => {
      const content = 'Thanks for the help yesterday';
      
      // Should be fine with established conversation
      const result = await moderationService.moderateContent(
        content, 
        'user-123',
        { 
          conversationId: 'conv-established',
          messageCount: 15 
        }
      );

      expect(result.approved).toBe(true);
    });

    it('is stricter with new conversations', async () => {
      const content = 'Hey beautiful, want to chat privately?';
      
      const result = await moderationService.moderateContent(
        content, 
        'user-123',
        { 
          conversationId: 'conv-new',
          messageCount: 1 
        }
      );

      expect(result.approved).toBe(false);
      expect(result.flags).toContain('inappropriate');
    });
  });

  describe('Performance and Caching', () => {
    it('caches user scores for performance', async () => {
      const userId = 'user-cache-test';
      
      mockSupabaseClient.rpc.mockResolvedValue({
        data: 0.3,
        error: null,
      });

      // First call
      await moderationService.getUserModerationScore(userId);
      // Second call (should use cache)
      await moderationService.getUserModerationScore(userId);

      // Should only call database once due to caching
      expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(1);
    });

    it('processes content efficiently', async () => {
      const startTime = Date.now();
      
      await moderationService.moderateContent(
        'Standard message content for performance testing',
        'user-123'
      );
      
      const processingTime = Date.now() - startTime;
      
      // Should process quickly (under 100ms for simple content)
      expect(processingTime).toBeLessThan(100);
    });
  });

  describe('Error Handling', () => {
    it('handles database connection errors', async () => {
      mockSupabaseClient.rpc.mockRejectedValue(new Error('Database connection failed'));
      
      const result = await moderationService.moderateContent('Test content', 'user-123');

      // Should default to strict moderation on error
      expect(result.approved).toBe(false);
      expect(result.reason).toContain('error');
    });

    it('handles malformed input gracefully', async () => {
      const malformedInputs = [
        null,
        undefined,
        123,
        { not: 'a string' },
        ['array', 'content'],
      ];

      for (const input of malformedInputs) {
        const result = await moderationService.moderateContent(input as any, 'user-123');
        expect(result.approved).toBe(false);
        expect(result.reason).toContain('invalid');
      }
    });

    it('fails safely with conservative approach', async () => {
      // Mock all external calls to fail
      mockSupabaseClient.rpc.mockRejectedValue(new Error('All systems down'));
      mockInsert.mockRejectedValue(new Error('Cannot log'));
      
      const result = await moderationService.moderateContent('Test content', 'user-123');

      // Should default to rejecting content when systems are down
      expect(result.approved).toBe(false);
      expect(result.reason).toContain('system error');
    });
  });
});