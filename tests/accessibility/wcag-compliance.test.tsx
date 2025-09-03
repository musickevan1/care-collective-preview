/**
 * @fileoverview WCAG 2.1 AA Compliance Testing Suite
 * 
 * Tests accessibility compliance as outlined in Phase 3 of the TESTING_PLAN.md.
 * Ensures the Care Collective platform meets WCAG 2.1 AA standards for 
 * inclusive community access.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations);

// Components to test
import NewRequestPage from '@/app/requests/new/page';
import ContactExchange from '@/components/ContactExchange';

// Mock dependencies
vi.mock('@/lib/auth/session-sync', () => ({
  ensureAuthSync: vi.fn(),
  requireAuthentication: vi.fn(),
  handleAuthError: vi.fn(),
  getAuthenticatedUser: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('WCAG 2.1 AA Compliance', () => {
  let mockSupabase: any;
  let mockAuthSync: any;

  beforeEach(async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const { ensureAuthSync, requireAuthentication, getAuthenticatedUser } = await import('@/lib/auth/session-sync');

    mockSupabase = {
      from: vi.fn(() => ({
        insert: vi.fn(),
        select: vi.fn(),
        eq: vi.fn(),
        single: vi.fn(),
      })),
    };

    mockAuthSync = ensureAuthSync as any;
    
    (createClient as any).mockReturnValue(mockSupabase);
    mockAuthSync.mockResolvedValue({
      success: true,
      user: { id: 'test-user', email: 'test@example.com' },
      session: { access_token: 'test-token' },
    });

    (requireAuthentication as any).mockResolvedValue({
      id: 'test-user',
      email: 'test@example.com',
    });

    (getAuthenticatedUser as any).mockResolvedValue({
      id: 'helper-user',
      email: 'helper@example.com',
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Semantic HTML Structure', () => {
    it('should use proper heading hierarchy in help request form', async () => {
      render(<NewRequestPage />);

      // Wait for auth check to complete
      await screen.findByText('Create Help Request');

      const headings = screen.getAllByRole('heading');
      const headingLevels = headings.map(heading => {
        const tagName = heading.tagName.toLowerCase();
        return parseInt(tagName.replace('h', ''));
      });

      // Should have proper heading hierarchy (1, 2, 3, etc.)
      expect(headingLevels[0]).toBe(1); // Main page heading
      if (headingLevels.length > 1) {
        for (let i = 1; i < headingLevels.length; i++) {
          expect(headingLevels[i]).toBeGreaterThanOrEqual(headingLevels[i - 1]);
          expect(headingLevels[i] - headingLevels[i - 1]).toBeLessThanOrEqual(1);
        }
      }
    });

    it('should have proper landmark roles', async () => {
      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      // Should have main landmark
      expect(screen.getByRole('main')).toBeInTheDocument();
      
      // Forms should be properly marked
      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    it('should use semantic form elements', async () => {
      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      // All form controls should be properly labeled
      const textInputs = screen.getAllByRole('textbox');
      const selectInputs = screen.getAllByRole('combobox');
      const radioInputs = screen.getAllByRole('radio');
      const buttons = screen.getAllByRole('button');

      textInputs.forEach(input => {
        expect(input).toHaveAccessibleName();
      });

      selectInputs.forEach(select => {
        expect(select).toHaveAccessibleName();
      });

      radioInputs.forEach(radio => {
        expect(radio).toHaveAccessibleName();
      });

      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('should use proper list structures', async () => {
      const mockHelpRequest = {
        id: 'test-request',
        title: 'Test Request',
        user_id: 'other-user',
        profiles: { name: 'Test User' },
      };

      render(<ContactExchange helpRequest={mockHelpRequest} />);

      // Safety warnings should be in a list if there are multiple items
      const safetySection = screen.getByText(/safety/i).closest('section, div');
      if (safetySection) {
        const lists = safetySection.querySelectorAll('ul, ol');
        lists.forEach(list => {
          expect(list.querySelectorAll('li')).toHaveLength.greaterThan(0);
        });
      }
    });
  });

  describe('Color Contrast Compliance', () => {
    it('should meet WCAG AA color contrast requirements for text', async () => {
      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      const results = await axe(document.body, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('should meet contrast requirements for interactive elements', async () => {
      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      const buttons = screen.getAllByRole('button');
      const links = screen.getAllByRole('link');
      const inputs = screen.getAllByRole('textbox');

      // Test should pass axe contrast checks for all interactive elements
      for (const element of [...buttons, ...links, ...inputs]) {
        const results = await axe(element, {
          rules: {
            'color-contrast': { enabled: true },
          },
        });
        expect(results).toHaveNoViolations();
      }
    });

    it('should not convey information through color alone', async () => {
      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      // Error messages should have text, not just color
      const errorElements = document.querySelectorAll('.text-red-600, .text-red-500, .bg-red-50');
      errorElements.forEach(element => {
        expect(element.textContent?.trim()).toBeTruthy();
      });

      // Required fields should be marked with text/symbols, not just color
      const requiredFields = screen.getAllByText('*');
      expect(requiredFields.length).toBeGreaterThan(0);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support full keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<NewRequestPage />);
      
      await screen.findByText('Create Help Request');

      // All interactive elements should be keyboard accessible
      const interactiveElements = [
        ...screen.getAllByRole('textbox'),
        ...screen.getAllByRole('combobox'),
        ...screen.getAllByRole('radio'),
        ...screen.getAllByRole('button'),
        ...screen.getAllByRole('link'),
      ];

      for (const element of interactiveElements) {
        element.focus();
        expect(document.activeElement).toBe(element);
        
        // Should be reachable by tab
        await user.tab();
      }
    });

    it('should have visible focus indicators', async () => {
      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      const focusableElements = [
        ...screen.getAllByRole('textbox'),
        ...screen.getAllByRole('combobox'),
        ...screen.getAllByRole('button'),
      ];

      focusableElements.forEach(element => {
        element.focus();
        const computedStyle = getComputedStyle(element);
        
        // Should have focus styles (outline, box-shadow, or border)
        const hasFocusStyle = 
          computedStyle.outline !== 'none' ||
          computedStyle.boxShadow !== 'none' ||
          computedStyle.borderColor !== 'transparent';
          
        expect(hasFocusStyle).toBe(true);
      });
    });

    it('should have logical tab order', async () => {
      const user = userEvent.setup();
      render(<NewRequestPage />);
      
      await screen.findByText('Create Help Request');

      const titleInput = screen.getByLabelText(/request title/i);
      const categorySelect = screen.getByLabelText(/category/i);
      const descriptionTextarea = screen.getByLabelText(/description/i);

      // Start with title input
      titleInput.focus();
      expect(document.activeElement).toBe(titleInput);

      // Tab should move to category
      await user.tab();
      expect(document.activeElement).toBe(categorySelect);

      // Tab should move to description
      await user.tab();
      expect(document.activeElement).toBe(descriptionTextarea);
    });

    it('should support keyboard shortcuts where appropriate', async () => {
      const user = userEvent.setup();
      render(<NewRequestPage />);
      
      await screen.findByText('Create Help Request');

      // Escape should be handled appropriately in modal dialogs
      // Enter should submit forms when focus is on submit button
      const submitButton = screen.getByRole('button', { name: /create request/i });
      submitButton.focus();
      
      await user.keyboard('{Enter}');
      
      // Form submission should be triggered (mocked behavior)
      expect(mockSupabase.from).toHaveBeenCalled();
    });

    it('should manage focus for dynamic content', async () => {
      const user = userEvent.setup();
      
      const mockHelpRequest = {
        id: 'test-request',
        title: 'Test Request',
        user_id: 'other-user',
        profiles: { name: 'Test User' },
      };

      render(<ContactExchange helpRequest={mockHelpRequest} />);

      const consentCheckbox = screen.getByRole('checkbox');
      const shareButton = screen.getByRole('button', { name: /share/i });

      // Initially button should be disabled
      expect(shareButton).toBeDisabled();

      // After checking consent, button should be enabled and focusable
      await user.click(consentCheckbox);
      expect(shareButton).not.toBeDisabled();
      
      shareButton.focus();
      expect(document.activeElement).toBe(shareButton);
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      const results = await axe(document.body, {
        rules: {
          'aria-label': { enabled: true },
          'aria-labelledby': { enabled: true },
          'button-name': { enabled: true },
          'input-label': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('should use ARIA descriptions for complex controls', async () => {
      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      // Urgency radio buttons should have descriptions
      const urgencyRadios = screen.getAllByRole('radio');
      urgencyRadios.forEach(radio => {
        const hasDescription = radio.hasAttribute('aria-describedby') || 
                              radio.nextElementSibling?.textContent;
        expect(hasDescription).toBeTruthy();
      });
    });

    it('should announce form validation errors', async () => {
      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      // Error messages should be associated with form fields
      const results = await axe(document.body, {
        rules: {
          'aria-describedby': { enabled: true },
          'form-field-multiple-labels': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('should have proper live regions for dynamic updates', async () => {
      const mockHelpRequest = {
        id: 'test-request',
        title: 'Test Request',
        user_id: 'other-user',
        profiles: { name: 'Test User' },
      };

      render(<ContactExchange helpRequest={mockHelpRequest} />);

      // Status updates should be in live regions
      const liveRegions = document.querySelectorAll('[aria-live], [role="status"], [role="alert"]');
      expect(liveRegions.length).toBeGreaterThan(0);
    });

    it('should provide context for form groups', async () => {
      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      // Urgency radio group should be properly grouped
      const urgencyFieldset = screen.getByText(/urgency level/i).closest('fieldset, div[role="group"]');
      expect(urgencyFieldset).toBeInTheDocument();

      if (urgencyFieldset?.hasAttribute('role')) {
        expect(urgencyFieldset.getAttribute('role')).toBe('group');
      }
    });
  });

  describe('Touch Target Accessibility', () => {
    it('should have minimum 44px touch targets', async () => {
      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      const interactiveElements = [
        ...screen.getAllByRole('button'),
        ...screen.getAllByRole('radio'),
        ...screen.getAllByRole('checkbox'),
      ];

      interactiveElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const computedStyle = getComputedStyle(element);
        
        // Account for padding in touch target calculation
        const totalWidth = rect.width + 
          parseFloat(computedStyle.paddingLeft) + 
          parseFloat(computedStyle.paddingRight);
        const totalHeight = rect.height + 
          parseFloat(computedStyle.paddingTop) + 
          parseFloat(computedStyle.paddingBottom);

        expect(totalWidth).toBeGreaterThanOrEqual(44);
        expect(totalHeight).toBeGreaterThanOrEqual(44);
      });
    });

    it('should have adequate spacing between touch targets', async () => {
      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      const buttons = screen.getAllByRole('button');
      
      if (buttons.length > 1) {
        for (let i = 1; i < buttons.length; i++) {
          const rect1 = buttons[i - 1].getBoundingClientRect();
          const rect2 = buttons[i].getBoundingClientRect();
          
          // Calculate minimum distance between elements
          const horizontalGap = Math.max(0, 
            Math.min(rect2.left - rect1.right, rect1.left - rect2.right)
          );
          const verticalGap = Math.max(0,
            Math.min(rect2.top - rect1.bottom, rect1.top - rect2.bottom)
          );
          
          // Should have at least 8px spacing or be in different rows/columns
          const hasAdequateSpacing = horizontalGap >= 8 || verticalGap >= 8;
          expect(hasAdequateSpacing).toBe(true);
        }
      }
    });
  });

  describe('Responsive Design Accessibility', () => {
    it('should maintain accessibility at mobile viewport', async () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      const results = await axe(document.body);
      expect(results).toHaveNoViolations();
    });

    it('should maintain touch targets at mobile sizes', async () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const rect = button.getBoundingClientRect();
        expect(rect.width).toBeGreaterThanOrEqual(44);
        expect(rect.height).toBeGreaterThanOrEqual(44);
      });
    });

    it('should not require horizontal scrolling at mobile sizes', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      // Page content should fit within viewport
      const body = document.body;
      const bodyRect = body.getBoundingClientRect();
      expect(bodyRect.width).toBeLessThanOrEqual(320);
    });
  });

  describe('Loading States and Error Handling Accessibility', () => {
    it('should announce loading states to screen readers', async () => {
      // Mock loading state
      mockAuthSync.mockImplementation(() => new Promise(() => {}));

      render(<NewRequestPage />);

      const loadingIndicator = screen.getByText(/checking authentication/i);
      expect(loadingIndicator).toBeInTheDocument();

      // Should be in a live region or have aria-label
      const hasAriaLive = loadingIndicator.closest('[aria-live]') !== null;
      const hasAriaLabel = loadingIndicator.hasAttribute('aria-label');
      const hasRole = loadingIndicator.hasAttribute('role');

      expect(hasAriaLive || hasAriaLabel || hasRole).toBe(true);
    });

    it('should properly announce errors to screen readers', async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          error: { message: 'Test error message' },
        }),
      });

      const user = userEvent.setup();
      render(<NewRequestPage />);
      
      await screen.findByText('Create Help Request');

      // Fill and submit form to trigger error
      await user.type(screen.getByLabelText(/request title/i), 'Test');
      await user.selectOptions(screen.getByLabelText(/category/i), 'other');
      await user.click(screen.getByRole('button', { name: /create request/i }));

      const errorMessage = await screen.findByText('Test error message');
      
      // Error should be in alert region or have appropriate role
      const isInAlertRegion = errorMessage.closest('[role="alert"]') !== null;
      const hasAriaLive = errorMessage.closest('[aria-live="polite"], [aria-live="assertive"]') !== null;
      
      expect(isInAlertRegion || hasAriaLive).toBe(true);
    });
  });

  describe('Overall WCAG Compliance', () => {
    it('should pass comprehensive axe accessibility audit for help request form', async () => {
      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      const results = await axe(document.body, {
        rules: {
          // Enable all WCAG 2.1 AA rules
          'wcag21aa': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('should pass comprehensive axe audit for contact exchange component', async () => {
      const mockHelpRequest = {
        id: 'test-request',
        title: 'Test Request',
        user_id: 'other-user',
        profiles: { name: 'Test User', email: 'test@example.com' },
      };

      render(<ContactExchange helpRequest={mockHelpRequest} />);

      const results = await axe(document.body, {
        rules: {
          'wcag21aa': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('should meet performance criteria for accessibility tools', async () => {
      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      // Page should render quickly for users with disabilities who may be using assistive technology
      const startTime = performance.now();
      
      // Simulate typical screen reader interaction
      const headings = screen.getAllByRole('heading');
      const inputs = screen.getAllByRole('textbox');
      const buttons = screen.getAllByRole('button');
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render accessibility tree quickly (under 100ms for this simple test)
      expect(renderTime).toBeLessThan(100);
      expect(headings.length + inputs.length + buttons.length).toBeGreaterThan(0);
    });
  });
});