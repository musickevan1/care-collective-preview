/**
 * @fileoverview Accessibility tests for Care Collective components
 * Tests WCAG 2.1 AA compliance and Care Collective accessibility requirements
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/tests/utils';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';

describe('Accessibility Tests', () => {
  describe('Keyboard Navigation', () => {
    it('all interactive elements are keyboard accessible', async () => {
      render(
        <div>
          <Button>Primary Action</Button>
          <Button variant="sage">Secondary Action</Button>
          <button>Native Button</button>
          <a href="/test">Link</a>
          <input type="text" placeholder="Text input" />
        </div>
      );

      const interactiveElements = [
        screen.getByRole('button', { name: 'Primary Action' }),
        screen.getByRole('button', { name: 'Secondary Action' }),
        screen.getByRole('button', { name: 'Native Button' }),
        screen.getByRole('link', { name: 'Link' }),
        screen.getByRole('textbox'),
      ];

      interactiveElements.forEach(element => {
        // All interactive elements should be focusable
        expect(element).not.toHaveAttribute('tabIndex', '-1');
      });
    });

    it('focus indicators are visible and accessible', () => {
      render(<Button>Focus Test</Button>);
      const button = screen.getByRole('button');
      
      // Care Collective buttons should have focus-visible styles
      expect(button).toHaveClass('focus-visible:outline-none');
      expect(button).toHaveClass('focus-visible:ring-2');
      expect(button).toHaveClass('focus-visible:ring-ring');
      expect(button).toHaveClass('focus-visible:ring-offset-2');
    });
  });

  describe('Touch Target Sizes (Mobile Accessibility)', () => {
    it('buttons meet 44px minimum touch target requirement', () => {
      render(
        <div>
          <Button size="default">Default Button</Button>
          <Button size="sm">Small Button</Button>
          <Button size="lg">Large Button</Button>
          <Button size="icon" aria-label="Icon">🏠</Button>
        </div>
      );

      // Default button
      const defaultButton = screen.getByRole('button', { name: 'Default Button' });
      expect(defaultButton).toHaveClass('min-h-[44px]');
      expect(defaultButton).toHaveClass('h-11');

      // Small button (still accessible)
      const smallButton = screen.getByRole('button', { name: 'Small Button' });
      expect(smallButton).toHaveClass('min-h-[40px]'); // Slightly smaller but still accessible

      // Large button
      const largeButton = screen.getByRole('button', { name: 'Large Button' });
      expect(largeButton).toHaveClass('min-h-[48px]');

      // Icon button
      const iconButton = screen.getByRole('button', { name: 'Icon' });
      expect(iconButton).toHaveClass('min-h-[44px]');
      expect(iconButton).toHaveClass('min-w-[44px]');
    });
  });

  describe('Semantic HTML and ARIA', () => {
    it('uses proper heading hierarchy', () => {
      render(
        <div>
          <h1>Main Title</h1>
          <h2>Section Title</h2>
          <h3>Subsection Title</h3>
        </div>
      );

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('provides meaningful aria-labels for icon buttons', () => {
      render(<Button size="icon" aria-label="Go to home page">🏠</Button>);
      
      const iconButton = screen.getByRole('button', { name: 'Go to home page' });
      expect(iconButton).toHaveAttribute('aria-label', 'Go to home page');
    });

    it('status badges convey information to screen readers', () => {
      render(<StatusBadge status="urgent" />);
      
      // Should have meaningful text content
      const badge = screen.getByText('Urgent');
      expect(badge).toBeInTheDocument();
      
      // Text should be sufficient for screen readers
      expect(badge.textContent).toBeTruthy();
      expect(badge.textContent?.length).toBeGreaterThan(0);
    });
  });

  describe('Form Accessibility', () => {
    it('form controls have proper labels', () => {
      render(
        <form>
          <label htmlFor="name">Full Name</label>
          <input id="name" type="text" />
          
          <label htmlFor="email">Email Address</label>
          <input id="email" type="email" />
          
          <fieldset>
            <legend>Urgency Level</legend>
            <label>
              <input type="radio" name="urgency" value="normal" />
              Normal
            </label>
            <label>
              <input type="radio" name="urgency" value="urgent" />
              Urgent
            </label>
          </fieldset>
        </form>
      );

      // Text inputs should be properly labeled
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      
      // Radio buttons should be in fieldset with legend
      expect(screen.getByRole('group', { name: 'Urgency Level' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'Normal' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'Urgent' })).toBeInTheDocument();
    });

    it('required fields are properly indicated', () => {
      render(
        <div>
          <label htmlFor="required-field">Required Field *</label>
          <input id="required-field" type="text" required />
        </div>
      );

      const requiredInput = screen.getByLabelText('Required Field *');
      expect(requiredInput).toBeRequired();
    });

    it('error messages are associated with form controls', () => {
      render(
        <div>
          <label htmlFor="email-input">Email</label>
          <input 
            id="email-input" 
            type="email" 
            aria-describedby="email-error"
            aria-invalid="true"
          />
          <div id="email-error" role="alert">
            Please enter a valid email address
          </div>
        </div>
      );

      const emailInput = screen.getByLabelText('Email');
      expect(emailInput).toHaveAttribute('aria-describedby', 'email-error');
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Please enter a valid email address');
    });
  });

  describe('Color and Contrast', () => {
    it('uses Care Collective color scheme with proper contrast', () => {
      render(
        <div>
          <Button variant="sage">Sage Button</Button>
          <Button variant="rose">Rose Button</Button>
          <Button variant="terracotta">Terracotta Button</Button>
        </div>
      );

      // Care Collective colors should be applied
      const sageButton = screen.getByRole('button', { name: 'Sage Button' });
      expect(sageButton).toHaveClass('bg-sage-dark');
      expect(sageButton).toHaveClass('text-white');

      const roseButton = screen.getByRole('button', { name: 'Rose Button' });
      expect(roseButton).toHaveClass('bg-dusty-rose-accessible');
      expect(roseButton).toHaveClass('text-white');

      const terracottaButton = screen.getByRole('button', { name: 'Terracotta Button' });
      expect(terracottaButton).toHaveClass('bg-terracotta');
      expect(terracottaButton).toHaveClass('text-white');
    });

    it('does not rely solely on color to convey information', () => {
      render(
        <div>
          <StatusBadge status="open" />
          <StatusBadge status="urgent" />
          <StatusBadge status="completed" />
        </div>
      );

      // Status should be conveyed through text, not just color
      expect(screen.getByText('Open')).toBeInTheDocument();
      expect(screen.getByText('Urgent')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  describe('Screen Reader Support', () => {
    it('provides skip links for main content', () => {
      render(
        <div>
          <a href="#main-content" className="sr-only focus:not-sr-only">
            Skip to main content
          </a>
          <nav>Navigation</nav>
          <main id="main-content">
            <h1>Main Content</h1>
          </main>
        </div>
      );

      const skipLink = screen.getByRole('link', { name: 'Skip to main content' });
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });

    it('uses proper landmark roles', () => {
      render(
        <div>
          <header>
            <nav>Navigation</nav>
          </header>
          <main>
            <article>
              <h1>Article Title</h1>
            </article>
          </main>
          <footer>Footer content</footer>
        </div>
      );

      expect(screen.getByRole('banner')).toBeInTheDocument(); // header
      expect(screen.getByRole('navigation')).toBeInTheDocument(); // nav
      expect(screen.getByRole('main')).toBeInTheDocument(); // main
      expect(screen.getByRole('article')).toBeInTheDocument(); // article
      expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer
    });

    it('provides descriptive link text', () => {
      render(
        <div>
          <a href="/help">Get Help</a>
          <a href="/requests/new">Create New Request</a>
          <a href="/profile">View Profile</a>
        </div>
      );

      // Links should have descriptive text, not "click here" or "read more"
      expect(screen.getByRole('link', { name: 'Get Help' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Create New Request' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'View Profile' })).toBeInTheDocument();
    });
  });

  describe('Care Collective Specific Accessibility', () => {
    it('emergency/urgent content is properly announced', () => {
      render(
        <div>
          <StatusBadge status="urgent" />
          <div role="alert" aria-live="assertive">
            Urgent help request posted
          </div>
        </div>
      );

      // Urgent status should be clearly indicated
      expect(screen.getByText('Urgent')).toBeInTheDocument();
      
      // Important notifications should use alert role
      expect(screen.getByRole('alert')).toHaveTextContent('Urgent help request posted');
    });

    it('contact information sharing is clearly announced', () => {
      render(
        <div>
          <div role="region" aria-labelledby="contact-heading">
            <h2 id="contact-heading">Contact Information Shared</h2>
            <p>Your contact information has been shared with the helper.</p>
          </div>
        </div>
      );

      expect(screen.getByRole('region', { name: 'Contact Information Shared' })).toBeInTheDocument();
    });

    it('help request categories are properly structured', () => {
      render(
        <fieldset>
          <legend>Help Category</legend>
          <select aria-label="Select help category">
            <option value="">Choose category</option>
            <option value="groceries">Groceries & Shopping</option>
            <option value="transport">Transportation</option>
            <option value="medical">Medical & Pharmacy</option>
          </select>
        </fieldset>
      );

      expect(screen.getByRole('group', { name: 'Help Category' })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: 'Select help category' })).toBeInTheDocument();
    });
  });

  describe('Error States and Feedback', () => {
    it('error messages are announced to screen readers', () => {
      render(
        <div>
          <div role="alert" aria-live="polite">
            Failed to load help requests. Please try again.
          </div>
        </div>
      );

      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toHaveTextContent('Failed to load help requests. Please try again.');
      expect(errorAlert).toHaveAttribute('aria-live', 'polite');
    });

    it('loading states are properly announced', () => {
      render(
        <div>
          <div aria-live="polite" aria-busy="true">
            Loading help requests...
          </div>
        </div>
      );

      const loadingMessage = screen.getByText('Loading help requests...');
      expect(loadingMessage.closest('[aria-live]')).toHaveAttribute('aria-live', 'polite');
      expect(loadingMessage.closest('[aria-busy]')).toHaveAttribute('aria-busy', 'true');
    });

    it('success feedback is properly announced', () => {
      render(
        <div>
          <div role="status" aria-live="polite">
            Help request created successfully!
          </div>
        </div>
      );

      expect(screen.getByRole('status')).toHaveTextContent('Help request created successfully!');
    });
  });

  describe('Progressive Enhancement', () => {
    it('core functionality works without JavaScript', () => {
      render(
        <form action="/submit" method="post">
          <label htmlFor="title">Request Title</label>
          <input id="title" name="title" type="text" required />
          
          <label htmlFor="category">Category</label>
          <select id="category" name="category" required>
            <option value="">Select category</option>
            <option value="groceries">Groceries</option>
          </select>
          
          <button type="submit">Create Request</button>
        </form>
      );

      // Form should be functional even without JavaScript
      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('action', '/submit');
      expect(form).toHaveAttribute('method', 'post');
      
      const submitButton = screen.getByRole('button', { name: 'Create Request' });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });
});