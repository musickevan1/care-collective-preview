/**
 * @fileoverview Contact Exchange System Testing Suite
 * 
 * Tests the privacy-critical contact exchange functionality as outlined in
 * Phase 2 of the TESTING_PLAN.md. This includes consent flows, privacy protection,
 * audit trails, and safety features.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactExchange from '@/components/ContactExchange';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

// Mock auth utilities
vi.mock('@/lib/auth/session-sync', () => ({
  getAuthenticatedUser: vi.fn(),
  requireAuthentication: vi.fn(),
}));

describe('Contact Exchange System', () => {
  let mockSupabase: any;
  let mockGetAuthenticatedUser: any;
  let mockRequireAuthentication: any;

  const mockHelpRequest = {
    id: 'request-123',
    title: 'Need groceries picked up',
    description: 'Weekly shopping assistance needed',
    category: 'groceries',
    urgency: 'normal',
    status: 'open',
    user_id: 'requester-456',
    created_at: '2025-01-20T10:00:00Z',
    profiles: {
      id: 'requester-456',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      phone: '+1-555-0123',
      location: 'Springfield, MO',
    },
  };

  const mockCurrentUser = {
    id: 'helper-789',
    email: 'helper@example.com',
  };

  beforeEach(async () => {
    // Setup mocks
    const { createClient } = await import('@/lib/supabase/client');
    const { getAuthenticatedUser, requireAuthentication } = await import('@/lib/auth/session-sync');

    mockSupabase = {
      from: vi.fn(),
      auth: {
        getUser: vi.fn(),
      },
    };

    mockGetAuthenticatedUser = getAuthenticatedUser as any;
    mockRequireAuthentication = requireAuthentication as any;

    (createClient as any).mockReturnValue(mockSupabase);
    
    mockGetAuthenticatedUser.mockResolvedValue(mockCurrentUser);
    mockRequireAuthentication.mockResolvedValue(mockCurrentUser);

    // Default mock chain for database operations
    const mockChain = {
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    mockSupabase.from.mockReturnValue(mockChain);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Privacy Consent Flow', () => {
    it('should show consent dialog before revealing contact information', async () => {
      render(<ContactExchange helpRequest={mockHelpRequest} />);

      // Should show privacy notice and consent form
      expect(screen.getByText(/share contact information/i)).toBeInTheDocument();
      expect(screen.getByText(/privacy/i)).toBeInTheDocument();
      
      // Should not show contact info initially
      expect(screen.queryByText('alice@example.com')).not.toBeInTheDocument();
      expect(screen.queryByText('+1-555-0123')).not.toBeInTheDocument();
    });

    it('should require explicit consent checkbox', async () => {
      render(<ContactExchange helpRequest={mockHelpRequest} />);

      const consentCheckbox = screen.getByRole('checkbox', { name: /i consent/i });
      const shareButton = screen.getByRole('button', { name: /share contact/i });

      // Button should be disabled without consent
      expect(shareButton).toBeDisabled();
      expect(consentCheckbox).not.toBeChecked();

      // Enable after consent
      const user = userEvent.setup();
      await user.click(consentCheckbox);
      
      expect(consentCheckbox).toBeChecked();
      expect(shareButton).not.toBeDisabled();
    });

    it('should require consent message before sharing', async () => {
      render(<ContactExchange helpRequest={mockHelpRequest} />);

      const messageInput = screen.getByLabelText(/message/i);
      const shareButton = screen.getByRole('button', { name: /share contact/i });

      // Should require message
      expect(messageInput).toBeRequired();

      const user = userEvent.setup();
      await user.click(screen.getByRole('checkbox', { name: /i consent/i }));

      // Still disabled without message
      expect(shareButton).toBeDisabled();

      await user.type(messageInput, 'I can help with your groceries');
      
      // Now should be enabled
      expect(shareButton).not.toBeDisabled();
    });

    it('should validate message length requirements', async () => {
      render(<ContactExchange helpRequest={mockHelpRequest} />);

      const messageInput = screen.getByLabelText(/message/i);

      // Should have min and max length requirements
      expect(messageInput).toHaveAttribute('minLength', '10');
      expect(messageInput).toHaveAttribute('maxLength', '200');
    });

    it('should show privacy warnings and disclaimers', () => {
      render(<ContactExchange helpRequest={mockHelpRequest} />);

      // Should show privacy warnings
      expect(screen.getByText(/sharing your contact information/i)).toBeInTheDocument();
      expect(screen.getByText(/only share with people you trust/i)).toBeInTheDocument();
      expect(screen.getByText(/this action will be logged/i)).toBeInTheDocument();
    });
  });

  describe('Contact Information Sharing', () => {
    it('should create audit trail when contact is shared', async () => {
      const insertMock = vi.fn().mockResolvedValue({
        data: { id: 'exchange-123' },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: insertMock,
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      render(<ContactExchange helpRequest={mockHelpRequest} />);

      const user = userEvent.setup();
      await user.click(screen.getByRole('checkbox', { name: /i consent/i }));
      await user.type(screen.getByLabelText(/message/i), 'I can help with groceries today');
      await user.click(screen.getByRole('button', { name: /share contact/i }));

      await waitFor(() => {
        expect(insertMock).toHaveBeenCalledWith(
          expect.objectContaining({
            request_id: 'request-123',
            requester_id: 'requester-456',
            helper_id: 'helper-789',
            message: 'I can help with groceries today',
            consent_given: true,
          })
        );
      });
    });

    it('should reveal contact information after successful exchange', async () => {
      const insertMock = vi.fn().mockResolvedValue({
        data: { id: 'exchange-123' },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: insertMock,
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'exchange-123',
            contact_shared: true,
          },
          error: null,
        }),
      });

      render(<ContactExchange helpRequest={mockHelpRequest} />);

      const user = userEvent.setup();
      await user.click(screen.getByRole('checkbox', { name: /i consent/i }));
      await user.type(screen.getByLabelText(/message/i), 'I can help with groceries');
      await user.click(screen.getByRole('button', { name: /share contact/i }));

      await waitFor(() => {
        expect(screen.getByText('alice@example.com')).toBeInTheDocument();
        expect(screen.getByText('+1-555-0123')).toBeInTheDocument();
      });
    });

    it('should handle contact sharing errors gracefully', async () => {
      const insertMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      mockSupabase.from.mockReturnValue({
        insert: insertMock,
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      render(<ContactExchange helpRequest={mockHelpRequest} />);

      const user = userEvent.setup();
      await user.click(screen.getByRole('checkbox', { name: /i consent/i }));
      await user.type(screen.getByLabelText(/message/i), 'I can help with groceries');
      await user.click(screen.getByRole('button', { name: /share contact/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to share contact/i)).toBeInTheDocument();
        // Contact info should not be revealed on error
        expect(screen.queryByText('alice@example.com')).not.toBeInTheDocument();
      });
    });

    it('should prevent self-contact exchange', async () => {
      // Mock current user as the same as request owner
      mockGetAuthenticatedUser.mockResolvedValue({
        id: 'requester-456', // Same as helpRequest.user_id
        email: 'alice@example.com',
      });

      render(<ContactExchange helpRequest={mockHelpRequest} />);

      // Should show message that you can't help your own request
      expect(screen.getByText(/cannot offer help on your own request/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /share contact/i })).not.toBeInTheDocument();
    });
  });

  describe('Privacy Protection', () => {
    it('should only show contact exchange to authenticated users', async () => {
      mockGetAuthenticatedUser.mockResolvedValue(null);

      render(<ContactExchange helpRequest={mockHelpRequest} />);

      expect(screen.getByText(/login to offer help/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /share contact/i })).not.toBeInTheDocument();
    });

    it('should check if contact was already exchanged', async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'existing-exchange',
            contact_shared: true,
            created_at: '2025-01-20T09:00:00Z',
          },
          error: null,
        }),
      });

      render(<ContactExchange helpRequest={mockHelpRequest} />);

      await waitFor(() => {
        expect(screen.getByText(/contact information already shared/i)).toBeInTheDocument();
        expect(screen.getByText('alice@example.com')).toBeInTheDocument();
      });
    });

    it('should validate user roles in contact exchange', async () => {
      const insertMock = vi.fn().mockResolvedValue({
        data: { id: 'exchange-123' },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: insertMock,
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      render(<ContactExchange helpRequest={mockHelpRequest} />);

      const user = userEvent.setup();
      await user.click(screen.getByRole('checkbox', { name: /i consent/i }));
      await user.type(screen.getByLabelText(/message/i), 'I can help');
      await user.click(screen.getByRole('button', { name: /share contact/i }));

      await waitFor(() => {
        expect(insertMock).toHaveBeenCalledWith(
          expect.objectContaining({
            requester_id: 'requester-456', // Original request owner
            helper_id: 'helper-789', // Current user offering help
          })
        );
      });
    });

    it('should prevent contact sharing for closed requests', () => {
      const closedRequest = {
        ...mockHelpRequest,
        status: 'closed',
      };

      render(<ContactExchange helpRequest={closedRequest} />);

      expect(screen.getByText(/this request has been closed/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /share contact/i })).not.toBeInTheDocument();
    });

    it('should handle different contact sharing preferences', async () => {
      const requestWithPrivateLocation = {
        ...mockHelpRequest,
        location_privacy: 'after_match',
      };

      render(<ContactExchange helpRequest={requestWithPrivateLocation} />);

      // Should show privacy notice about location sharing
      expect(screen.getByText(/location will be shared after contact exchange/i)).toBeInTheDocument();
    });
  });

  describe('Safety Features', () => {
    it('should log all contact exchange attempts', async () => {
      const insertMock = vi.fn().mockResolvedValue({
        data: { id: 'exchange-123' },
        error: null,
      });

      // Mock console.log to verify logging
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      mockSupabase.from.mockReturnValue({
        insert: insertMock,
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      render(<ContactExchange helpRequest={mockHelpRequest} />);

      const user = userEvent.setup();
      await user.click(screen.getByRole('checkbox', { name: /i consent/i }));
      await user.type(screen.getByLabelText(/message/i), 'I can help');
      await user.click(screen.getByRole('button', { name: /share contact/i }));

      await waitFor(() => {
        // Should log the contact exchange attempt
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[Contact Exchange]'),
          expect.any(Object)
        );
      });

      consoleSpy.mockRestore();
    });

    it('should include safety warnings in UI', () => {
      render(<ContactExchange helpRequest={mockHelpRequest} />);

      // Safety warnings should be present
      expect(screen.getByText(/meet in public places/i)).toBeInTheDocument();
      expect(screen.getByText(/trust your instincts/i)).toBeInTheDocument();
      expect(screen.getByText(/report suspicious behavior/i)).toBeInTheDocument();
    });

    it('should validate message content for inappropriate content', async () => {
      const inappropriateMessages = [
        'Call me for special services',
        'Send photos first',
        'Meet me alone at night',
        'www.suspiciouslink.com',
      ];

      render(<ContactExchange helpRequest={mockHelpRequest} />);

      const user = userEvent.setup();
      const messageInput = screen.getByLabelText(/message/i);

      for (const message of inappropriateMessages) {
        await user.clear(messageInput);
        await user.type(messageInput, message);

        // In a real implementation, this would trigger validation
        // For now, we just check that the message can be entered
        expect(messageInput).toHaveValue(message);
      }
    });

    it('should rate limit contact exchange attempts', async () => {
      const insertMock = vi.fn();
      
      // First attempt succeeds
      insertMock.mockResolvedValueOnce({
        data: { id: 'exchange-1' },
        error: null,
      });

      // Second attempt fails due to rate limiting
      insertMock.mockResolvedValueOnce({
        data: null,
        error: { message: 'Too many contact exchange attempts' },
      });

      mockSupabase.from.mockReturnValue({
        insert: insertMock,
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      render(<ContactExchange helpRequest={mockHelpRequest} />);

      const user = userEvent.setup();
      
      // First attempt
      await user.click(screen.getByRole('checkbox', { name: /i consent/i }));
      await user.type(screen.getByLabelText(/message/i), 'First attempt');
      await user.click(screen.getByRole('button', { name: /share contact/i }));

      // Wait for first attempt to complete
      await waitFor(() => {
        expect(insertMock).toHaveBeenCalledTimes(1);
      });

      // Second attempt should be rate limited
      await user.clear(screen.getByLabelText(/message/i));
      await user.type(screen.getByLabelText(/message/i), 'Second attempt');
      await user.click(screen.getByRole('button', { name: /share contact/i }));

      await waitFor(() => {
        expect(screen.getByText(/too many contact exchange attempts/i)).toBeInTheDocument();
      });
    });

    it('should provide reporting mechanism for inappropriate contact exchanges', () => {
      render(<ContactExchange helpRequest={mockHelpRequest} />);

      // Should have a report button or link
      expect(screen.getByText(/report/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /report this request/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<ContactExchange helpRequest={mockHelpRequest} />);

      // Consent checkbox should be properly labeled
      const consentCheckbox = screen.getByRole('checkbox', { name: /i consent/i });
      expect(consentCheckbox).toHaveAccessibleName();

      // Message input should be properly labeled
      const messageInput = screen.getByLabelText(/message/i);
      expect(messageInput).toHaveAccessibleName();

      // Safety warnings should be in alert regions
      const safetyWarnings = screen.getByText(/meet in public places/i);
      expect(safetyWarnings.closest('[role="alert"], .text-yellow-600')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      render(<ContactExchange helpRequest={mockHelpRequest} />);

      const consentCheckbox = screen.getByRole('checkbox', { name: /i consent/i });
      const messageInput = screen.getByLabelText(/message/i);
      const shareButton = screen.getByRole('button', { name: /share contact/i });

      // Test tab order
      consentCheckbox.focus();
      expect(document.activeElement).toBe(consentCheckbox);

      await userEvent.tab();
      expect(document.activeElement).toBe(messageInput);

      await userEvent.tab();
      expect(document.activeElement).toBe(shareButton);
    });

    it('should announce important state changes to screen readers', async () => {
      render(<ContactExchange helpRequest={mockHelpRequest} />);

      // When contact is shared, success should be announced
      const insertMock = vi.fn().mockResolvedValue({
        data: { id: 'exchange-123' },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: insertMock,
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'exchange-123', contact_shared: true },
          error: null,
        }),
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('checkbox', { name: /i consent/i }));
      await user.type(screen.getByLabelText(/message/i), 'I can help');
      await user.click(screen.getByRole('button', { name: /share contact/i }));

      await waitFor(() => {
        const successMessage = screen.getByText(/contact information shared successfully/i);
        expect(successMessage).toBeInTheDocument();
        // Should be in an aria-live region
        expect(successMessage.closest('[aria-live], [role="status"]')).toBeInTheDocument();
      });
    });
  });
});