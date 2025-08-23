/**
 * @fileoverview Tests for ContactExchange component
 * Tests privacy-critical contact sharing and Care Collective safety requirements
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/tests/utils';
import { ContactExchange } from './ContactExchange';
import { mockSupabaseClient } from '@/tests/mocks/supabase';

// Mock the Supabase modules before importing component
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}));

describe('ContactExchange Component', () => {
  const defaultProps = {
    requestId: '123e4567-e89b-12d3-a456-426614174000',
    helperId: '456e7890-e89b-12d3-a456-426614174001',
    requesterId: '789e0123-e89b-12d3-a456-426614174002',
    isHelper: true,
    isRequester: false,
  };

  const mockContactInfo = {
    id: '789e0123-e89b-12d3-a456-426614174002',
    name: 'Alice Johnson',
    location: 'Springfield, MO',
    phone: '555-0123',
    contact_preferences: {
      show_email: true,
      show_phone: false,
      preferred_contact: 'email'
    }
  };

  const mockUser = {
    id: '789e0123-e89b-12d3-a456-426614174002',
    email: 'alice@example.com'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default successful responses
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockContactInfo, error: null }),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    mockSupabaseClient.auth = {
      ...mockSupabaseClient.auth,
      admin: {
        listUsers: vi.fn().mockResolvedValue({
          data: { users: [mockUser] },
          error: null
        })
      }
    };
  });

  describe('Privacy Protection (CRITICAL)', () => {
    it('only displays contact info to authorized participants', () => {
      render(
        <ContactExchange 
          {...defaultProps}
          isHelper={false}
          isRequester={false}
        />
      );
      
      // Should not render anything for non-participants
      expect(screen.queryByText('Contact Shared')).not.toBeInTheDocument();
    });

    it('displays contact info only when user is helper', async () => {
      render(<ContactExchange {...defaultProps} isHelper={true} isRequester={false} />);
      
      await waitFor(() => {
        expect(screen.getByText('Requester Contact Info')).toBeInTheDocument();
      });
    });

    it('displays contact info only when user is requester', async () => {
      render(
        <ContactExchange 
          {...defaultProps} 
          isHelper={false} 
          isRequester={true} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Helper Contact Info')).toBeInTheDocument();
      });
    });

    it('respects user privacy preferences for email sharing', async () => {
      render(<ContactExchange {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('alice@example.com')).toBeInTheDocument();
      });
    });

    it('respects user privacy preferences for phone hiding', async () => {
      render(<ContactExchange {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('555-0123')).not.toBeInTheDocument();
      });
    });

    it('records contact exchange for audit trail', async () => {
      render(<ContactExchange {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('contact_exchanges');
      });

      // Verify audit trail data
      const upsertCall = mockSupabaseClient.from().upsert;
      expect(upsertCall).toHaveBeenCalledWith(
        expect.objectContaining({
          request_id: defaultProps.requestId,
          helper_id: defaultProps.helperId,
          requester_id: defaultProps.requesterId,
          exchange_type: 'display',
          contact_shared: expect.objectContaining({
            email_shared: true,
            phone_shared: false,
            timestamp: expect.any(String)
          })
        })
      );
    });
  });

  describe('Contact Information Display', () => {
    it('displays contact information correctly', async () => {
      render(<ContactExchange {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
        expect(screen.getByText('Springfield, MO')).toBeInTheDocument();
        expect(screen.getByText('alice@example.com')).toBeInTheDocument();
      });
    });

    it('creates clickable email link', async () => {
      render(<ContactExchange {...defaultProps} />);
      
      await waitFor(() => {
        const emailLink = screen.getByRole('link', { name: 'alice@example.com' });
        expect(emailLink).toHaveAttribute('href', 'mailto:alice@example.com');
      });
    });

    it('displays phone when user allows phone sharing', async () => {
      const phoneVisibleContact = {
        ...mockContactInfo,
        contact_preferences: {
          show_email: true,
          show_phone: true,
          preferred_contact: 'phone'
        }
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: phoneVisibleContact, error: null }),
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      render(<ContactExchange {...defaultProps} />);
      
      await waitFor(() => {
        const phoneLink = screen.getByRole('link', { name: '555-0123' });
        expect(phoneLink).toHaveAttribute('href', 'tel:555-0123');
      });
    });

    it('displays preferred contact method', async () => {
      render(<ContactExchange {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Preferred contact method:/)).toBeInTheDocument();
        expect(screen.getByText(/email/)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('displays loading state initially', () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => new Promise(() => {})), // Never resolves
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      render(<ContactExchange {...defaultProps} />);
      
      expect(screen.getByText('Loading contact information...')).toBeInTheDocument();
    });

    it('displays error state when contact fetch fails', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Profile not found' } 
        }),
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      render(<ContactExchange {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load contact information')).toBeInTheDocument();
      });
    });

    it('displays fallback when contact info is null', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      render(<ContactExchange {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load contact information')).toBeInTheDocument();
      });
    });
  });

  describe('Care Collective Branding and Safety', () => {
    it('uses Care Collective color scheme', async () => {
      render(<ContactExchange {...defaultProps} />);
      
      await waitFor(() => {
        const card = screen.getByText('Contact Shared').closest('.border-sage\\/30');
        expect(card).toBeInTheDocument();
        
        const badge = screen.getByText('Contact Shared');
        expect(badge).toHaveClass('bg-sage');
        expect(badge).toHaveClass('text-white');
      });
    });

    it('displays safety reminder message', async () => {
      render(<ContactExchange {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Remember:/)).toBeInTheDocument();
        expect(screen.getByText(/Please be respectful when reaching out/)).toBeInTheDocument();
        expect(screen.getByText(/maintain clear communication/)).toBeInTheDocument();
      });
    });

    it('provides guidance for coordination', async () => {
      render(<ContactExchange {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Use this information to coordinate assistance')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', async () => {
      render(<ContactExchange {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { 
          name: 'Requester Contact Info' 
        })).toBeInTheDocument();
      });
    });

    it('provides proper labels for contact information', async () => {
      render(<ContactExchange {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(screen.getByText('Location')).toBeInTheDocument();
      });
    });

    it('creates accessible links for contact methods', async () => {
      render(<ContactExchange {...defaultProps} />);
      
      await waitFor(() => {
        const emailLink = screen.getByRole('link', { name: 'alice@example.com' });
        expect(emailLink).toBeInTheDocument();
        expect(emailLink).toHaveAttribute('href', 'mailto:alice@example.com');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles missing contact preferences gracefully', async () => {
      const contactWithoutPrefs = {
        ...mockContactInfo,
        contact_preferences: null
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: contactWithoutPrefs, error: null }),
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      render(<ContactExchange {...defaultProps} />);
      
      await waitFor(() => {
        // Should fall back to default preferences (email visible, phone hidden)
        expect(screen.getByText('alice@example.com')).toBeInTheDocument();
        expect(screen.queryByText('555-0123')).not.toBeInTheDocument();
      });
    });

    it('handles auth service errors gracefully', async () => {
      mockSupabaseClient.auth.admin.listUsers = vi.fn().mockResolvedValue({
        data: { users: [] },
        error: null
      });

      render(<ContactExchange {...defaultProps} />);
      
      await waitFor(() => {
        // Should still show name and location
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
        expect(screen.getByText('Springfield, MO')).toBeInTheDocument();
        // Email should not be shown since user not found
        expect(screen.queryByText('alice@example.com')).not.toBeInTheDocument();
      });
    });
  });

  describe('Component Props Validation', () => {
    it('shows appropriate content for helper viewing requester info', async () => {
      render(
        <ContactExchange 
          {...defaultProps}
          isHelper={true}
          isRequester={false}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Requester Contact Info')).toBeInTheDocument();
      });
    });

    it('shows appropriate content for requester viewing helper info', async () => {
      render(
        <ContactExchange 
          {...defaultProps}
          isHelper={false}
          isRequester={true}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Helper Contact Info')).toBeInTheDocument();
      });
    });
  });
});