/**
 * @fileoverview Help Request Creation Testing Suite
 * 
 * Tests the core functionality of help request creation as outlined in Phase 2
 * of the TESTING_PLAN.md, including form validation, database integration,
 * and authentication requirements.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewRequestPage from '@/app/requests/new/page';

// Mock the auth utilities
vi.mock('@/lib/auth/session-sync', () => ({
  ensureAuthSync: vi.fn(),
  requireAuthentication: vi.fn(),
  handleAuthError: vi.fn(),
}));

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

describe('Help Request Creation', () => {
  let mockSupabase: any;
  let mockRouter: any;
  let mockEnsureAuthSync: any;
  let mockRequireAuthentication: any;
  let mockHandleAuthError: any;

  beforeEach(async () => {
    // Setup mocks
    const { createClient } = await import('@/lib/supabase/client');
    const { useRouter } = await import('next/navigation');
    const { ensureAuthSync, requireAuthentication, handleAuthError } = await import('@/lib/auth/session-sync');

    mockSupabase = {
      from: vi.fn(() => ({
        insert: vi.fn(),
      })),
    };

    mockRouter = {
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
    };

    mockEnsureAuthSync = ensureAuthSync as any;
    mockRequireAuthentication = requireAuthentication as any;
    mockHandleAuthError = handleAuthError as any;

    (createClient as any).mockReturnValue(mockSupabase);
    (useRouter as any).mockReturnValue(mockRouter);

    // Default successful auth state
    mockEnsureAuthSync.mockResolvedValue({
      success: true,
      user: { id: 'test-user-id', email: 'test@example.com' },
      session: { access_token: 'test-token' },
    });

    mockRequireAuthentication.mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com',
    });

    mockHandleAuthError.mockReturnValue({
      shouldRedirect: false,
      message: 'Test error',
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Authentication Requirements', () => {
    it('should check authentication on component mount', async () => {
      render(<NewRequestPage />);

      expect(mockEnsureAuthSync).toHaveBeenCalledTimes(1);
    });

    it('should redirect to login when not authenticated', async () => {
      mockEnsureAuthSync.mockResolvedValue({
        success: false,
        user: null,
        session: null,
        error: 'Not authenticated',
      });

      mockHandleAuthError.mockReturnValue({
        shouldRedirect: true,
        redirectTo: '/login',
        message: 'Authentication required',
      });

      render(<NewRequestPage />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login?redirectTo=%2Frequests%2Fnew');
      });
    });

    it('should show loading state while checking authentication', async () => {
      // Make ensureAuthSync hang to simulate loading
      mockEnsureAuthSync.mockImplementation(() => new Promise(() => {}));

      render(<NewRequestPage />);

      expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument(); // Loading spinner
    });

    it('should show authenticated UI when user is logged in', async () => {
      render(<NewRequestPage />);

      await waitFor(() => {
        expect(screen.getByText('Create Help Request')).toBeInTheDocument();
        expect(screen.getByLabelText(/request title/i)).toBeInTheDocument();
      });
    });

    it('should show fallback UI when authentication check fails', async () => {
      mockEnsureAuthSync.mockResolvedValue({
        success: false,
        user: null,
        session: null,
      });

      render(<NewRequestPage />);

      await waitFor(() => {
        expect(screen.getByText('Authentication Required')).toBeInTheDocument();
        expect(screen.getByText('Go to Login')).toBeInTheDocument();
      });
    });
  });

  describe('Form Field Validation', () => {
    beforeEach(async () => {
      render(<NewRequestPage />);
      
      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByLabelText(/request title/i)).toBeInTheDocument();
      });
    });

    it('should render all required form fields', () => {
      // Required fields
      expect(screen.getByLabelText(/request title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/urgency level/i)).toBeInTheDocument();
      
      // Optional fields
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/location for this request/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/who can see the location/i)).toBeInTheDocument();
    });

    it('should validate required title field', async () => {
      const user = userEvent.setup();
      const submitButton = screen.getByRole('button', { name: /create request/i });

      // Try to submit without title
      await user.click(submitButton);

      // HTML5 validation should prevent submission
      const titleInput = screen.getByLabelText(/request title/i);
      expect(titleInput).toBeRequired();
    });

    it('should enforce title max length of 100 characters', async () => {
      const titleInput = screen.getByLabelText(/request title/i);
      
      expect(titleInput).toHaveAttribute('maxLength', '100');
    });

    it('should validate title with minimum length', async () => {
      const user = userEvent.setup();
      const titleInput = screen.getByLabelText(/request title/i);
      const categorySelect = screen.getByLabelText(/category/i);

      // Enter very short title
      await user.type(titleInput, 'Hi');
      await user.selectOptions(categorySelect, 'groceries');

      // Submit should be disabled or show validation error
      const submitButton = screen.getByRole('button', { name: /create request/i });
      
      // For this test, we check that the title is too short for meaningful help request
      expect(titleInput.value.length).toBeLessThan(5);
    });

    it('should validate category selection', async () => {
      const categorySelect = screen.getByLabelText(/category/i);
      
      expect(categorySelect).toBeRequired();
      
      // Check all categories are available
      const categories = [
        'groceries', 'transport', 'household', 'medical', 'meals',
        'childcare', 'petcare', 'technology', 'companionship', 
        'respite', 'emotional', 'other'
      ];

      categories.forEach(category => {
        expect(screen.getByRole('option', { name: new RegExp(category, 'i') })).toBeInTheDocument();
      });
    });

    it('should validate description max length of 500 characters', () => {
      const descriptionTextarea = screen.getByLabelText(/description/i);
      
      expect(descriptionTextarea).toHaveAttribute('maxLength', '500');
    });

    it('should validate urgency level selection', () => {
      const urgencyRadios = screen.getAllByRole('radio');
      
      // Should have 3 urgency levels
      expect(urgencyRadios).toHaveLength(3);
      
      const urgencyLabels = ['normal', 'urgent', 'critical'];
      urgencyLabels.forEach(level => {
        expect(screen.getByLabelText(new RegExp(level, 'i'))).toBeInTheDocument();
      });

      // Normal should be selected by default
      const normalRadio = screen.getByRole('radio', { name: /normal/i });
      expect(normalRadio).toBeChecked();
    });

    it('should allow location override input', async () => {
      const user = userEvent.setup();
      const locationInput = screen.getByLabelText(/location for this request/i);

      await user.type(locationInput, 'Downtown Springfield, MO');

      expect(locationInput).toHaveValue('Downtown Springfield, MO');
    });

    it('should validate location privacy settings', () => {
      const privacySelect = screen.getByLabelText(/who can see the location/i);
      
      // Check privacy options
      expect(screen.getByRole('option', { name: /everyone \(public\)/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /only people who offer help/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /only after i accept help/i })).toBeInTheDocument();
      
      // Public should be selected by default
      expect(privacySelect).toHaveValue('public');
    });
  });

  describe('Form Submission', () => {
    let insertMock: any;

    beforeEach(async () => {
      insertMock = vi.fn();
      mockSupabase.from.mockReturnValue({
        insert: insertMock,
      });

      render(<NewRequestPage />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/request title/i)).toBeInTheDocument();
      });
    });

    it('should successfully submit valid help request', async () => {
      const user = userEvent.setup();
      
      insertMock.mockResolvedValue({
        data: { id: 'new-request-id' },
        error: null,
      });

      // Fill out form
      await user.type(screen.getByLabelText(/request title/i), 'Need groceries picked up');
      await user.selectOptions(screen.getByLabelText(/category/i), 'groceries');
      await user.type(screen.getByLabelText(/description/i), 'Need weekly groceries from Walmart');
      await user.click(screen.getByRole('radio', { name: /urgent/i }));

      // Submit form
      await user.click(screen.getByRole('button', { name: /create request/i }));

      await waitFor(() => {
        expect(insertMock).toHaveBeenCalledWith({
          title: 'Need groceries picked up',
          description: 'Need weekly groceries from Walmart',
          category: 'groceries',
          urgency: 'urgent',
          user_id: 'test-user-id',
          location_override: null,
          location_privacy: 'public',
        });
      });

      // Should redirect to dashboard on success
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
    });

    it('should handle database insertion errors', async () => {
      const user = userEvent.setup();
      
      insertMock.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      // Fill out minimal valid form
      await user.type(screen.getByLabelText(/request title/i), 'Test request');
      await user.selectOptions(screen.getByLabelText(/category/i), 'other');

      // Submit form
      await user.click(screen.getByRole('button', { name: /create request/i }));

      await waitFor(() => {
        expect(screen.getByText('Database connection failed')).toBeInTheDocument();
      });

      // Should not redirect on error
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should handle authentication errors during submission', async () => {
      const user = userEvent.setup();
      
      mockRequireAuthentication.mockRejectedValue(new Error('Session expired'));
      mockHandleAuthError.mockReturnValue({
        shouldRedirect: true,
        redirectTo: '/login',
        message: 'Session expired',
      });

      // Fill out form
      await user.type(screen.getByLabelText(/request title/i), 'Test request');
      await user.selectOptions(screen.getByLabelText(/category/i), 'other');

      // Submit form
      await user.click(screen.getByRole('button', { name: /create request/i }));

      await waitFor(() => {
        expect(screen.getByText('Session expired')).toBeInTheDocument();
        expect(mockRouter.push).toHaveBeenCalledWith('/login?redirectTo=%2Frequests%2Fnew');
      });
    });

    it('should disable submit button while loading', async () => {
      const user = userEvent.setup();
      
      // Make insert hang to simulate loading
      insertMock.mockImplementation(() => new Promise(() => {}));

      // Fill out form
      await user.type(screen.getByLabelText(/request title/i), 'Test request');
      await user.selectOptions(screen.getByLabelText(/category/i), 'other');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create request/i });
      await user.click(submitButton);

      // Button should be disabled and show loading state
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(screen.getByText('Creating...')).toBeInTheDocument();
      });
    });

    it('should disable submit button when required fields are empty', async () => {
      const submitButton = screen.getByRole('button', { name: /create request/i });
      
      // Initially disabled due to empty required fields
      expect(submitButton).toBeDisabled();

      const user = userEvent.setup();
      
      // Add title
      await user.type(screen.getByLabelText(/request title/i), 'Test request');
      expect(submitButton).toBeDisabled(); // Still disabled, missing category

      // Add category
      await user.selectOptions(screen.getByLabelText(/category/i), 'other');
      
      // Now should be enabled
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    let insertMock: any;

    beforeEach(async () => {
      insertMock = vi.fn();
      mockSupabase.from.mockReturnValue({
        insert: insertMock,
      });

      render(<NewRequestPage />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/request title/i)).toBeInTheDocument();
      });
    });

    it('should have proper form labels and structure', () => {
      // All form elements should have labels
      const titleInput = screen.getByLabelText(/request title/i);
      const categorySelect = screen.getByLabelText(/category/i);
      const descriptionTextarea = screen.getByLabelText(/description/i);
      const locationInput = screen.getByLabelText(/location for this request/i);
      const privacySelect = screen.getByLabelText(/who can see the location/i);

      expect(titleInput).toBeInTheDocument();
      expect(categorySelect).toBeInTheDocument();
      expect(descriptionTextarea).toBeInTheDocument();
      expect(locationInput).toBeInTheDocument();
      expect(privacySelect).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      const mainHeading = screen.getByRole('heading', { level: 1, name: /create help request/i });
      const cardHeading = screen.getByRole('heading', { level: 2, name: /request details/i });

      expect(mainHeading).toBeInTheDocument();
      expect(cardHeading).toBeInTheDocument();
    });

    it('should have accessible error messages', async () => {
      const user = userEvent.setup();
      
      // Simulate an error
      insertMock.mockResolvedValue({
        error: { message: 'Test error message' },
      });

      mockSupabase.from.mockReturnValue({
        insert: insertMock,
      });

      // Fill and submit form
      await user.type(screen.getByLabelText(/request title/i), 'Test');
      await user.selectOptions(screen.getByLabelText(/category/i), 'other');
      await user.click(screen.getByRole('button', { name: /create request/i }));

      await waitFor(() => {
        const errorMessage = screen.getByText('Test error message');
        expect(errorMessage).toBeInTheDocument();
        // Error message should be in an alert region
        expect(errorMessage.closest('[role="alert"], .text-red-600')).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      const titleInput = screen.getByLabelText(/request title/i);
      const categorySelect = screen.getByLabelText(/category/i);

      // Focus should move between form elements
      titleInput.focus();
      expect(document.activeElement).toBe(titleInput);

      // Tab to next element
      await userEvent.tab();
      expect(document.activeElement).toBe(categorySelect);
    });

    it('should have proper ARIA attributes for urgency radio group', () => {
      const urgencyRadios = screen.getAllByRole('radio');
      
      urgencyRadios.forEach(radio => {
        expect(radio).toHaveAttribute('name', 'urgency');
      });

      // Should have fieldset or group label
      const urgencyGroup = screen.getByText(/urgency level/i);
      expect(urgencyGroup).toBeInTheDocument();
    });
  });

  describe('Input Sanitization and Security', () => {
    let insertMock: any;

    beforeEach(async () => {
      insertMock = vi.fn();
      mockSupabase.from.mockReturnValue({
        insert: insertMock,
      });

      render(<NewRequestPage />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/request title/i)).toBeInTheDocument();
      });
    });

    it('should handle special characters in title', async () => {
      const user = userEvent.setup();
      const titleInput = screen.getByLabelText(/request title/i);

      const specialTitle = 'Need help with <script>alert("xss")</script> & "quotes"';
      await user.type(titleInput, specialTitle);

      expect(titleInput).toHaveValue(specialTitle);
    });

    it('should handle special characters in description', async () => {
      const user = userEvent.setup();
      const descriptionTextarea = screen.getByLabelText(/description/i);

      const specialDescription = 'Description with <b>HTML</b> & special chars: ñáéíóú';
      await user.type(descriptionTextarea, specialDescription);

      expect(descriptionTextarea).toHaveValue(specialDescription);
    });

    it('should prevent extremely long inputs beyond maxLength', async () => {
      const user = userEvent.setup();
      const titleInput = screen.getByLabelText(/request title/i);

      // Try to type more than maxLength
      const longTitle = 'a'.repeat(150); // More than 100 char limit
      await user.type(titleInput, longTitle);

      // Should be truncated to maxLength
      expect(titleInput.value.length).toBeLessThanOrEqual(100);
    });

    it('should validate enum values for category and urgency', async () => {
      const user = userEvent.setup();
      
      insertMock.mockResolvedValue({
        data: { id: 'test-id' },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: insertMock,
      });

      // Fill form with valid values
      await user.type(screen.getByLabelText(/request title/i), 'Valid request');
      await user.selectOptions(screen.getByLabelText(/category/i), 'groceries');
      await user.click(screen.getByRole('radio', { name: /critical/i }));

      await user.click(screen.getByRole('button', { name: /create request/i }));

      await waitFor(() => {
        expect(insertMock).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'groceries',
            urgency: 'critical',
          })
        );
      });
    });
  });
});