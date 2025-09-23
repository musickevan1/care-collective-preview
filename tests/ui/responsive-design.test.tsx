/**
 * @fileoverview Responsive Design Testing Suite
 * 
 * Tests responsive behavior across different screen sizes as outlined in
 * Phase 3 of the TESTING_PLAN.md. Ensures the Care Collective platform
 * works properly on mobile, tablet, and desktop viewports.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Components to test
import NewRequestPage from '@/app/requests/new/page';
import { ContactExchange } from '@/components/ContactExchange';

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

describe('Responsive Design', () => {
  let mockSupabase: any;
  let originalInnerWidth: number;
  let originalInnerHeight: number;

  beforeEach(async () => {
    // Store original window dimensions
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;

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

    (createClient as any).mockReturnValue(mockSupabase);
    
    (ensureAuthSync as any).mockResolvedValue({
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
    // Restore original window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });

    cleanup();
    vi.clearAllMocks();
  });

  /**
   * Helper function to simulate different viewport sizes
   */
  const setViewport = (width: number, height: number = 800) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });

    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
  };

  describe('Mobile Testing (320px - 768px)', () => {
    beforeEach(() => {
      setViewport(375); // iPhone viewport size
    });

    it('should render help request form properly on mobile', async () => {
      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      // All form elements should be visible and accessible
      expect(screen.getByLabelText(/request title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create request/i })).toBeInTheDocument();
    });

    it('should have proper touch targets on mobile', async () => {
      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      const buttons = screen.getAllByRole('button');
      const radioButtons = screen.getAllByRole('radio');
      const inputs = screen.getAllByRole('textbox');

      [...buttons, ...radioButtons, ...inputs].forEach(element => {
        const rect = element.getBoundingClientRect();
        const computedStyle = getComputedStyle(element);
        
        // Calculate total touch target size including padding
        const totalWidth = rect.width + 
          parseFloat(computedStyle.paddingLeft) + 
          parseFloat(computedStyle.paddingRight);
        const totalHeight = rect.height + 
          parseFloat(computedStyle.paddingTop) + 
          parseFloat(computedStyle.paddingBottom);

        // WCAG guidelines: minimum 44px for touch targets
        expect(totalWidth).toBeGreaterThanOrEqual(44);
        expect(totalHeight).toBeGreaterThanOrEqual(44);
      });
    });

    it('should stack form elements vertically on mobile', async () => {
      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      const formContainer = screen.getByRole('form');
      const inputs = screen.getAllByRole('textbox');

      if (inputs.length > 1) {
        for (let i = 1; i < inputs.length; i++) {
          const rect1 = inputs[i - 1].getBoundingClientRect();
          const rect2 = inputs[i].getBoundingClientRect();
          
          // On mobile, elements should generally be stacked vertically
          // (next element's top should be below previous element's bottom)
          expect(rect2.top).toBeGreaterThan(rect1.bottom - 10); // 10px tolerance
        }
      }
    });

    it('should have readable text sizes on mobile', async () => {
      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      const textElements = [
        screen.getByText('Create Help Request'),
        screen.getByText('Request Details'),
        ...screen.getAllByText(/request title/i),
        ...screen.getAllByText(/category/i),
      ];

      textElements.forEach(element => {
        const computedStyle = getComputedStyle(element);
        const fontSize = parseFloat(computedStyle.fontSize);
        
        // Text should be at least 16px on mobile for readability
        expect(fontSize).toBeGreaterThanOrEqual(16);
      });
    });

    it('should handle mobile navigation properly', async () => {
      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeInTheDocument();

      // Back button should be easily tappable on mobile
      const rect = backButton.getBoundingClientRect();
      expect(rect.width).toBeGreaterThanOrEqual(44);
      expect(rect.height).toBeGreaterThanOrEqual(44);
    });

    it('should show mobile-optimized error messages', async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          error: { message: 'This is a test error message that might be quite long' },
        }),
      });

      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      const user = userEvent.setup();
      await user.type(screen.getByLabelText(/request title/i), 'Test');
      await user.selectOptions(screen.getByLabelText(/category/i), 'other');
      await user.click(screen.getByRole('button', { name: /create request/i }));

      const errorMessage = await screen.findByText(/this is a test error message/i);
      expect(errorMessage).toBeInTheDocument();

      // Error message should be visible and not overflow
      const rect = errorMessage.getBoundingClientRect();
      expect(rect.width).toBeLessThanOrEqual(375); // Should fit in viewport
    });

    it('should handle contact exchange component on mobile', async () => {
      const mockHelpRequest = {
        id: 'test-request',
        title: 'Test Request',
        category: 'groceries',
        urgency: 'normal',
        status: 'open',
        user_id: 'other-user',
        created_at: '2025-01-20T10:00:00Z',
        profiles: { 
          id: 'other-user',
          name: 'Test User', 
          email: 'test@example.com' 
        },
      };

      render(<ContactExchange helpRequest={mockHelpRequest} />);

      const consentCheckbox = screen.getByRole('checkbox');
      const shareButton = screen.getByRole('button', { name: /share/i });
      
      // Elements should be properly sized for mobile
      const checkboxRect = consentCheckbox.getBoundingClientRect();
      const buttonRect = shareButton.getBoundingClientRect();
      
      expect(checkboxRect.width).toBeGreaterThanOrEqual(20);
      expect(checkboxRect.height).toBeGreaterThanOrEqual(20);
      expect(buttonRect.width).toBeGreaterThanOrEqual(44);
      expect(buttonRect.height).toBeGreaterThanOrEqual(44);
    });
  });

  describe('Tablet Testing (768px - 1024px)', () => {
    beforeEach(() => {
      setViewport(768); // iPad viewport size
    });

    it('should adapt layout for tablet viewport', async () => {
      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      // Form should be visible and properly laid out
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();

      // At tablet size, form might have more horizontal space usage
      const formRect = form.getBoundingClientRect();
      expect(formRect.width).toBeGreaterThan(320); // More than mobile width
      expect(formRect.width).toBeLessThanOrEqual(768); // But within tablet width
    });

    it('should maintain proper spacing at tablet sizes', async () => {
      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      const buttons = screen.getAllByRole('button');
      
      if (buttons.length > 1) {
        const cancelButton = buttons.find(btn => btn.textContent?.includes('Cancel'));
        const submitButton = buttons.find(btn => btn.textContent?.includes('Create'));
        
        if (cancelButton && submitButton) {
          const cancelRect = cancelButton.getBoundingClientRect();
          const submitRect = submitButton.getBoundingClientRect();
          
          // Buttons should have adequate spacing on tablet
          const spacing = Math.abs(submitRect.left - cancelRect.right);
          expect(spacing).toBeGreaterThanOrEqual(8); // Minimum 8px spacing
        }
      }
    });

    it('should handle form layout transitions properly', async () => {
      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      // Form elements should be properly spaced for tablet
      const titleInput = screen.getByLabelText(/request title/i);
      const categorySelect = screen.getByLabelText(/category/i);
      
      const titleRect = titleInput.getBoundingClientRect();
      const categoryRect = categorySelect.getBoundingClientRect();
      
      // Elements should not be cramped together
      const verticalSpacing = categoryRect.top - titleRect.bottom;
      expect(verticalSpacing).toBeGreaterThanOrEqual(16); // Adequate spacing
    });

    it('should show appropriate text sizes for tablet', async () => {
      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      const heading = screen.getByRole('heading', { name: /create help request/i });
      const computedStyle = getComputedStyle(heading);
      const fontSize = parseFloat(computedStyle.fontSize);
      
      // Heading should be appropriately sized for tablet (larger than mobile)
      expect(fontSize).toBeGreaterThanOrEqual(20);
    });
  });

  describe('Desktop Testing (1024px+)', () => {
    beforeEach(() => {
      setViewport(1200); // Desktop viewport size
    });

    it('should show full desktop layout', async () => {
      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      // Desktop should have more generous spacing and layout
      const main = screen.getByRole('main');
      const mainRect = main.getBoundingClientRect();
      
      expect(mainRect.width).toBeGreaterThan(768); // More than tablet width
    });

    it('should handle hover states on desktop', async () => {
      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      const buttons = screen.getAllByRole('button');
      
      buttons.forEach(button => {
        // Buttons should be properly styled for hover (this is visual, but we can check structure)
        expect(button.className).toMatch(/hover:|focus:/); // Should have hover/focus classes
      });
    });

    it('should support keyboard navigation effectively on desktop', async () => {
      const user = userEvent.setup();
      render(<NewRequestPage />);
      
      await screen.findByText('Create Help Request');

      const titleInput = screen.getByLabelText(/request title/i);
      const categorySelect = screen.getByLabelText(/category/i);
      const descriptionTextarea = screen.getByLabelText(/description/i);

      // Keyboard navigation should work smoothly on desktop
      titleInput.focus();
      expect(document.activeElement).toBe(titleInput);

      await user.tab();
      expect(document.activeElement).toBe(categorySelect);

      await user.tab();
      expect(document.activeElement).toBe(descriptionTextarea);
    });

    it('should display content with appropriate max-width on desktop', async () => {
      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      const contentContainer = screen.getByRole('main').firstElementChild;
      if (contentContainer) {
        const containerRect = contentContainer.getBoundingClientRect();
        
        // Content should not be too wide on desktop (good UX practice)
        expect(containerRect.width).toBeLessThan(1000); // Reasonable max-width
      }
    });

    it('should show enhanced desktop features', async () => {
      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      // Desktop might show additional helper text or features
      const helperTexts = document.querySelectorAll('.text-xs, .text-sm');
      expect(helperTexts.length).toBeGreaterThan(0);

      // Check that helper texts are visible (not hidden on desktop)
      helperTexts.forEach(text => {
        const computedStyle = getComputedStyle(text as Element);
        expect(computedStyle.display).not.toBe('none');
      });
    });
  });

  describe('Cross-Viewport Consistency', () => {
    it('should maintain functionality across all viewport sizes', async () => {
      const viewports = [320, 375, 768, 1024, 1200];
      
      for (const width of viewports) {
        setViewport(width);
        
        render(<NewRequestPage />);
        await screen.findByText('Create Help Request');

        // Core functionality should work at all sizes
        expect(screen.getByLabelText(/request title/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create request/i })).toBeInTheDocument();

        cleanup();
      }
    });

    it('should not introduce horizontal scroll at any viewport', async () => {
      const viewports = [320, 375, 768, 1024];
      
      for (const width of viewports) {
        setViewport(width);
        
        render(<NewRequestPage />);
        await screen.findByText('Create Help Request');

        // Check that body width doesn't exceed viewport
        const body = document.body;
        const bodyRect = body.getBoundingClientRect();
        
        expect(bodyRect.width).toBeLessThanOrEqual(width + 20); // 20px tolerance for scrollbar
        
        cleanup();
      }
    });

    it('should maintain accessibility across viewports', async () => {
      const viewports = [320, 768, 1200];
      
      for (const width of viewports) {
        setViewport(width);
        
        render(<NewRequestPage />);
        await screen.findByText('Create Help Request');

        // Touch targets should meet requirements at all sizes
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          const rect = button.getBoundingClientRect();
          const computedStyle = getComputedStyle(button);
          
          const totalWidth = rect.width + 
            parseFloat(computedStyle.paddingLeft) + 
            parseFloat(computedStyle.paddingRight);
          const totalHeight = rect.height + 
            parseFloat(computedStyle.paddingTop) + 
            parseFloat(computedStyle.paddingBottom);

          expect(totalWidth).toBeGreaterThanOrEqual(44);
          expect(totalHeight).toBeGreaterThanOrEqual(44);
        });

        cleanup();
      }
    });
  });

  describe('Orientation Changes', () => {
    it('should handle portrait to landscape transition on mobile', async () => {
      // Portrait mobile
      setViewport(375, 667);
      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      const portraitForm = screen.getByRole('form');
      const portraitRect = portraitForm.getBoundingClientRect();

      cleanup();

      // Landscape mobile
      setViewport(667, 375);
      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      const landscapeForm = screen.getByRole('form');
      const landscapeRect = landscapeForm.getBoundingClientRect();

      // Form should adapt to orientation change
      expect(landscapeRect.width).toBeGreaterThan(portraitRect.width);
      expect(landscapeRect.height).toBeLessThan(portraitRect.height);
    });

    it('should maintain usability in landscape mode', async () => {
      setViewport(667, 375); // Landscape mobile
      
      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      // All essential elements should still be accessible
      expect(screen.getByLabelText(/request title/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create request/i })).toBeInTheDocument();

      // Form should not be cut off
      const form = screen.getByRole('form');
      const formRect = form.getBoundingClientRect();
      
      expect(formRect.top).toBeGreaterThanOrEqual(0);
      expect(formRect.bottom).toBeLessThanOrEqual(375); // Should fit in viewport height
    });
  });

  describe('Content Reflow', () => {
    it('should reflow text content properly at narrow widths', async () => {
      setViewport(280); // Very narrow viewport
      
      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      // Long text should wrap properly
      const descriptionHelper = screen.getByText(/include any specific requirements/i);
      expect(descriptionHelper).toBeInTheDocument();

      const rect = descriptionHelper.getBoundingClientRect();
      expect(rect.width).toBeLessThanOrEqual(280);
    });

    it('should handle form label reflow', async () => {
      setViewport(320);
      
      render(<NewRequestPage />);
      await screen.findByText('Create Help Request');

      const labels = screen.getAllByText(/request title|category|description|urgency level/i);
      
      labels.forEach(label => {
        const rect = label.getBoundingClientRect();
        expect(rect.width).toBeLessThanOrEqual(320);
        
        // Text should not be cut off
        const computedStyle = getComputedStyle(label);
        expect(computedStyle.overflow).not.toBe('hidden');
      });
    });

    it('should maintain button readability at all sizes', async () => {
      const viewports = [320, 375, 768, 1024];
      
      for (const width of viewports) {
        setViewport(width);
        
        render(<NewRequestPage />);
        await screen.findByText('Create Help Request');

        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          const rect = button.getBoundingClientRect();
          expect(rect.width).toBeGreaterThan(0);
          expect(rect.height).toBeGreaterThan(0);
          
          // Button text should be readable
          expect(button.textContent?.trim()).toBeTruthy();
        });

        cleanup();
      }
    });
  });
});